import type { ProductExportRecord } from '../query';

/**
 * CSV export — reverse mapping of the CSV import adapter (round-trip).
 */
const COLUMNS = [
  'sku',
  'name',
  'slug',
  'price',
  'compare_at_price',
  'currency',
  'stock',
  'description',
  'status',
  'brand',
  'categories',
  'images',
] as const;

export function csvHeader(): string {
  return `${COLUMNS.join(',')}\n`;
}

export function csvRow(p: ProductExportRecord): string {
  const values = [
    p.sku ?? '',
    p.name,
    p.slug,
    (p.price / 100).toFixed(2),
    p.compareAtPrice != null ? (p.compareAtPrice / 100).toFixed(2) : '',
    p.currency,
    String(p.stock),
    p.description,
    p.status,
    p.brandName ?? '',
    p.categoryNames.join('|'),
    p.mediaUrls.join('|'),
  ];
  return `${values.map(escapeCsvCell).join(',')}\n`;
}

function escapeCsvCell(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
