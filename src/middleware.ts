import { defineMiddleware } from 'astro:middleware';
import { getSessionUser, isSameOrigin } from './server/auth/session';

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN',
};

function isProtectedAdminPath(pathname: string): boolean {
  if (pathname === '/admin/login') return false;
  if (pathname === '/api/admin/auth/login') return false;
  return pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const isAdminArea = isProtectedAdminPath(pathname);

  if (isAdminArea) {
    const user = await getSessionUser(context);
    if (!user) {
      if (pathname.startsWith('/api/admin')) {
        return Response.json(
          { ok: false, error: { code: 'unauthorized', message: 'Giriş gerekli' } },
          { status: 401 },
        );
      }
      const login = new URL('/admin/login', context.url);
      login.searchParams.set('next', pathname);
      return context.redirect(login.toString());
    }
    context.locals.user = user;

    if (
      pathname.startsWith('/api/admin') &&
      context.request.method !== 'GET' &&
      context.request.method !== 'HEAD' &&
      !isSameOrigin(context.request)
    ) {
      return Response.json(
        { ok: false, error: { code: 'forbidden', message: 'Geçersiz origin' } },
        { status: 403 },
      );
    }
  }

  const response = await next();
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value);
  }
  if (isAdminArea) {
    headers.set('Cache-Control', 'private, no-store');
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
