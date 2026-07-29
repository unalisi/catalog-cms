import type { LucideIcon } from 'lucide-react';
import {
  FolderTree,
  Image,
  LayoutGrid,
  Newspaper,
  Package,
  Search,
  Settings,
  Tag,
  FileStack,
  Upload,
  Users,
} from 'lucide-react';
import type { Permission } from '@/lib/auth/permissions';

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  permission: Permission;
};

export type AdminNavGroup = {
  id: string;
  label: string;
  items: AdminNavItem[];
};

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
      { href: '/admin/pages', label: 'Sayfalar', icon: FileStack, permission: 'pages.manage' },
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

export const adminNav: AdminNavItem[] = adminNavGroups.flatMap((g) => g.items);

export function isNavActive(pathname: string, href: string, exact = false): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function filterNavGroups(
  permissions: readonly string[] | undefined,
): AdminNavGroup[] {
  return adminNavGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => permissions?.includes(item.permission)),
    }))
    .filter((group) => group.items.length > 0);
}
