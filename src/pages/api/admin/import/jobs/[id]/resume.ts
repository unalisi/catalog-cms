import type { APIRoute } from 'astro';
import { jsonErr, jsonOk } from '../../../../../../lib/api';
import * as importControl from '../../../../../../server/services/import-control';

export const prerender = false;

export const POST: APIRoute = async ({ params }) => {
  try {
    const id = params.id;
    if (!id) return jsonErr('bad_request', 'id gerekli', 400);
    const result = await importControl.resumeImportJob(id);
    if (!result.ok) {
      if (result.notFound) return jsonErr('not_found', 'İş bulunamadı', 404);
      if (result.fields) {
        return jsonErr('conflict', result.fields._form ?? 'Devam ettirilemedi', 409, result.fields);
      }
      return jsonErr('bad_request', 'Devam ettirilemedi', 400);
    }
    return jsonOk({ job: result.data });
  } catch (err) {
    return jsonErr(
      'server_error',
      err instanceof Error ? err.message : 'Devam ettirme sırasında sunucu hatası',
      500,
    );
  }
};
