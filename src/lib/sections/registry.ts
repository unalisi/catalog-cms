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
  'whatsapp-float',
  'contact-layout',
  'product-list',
  'blog-list',
  'related-products',
  'related-posts',
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
  showCta: z.enum(['show', 'hide']).default('show'),
  showNav: z.enum(['show', 'hide']).default('show'),
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
  css: z.string().max(20000).default(''),
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

export const whatsappFloatSchema = z.object({
  phone: z.string().min(1).max(40),
  position: z.enum(['bottom-right', 'bottom-left']).default('bottom-right'),
  headline: z.string().max(120).default('Bir Konuşma Başlatın'),
  description: z
    .string()
    .max(300)
    .default('Merhaba! WhatsApp’ta sohbet etmek için aşağıdaki üyemize tıklayın.'),
  agentLabel: z.string().max(80).default('Müşteri Hizmetleri'),
  agentSubtitle: z.string().max(120).default('Müşteri Hizmetleri'),
  statusHint: z.string().max(160).default('Ekip genellikle birkaç dakika içinde yanıt verir.'),
});

export const contactLayoutSchema = z.object({
  variant: z.preprocess((v) => {
    if (v === 'info-map' || v === 'stacked') return 'map-form';
    return v;
  }, z.enum(['map-form', 'form-map', 'info-form', 'form-info']).default('map-form')),
  title: z.string().max(120).default('İletişim'),
  subtitle: z.string().max(300).default(''),
  address: z.string().max(500).default(''),
  phone: z.string().max(80).default(''),
  email: z.string().max(120).default(''),
  hours: z.string().max(200).default(''),
  mapEmbedUrl: z.string().max(2000).default(''),
  formTitle: z.string().max(120).default('Mesaj gönderin'),
  formSubmitLabel: z.string().max(80).default('Gönder'),
  successMessage: z
    .string()
    .max(300)
    .default('Mesajınız alındı. En kısa sürede dönüş yapacağız.'),
});

export const productListSchema = z.object({
  title: z.string().max(120).default('Katalog'),
  layout: z.enum(['grid', 'row', 'compact']).default('grid'),
  columns: z.coerce.number().int().min(3).max(4).default(3),
  showFilters: z.preprocess((v) => {
    if (v === 'true' || v === true || v === 'show') return true;
    if (v === 'false' || v === false || v === 'hide') return false;
    return v;
  }, z.boolean().default(true)),
  pageSize: z.coerce.number().int().min(4).max(48).default(12),
});

export const blogListSchema = z.object({
  title: z.string().max(120).default('Blog'),
  layout: z.enum(['asymmetric', 'row', 'grid']).default('row'),
  columns: z.coerce.number().int().min(3).max(4).default(3),
});

export const relatedProductsSchema = z.object({
  title: z.string().max(120).default('Benzer ürünler'),
  limit: z.coerce.number().int().min(2).max(12).default(4),
  layout: z.enum(['grid', 'row']).default('grid'),
});

