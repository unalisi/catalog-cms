import { env } from 'cloudflare:workers';
import { eq } from 'drizzle-orm';
import { brands, categories, productCategories, products, type Product } from '../../../db/schema';
import type { ConflictPolicy, ImportRecord } from '../../lib/import/types';
import { invalidateProductCache } from '../../lib/cache/invalidate';
import { ALLOWED_MIME, buildMediaObjectKey, extFromMime } from '../../lib/media/urls';
import { newId, nowIso, slugify } from '../../lib/utils/id';
import type { Db } from '../db';
import * as mediaRepo from '../repos/media';
import { replaceProductGallery } from '../repos/products-admin';
import { upsertSeoMeta } from '../repos/seo';

export type PendingMediaItem = { url: string; alt?: string };

export type ApplyItemResult =
  | { action: 'create' | 'update'; productId: string; pendingMedia: PendingMediaItem[] }
  | { action: 'skip' }
  | { action: 'error'; error: string };

/** In-memory taxonomy cache shared across a queue batch to avoid N+1 lookups. */
export type TaxonomyCache = {
  brands: Map<string, string>;
  categories: Map<string, string>;
};

export function createTaxonomyCache(): TaxonomyCache {
  return { brands: new Map(), categories: new Map() };
}

function pendingMediaFromRecord(record: ImportRecord): PendingMediaItem[] {
  return (record.media ?? [])
    .filter((m): m is { url: string; alt?: string } => Boolean(m.url))
    .map((m) => ({ url: m.url, alt: m.alt }));
}

/** Upsert key: SKU first, else slug. Optional maps avoid N+1 during batch apply. */
async function findExistingProduct(
  db: Db,
  record: ImportRecord,
  index?: { bySku: Map<string, Product>; bySlug: Map<string, Product> },
): Promise<Product | null> {
  if (index) {
    if (record.sku) {
      const bySku = index.bySku.get(record.sku);
      if (bySku) return bySku;
    }
    return index.bySlug.get(record.slug) ?? null;
  }
  if (record.sku) {
    const [bySku] = await db.select().from(products).where(eq(products.sku, record.sku)).limit(1);
    if (bySku) return bySku;
  }
  const [bySlug] = await db.select().from(products).where(eq(products.slug, record.slug)).limit(1);
  return bySlug ?? null;
}

export type ProductLookupIndex = {
  bySku: Map<string, Product>;
  bySlug: Map<string, Product>;
};

/** One-shot load of all products for fast SKU/slug checks during batch apply. */
export async function loadProductLookupIndex(db: Db): Promise<ProductLookupIndex> {
  const rows = await db.select().from(products);
  const bySku = new Map<string, Product>();
  const bySlug = new Map<string, Product>();
  for (const row of rows) {
    if (row.sku) bySku.set(row.sku, row);
    bySlug.set(row.slug, row);
  }
  return { bySku, bySlug };
}

async function ensureBrand(
  db: Db,
  name: string | null | undefined,
  cache?: TaxonomyCache,
): Promise<string | null> {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  const slug = slugify(trimmed);
  const cached = cache?.brands.get(slug);
  if (cached) return cached;

  const [existing] = await db.select().from(brands).where(eq(brands.slug, slug)).limit(1);
  if (existing) {
    if (existing.status !== 'published') {
      await db
        .update(brands)
        .set({ status: 'published', updatedAt: nowIso() })
        .where(eq(brands.id, existing.id));
    }
    cache?.brands.set(slug, existing.id);
    return existing.id;
  }

  const now = nowIso();
  const id = newId('brand');
  await db.insert(brands).values({
    id,
    slug,
    name: trimmed,
    description: null,
    status: 'published',
    createdAt: now,
    updatedAt: now,
  });
  cache?.brands.set(slug, id);
  return id;
}

