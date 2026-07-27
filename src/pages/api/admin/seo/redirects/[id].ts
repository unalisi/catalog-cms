import type { APIRoute } from 'astro';
import { jsonErr, jsonOk } from '../../../../../lib/api';
import * as seoService from '../../../../../server/services/seo';

export const prerender = false;

export const DELETE: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) return jsonErr('bad_request', 'id gerekli', 400);
  const result = await seoService.removeRedirectAdmin(id);
  if (!result.ok) return jsonErr('not_found', 'Yönlendirme bulunamadı', 404);
  return jsonOk({ redirect: result.data });
};
