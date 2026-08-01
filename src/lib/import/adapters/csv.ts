import { slugify } from '../../utils/id';
import type { ImportRecord, MappingProfile } from '../types';

const DEFAULT_MAPPING: MappingProfile = {
  name: 'name',
  slug: 'slug',
  sku: 'sku',
  price: 'price',
  compareAtPrice: 'compare_at_price',
  stock: 'stock',
  description: 'description',
  brand: 'brand',
  categories: 'categories',
  imageUrl: 'images',
  status: 'status',
};

/** Tolerant RFC4180-ish parser: handles quoted fields with commas/newlines/escaped quotes. */
function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let hasContent = false;
  const len = text.length;
  let i = 0;

  while (i < len) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += char;
      i++;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      hasContent = true;
      i++;
      continue;
    }
    if (char === ',') {
      row.push(field);
      field = '';
      hasContent = true;
      i++;
      continue;
    }
    if (char === '\r') {
      i++;
      continue;
    }
    if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      hasContent = false;
      i++;
      continue;
    }
    field += char;
    hasContent = true;
    i++;
  }
  if (hasContent || field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ''));
}

function normalizeStatus(raw: string | undefined): ImportRecord['status'] {
  const value = (raw || '').trim().toLowerCase();
  if (value === 'published' || value === 'publish' || value === 'active') return 'published';
  if (value === 'archived' || value === 'archive' || value === 'trash') return 'archived';
  return 'draft';
}

function parsePriceToMinorUnits(raw: string | undefined): number {
  if (!raw) return 0;
  const cleaned = raw.trim().replace(/[^0-9.,-]/g, '').replace(',', '.');
  const major = Number.parseFloat(cleaned);
  if (!Number.isFinite(major) || major < 0) return 0;
  return Math.round(major * 100);
}

export function parseToRecords(input: string, mapping?: MappingProfile): ImportRecord[] {
  const map = { ...DEFAULT_MAPPING, ...mapping };
  const rows = parseCsvRows(input);
  if (rows.length === 0) return [];

  const header = rows[0].map((h) => h.trim());
  const colIndex = (...keys: string[]) => {
    for (const key of keys) {
      const idx = header.indexOf(key);
      if (idx >= 0) return idx;
    }
    return -1;
  };

  const nameIdx = colIndex(map.name);
  const slugIdx = map.slug ? colIndex(map.slug) : -1;
  const skuIdx = map.sku ? colIndex(map.sku) : -1;
  const priceIdx = colIndex(map.price);
  const compareAtIdx = map.compareAtPrice
    ? colIndex(map.compareAtPrice, 'compareAtPrice', 'compare_at_price')
    : colIndex('compareAtPrice', 'compare_at_price');
  const stockIdx = map.stock ? colIndex(map.stock) : -1;
  const descriptionIdx = map.description ? colIndex(map.description) : -1;
  const brandIdx = map.brand ? colIndex(map.brand) : -1;
  const categoriesIdx = map.categories ? colIndex(map.categories) : -1;
  const imageUrlIdx = map.imageUrl
    ? colIndex(map.imageUrl, 'images', 'image')
    : colIndex('images', 'image');
  const statusIdx = map.status ? colIndex(map.status) : -1;

  const records: ImportRecord[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((cell) => cell.trim() === '')) continue;

    const name = (nameIdx >= 0 ? row[nameIdx] : '')?.trim() || '';
    if (!name) continue;

    const slugRaw = slugIdx >= 0 ? row[slugIdx]?.trim() : '';
    const slug = slugRaw || slugify(name);
    const sku = skuIdx >= 0 ? row[skuIdx]?.trim() || null : null;
    const description = descriptionIdx >= 0 ? row[descriptionIdx]?.trim() || null : null;
    const brand = brandIdx >= 0 ? row[brandIdx]?.trim() || null : null;
    const categories =
      categoriesIdx >= 0 && row[categoriesIdx]
        ? row[categoriesIdx]
            .split(/[|,]/)
            .map((c) => c.trim())
            .filter(Boolean)
        : [];
    const imageCell = imageUrlIdx >= 0 ? row[imageUrlIdx]?.trim() : '';
    const media = imageCell
      ? imageCell
          .split('|')
          .map((u) => u.trim())
          .filter(Boolean)
          .map((url, i) => ({ url, position: i, isPrimary: i === 0 }))
      : [];
    const compareRaw = compareAtIdx >= 0 ? row[compareAtIdx] : undefined;
    const compareAtPrice = compareRaw?.trim()
      ? parsePriceToMinorUnits(compareRaw)
      : null;

    records.push({
      name,
      slug,
      sku,
      description,
      price: parsePriceToMinorUnits(priceIdx >= 0 ? row[priceIdx] : undefined),
      compareAtPrice: compareAtPrice && compareAtPrice > 0 ? compareAtPrice : null,
      stock: stockIdx >= 0 ? Math.max(0, Math.trunc(Number(row[stockIdx]) || 0)) : 0,
      status: normalizeStatus(statusIdx >= 0 ? row[statusIdx] : undefined),
      brand,
      categories,
      media,
    });
  }

  return records;
}
