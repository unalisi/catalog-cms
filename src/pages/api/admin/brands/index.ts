import type { APIRoute } from 'astro';
import { jsonErr, jsonOk } from '../../../../lib/api';
import * as adminService from '../../../../server/services/admin';
import { getDb } from '../../../../server/db';
import { listAllBrands } from '../../../../server/repos/admin';

export const prerender = false;

export const GET: APIRoute = async () => {
  const brands = await listAllBrands(getDb());
  return jsonOk({ brands });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const result = await adminService.createBrand(body);
  if (!result.ok) {
    if ('fields' in result && result.fields) {
      return jsonErr('validation_error', 'Doğrulama hatası', 400, result.fields);
    }
    return jsonErr('bad_request', 'İstek reddedildi', 400);
  }
  return jsonOk({ brand: result.data }, { status: 201 });
};
