import type { APIRoute } from 'astro';
import { jsonErr, jsonOk } from '../../../../../../lib/api';
import * as importService from '../../../../../../server/services/import';

export const prerender = false;

export const POST: APIRoute = async ({ params }) => {
  try {
    const id = params.id;
    if (!id) return jsonErr('bad_request', 'id gerekli', 400);
    const result = await importService.applyJob(id);
    if (!result.ok) {
      if ('notFound' in result && result.notFound) return jsonErr('not_found', 'İş bulunamadı', 404);
      if ('fields' in result && result.fields) {
        return jsonErr('conflict', result.fields._form ?? 'İş uygulanamadı', 409, result.fields);
      }
      return jsonErr('bad_request', 'İş uygulanamadı', 400);
    }
    return jsonOk({ job: result.data });
  } catch (err) {
    return jsonErr(
      'server_error',
      err instanceof Error ? err.message : 'Apply sırasında sunucu hatası',
      500,
    );
  }
};
