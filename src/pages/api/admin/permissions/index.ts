import type { APIRoute } from 'astro';
import { jsonOk } from '../../../../lib/api';
import { listPermissionCatalog } from '../../../../server/services/rbac-admin';

export const prerender = false;

export const GET: APIRoute = async () => {
  return jsonOk({ permissions: listPermissionCatalog() });
};
