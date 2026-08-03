import { CACHE_KEYS } from './keys';
import { bumpListPostsVersion, bumpListProductsVersion, cacheDelete } from './kv';

export async function invalidateBrandCache(slug: string, previousSlug?: string) {
  const keys = [
    CACHE_KEYS.brand(slug),
    CACHE_KEYS.listBrands,
    'list:brands:published', // legacy key
    CACHE_KEYS.sitemap,
  ];
  if (previousSlug && previousSlug !== slug) keys.push(CACHE_KEYS.brand(previousSlug));
  await cacheDelete(...keys);
  await bumpListProductsVersion();
}

export async function invalidateCategoryCache(slug: string, previousSlug?: string) {
  const keys = [
    CACHE_KEYS.category(slug),
    CACHE_KEYS.listCategories,
    'list:categories:published', // legacy key
    CACHE_KEYS.sitemap,
    CACHE_KEYS.nav,
  ];
  if (previousSlug && previousSlug !== slug) keys.push(CACHE_KEYS.category(previousSlug));
  await cacheDelete(...keys);
  await bumpListProductsVersion();
}

export async function invalidateProductCache(slug: string, previousSlug?: string) {
  const keys = [CACHE_KEYS.product(slug), CACHE_KEYS.sitemap];
  if (previousSlug && previousSlug !== slug) keys.push(CACHE_KEYS.product(previousSlug));
  await cacheDelete(...keys);
  await bumpListProductsVersion();
}

export async function invalidateProductsCache(slugs: string[]) {
  const unique = [...new Set(slugs.filter(Boolean))];
  if (unique.length > 0) {
    await cacheDelete(...unique.map((slug) => CACHE_KEYS.product(slug)), CACHE_KEYS.sitemap);
  }
  await bumpListProductsVersion();
}

export async function invalidatePageCache(slug: string, previousSlug?: string) {
  const keys = [CACHE_KEYS.page(slug), CACHE_KEYS.sitemap];
  if (previousSlug && previousSlug !== slug) keys.push(CACHE_KEYS.page(previousSlug));
  await cacheDelete(...keys);
}

export async function invalidateSitemapCache() {
  await cacheDelete(CACHE_KEYS.sitemap);
}

export async function invalidatePostCache(slug: string, previousSlug?: string) {
  const keys = [CACHE_KEYS.post(slug), CACHE_KEYS.sitemap];
  if (previousSlug && previousSlug !== slug) keys.push(CACHE_KEYS.post(previousSlug));
  await cacheDelete(...keys);
  await bumpListPostsVersion();
}
