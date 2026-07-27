import type { APIRoute } from 'astro';
import { jsonErr, jsonOk } from '../../../../lib/api';
import * as seoService from '../../../../server/services/seo';

export const prerender = false;

export const GET: APIRoute = async () => {
  const { data } = await seoService.getSeoDefaults();
  return jsonOk({ defaults: data });
};

export const PUT: APIRoute = async ({ request }) => {
  const body = await request.json();
  const result = await seoService.updateSeoDefaults(body);
  if (!result.ok) {
    return jsonErr('validation_error', 'Doğrulama hatası', 400, result.fields);
  }
  return jsonOk({ defaults: result.data });
};
