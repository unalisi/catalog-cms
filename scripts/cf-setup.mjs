#!/usr/bin/env node
/**
 * Creates Cloudflare resources and prints IDs to paste into wrangler.jsonc.
 * Requires: npx wrangler login
 *
 * Usage: npm run cf:setup
 */
import { execSync } from 'node:child_process';

function run(cmd) {
  console.log(`\n> ${cmd}`);
  return execSync(cmd, { encoding: 'utf8', stdio: ['inherit', 'pipe', 'pipe'] });
}

function extractId(output, patterns) {
  for (const re of patterns) {
    const m = output.match(re);
    if (m?.[1]) return m[1];
  }
  return null;
}

try {
  run('npx wrangler whoami');
} catch {
  console.error('Not logged in. Run: npx wrangler login');
  process.exit(1);
}

console.log('\nCreating D1, KV, R2…\n');

let d1Out = '';
try {
  d1Out = run('npx wrangler d1 create catalog-db');
} catch (e) {
  d1Out = String(e.stdout || e.message || e);
  console.log(d1Out);
}

const databaseId = extractId(d1Out, [
  /"database_id"\s*:\s*"([^"]+)"/,
  /database_id\s*=\s*"?([a-f0-9-]{36})"?/i,
]);

let cacheOut = '';
let sessionOut = '';
try {
  cacheOut = run('npx wrangler kv namespace create CACHE');
} catch (e) {
  cacheOut = String(e.stdout || e.message || e);
}
try {
  sessionOut = run('npx wrangler kv namespace create SESSION');
} catch (e) {
  sessionOut = String(e.stdout || e.message || e);
}

const cacheId = extractId(cacheOut, [/id\s*=\s*"([a-f0-9]{32})"/i, /"id"\s*:\s*"([a-f0-9]{32})"/i]);
const sessionId = extractId(sessionOut, [/id\s*=\s*"([a-f0-9]{32})"/i, /"id"\s*:\s*"([a-f0-9]{32})"/i]);

try {
  run('npx wrangler r2 bucket create catalog-media');
} catch (e) {
  console.log(String(e.stdout || e.message || e));
}

console.log(`
────────────────────────────────────────
Paste these into wrangler.jsonc:

  d1 database_id: ${databaseId ?? '(see d1 create output above)'}
  CACHE kv id:    ${cacheId ?? '(see kv create output above)'}
  SESSION kv id:  ${sessionId ?? '(see kv create output above)'}
  R2 bucket:      catalog-media

Then run:
  npm run types
  npm run deploy
────────────────────────────────────────
`);
