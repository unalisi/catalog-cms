import type { APIRoute } from 'astro';
import { jsonErr } from '../../../../lib/api';
import * as exportService from '../../../../server/services/export-products';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const formatRaw = url.searchParams.get('format') || 'csv';
  if (formatRaw !== 'csv' && formatRaw !== 'woo-json') {
    return jsonErr('validation_error', 'format csv veya woo-json olmalı', 400);
  }

  const result = await exportService.exportProducts(formatRaw, url.origin);
  return new Response(result.body, {
    status: 200,
    headers: {
      'Content-Type': result.contentType,
      'Content-Disposition': `attachment; filename="${result.filename}"`,
      'X-Export-Count': String(result.count),
      'Cache-Control': 'no-store',
    },
  });
};
