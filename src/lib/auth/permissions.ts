/** Module-based permission keys (code registry; assigned via role_permissions). */
export const PERMISSIONS = [
  'dashboard.access',
  'products.manage',
  'brands.manage',
  'categories.manage',
  'pages.manage',
  'blog.manage',
  'media.manage',
  'seo.manage',
  'import.manage',
  'settings.manage',
  'users.manage',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export function isPermission(value: string): value is Permission {
  return (PERMISSIONS as readonly string[]).includes(value);
}

export const PERMISSION_LABELS: Record<Permission, string> = {
  'dashboard.access': 'Genel bakış',
  'products.manage': 'Ürünler',
  'brands.manage': 'Markalar',
  'categories.manage': 'Kategoriler',
  'pages.manage': 'Sayfalar / Builder',
  'blog.manage': 'Blog',
  'media.manage': 'Medya',
  'seo.manage': 'SEO',
  'import.manage': 'İçe aktarım',
  'settings.manage': 'Site ayarları',
  'users.manage': 'Kullanıcılar & Roller',
};

export const ALL_PERMISSIONS: Permission[] = [...PERMISSIONS];

/** Stable IDs for seeded system roles. */
export const SYSTEM_ROLE_IDS = {
  admin: 'role_admin',
  productManager: 'role_product_manager',
  blogWriter: 'role_blog_writer',
  siteDesigner: 'role_site_designer',
} as const;

export const SYSTEM_ROLE_SLUGS = {
  admin: 'admin',
  productManager: 'product-manager',
  blogWriter: 'blog-writer',
  siteDesigner: 'site-designer',
} as const;

export type SystemRoleSeed = {
  id: string;
  name: string;
  slug: string;
  description: string;
  permissions: Permission[];
};

export const SYSTEM_ROLE_SEEDS: SystemRoleSeed[] = [
  {
    id: SYSTEM_ROLE_IDS.admin,
    name: 'Admin',
    slug: SYSTEM_ROLE_SLUGS.admin,
    description: 'Tüm yetkilere sahip sistem yöneticisi',
    permissions: ALL_PERMISSIONS,
  },
  {
    id: SYSTEM_ROLE_IDS.productManager,
    name: 'Ürün Düzenleyici',
    slug: SYSTEM_ROLE_SLUGS.productManager,
    description: 'Ürün, marka, kategori ve medya yönetimi',
    permissions: [
      'dashboard.access',
      'products.manage',
      'brands.manage',
      'categories.manage',
      'media.manage',
    ],
  },
  {
    id: SYSTEM_ROLE_IDS.blogWriter,
    name: 'Blog Yazarı',
    slug: SYSTEM_ROLE_SLUGS.blogWriter,
    description: 'Blog yazıları ve medya',
    permissions: ['dashboard.access', 'blog.manage', 'media.manage'],
  },
  {
    id: SYSTEM_ROLE_IDS.siteDesigner,
    name: 'Site Tasarımcısı',
    slug: SYSTEM_ROLE_SLUGS.siteDesigner,
    description: 'Sayfa builder, medya ve SEO',
    permissions: ['dashboard.access', 'pages.manage', 'media.manage', 'seo.manage'],
  },
];

export function hasPermission(
  permissions: readonly string[] | undefined,
  key: Permission | string,
): boolean {
  return Boolean(permissions?.includes(key));
}

export function hasAnyPermission(
  permissions: readonly string[] | undefined,
  keys: readonly (Permission | string)[],
): boolean {
  return keys.some((k) => hasPermission(permissions, k));
}
