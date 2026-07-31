import type { NavbarCta, ResolvedNavItem, NavbarLayout } from '../../../lib/navigation/nav';

export type SiteNavbarProps = {
  siteName: string;
  logoUrl: string | null;
  logoAlt: string;
  layout: NavbarLayout;
  items: ResolvedNavItem[];
  ctas: NavbarCta[];
};

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}
