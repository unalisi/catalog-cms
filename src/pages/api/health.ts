import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = ({ locals }) => {
  return Response.json(
    {
      ok: true,
      ts: new Date().toISOString(),
      service: 'catalog-cms',
      requestId: locals.requestId ?? null,
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
};
