import type { APIRoute } from 'astro';
import { z } from 'zod';
import { jsonErr } from '../../../../lib/api';
import { getDb } from '../../../../server/db';
import {
  createExportStream,
  exportContentType,
  exportFileName,
  normalizeExportFormat,
} from '../../../../server/export/stream';

export const prerender = false;

const querySchema = z.object({
  format: z.string(),
  status: z.enum(['draft', 'published', 'archived', 'all']).optional(),
  brandId: z.string().optional(),
  categoryId: z.string().optional(),
});

export const GET: APIRoute = async ({ url }) => {
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return jsonErr('validation_error', 'Geçersiz export parametreleri', 400);
  }

  const format = normalizeExportFormat(parsed.data.format);
  if (!format) {
    return jsonErr(
      'validation_error',
      'format csv, xml veya woocommerce-json olmalı',
      400,
    );
  }

  const status =
    parsed.data.status && parsed.data.status !== 'all' ? parsed.data.status : undefined;

  const stream = createExportStream(
    getDb(),
    format,
    {
      status,
      brandId: parsed.data.brandId,
      categoryId: parsed.data.categoryId,
    },
    url.origin,
  );

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': exportContentType(format),
      'Content-Disposition': `attachment; filename="${exportFileName(format)}"`,
      'Cache-Control': 'private, no-store',
    },
  });
};
