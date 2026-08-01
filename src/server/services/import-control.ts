import { env } from 'cloudflare:workers';
import { and, eq, isNotNull } from 'drizzle-orm';
import { importItems, importJobs, products } from '../../../db/schema';
import { invalidateProductCache, invalidateSitemapCache } from '../../lib/cache/invalidate';
import type { ImportJobSummary } from '../../lib/import/types';
import { nowIso } from '../../lib/utils/id';
import { getDb } from '../db';
import * as importRepo from '../repos/import';
import * as mediaRepo from '../repos/media';
import * as productsRepo from '../repos/products-admin';
import { applyImportJob } from './import-apply';
import { emptyImportJobSummary, updateJobSummary } from './import-job-summary';

export type ControlResult =
  | { ok: true; data: Awaited<ReturnType<typeof importRepo.getImportJobById>>; deleted?: number }
  | { ok: false; notFound?: true; fields?: Record<string, string> };

export async function pauseImportJob(jobId: string): Promise<ControlResult> {
  const db = getDb();
  const job = await importRepo.getImportJobById(db, jobId);
  if (!job) return { ok: false, notFound: true };
  if (job.status !== 'queued' && job.status !== 'processing') {
    return {
      ok: false,
      fields: { _form: `Durdurmak için iş queued/processing olmalı (şu an: ${job.status})` },
    };
  }

  await importRepo.updateImportJobStatus(db, jobId, 'paused');

  let summary: ImportJobSummary = job.summaryJson
    ? (JSON.parse(job.summaryJson) as ImportJobSummary)
    : emptyImportJobSummary();
  summary = { ...summary, message: 'Import duraklatıldı' };
  await importRepo.updateImportJobSummary(db, jobId, summary);
  await updateJobSummary(db, jobId);

  return { ok: true, data: await importRepo.getImportJobById(db, jobId) };
}

/** Resume = re-enqueue remaining pending/failed items via applyImportJob. */
export async function resumeImportJob(jobId: string): Promise<ControlResult> {
  const db = getDb();
  const job = await importRepo.getImportJobById(db, jobId);
  if (!job) return { ok: false, notFound: true };
  if (job.status !== 'paused') {
    return {
      ok: false,
      fields: { _form: `Devam etmek için iş paused olmalı (şu an: ${job.status})` },
    };
  }

  if (job.summaryJson) {
    try {
      const summary = JSON.parse(job.summaryJson) as ImportJobSummary;
      if (summary.message === 'Import duraklatıldı') {
        delete summary.message;
        await importRepo.updateImportJobSummary(db, jobId, summary);
      }
    } catch {
      // ignore
    }
  }

  const result = await applyImportJob(jobId);
  if (!result.ok) return result;
  return { ok: true, data: result.data };
}

/**
 * Cancel job: stop consumers, delete products created by this job (action=create).
 * Updates/skips of existing products are left intact.
 */
export async function cancelImportJob(jobId: string): Promise<ControlResult> {
  const db = getDb();
  const job = await importRepo.getImportJobById(db, jobId);
  if (!job) return { ok: false, notFound: true };

  if (job.status !== 'queued' && job.status !== 'processing' && job.status !== 'paused') {
    return {
      ok: false,
      fields: {
        _form: `İptal için iş queued/processing/paused olmalı (şu an: ${job.status})`,
      },
    };
  }

  // Flip status first so in-flight queue messages no-op.
  await importRepo.updateImportJobStatus(db, jobId, 'cancelled');

  const createdRows = await db
    .select({ productId: importItems.productId })
    .from(importItems)
    .where(
      and(
        eq(importItems.jobId, jobId),
        eq(importItems.action, 'create'),
        isNotNull(importItems.productId),
      ),
    );

  const productIds = [
    ...new Set(
      createdRows.map((r) => r.productId).filter((id): id is string => Boolean(id)),
    ),
  ];

  // Clear FK before product delete (import_items.product_id has no ON DELETE CASCADE).
  if (productIds.length > 0) {
    for (const productId of productIds) {
      await db
        .update(importItems)
        .set({ productId: null })
        .where(and(eq(importItems.jobId, jobId), eq(importItems.productId, productId)));
    }
  }

  let deleted = 0;
  for (const productId of productIds) {
    const ok = await deleteImportedProduct(productId);
    if (ok) deleted++;
  }

  const items = await importRepo.listImportItemsByJob(db, jobId);
  for (const item of items) {
    if (item.status === 'pending' || item.status === 'failed') {
      await importRepo.updateImportItem(db, item.id, {
        status: 'failed',
        error: 'İptal edildi',
      });
    }
  }

  const previous: Partial<ImportJobSummary> = job.summaryJson
    ? (JSON.parse(job.summaryJson) as ImportJobSummary)
    : {};
  const summary = emptyImportJobSummary({
    ...previous,
    message: `Import iptal edildi. ${deleted} oluşturulan ürün silindi.`,
    mediaCompletedAt: new Date().toISOString(),
    coreCompletedAt: previous.coreCompletedAt ?? new Date().toISOString(),
  });
  await importRepo.updateImportJobSummary(db, jobId, summary);
  await db
    .update(importJobs)
    .set({ status: 'cancelled', updatedAt: nowIso() })
    .where(eq(importJobs.id, jobId));

  await invalidateSitemapCache();

  return {
    ok: true,
    data: await importRepo.getImportJobById(db, jobId),
    deleted,
  };
}

async function deleteImportedProduct(productId: string): Promise<boolean> {
  const db = getDb();
  const product = await productsRepo.getProductAdminById(db, productId);
  if (!product) return false;

  const gallery = await productsRepo.listProductGallery(db, productId);
  const mediaIds = new Set(gallery.map((g) => g.id));
  if (product.primaryMediaId) mediaIds.add(product.primaryMediaId);

  await db
    .update(products)
    .set({ primaryMediaId: null, updatedAt: nowIso() })
    .where(eq(products.id, productId));

  const deleted = await productsRepo.deleteProduct(db, productId);
  if (!deleted) return false;

  for (const mediaId of mediaIds) {
    try {
      const refs = await mediaRepo.countMediaReferences(db, mediaId);
      if (refs > 0) continue;
      const media = await mediaRepo.getMediaById(db, mediaId);
      if (!media) continue;
      try {
        await env.MEDIA.delete(media.key);
      } catch {
        // non-fatal
      }
      await mediaRepo.deleteMediaRecord(db, mediaId);
    } catch {
      // continue other media
    }
  }

  await invalidateProductCache(deleted.slug);
  return true;
}
