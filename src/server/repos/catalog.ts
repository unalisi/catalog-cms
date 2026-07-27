import { and, asc, count, eq, inArray } from 'drizzle-orm';
import {
  brands,
  categories,
  pages,
  productCategories,
  products,
  productVariants,
  seoMeta,
  type Brand,
  type Category,
  type ProductVariant,
  type SeoMeta,
} from '../../../db/schema';
import type { Db } from '../db';
import { listPublishedPostsForSitemap } from './posts';

export type ProductListItem = {
  id: string;
  slug: string;
  sku: string | null;
  name: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  stock: number;
  brand: { id: string; slug: string; name: string } | null;
};

export type ProductDetail = ProductListItem & {
  updatedAt: string;
  publishedAt: string | null;
  categories: { id: string; slug: string; name: string }[];
  variants: ProductVariant[];
  seo: SeoMeta | null;
};

export type BrandDetail = Brand & {
  productCount: number;
  seo: SeoMeta | null;
};

export type CategoryDetail = Category & {
  productCount: number;
  children: { id: string; slug: string; name: string }[];
  seo: SeoMeta | null;
};

export async function listPublishedProducts(
  db: Db,
  opts: { page: number; pageSize: number; brandSlug?: string; categorySlug?: string },
): Promise<{ items: ProductListItem[]; total: number }> {
  const offset = (opts.page - 1) * opts.pageSize;

  let brandId: string | undefined;
  if (opts.brandSlug) {
    const [brand] = await db
      .select()
      .from(brands)
      .where(and(eq(brands.slug, opts.brandSlug), eq(brands.status, 'published')))
      .limit(1);
    if (!brand) return { items: [], total: 0 };
    brandId = brand.id;
  }

  let productIdsFilter: string[] | undefined;
  if (opts.categorySlug) {
    const [category] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.slug, opts.categorySlug), eq(categories.status, 'published')))
      .limit(1);
    if (!category) return { items: [], total: 0 };
    const links = await db
      .select({ productId: productCategories.productId })
      .from(productCategories)
      .where(eq(productCategories.categoryId, category.id));
    productIdsFilter = links.map((l) => l.productId);
    if (productIdsFilter.length === 0) return { items: [], total: 0 };
  }

  const conditions = [eq(products.status, 'published')];
  if (brandId) conditions.push(eq(products.brandId, brandId));
  if (productIdsFilter) conditions.push(inArray(products.id, productIdsFilter));
  const where = and(...conditions);

  const [totalRow] = await db.select({ value: count() }).from(products).where(where);
  const rows = await db
    .select({
      product: products,
      brand: brands,
    })
    .from(products)
    .leftJoin(brands, eq(products.brandId, brands.id))
    .where(where)
    .orderBy(asc(products.name))
    .limit(opts.pageSize)
    .offset(offset);

  return {
    total: totalRow?.value ?? 0,
    items: rows.map(({ product, brand }) => ({
      id: product.id,
      slug: product.slug,
      sku: product.sku,
      name: product.name,
      description: product.description,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      currency: product.currency,
      stock: product.stock,
      brand: brand ? { id: brand.id, slug: brand.slug, name: brand.name } : null,
    })),
  };
}

export async function getPublishedProductBySlug(
  db: Db,
  slug: string,
): Promise<ProductDetail | null> {
  const [row] = await db
    .select({
      product: products,
      brand: brands,
      seo: seoMeta,
    })
    .from(products)
    .leftJoin(brands, eq(products.brandId, brands.id))
    .leftJoin(seoMeta, eq(products.seoId, seoMeta.id))
    .where(and(eq(products.slug, slug), eq(products.status, 'published')))
    .limit(1);

  if (!row) return null;

  const variantRows = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, row.product.id))
    .orderBy(asc(productVariants.position));

  const categoryRows = await db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
    })
    .from(productCategories)
    .innerJoin(categories, eq(productCategories.categoryId, categories.id))
    .where(
      and(eq(productCategories.productId, row.product.id), eq(categories.status, 'published')),
    );

  return {
    id: row.product.id,
    slug: row.product.slug,
    sku: row.product.sku,
    name: row.product.name,
    description: row.product.description,
    price: row.product.price,
    compareAtPrice: row.product.compareAtPrice,
    currency: row.product.currency,
    stock: row.product.stock,
    updatedAt: row.product.updatedAt,
    publishedAt: row.product.publishedAt,
    brand: row.brand
      ? { id: row.brand.id, slug: row.brand.slug, name: row.brand.name }
      : null,
    categories: categoryRows,
    variants: variantRows,
    seo: row.seo,
  };
}

export async function getPublishedBrandBySlug(db: Db, slug: string): Promise<BrandDetail | null> {
  const [brand] = await db
    .select()
    .from(brands)
    .where(and(eq(brands.slug, slug), eq(brands.status, 'published')))
    .limit(1);
  if (!brand) return null;

  const [seo] = brand.seoId
    ? await db.select().from(seoMeta).where(eq(seoMeta.id, brand.seoId)).limit(1)
    : [null];

  const [countRow] = await db
    .select({ value: count() })
    .from(products)
    .where(and(eq(products.brandId, brand.id), eq(products.status, 'published')));

  return {
    ...brand,
    productCount: countRow?.value ?? 0,
    seo: seo ?? null,
  };
}

