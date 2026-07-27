import { count, desc, eq, like, or } from 'drizzle-orm';
import {
  brands,
  categories,
  media,
  posts,
  productMedia,
  products,
  seoMeta,
  type Media,
} from '../../../db/schema';
import type { Db } from '../db';
import { newId, nowIso } from '../../lib/utils/id';
import { mediaPublicPath } from '../../lib/media/urls';

export async function listMedia(
  db: Db,
  opts: { q?: string; page: number; pageSize: number },
): Promise<{ items: Media[]; total: number }> {
  const offset = (opts.page - 1) * opts.pageSize;
  const q = opts.q?.trim();
  const where = q
    ? or(like(media.alt, `%${q}%`), like(media.key, `%${q}%`), like(media.id, `%${q}%`))
    : undefined;

  const [totalRow] = await db.select({ value: count() }).from(media).where(where);
  const items = await db
    .select()
    .from(media)
    .where(where)
    .orderBy(desc(media.createdAt))
    .limit(opts.pageSize)
    .offset(offset);

  return { items, total: totalRow?.value ?? 0 };
}

export async function getMediaById(db: Db, id: string): Promise<Media | null> {
  const [row] = await db.select().from(media).where(eq(media.id, id)).limit(1);
  return row ?? null;
}

export async function getMediaByKey(db: Db, key: string): Promise<Media | null> {
  const [row] = await db.select().from(media).where(eq(media.key, key)).limit(1);
  return row ?? null;
}

export async function createMediaRecord(
  db: Db,
  input: {
    key: string;
    alt: string;
    mime: string;
    sizeBytes: number;
    width?: number | null;
    height?: number | null;
    source?: string;
  },
): Promise<Media> {
  const id = newId('med');
  const now = nowIso();
  await db.insert(media).values({
    id,
    key: input.key,
    url: mediaPublicPath(input.key),
    width: input.width ?? null,
    height: input.height ?? null,
    alt: input.alt,
    mime: input.mime,
    sizeBytes: input.sizeBytes,
    source: input.source ?? 'upload',
    createdAt: now,
  });
  const created = await getMediaById(db, id);
  if (!created) throw new Error('Media create failed');
  return created;
}

export async function updateMediaAlt(db: Db, id: string, alt: string): Promise<Media | null> {
  const existing = await getMediaById(db, id);
  if (!existing) return null;
  await db.update(media).set({ alt }).where(eq(media.id, id));
  return getMediaById(db, id);
}

export async function deleteMediaRecord(db: Db, id: string): Promise<Media | null> {
  const existing = await getMediaById(db, id);
  if (!existing) return null;
  await db.delete(media).where(eq(media.id, id));
  return existing;
}

export async function countMediaReferences(db: Db, mediaId: string): Promise<number> {
  const [[a], [b], [c], [d], [e], [f]] = await Promise.all([
    db.select({ value: count() }).from(products).where(eq(products.primaryMediaId, mediaId)),
    db.select({ value: count() }).from(productMedia).where(eq(productMedia.mediaId, mediaId)),
    db.select({ value: count() }).from(brands).where(eq(brands.logoMediaId, mediaId)),
    db.select({ value: count() }).from(categories).where(eq(categories.imageMediaId, mediaId)),
    db.select({ value: count() }).from(posts).where(eq(posts.coverMediaId, mediaId)),
    db.select({ value: count() }).from(seoMeta).where(eq(seoMeta.ogImageMediaId, mediaId)),
  ]);
  return (
    (a?.value ?? 0) +
    (b?.value ?? 0) +
    (c?.value ?? 0) +
    (d?.value ?? 0) +
    (e?.value ?? 0) +
    (f?.value ?? 0)
  );
}
