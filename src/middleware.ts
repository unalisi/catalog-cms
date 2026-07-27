import { defineMiddleware } from 'astro:middleware';

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN',
};

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Auth guard (FAZ 2): /admin (except login) and /api/admin require session.
  // FAZ 0: only stub — allow through so layouts are reachable.
  if (pathname.startsWith('/api/admin') || (pathname.startsWith('/admin') && pathname !== '/admin/login')) {
    // TODO(FAZ 2): redirect unauthenticated users to /admin/login
  }

  const response = await next();

  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
