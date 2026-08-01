import { and, eq, sql } from 'drizzle-orm';
import { importItems, importJobs } from '../../../db/schema';
import type { ImportJobSummary } from '../../lib/import/types';
import { nowIso } from '../../lib/utils/id';
import type { Db } from '../db';
import { importMediaRepo } from '../repos/import-media';

type UpdateOptions = { totalOverride?: number; phase?: 'started' };

export function emptyImportJobSummary(
  overrides: Partial<ImportJobSummary> = {},
): ImportJobSummary {
  return {
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
    ...overrides,
  };
}

/**
 * Rebuilds `import_jobs.summary_json` for the two-phase import pipeline.
 */
export async function updateJobSummary(
  db: Db,
  jobId: string,
  options: UpdateOptions = {},
): Promise<ImportJobSummary | null> {
  const [job] = await db.select().from(importJobs).where(eq(importJobs.id, jobId)).limit(1);
  if (!job) return null;

  let previous: Partial<ImportJobSummary> = {};
  if (job.summaryJson) {
    try {
      previous = JSON.parse(job.summaryJson) as Partial<ImportJobSummary>;
    } catch {
      previous = {};
    }
  }

  const statusRows = await db
    .select({ status: importItems.status, n: sql<number>`count(*)` })
    .from(importItems)
    .where(eq(importItems.jobId, jobId))
    .groupBy(importItems.status);

  let coreDone = 0;
  let coreFailed = 0;
  for (const row of statusRows) {
    const n = Number(row.n);
    if (row.status === 'core_done' || row.status === 'ok') coreDone += n;
    else if (row.status === 'failed' || row.status === 'error') coreFailed += n;
  }

  const actionRows = await db
    .select({ action: importItems.action, n: sql<number>`count(*)` })
    .from(importItems)
    .where(eq(importItems.jobId, jobId))
    .groupBy(importItems.action);

  let actionCreate = 0;
  let actionUpdate = 0;
  let actionSkip = 0;
  for (const row of actionRows) {
    const n = Number(row.n);
    if (row.action === 'create') actionCreate = n;
    else if (row.action === 'update') actionUpdate = n;
    else if (row.action === 'skip') actionSkip = n;
  }

  const mediaCounts = await importMediaRepo(db).countByStatus(jobId);
  const itemTotal = statusRows.reduce((sum, r) => sum + Number(r.n), 0);
  const total = options.totalOverride ?? previous.total ?? itemTotal;

  const coreFinished = total > 0 && coreDone + coreFailed >= total;
  const mediaTotal = mediaCounts.pending + mediaCounts.done + mediaCounts.failed;
  const mediaFinished = mediaTotal === 0 || mediaCounts.pending === 0;

  const summary: ImportJobSummary = {
    total,
    core: { done: coreDone, failed: coreFailed },
    media: mediaCounts,
    published: previous.published ?? mediaCounts.done,
    startedAt:
      options.phase === 'started'
        ? new Date().toISOString()
        : (previous.startedAt ?? new Date().toISOString()),
    coreCompletedAt:
      previous.coreCompletedAt ?? (coreFinished ? new Date().toISOString() : null),
    mediaCompletedAt:
      previous.mediaCompletedAt ??
      (coreFinished && mediaFinished && total > 0 ? new Date().toISOString() : null),
    create: actionCreate || previous.create,
    update: actionUpdate || previous.update,
    skip: actionSkip || previous.skip,
    error: coreFailed,
    message: previous.message,
  };

  await db
    .update(importJobs)
    .set({ summaryJson: JSON.stringify(summary), updatedAt: nowIso() })
    .where(eq(importJobs.id, jobId));

  // Never auto-complete paused/cancelled/failed jobs.
  if (
    coreFinished &&
    mediaFinished &&
    total > 0 &&
    job.status !== 'paused' &&
    job.status !== 'cancelled' &&
    job.status !== 'failed'
  ) {
    await db
      .update(importJobs)
      .set({ status: 'completed', updatedAt: nowIso() })
      .where(and(eq(importJobs.id, jobId)));
  }

  return summary;
}
