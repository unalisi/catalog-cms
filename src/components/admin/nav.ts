/**
 * @deprecated Prefer `@/lib/nav/admin-nav` — this re-exports a flat leaf list for legacy callers.
 */
export {
  ADMIN_NAV as adminNav,
  filterNavByPermissions,
  type NavItem as AdminNavLeaf,
  type NavItem as AdminNavItem,
} from '@/lib/nav/admin-nav';

import {
  ADMIN_NAV,
  filterNavByPermissions,
  type NavItem,
} from '@/lib/nav/admin-nav';

export type AdminNavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

export function filterNavGroups(permissions: readonly string[] | undefined): AdminNavGroup[] {
  const items = filterNavByPermissions(permissions ?? []);
  const byGroup = new Map<string, NavItem[]>();
  for (const item of items) {
    const list = byGroup.get(item.group) ?? [];
    list.push(item);
    byGroup.set(item.group, list);
  }
  return [...byGroup.entries()].map(([label, groupItems]) => ({
    id: label.toLowerCase(),
    label,
    items: groupItems,
  }));
}

export function isNavActive(pathname: string, href: string, exact = false): boolean {
  if (exact) return pathname === href;
  if (href === '/admin/pages') {
    return (
      pathname === '/admin/pages' ||
      pathname.startsWith('/admin/pages/') ||
      pathname.startsWith('/admin/builder')
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export const adminMobileTabHrefs = ['/admin', '/admin/products', '/admin/media'] as const;

export function filterMobileTabs(permissions: readonly string[] | undefined): NavItem[] {
  const allowed = new Set(
    filterNavByPermissions(permissions ?? []).map((i) => i.href),
  );
  return adminMobileTabHrefs
    .map((href) => ADMIN_NAV.find((i) => i.href === href))
    .filter((item): item is NavItem => Boolean(item && allowed.has(item.href)));
}

export function filterMoreNavGroups(permissions: readonly string[] | undefined): AdminNavGroup[] {
  const tabHrefs = new Set<string>(adminMobileTabHrefs);
  return filterNavGroups(permissions)
    .map((group) => ({
      ...group,
      items: group.items.filter((i) => !tabHrefs.has(i.href)),
    }))
    .filter((g) => g.items.length > 0);
}

export function isAdminNavDropdown(_entry: unknown): boolean {
  return false;
}

export function isDropdownActive(): boolean {
  return false;
}
