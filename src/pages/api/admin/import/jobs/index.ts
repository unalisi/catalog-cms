import type { APIRoute } from 'astro';
import { jsonErr, jsonOk } from '../../../../../lib/api';
import * as importService from '../../../../../server/services/import';

export const prerender = false;

export const GET: APIRoute = async () => {
  const jobs = await importService.listJobs();
  return jsonOk({ jobs });
};

export const POST: APIRoute = async ({ request, locals }) => {
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
};
