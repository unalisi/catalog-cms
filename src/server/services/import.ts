import { env } from 'cloudflare:workers';
import { eq } from 'drizzle-orm';
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
import { applyImportRecord } from '../import/apply-item';
import { getDb, type Db } from '../db';
import * as importRepo from '../repos/import';

const ADAPTERS: Record<ImportSource, { parseToRecords(input: string, mapping?: MappingProfile): ImportRecord[] }> = {
  csv: csvAdapter,
  woo: wooAdapter,
  wxr: wxrAdapter,
};

/** Item ids are sent to the queue in batches of this size (ARCHITECTURE §7 / FAZ 7). */
const QUEUE_ITEM_BATCH_SIZE = 10;

async function findExistingProductId(db: Db, record: ImportRecord): Promise<string | null> {
  if (record.sku) {
    const [bySku] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.sku, record.sku))
      .limit(1);
    if (bySku) return bySku.id;
  }
  const [bySlug] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.slug, record.slug))
    .limit(1);
  return bySlug?.id ?? null;
}

/** Determines the dry-run action for a record without writing to the products table. */
async function previewAction(
  db: Db,
  record: ImportRecord,
  conflictPolicy: ConflictPolicy,
): Promise<Exclude<ImportItemAction, 'error'>> {
  const existingId = await findExistingProductId(db, record);
  if (!existingId) return 'create';
  return conflictPolicy === 'skip' ? 'skip' : 'update';
}

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
  const adapter = ADAPTERS[source];

  let records: ImportRecord[];
  try {
    records = adapter.parseToRecords(content, mapping);
  } catch (err) {
    return {
      ok: false as const,
      fields: { content: err instanceof Error ? err.message : 'Ayrıştırma hatası' },
    };
  }

  const db = getDb();
  const job = await importRepo.createImportJob(db, {
    source,
    conflictPolicy,
    mappingJson: mapping ? JSON.stringify(mapping) : null,
    createdBy: payload.userId ?? null,
  });

  const summary: ImportJobSummary = { total: records.length, create: 0, update: 0, skip: 0, error: 0 };
  const itemsToInsert: Parameters<typeof importRepo.insertImportItems>[2] = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const validated = importRecordSchema.safeParse(record);

    if (!validated.success) {
      summary.error++;
      itemsToInsert.push({
        rowIndex: i,
        rawJson: JSON.stringify(record),
        mappedJson: null,
        action: 'error',
        status: 'error',
        error: validated.error.issues[0]?.message ?? 'Geçersiz kayıt',
      });
      continue;
    }

    const action = await previewAction(db, validated.data, conflictPolicy);
    summary[action]++;
    itemsToInsert.push({
      rowIndex: i,
      rawJson: JSON.stringify(record),
      mappedJson: JSON.stringify(validated.data),
      action,
      status: 'pending',
      error: null,
    });
  }

  await importRepo.insertImportItems(db, job.id, itemsToInsert);
  await importRepo.updateImportJobSummary(db, job.id, summary);
  await importRepo.updateImportJobStatus(db, job.id, 'ready');

  const created = await importRepo.getImportJobById(db, job.id);
  return { ok: true as const, data: { job: created, summary } };
}

/** Marks a ready job as queued and enqueues its pending items in batches of 10 item ids. */
export async function applyJob(jobId: string) {
  const db = getDb();
  const job = await importRepo.getImportJobById(db, jobId);
  if (!job) return { ok: false as const, notFound: true as const };
  if (job.status !== 'ready' && job.status !== 'completed') {
    return { ok: false as const, fields: { _form: `İş durumu apply için uygun değil: ${job.status}` } };
  }

  const items = await importRepo.listImportItemsByJob(db, jobId);
  const pendingItems = items.filter((item) => item.status === 'pending' && item.action !== 'error');

  if (pendingItems.length === 0) {
    await importRepo.updateImportJobStatus(db, jobId, 'completed');
    return { ok: true as const, data: await importRepo.getImportJobById(db, jobId) };
  }

  await importRepo.updateImportJobStatus(db, jobId, 'queued');

  const messages: ImportQueueMessage[] = [];
  for (let i = 0; i < pendingItems.length; i += QUEUE_ITEM_BATCH_SIZE) {
    messages.push({
      jobId,
      itemIds: pendingItems.slice(i, i + QUEUE_ITEM_BATCH_SIZE).map((item) => item.id),
    });
  }
  await env.IMPORT_QUEUE.sendBatch(messages.map((body) => ({ body })));

  return { ok: true as const, data: await importRepo.getImportJobById(db, jobId) };
}

export async function getJob(jobId: string) {
  const db = getDb();
  const job = await importRepo.getImportJobById(db, jobId);
  if (!job) return null;

  const items = await importRepo.listImportItemsByJob(db, jobId, { limit: 100 });
  const summary: ImportJobSummary = job.summaryJson
    ? (JSON.parse(job.summaryJson) as ImportJobSummary)
    : await importRepo.getImportJobSummaryFromItems(db, jobId);

  return { ...job, summary, items };
}

export async function listJobs() {
  return importRepo.listImportJobs(getDb());
}

/**
 * Consumer entrypoint for the `catalog-import` queue (bound as `IMPORT_QUEUE`).
 * Each message carries a batch of up to 10 `import_items` ids; every item is applied
 * (upsert + media copy) idempotently, then the job's summary/status is refreshed.
 */
export async function processImportQueue(batch: MessageBatch<ImportQueueMessage>): Promise<void> {
  const db = getDb();
  const affectedJobIds = new Set<string>();

  for (const message of batch.messages) {
    const { jobId, itemIds } = message.body;
    affectedJobIds.add(jobId);

    try {
      const job = await importRepo.getImportJobById(db, jobId);
      if (!job) {
        message.ack();
        continue;
      }
      await importRepo.updateImportJobStatus(db, jobId, 'processing');

      const items = await importRepo.getImportItemsByIds(db, itemIds);
      for (const item of items) {
        if (item.status === 'ok') continue; // idempotent: already applied by a previous attempt

        let record: ImportRecord | null = null;
        try {
          record = item.mappedJson ? (JSON.parse(item.mappedJson) as ImportRecord) : null;
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

        const result = await applyImportRecord(db, record, job.conflictPolicy);
        if (result.action === 'error') {
          await importRepo.updateImportItem(db, item.id, {
            status: 'error',
            action: 'error',
            error: result.error,
          });
        } else {
          await importRepo.updateImportItem(db, item.id, { status: 'ok', action: result.action });
        }
      }

      message.ack();
    } catch {
      message.retry();
    }
  }

  for (const jobId of affectedJobIds) {
    const summary = await importRepo.getImportJobSummaryFromItems(db, jobId);
    await importRepo.updateImportJobSummary(db, jobId, summary);
    const allDone = await importRepo.isAllItemsProcessed(db, jobId);
    if (allDone) {
      await importRepo.updateImportJobStatus(db, jobId, 'completed');
    }
  }
}
