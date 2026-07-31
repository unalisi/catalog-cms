/** Client-safe nav types/helpers — no Zod (safe for React islands). */

export const NAVBAR_LAYOUTS = ['classic', 'fullscreen', 'mega', 'mega-img'] as const;
export type NavbarLayout = (typeof NAVBAR_LAYOUTS)[number];

export const NAVBAR_LAYOUT_LABELS: Record<NavbarLayout, string> = {
  classic: 'Klasik',
  fullscreen: 'Tam Ekran',
  mega: 'Mega Menü',
  'mega-img': 'Mega Menü - img',
};

export type NavbarCta = {
  label: string;
  href: string;
  variant: 'ghost' | 'solid' | 'text';
};

export type NavPanelItem = {
  label: string;
  href: string;
  description: string;
  imageUrl: string;
  iconUrl: string;
  badge: string;
};

export type NavColumn = {
  heading: string;
  items: NavPanelItem[];
};

export type NavFeatured = {
  title: string;
  description: string;
  href: string;
  imageUrl: string;
};

export type NavFooterLink = {
  label: string;
  href: string;
};

export type NavPanel = {
  columns: NavColumn[];
  featured: NavFeatured[];
  footerLinks: NavFooterLink[];
};

export type NavItem =
  | { kind: 'link'; label: string; href: string }
  | { kind: 'panel'; label: string; href: string; panel: NavPanel }
  | { kind: 'categories'; label: string; href: string };

/** After SSR resolve — categories expanded to panels. */
export type ResolvedNavItem =
  | { kind: 'link'; label: string; href: string }
  | { kind: 'panel'; label: string; href: string; panel: NavPanel };

export const DEFAULT_NAVIGATION: NavItem[] = [
  { kind: 'categories', label: 'Katalog', href: '/catalog' },
  { kind: 'link', label: 'Blog', href: '/blog' },
];

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function parsePanelItem(raw: unknown): NavPanelItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const label = asString(o.label).trim();
  const href = asString(o.href).trim();
  if (!label || !href) return null;
  return {
    label,
    href,
    description: asString(o.description),
    imageUrl: asString(o.imageUrl),
    iconUrl: asString(o.iconUrl),
    badge: asString(o.badge),
  };
}

function parsePanel(raw: unknown): NavPanel {
  if (!raw || typeof raw !== 'object') {
    return { columns: [], featured: [], footerLinks: [] };
  }
  const o = raw as Record<string, unknown>;
  const columnsRaw = Array.isArray(o.columns) ? o.columns : [];
  const columns: NavColumn[] = columnsRaw.slice(0, 6).map((col) => {
    const c = (col && typeof col === 'object' ? col : {}) as Record<string, unknown>;
    const itemsRaw = Array.isArray(c.items) ? c.items : [];
    return {
      heading: asString(c.heading),
      items: itemsRaw
        .slice(0, 16)
        .map(parsePanelItem)
        .filter((x): x is NavPanelItem => x != null),
    };
  });

  const featuredRaw = Array.isArray(o.featured) ? o.featured : [];
  const featured: NavFeatured[] = featuredRaw
    .slice(0, 4)
    .map((f) => {
      if (!f || typeof f !== 'object') return null;
      const x = f as Record<string, unknown>;
      const title = asString(x.title).trim();
      if (!title) return null;
      return {
        title,
        description: asString(x.description),
        href: asString(x.href),
        imageUrl: asString(x.imageUrl),
      };
    })
    .filter((x): x is NavFeatured => x != null);

  const footerRaw = Array.isArray(o.footerLinks) ? o.footerLinks : [];
  const footerLinks: NavFooterLink[] = footerRaw
    .slice(0, 8)
    .map((l) => {
      if (!l || typeof l !== 'object') return null;
      const x = l as Record<string, unknown>;
      const label = asString(x.label).trim();
      const href = asString(x.href).trim();
      if (!label || !href) return null;
      return { label, href };
    })
    .filter((x): x is NavFooterLink => x != null);

  return { columns, featured, footerLinks };
}

function parseNavItem(raw: unknown): NavItem | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const label = asString(o.label).trim();
  if (!label) return null;

  // Legacy flat { label, href }
  if (!('kind' in o) && typeof o.href === 'string') {
    const href = o.href.trim();
    if (!href) return null;
    return { kind: 'link', label, href };
  }

  if (o.kind === 'link') {
    const href = asString(o.href).trim();
    if (!href) return null;
    return { kind: 'link', label, href };
  }

  if (o.kind === 'categories') {
    const href = asString(o.href).trim() || '/catalog';
    return { kind: 'categories', label, href };
  }

  if (o.kind === 'panel') {
    return {
      kind: 'panel',
      label,
      href: asString(o.href),
      panel: parsePanel(o.panel),
    };
  }

  return null;
}

/** Normalize any stored/API navigation blob into typed NavItem[]. */
export function parseNavigation(raw: unknown): NavItem[] {
  if (!Array.isArray(raw)) return DEFAULT_NAVIGATION;
  const out: NavItem[] = [];
  for (const item of raw.slice(0, 8)) {
    const parsed = parseNavItem(item);
    if (parsed) out.push(parsed);
  }
  return out.length > 0 ? out : DEFAULT_NAVIGATION;
}

export function isNavbarLayout(v: unknown): v is NavbarLayout {
  return typeof v === 'string' && (NAVBAR_LAYOUTS as readonly string[]).includes(v);
}
