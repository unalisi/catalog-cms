import { z } from 'zod';
import { SECTION_TYPES, isSectionType, parseSectionConfig, sectionDefaults, type SectionType } from '../sections/registry';
import { seoFieldsSchema } from './seo';

export const pageUpsertSchema = z.object({
  title: z.string().min(1, 'Başlık zorunlu').max(160),
  slug: z
    .string()
    .min(1, 'Slug zorunlu')
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug yalnızca küçük harf, rakam ve tire'),
  status: z.enum(['draft', 'published', 'archived']),
  seo: seoFieldsSchema.optional().nullable(),
});

export const sectionCreateSchema = z.object({
  type: z.enum(SECTION_TYPES as unknown as [SectionType, ...SectionType[]]),
});


export const sectionUpdateSchema = z.object({
  isVisible: z.boolean().optional(),
  config: z.unknown().optional(),
});

export const sectionReorderSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});

export function serializeSectionConfig(type: string, config: unknown): string | null {
  if (!isSectionType(type)) return null;
  const parsed = parseSectionConfig(type, config ?? sectionDefaults[type]);
  if (!parsed.ok) return null;
  return JSON.stringify(parsed.data);
}
