import { and, asc, count, eq, ne } from 'drizzle-orm';
import { brands, categories, products, type Brand, type Category } from '../../../db/schema';
import type { Db } from '../db';
import { newId, nowIso } from '../../lib/utils/id';

export async function listAllBrands(db: Db): Promise<Brand[]> {
  return db.select().from(brands).orderBy(asc(brands.name));
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
  input: { name: string; slug: string; description?: string | null; status: Brand['status'] },
): Promise<Brand> {
  const now = nowIso();
  const id = newId('brand');
  await db.insert(brands).values({
    id,
    name: input.name,
    slug: input.slug,
    description: input.description ?? null,
    status: input.status,
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
  input: { name: string; slug: string; description?: string | null; status: Brand['status'] },
): Promise<Brand | null> {
  await db
    .update(brands)
    .set({
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      status: input.status,
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
