import type { APIRoute } from 'astro';
import { jsonErr, jsonOk } from '../../../../lib/api';
import * as productsAdmin from '../../../../server/services/products-admin';

export const prerender = false;

export const GET: APIRoute = async () => {
  const products = await productsAdmin.listGridProducts();
  return jsonOk({ products });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const result = await productsAdmin.createAdminProduct(body);
  if (!result.ok) {
    if ('fields' in result && result.fields) {
      return jsonErr('validation_error', 'Doğrulama hatası', 400, result.fields);
    }
    return jsonErr('bad_request', 'İstek reddedildi', 400);
  }
  return jsonOk({ product: result.data }, { status: 201 });
};
