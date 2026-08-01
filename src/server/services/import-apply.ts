import { env } from 'cloudflare:workers';
import { and, eq } from 'drizzle-orm';
import { importMediaItems } from '../../../db/schema';
import type { ConflictPolicy, ImportMediaMessage } from '../../lib/import/types';
import { getDb } from '../db';
import { applyImportItemsAsDraftsBatch } from '../import/apply-product-draft';
import * as importRepo from '../repos/import';
import { emptyImportJobSummary, updateJobSummary } from './import-job-summary';

export type ApplyImportJobResult =
  | {
      ok: true;
      data: Awaited<ReturnType<typeof importRepo.getImportJobById>>;
      enqueued: number;
      productsWritten: number;
    }
  | { ok: false; notFound?: true; fields?: Record<string, string> };

const MEDIA_SEND_BATCH = 100;

/**
 * Apply: write all product rows as draft via D1 batch (no product queue),
 * then enqueue per-image messages on IMPORT_MEDIA_QUEUE. Media consumer publishes.
 */
export async function applyImportJob(jobId: string): Promise<ApplyImportJobResult> {
  const db = getDb();
  const job = await importRepo.getImportJobById(db, jobId);
  if (!job) return { ok: false, notFound: true };

  if (
    job.status !== 'ready' &&
    job.status !== 'completed' &&
    job.status !== 'queued' &&
    job.status !== 'processing' &&
    job.status !== 'paused'
  ) {
    return {
      ok: false,
      fields: { _form: `İş durumu apply için uygun değil: ${job.status}` },
    };
  }

  const items = await importRepo.listImportItemsByJob(db, jobId);
  const pendingItems = items.filter(
    (item) =>
      (item.status === 'pending' || item.status === 'failed') && item.action !== 'error',
  );

  await importRepo.updateImportJobStatus(db, jobId, 'processing');

  const totalItems = items.filter((i) => i.action !== 'error').length;
  await importRepo.updateImportJobSummary(
    db,
    jobId,
    emptyImportJobSummary({
      total: totalItems || pendingItems.length,
      startedAt: new Date().toISOString(),
      message: pendingItems.length
        ? 'Ürünler draft olarak yazılıyor…'
        : 'Görseller kuyruğa alınıyor…',
    }),
  );

  let productsWritten = 0;
  const mediaMessages: ImportMediaMessage[] = [];

  // 1) Batch-write all product drafts (preload + D1.batch — seconds, not minutes).
  if (pendingItems.length > 0) {
    const batchResult = await applyImportItemsAsDraftsBatch(db, {
      jobId,
      conflictPolicy: job.conflictPolicy as ConflictPolicy,
      items: pendingItems.map((item) => ({ id: item.id, mappedJson: item.mappedJson })),
      shouldAbort: async () => {
        const current = await importRepo.getImportJobById(db, jobId);
        return current?.status === 'cancelled' || current?.status === 'paused';
      },
    });
    productsWritten = batchResult.productsWritten;
    mediaMessages.push(...batchResult.mediaMessages);
  }

  await updateJobSummary(db, jobId, {
    totalOverride: totalItems || pendingItems.length,
  });

  // 2) Resume path: re-enqueue media rows still pending (pause / crash).
  const pendingMediaRows = await db
    .select()
    .from(importMediaItems)
    .where(and(eq(importMediaItems.jobId, jobId), eq(importMediaItems.status, 'pending')));

  const alreadyQueued = new Set(mediaMessages.map((m) => m.importMediaItemId));
  for (const row of pendingMediaRows) {
    if (alreadyQueued.has(row.id)) continue;
    mediaMessages.push({
      jobId,
      productId: row.productId,
      importMediaItemId: row.id,
      sourceUrl: row.sourceUrl,
      position: row.position,
      isPrimary: row.isPrimary,
      targetStatus: 'published',
    });
  }

  // 3) Media queue only.
  const latest = await importRepo.getImportJobById(db, jobId);
  if (latest?.status !== 'cancelled' && latest?.status !== 'paused') {
    for (let i = 0; i < mediaMessages.length; i += MEDIA_SEND_BATCH) {
      const chunk = mediaMessages.slice(i, i + MEDIA_SEND_BATCH);
      await env.IMPORT_MEDIA_QUEUE.sendBatch(chunk.map((body) => ({ body })));
    }

    await importRepo.updateImportJobStatus(db, jobId, 'processing');
    await updateJobSummary(db, jobId, {
      totalOverride: totalItems || productsWritten,
      phase: 'started',
    });

    const summary = await updateJobSummary(db, jobId, {
      totalOverride: totalItems || productsWritten,
    });
    if (
      summary &&
      summary.core.done + summary.core.failed >= summary.total &&
      summary.media.pending === 0
    ) {
      await importRepo.updateImportJobStatus(db, jobId, 'completed');
    }
  }

  return {
    ok: true,
    data: await importRepo.getImportJobById(db, jobId),
    enqueued: mediaMessages.length,
    productsWritten,
  };
}
