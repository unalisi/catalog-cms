import { env } from 'cloudflare:workers';
import { products } from '../../../db/schema';
import * as csvAdapter from '../../lib/import/adapters/csv';
import * as wooAdapter from '../../lib/import/adapters/woo';
import * as wxrAdapter from '../../lib/import/adapters/wxr';
import type {
  ConflictPolicy,
  ImportItemAction,
  ImportJobSummary,
  ImportQueueMessage,
  ImportRecord,
  ImportSource,
  MappingProfile,
} from '../../lib/import/types';
import { zodFieldErrors } from '../../lib/validation/admin';
import { importJobCreateSchema, importRecordSchema } from '../../lib/validation/import';
import {
  applyImportRecord,
  applyProductMediaGallery,
  createTaxonomyCache,
  loadProductLookupIndex,
} from '../import/apply-item';
import { getDb, type Db } from '../db';
import * as importRepo from '../repos/import';

const ADAPTERS: Record<
  ImportSource,
  { parseToRecords(input: string, mapping?: MappingProfile): ImportRecord[] }
> = {
  csv: csvAdapter,
  woo: wooAdapter,
  wxr: wxrAdapter,
};

/** Product apply item ids per queue message (media goes to IMPORT_MEDIA_QUEUE). */
const QUEUE_ITEM_BATCH_SIZE = 50;

/** Spill mapped_json to R2 when larger than this (D1 max SQL statement is 100KB). */
const MAPPED_JSON_R2_THRESHOLD_BYTES = 60_000;

/** R2 object key for the uploaded import source payload. */
function sourceObjectKey(jobId: string): string {
  return `imports/${jobId}/source`;
}

function mappedObjectKey(jobId: string, rowIndex: number): string {
  return `imports/${jobId}/mapped/${rowIndex}.json`;
}

type R2MappedPointer = { $r2: string };

function isR2MappedPointer(value: unknown): value is R2MappedPointer {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    typeof (value as R2MappedPointer).$r2 === 'string' &&
    Object.keys(value as object).length === 1
  );
}

function utf8ByteLength(text: string): number {
  return new TextEncoder().encode(text).byteLength;
}

/**
 * If mapped JSON would bloat a D1 INSERT past SQL size limits, store it in R2
 * and keep a tiny pointer in `mapped_json`.
 */
async function maybeSpillMappedJson(
  jobId: string,
  rowIndex: number,
  mappedJson: string | null,
): Promise<string | null> {
  if (!mappedJson) return null;
  if (utf8ByteLength(mappedJson) <= MAPPED_JSON_R2_THRESHOLD_BYTES) return mappedJson;

  const key = mappedObjectKey(jobId, rowIndex);
  await env.MEDIA.put(key, mappedJson, {
    httpMetadata: { contentType: 'application/json; charset=utf-8' },
    customMetadata: { jobId, rowIndex: String(rowIndex) },
  });
  return JSON.stringify({ $r2: key } satisfies R2MappedPointer);
}

async function resolveMappedRecord(mappedJson: string | null): Promise<ImportRecord | null> {
  if (!mappedJson) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(mappedJson);
  } catch {
    return null;
  }

  if (isR2MappedPointer(parsed)) {
    const object = await env.MEDIA.get(parsed.$r2);
    if (!object) return null;
    try {
      return JSON.parse(await object.text()) as ImportRecord;
    } catch {
      return null;
    }
  }

  return parsed as ImportRecord;
}

async function spillLargeMappedPayloads(
  jobId: string,
  items: Parameters<typeof importRepo.insertImportItems>[2],
): Promise<void> {
  for (const item of items) {
    if (!item.mappedJson) continue;
    item.mappedJson = await maybeSpillMappedJson(jobId, item.rowIndex, item.mappedJson);
  }
}

type ExistingIndex = {
  bySku: Map<string, string>;
  bySlug: Map<string, string>;
};

async function loadExistingProductIndex(db: Db): Promise<ExistingIndex> {
  const rows = await db
    .select({ id: products.id, sku: products.sku, slug: products.slug })
    .from(products);
  const bySku = new Map<string, string>();
  const bySlug = new Map<string, string>();
  for (const row of rows) {
    if (row.sku) bySku.set(row.sku, row.id);
    bySlug.set(row.slug, row.id);
  }
  return { bySku, bySlug };
}

