import { and, asc, count, eq, ne } from 'drizzle-orm';
import {
  brands,
  media,
  productVariants,
  products,
  type Product,
  type ProductVariant,
} from '../../../db/schema';
import type { Db } from '../db';
import { newId, nowIso } from '../../lib/utils/id';
import { mediaPublicPath, mediaTransformPath } from '../../lib/media/urls';

export type GridProduct = {
  id: string;
  slug: string;
  sku: string | null;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  status: Product['status'];
  brandId: string | null;
  brandName: string | null;
  imageUrl: string | null;
  updatedAt: string;
};

export async function listProductsForGrid(db: Db): Promise<GridProduct[]> {
  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      sku: products.sku,
      name: products.name,
      description: products.description,
      price: products.price,
      stock: products.stock,
      status: products.status,
      brandId: products.brandId,
      brandName: brands.name,
      mediaKey: media.key,
      mediaMime: media.mime,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .leftJoin(brands, eq(products.brandId, brands.id))
    .leftJoin(media, eq(products.primaryMediaId, media.id))
    .orderBy(asc(products.name));

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    sku: r.sku,
    name: r.name,
    description: r.description,
    price: r.price,
    stock: r.stock,
    status: r.status,
    brandId: r.brandId,
    brandName: r.brandName ?? null,
    imageUrl: r.mediaKey
      ? r.mediaMime === 'image/svg+xml'
        ? mediaPublicPath(r.mediaKey)
        : mediaTransformPath(r.mediaKey, 128)
      : null,
    updatedAt: r.updatedAt,
  }));
}

export async function getProductAdminById(db: Db, id: string) {
  const [row] = await db
    .select({
      product: products,
      brandName: brands.name,
    })
    .from(products)
    .leftJoin(brands, eq(products.brandId, brands.id))
    .where(eq(products.id, id))
    .limit(1);
  if (!row) return null;

  const variants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, id))
    .orderBy(asc(productVariants.position));

  return { ...row.product, brandName: row.brandName ?? null, variants };
}

export async function isProductSlugTaken(db: Db, slug: string, excludeId?: string) {
  const where = excludeId
    ? and(eq(products.slug, slug), ne(products.id, excludeId))
    : eq(products.slug, slug);
  const [row] = await db.select({ id: products.id }).from(products).where(where).limit(1);
  return Boolean(row);
}

export async function isProductSkuTaken(db: Db, sku: string, excludeId?: string) {
  const where = excludeId
    ? and(eq(products.sku, sku), ne(products.id, excludeId))
    : eq(products.sku, sku);
  const [row] = await db.select({ id: products.id }).from(products).where(where).limit(1);
  return Boolean(row);
}

export async function createProduct(
  db: Db,
  input: {
    name: string;
    slug: string;
    sku?: string | null;
    description?: string | null;
    price: number;
    compareAtPrice?: number | null;
    currency: string;
    stock: number;
    status: Product['status'];
    brandId?: string | null;
    seoId?: string | null;
    primaryMediaId?: string | null;
  },
): Promise<Product> {
  const now = nowIso();
  const id = newId('prod');
  await db.insert(products).values({
    id,
    name: input.name,
    slug: input.slug,
    sku: input.sku || null,
    description: input.description ?? null,
    price: input.price,
    compareAtPrice: input.compareAtPrice ?? null,
    currency: input.currency,
    stock: input.stock,
    status: input.status,
    brandId: input.brandId || null,
    seoId: input.seoId ?? null,
    primaryMediaId: input.primaryMediaId || null,
    publishedAt: input.status === 'published' ? now : null,
    createdAt: now,
    updatedAt: now,
  });
  const [created] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!created) throw new Error('Product create failed');
  return created;
}

export async function updateProductFields(
  db: Db,
  id: string,
  fields: Partial<{
    name: string;
    slug: string;
    sku: string | null;
    description: string | null;
    price: number;
    compareAtPrice: number | null;
    currency: string;
    stock: number;
    status: Product['status'];
    brandId: string | null;
    seoId: string | null;
    primaryMediaId: string | null;
  }>,
): Promise<Product | null> {
  const [existing] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!existing) return null;

  const nextStatus = fields.status ?? existing.status;
  const patch: Record<string, unknown> = {
    ...fields,
    updatedAt: nowIso(),
  };
  if (fields.status === 'published' && !existing.publishedAt) {
    patch.publishedAt = nowIso();
  }
  if (nextStatus !== 'published') {
    // keep publishedAt history
  }

  await db.update(products).set(patch).where(eq(products.id, id));
  const [updated] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return updated ?? null;
}

export async function deleteProduct(db: Db, id: string): Promise<Product | null> {
  const [existing] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!existing) return null;
  await db.delete(products).where(eq(products.id, id));
  return existing;
}

export async function countProducts(db: Db): Promise<number> {
  const [row] = await db.select({ value: count() }).from(products);
  return row?.value ?? 0;
}

export type { ProductVariant };
