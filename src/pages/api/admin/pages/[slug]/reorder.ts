import type { APIRoute } from 'astro';
import { jsonErr, jsonOk } from '../../../../../lib/api';
import * as pagesService from '../../../../../server/services/pages';

export const prerender = false;

export const PATCH: APIRoute = async ({ params, request }) => {
  const slug = params.slug;
  if (!slug) return jsonErr('bad_request', 'slug gerekli', 400);
  const body = await request.json();
  const result = await pagesService.reorderPageSections(slug, body);
  if (!result.ok) {
    if ('notFound' in result && result.notFound) return jsonErr('not_found', 'Sayfa bulunamadı', 404);
    if ('fields' in result && result.fields) {
      return jsonErr('validation_error', 'Doğrulama hatası', 400, result.fields);
    }
    return jsonErr('bad_request', 'İstek reddedildi', 400);
  }
  return jsonOk({ sections: result.data });
};
