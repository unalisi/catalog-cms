import type { APIRoute } from 'astro';
import { jsonErr, jsonOk } from '../../../../lib/api';
import * as rbac from '../../../../server/services/rbac-admin';

export const prerender = false;

export const GET: APIRoute = async () => {
  const users = await rbac.listAdminUsers();
  return jsonOk({ users });
};

export const POST: APIRoute = async ({ request, locals, url }) => {
  const body = await request.json();
  const actorId = locals.user?.id;
  if (!actorId) return jsonErr('unauthorized', 'Giriş gerekli', 401);
  const result = await rbac.createAdminUser(body, actorId, { loginOrigin: url.origin });
  if (!result.ok) {
    if ('fields' in result && result.fields) {
      return jsonErr('validation_error', 'Doğrulama hatası', 400, result.fields);
    }
    return jsonErr('bad_request', 'İstek reddedildi', 400);
  }
  return jsonOk({ user: result.data }, { status: 201 });
};