export async function listPublishedBrands(db: Db): Promise<Brand[]> {
  return db
    .select()
    .from(brands)
    .where(eq(brands.status, 'published'))
    .orderBy(asc(brands.name));
}

export async function getPublishedCategoryBySlug(
  db: Db,
  slug: string,
): Promise<CategoryDetail | null> {
  const [category] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.slug, slug), eq(categories.status, 'published')))
    .limit(1);
  if (!category) return null;

  const [seo] = category.seoId
    ? await db.select().from(seoMeta).where(eq(seoMeta.id, category.seoId)).limit(1)
    : [null];

  const children = await db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
    })
    .from(categories)
    .where(and(eq(categories.parentId, category.id), eq(categories.status, 'published')))
    .orderBy(asc(categories.position), asc(categories.name));

  const links = await db
    .select({ productId: productCategories.productId })
    .from(productCategories)
    .where(eq(productCategories.categoryId, category.id));

  let productCount = 0;
  if (links.length > 0) {
    const [countRow] = await db
      .select({ value: count() })
      .from(products)
      .where(
        and(
          inArray(
            products.id,
            links.map((l) => l.productId),
          ),
          eq(products.status, 'published'),
        ),
      );
    productCount = countRow?.value ?? 0;
  }

  return {
    ...category,
    productCount,
    children,
    seo: seo ?? null,
  };
}

export async function listPublishedCategories(db: Db): Promise<Category[]> {
  return db
    .select()
    .from(categories)
    .where(eq(categories.status, 'published'))
    .orderBy(asc(categories.position), asc(categories.name));
}

export async function listSitemapEntries(db: Db) {
  const [productRows, brandRows, categoryRows, pageRows, postRows] = await Promise.all([
    db
      .select({
        slug: products.slug,
        updatedAt: products.updatedAt,
        seoId: products.seoId,
      })
      .from(products)
      .where(eq(products.status, 'published')),
    db
      .select({
        slug: brands.slug,
        updatedAt: brands.updatedAt,
        seoId: brands.seoId,
      })
      .from(brands)
      .where(eq(brands.status, 'published')),
    db
      .select({
        slug: categories.slug,
        updatedAt: categories.updatedAt,
        seoId: categories.seoId,
      })
      .from(categories)
      .where(eq(categories.status, 'published')),
    db
      .select({
        slug: pages.slug,
        updatedAt: pages.updatedAt,
        seoId: pages.seoId,
      })
      .from(pages)
      .where(eq(pages.status, 'published')),
    listPublishedPostsForSitemap(db),
  ]);

  const seoIds = [
    ...productRows.map((r) => r.seoId),
    ...brandRows.map((r) => r.seoId),
    ...categoryRows.map((r) => r.seoId),
    ...pageRows.map((r) => r.seoId),
    ...postRows.map((r) => r.seoId),
  ].filter((id): id is string => Boolean(id));

  const seoRows =
    seoIds.length > 0
      ? await db.select().from(seoMeta).where(inArray(seoMeta.id, seoIds))
      : [];
  const seoById = new Map(seoRows.map((s) => [s.id, s]));

  const urls: { loc: string; lastmod: string }[] = [
    { loc: '/catalog', lastmod: new Date().toISOString() },
    { loc: '/blog', lastmod: new Date().toISOString() },
  ];

  for (const row of pageRows) {
    const seo = row.seoId ? seoById.get(row.seoId) : undefined;
    if (seo?.noindex) continue;
    const loc = row.slug === 'home' ? '/' : `/${row.slug}`;
    // Only home is publicly routed in FAZ 4/5
    if (row.slug !== 'home') continue;
    urls.unshift({ loc, lastmod: row.updatedAt });
  }

  // Fallback home if no published home page row
  if (!urls.some((u) => u.loc === '/')) {
    urls.unshift({ loc: '/', lastmod: new Date().toISOString() });
  }

  for (const row of productRows) {
    const seo = row.seoId ? seoById.get(row.seoId) : undefined;
    if (seo?.noindex) continue;
    urls.push({ loc: `/product/${row.slug}`, lastmod: row.updatedAt });
  }
  for (const row of brandRows) {
    const seo = row.seoId ? seoById.get(row.seoId) : undefined;
    if (seo?.noindex) continue;
    urls.push({ loc: `/brand/${row.slug}`, lastmod: row.updatedAt });
  }
  for (const row of categoryRows) {
    const seo = row.seoId ? seoById.get(row.seoId) : undefined;
    if (seo?.noindex) continue;
    urls.push({ loc: `/category/${row.slug}`, lastmod: row.updatedAt });
  }
  for (const row of postRows) {
    const seo = row.seoId ? seoById.get(row.seoId) : undefined;
    if (seo?.noindex) continue;
    urls.push({
      loc: `/blog/${row.slug}`,
      lastmod: row.updatedAt || row.publishedAt || new Date().toISOString(),
    });
  }

  return urls;
}
