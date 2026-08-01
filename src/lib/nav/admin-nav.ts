import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Package,
  Tag,
  FolderTree,
  FileStack,
  Menu,
  Newspaper,
  Search,
  Image,
  Upload,
  Users,
  Settings,
} from 'lucide-react';
import type { Permission } from '@/lib/auth/permissions';

/**
 * Tek kaynaklı admin navigasyon config'i.
 * Sidebar (AdminShell), ⌘K Command Palette ve breadcrumb bunu kullanır.
 */

export type NavGroup = 'İçerik' | 'Pazarlama' | 'Sistem';

export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  permission: Permission;
  group: NavGroup;
  shortcut?: string;
  badge?: 'beta' | 'new';
  /** Varsayılan true — alt rotalar da bu item'a ait sayılsın. */
  matchPrefix?: boolean;
};

export const ADMIN_NAV: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Genel Bakış',
    href: '/admin',
    icon: LayoutDashboard,
    permission: 'dashboard.access',
    group: 'İçerik',
    matchPrefix: false,
  },
  {
    id: 'products',
    label: 'Ürünler',
    href: '/admin/products',
    icon: Package,
    permission: 'products.manage',
    group: 'İçerik',
    shortcut: 'G P',
  },
  {
    id: 'brands',
    label: 'Markalar',
    href: '/admin/brands',
    icon: Tag,
    permission: 'brands.manage',
    group: 'İçerik',
    shortcut: 'G B',
  },
  {
    id: 'categories',
    label: 'Kategoriler',
    href: '/admin/categories',
    icon: FolderTree,
    permission: 'categories.manage',
    group: 'İçerik',
  },
  {
    id: 'pages',
    label: 'Sayfalar',
    href: '/admin/pages',
    icon: FileStack,
    permission: 'pages.manage',
    group: 'İçerik',
  },
  {
    id: 'menus',
    label: 'Menüler',
    href: '/admin/menus',
    icon: Menu,
    permission: 'pages.manage',
    group: 'İçerik',
  },
  {
    id: 'blog',
    label: 'Blog',
    href: '/admin/blog',
    icon: Newspaper,
    permission: 'blog.manage',
    group: 'İçerik',
  },
  {
    id: 'media',
    label: 'Medya',
    href: '/admin/media',
    icon: Image,
    permission: 'media.manage',
    group: 'İçerik',
  },
  {
    id: 'seo',
    label: 'SEO',
    href: '/admin/seo',
    icon: Search,
    permission: 'seo.manage',
    group: 'Pazarlama',
  },
  {
    id: 'import',
    label: 'İçe / Dışa Aktarım',
    href: '/admin/import',
    icon: Upload,
    permission: 'import.manage',
    group: 'Pazarlama',
  },
  {
    id: 'settings',
    label: 'Ayarlar',
    href: '/admin/settings',
    icon: Settings,
    permission: 'settings.manage',
    group: 'Sistem',
  },
  {
    id: 'users',
    label: 'Kullanıcılar & Roller',
    href: '/admin/users',
    icon: Users,
    permission: 'users.manage',
    group: 'Sistem',
  },
];

const GROUP_ORDER: NavGroup[] = ['İçerik', 'Pazarlama', 'Sistem'];

export function filterNavByPermissions(
  userPermissions: Set<string> | readonly string[],
): NavItem[] {
  const set =
    userPermissions instanceof Set ? userPermissions : new Set(userPermissions);
  return ADMIN_NAV.filter((item) => set.has(item.permission));
}

export function groupNav(
  items: NavItem[],
): Array<{ group: NavGroup; items: NavItem[] }> {
  const map = new Map<NavGroup, NavItem[]>();
  for (const item of items) {
    if (!map.has(item.group)) map.set(item.group, []);
    map.get(item.group)!.push(item);
  }
  return GROUP_ORDER.filter((g) => map.has(g)).map((g) => ({
    group: g,
    items: map.get(g)!,
  }));
}

function pathMatchesItem(pathname: string, item: NavItem): boolean {
  // Builder lives under /admin/builder but belongs to Sayfalar
  if (item.href === '/admin/pages') {
    return (
      pathname === '/admin/pages' ||
      pathname.startsWith('/admin/pages/') ||
      pathname.startsWith('/admin/builder')
    );
  }
  const matchPrefix = item.matchPrefix ?? true;
  return matchPrefix
    ? pathname === item.href || pathname.startsWith(`${item.href}/`)
    : pathname === item.href;
}

export function findActiveNavItem(
  pathname: string,
  items: NavItem[] = ADMIN_NAV,
): NavItem | null {
  let best: NavItem | null = null;
  for (const item of items) {
    if (!pathMatchesItem(pathname, item)) continue;
    if (!best || item.href.length > best.href.length) best = item;
  }
  return best;
}

export type BreadcrumbEntry = { label: string; href?: string };

export function buildBreadcrumb(pathname: string, extra?: string): BreadcrumbEntry[] {
  const active = findActiveNavItem(pathname);
  const trail: BreadcrumbEntry[] = [{ label: 'Panel', href: '/admin' }];

  if (active) {
    trail.push({ label: active.group });
    trail.push({ label: active.label, href: extra ? active.href : undefined });
  }

  if (extra) {
    trail.push({ label: extra });
  }

  return trail;
}