async function ensureCategories(
  db: Db,
  names: string[] | undefined,
  cache?: TaxonomyCache,
): Promise<string[]> {
  if (!names || names.length === 0) return [];
  const ids: string[] = [];
  for (const rawName of names) {
    const name = rawName.trim();
    if (!name) continue;
    const slug = slugify(name);
    const cached = cache?.categories.get(slug);
    if (cached) {
      ids.push(cached);
      continue;
    }
    const [existing] = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
    if (existing) {
      if (existing.status !== 'published') {
        await db
          .update(categories)
          .set({ status: 'published', updatedAt: nowIso() })
          .where(eq(categories.id, existing.id));
      }
      cache?.categories.set(slug, existing.id);
      ids.push(existing.id);
      continue;
    }
    const now = nowIso();
    const id = newId('cat');
    await db.insert(categories).values({
      id,
      slug,
      name,
      parentId: null,
      description: null,
      position: 0,
      status: 'published',
      createdAt: now,
      updatedAt: now,
    });
    cache?.categories.set(slug, id);
    ids.push(id);
  }
  return ids;
}

async function linkProductCategories(
  db: Db,
  productId: string,
  categoryIds: string[],
): Promise<void> {
  await db.delete(productCategories).where(eq(productCategories.productId, productId));
  if (categoryIds.length === 0) return;
  await db
    .insert(productCategories)
    .values(categoryIds.map((categoryId) => ({ productId, categoryId })));
}

/** Fetches a remote image and copies it into R2, creating a `media` row. */
async function importRemoteMedia(db: Db, url: string, alt: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const contentType = (response.headers.get('content-type') || '')
      .split(';')[0]
      .trim()
      .toLowerCase();
    const mime = ALLOWED_MIME.has(contentType) ? contentType : 'image/jpeg';
    if (!ALLOWED_MIME.has(mime)) return null;

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength === 0) return null;

    const key = buildMediaObjectKey(extFromMime(mime));
    await env.MEDIA.put(key, buffer, {
      httpMetadata: { contentType: mime },
      customMetadata: { alt },
    });

    const record = await mediaRepo.createMediaRecord(db, {
      key,
      alt: alt || 'import',
      mime,
      sizeBytes: buffer.byteLength,
      source: 'import',
    });
    return record.id;
  } catch {
    return null;
  }
}

/** Import all media URLs; skip failures and preserve successful order. */
async function importGalleryMedia(
  db: Db,
  mediaItems: PendingMediaItem[] | ImportRecord['media'],
  fallbackAlt: string,
): Promise<string[]> {
  if (!mediaItems?.length) return [];
  const ids: string[] = [];
  for (const item of mediaItems) {
    if (!item.url) continue;
    const mediaId = await importRemoteMedia(db, item.url, item.alt || fallbackAlt);
    if (mediaId) ids.push(mediaId);
  }
  return ids;
}

async function resolveSeoId(
  db: Db,
  existingSeoId: string | null | undefined,
  record: ImportRecord,
  conflictPolicy: ConflictPolicy,
  isCreate: boolean,
): Promise<string | null> {
  const seo = record.seo;
  if (!seo || (!seo.title && !seo.description)) {
    return existingSeoId ?? null;
  }
  if (!isCreate && conflictPolicy === 'merge' && existingSeoId) {
    return existingSeoId;
  }
  return upsertSeoMeta(db, existingSeoId, {
    title: (seo.title ?? null)?.slice(0, 70) || null,
    description: (seo.description ?? null)?.slice(0, 160) || null,
  });
}

/**
 * Applies product fields only (no remote image fetch). Media is deferred to the
 * `media` queue message so catalog rows appear within seconds.
 */
