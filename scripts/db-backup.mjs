#!/usr/bin/env node
/**
 * Export remote (or local) D1 database to ./backups/
 *
 * Usage:
 *   node scripts/db-backup.mjs --remote
 *   node scripts/db-backup.mjs --local
 *   npm run db:backup:remote
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const remote = process.argv.includes('--remote');
const location = remote ? '--remote' : '--local';

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const dir = path.join(root, 'backups');
await mkdir(dir, { recursive: true });
const out = path.join(dir, `catalog-${remote ? 'remote' : 'local'}-${stamp}.sql`);

const args = ['d1', 'export', 'DB', location, `--output=${out}`];

console.log(`> npx wrangler ${args.join(' ')}`);
const result = spawnSync('npx', ['wrangler', ...args], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log(`Backup written: ${path.relative(root, out)}`);
console.log('Restore: see docs/runbooks/rollback.md');
