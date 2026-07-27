# Catalog CMS

Astro 7 + Cloudflare Workers ürün katalog / CMS. Mimari: [`ARCHITECTURE.md`](./ARCHITECTURE.md) · Plan: [`PLAN.md`](./PLAN.md) · Tasarım: [`DESIGN.md`](./DESIGN.md).

## Gereksinimler

- Node.js ≥ 22.12
- Cloudflare hesabı (`npx wrangler login`)
- (Opsiyonel) GitHub CLI (`gh`) veya manuel remote

## Hızlı başlangıç (local)

```bash
npm install
cp .dev.vars.example .dev.vars
npm run types
npm run dev
```

- Site: http://localhost:4321
- Health: http://localhost:4321/api/health

Binding’ler local’de Miniflare ile simüle edilir (`wrangler` / Astro Cloudflare adapter).

## Cloudflare kaynakları

```bash
npx wrangler login
npm run cf:setup
```

Çıktıdaki `database_id` / KV id’lerini [`wrangler.jsonc`](./wrangler.jsonc) içine yapıştır, sonra:

```bash
npm run types
npm run deploy
```

Secret (production):

```bash
npx wrangler secret put SESSION_SECRET
```

## Script’ler

| Script | Açıklama |
|---|---|
| `npm run dev` | Astro + Workers local |
| `npm run build` | Production build |
| `npm run deploy` | Build + `wrangler deploy` |
| `npm run types` | `wrangler types` → Env tipleri |
| `npm run typecheck` | `astro check` + `tsc` |
| `npm run cf:setup` | D1 / KV / R2 oluştur |

Worker adı: **`catalog-cms`** (`wrangler.jsonc` → `name`). Dashboard ile aynı olmalı.

## GitHub → otomatik deploy

Bu repo [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) içerir.

1. Repo secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
2. `main` push → typecheck → build → deploy

Alternatif: Cloudflare Dashboard → Worker `catalog-cms` → Settings → Builds → Connect GitHub (Workers Builds). **İkisini birden production’a bağlama.**

## FAZ 0 durumu

- [x] Astro + Cloudflare + React + Tailwind iskeleti
- [x] Light-only design token’ları
- [x] Layout’lar, middleware, `/api/health`
- [x] GitHub Actions deploy iskeleti
- [x] Remote D1/KV/R2 kaynakları + `wrangler.jsonc` id’leri
- [x] `wrangler deploy` → https://catalog-cms.unalisi-dev.workers.dev
- [x] Git `main` + ilk commit’ler
- [ ] GitHub remote + `main` push (repo oluşturma)
- [ ] GitHub Actions secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`)

Sonraki adım: **FAZ 1 — Veri katmanı & public katalog**.
