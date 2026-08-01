import type { Permission } from '../../lib/auth/permissions';
import { hasPermission as checkPerm } from '../../lib/auth/permissions';
import type { SessionUser } from './session';

/** Longest-prefix first matching for admin routes. */
const ROUTE_PERMISSIONS: { prefix: string; permission: Permission }[] = [
  { prefix: '/api/admin/users', permission: 'users.manage' },
  { prefix: '/api/admin/roles', permission: 'users.manage' },
  { prefix: '/api/admin/permissions', permission: 'users.manage' },
  { prefix: '/admin/users', permission: 'users.manage' },
  { prefix: '/api/admin/products', permission: 'products.manage' },
  { prefix: '/admin/products', permission: 'products.manage' },
  { prefix: '/api/admin/brands', permission: 'brands.manage' },
  { prefix: '/admin/brands', permission: 'brands.manage' },
  { prefix: '/api/admin/categories', permission: 'categories.manage' },
  { prefix: '/admin/categories', permission: 'categories.manage' },
  { prefix: '/api/admin/pages', permission: 'pages.manage' },
  { prefix: '/api/admin/sections', permission: 'pages.manage' },
  { prefix: '/admin/pages', permission: 'pages.manage' },
  { prefix: '/admin/builder', permission: 'pages.manage' },
  { prefix: '/api/admin/posts', permission: 'blog.manage' },
  { prefix: '/admin/blog', permission: 'blog.manage' },
  { prefix: '/api/admin/media', permission: 'media.manage' },
  { prefix: '/admin/media', permission: 'media.manage' },
  { prefix: '/api/admin/seo', permission: 'seo.manage' },
  { prefix: '/admin/seo', permission: 'seo.manage' },
  { prefix: '/api/admin/import', permission: 'import.manage' },
  { prefix: '/api/admin/export', permission: 'import.manage' },
  { prefix: '/admin/import', permission: 'import.manage' },
  { prefix: '/api/admin/settings', permission: 'settings.manage' },
  { prefix: '/admin/settings', permission: 'settings.manage' },
  { prefix: '/api/admin/dashboard', permission: 'dashboard.access' },
  { prefix: '/admin', permission: 'dashboard.access' },
];

/** Sort by prefix length descending so more specific paths win. */
const SORTED = [...ROUTE_PERMISSIONS].sort((a, b) => b.prefix.length - a.prefix.length);

export function requiredPermissionForPath(pathname: string): Permission | null {
  // Auth endpoints — already exempt from admin guard, but be safe
  if (pathname === '/admin/login' || pathname.startsWith('/api/admin/auth/')) {
    return null;
  }
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) {
    return null;
  }
  for (const rule of SORTED) {
    if (pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)) {
      return rule.permission;
    }
  }
  // Exact /admin only matched by prefix '/admin' above
  return 'dashboard.access';
}

export function userCanAccessPath(user: SessionUser, pathname: string): boolean {
  const needed = requiredPermissionForPath(pathname);
  if (!needed) return true;
  return checkPerm(user.permissions, needed);
}
