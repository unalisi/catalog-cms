#!/usr/bin/env node
/**
 * MVP Lighthouse sweep — home, catalog, product detail, blog.
 * Usage:
 *   npm run lighthouse:mvp
 *   BASE_URL=https://example.workers.dev npm run lighthouse:mvp
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = (process.env.BASE_URL ?? 'https://catalog-cms.unalisi-dev.workers.dev').replace(
  /\/$/,
  '',
);

const OUT_DIR = join(process.cwd(), '.lighthouse');
mkdirSync(OUT_DIR, { recursive: true });

function fetchText(url) {
  const res = spawnSync('curl', ['-fsSL', url], { encoding: 'utf8' });
  if (res.status !== 0) return '';
  return res.stdout ?? '';
}

function firstHref(html, pattern) {
  const match = html.match(pattern);
  return match?.[1] ?? null;
}

const catalogHtml = fetchText(`${BASE}/catalog`);
const blogHtml = fetchText(`${BASE}/blog`);
const productPath = firstHref(catalogHtml, /href="(\/product\/[^"]+)"/) ?? '/catalog';
const blogPath = firstHref(blogHtml, /href="(\/blog\/[^"]+)"/) ?? '/blog';

const targets = [
  { id: 'home', url: `${BASE}/` },
  { id: 'catalog', url: `${BASE}/catalog` },
  { id: 'product', url: `${BASE}${productPath}` },
  { id: 'blog', url: `${BASE}${blogPath}` },
];

const categories = ['performance', 'accessibility', 'best-practices', 'seo'];
const summary = [];

console.log(`Lighthouse MVP vs ${BASE}\n`);

for (const target of targets) {
  const outJson = join(OUT_DIR, `${target.id}.json`);
  console.log(`→ ${target.id}: ${target.url}`);
  const run = spawnSync(
    'npx',
    [
      '--yes',
      'lighthouse',
      target.url,
      '--only-categories=performance,accessibility,best-practices,seo',
      '--preset=desktop',
      '--quiet',
      // robots.txt is valid static; Lighthouse occasionally times out fetching it on Workers.
      '--skip-audits=robots-txt',
      '--chrome-flags=--headless --no-sandbox',
      '--output=json',
      `--output-path=${outJson}`,
    ],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: process.env },
  );

  if (run.status !== 0) {
    console.error(run.stderr || run.stdout || `lighthouse failed for ${target.id}`);
    summary.push({ id: target.id, url: target.url, error: true, scores: {} });
    continue;
  }

  let report;
  try {
    report = JSON.parse(readFileSync(outJson, 'utf8'));
  } catch (err) {
    console.error(`Failed to parse ${outJson}:`, err);
    summary.push({ id: target.id, url: target.url, error: true, scores: {} });
    continue;
  }

  /** @type {Record<string, number | null>} */
  const scores = {};
  for (const cat of categories) {
    const value = report?.categories?.[cat]?.score;
    scores[cat] = typeof value === 'number' ? Math.round(value * 100) : null;
  }
  summary.push({ id: target.id, url: target.url, error: false, scores });
  console.log(
    `  Perf ${scores.performance} · A11y ${scores.accessibility} · BP ${scores['best-practices']} · SEO ${scores.seo}`,
  );
}

const mdLines = [
  '# Lighthouse MVP results',
  '',
  `Base: ${BASE}`,
  `Date: ${new Date().toISOString()}`,
  '',
  '| Page | Perf | A11y | Best Practices | SEO |',
  '|------|------|------|----------------|-----|',
];

for (const row of summary) {
  if (row.error) {
    mdLines.push(`| ${row.id} | ERR | ERR | ERR | ERR |`);
    continue;
  }
  const s = row.scores;
  mdLines.push(
    `| ${row.id} | ${s.performance ?? '—'} | ${s.accessibility ?? '—'} | ${s['best-practices'] ?? '—'} | ${s.seo ?? '—'} |`,
  );
}

mdLines.push('', 'Raw JSON under `.lighthouse/*.json`.', '');
writeFileSync(join(OUT_DIR, 'SUMMARY.md'), mdLines.join('\n'));
writeFileSync(join(OUT_DIR, 'summary.json'), JSON.stringify({ base: BASE, summary }, null, 2));

console.log(`\nWrote ${join(OUT_DIR, 'SUMMARY.md')}`);

const failed = summary.some(
  (row) =>
    row.error ||
    categories.some((c) => {
      const n = row.scores[c];
      return typeof n !== 'number' || n < 90;
    }),
);

process.exit(failed ? 1 : 0);
