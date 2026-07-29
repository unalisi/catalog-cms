import { and, asc, count, desc, eq, ne } from 'drizzle-orm';
import {
  brands,
  categories,
  media,
  pageSections,
  pages,
  products,
  type Brand,
  type Category,
} from '../../../db/schema';
import type { Db } from '../db';
import { newId, nowIso } from '../../lib/utils/id';
import { mediaPublicPath, mediaTransformPath } from '../../lib/media/urls';
import { isSectionType, sectionLabels } from '../../lib/sections/registry';

export type BrandListItem = Brand & { logoUrl: string | null };

export async function listAllBrands(db: Db): Promise<Brand[]> {
  return db.select().from(brands).orderBy(asc(brands.name));
}

export async function listAllBrandsWithLogos(db: Db): Promise<BrandListItem[]> {
  const rows = await db
    .select({
      brand: brands,
      mediaKey: media.key,
      mediaMime: media.mime,
    })
    .from(brands)
    .leftJoin(media, eq(brands.logoMediaId, media.id))
    .orderBy(asc(brands.name));
  return rows.map(({ brand, mediaKey, mediaMime }) => ({
    ...brand,
    logoUrl: mediaKey
      ? mediaMime === 'image/svg+xml'
        ? mediaPublicPath(mediaKey)
        : mediaTransformPath(mediaKey, 128)
      : null,
  }));
}

export async function getBrandById(db: Db, id: string): Promise<Brand | null> {
  const [row] = await db.select().from(brands).where(eq(brands.id, id)).limit(1);
  return row ?? null;
}

export async function isBrandSlugTaken(db: Db, slug: string, excludeId?: string) {
  const where = excludeId
    ? and(eq(brands.slug, slug), ne(brands.id, excludeId))
    : eq(brands.slug, slug);
  const [row] = await db.select({ id: brands.id }).from(brands).where(where).limit(1);
  return Boolean(row);
}

export async function createBrand(
  db: Db,
  input: {
    name: string;
    slug: string;
    description?: string | null;
    status: Brand['status'];
    seoId?: string | null;
  },
): Promise<Brand> {
  const now = nowIso();
  const id = newId('brand');
  await db.insert(brands).values({
    id,
    name: input.name,
    slug: input.slug,
    description: input.description ?? null,
    status: input.status,
    seoId: input.seoId ?? null,
    createdAt: now,
    updatedAt: now,
  });
  const created = await getBrandById(db, id);
  if (!created) throw new Error('Brand create failed');
  return created;
}

export async function updateBrand(
  db: Db,
  id: string,
  input: {
    name: string;
    slug: string;
    description?: string | null;
    status: Brand['status'];
    seoId?: string | null;
  },
): Promise<Brand | null> {
  await db
    .update(brands)
    .set({
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      status: input.status,
      ...(input.seoId !== undefined ? { seoId: input.seoId } : {}),
      updatedAt: nowIso(),
    })
    .where(eq(brands.id, id));
  return getBrandById(db, id);
}

export async function deleteBrand(db: Db, id: string): Promise<Brand | null> {
  const existing = await getBrandById(db, id);
  if (!existing) return null;
  await db.update(products).set({ brandId: null }).where(eq(products.brandId, id));
  await db.delete(brands).where(eq(brands.id, id));
  return existing;
}

export async function listAllCategories(db: Db): Promise<Category[]> {
  return db
    .select()
    .from(categories)
    .orderBy(asc(categories.position), asc(categories.name));
}

export async function getCategoryById(db: Db, id: string): Promise<Category | null> {
  const [row] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return row ?? null;
}

export async function isCategorySlugTaken(db: Db, slug: string, excludeId?: string) {
  const where = excludeId
    ? and(eq(categories.slug, slug), ne(categories.id, excludeId))
    : eq(categories.slug, slug);
  const [row] = await db.select({ id: categories.id }).from(categories).where(where).limit(1);
  return Boolean(row);
}

