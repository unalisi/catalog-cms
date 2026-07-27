import { slugify } from '../../utils/id';
import type { ImportRecord, MappingProfile } from '../types';

type WooImage = { src?: string; alt?: string };
type WooTerm = { name?: string };
type WooProduct = {
  name?: string;
  slug?: string;
  sku?: string;
  description?: string;
  short_description?: string;
  regular_price?: string | number;
  price?: string | number;
  stock_quantity?: number | null;
  status?: string;
  categories?: WooTerm[];
  images?: WooImage[];
  brands?: WooTerm[];
};

function normalizeStatus(raw: string | undefined): ImportRecord['status'] {
  const value = (raw || '').trim().toLowerCase();
  if (value === 'publish' || value === 'published') return 'published';
  if (value === 'private' || value === 'trash') return 'archived';
  return 'draft';
}

function priceToMinorUnits(raw: string | number | undefined): number {
  if (raw === undefined || raw === null || raw === '') return 0;
  const major = typeof raw === 'number' ? raw : Number.parseFloat(String(raw).replace(',', '.'));
  if (!Number.isFinite(major) || major < 0) return 0;
  return Math.round(major * 100);
}

function stripHtml(html: string | undefined | null): string | null {
  if (!html) return null;
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text || null;
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
    const description = item.description?.trim() || stripHtml(item.short_description) || null;
    const price = priceToMinorUnits(item.regular_price ?? item.price);
    const stock = Math.max(0, Math.trunc(item.stock_quantity ?? 0));
    const status = normalizeStatus(item.status);
    const brand = item.brands?.[0]?.name?.trim() || null;
    const categories = (item.categories || [])
      .map((c) => c.name?.trim())
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
      price,
      stock,
      status,
      brand,
      categories,
      media,
    });
  }

  return records;
}
