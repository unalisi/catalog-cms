import { env } from 'cloudflare:workers';
import { eq } from 'drizzle-orm';
import { brands, categories, productCategories, products, type Product } from '../../../db/schema';
import type { ConflictPolicy, ImportRecord } from '../../lib/import/types';
import { invalidateProductCache } from '../../lib/cache/invalidate';
import { ALLOWED_MIME, buildMediaObjectKey, extFromMime } from '../../lib/media/urls';
import { newId, nowIso, slugify } from '../../lib/utils/id';
import type { Db } from '../db';
import * as mediaRepo from '../repos/media';

export type ApplyItemResult =
  | { action: 'create' | 'update'; productId: string }
  | { action: 'skip' }
  | { action: 'error'; error: string };

/** Upsert key: SKU first, else slug. */
async function findExistingProduct(db: Db, record: ImportRecord): Promise<Product | null> {
  if (record.sku) {
    const [bySku] = await db.select().from(products).where(eq(products.sku, record.sku)).limit(1);
    if (bySku) return bySku;
  }
  const [bySlug] = await db.select().from(products).where(eq(products.slug, record.slug)).limit(1);
  return bySlug ?? null;
}

async function ensureBrand(db: Db, name: string | null | undefined): Promise<string | null> {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  const slug = slugify(trimmed);
  const [existing] = await db.select().from(brands).where(eq(brands.slug, slug)).limit(1);
  if (existing) return existing.id;

  const now = nowIso();
  const id = newId('brand');
  await db.insert(brands).values({
    id,
    slug,
    name: trimmed,
    description: null,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

async function ensureCategories(db: Db, names: string[] | undefined): Promise<string[]> {
  if (!names || names.length === 0) return [];
  const ids: string[] = [];
  for (const rawName of names) {
    const name = rawName.trim();
    if (!name) continue;
    const slug = slugify(name);
    const [existing] = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
    if (existing) {
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
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    });
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

/**
 * Applies a single normalized `ImportRecord` to the catalog: finds an existing product
 * by SKU then slug, resolves brand/category links, copies the first media item to R2,
 * and upserts the product row according to `conflictPolicy`.
 */
export async function applyImportRecord(
  db: Db,
  record: ImportRecord,
  conflictPolicy: ConflictPolicy,
): Promise<ApplyItemResult> {
  try {
    const existing = await findExistingProduct(db, record);

    if (existing && conflictPolicy === 'skip') {
      return { action: 'skip' };
    }

    const brandId = await ensureBrand(db, record.brand);
    const categoryIds = await ensureCategories(db, record.categories);

    let primaryMediaId: string | null = existing?.primaryMediaId ?? null;
    const firstImage = record.media?.[0];
    if (firstImage?.url) {
      const mediaId = await importRemoteMedia(db, firstImage.url, firstImage.alt || record.name);
      if (mediaId) primaryMediaId = mediaId;
    }

    const now = nowIso();

    if (!existing) {
      const id = newId('prod');
      await db.insert(products).values({
        id,
        slug: record.slug,
        sku: record.sku || null,
        name: record.name,
        description: record.description ?? null,
        price: record.price,
        compareAtPrice: null,
        currency: 'TRY',
        stock: record.stock,
        status: record.status,
        brandId,
        seoId: null,
        primaryMediaId,
        publishedAt: record.status === 'published' ? now : null,
        createdAt: now,
        updatedAt: now,
      });
      await linkProductCategories(db, id, categoryIds);
      await invalidateProductCache(record.slug);
      return { action: 'create', productId: id };
    }

    const patch: Record<string, unknown> =
      conflictPolicy === 'overwrite'
        ? {
            slug: record.slug,
            name: record.name,
            sku: record.sku || existing.sku,
            description: record.description ?? null,
            price: record.price,
            stock: record.stock,
            status: record.status,
            brandId,
            primaryMediaId,
            updatedAt: now,
          }
        : {
            // merge: fill blanks on the existing product, don't clobber populated fields
            name: existing.name || record.name,
            sku: existing.sku || record.sku || null,
            description: existing.description ?? record.description ?? null,
            price: existing.price || record.price,
            stock: existing.stock || record.stock,
            status: existing.status,
            brandId: existing.brandId ?? brandId,
            primaryMediaId: existing.primaryMediaId ?? primaryMediaId,
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
    return { action: 'update', productId: existing.id };
  } catch (err) {
    return { action: 'error', error: err instanceof Error ? err.message : 'Bilinmeyen hata' };
  }
}
