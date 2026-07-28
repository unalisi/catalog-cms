import { isCorePageSlug, type CorePageSlug } from './core-pages';
import type { SectionType } from '../sections/registry';

/** Ana sayfa — pazarlama / içerik section’ları (sayfa-özel listeler hariç). */
export const HOME_SECTIONS = [
  'hero',
  'featured-products',
  'brand-strip',
  'category-grid',
  'why-us',
  'contact-channels',
  'references',
  'blog-preview',
  'map-contact',
  'faq',
  'banner-cta',
  'rich-text',
  'gallery',
  'whatsapp-float',
] as const satisfies readonly SectionType[];

/** Custom (kullanıcı oluşturduğu) sayfalar. */
export const CUSTOM_SECTIONS = [
  'rich-text',
  'gallery',
  'banner-cta',
  'whatsapp-float',
] as const satisfies readonly SectionType[];

export const PAGE_ALLOWED_SECTIONS: Record<CorePageSlug, readonly SectionType[]> = {
  home: HOME_SECTIONS,
  iletisim: ['contact-layout'],
  blog: ['blog-list'],
  catalog: ['product-list'],
  'urun-sablon': ['related-products', 'banner-cta', 'rich-text', 'gallery'],
  'yazi-sablon': ['related-posts', 'banner-cta', 'rich-text'],
};

export function getAllowedSectionTypes(slug: string): readonly SectionType[] {
  if (isCorePageSlug(slug)) {
    return PAGE_ALLOWED_SECTIONS[slug as CorePageSlug];
  }
  return CUSTOM_SECTIONS;
}

export function isSectionAllowedOnPage(slug: string, type: string): boolean {
  return (getAllowedSectionTypes(slug) as readonly string[]).includes(type);
}