function previewActionWithIndex(
  record: ImportRecord,
  conflictPolicy: ConflictPolicy,
  index: ExistingIndex,
): Exclude<ImportItemAction, 'error'> {
  const existingId =
    (record.sku ? index.bySku.get(record.sku) : undefined) ?? index.bySlug.get(record.slug);
  if (!existingId) return 'create';
  return conflictPolicy === 'skip' ? 'skip' : 'update';
}

function leanRawJson(record: ImportRecord): string {
  return JSON.stringify({
    name: record.name,
    sku: record.sku ?? null,
    slug: record.slug,
  });
}

function emptySummary(extra?: Partial<ImportJobSummary>): ImportJobSummary {
  return { total: 0, create: 0, update: 0, skip: 0, error: 0, ...extra };
}

/**
 * Builds dry-run items + summary from parsed records (no product writes).
 * Uses a single product index instead of N+1 SKU/slug lookups.
 */
function buildDryRunItems(
  records: ImportRecord[],
  conflictPolicy: ConflictPolicy,
  index: ExistingIndex,
) {
  const summary: ImportJobSummary = emptySummary({ total: records.length });
  const itemsToInsert: Parameters<typeof importRepo.insertImportItems>[2] = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const validated = importRecordSchema.safeParse(record);

    if (!validated.success) {
      summary.error++;
      itemsToInsert.push({
        rowIndex: i,
        rawJson: leanRawJson(record),
        mappedJson: null,
        action: 'error',
        status: 'error',
        error: validated.error.issues[0]?.message ?? 'Geçersiz kayıt',
      });
      continue;
    }

    const action = previewActionWithIndex(validated.data, conflictPolicy, index);
    summary[action]++;
    itemsToInsert.push({
      rowIndex: i,
      rawJson: leanRawJson(validated.data),
      mappedJson: JSON.stringify(validated.data),
      action,
      status: 'pending',
      error: null,
    });
  }

  return { summary, itemsToInsert };
}

/**
 * Queue consumer: parse R2 source, dry-run against catalog, write import_items in batches.
 */
export async function prepareImportJob(jobId: string): Promise<void> {
  const db = getDb();
  const job = await importRepo.getImportJobById(db, jobId);
  if (!job) return;
  if (job.status !== 'validating' && job.status !== 'pending') return;

  await importRepo.updateImportJobStatus(db, jobId, 'validating');

  try {
    const object = await env.MEDIA.get(sourceObjectKey(jobId));
    if (!object) {
      await importRepo.failImportJob(db, jobId, 'Kaynak dosya R2 üzerinde bulunamadı');
      return;
    }

    const content = await object.text();
    const mapping: MappingProfile | undefined = job.mappingJson
      ? (JSON.parse(job.mappingJson) as MappingProfile)
      : undefined;

    const adapter = ADAPTERS[job.source];
    let records: ImportRecord[];
    try {
      records = adapter.parseToRecords(content, mapping);
    } catch (err) {
      await importRepo.failImportJob(
        db,
        jobId,
        err instanceof Error ? err.message : 'Ayrıştırma hatası',
      );
      return;
    }

    if (records.length === 0) {
      await importRepo.failImportJob(db, jobId, 'Dosyada içe aktarılacak ürün bulunamadı');
      return;
    }

    const index = await loadExistingProductIndex(db);
    const { summary, itemsToInsert } = buildDryRunItems(records, job.conflictPolicy, index);
    await spillLargeMappedPayloads(jobId, itemsToInsert);

    await importRepo.insertImportItems(db, jobId, itemsToInsert);
    await importRepo.updateImportJobSummary(db, jobId, summary);
    await importRepo.updateImportJobStatus(db, jobId, 'ready');

    // Source payload is no longer needed after prepare (mapped items hold apply data).
    try {
      await env.MEDIA.delete(sourceObjectKey(jobId));
    } catch {
      // non-fatal
    }
  } catch (err) {
    await importRepo.failImportJob(
      db,
      jobId,
      err instanceof Error ? err.message : 'Dry-run hazırlığı başarısız',
    );
  }
}

