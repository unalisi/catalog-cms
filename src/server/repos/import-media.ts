import { and, eq, sql } from 'drizzle-orm';
import { importMediaItems } from '../../../db/schema';
import { newId } from '../../lib/utils/id';
import type { Db } from '../db';

export function importMediaRepo(db: Db) {
  return {
    async createMany(
      jobId: string,
      productId: string,
      items: { sourceUrl: string; position: number; isPrimary: boolean }[],
    ) {
      if (items.length === 0) return [];
      const now = Date.now();
      const rows = items.map((it) => ({
        id: newId('imi'),
        jobId,
        productId,
        sourceUrl: it.sourceUrl,
        position: it.position,
        isPrimary: it.isPrimary,
        status: 'pending' as const,
        attempts: 0,
        error: null as string | null,
        mediaId: null as string | null,
        createdAt: now,
        updatedAt: now,
      }));

      // D1 bind limits — insert one row at a time in small batches.
      const STATEMENT_BATCH = 40;
      for (let i = 0; i < rows.length; i += STATEMENT_BATCH) {
        const chunk = rows.slice(i, i + STATEMENT_BATCH);
        if (chunk.length === 1) {
          await db.insert(importMediaItems).values(chunk[0]);
          continue;
        }
        const statements = chunk.map((row) => db.insert(importMediaItems).values(row));
        await db.batch(statements as [typeof statements[0], ...typeof statements]);
      }
      return rows;
    },

    async markDone(id: string, mediaId: string) {
      await db
        .update(importMediaItems)
        .set({ status: 'done', mediaId, updatedAt: Date.now() })
        .where(eq(importMediaItems.id, id));
    },

    async markFailed(id: string, error: string) {
      await db
        .update(importMediaItems)
        .set({
          status: 'failed',
          error,
          attempts: sql`${importMediaItems.attempts} + 1`,
          updatedAt: Date.now(),
        })
        .where(eq(importMediaItems.id, id));
    },

    async countPending(jobId: string, productId: string): Promise<number> {
      const rows = await db
        .select({ n: sql<number>`count(*)` })
        .from(importMediaItems)
        .where(
          and(
            eq(importMediaItems.jobId, jobId),
            eq(importMediaItems.productId, productId),
            eq(importMediaItems.status, 'pending'),
          ),
        );
      return Number(rows[0]?.n ?? 0);
    },

    async countByStatus(jobId: string) {
      const rows = await db
        .select({ status: importMediaItems.status, n: sql<number>`count(*)` })
        .from(importMediaItems)
        .where(eq(importMediaItems.jobId, jobId))
        .groupBy(importMediaItems.status);
      const out = { pending: 0, done: 0, failed: 0 };
      for (const r of rows) {
        const key = r.status as keyof typeof out;
        if (key in out) out[key] = Number(r.n);
      }
      return out;
    },
  };
}
