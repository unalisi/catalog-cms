import { and, asc, count, eq, ne } from 'drizzle-orm';
import { pageSections, pages, type Page, type PageSection } from '../../../db/schema';
import type { Db } from '../db';
import { newId, nowIso } from '../../lib/utils/id';

export type PageWithSections = Page & { sections: PageSection[] };

export async function listPages(db: Db): Promise<(Page & { sectionCount: number })[]> {
  const rows = await db.select().from(pages).orderBy(asc(pages.title));
  const result: (Page & { sectionCount: number })[] = [];
  for (const page of rows) {
    const [c] = await db
      .select({ value: count() })
      .from(pageSections)
      .where(eq(pageSections.pageId, page.id));
    result.push({ ...page, sectionCount: c?.value ?? 0 });
  }
  return result;
}

export async function getPageBySlug(db: Db, slug: string): Promise<PageWithSections | null> {
  const [page] = await db.select().from(pages).where(eq(pages.slug, slug)).limit(1);
  if (!page) return null;
  const sections = await db
    .select()
    .from(pageSections)
    .where(eq(pageSections.pageId, page.id))
    .orderBy(asc(pageSections.position));
  return { ...page, sections };
}

export async function getPageById(db: Db, id: string): Promise<PageWithSections | null> {
  const [page] = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
  if (!page) return null;
  const sections = await db
    .select()
    .from(pageSections)
    .where(eq(pageSections.pageId, page.id))
    .orderBy(asc(pageSections.position));
  return { ...page, sections };
}

export async function isPageSlugTaken(db: Db, slug: string, excludeId?: string) {
  const where = excludeId
    ? and(eq(pages.slug, slug), ne(pages.id, excludeId))
    : eq(pages.slug, slug);
  const [row] = await db.select({ id: pages.id }).from(pages).where(where).limit(1);
  return Boolean(row);
}

export async function createPage(
  db: Db,
  input: { slug: string; title: string; status: Page['status'] },
): Promise<Page> {
  const now = nowIso();
  const id = newId('page');
  await db.insert(pages).values({
    id,
    slug: input.slug,
    title: input.title,
    status: input.status,
    seoId: null,
    createdAt: now,
    updatedAt: now,
  });
  const [created] = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
  if (!created) throw new Error('Page create failed');
  return created;
}

export async function updatePage(
  db: Db,
  id: string,
  input: { title: string; status: Page['status']; slug?: string; seoId?: string | null },
): Promise<Page | null> {
  const patch: Record<string, unknown> = {
    title: input.title,
    status: input.status,
    updatedAt: nowIso(),
  };
  if (input.slug) patch.slug = input.slug;
  if (input.seoId !== undefined) patch.seoId = input.seoId;
  await db.update(pages).set(patch).where(eq(pages.id, id));
  const [updated] = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
  return updated ?? null;
}

export async function deletePage(db: Db, id: string): Promise<Page | null> {
  const [existing] = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
  if (!existing) return null;
  await db.delete(pages).where(eq(pages.id, id));
  return existing;
}

export async function getSectionById(db: Db, id: string): Promise<PageSection | null> {
  const [row] = await db.select().from(pageSections).where(eq(pageSections.id, id)).limit(1);
  return row ?? null;
}

export async function createSection(
  db: Db,
  input: {
    pageId: string;
    type: string;
    configJson: string;
    isVisible?: boolean;
  },
): Promise<PageSection> {
  const now = nowIso();
  const id = newId('sec');
  const [agg] = await db
    .select({ value: count() })
    .from(pageSections)
    .where(eq(pageSections.pageId, input.pageId));
  const position = agg?.value ?? 0;
  await db.insert(pageSections).values({
    id,
    pageId: input.pageId,
    type: input.type,
    position,
    isVisible: input.isVisible ?? true,
    configJson: input.configJson,
    createdAt: now,
    updatedAt: now,
  });
  const created = await getSectionById(db, id);
  if (!created) throw new Error('Section create failed');
  await db.update(pages).set({ updatedAt: now }).where(eq(pages.id, input.pageId));
  return created;
}

export async function updateSection(
  db: Db,
  id: string,
  fields: Partial<{
    configJson: string;
    isVisible: boolean;
    type: string;
  }>,
): Promise<PageSection | null> {
  const existing = await getSectionById(db, id);
  if (!existing) return null;
  await db
    .update(pageSections)
    .set({ ...fields, updatedAt: nowIso() })
    .where(eq(pageSections.id, id));
  await db.update(pages).set({ updatedAt: nowIso() }).where(eq(pages.id, existing.pageId));
  return getSectionById(db, id);
}

export async function deleteSection(db: Db, id: string): Promise<PageSection | null> {
  const existing = await getSectionById(db, id);
  if (!existing) return null;
  await db.delete(pageSections).where(eq(pageSections.id, id));
  await db.update(pages).set({ updatedAt: nowIso() }).where(eq(pages.id, existing.pageId));
  return existing;
}

export async function reorderSections(
  db: Db,
  pageId: string,
  orderedIds: string[],
): Promise<PageSection[]> {
  const now = nowIso();
  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(pageSections)
      .set({ position: i, updatedAt: now })
      .where(eq(pageSections.id, orderedIds[i]!));
  }
  await db.update(pages).set({ updatedAt: now }).where(eq(pages.id, pageId));
  return db
    .select()
    .from(pageSections)
    .where(eq(pageSections.pageId, pageId))
    .orderBy(asc(pageSections.position));
}
