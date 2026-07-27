import type { APIRoute } from 'astro';
import { jsonErr, jsonOk } from '../../../../lib/api';
import * as productsAdmin from '../../../../server/services/products-admin';

export const prerender = false;

export const PATCH: APIRoute = async ({ request }) => {
  const body = await request.json();
  const result = await productsAdmin.bulkUpdateProducts(body);
  if (!result.ok) {
    return jsonErr(
      result.error.code,
      result.error.message,
      400,
      result.error.fields,
    );
  }
  return jsonOk(result.data);
};
