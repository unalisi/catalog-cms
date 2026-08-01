import type { ProductExportRecord } from '../query';

/**
 * WooCommerce REST API compatible product JSON (simple products subset).
 */
export function toWooCommerceProduct(p: ProductExportRecord) {
  const onSale = p.compareAtPrice != null && p.compareAtPrice > p.price;
  const regular = onSale ? p.compareAtPrice! : p.price;
  const sale = onSale ? p.price : null;

  return {
    sku: p.sku ?? undefined,
    name: p.name,
    slug: p.slug,
    type: 'simple',
    status: p.status === 'published' ? 'publish' : p.status === 'archived' ? 'trash' : 'draft',
    regular_price: (regular / 100).toFixed(2),
    sale_price: sale != null ? (sale / 100).toFixed(2) : undefined,
    description: p.description,
    manage_stock: true,
    stock_quantity: p.stock,
    categories: p.categoryNames.map((name) => ({ name })),
    images: p.mediaUrls.map((src, position) => ({
      src,
      position,
      alt: '',
    })),
    meta_data: p.brandName ? [{ key: 'brand', value: p.brandName }] : [],
    brands: p.brandName ? [{ name: p.brandName }] : [],
  };
}

export function jsonArrayOpen(): string {
  return '[\n';
}

export function jsonArrayItem(p: ProductExportRecord, isFirst: boolean): string {
  const json = JSON.stringify(toWooCommerceProduct(p), null, 2);
  return (isFirst ? '' : ',\n') + json;
}

export function jsonArrayClose(): string {
  return '\n]\n';
}
