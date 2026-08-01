import { and, asc, eq, gt, inArray, type SQL } from 'drizzle-orm';
import {
  brands,
  categories,
  media,
  productCategories,
  productMedia,
  products,
} from '../../../db/schema';
import { mediaPublicPath } from '../../lib/media/urls';
import type { Db } from '../db';

export type ExportFilter = {
  status?: 'draft' | 'published' | 'archived';
  brandId?: string;
  categoryId?: string;
};

export type ProductExportRecord = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  stock: number;
  description: string;
  status: string;
  brandName: string | null;
  categoryNames: string[];
  mediaUrls: string[];
};

const PAGE_SIZE = 200;

function absolutize(pathOrUrl: string, origin?: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  if (!origin) return path;
  return `${origin.replace(/\/$/, '')}${path}`;
}

type ProductPageRow = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  stock: number;
  description: string | null;
  status: 'draft' | 'published' | 'archived';
  brandName: string | null;
  primaryMediaId: string | null;
};

/**
 * Cursor-based product stream for export (id > lastId ASC).
 */
export async function* streamProducts(
  db: Db,
  filter: ExportFilter,
  origin?: string,
): AsyncGenerator<ProductExportRecord> {
  let lastId: string | null = null;

  while (true) {
    const conditions: SQL[] = [];
    if (filter.status) conditions.push(eq(products.status, filter.status));
    if (filter.brandId) conditions.push(eq(products.brandId, filter.brandId));
    if (lastId) conditions.push(gt(products.id, lastId));

    const page: ProductPageRow[] = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        sku: products.sku,
        price: products.price,
        compareAtPrice: products.compareAtPrice,
        currency: products.currency,
        stock: products.stock,
        description: products.description,
        status: products.status,
        brandName: brands.name,
        primaryMediaId: products.primaryMediaId,
      })
      .from(products)
      .leftJoin(brands, eq(products.brandId, brands.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(asc(products.id))
      .limit(PAGE_SIZE);

    if (page.length === 0) break;

    let filtered: ProductPageRow[] = page;
    if (filter.categoryId) {
      const ids = page.map((p) => p.id);
      const linked = await db
        .select({ productId: productCategories.productId })
        .from(productCategories)
        .where(
          and(
            inArray(productCategories.productId, ids),
            eq(productCategories.categoryId, filter.categoryId),
          ),
        );
      const allowed = new Set(linked.map((r) => r.productId));
      filtered = page.filter((p) => allowed.has(p.id));
    }

    if (filtered.length > 0) {
      const productIds = filtered.map((p) => p.id);

      const catRows = await db
        .select({
          productId: productCategories.productId,
          name: categories.name,
        })
        .from(productCategories)
        .innerJoin(categories, eq(productCategories.categoryId, categories.id))
        .where(inArray(productCategories.productId, productIds));

      const galleryRows = await db
        .select({
          productId: productMedia.productId,
          key: media.key,
          url: media.url,
          position: productMedia.position,
        })
        .from(productMedia)
        .innerJoin(media, eq(productMedia.mediaId, media.id))
        .where(inArray(productMedia.productId, productIds));

      galleryRows.sort((a, b) => a.position - b.position);

      const primaryIds = filtered
        .map((p) => p.primaryMediaId)
        .filter((id): id is string => Boolean(id));
      const primaryMediaRows =
        primaryIds.length > 0
          ? await db
              .select({ id: media.id, key: media.key, url: media.url })
              .from(media)
              .where(inArray(media.id, primaryIds))
          : [];
      const primaryById = new Map(primaryMediaRows.map((m) => [m.id, m]));

      const catsByProduct = new Map<string, string[]>();
      for (const c of catRows) {
        const list = catsByProduct.get(c.productId) ?? [];
        list.push(c.name);
        catsByProduct.set(c.productId, list);
      }

      const imagesByProduct = new Map<string, string[]>();
      for (const g of galleryRows) {
        const src = absolutize(g.url || mediaPublicPath(g.key), origin);
        const list = imagesByProduct.get(g.productId) ?? [];
        list.push(src);
        imagesByProduct.set(g.productId, list);
      }
      for (const p of filtered) {
        if (imagesByProduct.has(p.id)) continue;
        if (!p.primaryMediaId) continue;
        const m = primaryById.get(p.primaryMediaId);
        if (!m) continue;
        imagesByProduct.set(p.id, [absolutize(m.url || mediaPublicPath(m.key), origin)]);
      }

      for (const p of filtered) {
        yield {
          id: p.id,
          name: p.name,
          slug: p.slug,
          sku: p.sku,
          price: p.price,
          compareAtPrice: p.compareAtPrice,
          currency: p.currency,
          stock: p.stock,
          description: p.description ?? '',
          status: p.status,
          brandName: p.brandName ?? null,
          categoryNames: catsByProduct.get(p.id) ?? [],
          mediaUrls: imagesByProduct.get(p.id) ?? [],
        };
      }
    }

    lastId = page[page.length - 1].id;
    if (page.length < PAGE_SIZE) break;
  }
}
