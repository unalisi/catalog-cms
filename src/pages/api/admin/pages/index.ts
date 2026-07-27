import type { APIRoute } from 'astro';
import { jsonErr, jsonOk } from '../../../../lib/api';
import * as pagesService from '../../../../server/services/pages';

export const prerender = false;

export const GET: APIRoute = async () => {
  const pages = await pagesService.listAdminPages();
  return jsonOk({ pages, sectionTypes: pagesService.listSectionTypeOptions() });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const result = await pagesService.createAdminPage(body);
  if (!result.ok) {
    if ('fields' in result && result.fields) {
      return jsonErr('validation_error', 'Doğrulama hatası', 400, result.fields);
    }
    return jsonErr('bad_request', 'İstek reddedildi', 400);
  }
  return jsonOk({ page: result.data }, { status: 201 });
};
