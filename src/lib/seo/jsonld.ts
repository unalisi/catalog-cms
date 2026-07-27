import type { SeoDefaults } from '../validation/seo';
import { formatMoney } from '../money';

export type JsonLd = Record<string, unknown>;

export function organizationJsonLd(origin: string, defaults: SeoDefaults): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: defaults.organizationName,
    url: origin,
  };
}

export function websiteJsonLd(origin: string, defaults: SeoDefaults): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: defaults.siteName,
    url: origin,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${origin}/catalog?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbJsonLd(
  origin: string,
  items: { name: string; path: string }[],
): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: new URL(item.path, origin).toString(),
    })),
  };
}

export function productJsonLd(input: {
  origin: string;
  name: string;
  description?: string | null;
  slug: string;
  sku?: string | null;
  price: number;
  currency: string;
  brandName?: string | null;
  imageUrl?: string | null;
}): JsonLd {
  const url = new URL(`/product/${input.slug}`, input.origin).toString();
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    description: input.description ?? undefined,
    sku: input.sku ?? undefined,
    image: input.imageUrl ?? undefined,
    brand: input.brandName
      ? { '@type': 'Brand', name: input.brandName }
      : undefined,
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: input.currency,
      price: (input.price / 100).toFixed(2),
      availability: 'https://schema.org/InStock',
    },
  };
}

export function articleJsonLd(input: {
  origin: string;
  title: string;
  description?: string | null;
  slug: string;
  publishedAt?: string | null;
  updatedAt?: string | null;
  imageUrl?: string | null;
  siteName: string;
}): JsonLd {
  const url = new URL(`/blog/${input.slug}`, input.origin).toString();
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.title,
    description: input.description ?? undefined,
    url,
    mainEntityOfPage: url,
    datePublished: input.publishedAt ?? undefined,
    dateModified: input.updatedAt ?? input.publishedAt ?? undefined,
    image: input.imageUrl ?? undefined,
    publisher: {
      '@type': 'Organization',
      name: input.siteName,
      url: input.origin,
    },
  };
}

export function stringifyJsonLd(nodes: JsonLd[]): string {
  return JSON.stringify(nodes.length === 1 ? nodes[0] : nodes);
}

export { formatMoney };
