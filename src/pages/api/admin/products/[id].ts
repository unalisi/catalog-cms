import type { APIRoute } from 'astro';
import { jsonErr, jsonOk } from '../../../../lib/api';
import * as productsAdmin from '../../../../server/services/products-admin';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) return jsonErr('bad_request', 'id gerekli', 400);
  const product = await productsAdmin.getAdminProduct(id);
  if (!product) return jsonErr('not_found', 'Ürün bulunamadı', 404);
  return jsonOk({ product });
};

export const PATCH: APIRoute = async ({ params, request }) => {
  const id = params.id;
  if (!id) return jsonErr('bad_request', 'id gerekli', 400);
  const body = await request.json();
  const result = await productsAdmin.updateAdminProduct(id, body);
  if (!result.ok) {
    if ('notFound' in result && result.notFound) return jsonErr('not_found', 'Ürün bulunamadı', 404);
    if ('fields' in result && result.fields) {
      return jsonErr('validation_error', 'Doğrulama hatası', 400, result.fields);
    }
    return jsonErr('bad_request', 'İstek reddedildi', 400);
  }
  return jsonOk({ product: result.data });
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) return jsonErr('bad_request', 'id gerekli', 400);
  const result = await productsAdmin.removeAdminProduct(id);
  if (!result.ok) return jsonErr('not_found', 'Ürün bulunamadı', 404);
  return jsonOk({ product: result.data });
};
