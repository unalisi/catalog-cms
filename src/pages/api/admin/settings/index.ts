import type { APIRoute } from 'astro';
import { jsonErr, jsonOk } from '../../../../lib/api';
import * as settingsService from '../../../../server/services/settings';
import { getSeoDefaults } from '../../../../server/services/seo';

export const prerender = false;

export const GET: APIRoute = async () => {
  const [site, seo] = await Promise.all([
    settingsService.getAdminSiteSettings(),
    getSeoDefaults(),
  ]);
  return jsonOk({ site, seo: seo.data });
};

export const PUT: APIRoute = async ({ request }) => {
  const body = await request.json();
  const result = await settingsService.updateAdminSettingsBundle(body);
  if (!result.ok) {
    return jsonErr('validation_error', 'Doğrulama hatası', 400, result.fields);
  }
  return jsonOk(result.data);
};
