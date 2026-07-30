#!/usr/bin/env node
/**
 * Scrapes an Efor Telekom product category via WooCommerce Store API.
 *
 * Usage:
 *   node scripts/scrape-efor-category.mjs --slug=ag-urunleri --prefix=efor-ag
 *   node scripts/scrape-efor-category.mjs --slug=barkod-okuyucular --prefix=efor-barkod
 *
 * Output: db/samples/{prefix}.json
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UA = 'CatalogCMS-Scraper/1.0 (+https://catalog-cms.unalisi-dev.workers.dev)';
const BASE = 'https://www.efortelekom.com';

function arg(name, fallback) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

function decodeEntities(s) {
  return String(s ?? '')
    .replace(/&#8217;/g, "'")
    .replace(/&#8211;/g, '–')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function htmlToText(html) {
  if (!html) return '';
  return decodeEntities(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/\u200b/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function slugify(input) {
  return input
    .toLocaleLowerCase('tr-TR')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function resolveCategoryId(slug) {
  const res = await fetch(
    `${BASE}/wp-json/wp/v2/product_cat?slug=${encodeURIComponent(slug)}&per_page=5`,
    { headers: { 'User-Agent': UA, Accept: 'application/json' } },
  );
  if (!res.ok) throw new Error(`Category lookup ${res.status}`);
  const rows = await res.json();
  if (!rows?.[0]?.id) throw new Error(`Category not found: ${slug}`);
  return { id: rows[0].id, name: rows[0].name, slug: rows[0].slug, count: rows[0].count };
}

async function fetchAllProducts(categoryId) {
  const all = [];
  let page = 1;
  for (;;) {
    const url = `${BASE}/wp-json/wc/store/v1/products?category=${categoryId}&per_page=100&page=${page}`;
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
    if (!res.ok) throw new Error(`Products API ${res.status} page ${page}`);
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < 100) break;
    page += 1;
  }
  return all;
}

async function main() {
  const catSlug = arg('slug');
  const prefix = arg('prefix');
  if (!catSlug || !prefix) {
    console.error('Usage: node scripts/scrape-efor-category.mjs --slug=ag-urunleri --prefix=efor-ag');
    process.exit(1);
  }

  const cat = await resolveCategoryId(catSlug);
  console.log(`Category ${cat.name} (#${cat.id}) — WP count ${cat.count}`);
  const items = await fetchAllProducts(cat.id);
  console.log(`Fetched ${items.length} products`);

  const skuTag = prefix.replace(/^efor-/, '').toUpperCase().replace(/-/g, '').slice(0, 8) || 'CAT';

  const products = items.map((p, i) => {
    const name = decodeEntities(p.name);
    const brand = p.brands?.[0]?.name ?? null;
    const categories = (p.categories ?? []).map((c) => c.name).filter(Boolean);
    if (!categories.includes(cat.name)) categories.unshift(cat.name);
    const price = Number(p.prices?.price ?? 0) || 0;
    const imageUrl = p.images?.[0]?.src ?? null;
    const description = htmlToText(p.description) || htmlToText(p.short_description);
    const hasDesc = Boolean(description && description.length >= 8);
    const hasImage = Boolean(imageUrl);
    const status = hasDesc && hasImage ? 'published' : 'archived';
    const baseSlug = slugify(name) || 'urun';
    return {
      sourceId: p.id,
      sourceUrl: p.permalink,
      name,
      slug: `${prefix}-${p.id}-${baseSlug}`.slice(0, 80),
      sku: `EFOR-${skuTag}-${String(i + 1).padStart(2, '0')}`,
      price,
      currency: p.prices?.currency_code ?? 'TRY',
      stock: p.is_in_stock ? 10 : 0,
      status,
      brand,
      categories,
      primaryCategory: cat.name,
      imageUrl,
      description,
      incompleteReason: !hasDesc && !hasImage
        ? 'missing_description_and_image'
        : !hasDesc
          ? 'missing_description'
          : !hasImage
            ? 'missing_image'
            : null,
    };
  });

  const out = {
    scrapedAt: new Date().toISOString(),
    category: cat,
    prefix,
    count: products.length,
    published: products.filter((p) => p.status === 'published').length,
    archived: products.filter((p) => p.status === 'archived').length,
    products,
  };

  const outPath = resolve(__dirname, `../db/samples/${prefix}.json`);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
  console.log(`Wrote ${outPath}`);
  console.log(`published=${out.published} archived(listedışı)=${out.archived}`);
  for (const p of products) {
    const flag = p.status === 'archived' ? ` [LISTEDIŞI:${p.incompleteReason}]` : '';
    console.log(`- ${p.sku} ${p.name.slice(0, 48)} … ${p.price}₺${flag}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
