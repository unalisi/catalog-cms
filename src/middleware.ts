import { defineMiddleware } from 'astro:middleware';
import { getSessionUser, isSameOrigin } from './server/auth/session';
import { findRedirect } from './server/services/seo';
import { adminCsp, publicCsp } from './lib/security/csp';
import { clientIp, logEvent, newRequestId, rateLimit } from './lib/security/rate-limit';

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
};

function isProtectedAdminPath(pathname: string): boolean {
  if (pathname === '/admin/login') return false;
  if (pathname === '/api/admin/auth/login') return false;
  return pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
}

export const onRequest = defineMiddleware(async (context, next) => {
  const started = Date.now();
  const requestId = newRequestId();
  context.locals.requestId = requestId;

  const { pathname } = context.url;
  const method = context.request.method;
  const isAdminArea = isProtectedAdminPath(pathname);
  const ip = clientIp(context.request, context.clientAddress || 'unknown');

  // Public redirects (skip admin + api + assets + media)
  if (
    !isAdminArea &&
    !pathname.startsWith('/api/') &&
    !pathname.startsWith('/_astro') &&
    !pathname.startsWith('/media/') &&
    method === 'GET'
  ) {
    try {
      const redirect = await findRedirect(pathname);
      if (redirect && redirect.toPath !== pathname) {
        const target = new URL(redirect.toPath, context.url.origin);
        target.search = context.url.search;
        return context.redirect(target.toString(), redirect.statusCode as 301 | 302);
      }
    } catch {
      // DB unavailable should not block the site
    }
  }

  if (pathname.startsWith('/api/admin/import') && method !== 'GET' && method !== 'HEAD') {
    if (!(await rateLimit('import', ip, 30, 60))) {
      return Response.json(
        { ok: false, error: { code: 'rate_limited', message: 'Çok fazla import isteği' } },
        { status: 429, headers: { 'X-Request-Id': requestId } },
      );
    }
  }

  if (isAdminArea) {
    const user = await getSessionUser(context);
    if (!user) {
      if (pathname.startsWith('/api/admin')) {
        return Response.json(
          { ok: false, error: { code: 'unauthorized', message: 'Giriş gerekli' } },
          { status: 401, headers: { 'X-Request-Id': requestId } },
        );
      }
      const login = new URL('/admin/login', context.url);
      login.searchParams.set('next', pathname);
      return context.redirect(login.toString());
    }
    context.locals.user = user;

    if (
      pathname.startsWith('/api/admin') &&
      method !== 'GET' &&
      method !== 'HEAD' &&
      !isSameOrigin(context.request)
    ) {
      return Response.json(
        { ok: false, error: { code: 'forbidden', message: 'Geçersiz origin' } },
        { status: 403, headers: { 'X-Request-Id': requestId } },
      );
    }
  }

  const response = await next();
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value);
  }
  headers.set('Content-Security-Policy', isAdminArea || pathname.startsWith('/admin') ? adminCsp() : publicCsp());
  headers.set('X-Request-Id', requestId);
  if (isAdminArea || pathname.startsWith('/admin')) {
    headers.set('Cache-Control', 'private, no-store');
  }

  logEvent({
    level: 'info',
    msg: 'request',
    requestId,
    method,
    path: pathname,
    status: response.status,
    ms: Date.now() - started,
    admin: isAdminArea,
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
