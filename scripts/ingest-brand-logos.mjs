#!/usr/bin/env node
/**
 * Fetch brand logos from official brand websites, upload to R2, emit D1 SQL.
 *
 * Usage:
 *   node scripts/ingest-brand-logos.mjs
 *   node scripts/ingest-brand-logos.mjs --force          # replace existing logo_media_id
 *   node scripts/ingest-brand-logos.mjs --dry-run        # extract + download only, no R2/SQL apply
 *   node scripts/ingest-brand-logos.mjs --slug=siemens   # single brand
 *
 * Then:
 *   npx wrangler d1 execute DB --remote --file=./db/seed-brand-logos.sql
 */
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, resolve, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SITES_PATH = resolve(ROOT, 'scripts/data/brand-logo-sites.json');
const TMP_DIR = resolve(ROOT, '.tmp/brand-logos');
const SQL_PATH = resolve(ROOT, 'db/seed-brand-logos.sql');
const FAILURES_PATH = join(TMP_DIR, 'failures.json');
const REPORT_PATH = join(TMP_DIR, 'report.json');
const BUCKET = 'catalog-media';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const FETCH_TIMEOUT_MS = 25_000;
const THROTTLE_MS = 800;
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const DRY_RUN = args.includes('--dry-run');
const ONLY_SLUG = args.find((a) => a.startsWith('--slug='))?.slice('--slug='.length) ?? null;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function sqlStr(v) {
  if (v == null) return 'NULL';
  return `'${String(v).replace(/'/g, "''")}'`;
}

function wranglerJson(...args) {
  const out = execFileSync('npx', ['wrangler', ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    env: process.env,
    maxBuffer: 20 * 1024 * 1024,
  });
  // wrangler may print non-JSON before JSON
  const start = out.indexOf('{');
  const arrStart = out.indexOf('[');
  let jsonStart = -1;
  if (start >= 0 && arrStart >= 0) jsonStart = Math.min(start, arrStart);
  else jsonStart = Math.max(start, arrStart);
  if (jsonStart < 0) throw new Error(`No JSON in wrangler output: ${out.slice(0, 200)}`);
  return JSON.parse(out.slice(jsonStart));
}

function wrangler(...args) {
  execFileSync('npx', ['wrangler', ...args], {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env,
  });
}

async function fetchText(url, redirects = 0) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,tr;q=0.8',
      },
      redirect: 'follow',
      signal: ctrl.signal,
    });
    if (res.status === 429 || res.status >= 500) {
      if (redirects < 3) {
        await sleep(1500 * (redirects + 1));
        return fetchText(url, redirects + 1);
      }
    }
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    const html = await res.text();
    return { html, finalUrl: res.url || url };
  } finally {
    clearTimeout(t);
  }
}

function decodeEntities(s) {
  return String(s)
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\\u0026/g, '&')
    .replace(/\\\//g, '/');
}

