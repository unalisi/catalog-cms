import { eq } from 'drizzle-orm';
import {
  importItems,
  importMediaItems,
  productCategories,
  products,
  seoMeta,
  type Product,
} from '../../../db/schema';
import type { ConflictPolicy, ImportMediaMessage, ImportRecord } from '../../lib/import/types';
import { newId, nowIso, slugify } from '../../lib/utils/id';
import type { Db } from '../db';
import { resolveMappedRecord } from './resolve-mapped';
import {
  createTaxonomyPlanner,
  loadTaxonomyCache,
  runBatches,
  type BatchStatement,
} from './taxonomy-resolver';

export type DraftApplyResult =
  | { ok: true; action: 'create' | 'update' | 'skip'; productId: string; mediaMessages: ImportMediaMessage[] }
  | { ok: false; error: string };

type PendingItem = {
  id: string;
  mappedJson: string | null;
};

type ProductIndex = {
  bySku: Map<string, Product>;
  bySlug: Map<string, Product>;
};

const RESOLVE_CONCURRENCY = 20;

/**
 * Fast path: preload taxonomy + products once, parallel-resolve mapped JSON,
 * then write all drafts via D1 batch (seconds instead of minutes).
 */
export async function applyImportItemsAsDraftsBatch(
  db: Db,
  input: {
    jobId: string;
    conflictPolicy: ConflictPolicy;
    items: PendingItem[];
    shouldAbort?: () => Promise<boolean>;
  },
): Promise<{ productsWritten: number; mediaMessages: ImportMediaMessage[]; failed: number }> {
  const { jobId, conflictPolicy, items } = input;
  if (items.length === 0) {
    return { productsWritten: 0, mediaMessages: [], failed: 0 };
  }

  const [taxonomy, productIndex] = await Promise.all([
    loadTaxonomyCache(db),
    loadProductIndex(db),
  ]);
  const taxonomyPlanner = createTaxonomyPlanner(taxonomy);

  // Parallel R2/D1 mapped_json resolve (bounded concurrency).
  const resolved = await mapPool(items, RESOLVE_CONCURRENCY, async (item) => ({
    item,
    record: await resolveMappedRecord(item.mappedJson),
  }));

  if (input.shouldAbort && (await input.shouldAbort())) {
    return { productsWritten: 0, mediaMessages: [], failed: 0 };
  }

  // First pass: ensure brands/categories exist (batch insert missing).
  for (const { record } of resolved) {
    if (!record) continue;
    if (record.brand) taxonomyPlanner.resolveBrandId(record.brand);
    if (record.categories?.length) taxonomyPlanner.resolveCategoryIds(record.categories);
  }
  await taxonomyPlanner.flush(db);

  const now = nowIso();
  const statements: BatchStatement[] = [];
  const mediaMessages: ImportMediaMessage[] = [];
  let productsWritten = 0;
  let failed = 0;

  for (const { item, record } of resolved) {
    if (!record) {
      statements.push(
        db
          .update(importItems)
          .set({ status: 'failed', action: 'error', error: 'Geçersiz eşlenmiş kayıt' })
          .where(eq(importItems.id, item.id)),
      );
      failed++;
      continue;
    }

    try {
      const planned = planDraftWrite({
        db,
        jobId,
        itemId: item.id,
        conflictPolicy,
        record,
        productIndex,
        taxonomyPlanner,
        now,
      });
      statements.push(...planned.statements);
      mediaMessages.push(...planned.mediaMessages);
      productsWritten++;
    } catch (err) {
      statements.push(
        db
          .update(importItems)
          .set({
            status: 'failed',
            action: 'error',
            error: err instanceof Error ? err.message : String(err),
          })
          .where(eq(importItems.id, item.id)),
      );
      failed++;
    }
  }

  await runBatches(db, statements);
  return { productsWritten, mediaMessages, failed };
}

/**
 * Single-item path (tests / fallback). Prefer applyImportItemsAsDraftsBatch for apply.
 */
