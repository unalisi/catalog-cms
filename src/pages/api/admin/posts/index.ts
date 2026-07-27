import type { APIRoute } from 'astro';
import { jsonErr, jsonOk } from '../../../../lib/api';
import * as postsService from '../../../../server/services/posts';

export const prerender = false;

export const GET: APIRoute = async () => {
  const posts = await postsService.listAdminPosts();
  return jsonOk({ posts });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const result = await postsService.createAdminPost(body);
  if (!result.ok) {
    if ('fields' in result && result.fields) {
      return jsonErr('validation_error', 'Doğrulama hatası', 400, result.fields);
    }
    return jsonErr('bad_request', 'İstek reddedildi', 400);
  }
  return jsonOk({ post: result.data }, { status: 201 });
};
