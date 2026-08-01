import type { APIRoute } from 'astro';
import { jsonErr, jsonOk } from '../../../../../../lib/api';
import * as importService from '../../../../../../server/services/import';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  try {
    const id = params.id;
    if (!id) return jsonErr('bad_request', 'id gerekli', 400);
    const job = await importService.getJob(id);
    if (!job) return jsonErr('not_found', 'İş bulunamadı', 404);
    return jsonOk({ job });
  } catch (err) {
    return jsonErr(
      'server_error',
      err instanceof Error ? err.message : 'İş detayı alınamadı',
      500,
    );
  }
};
