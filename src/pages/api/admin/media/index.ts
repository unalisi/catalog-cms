import type { APIRoute } from 'astro';
import { jsonErr, jsonOk } from '../../../../lib/api';
import * as mediaService from '../../../../server/services/media';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const q = url.searchParams.get('q') ?? undefined;
  const page = Number(url.searchParams.get('page') ?? '1') || 1;
  const pageSize = Number(url.searchParams.get('pageSize') ?? '24') || 24;
  const result = await mediaService.listAdminMedia({ q, page, pageSize });
  return jsonOk(result);
};

export const POST: APIRoute = async ({ request }) => {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('multipart/form-data')) {
    return jsonErr('bad_request', 'multipart/form-data gerekli', 400);
  }
  const formData = await request.formData();
  const result = await mediaService.uploadAdminMedia(formData);
  if (!result.ok) {
    return jsonErr('validation_error', 'Doğrulama hatası', 400, result.fields);
  }
  return jsonOk({ media: result.data }, { status: 201 });
};
