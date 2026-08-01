import { eq } from 'drizzle-orm';
import { brands, categories } from '../../../db/schema';
import { newId, nowIso, slugify } from '../../lib/utils/id';
import type { Db } from '../db';

/** In-memory slug → id maps for one apply run (avoids N+1 D1 lookups). */
export type TaxonomyCache = {
  brands: Map<string, string>;
  categories: Map<string, string>;
};

export async function loadTaxonomyCache(db: Db): Promise<TaxonomyCache> {
  const [brandRows, categoryRows] = await Promise.all([
    db.select({ id: brands.id, slug: brands.slug }).from(brands),
    db.select({ id: categories.id, slug: categories.slug }).from(categories),
  ]);
  return {
    brands: new Map(brandRows.map((r) => [r.slug, r.id])),
    categories: new Map(categoryRows.map((r) => [r.slug, r.id])),
  };
}

type PendingBrand = { id: string; slug: string; name: string };
type PendingCategory = { id: string; slug: string; name: string };

/**
 * Resolve brand/category ids from cache; collect missing rows to insert once via batch.
 * Call flushPendingTaxonomy before product writes.
 */
export function createTaxonomyPlanner(cache: TaxonomyCache) {
  const pendingBrands = new Map<string, PendingBrand>();
  const pendingCategories = new Map<string, PendingCategory>();

  function resolveBrandId(brandName: string | null | undefined): string | null {
    const trimmed = brandName?.trim();
    if (!trimmed) return null;
    const slug = slugify(trimmed);
    const cached = cache.brands.get(slug);
    if (cached) return cached;
    const pending = pendingBrands.get(slug);
    if (pending) return pending.id;
    const id = newId('brand');
    pendingBrands.set(slug, { id, slug, name: trimmed });
    cache.brands.set(slug, id);
    return id;
  }

  function resolveCategoryIds(names: string[] | null | undefined): string[] {
    if (!names?.length) return [];
    const ids: string[] = [];
    for (const raw of names) {
      const name = raw.trim();
      if (!name) continue;
      const slug = slugify(name);
      let id = cache.categories.get(slug);
      if (!id) {
        const pending = pendingCategories.get(slug);
        if (pending) {
          id = pending.id;
        } else {
          id = newId('cat');
          pendingCategories.set(slug, { id, slug, name });
          cache.categories.set(slug, id);
        }
      }
      ids.push(id);
    }
    return ids;
  }

  async function flush(db: Db): Promise<void> {
    const now = nowIso();
    const statements = [
      ...[...pendingBrands.values()].map((b) =>
        db.insert(brands).values({
          id: b.id,
          slug: b.slug,
          name: b.name,
          description: null,
          status: 'draft',
          createdAt: now,
          updatedAt: now,
        }),
      ),
      ...[...pendingCategories.values()].map((c) =>
        db.insert(categories).values({
          id: c.id,
          slug: c.slug,
          name: c.name,
          parentId: null,
          description: null,
          position: 0,
          status: 'draft',
          createdAt: now,
          updatedAt: now,
        }),
      ),
    ];
    pendingBrands.clear();
    pendingCategories.clear();
    await runBatches(db, statements);
  }

  return { resolveBrandId, resolveCategoryIds, flush };
}

/** Legacy single-item helpers (kept for callers outside batch apply). */
export async function resolveBrandId(db: Db, brandName: string): Promise<string | null> {
  const cache = await loadTaxonomyCache(db);
  const planner = createTaxonomyPlanner(cache);
  const id = planner.resolveBrandId(brandName);
  await planner.flush(db);
  return id;
}

export async function resolveCategoryIds(db: Db, names: string[]): Promise<string[]> {
  const cache = await loadTaxonomyCache(db);
  const planner = createTaxonomyPlanner(cache);
  const ids = planner.resolveCategoryIds(names);
  await planner.flush(db);
  return ids;
}

const STATEMENT_BATCH = 40;

export type BatchStatement = Parameters<Db['batch']>[0][number];

export async function runBatches(db: Db, statements: BatchStatement[]): Promise<void> {
  if (statements.length === 0) return;
  for (let i = 0; i < statements.length; i += STATEMENT_BATCH) {
    const chunk = statements.slice(i, i + STATEMENT_BATCH) as [
      BatchStatement,
      ...BatchStatement[],
    ];
    if (chunk.length === 1) {
      await chunk[0];
      continue;
    }
    await db.batch(chunk);
  }
}
