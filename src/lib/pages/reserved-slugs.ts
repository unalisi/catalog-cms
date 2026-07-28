/** Slugs that must not be used as CMS page paths (conflict with app routes). */
export const RESERVED_PAGE_SLUGS = [
  'admin',
  'api',
  'product',
  'brand',
  'category',
  'media',
  'login',
  'rss',
  'rss.xml',
  'sitemap',
  'sitemap.xml',
  'robots',
  'robots.txt',
  '_astro',
  'favicon',
  'favicon.svg',
  'favicon.ico',
] as const;

const RESERVED = new Set<string>(RESERVED_PAGE_SLUGS);

export function isReservedPageSlug(slug: string): boolean {
  const s = slug.trim().toLowerCase();
  if (!s) return true;
  if (RESERVED.has(s)) return true;
  // Block nested conflicts like "product-foo" is OK; only exact reserved.
  return false;
}
