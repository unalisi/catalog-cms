import type { APIRoute } from 'astro';
import { jsonErr, jsonOk } from '../../../../lib/api';
import { loginSchema, zodFieldErrors } from '../../../../lib/validation/admin';
import {
  authenticate,
  rateLimitLogin,
  setSessionUser,
} from '../../../../server/auth/session';

export const prerender = false;

function safeNext(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/admin')) return '/admin';
  if (value.startsWith('//') || value.includes('://')) return '/admin';
  return value;
}

export const POST: APIRoute = async (context) => {
  const ip = context.clientAddress || 'unknown';
  if (!(await rateLimitLogin(ip))) {
    return jsonErr('rate_limited', 'Çok fazla deneme. Bir dakika bekleyin.', 429);
  }

  const contentType = context.request.headers.get('content-type') || '';
  let email = '';
  let password = '';
  let next = '/admin';

  if (contentType.includes('application/json')) {
    const body = (await context.request.json()) as Record<string, unknown>;
    email = String(body.email ?? '');
    password = String(body.password ?? '');
    next = safeNext(body.next);
  } else {
    const form = await context.request.formData();
    email = String(form.get('email') ?? '');
    password = String(form.get('password') ?? '');
    next = safeNext(form.get('next'));
  }

  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success) {
    if (!contentType.includes('application/json')) {
      const url = new URL('/admin/login', context.url);
      url.searchParams.set('error', 'validation');
      url.searchParams.set('next', next);
      return context.redirect(url.toString());
    }
    return jsonErr('validation_error', 'Geçersiz giriş bilgileri', 400, zodFieldErrors(parsed.error));
  }

  const user = await authenticate(parsed.data.email, parsed.data.password);
  if (!user) {
    if (!contentType.includes('application/json')) {
      const url = new URL('/admin/login', context.url);
      url.searchParams.set('error', 'invalid');
      url.searchParams.set('next', next);
      return context.redirect(url.toString());
    }
    return jsonErr('invalid_credentials', 'E-posta veya parola hatalı', 401);
  }

  setSessionUser(context, user);

  if (!contentType.includes('application/json')) {
    return context.redirect(next);
  }
  return jsonOk({ user, redirectTo: next });
};
