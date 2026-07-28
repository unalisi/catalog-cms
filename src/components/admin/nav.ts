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
} from 'lucide-react';

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
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
      { href: '/admin', label: 'Genel Bakış', icon: LayoutGrid, exact: true },
      { href: '/admin/products', label: 'Ürünler', icon: Package },
      { href: '/admin/brands', label: 'Markalar', icon: Tag },
      { href: '/admin/categories', label: 'Kategoriler', icon: FolderTree },
      { href: '/admin/pages', label: 'Sayfa Bölümleri', icon: FileStack },
      { href: '/admin/blog', label: 'Blog', icon: Newspaper },
      { href: '/admin/media', label: 'Medya', icon: Image },
    ],
  },
  {
    id: 'system',
    label: 'Sistem',
    items: [
      { href: '/admin/seo', label: 'SEO', icon: Search },
      { href: '/admin/import', label: 'İçe aktarım', icon: Upload },
      { href: '/admin/settings', label: 'Ayarlar', icon: Settings },
    ],
  },
];

export const adminNav: AdminNavItem[] = adminNavGroups.flatMap((g) => g.items);

export function isNavActive(pathname: string, href: string, exact = false): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
