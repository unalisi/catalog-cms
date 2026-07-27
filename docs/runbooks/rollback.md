# Rollback & Ops Runbook

Production Worker: `catalog-cms`  
Health: `/api/health`

## Secrets (audit)

| Secret / var | Where | Notes |
|---|---|---|
| `SESSION_SECRET` | `wrangler secret` / `.dev.vars` | Session signing; never commit |
| `ADMIN_BOOTSTRAP_PASSWORD` | `.dev.vars` (local) / optional remote secret | First admin bootstrap only |
| `CLOUDFLARE_API_TOKEN` | GitHub Actions secrets | Deploy + migrate |
| `CLOUDFLARE_ACCOUNT_ID` | GitHub Actions secrets | Account scope |

Audit checklist:

- [ ] `.dev.vars` is gitignored and not in commits
- [ ] Production secrets set via `wrangler secret put`, not in `wrangler.jsonc`
- [ ] Bootstrap password rotated after first login if default was used
- [ ] API tokens scoped (Workers Scripts + D1 edit) — least privilege

```bash
npx wrangler secret list
npx wrangler secret put SESSION_SECRET
```

## Custom domain

1. Cloudflare Dashboard → Workers → `catalog-cms` → Settings → Domains & Routes
2. Add custom domain (zone must be on the same account)
3. Ensure DNS CNAME/proxied as prompted
4. Update sitemap/canonical base if you store absolute URLs in settings

## Deploy pipeline (`main`)

Order in [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml):

1. `lint:design`
2. `typecheck`
3. `build`
4. `d1 migrations apply DB --remote`
5. `wrangler deploy`

## Preview (PR)

[`.github/workflows/preview.yml`](../../.github/workflows/preview.yml) runs `wrangler versions upload` (no remote migrate). Inspect Versions in the dashboard; promote only after review.

## Backup

```bash
npm run db:backup:remote   # writes ./backups/catalog-remote-*.sql
npm run db:backup:local
```

Keep exports off git (see `.gitignore`). Store copies in secure object storage if needed.

## Restore (local smoke test)

```bash
npm run db:restore:test
```

This exports local D1 and re-applies the SQL file locally only.

### Production restore (manual, careful)

1. Take a fresh remote backup first: `npm run db:backup:remote`
2. Prefer a temporary D1 database + branch Worker for validation
3. Only then `wrangler d1 execute DB --remote --file=./backups/<file>.sql` after review
4. Re-run migrations status: `npx wrangler d1 migrations list DB --remote`

Never run unreviewed SQL against production.

## Worker rollback

1. Dashboard → Workers → `catalog-cms` → Deployments / Versions
2. Promote the previous known-good version
3. If a bad migration shipped, restore D1 from backup **before** re-deploying older code that expects the old schema (or forward-fix with a new migration)

## Observability

- Structured JSON logs from middleware: `requestId`, `method`, `path`, `status`, `ms`
- Response header: `X-Request-Id`
- Correlate user reports with `X-Request-Id`

## Rate limits

| Surface | Limit |
|---|---|
| Login | 20 / min / IP (`rl:login`) |
| Import API mutations | 30 / min / IP (`rl:import`) |
| CSRF | Same-origin check on admin API mutations |
