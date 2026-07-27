import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta girin'),
  password: z.string().min(8, 'Parola en az 8 karakter olmalı'),
});

export const brandSchema = z.object({
  name: z.string().min(1, 'Ad zorunlu').max(120),
  slug: z
    .string()
    .min(1, 'Slug zorunlu')
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug yalnızca küçük harf, rakam ve tire'),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(['draft', 'published', 'archived']),
});

export const categorySchema = z.object({
  name: z.string().min(1, 'Ad zorunlu').max(120),
  slug: z
    .string()
    .min(1, 'Slug zorunlu')
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug yalnızca küçük harf, rakam ve tire'),
  description: z.string().max(2000).optional().nullable(),
  parentId: z.string().optional().nullable(),
  position: z.coerce.number().int().min(0).default(0),
  status: z.enum(['draft', 'published', 'archived']),
});

export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_form';
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}
