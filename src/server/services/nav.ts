import type { Category } from '../../../db/schema/taxonomy';
import type {
  NavColumn,
  NavItem,
  NavPanel,
  NavPanelItem,
  ResolvedNavItem,
} from '../../lib/navigation/nav';
import { getCategories } from './catalog';

type CategoryWithImage = Category & { imageUrl: string | null };

function truncate(text: string | null | undefined, max = 120): string {
  if (!text) return '';
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function categoryToItem(cat: CategoryWithImage): NavPanelItem {
  const img = cat.imageUrl ?? '';
  return {
    label: cat.name,
    href: `/category/${cat.slug}`,
    description: truncate(cat.description),
    imageUrl: img,
    iconUrl: img,
    badge: '',
  };
}

function columnFromRoot(
  root: CategoryWithImage,
  children: CategoryWithImage[],
): NavColumn {
  const items: NavPanelItem[] = [categoryToItem(root)];
  for (const child of children.slice(0, 15)) {
    items.push(categoryToItem(child));
  }
  return {
    heading: root.name,
    items: items.slice(0, 16),
  };
}

/** Build a NavPanel from published categories (roots → columns, children → items). */
export function categoriesToNavPanel(
  categories: CategoryWithImage[],
  catalogHref = '/catalog',
): NavPanel {
  const byParent = new Map<string | null, CategoryWithImage[]>();
  for (const cat of categories) {
    const key = cat.parentId ?? null;
    const list = byParent.get(key) ?? [];
    list.push(cat);
    byParent.set(key, list);
  }

  const roots = byParent.get(null) ?? [];
  let columns: NavColumn[] = [];

  if (roots.length === 0) {
    const flat = categories.slice(0, 16).map(categoryToItem);
    columns = flat.length
      ? [{ heading: 'Kategoriler', items: flat }]
      : [];
  } else if (roots.length <= 6) {
    columns = roots.map((root) =>
      columnFromRoot(root, byParent.get(root.id) ?? []),
    );
  } else {
    const primary = roots.slice(0, 5);
    const rest = roots.slice(5);
    columns = primary.map((root) =>
      columnFromRoot(root, byParent.get(root.id) ?? []),
    );
    const otherItems: NavPanelItem[] = [];
    for (const root of rest) {
      otherItems.push(categoryToItem(root));
      for (const child of (byParent.get(root.id) ?? []).slice(0, 2)) {
        otherItems.push(categoryToItem(child));
      }
      if (otherItems.length >= 16) break;
    }
    columns.push({
      heading: 'Diğer',
      items: otherItems.slice(0, 16),
    });
  }

  const featuredRoot =
    roots.find((r) => r.imageUrl) ?? roots[0] ?? categories.find((c) => c.imageUrl) ?? null;

  return {
    columns,
    featured: featuredRoot
      ? [
          {
            title: featuredRoot.name,
            description: truncate(featuredRoot.description, 160),
            href: `/category/${featuredRoot.slug}`,
            imageUrl: featuredRoot.imageUrl ?? '',
          },
        ]
      : [],
    footerLinks: [{ label: 'Tüm katalog →', href: catalogHref }],
  };
}

/**
 * Expand `kind: 'categories'` into panels for SiteNavbar.
 * Other items pass through unchanged.
 */
export async function resolveNavForPublic(items: NavItem[]): Promise<ResolvedNavItem[]> {
  const needsCategories = items.some((i) => i.kind === 'categories');
  let categories: CategoryWithImage[] = [];
  if (needsCategories) {
    const result = await getCategories();
    categories = result.data ?? [];
  }

  return items.map((item): ResolvedNavItem => {
    if (item.kind === 'categories') {
      return {
        kind: 'panel',
        label: item.label,
        href: item.href || '/catalog',
        panel: categoriesToNavPanel(categories, item.href || '/catalog'),
      };
    }
    if (item.kind === 'link') {
      return { kind: 'link', label: item.label, href: item.href };
    }
    return {
      kind: 'panel',
      label: item.label,
      href: item.href,
      panel: item.panel,
    };
  });
}
