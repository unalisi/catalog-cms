import { CACHE_KEYS, CACHE_TTL, stableHash } from '../../lib/cache/keys';
import { cacheFirst, getListProductsVersion } from '../../lib/cache/kv';
import { getDb } from '../db';
import * as catalogRepo from '../repos/catalog';

export async function getProductBySlug(slug: string) {
  return cacheFirst(
    CACHE_KEYS.product(slug),
    CACHE_TTL.product,
    () => catalogRepo.getPublishedProductBySlug(getDb(), slug),
  );
}

export async function getBrandBySlug(slug: string) {
  return cacheFirst(
    CACHE_KEYS.brand(slug),
    CACHE_TTL.brand,
    () => catalogRepo.getPublishedBrandBySlug(getDb(), slug),
  );
}

export async function getCategoryBySlug(slug: string) {
  return cacheFirst(
    CACHE_KEYS.category(slug),
    CACHE_TTL.category,
    () => catalogRepo.getPublishedCategoryBySlug(getDb(), slug),
  );
}

export async function getProductList(opts: {
  page?: number;
  pageSize?: number;
  brandSlug?: string;
  categorySlug?: string;
}) {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, opts.pageSize ?? 12));
  const filter = {
    page,
    pageSize,
    brandSlug: opts.brandSlug,
    categorySlug: opts.categorySlug,
  };
  const ver = await getListProductsVersion();
  const hash = stableHash(filter);
  const key = CACHE_KEYS.listProducts(ver, hash);

  return cacheFirst(key, CACHE_TTL.list, () =>
    catalogRepo.listPublishedProducts(getDb(), filter),
  );
}

export async function getBrands() {
  return cacheFirst('list:brands:published', CACHE_TTL.brand, () =>
    catalogRepo.listPublishedBrands(getDb()),
  );
}

export async function getCategories() {
  return cacheFirst('list:categories:published', CACHE_TTL.category, () =>
    catalogRepo.listPublishedCategories(getDb()),
  );
}

export async function getSitemapUrls() {
  return cacheFirst(CACHE_KEYS.sitemap, CACHE_TTL.sitemap, () =>
    catalogRepo.listSitemapEntries(getDb()),
  );
}

export async function getSampleProductSlug() {
  return catalogRepo.getSamplePublishedProductSlug(getDb());
}
