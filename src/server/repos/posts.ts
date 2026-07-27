import { and, asc, count, desc, eq, inArray, lte, ne, sql } from 'drizzle-orm';
import { posts, postTags, seoMeta, type Post } from '../../../db/schema';
import type { Db } from '../db';
import { newId, nowIso } from '../../lib/utils/id';

export type PostWithTags = Post & { tags: string[] };

export type PostPublic = PostWithTags & {
  seo: typeof seoMeta.$inferSelect | null;
};

async function attachTags(db: Db, rows: Post[]): Promise<PostWithTags[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const tagRows = await db.select().from(postTags).where(inArray(postTags.postId, ids));
  const byPost = new Map<string, string[]>();
  for (const row of tagRows) {
    const list = byPost.get(row.postId) ?? [];
    list.push(row.tag);
    byPost.set(row.postId, list);
  }
  return rows.map((row) => ({
    ...row,
    tags: (byPost.get(row.id) ?? []).sort(),
  }));
}

export async function listAllPosts(db: Db): Promise<PostWithTags[]> {
  const rows = await db.select().from(posts).orderBy(desc(posts.updatedAt));
  return attachTags(db, rows);
}

export async function getPostById(db: Db, id: string): Promise<PostWithTags | null> {
  const [row] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (!row) return null;
  const [withTags] = await attachTags(db, [row]);
  return withTags ?? null;
}

export async function getPostBySlug(db: Db, slug: string): Promise<PostWithTags | null> {
  const [row] = await db.select().from(posts).where(eq(posts.slug, slug)).limit(1);
  if (!row) return null;
  const [withTags] = await attachTags(db, [row]);
  return withTags ?? null;
}

export async function isPostSlugTaken(db: Db, slug: string, excludeId?: string) {
  const where = excludeId
    ? and(eq(posts.slug, slug), ne(posts.id, excludeId))
    : eq(posts.slug, slug);
  const [row] = await db.select({ id: posts.id }).from(posts).where(where).limit(1);
  return Boolean(row);
}

async function replaceTags(db: Db, postId: string, tags: string[]) {
  await db.delete(postTags).where(eq(postTags.postId, postId));
  if (tags.length === 0) return;
  await db.insert(postTags).values(tags.map((tag) => ({ postId, tag })));
}

export async function createPost(
  db: Db,
  input: {
    title: string;
    slug: string;
    excerpt?: string | null;
    content: string;
    status: Post['status'];
    publishedAt?: string | null;
    authorId?: string | null;
    seoId?: string | null;
    coverMediaId?: string | null;
    tags?: string[];
  },
): Promise<PostWithTags> {
  const now = nowIso();
  const id = newId('post');
  await db.insert(posts).values({
    id,
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt ?? null,
    content: input.content,
    status: input.status,
    publishedAt: input.publishedAt ?? null,
    authorId: input.authorId ?? null,
    coverMediaId: input.coverMediaId ?? null,
    seoId: input.seoId ?? null,
    createdAt: now,
    updatedAt: now,
  });
  await replaceTags(db, id, input.tags ?? []);
  const created = await getPostById(db, id);
  if (!created) throw new Error('Post create failed');
  return created;
}

export async function updatePost(
  db: Db,
  id: string,
  input: {
    title: string;
    slug: string;
    excerpt?: string | null;
    content: string;
    status: Post['status'];
    publishedAt?: string | null;
    seoId?: string | null;
    coverMediaId?: string | null;
    tags?: string[];
  },
): Promise<PostWithTags | null> {
  const existing = await getPostById(db, id);
  if (!existing) return null;
  await db
    .update(posts)
    .set({
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt ?? null,
      content: input.content,
      status: input.status,
      publishedAt: input.publishedAt ?? null,
      coverMediaId: input.coverMediaId ?? null,
      seoId: input.seoId ?? existing.seoId,
      updatedAt: nowIso(),
    })
    .where(eq(posts.id, id));
  await replaceTags(db, id, input.tags ?? []);
  return getPostById(db, id);
}

export async function deletePost(db: Db, id: string): Promise<PostWithTags | null> {
  const existing = await getPostById(db, id);
  if (!existing) return null;
  await db.delete(posts).where(eq(posts.id, id));
  return existing;
}

/** Publicly visible: published + published_at set and <= now */
function publicVisibilityWhere(now: string) {
  return and(
    eq(posts.status, 'published'),
    sql`${posts.publishedAt} IS NOT NULL`,
    lte(posts.publishedAt, now),
  );
}

export async function listPublishedPosts(
  db: Db,
  opts: { page: number; pageSize: number; tag?: string },
): Promise<{ items: PostWithTags[]; total: number }> {
  const now = nowIso();
  const offset = (opts.page - 1) * opts.pageSize;

  let postIdsFilter: string[] | null = null;
  if (opts.tag) {
    const tagged = await db
      .select({ postId: postTags.postId })
      .from(postTags)
      .where(eq(postTags.tag, opts.tag));
    postIdsFilter = tagged.map((t) => t.postId);
    if (postIdsFilter.length === 0) return { items: [], total: 0 };
  }

  const visibility = publicVisibilityWhere(now)!;
  const where =
    postIdsFilter != null
      ? and(visibility, inArray(posts.id, postIdsFilter))
      : visibility;

  const [totalRow] = await db.select({ value: count() }).from(posts).where(where);
  const rows = await db
    .select()
    .from(posts)
    .where(where)
    .orderBy(desc(posts.publishedAt), desc(posts.createdAt))
    .limit(opts.pageSize)
    .offset(offset);

  return {
    items: await attachTags(db, rows),
    total: totalRow?.value ?? 0,
  };
}

export async function getPublishedPostBySlug(db: Db, slug: string): Promise<PostPublic | null> {
  const now = nowIso();
  const [row] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.slug, slug), publicVisibilityWhere(now)))
    .limit(1);
  if (!row) return null;
  const [withTags] = await attachTags(db, [row]);
  if (!withTags) return null;
  const seo = withTags.seoId ? await getSeoForPost(db, withTags.seoId) : null;
  return { ...withTags, seo };
}

async function getSeoForPost(db: Db, seoId: string) {
  const [row] = await db.select().from(seoMeta).where(eq(seoMeta.id, seoId)).limit(1);
  return row ?? null;
}

export async function listRecentPublishedPosts(db: Db, limit: number): Promise<PostWithTags[]> {
  const now = nowIso();
  const rows = await db
    .select()
    .from(posts)
    .where(publicVisibilityWhere(now))
    .orderBy(desc(posts.publishedAt), desc(posts.createdAt))
    .limit(Math.min(20, Math.max(1, limit)));
  return attachTags(db, rows);
}

export async function listPublishedPostsForFeed(db: Db, limit = 50): Promise<PostWithTags[]> {
  return listRecentPublishedPosts(db, limit);
}

export async function listPublishedPostsForSitemap(db: Db) {
  const now = nowIso();
  return db
    .select({
      slug: posts.slug,
      updatedAt: posts.updatedAt,
      publishedAt: posts.publishedAt,
      seoId: posts.seoId,
    })
    .from(posts)
    .where(publicVisibilityWhere(now))
    .orderBy(asc(posts.slug));
}
