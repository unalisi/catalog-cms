import type { APIRoute } from 'astro';
import { jsonErr, jsonOk } from '../../../../lib/api';
import * as adminService from '../../../../server/services/admin';
import { getDb } from '../../../../server/db';
import { listAllCategories } from '../../../../server/repos/admin';

export const prerender = false;

export const GET: APIRoute = async () => {
  const categories = await listAllCategories(getDb());
  return jsonOk({ categories });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const result = await adminService.createCategory(body);
  if (!result.ok) {
    if ('fields' in result && result.fields) {
      return jsonErr('validation_error', 'Doğrulama hatası', 400, result.fields);
    }
    return jsonErr('bad_request', 'İstek reddedildi', 400);
  }
  return jsonOk({ category: result.data }, { status: 201 });
};
