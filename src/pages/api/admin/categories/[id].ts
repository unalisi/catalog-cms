import type { APIRoute } from 'astro';
import { jsonErr, jsonOk } from '../../../../lib/api';
import * as adminService from '../../../../server/services/admin';

export const prerender = false;

export const PATCH: APIRoute = async ({ params, request }) => {
  const id = params.id;
  if (!id) return jsonErr('bad_request', 'id gerekli', 400);
  const body = await request.json();
  const result = await adminService.updateCategory(id, body);
  if (!result.ok) {
    if ('notFound' in result && result.notFound) {
      return jsonErr('not_found', 'Kategori bulunamadı', 404);
    }
    if ('fields' in result && result.fields) {
      return jsonErr('validation_error', 'Doğrulama hatası', 400, result.fields);
    }
    return jsonErr('bad_request', 'İstek reddedildi', 400);
  }
  return jsonOk({ category: result.data });
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) return jsonErr('bad_request', 'id gerekli', 400);
  const result = await adminService.removeCategory(id);
  if (!result.ok) return jsonErr('not_found', 'Kategori bulunamadı', 404);
  return jsonOk({ category: result.data });
};