/**
 * Accepts upload content, stores it in R2, creates a validating job, and enqueues prepare.
 * Returns immediately so large Woo JSON files do not blow HTTP/CPU/D1 limits.
 */
export async function createJobFromPayload(payload: {
  source: ImportSource;
  content: string;
  mapping?: MappingProfile;
  conflictPolicy?: ConflictPolicy;
  userId?: string | null;
}) {
  const parsed = importJobCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false as const, fields: zodFieldErrors(parsed.error) };
  }

  const { source, content, mapping, conflictPolicy } = parsed.data;
  if (!content.trim()) {
    return { ok: false as const, fields: { content: 'İçerik gerekli' } };
  }

  const db = getDb();
  const job = await importRepo.createImportJob(db, {
    source,
    conflictPolicy,
    mappingJson: mapping ? JSON.stringify(mapping) : null,
    createdBy: payload.userId ?? null,
  });

  try {
    await env.MEDIA.put(sourceObjectKey(job.id), content, {
      httpMetadata: { contentType: 'text/plain; charset=utf-8' },
      customMetadata: { source, jobId: job.id },
    });
    await importRepo.updateImportJobStatus(db, job.id, 'validating');
    await importRepo.updateImportJobSummary(
      db,
      job.id,
      emptySummary({ message: 'Dosya kuyruğa alındı, ayrıştırılıyor…' }),
    );
    await env.IMPORT_QUEUE.send({ type: 'prepare', jobId: job.id } satisfies ImportQueueMessage);
  } catch (err) {
    await importRepo.failImportJob(
      db,
      job.id,
      err instanceof Error ? err.message : 'İş oluşturulamadı',
    );
    return {
      ok: false as const,
      fields: { content: err instanceof Error ? err.message : 'İş oluşturulamadı' },
    };
  }

  const created = await importRepo.getImportJobById(db, job.id);
  return {
    ok: true as const,
    data: {
      job: created,
      summary: emptySummary({ message: 'Dosya kuyruğa alındı, ayrıştırılıyor…' }),
    },
  };
}

/** Marks a ready job as queued and enqueues its pending items in product-only batches. */
export async function applyJob(jobId: string) {
  const db = getDb();
  const job = await importRepo.getImportJobById(db, jobId);
  if (!job) return { ok: false as const, notFound: true as const };
  if (job.status !== 'ready' && job.status !== 'completed') {
    return {
      ok: false as const,
      fields: { _form: `İş durumu apply için uygun değil: ${job.status}` },
    };
  }

  const items = await importRepo.listImportItemsByJob(db, jobId);
  const pendingItems = items.filter((item) => item.status === 'pending' && item.action !== 'error');

  if (pendingItems.length === 0) {
    await importRepo.updateImportJobStatus(db, jobId, 'completed');
    return { ok: true as const, data: await importRepo.getImportJobById(db, jobId) };
  }

  await importRepo.updateImportJobStatus(db, jobId, 'queued');

  // Reset media counters for this apply run; preserve product dry-run totals after first apply batch.
  const existingSummary: ImportJobSummary = job.summaryJson
    ? (JSON.parse(job.summaryJson) as ImportJobSummary)
    : emptySummary();
  await importRepo.updateImportJobSummary(db, jobId, {
    ...existingSummary,
    mediaTotal: 0,
    mediaDone: 0,
    mediaError: 0,
  });

  const messages: Extract<ImportQueueMessage, { type: 'apply' }>[] = [];
  for (let i = 0; i < pendingItems.length; i += QUEUE_ITEM_BATCH_SIZE) {
    messages.push({
      type: 'apply',
      jobId,
      itemIds: pendingItems.slice(i, i + QUEUE_ITEM_BATCH_SIZE).map((item) => item.id),
    });
  }

  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    await env.IMPORT_QUEUE.sendBatch(chunk.map((body) => ({ body })));
  }

  return { ok: true as const, data: await importRepo.getImportJobById(db, jobId) };
}

