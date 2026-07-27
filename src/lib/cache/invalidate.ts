import { CACHE_KEYS } from './keys';
import { bumpListProductsVersion, cacheDelete } from './kv';

export async function invalidateBrandCache(slug: string, previousSlug?: string) {
  const keys = [
    CACHE_KEYS.brand(slug),
    'list:brands:published',
    CACHE_KEYS.sitemap,
  ];
  if (previousSlug && previousSlug !== slug) keys.push(CACHE_KEYS.brand(previousSlug));
  await cacheDelete(...keys);
  await bumpListProductsVersion();
}

export async function invalidateCategoryCache(slug: string, previousSlug?: string) {
  const keys = [
    CACHE_KEYS.category(slug),
    'list:categories:published',
    CACHE_KEYS.sitemap,
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
