import type { APIRoute } from 'astro';
import { jsonOk } from '../../../../lib/api';
import { clearSession } from '../../../../server/auth/session';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  clearSession(context);
  const contentType = context.request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return context.redirect('/admin/login');
  }
  return jsonOk({ loggedOut: true });
};
