import { z } from 'zod';
import {
  DEFAULT_NAVIGATION,
  NAVBAR_LAYOUTS,
  type NavItem,
} from '../navigation/nav';

export {
  NAVBAR_LAYOUTS,
  NAVBAR_LAYOUT_LABELS,
  parseNavigation,
  type NavbarLayout,
  type NavbarCta,
  type NavItem,
  type ResolvedNavItem,
  type NavPanel,
  type NavPanelItem,
  type NavColumn,
  type NavFeatured,
  type NavFooterLink,
} from '../navigation/nav';

export const navbarCtaSchema = z.object({
  label: z.string().min(1).max(80),
  href: z.string().min(1).max(300),
  variant: z.enum(['ghost', 'solid', 'text']).default('ghost'),
});

export const navPanelItemSchema = z.object({
  label: z.string().min(1).max(120),
  href: z.string().min(1).max(300),
  description: z.string().max(300).optional().default(''),
  imageUrl: z.string().max(500).optional().default(''),
  iconUrl: z.string().max(500).optional().default(''),
  badge: z.string().max(40).optional().default(''),
});

export const navColumnSchema = z.object({
  heading: z.string().max(80).optional().default(''),
  items: z.array(navPanelItemSchema).max(16).default([]),
});

export const navFeaturedSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(400).optional().default(''),
  href: z.string().max(300).optional().default(''),
  imageUrl: z.string().max(500).optional().default(''),
});

export const navFooterLinkSchema = z.object({
  label: z.string().min(1).max(80),
  href: z.string().min(1).max(300),
});

export const navPanelSchema = z.object({
  columns: z.array(navColumnSchema).max(6).default([]),
  featured: z.array(navFeaturedSchema).max(4).default([]),
  footerLinks: z.array(navFooterLinkSchema).max(8).default([]),
});

/** Legacy flat `{ label, href }` or rich link/panel item. */
export const navItemSchema = z.preprocess(
  (raw) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
    const o = raw as Record<string, unknown>;
    if (!('kind' in o) && typeof o.label === 'string' && typeof o.href === 'string') {
      return { kind: 'link', label: o.label, href: o.href };
    }
    return raw;
  },
  z.discriminatedUnion('kind', [
    z.object({
      kind: z.literal('link'),
      label: z.string().min(1).max(80),
      href: z.string().min(1).max(300),
    }),
    z.object({
      kind: z.literal('categories'),
      label: z.string().min(1).max(80),
      href: z.string().min(1).max(300).default('/catalog'),
    }),
    z.object({
      kind: z.literal('panel'),
      label: z.string().min(1).max(80),
      href: z.string().max(300).optional().default(''),
      panel: navPanelSchema.default({ columns: [], featured: [], footerLinks: [] }),
    }),
  ]),
);

export const siteSettingsSchema = z.object({
  name: z.string().min(1).max(120),
  tagline: z.string().max(200).default(''),
  logoMediaId: z.string().nullable().optional(),
  faviconMediaId: z.string().nullable().optional(),
  contactEmail: z.string().max(120).optional().nullable(),
  contactPhone: z.string().max(40).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  social: z
    .object({
      twitter: z.string().max(120).optional().nullable(),
      instagram: z.string().max(120).optional().nullable(),
      linkedin: z.string().max(120).optional().nullable(),
      youtube: z.string().max(120).optional().nullable(),
    })
    .default({}),
  analytics: z
    .object({
      gaMeasurementId: z.string().max(40).optional().nullable(),
      gtmId: z.string().max(40).optional().nullable(),
    })
    .default({}),
  navbarLayout: z.enum(NAVBAR_LAYOUTS).default('classic'),
  navbarCtas: z.array(navbarCtaSchema).max(3).default([]),
  navigation: z.array(navItemSchema).max(8).default([]),
  footerText: z.string().max(300).optional().nullable(),
});

export type SiteSettings = z.infer<typeof siteSettingsSchema>;

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  name: 'Catalog CMS',
  tagline: 'Ürün kataloğu. Hızlı. SEO odaklı.',
  logoMediaId: null,
  faviconMediaId: null,
  contactEmail: null,
  contactPhone: null,
  address: null,
  social: {},
  analytics: {},
  navbarLayout: 'classic',
  navbarCtas: [{ label: 'İletişim', href: '/iletisim', variant: 'solid' }],
  navigation: DEFAULT_NAVIGATION as SiteSettings['navigation'],
  footerText: null,
};

/** Server helper — prefer client-safe `parseNavigation` from navigation/nav for islands. */
export function parseNavigationZod(raw: unknown): NavItem[] {
  if (!Array.isArray(raw)) return DEFAULT_NAVIGATION;
  const out: NavItem[] = [];
  for (const item of raw) {
    const parsed = navItemSchema.safeParse(item);
    if (parsed.success) out.push(parsed.data as NavItem);
  }
  return out.length > 0 ? out : DEFAULT_NAVIGATION;
}
