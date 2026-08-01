import { asc, count, desc, eq, inArray } from 'drizzle-orm';
import { importItems, importJobs, type ImportItem, type ImportJob } from '../../../db/schema';
import type { Db } from '../db';
import { newId, nowIso } from '../../lib/utils/id';
import type {
  ConflictPolicy,
  ImportItemAction,
  ImportItemStatus,
  ImportJobStatus,
  ImportJobSummary,
  ImportSource,
} from '../../lib/import/types';

export async function createImportJob(
  db: Db,
  input: {
    source: ImportSource;
    conflictPolicy: ConflictPolicy;
    mappingJson?: string | null;
    createdBy?: string | null;
  },
): Promise<ImportJob> {
  const now = nowIso();
  const id = newId('impjob');
  await db.insert(importJobs).values({
    id,
    source: input.source,
    status: 'pending',
    conflictPolicy: input.conflictPolicy,
    mappingJson: input.mappingJson ?? null,
    summaryJson: null,
    createdBy: input.createdBy ?? null,
    createdAt: now,
    updatedAt: now,
  });
  const created = await getImportJobById(db, id);
  if (!created) throw new Error('Import job create failed');
  return created;
}

export async function getImportJobById(db: Db, id: string): Promise<ImportJob | null> {
  const [row] = await db.select().from(importJobs).where(eq(importJobs.id, id)).limit(1);
  return row ?? null;
}

export async function listImportJobs(db: Db): Promise<ImportJob[]> {
  return db.select().from(importJobs).orderBy(desc(importJobs.createdAt));
}

export async function updateImportJobStatus(
  db: Db,
  id: string,
  status: ImportJobStatus,
): Promise<void> {
  await db.update(importJobs).set({ status, updatedAt: nowIso() }).where(eq(importJobs.id, id));
}

export async function updateImportJobSummary(
  db: Db,
  id: string,
  summary: ImportJobSummary,
): Promise<void> {
  await db
    .update(importJobs)
    .set({ summaryJson: JSON.stringify(summary), updatedAt: nowIso() })
    .where(eq(importJobs.id, id));
}

export async function insertImportItems(
  db: Db,
  jobId: string,
  items: {
    rowIndex: number;
    rawJson: string;
    mappedJson?: string | null;
    action?: ImportItemAction | null;
    status?: ImportItemStatus;
    error?: string | null;
  }[],
): Promise<ImportItem[]> {
  if (items.length === 0) return [];
  const now = nowIso();
  const rows = items.map((item) => ({
    id: newId('impitem'),
    jobId,
    rowIndex: item.rowIndex,
    rawJson: item.rawJson,
    mappedJson: item.mappedJson ?? null,
    action: item.action ?? null,
    status: item.status ?? ('pending' as ImportItemStatus),
    error: item.error ?? null,
    productId: null,
    createdAt: now,
  }));

  // D1 limits: max 100 bound params and 100KB SQL per statement.
  // Multi-row INSERT blows both limits with Woo mapped_json payloads.
  // Use one INSERT per row, grouped via db.batch (~40 statements each).
  const STATEMENT_BATCH = 40;
  for (let i = 0; i < rows.length; i += STATEMENT_BATCH) {
    const chunk = rows.slice(i, i + STATEMENT_BATCH);
    if (chunk.length === 1) {
      await db.insert(importItems).values(chunk[0]);
      continue;
    }
    const statements = chunk.map((row) => db.insert(importItems).values(row));
    await db.batch(statements as [typeof statements[0], ...typeof statements]);
  }
  return rows;
}

export async function failImportJob(db: Db, id: string, message: string): Promise<void> {
  const summary: ImportJobSummary = {
    total: 0,
    core: { done: 0, failed: 0 },
    media: { pending: 0, done: 0, failed: 0 },
    published: 0,
    startedAt: new Date().toISOString(),
    coreCompletedAt: null,
    mediaCompletedAt: null,
    create: 0,
    update: 0,
    skip: 0,
    error: 0,
    message,
  };
  await db
    .update(importJobs)
    .set({
      status: 'failed',
      summaryJson: JSON.stringify(summary),
      updatedAt: nowIso(),
    })
    .where(eq(importJobs.id, id));
}

export async function listImportItemsByJob(
  db: Db,
  jobId: string,
  opts?: { limit?: number },
): Promise<ImportItem[]> {
  const base = db
    .select()
    .from(importItems)
    .where(eq(importItems.jobId, jobId))
    .orderBy(asc(importItems.rowIndex));
  return opts?.limit ? base.limit(opts.limit) : base;
}

export async function getImportItemsByIds(db: Db, ids: string[]): Promise<ImportItem[]> {
  if (ids.length === 0) return [];
  return db.select().from(importItems).where(inArray(importItems.id, ids));
}

export async function countImportItemsByJob(db: Db, jobId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(importItems)
    .where(eq(importItems.jobId, jobId));
  return row?.value ?? 0;
}

export async function updateImportItem(
  db: Db,
  id: string,
  patch: {
    mappedJson?: string | null;
    action?: ImportItemAction | null;
    status?: ImportItemStatus;
    error?: string | null;
    productId?: string | null;
  },
): Promise<ImportItem | null> {
  await db.update(importItems).set(patch).where(eq(importItems.id, id));
  const [row] = await db.select().from(importItems).where(eq(importItems.id, id)).limit(1);
  return row ?? null;
}

export async function getImportJobSummaryFromItems(
  db: Db,
  jobId: string,
): Promise<ImportJobSummary> {
  const items = await listImportItemsByJob(db, jobId);
  const summary: ImportJobSummary = {
    total: items.length,
    core: { done: 0, failed: 0 },
    media: { pending: 0, done: 0, failed: 0 },
    published: 0,
    startedAt: new Date().toISOString(),
    coreCompletedAt: null,
    mediaCompletedAt: null,
    create: 0,
    update: 0,
    skip: 0,
    error: 0,
  };
  for (const item of items) {
    if (item.status === 'error' || item.status === 'failed' || item.action === 'error') {
      summary.error = (summary.error ?? 0) + 1;
      summary.core.failed++;
    } else if (item.status === 'core_done' || item.status === 'ok') {
      summary.core.done++;
    }
    if (item.action === 'create') summary.create = (summary.create ?? 0) + 1;
    else if (item.action === 'update') summary.update = (summary.update ?? 0) + 1;
    else if (item.action === 'skip') summary.skip = (summary.skip ?? 0) + 1;
  }
  return summary;
}

export async function isAllItemsProcessed(db: Db, jobId: string): Promise<boolean> {
  const items = await listImportItemsByJob(db, jobId);
  if (items.length === 0) return true;
  return items.every((item) => item.status !== 'pending');
}

/** Counts for apply progress UI (does not load mapped JSON payloads). */
export async function getImportJobProgress(
  db: Db,
  jobId: string,
): Promise<{ total: number; processed: number; pending: number; error: number }> {
  const items = await db
    .select({ status: importItems.status })
    .from(importItems)
    .where(eq(importItems.jobId, jobId));
  let pending = 0;
  let error = 0;
  for (const item of items) {
    if (item.status === 'pending') pending++;
    else if (item.status === 'error' || item.status === 'failed') error++;
  }
  const total = items.length;
  return { total, processed: total - pending, pending, error };
}
