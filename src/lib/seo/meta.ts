export type PageSeo = {
  title: string;
  description: string;
  canonical?: string;
  noindex?: boolean;
  ogTitle?: string;
  ogDescription?: string;
};

export function buildPageSeo(input: {
  title: string;
  description?: string | null;
  path: string;
  origin: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  canonical?: string | null;
  noindex?: boolean | null;
}): PageSeo {
  const title = input.seoTitle?.trim() || input.title;
  const description =
    input.seoDescription?.trim() ||
    input.description?.trim() ||
    'Catalog CMS ürün kataloğu';
  const canonical = input.canonical?.trim() || new URL(input.path, input.origin).toString();

  return {
    title,
    description,
    canonical,
    noindex: Boolean(input.noindex),
    ogTitle: title,
    ogDescription: description,
  };
}
