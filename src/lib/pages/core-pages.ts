/** Built-in editable site pages (seeded; delete blocked). */
export const CORE_PAGES = [
  {
    slug: 'home',
    title: 'Ana Sayfa',
    path: '/',
    description: 'Anasayfa section’ları',
  },
  {
    slug: 'catalog',
    title: 'Katalog',
    path: '/catalog',
    description: 'Ürün listesi layout’ları',
  },
  {
    slug: 'blog',
    title: 'Blog',
    path: '/blog',
    description: 'Blog listesi layout’ları',
  },
  {
    slug: 'iletisim',
    title: 'İletişim',
    path: '/iletisim',
    description: 'İletişim layout varyantları',
  },
  {
    slug: 'urun-sablon',
    title: 'Ürün detay şablonu',
    path: '/product/{slug}',
    description: 'Ürün detayı altı — benzer ürünler ve CTA',
  },
  {
    slug: 'yazi-sablon',
    title: 'Blog yazı şablonu',
    path: '/blog/{slug}',
    description: 'Yazı detayı altı — ilgili yazılar ve CTA',
  },
] as const;

export type CorePageSlug = (typeof CORE_PAGES)[number]['slug'];

const CORE_SLUGS = new Set<string>(CORE_PAGES.map((p) => p.slug));

export function isCorePageSlug(slug: string): boolean {
  return CORE_SLUGS.has(slug);
}

export function getCorePage(slug: string) {
  return CORE_PAGES.find((p) => p.slug === slug) ?? null;
}
