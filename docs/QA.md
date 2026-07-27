# QA Checklist (FAZ 9)

Run before / after production deploy. Mark items as you go.

## Automated (CI)

- [ ] `npm run lint:design` — no `dark:`, `bg-black`, hex utilities
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] Deploy workflow applies D1 migrations then deploys
- [ ] PR preview uploads a Worker version

## Security

- [ ] `/admin` redirects to login when logged out
- [ ] Login rate-limits after repeated failures (429)
- [ ] Admin API POST from foreign Origin → 403
- [ ] Response includes `Content-Security-Policy`, `X-Content-Type-Options`, `X-Request-Id`
- [ ] Secrets not present in client bundles / repo (`SESSION_SECRET`, bootstrap password)

## Accessibility

- [ ] Skip link visible on Tab (public)
- [ ] All interactive controls reachable by keyboard
- [ ] Focus ring visible (`:focus-visible`)
- [ ] Images in media picker require / warn for alt text
- [ ] 404 / 500 pages have clear headings and escape links
- [ ] Contrast AA on primary (yellow) + black text

## Performance / CWV (manual Lighthouse)

Target (ARCHITECTURE §14): public Lighthouse ≥ 90 (Perf, SEO, Best Practices, a11y).

```bash
# After deploy, against production or preview URL:
npx lighthouse https://catalog-cms.unalisi-dev.workers.dev \
  --only-categories=performance,accessibility,best-practices,seo \
  --preset=desktop --quiet --chrome-flags="--headless"
```

- [ ] Home ≥ 90
- [ ] Catalog listing ≥ 90
- [ ] Product detail ≥ 90
- [ ] Blog post ≥ 90
- [ ] No layout shift from late font/images on hero

## Functional smoke

- [ ] `/api/health` → `{ ok: true }`
- [ ] Catalog search / filters
- [ ] Admin product grid edit + save
- [ ] Media upload + `/media/...` transform `?w=`
- [ ] Settings change reflects on public header
- [ ] Import dry-run + apply (sample CSV)
- [ ] SEO redirect works

## Backup

- [ ] `npm run db:backup:remote` produces SQL
- [ ] `npm run db:restore:test` succeeds locally
- [ ] Rollback runbook reviewed: [`docs/runbooks/rollback.md`](./runbooks/rollback.md)

## Empty / error states

- [ ] Empty catalog / blog copy is clear
- [ ] 404 noindex
- [ ] 500 page renders without leaking stack traces
