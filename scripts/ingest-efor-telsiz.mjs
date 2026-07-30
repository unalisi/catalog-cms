#!/usr/bin/env node
/**
 * Ingest db/samples/efor-telsiz.json into remote D1 + R2.
 *
 * Usage: node scripts/ingest-efor-telsiz.mjs
 * Requires wrangler auth for --remote D1/R2.
 */
import { execFileSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, resolve, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const JSON_PATH = resolve(ROOT, 'db/samples/efor-telsiz.json');
const TMP_DIR = resolve(ROOT, '.tmp/efor-media');
const BUCKET = 'catalog-media';
const UA = 'CatalogCMS-Ingest/1.0';

function slugify(input) {
  return String(input)
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

function sqlStr(v) {
  if (v == null) return 'NULL';
  return `'${String(v).replace(/'/g, "''")}'`;
}

function mimeFromExt(ext) {
  switch (ext.toLowerCase()) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    default:
      return 'image/jpeg';
  }
}

function extFromUrlOrType(url, contentType) {
  if (contentType?.includes('png')) return '.png';
  if (contentType?.includes('webp')) return '.webp';
  if (contentType?.includes('gif')) return '.gif';
  if (contentType?.includes('jpeg') || contentType?.includes('jpg')) return '.jpg';
  const path = new URL(url).pathname;
  const e = extname(path).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(e)) return e === '.jpeg' ? '.jpg' : e;
  return '.jpg';
}

function wrangler(...args) {
  execFileSync('npx', ['wrangler', ...args], {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env,
  });
}

async function downloadImage(url, destBase) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Image fetch ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const ext = extFromUrlOrType(url, res.headers.get('content-type'));
  const file = `${destBase}${ext}`;
  writeFileSync(file, buf);
  return {
    file,
    mime: mimeFromExt(ext),
    size: buf.length,
    ext: ext.slice(1),
  };
}

