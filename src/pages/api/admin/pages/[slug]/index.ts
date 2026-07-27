import type { APIRoute } from 'astro';
import { jsonErr, jsonOk } from '../../../../../lib/api';
import * as pagesService from '../../../../../server/services/pages';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug;
  if (!slug) return jsonErr('bad_request', 'slug gerekli', 400);
  const page = await pagesService.getAdminPage(slug);
  if (!page) return jsonErr('not_found', 'Sayfa bulunamadı', 404);
  return jsonOk({ page, sectionTypes: pagesService.listSectionTypeOptions() });
};

export const PATCH: APIRoute = async ({ params, request }) => {
  const slug = params.slug;
  if (!slug) return jsonErr('bad_request', 'slug gerekli', 400);
  const body = await request.json();
  const result = await pagesService.updateAdminPage(slug, body);
  if (!result.ok) {
    if ('notFound' in result && result.notFound) return jsonErr('not_found', 'Sayfa bulunamadı', 404);
    if ('fields' in result && result.fields) {
      return jsonErr('validation_error', 'Doğrulama hatası', 400, result.fields);
    }
    return jsonErr('bad_request', 'İstek reddedildi', 400);
  }
  return jsonOk({ page: result.data });
};

export const DELETE: APIRoute = async ({ params }) => {
  const slug = params.slug;
  if (!slug) return jsonErr('bad_request', 'slug gerekli', 400);
  const result = await pagesService.removeAdminPage(slug);
  if (!result.ok) {
    if ('notFound' in result && result.notFound) return jsonErr('not_found', 'Sayfa bulunamadı', 404);
    if ('fields' in result && result.fields) {
      return jsonErr('validation_error', result.fields._form ?? 'Silinemedi', 400, result.fields);
    }
    return jsonErr('bad_request', 'İstek reddedildi', 400);
  }
  return jsonOk({ page: result.data });
};