function absUrl(base, href) {
  if (!href) return null;
  let h = decodeEntities(href).trim().replace(/^['"]|['"]$/g, '');
  if (!h || h.startsWith('data:') || h.startsWith('blob:')) return null;
  if (/\{\{|\}\}|%7B%7B/i.test(h)) return null;
  // AEM / dynamic width placeholders
  h = h.replace(/\{\.[^}]+\}/g, '');
  try {
    return new URL(h, base).href;
  } catch {
    return null;
  }
}

function isAllowedLogoHost(logoUrl, baseUrl) {
  try {
    const host = new URL(logoUrl).hostname.replace(/^www\./, '');
    const baseHost = new URL(baseUrl).hostname.replace(/^www\./, '');
    if (host === baseHost || host.endsWith(`.${baseHost}`)) return true;
    // Brand CDN / static hosts commonly used on official sites
    if (
      /cdn|cloudfront|cloudinary|imgix|akamai|fastly|scene7|assets|static|media|images|dam|shopify|azurefd|webcdn/i.test(
        host,
      )
    ) {
      return true;
    }
    // Sibling brand domains (e.g. images.sw.cdn.siemens.com)
    const baseRoot = baseHost.split('.').slice(-2).join('.');
    if (baseRoot.length > 4 && host.endsWith(baseRoot)) return true;
    return false;
  } catch {
    return false;
  }
}

function scoreLogoCandidate(url, attrs = {}) {
  const u = url.toLowerCase();
  let score = 0;
  if (attrs.fromJsonLd) score += 100;
  if (attrs.inHeader) score += 40;
  if (/logo/i.test(attrs.alt || '')) score += 30;
  if (/logo/i.test(attrs.className || '')) score += 25;
  if (/logo/i.test(u)) score += 20;
  if (/\.svg(\?|$)/i.test(u)) score += 15;
  if (/\.png(\?|$)/i.test(u)) score += 10;
  if (/\.webp(\?|$)/i.test(u)) score += 8;
  if (/favicon|sprite|pixel|1x1|tracking|analytics|badge|icon-?set/i.test(u)) score -= 80;
  if (/\/favicon\.ico/i.test(u)) score -= 100;
  if (attrs.width != null && attrs.width < 32) score -= 50;
  if (attrs.height != null && attrs.height < 32) score -= 50;
  return score;
}

function extractFromJsonLd(html, baseUrl) {
  const out = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    try {
      const raw = m[1].trim();
      if (!raw) continue;
      const data = JSON.parse(raw);
      const nodes = Array.isArray(data) ? data : [data];
      const walk = (node) => {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node)) {
          node.forEach(walk);
          return;
        }
        const type = node['@type'];
        const types = Array.isArray(type) ? type : type ? [type] : [];
        const isOrg = types.some((t) => /Organization|Brand|Corporation|Store/i.test(String(t)));
        if (isOrg && node.logo) {
          const logo = node.logo;
          const url = typeof logo === 'string' ? logo : logo?.url || logo?.contentUrl || null;
          const abs = absUrl(baseUrl, decodeEntities(url || ''));
          if (abs) out.push({ url: abs, fromJsonLd: true, alt: 'logo' });
        }
        if (node.publisher?.logo) {
          const logo = node.publisher.logo;
          const url = typeof logo === 'string' ? logo : logo?.url || null;
          const abs = absUrl(baseUrl, decodeEntities(url || ''));
          if (abs) out.push({ url: abs, fromJsonLd: true, alt: 'logo' });
        }
        if (node['@graph']) walk(node['@graph']);
        for (const v of Object.values(node)) {
          if (v && typeof v === 'object') walk(v);
        }
      };
      nodes.forEach(walk);
    } catch {
      /* ignore bad json-ld */
    }
  }
  return out;
}

