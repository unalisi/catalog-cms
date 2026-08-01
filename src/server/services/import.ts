import { env } from 'cloudflare:workers';
import { products } from '../../../db/schema';
import * as csvAdapter from '../../lib/import/adapters/csv';
import * as wooAdapter from '../../lib/import/adapters/woo';
import * as wxrAdapter from '../../lib/import/adapters/wxr';
import type {
  ConflictPolicy,
  ImportItemAction,
  ImportJobSummary,
  ImportMediaMessage,
  ImportQueueMessage,
  ImportRecord,
  ImportSource,
  MappingProfile,
} from '../../lib/import/types';
import { zodFieldErrors } from '../../lib/validation/admin';
import { importJobCreateSchema, importRecordSchema } from '../../lib/validation/import';
import { getDb, type Db } from '../db';
import { handleImportMediaBatch } from '../queue/import-media.consumer';
import * as importRepo from '../repos/import';
import { applyImportJob } from './import-apply';
import { emptyImportJobSummary, updateJobSummary } from './import-job-summary';

const ADAPTERS: Record<
  ImportSource,
  { parseToRecords(input: string, mapping?: MappingProfile): ImportRecord[] }
> = {
  csv: csvAdapter,
  woo: wooAdapter,
  wxr: wxrAdapter,
};

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
  return emptyImportJobSummary(extra);
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
      summary.error = (summary.error ?? 0) + 1;
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
    if (action === 'create') summary.create = (summary.create ?? 0) + 1;
    else if (action === 'update') summary.update = (summary.update ?? 0) + 1;
    else if (action === 'skip') summary.skip = (summary.skip ?? 0) + 1;
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

/** Marks a ready job processing: batch-writes product drafts, enqueues media only. */
export async function applyJob(jobId: string) {
  return applyImportJob(jobId);
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

  let summary: ImportJobSummary;
  if (job.status === 'processing' || job.status === 'queued' || job.status === 'completed') {
    const refreshed = await updateJobSummary(db, jobId);
    summary =
      refreshed ??
      (job.summaryJson
        ? (JSON.parse(job.summaryJson) as ImportJobSummary)
        : await importRepo.getImportJobSummaryFromItems(db, jobId));
    job = (await importRepo.getImportJobById(db, jobId)) ?? job;
  } else {
    summary = job.summaryJson
      ? (JSON.parse(job.summaryJson) as ImportJobSummary)
      : await importRepo.getImportJobSummaryFromItems(db, jobId);
  }
  const progress = await importRepo.getImportJobProgress(db, jobId);

  return { ...job, summary, items, progress };
}

export async function listJobs() {
  return importRepo.listImportJobs(getDb());
}

function isPrepareMessage(
  body: ImportQueueMessage,
): body is { type: 'prepare'; jobId: string } {
  return (
    typeof body === 'object' &&
    body !== null &&
    'type' in body &&
    (body as { type?: string }).type === 'prepare'
  );
}

/**
 * Product queue (`catalog-import` / IMPORT_QUEUE): prepare/dry-run only.
 * Product drafts are written synchronously in applyImportJob; images use IMPORT_MEDIA_QUEUE.
 */
export async function processImportQueue(batch: MessageBatch<ImportQueueMessage>): Promise<void> {
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
    // Drop legacy core/apply envelopes — products are no longer queued.
    message.ack();
  }
}

/**
 * Media queue consumer (`catalog-import-media` / IMPORT_MEDIA_QUEUE).
 */
export async function processImportMediaQueue(
  batch: MessageBatch<ImportQueueMessage>,
): Promise<void> {
  const mediaMessages: Message<ImportMediaMessage>[] = [];

  for (const message of batch.messages) {
    const body = message.body;
    if (
      typeof body === 'object' &&
      body !== null &&
      'importMediaItemId' in body &&
      'sourceUrl' in body
    ) {
      mediaMessages.push(message as Message<ImportMediaMessage>);
    } else {
      message.ack();
    }
  }

  if (mediaMessages.length === 0) return;

  await handleImportMediaBatch({
    queue: batch.queue,
    messages: mediaMessages,
  } as unknown as MessageBatch<ImportMediaMessage>);
}
