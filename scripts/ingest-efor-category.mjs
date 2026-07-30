#!/usr/bin/env node
/**
 * Ingest a scraped Efor category JSON into remote D1 + R2.
 *
 * Usage:
 *   node scripts/ingest-efor-category.mjs --json=db/samples/efor-ag.json --id-prefix=efor_ag
 *
 * Products with status=archived (missing description/image) stay listedışı.
 * Requires wrangler auth for --remote D1/R2.
 */
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, resolve, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const BUCKET = 'catalog-media';
const UA = 'CatalogCMS-Ingest/1.0';

function arg(name, fallback) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

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

function sleepSync(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    /* spin */
  }
}

function wrangler(...args) {
  const maxAttempts = 3;
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      execFileSync('npx', ['wrangler', ...args], {
        cwd: ROOT,
        stdio: 'inherit',
        env: process.env,
      });
      return;
    } catch (err) {
      lastErr = err;
      console.warn(`  wrangler failed (attempt ${attempt}/${maxAttempts}), retrying…`);
      sleepSync(1500 * attempt);
    }
  }
  throw lastErr;
}

async function downloadImage(url, destBase) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Image fetch ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const ext = extFromUrlOrType(url, res.headers.get('content-type'));
  const file = `${destBase}${ext}`;
  writeFileSync(file, buf);
  return { file, mime: mimeFromExt(ext), size: buf.length, ext: ext.slice(1) };
}

async function main() {
  const jsonRel = arg('json');
  const idPrefix = arg('id-prefix');
  if (!jsonRel || !idPrefix) {
    console.error(
      'Usage: node scripts/ingest-efor-category.mjs --json=db/samples/efor-ag.json --id-prefix=efor_ag',
    );
    process.exit(1);
  }

  const JSON_PATH = resolve(ROOT, jsonRel);
  const TMP_DIR = resolve(ROOT, `.tmp/${idPrefix}-media`);
  if (!existsSync(JSON_PATH)) throw new Error(`Missing ${JSON_PATH}`);

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
    `-- Efor ingest ${idPrefix} (idempotent)`,
    'PRAGMA foreign_keys = ON;',
    `DELETE FROM product_categories WHERE product_id LIKE '${idPrefix}_prod_%';`,
    `DELETE FROM product_media WHERE product_id LIKE '${idPrefix}_prod_%';`,
    `DELETE FROM products WHERE id LIKE '${idPrefix}_prod_%';`,
    `DELETE FROM media WHERE id LIKE '${idPrefix}_med_%';`,
    '',
  ];

  // Collect unique category names from products (+ primary)
  const catNames = new Set();
  for (const p of products) {
    for (const c of p.categories ?? []) catNames.add(c);
    if (p.primaryCategory) catNames.add(p.primaryCategory);
  }
  if (data.category?.name) catNames.add(data.category.name);

  for (const name of catNames) {
    const slug = slugify(name);
    const id = `efor_cat_${slug}`.slice(0, 64);
    catIds.set(name, id);
    sql.push(
      `INSERT INTO categories (id, slug, name, parent_id, description, position, status, created_at, updated_at)
       VALUES (${sqlStr(id)}, ${sqlStr(slug)}, ${sqlStr(name)}, NULL, NULL, 0, 'published', ${sqlStr(now)}, ${sqlStr(now)})
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, status='published', updated_at=excluded.updated_at;`,
    );
  }

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

  let uploaded = 0;
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const n = String(i + 1).padStart(2, '0');
    const productId = `${idPrefix}_prod_${n}`;
    const mediaId = `${idPrefix}_med_${n}`;
    let primaryMediaId = null;

    // Recompute incompleteness
    const hasDesc = Boolean(p.description && String(p.description).trim().length >= 8);
    const hasImage = Boolean(p.imageUrl);
    const status = p.status === 'archived' || !hasDesc || !hasImage ? 'archived' : 'published';

    if (p.imageUrl) {
      console.log(`[${n}/${products.length}] image ${p.name.slice(0, 40)}…`);
      try {
        const img = await downloadImage(p.imageUrl, join(TMP_DIR, `img_${n}`));
        const objectKey = `media/${yyyy}/${mm}/${idPrefix}_${n}_${randomBytes(6).toString('hex')}.${img.ext}`;
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
        uploaded += 1;
      } catch (err) {
        console.warn(`  image failed: ${err.message} → listedışı`);
      }
    }

    const finalStatus = status === 'published' && primaryMediaId && hasDesc ? 'published' : 'archived';
    const brandSlug = p.brand ? slugify(p.brand) : null;
    const brandId = brandSlug ? brandIds.get(brandSlug) ?? null : null;

    let desc = p.description ?? null;
    if (p.price === 0 && desc) {
      desc = `${desc}\n\n(Fiyat için iletişime geçin — kaynak sitede fiyat belirtilmemiş.)`;
    }
    if (finalStatus === 'archived' && !desc) {
      desc = 'Ürün açıklaması kaynak sitede eksik; listedışı olarak eklendi.';
    }

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
         ${sqlStr(finalStatus)},
         ${sqlStr(brandId)},
         NULL,
         ${sqlStr(primaryMediaId)},
         ${finalStatus === 'published' ? sqlStr(now) : 'NULL'},
         ${sqlStr(now)},
         ${sqlStr(now)}
       );`,
    );

    if (primaryMediaId) {
      sql.push(
        `INSERT INTO product_media (product_id, media_id, position) VALUES (${sqlStr(productId)}, ${sqlStr(primaryMediaId)}, 0);`,
      );
    }

    const linkCats = new Set(p.categories ?? []);
    if (p.primaryCategory) linkCats.add(p.primaryCategory);
    for (const cname of linkCats) {
      const cid = catIds.get(cname);
      if (!cid) continue;
      sql.push(
        `INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES (${sqlStr(productId)}, ${sqlStr(cid)});`,
      );
    }

    await new Promise((r) => setTimeout(r, 150));
  }

  const sqlPath = resolve(ROOT, `db/seed-${idPrefix}.sql`);
  writeFileSync(sqlPath, sql.join('\n') + '\n', 'utf8');
  console.log(`Wrote ${sqlPath} (images uploaded: ${uploaded})`);
  console.log('Executing remote D1…');
  wrangler('d1', 'execute', 'DB', '--remote', `--file=${sqlPath}`);
  console.log(`Done. Ingested ${products.length} products (${idPrefix}).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