export async function createCategory(
  db: Db,
  input: {
    name: string;
    slug: string;
    description?: string | null;
    parentId?: string | null;
    position: number;
    status: Category['status'];
    seoId?: string | null;
  },
): Promise<Category> {
  const now = nowIso();
  const id = newId('cat');
  await db.insert(categories).values({
    id,
    name: input.name,
    slug: input.slug,
    description: input.description ?? null,
    parentId: input.parentId || null,
    position: input.position,
    status: input.status,
    seoId: input.seoId ?? null,
    createdAt: now,
    updatedAt: now,
  });
  const created = await getCategoryById(db, id);
  if (!created) throw new Error('Category create failed');
  return created;
}

export async function updateCategory(
  db: Db,
  id: string,
  input: {
    name: string;
    slug: string;
    description?: string | null;
    parentId?: string | null;
    position: number;
    status: Category['status'];
    seoId?: string | null;
  },
): Promise<Category | null> {
  await db
    .update(categories)
    .set({
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      parentId: input.parentId || null,
      position: input.position,
      status: input.status,
      ...(input.seoId !== undefined ? { seoId: input.seoId } : {}),
      updatedAt: nowIso(),
    })
    .where(eq(categories.id, id));
  return getCategoryById(db, id);
}

export async function deleteCategory(db: Db, id: string): Promise<Category | null> {
  const existing = await getCategoryById(db, id);
  if (!existing) return null;
  await db.update(categories).set({ parentId: null }).where(eq(categories.parentId, id));
  await db.delete(categories).where(eq(categories.id, id));
  return existing;
}

export async function getDashboardCounts(db: Db) {
  const [[productsCount], [brandsCount], [categoriesCount]] = await Promise.all([
    db.select({ value: count() }).from(products),
    db.select({ value: count() }).from(brands),
    db.select({ value: count() }).from(categories),
  ]);
  return {
    products: productsCount?.value ?? 0,
    brands: brandsCount?.value ?? 0,
    categories: categoriesCount?.value ?? 0,
  };
}

export async function getDashboardOverview(db: Db) {
  const [
    [productsTotal],
    [published],
    [draft],
    [archived],
    [brandsCount],
    recentProducts,
    homePage,
  ] = await Promise.all([
    db.select({ value: count() }).from(products),
    db
      .select({ value: count() })
      .from(products)
      .where(eq(products.status, 'published')),
    db.select({ value: count() }).from(products).where(eq(products.status, 'draft')),
    db.select({ value: count() }).from(products).where(eq(products.status, 'archived')),
    db.select({ value: count() }).from(brands),
    db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        status: products.status,
        brandName: brands.name,
      })
      .from(products)
      .leftJoin(brands, eq(products.brandId, brands.id))
      .orderBy(desc(products.updatedAt))
      .limit(4),
    db.select().from(pages).where(eq(pages.slug, 'home')).limit(1),
  ]);

  const home = homePage[0] ?? null;
  let homeSections: {
    id: string;
    type: string;
    typeLabel: string;
    title: string;
    status: 'published' | 'draft' | 'archived';
  }[] = [];

  if (home) {
    const sections = await db
      .select()
      .from(pageSections)
      .where(eq(pageSections.pageId, home.id))
      .orderBy(asc(pageSections.position))
      .limit(4);

    homeSections = sections.map((s, index) => {
      let title = '';
      try {
        const cfg = JSON.parse(s.configJson) as { title?: string };
        title = cfg.title?.trim() || '';
      } catch {
        title = '';
      }
      const typeLabel = isSectionType(s.type) ? sectionLabels[s.type] : s.type;
      const status: 'published' | 'draft' | 'archived' = !s.isVisible
        ? 'archived'
        : home.status === 'draft'
          ? 'draft'
          : 'published';
      return {
        id: s.id,
        type: s.type,
        typeLabel,
        title: title || `Bölüm ${String(index + 1).padStart(2, '0')}`,
        status,
      };
    });
  }

  const total = productsTotal?.value ?? 0;
  const publishedCount = published?.value ?? 0;
  const coverage =
    total > 0 ? Math.round((publishedCount / total) * 100) : 0;

  return {
    products: total,
    published: publishedCount,
    draft: draft?.value ?? 0,
    archived: archived?.value ?? 0,
    brands: brandsCount?.value ?? 0,
    coverage,
    recentProducts,
    homeSections,
    homePageId: home?.id ?? null,
  };
}
