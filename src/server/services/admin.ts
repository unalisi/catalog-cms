import { brandSchema, categorySchema, zodFieldErrors } from '../../lib/validation/admin';
import { invalidateBrandCache, invalidateCategoryCache } from '../../lib/cache/invalidate';
import { getDb } from '../db';
import * as adminRepo from '../repos/admin';

export async function createBrand(input: unknown) {
  const parsed = brandSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, fields: zodFieldErrors(parsed.error) };
  }
  const db = getDb();
  if (await adminRepo.isBrandSlugTaken(db, parsed.data.slug)) {
    return { ok: false as const, fields: { slug: 'Bu slug zaten kullanılıyor' } };
  }
  const brand = await adminRepo.createBrand(db, parsed.data);
  await invalidateBrandCache(brand.slug);
  return { ok: true as const, data: brand };
}

export async function updateBrand(id: string, input: unknown) {
  const parsed = brandSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, fields: zodFieldErrors(parsed.error) };
  }
  const db = getDb();
  const existing = await adminRepo.getBrandById(db, id);
  if (!existing) return { ok: false as const, notFound: true as const };
  if (await adminRepo.isBrandSlugTaken(db, parsed.data.slug, id)) {
    return { ok: false as const, fields: { slug: 'Bu slug zaten kullanılıyor' } };
  }
  const brand = await adminRepo.updateBrand(db, id, parsed.data);
  if (!brand) return { ok: false as const, notFound: true as const };
  await invalidateBrandCache(brand.slug, existing.slug);
  return { ok: true as const, data: brand };
}

export async function removeBrand(id: string) {
  const db = getDb();
  const deleted = await adminRepo.deleteBrand(db, id);
  if (!deleted) return { ok: false as const, notFound: true as const };
  await invalidateBrandCache(deleted.slug);
  return { ok: true as const, data: deleted };
}

export async function createCategory(input: unknown) {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, fields: zodFieldErrors(parsed.error) };
  }
  const db = getDb();
  if (parsed.data.parentId) {
    const parent = await adminRepo.getCategoryById(db, parsed.data.parentId);
    if (!parent) {
      return { ok: false as const, fields: { parentId: 'Üst kategori bulunamadı' } };
    }
  }
  if (await adminRepo.isCategorySlugTaken(db, parsed.data.slug)) {
    return { ok: false as const, fields: { slug: 'Bu slug zaten kullanılıyor' } };
  }
  const category = await adminRepo.createCategory(db, {
    ...parsed.data,
    parentId: parsed.data.parentId || null,
  });
  await invalidateCategoryCache(category.slug);
  return { ok: true as const, data: category };
}

export async function updateCategory(id: string, input: unknown) {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, fields: zodFieldErrors(parsed.error) };
  }
  if (parsed.data.parentId === id) {
    return { ok: false as const, fields: { parentId: 'Kategori kendisinin üstü olamaz' } };
  }
  const db = getDb();
  const existing = await adminRepo.getCategoryById(db, id);
  if (!existing) return { ok: false as const, notFound: true as const };
  if (parsed.data.parentId) {
    const parent = await adminRepo.getCategoryById(db, parsed.data.parentId);
    if (!parent) {
      return { ok: false as const, fields: { parentId: 'Üst kategori bulunamadı' } };
    }
  }
  if (await adminRepo.isCategorySlugTaken(db, parsed.data.slug, id)) {
    return { ok: false as const, fields: { slug: 'Bu slug zaten kullanılıyor' } };
  }
  const category = await adminRepo.updateCategory(db, id, {
    ...parsed.data,
    parentId: parsed.data.parentId || null,
  });
  if (!category) return { ok: false as const, notFound: true as const };
  await invalidateCategoryCache(category.slug, existing.slug);
  return { ok: true as const, data: category };
}

export async function removeCategory(id: string) {
  const db = getDb();
  const deleted = await adminRepo.deleteCategory(db, id);
  if (!deleted) return { ok: false as const, notFound: true as const };
  await invalidateCategoryCache(deleted.slug);
  return { ok: true as const, data: deleted };
}