export async function getJob(jobId: string) {
  const db = getDb();
  let job = await importRepo.getImportJobById(db, jobId);
  if (!job) return null;

  // Orphan cleanup: pre-fix jobs stuck in pending/validating with no R2 source and no items.
  if (job.status === 'pending' || job.status === 'validating') {
    const progressEarly = await importRepo.getImportJobProgress(db, jobId);
    if (progressEarly.total === 0) {
      const source = await env.MEDIA.head(sourceObjectKey(jobId));
      if (!source) {
        await importRepo.failImportJob(
          db,
          jobId,
          'Yarım kalan eski iş. Lütfen dosyayı yeniden yükleyip dry-run başlatın.',
        );
        job = await importRepo.getImportJobById(db, jobId);
        if (!job) return null;
      }
    }
  }

  const items = await importRepo.listImportItemsByJob(db, jobId, { limit: 100 });
  const summary: ImportJobSummary = job.summaryJson
    ? (JSON.parse(job.summaryJson) as ImportJobSummary)
    : await importRepo.getImportJobSummaryFromItems(db, jobId);
  const progress = await importRepo.getImportJobProgress(db, jobId);

  return { ...job, summary, items, progress };
}

export async function listJobs() {
  return importRepo.listImportJobs(getDb());
}

function isPrepareMessage(
  body: ImportQueueMessage,
): body is { type: 'prepare'; jobId: string } {
  return 'type' in body && body.type === 'prepare';
}

function isMediaMessage(
  body: ImportQueueMessage,
): body is { type: 'media'; jobId: string; itemId: string; productId: string } {
  return 'type' in body && body.type === 'media';
}

function getApplyPayload(
  body: ImportQueueMessage,
): { jobId: string; itemIds: string[] } | null {
  if ('type' in body && (body.type === 'prepare' || body.type === 'media')) return null;
  if ('itemIds' in body && Array.isArray(body.itemIds)) {
    return { jobId: body.jobId, itemIds: body.itemIds };
  }
  return null;
}

async function readJobSummary(db: Db, jobId: string): Promise<ImportJobSummary> {
  const job = await importRepo.getImportJobById(db, jobId);
  if (job?.summaryJson) {
    try {
      return JSON.parse(job.summaryJson) as ImportJobSummary;
    } catch {
      // fall through
    }
  }
  return emptySummary();
}

async function bumpMediaCounters(
  db: Db,
  jobId: string,
  patch: { mediaTotal?: number; mediaDone?: number; mediaError?: number },
): Promise<void> {
  const summary = await readJobSummary(db, jobId);
  await importRepo.updateImportJobSummary(db, jobId, {
    ...summary,
    mediaTotal: (summary.mediaTotal ?? 0) + (patch.mediaTotal ?? 0),
    mediaDone: (summary.mediaDone ?? 0) + (patch.mediaDone ?? 0),
    mediaError: (summary.mediaError ?? 0) + (patch.mediaError ?? 0),
  });
}

async function refreshProductSummaryPreserveMedia(db: Db, jobId: string): Promise<void> {
  const prev = await readJobSummary(db, jobId);
  const summary = await importRepo.getImportJobSummaryFromItems(db, jobId);
  await importRepo.updateImportJobSummary(db, jobId, {
    ...summary,
    mediaTotal: prev.mediaTotal ?? 0,
    mediaDone: prev.mediaDone ?? 0,
    mediaError: prev.mediaError ?? 0,
    message: prev.message,
  });
}

/**
 * Product queue consumer (`catalog-import` / IMPORT_QUEUE).
 * prepare + product apply only — never fetches remote images.
 */