function extractImgTags(html, baseUrl) {
  const out = [];
  // Rough header slice for priority
  const headerMatch = html.match(/<header[\s\S]{0,80000}?<\/header>/i);
  const headerHtml = headerMatch ? headerMatch[0] : '';
  const navMatch = html.match(/<nav[\s\S]{0,40000}?<\/nav>/i);
  const priorityHtml = headerHtml + (navMatch ? navMatch[0] : '');

  const imgRe =
    /<img\b([^>]*?)>/gi;
  const attr = (tag, name) => {
    const m =
      tag.match(new RegExp(`${name}\\s*=\\s*"([^"]*)"`, 'i')) ||
      tag.match(new RegExp(`${name}\\s*=\\s*'([^']*)'`, 'i')) ||
      tag.match(new RegExp(`${name}\\s*=\\s*([^\\s>]+)`, 'i'));
    return m ? m[1] : '';
  };

  const consider = (tag, inHeader) => {
    const src =
      attr(tag, 'src') ||
      attr(tag, 'data-src') ||
      attr(tag, 'data-lazy-src') ||
      attr(tag, 'data-original');
    const srcset = attr(tag, 'srcset') || attr(tag, 'data-srcset');
    const candidates = [];
    if (src) candidates.push(src);
    if (srcset) {
      const first = srcset.split(',')[0]?.trim().split(/\s+/)[0];
      if (first) candidates.push(first);
    }
    const alt = attr(tag, 'alt');
    const className = attr(tag, 'class');
    const width = parseInt(attr(tag, 'width'), 10) || null;
    const height = parseInt(attr(tag, 'height'), 10) || null;
    const looksLogo =
      /logo/i.test(alt) ||
      /logo/i.test(className) ||
      /logo/i.test(src) ||
      inHeader;
    if (!looksLogo && !inHeader) return;
    for (const c of candidates) {
      const url = absUrl(baseUrl, c);
      if (!url) continue;
      out.push({ url, alt, className, width, height, inHeader });
    }
  };

  let m;
  while ((m = imgRe.exec(priorityHtml))) consider(m[1], true);
  // logo-ish imgs in full page
  const logoImgRe =
    /<img\b([^>]*(?:logo|brand)[^>]*)>/gi;
  while ((m = logoImgRe.exec(html))) consider(m[1], false);

  // <a class*="logo"> with nested img already covered; also SVG use / object
  const svgLogoRe =
    /<(?:img|source|object|embed)\b([^>]*(?:class|id)\s*=\s*["'][^"']*logo[^"']*["'][^>]*)>/gi;
  while ((m = svgLogoRe.exec(html))) {
    const src = attr(m[1], 'src') || attr(m[1], 'data') || attr(m[1], 'href');
    const url = absUrl(baseUrl, src);
    if (url) out.push({ url, className: attr(m[1], 'class'), inHeader: false, alt: 'logo' });
  }

  // CSS background-image on logo classes (limited)
  const bgRe =
    /\.[a-z0-9_-]*logo[a-z0-9_-]*\s*\{[^}]*background(?:-image)?\s*:\s*url\(([^)]+)\)/gi;
  while ((m = bgRe.exec(html))) {
    const url = absUrl(baseUrl, m[1].replace(/['"]/g, ''));
    if (url) out.push({ url, className: 'css-logo', inHeader: false, alt: 'logo' });
  }

  // og:image / twitter as weak fallback only if logo-ish
  const metaLogo =
    html.match(/<meta[^>]+property=["']og:logo["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:logo["']/i);
  if (metaLogo) {
    const url = absUrl(baseUrl, metaLogo[1]);
    if (url) out.push({ url, fromJsonLd: false, alt: 'logo', inHeader: true });
  }

  return out;
}

function extractLogoPathAttrs(html, baseUrl) {
  const out = [];
  const re =
    /(?:src|href|content|data-src|data-lazy-src|data-original|poster)\s*=\s*["']([^"']*logo[^"']*)["']/gi;
  let m;
  while ((m = re.exec(html))) {
    const raw = m[1];
    if (/logout|logon|catalogue|catalog|blog|login|css$/i.test(raw)) continue;
    if (!/\.(svg|png|webp|jpe?g|gif)(\?|$)/i.test(raw) && !/logo/i.test(raw)) continue;
    // Prefer image-like paths
    if (!/\.(svg|png|webp|jpe?g|gif)(\?|$)/i.test(raw) && !/\/logo/i.test(raw)) continue;
    const url = absUrl(baseUrl, raw);
    if (url) out.push({ url, alt: 'logo', className: 'attr-logo', inHeader: false });
  }
  return out;
}

function extractAppleTouchIcon(html, baseUrl) {
  const out = [];
  const re = /<link[^>]+>/gi;
  let m;
  while ((m = re.exec(html))) {
    const tag = m[0];
    const rel = tag.match(/rel\s*=\s*["']([^"']+)["']/i)?.[1] || '';
    const href =
      tag.match(/href\s*=\s*"([^"]+)"/i)?.[1] ||
      tag.match(/href\s*=\s*'([^']+)'/i)?.[1];
    const type = tag.match(/type\s*=\s*["']([^"']+)["']/i)?.[1] || '';
    const sizes = tag.match(/sizes\s*=\s*"([^"]+)"/i)?.[1] || '';
    const url = absUrl(baseUrl, href);
    if (!url) continue;

    if (/apple-touch-icon/i.test(rel)) {
      const dim = parseInt(sizes, 10) || 180;
      out.push({
        url,
        alt: 'apple-touch-icon',
        className: 'apple-touch-icon',
        width: dim,
        height: dim,
        inHeader: true,
        appleTouch: true,
      });
      continue;
    }

    // SVG site icon often IS the logo mark (reject .ico)
    if (/icon/i.test(rel) && (/svg/i.test(type) || /\.svg(\?|$)/i.test(url)) && !/\.ico(\?|$)/i.test(url)) {
      out.push({
        url,
        alt: 'site-icon',
        className: 'svg-icon',
        inHeader: true,
        appleTouch: true,
      });
    }
  }
  return out;
}

function extractInlineSvgLogo(html) {
  const out = [];
  const re =
    /<svg\b([^>]*(?:logo|brand)[^>]*)>([\s\S]*?)<\/svg>/gi;
  let m;
  while ((m = re.exec(html))) {
    const full = m[0];
    if (full.length < 80 || full.length > 200_000) continue;
    // Return as data URL handled separately — stash raw svg
    out.push({
      url: null,
      inlineSvg: full.includes('xmlns')
        ? full
        : full.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"'),
      alt: 'logo',
      className: 'inline-svg',
      fromJsonLd: false,
      inHeader: true,
      scoreBoost: 50,
    });
  }
  return out;
}

function pickBestLogo(html, baseUrl) {
  const candidates = [
    ...extractFromJsonLd(html, baseUrl),
    ...extractImgTags(html, baseUrl),
    ...extractLogoPathAttrs(html, baseUrl),
    ...extractAppleTouchIcon(html, baseUrl),
    ...extractInlineSvgLogo(html),
  ];
  const scored = [];
  const seen = new Set();
  for (const c of candidates) {
    const key = c.inlineSvg ? `svg:${c.inlineSvg.slice(0, 80)}` : c.url;
    if (!key || seen.has(key)) continue;
    if (c.url && !c.inlineSvg && !isAllowedLogoHost(c.url, baseUrl) && !c.fromJsonLd) continue;
    seen.add(key);
    let score = scoreLogoCandidate(c.url || 'inline.svg', c);
    if (c.appleTouch) score = Math.max(score, 12); // last-resort but valid brand mark
    if (c.scoreBoost) score += c.scoreBoost;
    // Prefer remote Organization.logo / img assets over decorative inline SVG marks
    if (c.inlineSvg) score += 5;
    scored.push({ ...c, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.find((s) => s.score > 0) || scored[0] || null;
}

function normalizeMime(ct, ext) {
  const raw = (ct || '').split(';')[0].trim().toLowerCase();
  if (ALLOWED_MIME.has(raw)) return raw === 'image/jpg' ? 'image/jpeg' : raw;
  switch ((ext || '').toLowerCase().replace(/^\./, '')) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'svg':
      return 'image/svg+xml';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    default:
      return raw || null;
  }
}

function extFromMimeOrUrl(mime, url) {
  if (mime === 'image/svg+xml') return 'svg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg';
  try {
    const e = extname(new URL(url).pathname).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(e)) {
      return e === '.jpeg' ? 'jpg' : e.slice(1);
    }
  } catch {
    /* ignore */
  }
  return 'png';
}

async function downloadLogo(url, destBase, redirects = 0) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        Referer: new URL(url).origin + '/',
      },
      redirect: 'follow',
      signal: ctrl.signal,
    });
    if ((res.status === 429 || res.status >= 500) && redirects < 3) {
      await sleep(1500 * (redirects + 1));
      return downloadLogo(url, destBase, redirects + 1);
    }
    if (!res.ok) throw new Error(`Image HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_BYTES) throw new Error(`Image too large: ${buf.length}`);
    if (buf.length < 80) throw new Error(`Image too small: ${buf.length}`);
    const ct = res.headers.get('content-type') || '';
    let mime = normalizeMime(ct, extname(new URL(url).pathname));
    // sniff svg
    const head = buf.slice(0, 200).toString('utf8');
    if (/^\s*<\?xml|^\s*<svg/i.test(head)) mime = 'image/svg+xml';
    if (!mime || !ALLOWED_MIME.has(mime === 'image/jpg' ? 'image/jpeg' : mime)) {
      throw new Error(`Disallowed MIME: ${mime || ct}`);
    }
    if (mime === 'image/jpg') mime = 'image/jpeg';
    const ext = extFromMimeOrUrl(mime, url);
    const file = `${destBase}.${ext}`;
    writeFileSync(file, buf);
    return { file, mime, size: buf.length, ext };
  } finally {
    clearTimeout(t);
  }
}

function loadExistingLogos() {
  const sql = `SELECT slug, name, logo_media_id FROM brands;`;
  const raw = wranglerJson('d1', 'execute', 'DB', '--remote', '--json', `--command=${sql}`);
  // wrangler --json returns array of result objects
  const results = Array.isArray(raw) ? raw : [raw];
  const rows = results[0]?.results || results[0]?.result?.[0]?.results || [];
  const map = new Map();
  for (const r of rows) map.set(r.slug, r);
  return map;
}

async function main() {
  if (!existsSync(SITES_PATH)) throw new Error(`Missing ${SITES_PATH}`);
  mkdirSync(TMP_DIR, { recursive: true });

  let sites = JSON.parse(readFileSync(SITES_PATH, 'utf8'));
  if (ONLY_SLUG) sites = sites.filter((s) => s.slug === ONLY_SLUG);
  if (!sites.length) throw new Error('No brands to process');

  console.log('Loading existing brand logos from remote D1…');
  const existing = loadExistingLogos();

  const now = new Date().toISOString();
  const yyyy = String(new Date().getUTCFullYear());
  const mm = String(new Date().getUTCMonth() + 1).padStart(2, '0');

  const sql = [
    '-- Brand logos from official sites',
    'PRAGMA foreign_keys = ON;',
    '',
  ];

  const report = { ok: [], skip: [], fail: [] };
  const failures = [];

  for (let i = 0; i < sites.length; i++) {
    const entry = sites[i];
    const { slug } = entry;
    const brand = existing.get(slug);
    console.log(`\n[${i + 1}/${sites.length}] ${slug}`);

    if (!brand) {
      const msg = 'Brand slug not found in remote D1';
      console.log(`  FAIL: ${msg}`);
      report.fail.push({ slug, reason: msg });
      failures.push({ slug, reason: msg });
      continue;
    }

    if (entry.skip || !entry.homepage) {
      const reason = entry.skipReason || 'No homepage / skip flag';
      console.log(`  SKIP: ${reason}`);
      report.skip.push({ slug, reason });
      failures.push({ slug, reason, skipped: true });
      continue;
    }

    if (brand.logo_media_id && !FORCE) {
      console.log(`  SKIP: already has logo_media_id=${brand.logo_media_id}`);
      report.skip.push({ slug, reason: `existing ${brand.logo_media_id}` });
      continue;
    }

    try {
      let logoUrl = entry.logoUrl || null;
      let inlineSvg = null;
      if (!logoUrl) {
        console.log(`  Fetch homepage ${entry.homepage}`);
        const { html, finalUrl } = await fetchText(entry.homepage);
        const best = pickBestLogo(html, finalUrl);
        if (!best?.url && !best?.inlineSvg) {
          throw new Error('No logo candidate found on homepage');
        }
        if (best.inlineSvg) {
          inlineSvg = best.inlineSvg;
          console.log(`  Candidate (score ${best.score}): inline SVG (${inlineSvg.length} chars)`);
        } else {
          logoUrl = best.url;
          console.log(`  Candidate (score ${best.score}): ${logoUrl}`);
        }
      } else {
        console.log(`  Override logoUrl: ${logoUrl}`);
      }

      await sleep(THROTTLE_MS);

      const destBase = join(TMP_DIR, `brand_${slug}`);
      let img;
      if (inlineSvg) {
        const file = `${destBase}.svg`;
        writeFileSync(file, inlineSvg, 'utf8');
        img = { file, mime: 'image/svg+xml', size: Buffer.byteLength(inlineSvg), ext: 'svg' };
      } else {
        img = await downloadLogo(logoUrl, destBase);
      }
      console.log(`  Downloaded ${img.mime} ${img.size}B → ${img.file}`);

      const hex = randomBytes(6).toString('hex');
      const objectKey = `media/${yyyy}/${mm}/brand_${slug}_${hex}.${img.ext}`;
      const mediaId = `med_brand_${slug}_${hex}`.slice(0, 64);
      const publicUrl = `/media/${objectKey}`;

      if (!DRY_RUN) {
        console.log(`  R2 put ${objectKey}`);
        wrangler(
          'r2',
          'object',
          'put',
          `${BUCKET}/${objectKey}`,
          `--file=${img.file}`,
          '--remote',
          `--content-type=${img.mime}`,
        );
      } else {
        console.log(`  DRY-RUN skip R2 put ${objectKey}`);
      }

      sql.push(
        `INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES (${sqlStr(mediaId)}, ${sqlStr(objectKey)}, ${sqlStr(publicUrl)}, NULL, NULL, ${sqlStr(brand.name || slug)}, ${sqlStr(img.mime)}, ${img.size}, 'import', ${sqlStr(now)})
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;`,
      );
      sql.push(
        `UPDATE brands SET logo_media_id=${sqlStr(mediaId)}, updated_at=${sqlStr(now)} WHERE slug=${sqlStr(slug)};`,
      );
      sql.push('');

      report.ok.push({ slug, mediaId, objectKey, logoUrl, mime: img.mime });
      console.log(`  OK → ${mediaId}`);
    } catch (err) {
      const reason = err?.message || String(err);
      console.log(`  FAIL: ${reason}`);
      report.fail.push({ slug, reason, homepage: entry.homepage });
      failures.push({ slug, reason, homepage: entry.homepage, logoUrl: entry.logoUrl });
    }

    await sleep(THROTTLE_MS);
  }

  writeFileSync(SQL_PATH, sql.join('\n') + '\n', 'utf8');
  writeFileSync(FAILURES_PATH, JSON.stringify(failures, null, 2), 'utf8');
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');

  console.log('\n=== Summary ===');
  console.log(`ok=${report.ok.length} skip=${report.skip.length} fail=${report.fail.length}`);
  console.log(`SQL → ${SQL_PATH}`);
  console.log(`Failures → ${FAILURES_PATH}`);
  if (!DRY_RUN && report.ok.length) {
    console.log(`\nApply with:\n  npx wrangler d1 execute DB --remote --file=./db/seed-brand-logos.sql`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
