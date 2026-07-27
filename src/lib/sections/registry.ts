import { z } from 'zod';

export const SECTION_TYPES = [
  'hero',
  'featured-products',
  'brand-strip',
  'category-grid',
  'banner-cta',
  'blog-preview',
  'faq',
  'rich-text',
  'gallery',
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

export function isSectionType(value: string): value is SectionType {
  return (SECTION_TYPES as readonly string[]).includes(value);
}

export const heroSchema = z.object({
  eyebrow: z.string().max(80).default(''),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(500).default(''),
  ctaLabel: z.string().max(80).default(''),
  ctaHref: z.string().max(300).default('/catalog'),
  secondaryCtaLabel: z.string().max(80).default(''),
  secondaryCtaHref: z.string().max(300).default(''),
});

export const featuredProductsSchema = z.object({
  title: z.string().min(1).max(120).default('Öne çıkan ürünler'),
  limit: z.coerce.number().int().min(1).max(24).default(5),
});

export const brandStripSchema = z.object({
  title: z.string().max(120).default('Markalar'),
});

export const categoryGridSchema = z.object({
  title: z.string().max(120).default('Kategoriler'),
  columns: z.coerce.number().int().min(2).max(4).default(2),
});

export const bannerCtaSchema = z.object({
  title: z.string().min(1).max(160),
  body: z.string().max(500).default(''),
  ctaLabel: z.string().max(80).default(''),
  ctaHref: z.string().max(300).default('/catalog'),
});

export const blogPreviewSchema = z.object({
  title: z.string().max(120).default('Blog'),
  limit: z.coerce.number().int().min(1).max(12).default(3),
});

export const faqSchema = z.object({
  title: z.string().max(120).default('Sıkça sorulanlar'),
  items: z
    .array(
      z.object({
        question: z.string().min(1).max(200),
        answer: z.string().min(1).max(2000),
      }),
    )
    .max(20)
    .default([]),
});

export const richTextSchema = z.object({
  html: z.string().max(20000).default(''),
});

export const gallerySchema = z.object({
  title: z.string().max(120).default(''),
  images: z
    .array(
      z.object({
        src: z.string().min(1).max(500),
        alt: z.string().max(200).default(''),
      }),
    )
    .max(24)
    .default([]),
});

export const sectionSchemas = {
  hero: heroSchema,
  'featured-products': featuredProductsSchema,
  'brand-strip': brandStripSchema,
  'category-grid': categoryGridSchema,
  'banner-cta': bannerCtaSchema,
  'blog-preview': blogPreviewSchema,
  faq: faqSchema,
  'rich-text': richTextSchema,
  gallery: gallerySchema,
} as const;

export type SectionConfigMap = {
  [K in SectionType]: z.infer<(typeof sectionSchemas)[K]>;
};

export const sectionDefaults: { [K in SectionType]: SectionConfigMap[K] } = {
  hero: {
    eyebrow: 'Catalog CMS',
    title: 'Yeni bölüm başlığı',
    subtitle: '',
    ctaLabel: 'Kataloğa git',
    ctaHref: '/catalog',
    secondaryCtaLabel: '',
    secondaryCtaHref: '',
  },
  'featured-products': { title: 'Öne çıkan ürünler', limit: 5 },
  'brand-strip': { title: 'Markalar' },
  'category-grid': { title: 'Kategoriler', columns: 2 },
  'banner-cta': {
    title: 'Harekete geçin',
    body: '',
    ctaLabel: 'Kataloğa git',
    ctaHref: '/catalog',
  },
  'blog-preview': { title: 'Blog', limit: 3 },
  faq: {
    title: 'Sıkça sorulanlar',
    items: [{ question: 'Örnek soru?', answer: 'Örnek cevap.' }],
  },
  'rich-text': { html: '<p>Zengin metin içeriği.</p>' },
  gallery: {
    title: 'Galeri',
    images: [{ src: '/favicon.svg', alt: 'Örnek görsel' }],
  },
};

export const sectionLabels: Record<SectionType, string> = {
  hero: 'Hero',
  'featured-products': 'Öne çıkan ürünler',
  'brand-strip': 'Marka şeridi',
  'category-grid': 'Kategori grid',
  'banner-cta': 'Banner / CTA',
  'blog-preview': 'Blog önizleme',
  faq: 'SSS',
  'rich-text': 'Zengin metin',
  gallery: 'Galeri',
};

export type FieldKind = 'text' | 'textarea' | 'url' | 'number' | 'faq-list' | 'gallery-list' | 'html';

export type FieldDef = {
  key: string;
  label: string;
  kind: FieldKind;
};

export const sectionFields: Record<SectionType, FieldDef[]> = {
  hero: [
    { key: 'eyebrow', label: 'Üst etiket', kind: 'text' },
    { key: 'title', label: 'Başlık', kind: 'text' },
    { key: 'subtitle', label: 'Alt metin', kind: 'textarea' },
    { key: 'ctaLabel', label: 'Birincil CTA metni', kind: 'text' },
    { key: 'ctaHref', label: 'Birincil CTA link', kind: 'url' },
    { key: 'secondaryCtaLabel', label: 'İkincil CTA metni', kind: 'text' },
    { key: 'secondaryCtaHref', label: 'İkincil CTA link', kind: 'url' },
  ],
  'featured-products': [
    { key: 'title', label: 'Başlık', kind: 'text' },
    { key: 'limit', label: 'Ürün sayısı', kind: 'number' },
  ],
  'brand-strip': [{ key: 'title', label: 'Başlık', kind: 'text' }],
  'category-grid': [
    { key: 'title', label: 'Başlık', kind: 'text' },
    { key: 'columns', label: 'Kolon (2–4)', kind: 'number' },
  ],
  'banner-cta': [
    { key: 'title', label: 'Başlık', kind: 'text' },
    { key: 'body', label: 'Metin', kind: 'textarea' },
    { key: 'ctaLabel', label: 'CTA metni', kind: 'text' },
    { key: 'ctaHref', label: 'CTA link', kind: 'url' },
  ],
  'blog-preview': [
    { key: 'title', label: 'Başlık', kind: 'text' },
    { key: 'limit', label: 'Yazı sayısı', kind: 'number' },
  ],
  faq: [
    { key: 'title', label: 'Başlık', kind: 'text' },
    { key: 'items', label: 'Sorular', kind: 'faq-list' },
  ],
  'rich-text': [{ key: 'html', label: 'HTML içerik', kind: 'html' }],
  gallery: [
    { key: 'title', label: 'Başlık', kind: 'text' },
    { key: 'images', label: 'Görseller', kind: 'gallery-list' },
  ],
};

export function parseSectionConfig<T extends SectionType>(
  type: T,
  raw: unknown,
): { ok: true; data: SectionConfigMap[T] } | { ok: false; error: z.ZodError } {
  const parsed = sectionSchemas[type].safeParse(raw ?? {});
  if (!parsed.success) return { ok: false, error: parsed.error };
  return { ok: true, data: parsed.data as SectionConfigMap[T] };
}

export function parseConfigJson(type: string, configJson: string): unknown {
  if (!isSectionType(type)) return null;
  let raw: unknown = {};
  try {
    raw = JSON.parse(configJson || '{}');
  } catch {
    raw = {};
  }
  const parsed = parseSectionConfig(type, raw);
  if (!parsed.ok) return sectionDefaults[type];
  return parsed.data;
}
