import { CACHE_KEYS, CACHE_TTL } from '../../lib/cache/keys';
import { cacheFirst } from '../../lib/cache/kv';
import { invalidatePageCache } from '../../lib/cache/invalidate';
import {
  isSectionType,
  sectionDefaults,
  sectionLabels,
  type SectionType,
} from '../../lib/sections/registry';
import { isCorePageSlug } from '../../lib/pages/core-pages';
import { getAllowedSectionTypes, isSectionAllowedOnPage } from '../../lib/pages/page-sections';
import { ensureCorePages } from './core-pages';
import {
  pageUpsertSchema,
  sectionCreateSchema,
  sectionReorderSchema,
  sectionUpdateSchema,
  serializeSectionConfig,
} from '../../lib/validation/pages';
import { zodFieldErrors } from '../../lib/validation/admin';
import { getDb } from '../db';
import * as repo from '../repos/pages';
import * as seoRepo from '../repos/seo';

export type PublicPagePayload = {
  id: string;
  slug: string;
  title: string;
  status: string;
  sections: { id: string; type: string; configJson: string }[];
  seo: {
    title: string | null;
    description: string | null;
    canonical: string | null;
    ogImageUrl: string | null;
    noindex: boolean;
    robotsExtra: string | null;
  } | null;
};

export async function getPublishedPage(slug: string) {
  return cacheFirst(CACHE_KEYS.page(slug), CACHE_TTL.page, async () => {
    const page = await repo.getPageBySlug(getDb(), slug);
    if (!page || page.status !== 'published') return null;
    const seo = page.seoId ? await seoRepo.getSeoById(getDb(), page.seoId) : null;
    const sections = page.sections
      .filter((s) => s.isVisible)
      .map((s) => ({ id: s.id, type: s.type, configJson: s.configJson }));
    const payload: PublicPagePayload = {
      id: page.id,
      slug: page.slug,
      title: page.title,
      status: page.status,
      sections,
      seo: seo
        ? {
            title: seo.title,
            description: seo.description,
            canonical: seo.canonical,
            ogImageUrl: seo.ogImageUrl,
            noindex: seo.noindex,
            robotsExtra: seo.robotsExtra,
          }
        : null,
    };
    return payload;
  });
}

export async function listAdminPages() {
  await ensureCorePages();
  return repo.listPages(getDb());
}

export async function getAdminPage(slug: string) {
  const page = await repo.getPageBySlug(getDb(), slug);
  if (!page) return null;
  const seo = page.seoId ? await seoRepo.getSeoById(getDb(), page.seoId) : null;
  return { ...page, seo };
}

export async function createAdminPage(input: unknown) {
  const parsed = pageUpsertSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, fields: zodFieldErrors(parsed.error) };
  const db = getDb();
  if (await repo.isPageSlugTaken(db, parsed.data.slug)) {
    return { ok: false as const, fields: { slug: 'Bu slug zaten kullanılıyor' } };
  }
  const { seo, ...rest } = parsed.data;
  let seoId: string | null = null;
  if (seo) seoId = await seoRepo.upsertSeoMeta(db, null, seo);
  const page = await repo.createPage(db, rest);
  if (seoId) await repo.updatePage(db, page.id, { title: page.title, status: page.status, seoId });
  await invalidatePageCache(page.slug);
  return { ok: true as const, data: page };
}

export async function updateAdminPage(slug: string, input: unknown) {
  const parsed = pageUpsertSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, fields: zodFieldErrors(parsed.error) };
  const db = getDb();
  const existing = await repo.getPageBySlug(db, slug);
  if (!existing) return { ok: false as const, notFound: true as const };
  if (isCorePageSlug(existing.slug) && parsed.data.slug !== existing.slug) {
    return { ok: false as const, fields: { slug: 'Temel sayfa slug’ı değiştirilemez' } };
  }
  if (await repo.isPageSlugTaken(db, parsed.data.slug, existing.id)) {
    return { ok: false as const, fields: { slug: 'Bu slug zaten kullanılıyor' } };
  }
  const { seo, ...rest } = parsed.data;
  let seoId = existing.seoId;
  if (seo) seoId = await seoRepo.upsertSeoMeta(db, existing.seoId, seo);
  const page = await repo.updatePage(db, existing.id, { ...rest, seoId });
  if (!page) return { ok: false as const, notFound: true as const };
  if (existing.slug !== page.slug && existing.slug !== 'home') {
    await seoRepo.upsertRedirect(db, {
      fromPath: `/${existing.slug}`,
      toPath: page.slug === 'home' ? '/' : `/${page.slug}`,
      statusCode: 301,
    });
  }
  await invalidatePageCache(page.slug, existing.slug);
  return { ok: true as const, data: page };
}

