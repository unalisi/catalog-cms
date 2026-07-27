#!/usr/bin/env node
/**
 * Smoke-test D1 backup usability (local only — never production).
 *
 * 1) Export local DB
 * 2) Validate SQL payload
 * 3) Import into a throwaway SQLite file (not the live local D1)
 *
 * Usage: npm run db:restore:test
 */
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'backups');
await mkdir(dir, { recursive: true });

function run(label, command, args) {
  console.log(`\n[${label}] ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    console.error(`Failed: ${label}`);
    process.exit(result.status ?? 1);
  }
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const out = path.join(dir, `restore-test-${stamp}.sql`);
const scratchDb = path.join(dir, `restore-scratch-${stamp}.sqlite`);

run('export-local', 'npx', [
  'wrangler',
  'd1',
  'export',
  'DB',
  '--local',
  `--output=${out}`,
]);

const sql = await readFile(out, 'utf8');
const required = ['CREATE TABLE', 'products', 'users', 'd1_migrations'];
for (const marker of required) {
  if (!sql.includes(marker)) {
    console.error(`Export missing expected marker: ${marker}`);
    process.exit(1);
  }
}
console.log(`\nExport validated (${(sql.length / 1024).toFixed(1)} KiB).`);

const sqlite = spawnSync('sqlite3', ['-version'], { encoding: 'utf8' });
if (sqlite.status !== 0) {
  console.warn('sqlite3 not found — skipping throwaway import (export OK).');
  console.log(`File: ${path.relative(root, out)}`);
  process.exit(0);
}

try {
  await unlink(scratchDb);
} catch {
  // ignore
}

run('import-scratch', 'sqlite3', [scratchDb, `.read ${out}`]);

const tables = spawnSync('sqlite3', [scratchDb, '.tables'], {
  encoding: 'utf8',
});
if (tables.status !== 0 || !tables.stdout.includes('products')) {
  console.error('Scratch DB missing products table after import');
  process.exit(1);
}

await unlink(scratchDb).catch(() => {});
// keep the SQL artifact for inspection
await writeFile(
  path.join(dir, 'RESTORE_TEST_OK'),
  `ok ${new Date().toISOString()} ${path.basename(out)}\n`,
);

console.log('\nRestore smoke test OK (export + throwaway sqlite import).');
console.log(`File: ${path.relative(root, out)}`);
console.log('Note: production restore is manual — see docs/runbooks/rollback.md');
