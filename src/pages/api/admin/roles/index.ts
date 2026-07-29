import type { APIRoute } from 'astro';
import { jsonErr, jsonOk } from '../../../../lib/api';
import * as rbac from '../../../../server/services/rbac-admin';

export const prerender = false;

export const GET: APIRoute = async () => {
  const roles = await rbac.listAdminRoles();
  return jsonOk({ roles });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const result = await rbac.createAdminRole(body);
  if (!result.ok) {
    if ('fields' in result && result.fields) {
      return jsonErr('validation_error', 'Doğrulama hatası', 400, result.fields);
    }
    return jsonErr('bad_request', 'İstek reddedildi', 400);
  }
  return jsonOk({ role: result.data }, { status: 201 });
};
