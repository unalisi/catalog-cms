import type { APIRoute } from 'astro';
import { jsonErr, jsonOk } from '../../../../lib/api';
import * as mediaService from '../../../../server/services/media';

export const prerender = false;

export const PATCH: APIRoute = async ({ params, request }) => {
  const id = params.id;
  if (!id) return jsonErr('bad_request', 'id gerekli', 400);
  const body = await request.json();
  const result = await mediaService.updateAdminMedia(id, body);
  if (!result.ok) {
    if ('notFound' in result && result.notFound) return jsonErr('not_found', 'Medya bulunamadı', 404);
    if ('fields' in result && result.fields) {
      return jsonErr('validation_error', 'Doğrulama hatası', 400, result.fields);
    }
    return jsonErr('bad_request', 'İstek reddedildi', 400);
  }
  return jsonOk({ media: result.data });
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) return jsonErr('bad_request', 'id gerekli', 400);
  const result = await mediaService.removeAdminMedia(id);
  if (!result.ok) {
    if ('notFound' in result && result.notFound) return jsonErr('not_found', 'Medya bulunamadı', 404);
    if ('fields' in result && result.fields) {
      return jsonErr('conflict', result.fields._form ?? 'Silinemedi', 409, result.fields);
    }
    return jsonErr('bad_request', 'İstek reddedildi', 400);
  }
  return jsonOk({ media: result.data });
};
