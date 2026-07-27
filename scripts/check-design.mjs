#!/usr/bin/env node
/**
 * DESIGN.md lint: fail on dark mode classes and hardcoded color utilities.
 * Scans src/ for forbidden patterns (excludes comments in DESIGN.md itself).
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scanRoot = path.join(root, 'src');

const FORBIDDEN = [
  { name: 'dark: variant', re: /\bdark:/ },
  { name: 'prefers-color-scheme', re: /prefers-color-scheme/ },
  { name: 'text-white', re: /\btext-white\b/ },
  { name: 'bg-black', re: /\bbg-black\b/ },
  { name: 'text-black', re: /\btext-black\b/ },
  { name: 'bg-white', re: /\bbg-white\b/ },
  { name: 'hex utility bg-[#...]', re: /\bbg-\[#[0-9a-fA-F]{3,8}\]/ },
  { name: 'hex utility text-[#...]', re: /\btext-\[#[0-9a-fA-F]{3,8}\]/ },
  { name: 'raw #fff / #ffffff', re: /#fff(?:fff)?\b/i },
];

const EXT = new Set(['.ts', '.tsx', '.astro', '.css', '.js', '.jsx', '.mjs']);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      files.push(...(await walk(full)));
    } else if (EXT.has(path.extname(entry.name))) {
      files.push(full);
    }
  }
  return files;
}

const files = await walk(scanRoot);
const violations = [];

for (const file of files) {
  const text = await readFile(file, 'utf8');
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Allow documenting forbidden tokens in comments that quote DESIGN rules
    if (line.includes('DESIGN.md') && line.includes('yasak')) continue;
    for (const rule of FORBIDDEN) {
      if (rule.re.test(line)) {
        violations.push({
          file: path.relative(root, file),
          line: i + 1,
          rule: rule.name,
          snippet: line.trim().slice(0, 120),
        });
      }
    }
  }
}

if (violations.length) {
  console.error('Design lint failed:\n');
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  [${v.rule}]  ${v.snippet}`);
  }
  console.error(`\n${violations.length} violation(s). See DESIGN.md §1.`);
  process.exit(1);
}

console.log(`Design lint OK (${files.length} files scanned).`);
