import {
  DEFAULT_SEO_SETTINGS,
  type SeoDefaults,
  type SeoFieldsInput,
} from '../validation/seo';

export type PageSeo = {
  title: string;
  description: string;
  canonical: string;
  noindex: boolean;
  robots?: string;
  ogTitle: string;
  ogDescription: string;
  ogImage?: string;
  ogType: string;
  twitterCard: 'summary' | 'summary_large_image';
  twitterTitle: string;
  twitterDescription: string;
  twitterImage?: string;
  twitterSite?: string;
};

function applyTitleTemplate(title: string, defaults: SeoDefaults, isHome: boolean): string {
  if (isHome) return defaults.siteName;
  if (title.includes(defaults.siteName)) return title;
  return defaults.titleTemplate.replace('%s', title);
}

function absolutize(urlOrPath: string | null | undefined, origin: string): string | undefined {
  if (!urlOrPath?.trim()) return undefined;
  const value = urlOrPath.trim();
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  try {
    return new URL(value.startsWith('/') ? value : `/${value}`, origin).toString();
  } catch {
    return undefined;
  }
}

export function buildPageSeo(input: {
  title: string;
  description?: string | null;
  path: string;
  origin: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  canonical?: string | null;
  noindex?: boolean | null;
  robotsExtra?: string | null;
  ogImageUrl?: string | null;
  ogType?: string;
  defaults?: SeoDefaults;
  isHome?: boolean;
}): PageSeo {
  const defaults = input.defaults ?? DEFAULT_SEO_SETTINGS;
  const rawTitle = input.seoTitle?.trim() || input.title;
  const title = applyTitleTemplate(rawTitle, defaults, Boolean(input.isHome));
  const description =
    input.seoDescription?.trim() ||
    input.description?.trim() ||
    defaults.defaultDescription;
  const canonical =
    input.canonical?.trim() || new URL(input.path, input.origin).toString();
  const ogImage =
    absolutize(input.ogImageUrl, input.origin) ||
    absolutize(defaults.defaultOgImageUrl, input.origin);
  const noindex = Boolean(input.noindex);
  const robotsParts = [
    noindex ? 'noindex, nofollow' : null,
    input.robotsExtra?.trim() || null,
  ].filter(Boolean);

  return {
    title,
    description,
    canonical,
    noindex,
    robots: robotsParts.length > 0 ? robotsParts.join(', ') : undefined,
    ogTitle: rawTitle,
    ogDescription: description,
    ogImage,
    ogType: input.ogType ?? 'website',
    twitterCard: ogImage ? 'summary_large_image' : 'summary',
    twitterTitle: rawTitle,
    twitterDescription: description,
    twitterImage: ogImage,
    twitterSite: defaults.twitterHandle?.trim() || undefined,
  };
}

export function seoInputFromForm(fields: SeoFieldsInput | null | undefined) {
  if (!fields) return null;
  return {
    title: fields.title?.trim() || null,
    description: fields.description?.trim() || null,
    canonical: fields.canonical?.trim() || null,
    ogImageUrl: fields.ogImageUrl?.trim() || null,
    noindex: Boolean(fields.noindex),
    robotsExtra: fields.robotsExtra?.trim() || null,
  };
}
