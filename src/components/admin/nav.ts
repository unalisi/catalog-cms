import type { LucideIcon } from 'lucide-react';
import {
  FolderTree,
  Image,
  LayoutGrid,
  Newspaper,
  Package,
  Palette,
  Search,
  Settings,
  Tag,
  FileStack,
  Menu,
  Upload,
  Users,
} from 'lucide-react';
import type { Permission } from '@/lib/auth/permissions';

export type AdminNavLeaf = {
  kind?: 'leaf';
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  permission: Permission;
};

export type AdminNavDropdown = {
  kind: 'dropdown';
  id: string;
  label: string;
  icon: LucideIcon;
  children: AdminNavLeaf[];
};

export type AdminNavEntry = AdminNavLeaf | AdminNavDropdown;

/** @deprecated Prefer AdminNavLeaf — kept for call sites that expect flat items. */
export type AdminNavItem = AdminNavLeaf;

export type AdminNavGroup = {
  id: string;
  label: string;
  items: AdminNavEntry[];
};

function isDropdown(entry: AdminNavEntry): entry is AdminNavDropdown {
  return entry.kind === 'dropdown';
}

/** Concept: İçerik + Sistem groups; full catalog CMS routes kept. */
export const adminNavGroups: AdminNavGroup[] = [
  {
    id: 'content',
    label: 'İçerik',
    items: [
      { href: '/admin', label: 'Genel Bakış', icon: LayoutGrid, exact: true, permission: 'dashboard.access' },
      { href: '/admin/products', label: 'Ürünler', icon: Package, permission: 'products.manage' },
      { href: '/admin/brands', label: 'Markalar', icon: Tag, permission: 'brands.manage' },
      { href: '/admin/categories', label: 'Kategoriler', icon: FolderTree, permission: 'categories.manage' },
      {
        kind: 'dropdown',
        id: 'design',
        label: 'Tasarım',
        icon: Palette,
        children: [
          { href: '/admin/pages', label: 'Sayfalar', icon: FileStack, permission: 'pages.manage' },
          { href: '/admin/menus', label: 'Menüler', icon: Menu, permission: 'pages.manage' },
        ],
      },
      { href: '/admin/blog', label: 'Blog', icon: Newspaper, permission: 'blog.manage' },
      { href: '/admin/media', label: 'Medya', icon: Image, permission: 'media.manage' },
    ],
  },
  {
    id: 'system',
    label: 'Sistem',
    items: [
      { href: '/admin/seo', label: 'SEO', icon: Search, permission: 'seo.manage' },
      { href: '/admin/import', label: 'İçe aktarım', icon: Upload, permission: 'import.manage' },
      { href: '/admin/settings', label: 'Ayarlar', icon: Settings, permission: 'settings.manage' },
      {
        href: '/admin/users',
        label: 'Kullanıcılar & Roller',
        icon: Users,
        permission: 'users.manage',
      },
    ],
  },
];

/** Flat list of navigable leaf items (command palette, mobile tabs). */
export const adminNav: AdminNavLeaf[] = adminNavGroups.flatMap((g) =>
  g.items.flatMap((entry) => (isDropdown(entry) ? entry.children : [entry])),
);

/** Primary mobile bottom-bar destinations (More fills the rest). */
export const adminMobileTabHrefs = ['/admin', '/admin/products', '/admin/media'] as const;

export function isNavActive(pathname: string, href: string, exact = false): boolean {
  if (exact) return pathname === href;
  // Pages builder lives under /admin/builder but belongs to Sayfalar
  if (href === '/admin/pages') {
    return (
      pathname === '/admin/pages' ||
      pathname.startsWith('/admin/pages/') ||
      pathname.startsWith('/admin/builder')
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isDropdownActive(pathname: string, dropdown: AdminNavDropdown): boolean {
  return dropdown.children.some((child) => isNavActive(pathname, child.href, child.exact));
}

function filterEntry(
  entry: AdminNavEntry,
  permissions: readonly string[] | undefined,
): AdminNavEntry | null {
  if (isDropdown(entry)) {
    const children = entry.children.filter((c) => permissions?.includes(c.permission));
    if (children.length === 0) return null;
    return { ...entry, children };
  }
  if (!permissions?.includes(entry.permission)) return null;
  return entry;
}

export function filterNavGroups(
  permissions: readonly string[] | undefined,
): AdminNavGroup[] {
  return adminNavGroups
    .map((group) => ({
      ...group,
      items: group.items
        .map((entry) => filterEntry(entry, permissions))
        .filter((e): e is AdminNavEntry => e != null),
    }))
    .filter((group) => group.items.length > 0);
}

export function filterMobileTabs(
  permissions: readonly string[] | undefined,
): AdminNavLeaf[] {
  const allowed = new Set(
    adminNav.filter((item) => permissions?.includes(item.permission)).map((i) => i.href),
  );
  return adminMobileTabHrefs
    .map((href) => adminNav.find((i) => i.href === href))
    .filter((item): item is AdminNavLeaf => Boolean(item && allowed.has(item.href)));
}

export function filterMoreNavGroups(
  permissions: readonly string[] | undefined,
): AdminNavGroup[] {
  const tabHrefs = new Set<string>(adminMobileTabHrefs);
  return filterNavGroups(permissions)
    .map((group) => ({
      ...group,
      items: group.items
        .map((entry) => {
          if (isDropdown(entry)) {
            const children = entry.children.filter((c) => !tabHrefs.has(c.href));
            if (children.length === 0) return null;
            return { ...entry, children };
          }
          if (tabHrefs.has(entry.href)) return null;
          return entry;
        })
        .filter((e): e is AdminNavEntry => e != null),
    }))
    .filter((group) => group.items.length > 0);
}

export { isDropdown as isAdminNavDropdown };
