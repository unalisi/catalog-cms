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

## Performance / CWV (Lighthouse)

Target (ARCHITECTURE §14): public Lighthouse ≥ 90 (Perf, SEO, Best Practices, a11y).

```bash
# Four-page MVP sweep (writes .lighthouse/SUMMARY.md):
npm run lighthouse:mvp
# Optional: BASE_URL=https://your-preview.workers.dev npm run lighthouse:mvp
```

### Baseline (2026-08-03, desktop, `catalog-cms.unalisi-dev.workers.dev`)

| Page | Perf | A11y | Best Practices | SEO |
|------|------|------|----------------|-----|
| Home | 92 | 97 | 100 | 100 |
| Catalog | 93 | 96 | 100 | 100 |
| Product | 91 | 95 | 100 | 100 |
| Blog | 100 | 96 | 100 | 100 |

- [x] Home ≥ 90
- [x] Catalog listing ≥ 90
- [x] Product detail ≥ 90
- [x] Blog post ≥ 90
- [x] No layout shift from late font/images on hero (CLS ~0 on measured pages)

## Functional smoke

- [ ] `/api/health` → `{ ok: true }`
- [x] Catalog `?q=` search + brand/category filters
- [x] Product description rich-text (Tiptap) → public HTML render
- [x] Navbar layouts via Tasarım → Menüler (classic / mega / fullscreen / mega-img)
- [ ] Admin product grid edit + save
- [ ] Media upload + `/media/...` transform `?w=`
- [ ] Settings / Menüler change reflects on public header
- [x] Import dry-run + apply (batch drafts + media queue; pause/cancel)
- [x] Export streaming (CSV / XML / Woo JSON) with status/brand/category filters
- [ ] SEO redirect works

## Backup

- [ ] `npm run db:backup:remote` produces SQL
- [ ] `npm run db:restore:test` succeeds locally
- [ ] Rollback runbook reviewed: [`docs/runbooks/rollback.md`](./runbooks/rollback.md)

## Empty / error states

- [ ] Empty catalog / blog copy is clear
- [ ] 404 noindex
- [ ] 500 page renders without leaking stack traces
