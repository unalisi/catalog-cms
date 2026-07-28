import { z } from 'zod';

export const SECTION_TYPES = [
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
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

export function isSectionType(value: string): value is SectionType {
  return (SECTION_TYPES as readonly string[]).includes(value);
}

const heroSlideSchema = z.object({
  imageUrl: z.string().max(500).default(''),
  imageAlt: z.string().max(200).default(''),
  eyebrow: z.string().max(80).default(''),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(500).default(''),
  ctaLabel: z.string().max(80).default(''),
  ctaHref: z.string().max(300).default(''),
});

export const heroSchema = z.object({
  variant: z.enum(['static', 'slider']).default('static'),
  overlay: z.enum(['dark', 'light']).default('dark'),
  eyebrow: z.string().max(80).default(''),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(500).default(''),
  ctaLabel: z.string().max(80).default(''),
  ctaHref: z.string().max(300).default('/catalog'),
  secondaryCtaLabel: z.string().max(80).default(''),
  secondaryCtaHref: z.string().max(300).default(''),
  imageUrl: z.string().max(500).default(''),
  imageAlt: z.string().max(200).default(''),
  slides: z.array(heroSlideSchema).max(8).default([]),
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
  columns: z.coerce.number().int().min(2).max(4).default(3),
});

export const whyUsSchema = z.object({
  title: z.string().min(1).max(120).default('Neden biz?'),
  subtitle: z.string().max(300).default(''),
  items: z
    .array(
      z.object({
        icon: z.string().max(40).default(''),
        title: z.string().min(1).max(120),
        body: z.string().min(1).max(400),
      }),
    )
    .min(1)
    .max(6)
    .default([]),
});

export const contactChannelsSchema = z.object({
  title: z.string().max(120).default('Bize ulaşın'),
  items: z
    .array(
      z.object({
        type: z.enum(['phone', 'whatsapp', 'email', 'form', 'custom']).default('phone'),
        label: z.string().min(1).max(80),
        value: z.string().min(1).max(300),
      }),
    )
    .max(8)
    .default([]),
});

export const referencesSchema = z.object({
  title: z.string().max(120).default('Referanslar'),
  logos: z
    .array(
      z.object({
        src: z.string().min(1).max(500),
        alt: z.string().max(200).default(''),
        href: z.string().max(300).default(''),
      }),
    )
    .max(24)
    .default([]),
});

export const blogPreviewSchema = z.object({
  title: z.string().max(120).default('Blog'),
  limit: z.coerce.number().int().min(1).max(12).default(3),
});

export const mapContactSchema = z.object({
  title: z.string().max(120).default('İletişim'),
  address: z.string().min(1).max(500),
  phone: z.string().max(80).default(''),
  email: z.string().max(120).default(''),
  mapEmbedUrl: z.string().max(2000).default(''),
  ctaLabel: z.string().max(80).default(''),
  ctaHref: z.string().max(300).default(''),
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

export const bannerCtaSchema = z.object({
  title: z.string().min(1).max(160),
  body: z.string().max(500).default(''),
  ctaLabel: z.string().max(80).default(''),
  ctaHref: z.string().max(300).default('/catalog'),
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
  'why-us': whyUsSchema,
  'contact-channels': contactChannelsSchema,
  references: referencesSchema,
  'blog-preview': blogPreviewSchema,
  'map-contact': mapContactSchema,
  faq: faqSchema,
  'banner-cta': bannerCtaSchema,
  'rich-text': richTextSchema,
  gallery: gallerySchema,
} as const;

export type SectionConfigMap = {
  [K in SectionType]: z.infer<(typeof sectionSchemas)[K]>;
};

export const sectionDefaults: { [K in SectionType]: SectionConfigMap[K] } = {
  hero: {
    variant: 'static',
    overlay: 'dark',
    eyebrow: 'Catalog CMS',
    title: 'Endüstriyel otomasyon ürünleri',
    subtitle: 'Hızlı tedarik, geniş stok ve güvenilir teknik destek.',
    ctaLabel: 'Kataloğa git',
    ctaHref: '/catalog',
    secondaryCtaLabel: 'İletişim',
    secondaryCtaHref: '/#iletisim',
    imageUrl: '',
    imageAlt: '',
    slides: [],
  },
  'featured-products': { title: 'Öne çıkan ürünler', limit: 6 },
  'brand-strip': { title: 'Çalıştığımız markalar' },
  'category-grid': { title: 'Ürün grupları', columns: 3 },
  'why-us': {
    title: 'Neden biz?',
    subtitle: 'B2B tedarik ve mühendislik desteğinde güvenilir partner.',
    items: [
      {
        icon: 'truck',
        title: 'Hızlı tedarik',
        body: 'Geniş stok ve hızlı lojistik ile üretim sürekliliğinizi koruyoruz.',
      },
      {
        icon: 'wrench',
        title: 'Teknik servis',
        body: 'Uzman ekibimiz kurulum, bakım ve modernizasyon süreçlerinde yanınızda.',
      },
      {
        icon: 'shield',
        title: 'Güvenilir markalar',
        body: 'Dünya standartlarında markalarla uzun soluklu iş ortaklıkları.',
      },
    ],
  },
  'contact-channels': {
    title: 'İletişim kanalları',
    items: [
      { type: 'phone', label: 'Telefon', value: '+90 000 000 00 00' },
      { type: 'whatsapp', label: 'WhatsApp', value: '900000000000' },
      { type: 'email', label: 'E-posta', value: 'info@ornek.com' },
      { type: 'form', label: 'Teklif formu', value: '/#iletisim' },
    ],
  },
  references: {
    title: 'Referanslar',
    logos: [],
  },
  'blog-preview': { title: 'Haberler & blog', limit: 3 },
  'map-contact': {
    title: 'İletişim',
    address: 'Örnek Mah. Sanayi Cad. No:1 / Türkiye',
    phone: '+90 000 000 00 00',
    email: 'info@ornek.com',
    mapEmbedUrl: '',
    ctaLabel: 'Yol tarifi',
    ctaHref: '',
  },
  faq: {
    title: 'Sıkça sorulanlar',
    items: [
      {
        question: 'Teslimat süresi ne kadar?',
        answer: 'Stoklu ürünlerde aynı gün kargo; sipariş ürünlerde tedarik süresine göre bilgilendirilirsiniz.',
      },
      {
        question: 'Teknik destek alabilir miyim?',
        answer: 'Evet. Satış sonrası kurulum ve arıza desteği için uzman ekibimizle iletişime geçebilirsiniz.',
      },
    ],
  },
  'banner-cta': {
    title: 'Kataloğu keşfedin',
    body: 'Ürünleri inceleyin, marka ve kategorilere göz atın.',
    ctaLabel: 'Kataloğa git',
    ctaHref: '/catalog',
  },
  'rich-text': { html: '<p>Zengin metin içeriği.</p>' },
  gallery: {
    title: 'Galeri',
    images: [{ src: '/favicon.svg', alt: 'Örnek görsel' }],
  },
};

export const sectionLabels: Record<SectionType, string> = {
  hero: 'Hero / Slider',
  'featured-products': 'Öne çıkan ürünler',
  'brand-strip': 'Marka logoları',
  'category-grid': 'Kategori grid',
  'why-us': 'Neden biz',
  'contact-channels': 'İletişim kanalları',
  references: 'Referanslar',
  'blog-preview': 'Blog / Haberler',
  'map-contact': 'Harita + İletişim',
  faq: 'SSS',
  'banner-cta': 'Banner / CTA',
  'rich-text': 'Zengin metin',
  gallery: 'Galeri',
};

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'url'
  | 'number'
  | 'html'
  | 'select'
  | 'media'
  | 'faq-list'
  | 'gallery-list'
  | 'slide-list'
  | 'why-list'
  | 'channel-list'
  | 'logo-list';

export type FieldDef = {
  key: string;
  label: string;
  kind: FieldKind;
  options?: { value: string; label: string }[];
  /** For media: companion alt field key */
  altKey?: string;
  showWhen?: { key: string; equals: string };
};

export const sectionFields: Record<SectionType, FieldDef[]> = {
  hero: [
    {
      key: 'variant',
      label: 'Varyant',
      kind: 'select',
      options: [
        { value: 'static', label: 'Statik' },
        { value: 'slider', label: 'Slider' },
      ],
    },
    {
      key: 'overlay',
      label: 'Görsel overlay',
      kind: 'select',
      options: [
        { value: 'dark', label: 'Koyu (açık metin)' },
        { value: 'light', label: 'Açık (koyu metin)' },
      ],
    },
    { key: 'eyebrow', label: 'Üst etiket', kind: 'text', showWhen: { key: 'variant', equals: 'static' } },
    { key: 'title', label: 'Başlık', kind: 'text', showWhen: { key: 'variant', equals: 'static' } },
    { key: 'subtitle', label: 'Alt metin', kind: 'textarea', showWhen: { key: 'variant', equals: 'static' } },
    { key: 'ctaLabel', label: 'Birincil CTA metni', kind: 'text', showWhen: { key: 'variant', equals: 'static' } },
    { key: 'ctaHref', label: 'Birincil CTA link', kind: 'url', showWhen: { key: 'variant', equals: 'static' } },
    { key: 'secondaryCtaLabel', label: 'İkincil CTA metni', kind: 'text', showWhen: { key: 'variant', equals: 'static' } },
    { key: 'secondaryCtaHref', label: 'İkincil CTA link', kind: 'url', showWhen: { key: 'variant', equals: 'static' } },
    {
      key: 'imageUrl',
      label: 'Arka plan görseli',
      kind: 'media',
      altKey: 'imageAlt',
      showWhen: { key: 'variant', equals: 'static' },
    },
    { key: 'slides', label: 'Slaytlar', kind: 'slide-list', showWhen: { key: 'variant', equals: 'slider' } },
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
  'why-us': [
    { key: 'title', label: 'Başlık', kind: 'text' },
    { key: 'subtitle', label: 'Alt metin', kind: 'textarea' },
    { key: 'items', label: 'Değerler', kind: 'why-list' },
  ],
  'contact-channels': [
    { key: 'title', label: 'Başlık', kind: 'text' },
    { key: 'items', label: 'Kanallar', kind: 'channel-list' },
  ],
  references: [
    { key: 'title', label: 'Başlık', kind: 'text' },
    { key: 'logos', label: 'Logolar', kind: 'logo-list' },
  ],
  'blog-preview': [
    { key: 'title', label: 'Başlık', kind: 'text' },
    { key: 'limit', label: 'Yazı sayısı', kind: 'number' },
  ],
  'map-contact': [
    { key: 'title', label: 'Başlık', kind: 'text' },
    { key: 'address', label: 'Adres', kind: 'textarea' },
    { key: 'phone', label: 'Telefon', kind: 'text' },
    { key: 'email', label: 'E-posta', kind: 'text' },
    { key: 'mapEmbedUrl', label: 'Harita embed URL', kind: 'url' },
    { key: 'ctaLabel', label: 'CTA metni', kind: 'text' },
    { key: 'ctaHref', label: 'CTA link', kind: 'url' },
  ],
  faq: [
    { key: 'title', label: 'Başlık', kind: 'text' },
    { key: 'items', label: 'Sorular', kind: 'faq-list' },
  ],
  'banner-cta': [
    { key: 'title', label: 'Başlık', kind: 'text' },
    { key: 'body', label: 'Metin', kind: 'textarea' },
    { key: 'ctaLabel', label: 'CTA metni', kind: 'text' },
    { key: 'ctaHref', label: 'CTA link', kind: 'url' },
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

/** Build tel/mailto/wa/custom href from channel item. */
export function channelHref(type: string, value: string): string {
  const v = value.trim();
  switch (type) {
    case 'phone':
      return `tel:${v.replace(/[^\d+]/g, '')}`;
    case 'whatsapp': {
      const digits = v.replace(/\D/g, '');
      return `https://wa.me/${digits}`;
    }
    case 'email':
      return `mailto:${v}`;
    default:
      return v.startsWith('http') || v.startsWith('/') ? v : `/${v}`;
  }
}