export async function processImportQueue(batch: MessageBatch<ImportQueueMessage>): Promise<void> {
  const db = getDb();
  const affectedJobIds = new Set<string>();

  for (const message of batch.messages) {
    const body = message.body;

    if (isPrepareMessage(body)) {
      try {
        await prepareImportJob(body.jobId);
        message.ack();
      } catch {
        message.retry();
      }
      continue;
    }

    // Stray media messages on the product queue: re-route, do not process here.
    if (isMediaMessage(body)) {
      try {
        await env.IMPORT_MEDIA_QUEUE.send(body);
        message.ack();
      } catch {
        message.retry();
      }
      continue;
    }

    const apply = getApplyPayload(body);
    if (!apply) {
      message.ack();
      continue;
    }

    const { jobId, itemIds } = apply;
    affectedJobIds.add(jobId);

    try {
      const job = await importRepo.getImportJobById(db, jobId);
      if (!job) {
        message.ack();
        continue;
      }
      await importRepo.updateImportJobStatus(db, jobId, 'processing');

      const taxonomyCache = createTaxonomyCache();
      const productIndex = await loadProductLookupIndex(db);
      const mediaMessages: Extract<ImportQueueMessage, { type: 'media' }>[] = [];
      const items = await importRepo.getImportItemsByIds(db, itemIds);

      for (const item of items) {
        if (item.status === 'ok') continue;

        let record: ImportRecord | null = null;
        try {
          record = await resolveMappedRecord(item.mappedJson);
        } catch {
          record = null;
        }

        if (!record) {
          await importRepo.updateImportItem(db, item.id, {
            status: 'error',
            action: 'error',
            error: 'Geçersiz eşlenmiş kayıt',
          });
          continue;
        }

        const result = await applyImportRecord(
          db,
          record,
          job.conflictPolicy,
          taxonomyCache,
          productIndex,
        );
        if (result.action === 'error') {
          await importRepo.updateImportItem(db, item.id, {
            status: 'error',
            action: 'error',
            error: result.error,
          });
        } else if (result.action === 'skip') {
          await importRepo.updateImportItem(db, item.id, { status: 'ok', action: 'skip' });
        } else {
          await importRepo.updateImportItem(db, item.id, { status: 'ok', action: result.action });
          if (result.pendingMedia.length > 0) {
            mediaMessages.push({
              type: 'media',
              jobId,
              itemId: item.id,
              productId: result.productId,
            });
          }
        }
      }

      if (mediaMessages.length > 0) {
        await bumpMediaCounters(db, jobId, { mediaTotal: mediaMessages.length });
        for (let i = 0; i < mediaMessages.length; i += 100) {
          const chunk = mediaMessages.slice(i, i + 100);
          await env.IMPORT_MEDIA_QUEUE.sendBatch(chunk.map((msg) => ({ body: msg })));
        }
      }

      message.ack();
    } catch {
      message.retry();
    }
  }

  for (const jobId of affectedJobIds) {
    await refreshProductSummaryPreserveMedia(db, jobId);
    const allDone = await importRepo.isAllItemsProcessed(db, jobId);
    if (allDone) {
      await importRepo.updateImportJobStatus(db, jobId, 'completed');
    }
  }
}

/**
 * Media queue consumer (`catalog-import-media` / IMPORT_MEDIA_QUEUE).
 * Runs fully in the background; does not block product apply concurrency.
 */
export async function processImportMediaQueue(
  batch: MessageBatch<ImportQueueMessage>,
): Promise<void> {
  const db = getDb();

  for (const message of batch.messages) {
    const body = message.body;
    if (!isMediaMessage(body)) {
      message.ack();
      continue;
    }

    try {
      const item = (await importRepo.getImportItemsByIds(db, [body.itemId]))[0];
      const record = item ? await resolveMappedRecord(item.mappedJson) : null;
      const mediaItems = (record?.media ?? [])
        .filter((m): m is { url: string; alt?: string } => Boolean(m?.url))
        .map((m) => ({ url: m.url, alt: m.alt }));

      if (mediaItems.length === 0) {
        await bumpMediaCounters(db, body.jobId, { mediaDone: 1 });
        message.ack();
        continue;
      }

      const result = await applyProductMediaGallery(
        db,
        body.productId,
        mediaItems,
        record?.name || 'import',
      );
      if (result.ok) {
        await bumpMediaCounters(db, body.jobId, { mediaDone: 1 });
      } else {
        await bumpMediaCounters(db, body.jobId, { mediaDone: 1, mediaError: 1 });
      }
      message.ack();
    } catch {
      message.retry();
    }
  }
}