async function main() {
  if (!existsSync(JSON_PATH)) throw new Error(`Missing ${JSON_PATH} — run scrape first`);
  const data = JSON.parse(readFileSync(JSON_PATH, 'utf8'));
  const products = data.products;
  if (!products?.length) throw new Error('No products in JSON');

  mkdirSync(TMP_DIR, { recursive: true });
  const now = new Date().toISOString();
  const yyyy = String(new Date().getUTCFullYear());
  const mm = String(new Date().getUTCMonth() + 1).padStart(2, '0');

  const brandIds = new Map();
  const catIds = new Map();
  const sql = [
    '-- Efor telsiz ingest (idempotent)',
    'PRAGMA foreign_keys = ON;',
    "DELETE FROM product_categories WHERE product_id LIKE 'efor_prod_%';",
    "DELETE FROM product_media WHERE product_id LIKE 'efor_prod_%';",
    "DELETE FROM products WHERE id LIKE 'efor_prod_%';",
    "DELETE FROM media WHERE id LIKE 'efor_med_%';",
    '',
  ];

  // Ensure parent + child categories
  const parentCat = { id: 'efor_cat_iletisim', name: 'İletişim Ürünleri', slug: 'iletisim-urunleri' };
  const childCat = { id: 'efor_cat_telsizler', name: 'Telsizler', slug: 'telsizler', parentId: parentCat.id };
  catIds.set(parentCat.name, parentCat.id);
  catIds.set(childCat.name, childCat.id);

  sql.push(
    `INSERT INTO categories (id, slug, name, parent_id, description, position, status, created_at, updated_at)
     VALUES (${sqlStr(parentCat.id)}, ${sqlStr(parentCat.slug)}, ${sqlStr(parentCat.name)}, NULL, NULL, 0, 'published', ${sqlStr(now)}, ${sqlStr(now)})
     ON CONFLICT(id) DO UPDATE SET name=excluded.name, slug=excluded.slug, status='published', updated_at=excluded.updated_at;`,
  );
  sql.push(
    `INSERT INTO categories (id, slug, name, parent_id, description, position, status, created_at, updated_at)
     VALUES (${sqlStr(childCat.id)}, ${sqlStr(childCat.slug)}, ${sqlStr(childCat.name)}, ${sqlStr(childCat.parentId)}, NULL, 0, 'published', ${sqlStr(now)}, ${sqlStr(now)})
     ON CONFLICT(id) DO UPDATE SET name=excluded.name, slug=excluded.slug, parent_id=excluded.parent_id, status='published', updated_at=excluded.updated_at;`,
  );

  for (const p of products) {
    if (!p.brand) continue;
    const slug = slugify(p.brand);
    if (brandIds.has(slug)) continue;
    const id = `efor_brand_${slug}`.slice(0, 64);
    brandIds.set(slug, id);
    sql.push(
      `INSERT INTO brands (id, slug, name, description, status, created_at, updated_at)
       VALUES (${sqlStr(id)}, ${sqlStr(slug)}, ${sqlStr(p.brand)}, NULL, 'published', ${sqlStr(now)}, ${sqlStr(now)})
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, status='published', updated_at=excluded.updated_at;`,
    );
  }

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const n = String(i + 1).padStart(2, '0');
    const productId = `efor_prod_${n}`;
    const mediaId = `efor_med_${n}`;
    let primaryMediaId = null;

    if (p.imageUrl) {
      console.log(`Downloading image ${n}: ${p.name.slice(0, 40)}…`);
      const img = await downloadImage(p.imageUrl, join(TMP_DIR, `img_${n}`));
      const objectKey = `media/${yyyy}/${mm}/efor_${n}_${randomBytes(6).toString('hex')}.${img.ext}`;
      console.log(`  → R2 ${objectKey}`);
      wrangler(
        'r2',
        'object',
        'put',
        `${BUCKET}/${objectKey}`,
        `--file=${img.file}`,
        '--remote',
        `--content-type=${img.mime}`,
      );
      const publicUrl = `/media/${objectKey}`;
      sql.push(
        `INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES (${sqlStr(mediaId)}, ${sqlStr(objectKey)}, ${sqlStr(publicUrl)}, NULL, NULL, ${sqlStr(p.name)}, ${sqlStr(img.mime)}, ${img.size}, 'import', ${sqlStr(now)});`,
      );
      primaryMediaId = mediaId;
    }

    const brandSlug = p.brand ? slugify(p.brand) : null;
    const brandId = brandSlug ? brandIds.get(brandSlug) ?? null : null;
    const desc =
      p.price === 0 && p.description
        ? `${p.description}\n\n(Fiyat için iletişime geçin — kaynak sitede fiyat belirtilmemiş.)`
        : p.description;

    sql.push(
      `INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         ${sqlStr(productId)},
         ${sqlStr(p.slug)},
         ${sqlStr(p.sku)},
         ${sqlStr(p.name)},
         ${sqlStr(desc)},
         ${Number(p.price) || 0},
         NULL,
         ${sqlStr(p.currency || 'TRY')},
         ${Number(p.stock) || 0},
         'published',
         ${sqlStr(brandId)},
         NULL,
         ${sqlStr(primaryMediaId)},
         ${sqlStr(now)},
         ${sqlStr(now)},
         ${sqlStr(now)}
       );`,
    );

    if (primaryMediaId) {
      sql.push(
        `INSERT INTO product_media (product_id, media_id, position) VALUES (${sqlStr(productId)}, ${sqlStr(primaryMediaId)}, 0);`,
      );
    }

    // Link to Telsizler (+ parent optional)
    sql.push(
      `INSERT INTO product_categories (product_id, category_id) VALUES (${sqlStr(productId)}, ${sqlStr(childCat.id)});`,
    );
    sql.push(
      `INSERT INTO product_categories (product_id, category_id) VALUES (${sqlStr(productId)}, ${sqlStr(parentCat.id)});`,
    );

    // polite pause between image uploads
    await new Promise((r) => setTimeout(r, 200));
  }

  const sqlPath = resolve(ROOT, 'db/seed-efor-telsiz.sql');
  writeFileSync(sqlPath, sql.join('\n') + '\n', 'utf8');
  console.log(`Wrote ${sqlPath}`);
  console.log('Executing remote D1…');
  wrangler('d1', 'execute', 'DB', '--remote', `--file=${sqlPath}`);
  console.log('Done. Ingested', products.length, 'products.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
