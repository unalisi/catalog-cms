import { env } from 'cloudflare:workers';
import { CACHE_KEYS } from './keys';

export type CacheStatus = 'HIT' | 'MISS';

export async function cacheGet<T>(key: string): Promise<{ value: T; status: CacheStatus } | null> {
  const raw = await env.CACHE.get(key);
  if (raw == null) return null;
  try {
    return { value: JSON.parse(raw) as T, status: 'HIT' };
  } catch {
    await env.CACHE.delete(key);
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  await env.CACHE.put(key, JSON.stringify(value), {
    expirationTtl: Math.max(60, ttlSeconds),
  });
}

export async function cacheDelete(...keys: string[]): Promise<void> {
  await Promise.all(keys.map((key) => env.CACHE.delete(key)));
}

export async function getListProductsVersion(): Promise<string> {
  const ver = await env.CACHE.get(CACHE_KEYS.listProductsVer);
  return ver ?? '0';
}

export async function bumpListProductsVersion(): Promise<string> {
  const current = Number((await env.CACHE.get(CACHE_KEYS.listProductsVer)) ?? '0');
  const next = String(current + 1);
  await env.CACHE.put(CACHE_KEYS.listProductsVer, next);
  return next;
}

export async function getListPostsVersion(): Promise<string> {
  const ver = await env.CACHE.get(CACHE_KEYS.listPostsVer);
  return ver ?? '0';
}

export async function bumpListPostsVersion(): Promise<string> {
  const current = Number((await env.CACHE.get(CACHE_KEYS.listPostsVer)) ?? '0');
  const next = String(current + 1);
  await env.CACHE.put(CACHE_KEYS.listPostsVer, next);
  return next;
}

/**
 * Cache-first read: HIT from KV, else loader → put.
 */
export async function cacheFirst<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T | null>,
): Promise<{ data: T | null; status: CacheStatus }> {
  const hit = await cacheGet<T>(key);
  if (hit) return { data: hit.value, status: 'HIT' };

  const data = await loader();
  if (data != null) {
    await cacheSet(key, data, ttlSeconds);
  }
  return { data, status: 'MISS' };
}