export async function removeAdminPage(slug: string) {
  const db = getDb();
  const existing = await repo.getPageBySlug(db, slug);
  if (!existing) return { ok: false as const, notFound: true as const };
  if (existing.slug === 'home' || isCorePageSlug(existing.slug)) {
    return { ok: false as const, fields: { _form: 'Temel sayfalar silinemez' } };
  }
  const deleted = await repo.deletePage(db, existing.id);
  if (!deleted) return { ok: false as const, notFound: true as const };
  await invalidatePageCache(deleted.slug);
  return { ok: true as const, data: deleted };
}

export async function addSection(slug: string, input: unknown) {
  const parsed = sectionCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, fields: zodFieldErrors(parsed.error) };
  const db = getDb();
  const page = await repo.getPageBySlug(db, slug);
  if (!page) return { ok: false as const, notFound: true as const };
  if (!isSectionAllowedOnPage(page.slug, parsed.data.type)) {
    return {
      ok: false as const,
      fields: { type: 'Bu section tipi bu sayfada kullanılamaz' },
    };
  }
  const configJson = JSON.stringify(sectionDefaults[parsed.data.type]);
  const section = await repo.createSection(db, {
    pageId: page.id,
    type: parsed.data.type,
    configJson,
  });
  await invalidatePageCache(page.slug);
  return { ok: true as const, data: section };
}

export async function patchSection(sectionId: string, input: unknown) {
  const parsed = sectionUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, fields: zodFieldErrors(parsed.error) };
  const db = getDb();
  const existing = await repo.getSectionById(db, sectionId);
  if (!existing) return { ok: false as const, notFound: true as const };

  const fields: { configJson?: string; isVisible?: boolean } = {};
  if (typeof parsed.data.isVisible === 'boolean') fields.isVisible = parsed.data.isVisible;
  if (parsed.data.config !== undefined) {
    if (!isSectionType(existing.type)) {
      return { ok: false as const, fields: { type: 'Bilinmeyen section tipi' } };
    }
    const serialized = serializeSectionConfig(existing.type, parsed.data.config);
    if (!serialized) {
      return { ok: false as const, fields: { config: 'Geçersiz section yapılandırması' } };
    }
    fields.configJson = serialized;
  }

  const section = await repo.updateSection(db, sectionId, fields);
  if (!section) return { ok: false as const, notFound: true as const };
  const page = await repo.getPageById(db, existing.pageId);
  if (page) await invalidatePageCache(page.slug);
  return { ok: true as const, data: section };
}

export async function removeSection(sectionId: string) {
  const db = getDb();
  const existing = await repo.getSectionById(db, sectionId);
  if (!existing) return { ok: false as const, notFound: true as const };
  const page = await repo.getPageById(db, existing.pageId);
  if (
    page &&
    ((page.slug === 'urun-sablon' && existing.type === 'product-detail') ||
      (page.slug === 'iletisim' && existing.type === 'contact-layout'))
  ) {
    return {
      ok: false as const,
      error: { code: 'forbidden', message: 'Bu section silinemez' },
    };
  }
  const deleted = await repo.deleteSection(db, sectionId);
  if (!deleted) return { ok: false as const, notFound: true as const };
  if (page) await invalidatePageCache(page.slug);
  return { ok: true as const, data: deleted };
}

export async function reorderPageSections(slug: string, input: unknown) {
  const parsed = sectionReorderSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, fields: zodFieldErrors(parsed.error) };
  const db = getDb();
  const page = await repo.getPageBySlug(db, slug);
  if (!page) return { ok: false as const, notFound: true as const };
  const known = new Set(page.sections.map((s) => s.id));
  if (
    parsed.data.orderedIds.length !== page.sections.length ||
    parsed.data.orderedIds.some((id) => !known.has(id))
  ) {
    return { ok: false as const, fields: { orderedIds: 'Sıra listesi geçersiz' } };
  }
  const sections = await repo.reorderSections(db, page.id, parsed.data.orderedIds);
  await invalidatePageCache(page.slug);
  return { ok: true as const, data: sections };
}

export function listSectionTypeOptions(slug?: string) {
  const allowed = slug
    ? new Set<string>(getAllowedSectionTypes(slug))
    : null;
  return (Object.entries(sectionLabels) as [SectionType, string][])
    .filter(([type]) => (allowed ? allowed.has(type) : true))
    .map(([type, label]) => ({ type, label }));
}