export async function applyImportRecord(
  db: Db,
  record: ImportRecord,
  conflictPolicy: ConflictPolicy,
  cache?: TaxonomyCache,
  productIndex?: ProductLookupIndex,
): Promise<ApplyItemResult> {
  try {
    const existing = await findExistingProduct(db, record, productIndex);

    if (existing && conflictPolicy === 'skip') {
      return { action: 'skip' };
    }

    const brandId = await ensureBrand(db, record.brand, cache);
    const categoryIds = await ensureCategories(db, record.categories, cache);
    const pendingMedia = pendingMediaFromRecord(record);
    const now = nowIso();
    const compareAtPrice =
      record.compareAtPrice !== undefined && record.compareAtPrice !== null
        ? record.compareAtPrice
        : null;

    if (!existing) {
      const id = newId('prod');
      const seoId = await resolveSeoId(db, null, record, conflictPolicy, true);
      await db.insert(products).values({
        id,
        slug: record.slug,
        sku: record.sku || null,
        name: record.name,
        description: record.description ?? null,
        price: record.price,
        compareAtPrice,
        currency: 'TRY',
        stock: record.stock,
        status: record.status,
        brandId,
        seoId,
        primaryMediaId: null,
        publishedAt: record.status === 'published' ? now : null,
        createdAt: now,
        updatedAt: now,
      });

      await linkProductCategories(db, id, categoryIds);
      await invalidateProductCache(record.slug);
      return { action: 'create', productId: id, pendingMedia };
    }

    const seoId = await resolveSeoId(db, existing.seoId, record, conflictPolicy, false);

    const shouldQueueMedia =
      pendingMedia.length > 0 &&
      (conflictPolicy === 'overwrite' ||
        (conflictPolicy === 'merge' && !existing.primaryMediaId));

    const patch: Record<string, unknown> =
      conflictPolicy === 'overwrite'
        ? {
            slug: record.slug,
            name: record.name,
            sku: record.sku || existing.sku,
            description: record.description ?? null,
            price: record.price,
            compareAtPrice,
            stock: record.stock,
            status: record.status,
            brandId,
            seoId,
            updatedAt: now,
          }
        : {
            name: existing.name || record.name,
            sku: existing.sku || record.sku || null,
            description: existing.description ?? record.description ?? null,
            price: existing.price || record.price,
            compareAtPrice: existing.compareAtPrice ?? compareAtPrice,
            stock: existing.stock || record.stock,
            status: existing.status,
            brandId: existing.brandId ?? brandId,
            seoId: existing.seoId ?? seoId,
            updatedAt: now,
          };

    if (patch.status === 'published' && !existing.publishedAt) {
      patch.publishedAt = now;
    }

    await db.update(products).set(patch).where(eq(products.id, existing.id));
    if (categoryIds.length > 0) {
      await linkProductCategories(db, existing.id, categoryIds);
    }

    const newSlug = typeof patch.slug === 'string' ? patch.slug : existing.slug;
    const previousSlug = newSlug !== existing.slug ? existing.slug : undefined;
    await invalidateProductCache(newSlug, previousSlug);
    return {
      action: 'update',
      productId: existing.id,
      pendingMedia: shouldQueueMedia ? pendingMedia : [],
    };
  } catch (err) {
    return { action: 'error', error: err instanceof Error ? err.message : 'Bilinmeyen hata' };
  }
}

/**
 * Background gallery import for a product created/updated by apply.
 * Fetches remote URLs into R2 and writes `product_media` + `primaryMediaId`.
 */
export async function applyProductMediaGallery(
  db: Db,
  productId: string,
  mediaItems: PendingMediaItem[],
  fallbackAlt: string,
): Promise<{ ok: true; mediaCount: number } | { ok: false; error: string }> {
  try {
    const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    if (!product) return { ok: false, error: 'Ürün bulunamadı' };

    const importedMediaIds = await importGalleryMedia(
      db,
      mediaItems,
      fallbackAlt || product.name,
    );
    if (importedMediaIds.length === 0) {
      return { ok: true, mediaCount: 0 };
    }

    const primaryMediaId = await replaceProductGallery(db, productId, importedMediaIds);
    await db
      .update(products)
      .set({ primaryMediaId, updatedAt: nowIso() })
      .where(eq(products.id, productId));
    await invalidateProductCache(product.slug);
    return { ok: true, mediaCount: importedMediaIds.length };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Medya import hatası' };
  }
}
