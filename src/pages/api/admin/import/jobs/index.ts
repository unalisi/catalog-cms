import type { APIRoute } from 'astro';
import { jsonErr, jsonOk } from '../../../../../lib/api';
import * as importService from '../../../../../server/services/import';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const jobs = await importService.listJobs();
    return jsonOk({ jobs });
  } catch (err) {
    return jsonErr(
      'server_error',
      err instanceof Error ? err.message : 'İş listesi alınamadı',
      500,
    );
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const result = await importService.createJobFromPayload({
      source: body.source as 'csv' | 'woo' | 'wxr',
      content: String(body.content ?? ''),
      mapping: body.mapping as never,
      conflictPolicy: body.conflictPolicy as never,
      userId: locals.user?.id ?? null,
    });
    if (!result.ok) {
      return jsonErr('validation_error', 'Doğrulama hatası', 400, result.fields);
    }
    return jsonOk(result.data, { status: 201 });
  } catch (err) {
    return jsonErr(
      'server_error',
      err instanceof Error ? err.message : 'Import işi oluşturulamadı',
      500,
    );
  }
};
