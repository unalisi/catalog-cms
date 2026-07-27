export const CACHE_TTL = {
  product: 3600,
  brand: 3600,
  category: 3600,
  list: 300,
  page: 1800,
  sitemap: 3600,
  settings: 3600,
} as const;

export const CACHE_KEYS = {
  product: (slug: string) => `product:slug:${slug}`,
  brand: (slug: string) => `brand:slug:${slug}`,
  category: (slug: string) => `category:slug:${slug}`,
  page: (slug: string) => `page:slug:${slug}`,
  listProductsVer: 'list:products:ver',
  listProducts: (ver: string, hash: string) => `list:products:v${ver}:${hash}`,
  sitemap: 'sitemap:v1',
  settings: 'settings:site',
  nav: 'nav:main',
} as const;

export function stableHash(input: unknown): string {
  const json = JSON.stringify(input);
  let hash = 2166136261;
  for (let i = 0; i < json.length; i++) {
    hash ^= json.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}