export async function applyImportItemAsDraft(
  db: Db,
  input: {
    jobId: string;
    itemId: string;
    conflictPolicy: ConflictPolicy;
    mappedJson: string | null;
  },
): Promise<DraftApplyResult> {
  const result = await applyImportItemsAsDraftsBatch(db, {
    jobId: input.jobId,
    conflictPolicy: input.conflictPolicy,
    items: [{ id: input.itemId, mappedJson: input.mappedJson }],
  });
  if (result.failed > 0 || result.productsWritten === 0) {
    return { ok: false, error: 'Geçersiz eşlenmiş kayıt' };
  }
  const msg = result.mediaMessages;
  // Re-read item for action — keep API compatible via planned action on first message product.
  const [row] = await db
    .select({ action: importItems.action, productId: importItems.productId })
    .from(importItems)
    .where(eq(importItems.id, input.itemId))
    .limit(1);
  const action = (row?.action as 'create' | 'update' | 'skip') || 'create';
  const productId = row?.productId;
  if (!productId) return { ok: false, error: 'Ürün yazılamadı' };
  return { ok: true, action, productId, mediaMessages: msg };
}

function planDraftWrite(input: {
  db: Db;
  jobId: string;
  itemId: string;
  conflictPolicy: ConflictPolicy;
  record: ImportRecord;
  productIndex: ProductIndex;
  taxonomyPlanner: ReturnType<typeof createTaxonomyPlanner>;
  now: string;
}): { statements: BatchStatement[]; mediaMessages: ImportMediaMessage[] } {
  const { db, jobId, itemId, conflictPolicy, record, productIndex, taxonomyPlanner, now } = input;
  const statements: BatchStatement[] = [];
  const mediaMessages: ImportMediaMessage[] = [];

  const targetStatus = record.status === 'published' ? 'published' : 'draft';
  const slug = record.slug?.trim() || slugify(record.name);
  const mediaItems = normalizeMedia(record.media);
  const hasMedia = mediaItems.length > 0;

  const brandId = taxonomyPlanner.resolveBrandId(record.brand);
  const categoryIds = taxonomyPlanner.resolveCategoryIds(record.categories);
  const existing = findExistingInIndex(productIndex, record, slug);

  let productId: string;
  let action: 'create' | 'update' | 'skip' = 'create';

  if (existing) {
    if (conflictPolicy === 'skip') {
      statements.push(
        db
          .update(importItems)
          .set({
            status: 'core_done',
            action: 'skip',
            error: null,
            productId: existing.id,
          })
          .where(eq(importItems.id, itemId)),
      );
      return { statements, mediaMessages: [] };
    }

    const merged = conflictPolicy === 'merge' ? mergeFields(existing, record) : record;
    const seoId = planSeo(db, statements, existing.seoId, record, conflictPolicy, false, now);

    statements.push(
      db
        .update(products)
        .set({
          name: merged.name,
          description: merged.description ?? existing.description,
          price: merged.price,
          compareAtPrice:
            merged.compareAtPrice !== undefined && merged.compareAtPrice !== null
              ? merged.compareAtPrice
              : existing.compareAtPrice,
          stock: merged.stock,
          brandId: brandId ?? existing.brandId,
          sku: record.sku || existing.sku,
          slug,
          seoId,
          status: hasMedia ? 'draft' : targetStatus,
          publishedAt:
            !hasMedia && targetStatus === 'published'
              ? existing.publishedAt ?? now
              : existing.publishedAt,
          updatedAt: now,
        })
        .where(eq(products.id, existing.id)),
    );
    productId = existing.id;
    action = 'update';

    // Keep index in sync for later items in this batch.
    const updated: Product = {
      ...existing,
      name: merged.name,
      description: merged.description ?? existing.description,
      price: merged.price,
      compareAtPrice:
        merged.compareAtPrice !== undefined && merged.compareAtPrice !== null
          ? merged.compareAtPrice
          : existing.compareAtPrice,
      stock: merged.stock,
      brandId: brandId ?? existing.brandId,
      sku: record.sku || existing.sku,
      slug,
      seoId,
      status: hasMedia ? 'draft' : targetStatus,
      updatedAt: now,
    };
    indexProduct(productIndex, updated);
  } else {
    productId = newId('prod');
    const seoId = planSeo(db, statements, null, record, conflictPolicy, true, now);
    const created: Product = {
      id: productId,
      slug,
      sku: record.sku || null,
      name: record.name,
      description: record.description ?? null,
      price: record.price,
      compareAtPrice: record.compareAtPrice ?? null,
      currency: 'TRY',
      stock: record.stock,
      status: hasMedia ? 'draft' : targetStatus,
      brandId: brandId ?? null,
      seoId,
      primaryMediaId: null,
      publishedAt: !hasMedia && targetStatus === 'published' ? now : null,
      createdAt: now,
      updatedAt: now,
    };
    statements.push(db.insert(products).values(created));
    indexProduct(productIndex, created);
    action = 'create';
  }

  if (categoryIds.length > 0) {
    statements.push(db.delete(productCategories).where(eq(productCategories.productId, productId)));
    statements.push(
      db.insert(productCategories).values(
        categoryIds.map((categoryId) => ({ productId, categoryId })),
      ),
    );
  }

  if (hasMedia) {
    const mediaNow = Date.now();
    for (const it of mediaItems) {
      const rowId = newId('imi');
      statements.push(
        db.insert(importMediaItems).values({
          id: rowId,
          jobId,
          productId,
          sourceUrl: it.sourceUrl,
          position: it.position,
          isPrimary: it.isPrimary,
          status: 'pending',
          attempts: 0,
          error: null,
          mediaId: null,
          createdAt: mediaNow,
          updatedAt: mediaNow,
        }),
      );
      mediaMessages.push({
        jobId,
        productId,
        importMediaItemId: rowId,
        sourceUrl: it.sourceUrl,
        position: it.position,
        isPrimary: it.isPrimary,
        targetStatus,
      });
    }
  }

  statements.push(
    db
      .update(importItems)
      .set({ status: 'core_done', action, error: null, productId })
      .where(eq(importItems.id, itemId)),
  );

  return { statements, mediaMessages };
}

