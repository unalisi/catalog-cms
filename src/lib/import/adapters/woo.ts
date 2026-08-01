import { slugify } from '../../utils/id';
import type { ImportRecord, MappingProfile } from '../types';

type WooImage = { src?: string; alt?: string };
type WooTerm = { name?: string; slug?: string };
type WooProduct = {
  name?: string;
  slug?: string;
  sku?: string;
  description?: string;
  short_description?: string;
  regular_price?: string | number;
  sale_price?: string | number;
  price?: string | number;
  stock_quantity?: number | null;
  manage_stock?: boolean;
  stock_status?: string;
  status?: string;
  categories?: WooTerm[];
  images?: WooImage[];
  brands?: WooTerm[];
};

function normalizeStatus(raw: string | undefined): ImportRecord['status'] {
  const value = (raw || '').trim().toLowerCase();
  if (value === 'publish' || value === 'published') return 'published';
  if (value === 'trash') return 'archived';
  // Woo `private` → draft (editable in admin, not public)
  if (value === 'private') return 'draft';
  return 'draft';
}

function priceToMinorUnits(raw: string | number | undefined | null): number | null {
  if (raw === undefined || raw === null || raw === '') return null;
  const major = typeof raw === 'number' ? raw : Number.parseFloat(String(raw).replace(',', '.'));
  if (!Number.isFinite(major) || major < 0) return null;
  return Math.round(major * 100);
}

function resolveStock(item: WooProduct): number {
  if (typeof item.stock_quantity === 'number' && Number.isFinite(item.stock_quantity)) {
    return Math.max(0, Math.trunc(item.stock_quantity));
  }
  if (item.manage_stock === false) {
    const status = (item.stock_status || '').toLowerCase();
    if (status === 'outofstock') return 0;
    return 1;
  }
  const status = (item.stock_status || '').toLowerCase();
  if (status === 'instock') return 1;
  if (status === 'outofstock') return 0;
  return 0;
}

/** Merge Woo HTML description with short_description (short first when both exist). */
function mergeDescription(
  description: string | undefined,
  shortDescription: string | undefined,
): string | null {
  const longHtml = description?.trim() || '';
  const shortHtml = shortDescription?.trim() || '';
  if (longHtml && shortHtml) {
    return `${shortHtml}\n${longHtml}`;
  }
  return longHtml || shortHtml || null;
}

function categoryLabel(term: WooTerm): string | null {
  const name = term.name?.trim();
  if (name) return name;
  const slug = term.slug?.trim();
  return slug || null;
}

/** Parses a WooCommerce REST `/wp-json/wc/v3/products` JSON array or `{ products: [] }` payload. */
export function parseToRecords(input: string, _mapping?: MappingProfile): ImportRecord[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    return [];
  }

  const list: WooProduct[] = Array.isArray(parsed)
    ? (parsed as WooProduct[])
    : Array.isArray((parsed as { products?: unknown })?.products)
      ? ((parsed as { products: WooProduct[] }).products)
      : [];

  const records: ImportRecord[] = [];
  for (const item of list) {
    const name = (item.name || '').trim();
    if (!name) continue;

    const slug = (item.slug || '').trim() || slugify(name);
    const sku = item.sku?.trim() || null;
    const description = mergeDescription(item.description, item.short_description);
    const price = priceToMinorUnits(item.regular_price ?? item.price) ?? 0;
    const sale = priceToMinorUnits(item.sale_price);
    const compareAtPrice =
      sale !== null && sale > 0 && sale !== price ? sale : null;
    // Woo sale_price is the discounted price; catalog uses price as selling + compareAt as strikethrough.
    // Prefer regular as compareAt when on sale, and sale as selling price.
    let finalPrice = price;
    let finalCompare: number | null = compareAtPrice;
    if (sale !== null && sale > 0 && price > 0 && sale < price) {
      finalPrice = sale;
      finalCompare = price;
    }

    const brand = item.brands?.[0]?.name?.trim() || null;
    const categories = (item.categories || [])
      .map(categoryLabel)
      .filter((n): n is string => Boolean(n));
    const media: { url: string; alt?: string }[] = [];
    for (const img of item.images || []) {
      if (img.src) media.push({ url: img.src, alt: img.alt || undefined });
    }

    records.push({
      name,
      slug,
      sku,
      description,
      price: finalPrice,
      compareAtPrice: finalCompare,
      stock: resolveStock(item),
      status: normalizeStatus(item.status),
      brand,
      categories,
      media,
      seo: {
        title: name,
        description: item.short_description?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || null,
      },
    });
  }

  return records;
}
