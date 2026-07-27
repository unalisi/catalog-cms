/**
 * KV cache helpers (FAZ 1).
 * Key conventions: ARCHITECTURE.md §6
 */
export const CACHE_KEYS = {
  product: (slug: string) => `product:slug:${slug}`,
  brand: (slug: string) => `brand:slug:${slug}`,
  category: (slug: string) => `category:slug:${slug}`,
  page: (slug: string) => `page:slug:${slug}`,
  settings: 'settings:site',
  sitemap: 'sitemap:v1',
} as const;