function planSeo(
  db: Db,
  statements: BatchStatement[],
  existingSeoId: string | null | undefined,
  record: ImportRecord,
  conflictPolicy: ConflictPolicy,
  isCreate: boolean,
  now: string,
): string | null {
  const seo = record.seo;
  if (!seo || (!seo.title && !seo.description)) {
    return existingSeoId ?? null;
  }
  if (!isCreate && conflictPolicy === 'merge' && existingSeoId) {
    return existingSeoId;
  }

  const title = (seo.title ?? null)?.slice(0, 70) || null;
  const description = (seo.description ?? null)?.slice(0, 160) || null;

  if (existingSeoId) {
    statements.push(
      db
        .update(seoMeta)
        .set({
          title,
          description,
          updatedAt: now,
        })
        .where(eq(seoMeta.id, existingSeoId)),
    );
    return existingSeoId;
  }

  const id = newId('seo');
  statements.push(
    db.insert(seoMeta).values({
      id,
      title,
      description,
      canonical: null,
      ogImageMediaId: null,
      ogImageUrl: null,
      noindex: false,
      robotsExtra: null,
      createdAt: now,
      updatedAt: now,
    }),
  );
  return id;
}

async function loadProductIndex(db: Db): Promise<ProductIndex> {
  const rows = await db.select().from(products);
  const bySku = new Map<string, Product>();
  const bySlug = new Map<string, Product>();
  for (const row of rows) {
    if (row.sku) bySku.set(row.sku, row);
    bySlug.set(row.slug, row);
  }
  return { bySku, bySlug };
}

function findExistingInIndex(
  index: ProductIndex,
  record: ImportRecord,
  slug: string,
): Product | null {
  if (record.sku) {
    const bySku = index.bySku.get(record.sku);
    if (bySku) return bySku;
  }
  return index.bySlug.get(slug) ?? null;
}

function indexProduct(index: ProductIndex, product: Product) {
  if (product.sku) index.bySku.set(product.sku, product);
  index.bySlug.set(product.slug, product);
}

function normalizeMedia(
  media: ImportRecord['media'],
): { sourceUrl: string; position: number; isPrimary: boolean }[] {
  if (!media?.length) return [];
  return media
    .filter((m) => Boolean(m.url))
    .map((m, i) => ({
      sourceUrl: m.url,
      position: typeof m.position === 'number' ? m.position : i,
      isPrimary: typeof m.isPrimary === 'boolean' ? m.isPrimary : i === 0,
    }));
}

function mergeFields(current: Product, record: ImportRecord) {
  return {
    name: record.name || current.name,
    description: record.description || current.description,
    price: record.price ?? current.price,
    compareAtPrice: record.compareAtPrice ?? current.compareAtPrice,
    stock: record.stock ?? current.stock,
  };
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}
