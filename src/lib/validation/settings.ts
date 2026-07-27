import { z } from 'zod';

export const navItemSchema = z.object({
  label: z.string().min(1).max(80),
  href: z.string().min(1).max(300),
});

export const siteSettingsSchema = z.object({
  name: z.string().min(1).max(120),
  tagline: z.string().max(200).default(''),
  logoMediaId: z.string().nullable().optional(),
  faviconMediaId: z.string().nullable().optional(),
  contactEmail: z.string().max(120).optional().nullable(),
  contactPhone: z.string().max(40).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  social: z
    .object({
      twitter: z.string().max(120).optional().nullable(),
      instagram: z.string().max(120).optional().nullable(),
      linkedin: z.string().max(120).optional().nullable(),
      youtube: z.string().max(120).optional().nullable(),
    })
    .default({}),
  analytics: z
    .object({
      gaMeasurementId: z.string().max(40).optional().nullable(),
      gtmId: z.string().max(40).optional().nullable(),
    })
    .default({}),
  navigation: z.array(navItemSchema).max(12).default([]),
  footerText: z.string().max(300).optional().nullable(),
});

export type SiteSettings = z.infer<typeof siteSettingsSchema>;

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  name: 'Catalog CMS',
  tagline: 'Ürün kataloğu. Hızlı. SEO odaklı.',
  logoMediaId: null,
  faviconMediaId: null,
  contactEmail: null,
  contactPhone: null,
  address: null,
  social: {},
  analytics: {},
  navigation: [
    { label: 'Katalog', href: '/catalog' },
    { label: 'Blog', href: '/blog' },
  ],
  footerText: null,
};
