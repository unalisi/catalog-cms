import type { APIRoute } from 'astro';
import { jsonErr, jsonOk } from '../../../../lib/api';
import * as pagesService from '../../../../server/services/pages';

export const prerender = false;

export const PATCH: APIRoute = async ({ params, request }) => {
  const id = params.id;
  if (!id) return jsonErr('bad_request', 'id gerekli', 400);
  const body = await request.json();
  const result = await pagesService.patchSection(id, body);
  if (!result.ok) {
    if ('notFound' in result && result.notFound) return jsonErr('not_found', 'Section bulunamadı', 404);
    if ('fields' in result && result.fields) {
      return jsonErr('validation_error', 'Doğrulama hatası', 400, result.fields);
    }
    return jsonErr('bad_request', 'İstek reddedildi', 400);
  }
  return jsonOk({ section: result.data });
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) return jsonErr('bad_request', 'id gerekli', 400);
  const result = await pagesService.removeSection(id);
  if (!result.ok) {
    if ('notFound' in result && result.notFound) return jsonErr('not_found', 'Section bulunamadı', 404);
    if ('error' in result && result.error) {
      return jsonErr(result.error.code, result.error.message, 403);
    }
    return jsonErr('bad_request', 'İstek reddedildi', 400);
  }
  return jsonOk({ section: result.data });
};
