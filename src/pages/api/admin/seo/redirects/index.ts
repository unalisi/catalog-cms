import type { APIRoute } from 'astro';
import { jsonErr, jsonOk } from '../../../../../lib/api';
import * as seoService from '../../../../../server/services/seo';

export const prerender = false;

export const GET: APIRoute = async () => {
  const redirects = await seoService.listRedirectsAdmin();
  return jsonOk({ redirects });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const result = await seoService.createRedirectAdmin(body);
  if (!result.ok) {
    return jsonErr('validation_error', 'Doğrulama hatası', 400, result.fields);
  }
  return jsonOk({ redirect: result.data }, { status: 201 });
};
