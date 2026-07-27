import { z } from 'zod';

export const seoFieldsSchema = z.object({
  title: z.string().max(70).optional().nullable(),
  description: z.string().max(160).optional().nullable(),
  canonical: z.string().max(500).optional().nullable(),
  ogImageUrl: z.string().max(500).optional().nullable(),
  noindex: z.boolean().optional(),
  robotsExtra: z.string().max(120).optional().nullable(),
});

export type SeoFieldsInput = z.infer<typeof seoFieldsSchema>;

export const seoDefaultsSchema = z.object({
  siteName: z.string().min(1).max(120),
  titleTemplate: z.string().min(1).max(120),
  defaultDescription: z.string().max(300),
  defaultOgImageUrl: z.string().max(500).optional().nullable(),
  organizationName: z.string().min(1).max(120),
  twitterHandle: z.string().max(40).optional().nullable(),
});

export type SeoDefaults = z.infer<typeof seoDefaultsSchema>;

export const redirectSchema = z.object({
  fromPath: z
    .string()
    .min(1)
    .max(300)
    .regex(/^\//, 'fromPath / ile başlamalı'),
  toPath: z
    .string()
    .min(1)
    .max(300)
    .regex(/^\//, 'toPath / ile başlamalı'),
  statusCode: z.union([z.literal(301), z.literal(302)]).default(301),
});

export const DEFAULT_SEO_SETTINGS: SeoDefaults = {
  siteName: 'Catalog CMS',
  titleTemplate: '%s · Catalog CMS',
  defaultDescription: 'Ürün kataloğu. Hızlı. SEO odaklı.',
  defaultOgImageUrl: '/favicon.svg',
  organizationName: 'Catalog CMS',
  twitterHandle: null,
};
