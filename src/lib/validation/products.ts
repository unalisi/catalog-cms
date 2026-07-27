import { z } from 'zod';
import { seoFieldsSchema } from './seo';

export const productStatusSchema = z.enum(['draft', 'published', 'archived']);

export const productUpsertSchema = z.object({
  name: z.string().min(1, 'Ad zorunlu').max(200),
  slug: z
    .string()
    .min(1, 'Slug zorunlu')
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug yalnızca küçük harf, rakam ve tire'),
  sku: z.string().max(80).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  price: z.coerce.number().int().min(0, 'Fiyat kuruş cinsinden tam sayı olmalı'),
  compareAtPrice: z.coerce.number().int().min(0).optional().nullable(),
  currency: z.string().min(3).max(3).default('TRY'),
  stock: z.coerce.number().int().min(0),
  status: productStatusSchema,
  brandId: z.string().optional().nullable(),
  seo: seoFieldsSchema.optional().nullable(),
});

export const productBulkChangeSchema = z.object({
  id: z.string().min(1),
  fields: z
    .object({
      name: z.string().min(1).max(200).optional(),
      slug: z
        .string()
        .min(1)
        .max(120)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .optional(),
      sku: z.string().max(80).nullable().optional(),
      price: z.number().int().min(0).optional(),
      stock: z.number().int().min(0).optional(),
      status: productStatusSchema.optional(),
      brandId: z.string().nullable().optional(),
      description: z.string().max(5000).nullable().optional(),
    })
    .refine((f) => Object.keys(f).length > 0, { message: 'En az bir alan gerekli' }),
});

export const productBulkSchema = z.object({
  changes: z.array(productBulkChangeSchema).min(1).max(500),
});
