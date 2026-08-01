import { env } from 'cloudflare:workers';
import { eq } from 'drizzle-orm';
import { importJobs, importMediaItems, productMedia, products } from '../../../db/schema';
import { invalidateProductCache, invalidateSitemapCache } from '../../lib/cache/invalidate';
import { ALLOWED_MIME, buildMediaObjectKey, extFromMime } from '../../lib/media/urls';
import { nowIso } from '../../lib/utils/id';
import type { ImportMediaMessage } from '../../lib/import/types';
import { getDb, type Db } from '../db';
import * as mediaRepo from '../repos/media';
import { importMediaRepo } from '../repos/import-media';
import { updateJobSummary } from '../services/import-job-summary';

async function shouldSkipJob(db: Db, jobId: string): Promise<boolean> {
  const [job] = await db
    .select({ status: importJobs.status })
    .from(importJobs)
    .where(eq(importJobs.id, jobId))
    .limit(1);
  if (!job) return true;
  return (
    job.status === 'paused' ||
    job.status === 'cancelled' ||
    job.status === 'failed' ||
    job.status === 'completed'
  );
}

/**
 * IMPORT_MEDIA_QUEUE consumer — slow lane: one remote image per message.
 */
export async function handleImportMediaBatch(
  batch: MessageBatch<ImportMediaMessage>,
): Promise<void> {
  const db = getDb();
  const mediaItemsRepo = importMediaRepo(db);
  const touchedJobs = new Set<string>();

  for (const msg of batch.messages) {
    try {
      if (await shouldSkipJob(db, msg.body.jobId)) {
        msg.ack();
        continue;
      }
      await processOne(msg.body, db, mediaItemsRepo);
      touchedJobs.add(msg.body.jobId);
      msg.ack();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(
        JSON.stringify({
          level: 'error',
          msg: 'import-media-item-failed',
          jobId: msg.body.jobId,
          productId: msg.body.productId,
          sourceUrl: msg.body.sourceUrl,
          attempts: msg.attempts,
          error: errorMsg,
        }),
      );

      if (await shouldSkipJob(db, msg.body.jobId)) {
        msg.ack();
        continue;
      }

      const maxAttempts = 5;
      if (msg.attempts >= maxAttempts) {
        try {
          await mediaItemsRepo.markFailed(msg.body.importMediaItemId, errorMsg);
          const pending = await mediaItemsRepo.countPending(
            msg.body.jobId,
            msg.body.productId,
          );
          if (pending === 0) {
            await maybePublish(db, msg.body.productId, msg.body.targetStatus);
          }
          touchedJobs.add(msg.body.jobId);
        } catch {
          // ignore secondary failure
        }
        msg.ack();
      } else {
        msg.retry();
      }
    }
  }

  for (const jobId of touchedJobs) {
    await updateJobSummary(db, jobId);
  }
}

async function processOne(
  message: ImportMediaMessage,
  db: Db,
  mediaItemsRepo: ReturnType<typeof importMediaRepo>,
) {
  const { sourceUrl, importMediaItemId, productId, position, isPrimary, jobId, targetStatus } =
    message;

  if (await shouldSkipJob(db, jobId)) return;

  const alreadyDone = await isAlreadyDone(db, importMediaItemId);
  if (!alreadyDone) {
    const mediaId = await fetchAndStore(db, sourceUrl);
    if (await shouldSkipJob(db, jobId)) return;
    await mediaItemsRepo.markDone(importMediaItemId, mediaId);
    await linkToProduct(db, productId, mediaId, position, isPrimary);
  }

  const pending = await mediaItemsRepo.countPending(jobId, productId);
  if (pending === 0 && !(await shouldSkipJob(db, jobId))) {
    await maybePublish(db, productId, targetStatus);
  }
}

async function isAlreadyDone(db: Db, importMediaItemId: string): Promise<boolean> {
  const [row] = await db
    .select()
    .from(importMediaItems)
    .where(eq(importMediaItems.id, importMediaItemId))
    .limit(1);
  return row?.status === 'done';
}

async function fetchAndStore(db: Db, sourceUrl: string): Promise<string> {
  const res = await fetch(sourceUrl);
  if (!res.ok) {
    throw new Error(`Görsel indirilemedi (${res.status}): ${sourceUrl}`);
  }

  const contentType = (res.headers.get('content-type') || '')
    .split(';')[0]
    .trim()
    .toLowerCase();
  const mime = ALLOWED_MIME.has(contentType) ? contentType : 'image/jpeg';
  if (!ALLOWED_MIME.has(mime)) {
    throw new Error(`Desteklenmeyen görsel tipi: ${contentType || 'unknown'}`);
  }

  const buffer = await res.arrayBuffer();
  if (buffer.byteLength === 0) {
    throw new Error(`Boş görsel: ${sourceUrl}`);
  }

  const key = buildMediaObjectKey(extFromMime(mime));
  await env.MEDIA.put(key, buffer, {
    httpMetadata: { contentType: mime },
    customMetadata: { alt: 'import' },
  });

  const record = await mediaRepo.createMediaRecord(db, {
    key,
    alt: 'import',
    mime,
    sizeBytes: buffer.byteLength,
    source: 'import',
  });
  return record.id;
}

async function linkToProduct(
  db: Db,
  productId: string,
  mediaId: string,
  position: number,
  isPrimary: boolean,
) {
  try {
    await db.insert(productMedia).values({ productId, mediaId, position });
  } catch {
    // already linked
  }
  if (isPrimary) {
    await db
      .update(products)
      .set({ primaryMediaId: mediaId, updatedAt: nowIso() })
      .where(eq(products.id, productId));
  }
}

async function maybePublish(
  db: Db,
  productId: string,
  targetStatus: 'draft' | 'published',
) {
  if (targetStatus !== 'published') return;

  const [current] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  if (!current || current.status === 'published') return;

  const now = nowIso();
  await db
    .update(products)
    .set({ status: 'published', publishedAt: current.publishedAt ?? now, updatedAt: now })
    .where(eq(products.id, productId));

  await invalidateProductCache(current.slug);
  await invalidateSitemapCache();
}
