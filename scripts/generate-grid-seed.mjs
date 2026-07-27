#!/usr/bin/env node
/**
 * Generates db/seed-grid.sql with ~1000 extra products for FAZ 3 virtualization acceptance.
 * Batched INSERTS to avoid SQLITE_TOOBIG.
 *
 * Usage: node scripts/generate-grid-seed.mjs
 * Then:  npm run db:seed:grid:local  (or remote)
 */
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COUNT = 1000;
const BATCH = 50;
const now = '2026-07-27T12:00:00.000Z';
const lines = [
  '-- FAZ 3 grid load seed: 1000 products (idempotent delete of previous grid seed)',
  'PRAGMA foreign_keys = ON;',
  "DELETE FROM product_categories WHERE product_id LIKE 'grid_prod_%';",
  "DELETE FROM products WHERE id LIKE 'grid_prod_%';",
  '',
];

function productValue(i) {
  const n = String(i).padStart(4, '0');
  const id = `grid_prod_${n}`;
  const slug = `grid-urun-${n}`;
  const sku = `GRID-${n}`;
  const name = `Grid Urun ${n}`;
  const price = 1000 + (i % 500) * 100;
  const stock = i % 200;
  const status = i % 17 === 0 ? 'draft' : 'published';
  const published = status === 'published' ? `'${now}'` : 'NULL';
  return `  ('${id}', '${slug}', '${sku}', '${name}', 'Sanallastirma test urunu ${n}.', ${price}, NULL, 'TRY', ${stock}, '${status}', 'brand_nord', NULL, 'med_placeholder', ${published}, '${now}', '${now}')`;
}

function catValue(i) {
  const n = String(i).padStart(4, '0');
  const cat = i % 2 === 0 ? 'cat_aksesuar' : 'cat_elektronik';
  return `  ('grid_prod_${n}', '${cat}')`;
}

for (let start = 1; start <= COUNT; start += BATCH) {
  const end = Math.min(start + BATCH - 1, COUNT);
  const values = [];
  for (let i = start; i <= end; i++) values.push(productValue(i));
  lines.push(
    'INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at) VALUES',
  );
  lines.push(values.join(',\n') + ';');
  lines.push('');
}

for (let start = 1; start <= COUNT; start += BATCH) {
  const end = Math.min(start + BATCH - 1, COUNT);
  const values = [];
  for (let i = start; i <= end; i++) values.push(catValue(i));
  lines.push('INSERT INTO product_categories (product_id, category_id) VALUES');
  lines.push(values.join(',\n') + ';');
  lines.push('');
}

const out = resolve(__dirname, '../db/seed-grid.sql');
writeFileSync(out, lines.join('\n'), 'utf8');
console.log(`Wrote ${out} (${COUNT} products, batches of ${BATCH})`);
