import { normalizeTags, sanitizeHtml } from '../../lib/html/sanitize';
import { invalidatePostCache } from '../../lib/cache/invalidate';
import { CACHE_KEYS, CACHE_TTL, stableHash } from '../../lib/cache/keys';
import { cacheFirst, getListPostsVersion } from '../../lib/cache/kv';
import { postUpsertSchema } from '../../lib/validation/posts';
import { zodFieldErrors } from '../../lib/validation/admin';
import { getDb } from '../db';
import * as postsRepo from '../repos/posts';
import * as mediaRepo from '../repos/media';
import * as seoRepo from '../repos/seo';

function normalizePublishedAt(
  status: 'draft' | 'published' | 'archived',
  raw: string | null | undefined,
): string | null {
  if (status === 'draft' || status === 'archived') {
    if (!raw?.trim()) return null;
  }
  if (!raw?.trim()) {
    return status === 'published' ? new Date().toISOString() : null;
  }
  const parsed = new Date(raw.trim());
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

export async function listAdminPosts() {
  return postsRepo.listAllPosts(getDb());
}

export async function getAdminPost(id: string) {
  const db = getDb();
  const post = await postsRepo.getPostById(db, id);
  if (!post) return null;
  const seo = post.seoId ? await seoRepo.getSeoById(db, post.seoId) : null;
  const cover = post.coverMediaId ? await mediaRepo.getMediaById(db, post.coverMediaId) : null;
  return { post, seo, cover };
}

export async function createAdminPost(input: unknown) {
  const parsed = postUpsertSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, fields: zodFieldErrors(parsed.error) };
  }
  const db = getDb();
  if (await postsRepo.isPostSlugTaken(db, parsed.data.slug)) {
    return { ok: false as const, fields: { slug: 'Bu slug zaten kullanılıyor' } };
  }

  const publishedAt = normalizePublishedAt(parsed.data.status, parsed.data.publishedAt);
  if (parsed.data.status === 'published' && !publishedAt) {
    return { ok: false as const, fields: { publishedAt: 'Geçerli bir yayın tarihi girin' } };
  }

  const { seo, tags, content, ...rest } = parsed.data;
  let seoId: string | null = null;
  if (seo) seoId = await seoRepo.upsertSeoMeta(db, null, seo);

  const post = await postsRepo.createPost(db, {
    ...rest,
    content: sanitizeHtml(content),
    excerpt: rest.excerpt?.trim() || null,
    publishedAt,
    seoId,
    coverMediaId: rest.coverMediaId || null,
    tags: normalizeTags(tags),
  });
  await invalidatePostCache(post.slug);
  return { ok: true as const, data: post };
}

export async function updateAdminPost(id: string, input: unknown) {
  const parsed = postUpsertSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, fields: zodFieldErrors(parsed.error) };
  }
  const db = getDb();
  const existing = await postsRepo.getPostById(db, id);
  if (!existing) return { ok: false as const, notFound: true as const };
  if (await postsRepo.isPostSlugTaken(db, parsed.data.slug, id)) {
    return { ok: false as const, fields: { slug: 'Bu slug zaten kullanılıyor' } };
  }

  const publishedAt = normalizePublishedAt(parsed.data.status, parsed.data.publishedAt);
  if (parsed.data.status === 'published' && !publishedAt) {
    return { ok: false as const, fields: { publishedAt: 'Geçerli bir yayın tarihi girin' } };
  }

  const { seo, tags, content, ...rest } = parsed.data;
  let seoId = existing.seoId;
  if (seo) seoId = await seoRepo.upsertSeoMeta(db, existing.seoId, seo);

  const post = await postsRepo.updatePost(db, id, {
    ...rest,
    content: sanitizeHtml(content),
    excerpt: rest.excerpt?.trim() || null,
    publishedAt,
    seoId,
    coverMediaId: rest.coverMediaId || null,
    tags: normalizeTags(tags),
  });
  if (!post) return { ok: false as const, notFound: true as const };

  if (existing.slug !== post.slug) {
    await seoRepo.recordSlugChangeRedirect(db, '/blog', existing.slug, post.slug);
  }
  await invalidatePostCache(post.slug, existing.slug);
  return { ok: true as const, data: post };
}

export async function removeAdminPost(id: string) {
  const db = getDb();
  const deleted = await postsRepo.deletePost(db, id);
  if (!deleted) return { ok: false as const, notFound: true as const };
  await invalidatePostCache(deleted.slug);
  return { ok: true as const, data: deleted };
}

export async function getPublicPostBySlug(slug: string) {
  return cacheFirst(CACHE_KEYS.post(slug), CACHE_TTL.post, () =>
    postsRepo.getPublishedPostBySlug(getDb(), slug),
  );
}

export async function getPublicPostList(opts: {
  page?: number;
  pageSize?: number;
  tag?: string;
}) {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(24, Math.max(1, opts.pageSize ?? 10));
  const filter = { page, pageSize, tag: opts.tag };
  const ver = await getListPostsVersion();
  const hash = stableHash(filter);
  const key = CACHE_KEYS.listPosts(ver, hash);
  return cacheFirst(key, CACHE_TTL.list, () => postsRepo.listPublishedPosts(getDb(), filter));
}

export async function getRecentPosts(limit: number) {
  const ver = await getListPostsVersion();
  const key = CACHE_KEYS.listPostsRecent(ver, limit);
  return cacheFirst(key, CACHE_TTL.list, () =>
    postsRepo.listRecentPublishedPosts(getDb(), limit),
  );
}

export async function getRssPosts() {
  const ver = await getListPostsVersion();
  const key = CACHE_KEYS.listPostsFeed(ver);
  return cacheFirst(key, CACHE_TTL.list, () => postsRepo.listPublishedPostsForFeed(getDb(), 50));
}
