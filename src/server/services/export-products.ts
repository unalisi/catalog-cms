import { asc, eq, inArray } from 'drizzle-orm';
import {
  brands,
  categories,
  media,
  productCategories,
  productMedia,
  products,
} from '../../../db/schema';
import { mediaPublicPath } from '../../lib/media/urls';
import { getDb } from '../db';

export type ExportFormat = 'csv' | 'woo-json';

type ExportProductRow = {
  id: string;
  slug: string;
  sku: string | null;
  name: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  status: 'draft' | 'published' | 'archived';
  brandName: string | null;
  brandSlug: string | null;
  categories: { name: string; slug: string }[];
  images: { src: string; alt: string }[];
};

function minorToMajor(minor: number): string {
  return (minor / 100).toFixed(2);
}

function statusToWoo(status: ExportProductRow['status']): string {
  if (status === 'published') return 'publish';
  if (status === 'archived') return 'trash';
  return 'private';
}

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function absolutize(pathOrUrl: string, origin: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${origin.replace(/\/$/, '')}${path}`;
}

async function loadExportProducts(origin: string): Promise<ExportProductRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      sku: products.sku,
      name: products.name,
      description: products.description,
      price: products.price,
      compareAtPrice: products.compareAtPrice,
      stock: products.stock,
      status: products.status,
      brandName: brands.name,
      brandSlug: brands.slug,
    })
    .from(products)
    .leftJoin(brands, eq(products.brandId, brands.id))
    .orderBy(asc(products.name));

  if (rows.length === 0) return [];

  const productIds = rows.map((r) => r.id);

  const catRows = await db
    .select({
      productId: productCategories.productId,
      name: categories.name,
      slug: categories.slug,
    })
    .from(productCategories)
    .innerJoin(categories, eq(productCategories.categoryId, categories.id))
    .where(inArray(productCategories.productId, productIds));

  const galleryRows = await db
    .select({
      productId: productMedia.productId,
      key: media.key,
      url: media.url,
      alt: media.alt,
      position: productMedia.position,
    })
    .from(productMedia)
    .innerJoin(media, eq(productMedia.mediaId, media.id))
    .where(inArray(productMedia.productId, productIds));

  galleryRows.sort((a, b) => a.position - b.position);

  // Fallback: primary media when gallery empty
  const primaryRows = await db
    .select({
      productId: products.id,
      key: media.key,
      url: media.url,
      alt: media.alt,
    })
    .from(products)
    .innerJoin(media, eq(products.primaryMediaId, media.id))
    .where(inArray(products.id, productIds));

  const catsByProduct = new Map<string, { name: string; slug: string }[]>();
  for (const c of catRows) {
    const list = catsByProduct.get(c.productId) ?? [];
    list.push({ name: c.name, slug: c.slug });
    catsByProduct.set(c.productId, list);
  }

  const imagesByProduct = new Map<string, { src: string; alt: string }[]>();
  for (const g of galleryRows) {
    const src = absolutize(g.url || mediaPublicPath(g.key), origin);
    const list = imagesByProduct.get(g.productId) ?? [];
    list.push({ src, alt: g.alt || '' });
    imagesByProduct.set(g.productId, list);
  }
  for (const p of primaryRows) {
    if (imagesByProduct.has(p.productId)) continue;
    imagesByProduct.set(p.productId, [
      { src: absolutize(p.url || mediaPublicPath(p.key), origin), alt: p.alt || '' },
    ]);
  }

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    sku: r.sku,
    name: r.name,
    description: r.description,
    price: r.price,
    compareAtPrice: r.compareAtPrice,
    stock: r.stock,
    status: r.status,
    brandName: r.brandName ?? null,
    brandSlug: r.brandSlug ?? null,
    categories: catsByProduct.get(r.id) ?? [],
    images: imagesByProduct.get(r.id) ?? [],
  }));
}

export function productsToCsv(rows: ExportProductRow[]): string {
  const header = [
    'name',
    'slug',
    'sku',
    'price',
    'compareAtPrice',
    'stock',
    'description',
    'brand',
    'categories',
    'image',
    'status',
  ];
  const lines = [header.join(',')];
  for (const row of rows) {
    const image = row.images.map((i) => i.src).join('|');
    const cells = [
      row.name,
      row.slug,
      row.sku ?? '',
      minorToMajor(row.price),
      row.compareAtPrice != null ? minorToMajor(row.compareAtPrice) : '',
      String(row.stock),
      row.description ?? '',
      row.brandName ?? '',
      row.categories.map((c) => c.name).join(','),
      image,
      row.status,
    ].map(escapeCsv);
    lines.push(cells.join(','));
  }
  return `${lines.join('\n')}\n`;
}

export function productsToWooJson(rows: ExportProductRow[]): unknown[] {
  return rows.map((row) => {
    const onSale = row.compareAtPrice != null && row.compareAtPrice > row.price;
    const regular = onSale ? row.compareAtPrice! : row.price;
    const sale = onSale ? row.price : null;
    return {
      name: row.name,
      slug: row.slug,
      sku: row.sku ?? '',
      description: row.description ?? '',
      short_description: '',
      regular_price: minorToMajor(regular),
      sale_price: sale != null ? minorToMajor(sale) : '',
      price: minorToMajor(row.price),
      stock_quantity: row.stock,
      manage_stock: true,
      stock_status: row.stock > 0 ? 'instock' : 'outofstock',
      status: statusToWoo(row.status),
      categories: row.categories.map((c) => ({ name: c.name, slug: c.slug })),
      brands: row.brandName
        ? [{ name: row.brandName, slug: row.brandSlug ?? undefined }]
        : [],
      images: row.images.map((img, i) => ({
        src: img.src,
        alt: img.alt,
        position: i,
      })),
      type: 'simple',
    };
  });
}

export async function exportProducts(format: ExportFormat, origin: string) {
  const rows = await loadExportProducts(origin);
  if (format === 'csv') {
    return {
      contentType: 'text/csv; charset=utf-8',
      filename: `products-export-${new Date().toISOString().slice(0, 10)}.csv`,
      body: productsToCsv(rows),
      count: rows.length,
    };
  }
  return {
    contentType: 'application/json; charset=utf-8',
    filename: `products-export-${new Date().toISOString().slice(0, 10)}.json`,
    body: JSON.stringify(productsToWooJson(rows), null, 2),
    count: rows.length,
  };
}
