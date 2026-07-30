#!/usr/bin/env node
/**
 * Scrapes Efor Telekom "Telsizler" category via WooCommerce Store API.
 * Output: db/samples/efor-telsiz.json
 *
 * Usage: node scripts/scrape-efor-telsiz.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CATEGORY_ID = 238;
const UA = 'CatalogCMS-Scraper/1.0 (+https://catalog-cms.unalisi-dev.workers.dev)';
const API = `https://www.efortelekom.com/wp-json/wc/store/v1/products?category=${CATEGORY_ID}&per_page=100`;

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

async function main() {
  const res = await fetch(API, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const items = await res.json();
  if (!Array.isArray(items) || items.length === 0) throw new Error('No products returned');

  const products = items.map((p, i) => {
    const name = decodeEntities(p.name);
    const brand = p.brands?.[0]?.name ?? null;
    const categories = (p.categories ?? []).map((c) => c.name).filter(Boolean);
    if (!categories.includes('İletişim Ürünleri')) categories.unshift('İletişim Ürünleri');
    const price = Number(p.prices?.price ?? 0) || 0;
    const imageUrl = p.images?.[0]?.src ?? null;
    const description = htmlToText(p.description) || htmlToText(p.short_description);
    const baseSlug = slugify(name) || `efor-telsiz-${p.id}`;
    return {
      sourceId: p.id,
      sourceUrl: p.permalink,
      name,
      slug: `efor-${baseSlug}`,
      sku: `EFOR-TEL-${String(i + 1).padStart(2, '0')}`,
      price,
      currency: p.prices?.currency_code ?? 'TRY',
      stock: p.is_in_stock ? 10 : 0,
      status: 'published',
      brand,
      categories,
      imageUrl,
      description,
    };
  });

  const out = {
    scrapedAt: new Date().toISOString(),
    source: API,
    count: products.length,
    products,
  };

  const outPath = resolve(__dirname, '../db/samples/efor-telsiz.json');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
  console.log(`Wrote ${outPath} (${products.length} products)`);
  for (const p of products) {
    console.log(`- ${p.sku} ${p.name.slice(0, 48)} … ${p.price} kuruş`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