export const relatedPostsSchema = z.object({
  title: z.string().max(120).default('İlgili yazılar'),
  limit: z.coerce.number().int().min(2).max(12).default(3),
  layout: z.enum(['row', 'grid']).default('row'),
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
  'whatsapp-float': whatsappFloatSchema,
  'contact-layout': contactLayoutSchema,
  'product-list': productListSchema,
  'blog-list': blogListSchema,
  'related-products': relatedProductsSchema,
  'related-posts': relatedPostsSchema,
} as const;

export type SectionConfigMap = {
  [K in SectionType]: z.infer<(typeof sectionSchemas)[K]>;
};

export const sectionDefaults: { [K in SectionType]: SectionConfigMap[K] } = {
  hero: {
    variant: 'static',
    overlay: 'dark',
    showCta: 'show',
    showNav: 'show',
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
  'rich-text': { html: '<p>Zengin metin içeriği.</p>', css: '' },
  gallery: {
    title: 'Galeri',
    images: [{ src: '/favicon.svg', alt: 'Örnek görsel' }],
  },
  'whatsapp-float': {
    phone: '902120000000',
    position: 'bottom-right',
    headline: 'Bir Konuşma Başlatın',
    description: 'Merhaba! WhatsApp’ta sohbet etmek için aşağıdaki üyemize tıklayın.',
    agentLabel: 'Müşteri Hizmetleri',
    agentSubtitle: 'Müşteri Hizmetleri',
    statusHint: 'Ekip genellikle birkaç dakika içinde yanıt verir.',
  },
  'contact-layout': {
    variant: 'map-form',
    title: 'İletişim',
    subtitle: 'Bize ulaşın — form, telefon veya ziyaret.',
    address: 'Örnek Mah. Sanayi Cad. No:1, İstanbul',
    phone: '+90 212 000 00 00',
    email: 'info@example.com',
    hours: 'Pzt–Cum 09:00–18:00',
    mapEmbedUrl: '',
    formTitle: 'Mesaj gönderin',
    formSubmitLabel: 'Gönder',
    successMessage: 'Mesajınız alındı. En kısa sürede dönüş yapacağız.',
  },
  'product-list': {
    title: 'Katalog',
    layout: 'grid',
    columns: 3,
    showFilters: true,
    pageSize: 12,
  },
  'blog-list': { title: 'Blog', layout: 'row', columns: 3 },
  'related-products': { title: 'Benzer ürünler', limit: 4, layout: 'grid' },
  'related-posts': { title: 'İlgili yazılar', limit: 3, layout: 'row' },
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
  'whatsapp-float': 'WhatsApp İletişim Butonu',
  'contact-layout': 'İletişim layout',
  'product-list': 'Ürün listesi',
  'blog-list': 'Blog listesi',
  'related-products': 'Benzer ürünler',
  'related-posts': 'İlgili yazılar',
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
  | 'logo-list'
  | 'css';

export type FieldDef = {
  key: string;
  label: string;
  kind: FieldKind;
  options?: { value: string; label: string }[];
  /** For media: companion alt field key */
  altKey?: string;
  showWhen?:
    | { key: string; equals: string }
    | Array<{ key: string; equals: string }>;
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
    {
      key: 'showCta',
      label: 'Butonlar',
      kind: 'select',
      options: [
        { value: 'show', label: 'Göster' },
        { value: 'hide', label: 'Gizle' },
      ],
    },
    {
      key: 'showNav',
      label: 'Ok / nokta kontrolleri',
      kind: 'select',
      options: [
        { value: 'show', label: 'Göster' },
        { value: 'hide', label: 'Gizle' },
      ],
      showWhen: { key: 'variant', equals: 'slider' },
    },
    { key: 'eyebrow', label: 'Üst etiket', kind: 'text', showWhen: { key: 'variant', equals: 'static' } },
    { key: 'title', label: 'Başlık', kind: 'text', showWhen: { key: 'variant', equals: 'static' } },
    { key: 'subtitle', label: 'Alt metin', kind: 'textarea', showWhen: { key: 'variant', equals: 'static' } },
    {
      key: 'ctaLabel',
      label: 'Birincil CTA metni',
      kind: 'text',
      showWhen: [
        { key: 'variant', equals: 'static' },
        { key: 'showCta', equals: 'show' },
      ],
    },
    {
      key: 'ctaHref',
      label: 'Birincil CTA link',
      kind: 'url',
      showWhen: [
        { key: 'variant', equals: 'static' },
        { key: 'showCta', equals: 'show' },
      ],
    },
    {
      key: 'secondaryCtaLabel',
      label: 'İkincil CTA metni',
      kind: 'text',
      showWhen: [
        { key: 'variant', equals: 'static' },
        { key: 'showCta', equals: 'show' },
      ],
    },
    {
      key: 'secondaryCtaHref',
      label: 'İkincil CTA link',
      kind: 'url',
      showWhen: [
        { key: 'variant', equals: 'static' },
        { key: 'showCta', equals: 'show' },
      ],
    },
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
  'rich-text': [
    { key: 'html', label: 'HTML içerik', kind: 'html' },
    { key: 'css', label: 'CSS (bu section’a scope edilir)', kind: 'css' },
  ],
  gallery: [
    { key: 'title', label: 'Başlık', kind: 'text' },
    { key: 'images', label: 'Görseller', kind: 'gallery-list' },
  ],
  'whatsapp-float': [
    { key: 'phone', label: 'WhatsApp numarası', kind: 'text' },
    {
      key: 'position',
      label: 'Konum',
      kind: 'select',
      options: [
        { value: 'bottom-right', label: 'Sağ alt' },
        { value: 'bottom-left', label: 'Sol alt' },
      ],
    },
    { key: 'headline', label: 'Modal başlık', kind: 'text' },
    { key: 'description', label: 'Modal açıklama', kind: 'textarea' },
    { key: 'agentLabel', label: 'Temsilci adı', kind: 'text' },
    { key: 'agentSubtitle', label: 'Temsilci alt metin', kind: 'text' },
    { key: 'statusHint', label: 'Yanıt süresi notu', kind: 'text' },
  ],
  'contact-layout': [
    {
      key: 'variant',
      label: 'Yerleşim',
      kind: 'select',
      options: [
        { value: 'map-form', label: 'Harita | Form' },
        { value: 'form-map', label: 'Form | Harita' },
        { value: 'info-form', label: 'Bilgi | Form' },
        { value: 'form-info', label: 'Form | Bilgi' },
      ],
    },
    { key: 'title', label: 'Başlık', kind: 'text' },
    { key: 'subtitle', label: 'Alt metin', kind: 'textarea' },
    { key: 'address', label: 'Adres', kind: 'textarea' },
    { key: 'phone', label: 'Telefon', kind: 'text' },
    { key: 'email', label: 'E-posta', kind: 'text' },
    { key: 'hours', label: 'Çalışma saatleri', kind: 'text' },
    { key: 'mapEmbedUrl', label: 'Harita embed URL', kind: 'url' },
    { key: 'formTitle', label: 'Form başlığı', kind: 'text' },
    { key: 'formSubmitLabel', label: 'Gönder butonu', kind: 'text' },
    { key: 'successMessage', label: 'Başarı mesajı', kind: 'textarea' },
  ],
  'product-list': [
    { key: 'title', label: 'Başlık', kind: 'text' },
    {
      key: 'layout',
      label: 'Layout',
      kind: 'select',
      options: [
        { value: 'grid', label: 'Kart grid (filtreli)' },
        { value: 'row', label: 'Satır listesi' },
        { value: 'compact', label: 'Kompakt kartlar' },
      ],
    },
    {
      key: 'columns',
      label: 'Kolon sayısı',
      kind: 'select',
      options: [
        { value: '3', label: '3 kolon' },
        { value: '4', label: '4 kolon' },
      ],
    },
    {
      key: 'showFilters',
      label: 'Filtreler',
      kind: 'select',
      options: [
        { value: 'true', label: 'Göster' },
        { value: 'false', label: 'Gizle' },
      ],
      showWhen: { key: 'layout', equals: 'grid' },
    },
    { key: 'pageSize', label: 'Sayfa boyutu', kind: 'number' },
  ],
  'blog-list': [
    { key: 'title', label: 'Başlık', kind: 'text' },
    {
      key: 'layout',
      label: 'Layout',
      kind: 'select',
      options: [
        { value: 'asymmetric', label: 'Asimetrik grid' },
        { value: 'row', label: 'Satır kartları' },
        { value: 'grid', label: 'Simetrik kart grid' },
      ],
    },
    {
      key: 'columns',
      label: 'Kolon sayısı',
      kind: 'select',
      options: [
        { value: '3', label: '3 kolon' },
        { value: '4', label: '4 kolon' },
      ],
      showWhen: { key: 'layout', equals: 'grid' },
    },
  ],
  'related-products': [
    { key: 'title', label: 'Başlık', kind: 'text' },
    { key: 'limit', label: 'Ürün sayısı', kind: 'number' },
    {
      key: 'layout',
      label: 'Layout',
      kind: 'select',
      options: [
        { value: 'grid', label: 'Kart grid' },
        { value: 'row', label: 'Satır' },
      ],
    },
  ],
  'related-posts': [
    { key: 'title', label: 'Başlık', kind: 'text' },
    { key: 'limit', label: 'Yazı sayısı', kind: 'number' },
    {
      key: 'layout',
      label: 'Layout',
      kind: 'select',
      options: [
        { value: 'row', label: 'Satır' },
        { value: 'grid', label: 'Kart grid' },
      ],
    },
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
