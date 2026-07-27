import { z } from 'zod';
import { seoFieldsSchema } from './seo';

export const postStatusSchema = z.enum(['draft', 'published', 'archived']);

export const postUpsertSchema = z.object({
  title: z.string().min(1, 'Başlık zorunlu').max(200),
  slug: z
    .string()
    .min(1, 'Slug zorunlu')
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug yalnızca küçük harf, rakam ve tire'),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().max(100000).default(''),
  status: postStatusSchema,
  publishedAt: z
    .string()
    .max(40)
    .optional()
    .nullable()
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), 'Geçerli bir tarih girin'),
  tags: z.array(z.string()).max(20).optional().default([]),
  seo: seoFieldsSchema.optional().nullable(),
});
