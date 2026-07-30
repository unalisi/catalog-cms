import { CORE_PAGES } from '../../lib/pages/core-pages';
import { sectionDefaults } from '../../lib/sections/registry';
import { invalidatePageCache } from '../../lib/cache/invalidate';
import { getDb } from '../db';
import * as repo from '../repos/pages';

const CORE_SECTION_SEED: Record<string, { type: keyof typeof sectionDefaults; config: unknown }[]> =
  {
    catalog: [{ type: 'product-list', config: sectionDefaults['product-list'] }],
    blog: [{ type: 'blog-list', config: sectionDefaults['blog-list'] }],
    iletisim: [
      {
        type: 'contact-layout',
        config: { ...sectionDefaults['contact-layout'], variant: 'map-form' },
      },
    ],
    'urun-sablon': [
      {
        type: 'product-detail',
        config: sectionDefaults['product-detail'],
      },
      {
        type: 'related-products',
        config: sectionDefaults['related-products'],
      },
      {
        type: 'banner-cta',
        config: {
          title: 'Teklif alın',
          body: 'Bu ürün için stok ve teslimat bilgisini paylaşalım.',
          ctaLabel: 'İletişim',
          ctaHref: '/iletisim',
        },
      },
    ],
    'yazi-sablon': [
      {
        type: 'related-posts',
        config: sectionDefaults['related-posts'],
      },
      {
        type: 'banner-cta',
        config: {
          title: 'Katalogu inceleyin',
          body: 'Ürün gruplarımıza göz atın.',
          ctaLabel: 'Katalog',
          ctaHref: '/catalog',
        },
      },
    ],
  };

/** Ensure built-in CMS pages exist (idempotent). Home is seeded separately. */
export async function ensureCorePages() {
  const db = getDb();

  for (const core of CORE_PAGES) {
    if (core.slug === 'home') continue;
    const existing = await repo.getPageBySlug(db, core.slug);
    if (existing) continue;

    const page = await repo.createPage(db, {
      title: core.title,
      slug: core.slug,
      status: 'published',
    });

    const seeds = CORE_SECTION_SEED[core.slug] ?? [];
    for (const seed of seeds) {
      await repo.createSection(db, {
        pageId: page.id,
        type: seed.type,
        configJson: JSON.stringify(seed.config),
        isVisible: true,
      });
    }
  }

  await ensureProductDetailSection();
}

/**
 * Existing installs may have urun-sablon without product-detail.
 * Insert at the top (position 0) and reorder if missing.
 */
export async function ensureProductDetailSection() {
  const db = getDb();
  const page = await repo.getPageBySlug(db, 'urun-sablon');
  if (!page) return;

  const hasDetail = page.sections.some((s) => s.type === 'product-detail');
  if (hasDetail) return;

  const created = await repo.createSection(db, {
    pageId: page.id,
    type: 'product-detail',
    configJson: JSON.stringify(sectionDefaults['product-detail']),
    isVisible: true,
  });

  const orderedIds = [created.id, ...page.sections.map((s) => s.id)];
  await repo.reorderSections(db, page.id, orderedIds);
  await invalidatePageCache('urun-sablon');
}
