import type { ProductExportRecord } from '../query';

/** XML export — generic product feed for round-trip with XML import. */
export function xmlHeader(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<products>\n`;
}

export function xmlFooter(): string {
  return `</products>\n`;
}

export function xmlRow(p: ProductExportRecord): string {
  return (
    `  <product>\n` +
    `    <sku>${esc(p.sku ?? '')}</sku>\n` +
    `    <name>${esc(p.name)}</name>\n` +
    `    <slug>${esc(p.slug)}</slug>\n` +
    `    <price>${(p.price / 100).toFixed(2)}</price>\n` +
    `    <compare_at_price>${p.compareAtPrice != null ? (p.compareAtPrice / 100).toFixed(2) : ''}</compare_at_price>\n` +
    `    <stock>${p.stock}</stock>\n` +
    `    <description>${esc(p.description)}</description>\n` +
    `    <status>${esc(p.status)}</status>\n` +
    `    <brand>${esc(p.brandName ?? '')}</brand>\n` +
    `    <category>${esc(p.categoryNames.join(', '))}</category>\n` +
    `    <images>\n` +
    p.mediaUrls.map((u) => `      <image>${esc(u)}</image>\n`).join('') +
    `    </images>\n` +
    `  </product>\n`
  );
}

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
