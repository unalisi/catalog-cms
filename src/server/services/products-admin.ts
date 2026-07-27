import { productBulkSchema, productUpsertSchema } from '../../lib/validation/products';
import { zodFieldErrors } from '../../lib/validation/admin';
import { invalidateProductCache, invalidateProductsCache } from '../../lib/cache/invalidate';
import { getDb } from '../db';
import * as repo from '../repos/products-admin';
import { getBrandById } from '../repos/admin';
import * as mediaRepo from '../repos/media';
import * as seoRepo from '../repos/seo';

export async function listGridProducts() {
  return repo.listProductsForGrid(getDb());
}

export async function getAdminProduct(id: string) {
  const product = await repo.getProductAdminById(getDb(), id);
  if (!product) return null;
  const seo = product.seoId ? await seoRepo.getSeoById(getDb(), product.seoId) : null;
  const primaryMedia = product.primaryMediaId
    ? await mediaRepo.getMediaById(getDb(), product.primaryMediaId)
    : null;
  return { ...product, seo, primaryMedia };
}

export async function createAdminProduct(input: unknown) {
  const parsed = productUpsertSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, fields: zodFieldErrors(parsed.error) };
  }
  const db = getDb();
  if (await repo.isProductSlugTaken(db, parsed.data.slug)) {
    return { ok: false as const, fields: { slug: 'Bu slug zaten kullanılıyor' } };
  }
  if (parsed.data.sku && (await repo.isProductSkuTaken(db, parsed.data.sku))) {
    return { ok: false as const, fields: { sku: 'Bu SKU zaten kullanılıyor' } };
  }
  const { seo, ...rest } = parsed.data;
  let seoId: string | null = null;
  if (seo) seoId = await seoRepo.upsertSeoMeta(db, null, seo);
  const product = await repo.createProduct(db, { ...rest, seoId });
  await invalidateProductCache(product.slug);
  return { ok: true as const, data: product };
}

export async function updateAdminProduct(id: string, input: unknown) {
  const parsed = productUpsertSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, fields: zodFieldErrors(parsed.error) };
  }
  const db = getDb();
  const existing = await repo.getProductAdminById(db, id);
  if (!existing) return { ok: false as const, notFound: true as const };
  if (await repo.isProductSlugTaken(db, parsed.data.slug, id)) {
    return { ok: false as const, fields: { slug: 'Bu slug zaten kullanılıyor' } };
  }
  if (parsed.data.sku && (await repo.isProductSkuTaken(db, parsed.data.sku, id))) {
    return { ok: false as const, fields: { sku: 'Bu SKU zaten kullanılıyor' } };
  }
  const { seo, ...rest } = parsed.data;
  let seoId = existing.seoId;
  if (seo) seoId = await seoRepo.upsertSeoMeta(db, existing.seoId, seo);
  const product = await repo.updateProductFields(db, id, { ...rest, seoId });
  if (!product) return { ok: false as const, notFound: true as const };
  if (existing.slug !== product.slug) {
    await seoRepo.recordSlugChangeRedirect(db, '/product', existing.slug, product.slug);
  }
  await invalidateProductCache(product.slug, existing.slug);
  return { ok: true as const, data: product };
}

export async function removeAdminProduct(id: string) {
  const db = getDb();
  const deleted = await repo.deleteProduct(db, id);
  if (!deleted) return { ok: false as const, notFound: true as const };
  await invalidateProductCache(deleted.slug);
  return { ok: true as const, data: deleted };
}

export async function bulkUpdateProducts(input: unknown) {
  const parsed = productBulkSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: {
        code: 'validation_error',
        message: 'Geçersiz toplu güncelleme',
        fields: zodFieldErrors(parsed.error),
      },
    };
  }

  const db = getDb();
  const updated: repo.GridProduct[] = [];
  const errors: { id: string; message: string }[] = [];
  const slugsToInvalidate = new Set<string>();

  for (const change of parsed.data.changes) {
    try {
      const existing = await repo.getProductAdminById(db, change.id);
      if (!existing) {
        errors.push({ id: change.id, message: 'Ürün bulunamadı' });
        continue;
      }
      if (change.fields.slug && (await repo.isProductSlugTaken(db, change.fields.slug, change.id))) {
        errors.push({ id: change.id, message: 'Slug çakışması' });
        continue;
      }
      if (
        change.fields.sku &&
        change.fields.sku.length > 0 &&
        (await repo.isProductSkuTaken(db, change.fields.sku, change.id))
      ) {
        errors.push({ id: change.id, message: 'SKU çakışması' });
        continue;
      }

      const product = await repo.updateProductFields(db, change.id, change.fields);
      if (!product) {
        errors.push({ id: change.id, message: 'Güncellenemedi' });
        continue;
      }
      if (change.fields.slug && change.fields.slug !== existing.slug) {
        await seoRepo.recordSlugChangeRedirect(db, '/product', existing.slug, product.slug);
      }

      let brandName = existing.brandName;
      if (Object.prototype.hasOwnProperty.call(change.fields, 'brandId')) {
        if (product.brandId) {
          const brand = await getBrandById(db, product.brandId);
          brandName = brand?.name ?? null;
        } else {
          brandName = null;
        }
      }

      slugsToInvalidate.add(existing.slug);
      slugsToInvalidate.add(product.slug);
      updated.push({
        id: product.id,
        slug: product.slug,
        sku: product.sku,
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        status: product.status,
        brandId: product.brandId,
        brandName,
        updatedAt: product.updatedAt,
      });
    } catch (err) {
      errors.push({
        id: change.id,
        message: err instanceof Error ? err.message : 'Bilinmeyen hata',
      });
    }
  }

  if (updated.length > 0) {
    await invalidateProductsCache([...slugsToInvalidate]);
  }

  return {
    ok: true as const,
    data: {
      updated,
      errors,
      successCount: updated.length,
      errorCount: errors.length,
    },
  };
}
