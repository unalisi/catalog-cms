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

## FAZ 1 durumu

- [x] Drizzle şema + D1 migration (`0000_init_catalog`)
- [x] Seed (1 marka, 2 kategori, 5 ürün)
- [x] KV cache-first + `X-Cache` header
- [x] Public katalog / ürün / marka / kategori
- [x] `sitemap.xml` + `robots.txt` + 404
- [x] Fiyatlar integer minor unit (`formatMoney`)

```bash
npm run db:migrate:local && npm run db:seed:local
npm run db:migrate:remote && npm run db:seed:remote
npm run deploy
```

## FAZ 2 durumu

- [x] `users` + PBKDF2 + Astro Sessions (KV `SESSION`)
- [x] Middleware guard (`/admin/*`, `/api/admin/*`)
- [x] Login / logout + admin shell (breadcrumb, çıkış)
- [x] Marka CRUD + Kategori CRUD (parent) + alan validasyonu
- [x] Yazımda KV invalidation + list version bump
- [x] Dashboard sayaçları

Giriş: `admin@catalog.local` / `ADMIN_BOOTSTRAP_PASSWORD` (local/prod secret; varsayılan örnek `ChangeMeNow!`)

## FAZ 3 durumu

- [x] `/admin/products` sanallaştırılmış Excel-benzeri grid (`@tanstack/react-virtual`)
- [x] Seçim: hücre / Cmd·Ctrl / Shift·sürükle / satır / sütun / tümü
- [x] Inline edit, Tab/ok, Esc, TSV paste, fill-down/right
- [x] Bulk bar + `PATCH /api/admin/products/bulk` (kısmi hata + rollback toast)
- [x] `/admin/products/new` + `/admin/products/[id]` form (varyant/medya/SEO iskeleti)
- [x] Grid yazımında ürün cache invalidation (`X-Cache: MISS`)
- [x] ≥1000 satır seed: `npm run db:seed:grid:local` / `:remote`

Sonraki adım: **FAZ 4 — Section-bazlı sayfa düzenleyici**.

## FAZ 4 durumu

- [x] `pages` + `page_sections` + migration `0002` + `home` seed
- [x] Section registry (9 tip) + public `SectionRenderer`
- [x] `/admin/pages` listesi + `/admin/pages/[slug]` editör (DnD, görünürlük, tip formları)
- [x] Canlı önizleme: admin içinde iframe
- [x] `page:slug:{slug}` KV cache + invalidation
- [x] Ana sayfa (`/`) CMS section’larından beslenir

Sonraki adım: **FAZ 5 — SEO modülü**.

## FAZ 5 durumu

- [x] Varlık SEO CRUD (ürün / marka / kategori / sayfa) + SERP/OG önizleme
- [x] Global SEO defaults (`settings:seo`) + `/admin/seo`
- [x] `redirects` tablosu + slug değişiminde otomatik 301 + middleware
- [x] JSON-LD: Organization, WebSite, Product, BreadcrumbList
- [x] Public meta: canonical, OG, Twitter, robots; sitemap noindex filtresi

Sonraki adım: **FAZ 6 — Blog modülü**.

## FAZ 6 durumu

**İçerik formatı:** sanitize edilmiş HTML (MDX yok). Admin textarea → sunucuda allowlist sanitizer (`src/lib/html/sanitize.ts`).

- [x] `posts` + `post_tags` + migration `0004` + `db/seed-blog.sql`
- [x] Admin CRUD (`/admin/blog`) + etiketler + draft/published/scheduled (`published_at`)
- [x] Public `/blog`, `/blog/[slug]`, `rss.xml`, Article JSON-LD
- [x] `blog-preview` section gerçek yazılardan beslenir
- [x] Sitemap’e blog URL’leri; slug değişiminde `/blog/...` 301

Seed: `npm run db:seed:blog:local` / `:remote`

Sonraki adım: **FAZ 8 — Medya kütüphanesi & site ayarları** (ardından FAZ 7 import).

## FAZ 8 durumu

- [x] `/admin/media` yükleme / arama / alt-text / silme (R2 + D1)
- [x] Public `/media/[...key]` + Images transform `?w=` (64–1920)
- [x] `MediaPicker` — ürün, blog, SEO OG, galeri section, settings logo/favicon
- [x] `/admin/settings` — logo, favicon, iletişim, sosyal, nav, analytics, SEO defaults
- [x] Public header/footer ayarlardan; `settings:site` / `nav:main` cache invalidate
- [x] Alt metin upload’ta zorunlu

Seed: `npm run db:seed:settings:local` / `:remote`

Sonraki adım: **FAZ 7 — WordPress / katalog içe aktarımı**.

## FAZ 7 durumu

- [x] Ortak `ImportRecord` + CSV / WooCommerce JSON / WXR adaptörleri
- [x] `import_jobs` / `import_items` + migration `0005`
- [x] Dry-run (ürün tablosuna yazmadan rapor)
- [x] Apply: `IMPORT_QUEUE` batch + upsert (SKU→slug) + uzak medya → R2
- [x] Çakışma: `skip | overwrite | merge`; kaydedilebilir CSV mapping profili (localStorage)
- [x] `/admin/import` sihirbazı + job izleme

Örnek CSV: `db/samples/import-demo.csv`

Sonraki adım: **FAZ 9 — Sertleştirme, performans & yayın**.

