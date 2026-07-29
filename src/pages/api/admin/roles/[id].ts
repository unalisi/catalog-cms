import type { APIRoute } from 'astro';
import { jsonErr, jsonOk } from '../../../../lib/api';
import * as rbac from '../../../../server/services/rbac-admin';

export const prerender = false;

export const PATCH: APIRoute = async ({ params, request }) => {
  const id = params.id;
  if (!id) return jsonErr('bad_request', 'id gerekli', 400);
  const body = await request.json();
  const result = await rbac.updateAdminRole(id, body);
  if (!result.ok) {
    if ('notFound' in result && result.notFound) return jsonErr('not_found', 'Rol bulunamadı', 404);
    if ('fields' in result && result.fields) {
      return jsonErr('validation_error', 'Doğrulama hatası', 400, result.fields);
    }
    return jsonErr('bad_request', 'İstek reddedildi', 400);
  }
  return jsonOk({ role: result.data });
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) return jsonErr('bad_request', 'id gerekli', 400);
  const result = await rbac.removeAdminRole(id);
  if (!result.ok) {
    if ('notFound' in result && result.notFound) return jsonErr('not_found', 'Rol bulunamadı', 404);
    if ('fields' in result && result.fields) {
      return jsonErr('validation_error', result.fields._form ?? 'Silinemedi', 400, result.fields);
    }
    return jsonErr('bad_request', 'İstek reddedildi', 400);
  }
  return jsonOk({ role: result.data });
};
