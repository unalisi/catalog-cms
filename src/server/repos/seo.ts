import { asc, eq } from 'drizzle-orm';
import { redirects, seoMeta, settings, type Redirect, type SeoMeta } from '../../../db/schema';
import type { Db } from '../db';
import { newId, nowIso } from '../../lib/utils/id';
import {
  DEFAULT_SEO_SETTINGS,
  seoDefaultsSchema,
  type SeoDefaults,
  type SeoFieldsInput,
} from '../../lib/validation/seo';

export async function getSeoById(db: Db, id: string): Promise<SeoMeta | null> {
  const [row] = await db.select().from(seoMeta).where(eq(seoMeta.id, id)).limit(1);
  return row ?? null;
}

export async function upsertSeoMeta(
  db: Db,
  existingId: string | null | undefined,
  input: SeoFieldsInput,
): Promise<string> {
  const now = nowIso();
  const payload = {
    title: input.title?.trim() || null,
    description: input.description?.trim() || null,
    canonical: input.canonical?.trim() || null,
    ogImageUrl: input.ogImageUrl?.trim() || null,
    noindex: Boolean(input.noindex),
    robotsExtra: input.robotsExtra?.trim() || null,
    updatedAt: now,
  };

  if (existingId) {
    await db.update(seoMeta).set(payload).where(eq(seoMeta.id, existingId));
    return existingId;
  }

  const id = newId('seo');
  await db.insert(seoMeta).values({
    id,
    ...payload,
    ogImageMediaId: null,
    createdAt: now,
  });
  return id;
}

export async function getSeoDefaults(db: Db): Promise<SeoDefaults> {
  const [row] = await db.select().from(settings).where(eq(settings.key, 'seo')).limit(1);
  if (!row) return DEFAULT_SEO_SETTINGS;
  try {
    const parsed = seoDefaultsSchema.safeParse(JSON.parse(row.valueJson));
    return parsed.success ? parsed.data : DEFAULT_SEO_SETTINGS;
  } catch {
    return DEFAULT_SEO_SETTINGS;
  }
}

export async function saveSeoDefaults(db: Db, defaults: SeoDefaults): Promise<SeoDefaults> {
  const now = nowIso();
  const valueJson = JSON.stringify(defaults);
  const [existing] = await db.select().from(settings).where(eq(settings.key, 'seo')).limit(1);
  if (existing) {
    await db.update(settings).set({ valueJson, updatedAt: now }).where(eq(settings.key, 'seo'));
  } else {
    await db.insert(settings).values({ key: 'seo', valueJson, updatedAt: now });
  }
  return defaults;
}

export async function listRedirects(db: Db): Promise<Redirect[]> {
  return db.select().from(redirects).orderBy(asc(redirects.fromPath));
}

export async function getRedirectByFromPath(db: Db, fromPath: string): Promise<Redirect | null> {
  const [row] = await db.select().from(redirects).where(eq(redirects.fromPath, fromPath)).limit(1);
  return row ?? null;
}

export async function upsertRedirect(
  db: Db,
  input: { fromPath: string; toPath: string; statusCode?: number },
): Promise<Redirect> {
  const existing = await getRedirectByFromPath(db, input.fromPath);
  if (existing) {
    await db
      .update(redirects)
      .set({
        toPath: input.toPath,
        statusCode: input.statusCode ?? 301,
      })
      .where(eq(redirects.id, existing.id));
    const [updated] = await db.select().from(redirects).where(eq(redirects.id, existing.id)).limit(1);
    if (!updated) throw new Error('Redirect update failed');
    return updated;
  }
  const id = newId('redir');
  await db.insert(redirects).values({
    id,
    fromPath: input.fromPath,
    toPath: input.toPath,
    statusCode: input.statusCode ?? 301,
    createdAt: nowIso(),
  });
  const created = await getRedirectByFromPath(db, input.fromPath);
  if (!created) throw new Error('Redirect create failed');
  return created;
}

export async function createRedirect(
  db: Db,
  input: { fromPath: string; toPath: string; statusCode?: number },
): Promise<Redirect> {
  return upsertRedirect(db, input);
}

export async function deleteRedirect(db: Db, id: string): Promise<Redirect | null> {
  const [existing] = await db.select().from(redirects).where(eq(redirects.id, id)).limit(1);
  if (!existing) return null;
  await db.delete(redirects).where(eq(redirects.id, id));
  return existing;
}

export async function recordSlugChangeRedirect(
  db: Db,
  prefix: string,
  oldSlug: string,
  newSlug: string,
): Promise<void> {
  if (oldSlug === newSlug) return;
  const fromPath = `${prefix}/${oldSlug}`;
  const toPath = `${prefix}/${newSlug}`;
  await upsertRedirect(db, { fromPath, toPath, statusCode: 301 });
  // If something pointed at the new path as from, remove self-loop risk
  const conflict = await getRedirectByFromPath(db, toPath);
  if (conflict && conflict.toPath === toPath) {
    await deleteRedirect(db, conflict.id);
  }
}
