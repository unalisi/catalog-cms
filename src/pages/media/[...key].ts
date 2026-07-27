import type { APIRoute } from 'astro';
import { isAllowedWidth } from '../../lib/media/urls';
import { serveMediaObject } from '../../server/services/media';

export const prerender = false;

export const GET: APIRoute = async ({ params, url }) => {
  const raw = params.key;
  const key = Array.isArray(raw) ? raw.join('/') : raw;
  if (!key) return new Response('Not found', { status: 404 });

  const wParam = url.searchParams.get('w');
  let width: number | null = null;
  if (wParam) {
    const n = Number(wParam);
    if (!Number.isFinite(n) || !isAllowedWidth(n)) {
      return new Response('Invalid width', { status: 400 });
    }
    width = n;
  }

  return serveMediaObject(key, width);
};
