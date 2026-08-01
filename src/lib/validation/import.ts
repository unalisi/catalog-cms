import { z } from 'zod';
import { productStatusSchema } from './products';

export const importSourceSchema = z.enum(['csv', 'woo', 'wxr']);

export const conflictPolicySchema = z.enum(['skip', 'overwrite', 'merge']);

export const importRecordMediaSchema = z.object({
  url: z.string().min(1),
  alt: z.string().optional(),
});

export const importRecordSeoSchema = z.object({
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

/** Common normalized shape all import adapters (CSV/WooCommerce/WXR) map into. */
export const importRecordSchema = z.object({
  name: z.string().min(1, 'Ad zorunlu'),
  slug: z.string().min(1, 'Slug zorunlu'),
  sku: z.string().max(80).optional().nullable(),
  description: z.string().optional().nullable(),
  price: z.number().int().min(0, 'Fiyat kuruş cinsinden tam sayı olmalı'),
  compareAtPrice: z.number().int().min(0).optional().nullable(),
  stock: z.number().int().min(0),
  status: productStatusSchema,
  brand: z.string().optional().nullable(),
  categories: z.array(z.string()).optional(),
  media: z.array(importRecordMediaSchema).optional(),
  seo: importRecordSeoSchema.optional(),
});

/** Maps source columns (CSV headers) to ImportRecord fields. Categories is comma-separated. */
export const mappingProfileSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  sku: z.string().optional(),
  price: z.string().min(1),
  compareAtPrice: z.string().optional(),
  stock: z.string().optional(),
  description: z.string().optional(),
  brand: z.string().optional(),
  categories: z.string().optional(),
  imageUrl: z.string().optional(),
  status: z.string().optional(),
});

export const importJobCreateSchema = z.object({
  source: importSourceSchema,
  content: z.string().min(1, 'İçerik gerekli'),
  mapping: mappingProfileSchema.optional(),
  conflictPolicy: conflictPolicySchema.default('skip'),
});

export type ImportRecordInput = z.infer<typeof importRecordSchema>;
export type MappingProfileInput = z.infer<typeof mappingProfileSchema>;
export type ConflictPolicyInput = z.infer<typeof conflictPolicySchema>;
export type ImportJobCreateInput = z.infer<typeof importJobCreateSchema>;
