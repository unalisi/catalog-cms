import type { LucideIcon } from 'lucide-react';
import {
  FolderTree,
  Image,
  LayoutDashboard,
  Newspaper,
  Package,
  Search,
  Settings,
  Tags,
  FileText,
  Upload,
} from 'lucide-react';

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

export const adminNav: AdminNavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Ürünler', icon: Package },
  { href: '/admin/brands', label: 'Markalar', icon: Tags },
  { href: '/admin/categories', label: 'Kategoriler', icon: FolderTree },
  { href: '/admin/pages', label: 'Sayfalar', icon: FileText },
  { href: '/admin/seo', label: 'SEO', icon: Search },
  { href: '/admin/blog', label: 'Blog', icon: Newspaper },
  { href: '/admin/import', label: 'İçe aktarım', icon: Upload },
  { href: '/admin/media', label: 'Medya', icon: Image },
  { href: '/admin/settings', label: 'Ayarlar', icon: Settings },
];

export function isNavActive(pathname: string, href: string, exact = false): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
