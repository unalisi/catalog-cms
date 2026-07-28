# ARCHITECTURE.md — Teknik Mimari Kararları

> **Stack:** Astro 7 · `@astrojs/cloudflare` · Cloudflare Workers · D1 · KV · R2 · Images · Queues · Drizzle · Zod · React (admin island)
> **Odak:** SEO + hız (düşük JS, cache-first, edge SSR)
> **Tema:** Yalnızca light — Siyah / Sarı / Beyaz ([`DESIGN.md`](./DESIGN.md))
> **İlgili belgeler:** [`PLAN.md`](./PLAN.md) · [`DESIGN.md`](./DESIGN.md)

Bu belge bağlayıcı teknik kararları içerir. Kod yazılmaz; uygulama fazlarında ([`PLAN.md`](./PLAN.md)) buradaki kararlar referans alınır. Çelişki durumunda **bu belge** geçerlidir; ardından DESIGN, ardından PLAN güncellenir.

---

## 0. Ürün Tanımı (tek cümle)

Edge’de çalışan, kendi CMS’i olan bir **ürün katalog sitesi**: public taraf SEO ve hız için SSR + KV cache; admin taraf Excel-benzeri ürün grid, section editör, SEO, blog ve WordPress import ile içerik yönetir. Tüm kalıcı servisler Cloudflare içindedir.

---

## 1. Yüksek Seviye Mimari

```
                    ┌─────────────────────────────────────────────────────────┐
  Tarayıcı ──────▶  │  Cloudflare Edge                                        │
                    │                                                         │
                    │  Astro SSR Worker (@astrojs/cloudflare)                 │
                    │       │                                                 │
                    │       ├── Public HTML  ◀── KV (CACHE) cache-first       │
                    │       │                      ▲ miss                     │
                    │       │                      │                          │
                    │       ├── D1 (DB) ───────────┘  kaynak of truth         │
                    │       ├── R2 (MEDIA) + Images binding (transform)       │
                    │       ├── KV (SESSION) — Astro sessions / admin oturum  │
                    │       └── Queues (IMPORT_QUEUE) — import batch işleri   │
                    │                                                         │
                    │  Cache-Control / CDN: HTML kısa TTL veya private;       │
                    │  medya/asset uzun TTL + immutable hash                  │
                    └─────────────────────────────────────────────────────────┘
```

| Katman | Rol |
|---|---|
| **Astro SSR** | HTML üretimi, admin API, middleware (auth, redirect) |
| **D1** | İlişkisel kaynak of truth |
| **KV `CACHE`** | Public entity/liste/sitemap cache |
| **KV `SESSION`** | Admin oturum (Astro Sessions) |
| **R2 `MEDIA`** | Orijinal medya dosyaları |
| **Images binding** | R2 üzerindeki görselleri transform (WebP/AVIF, boyut) |
| **Queues** | Import ve ağır arka plan işleri (request path dışı) |

**Neden Workers + Astro?** Edge SSR, düşük client JS (SEO/CWV), binding’lerle D1/KV/R2’ye hop yok; admin etkileşimi React island ile sınırlı tutulur.

---

## 2. Framework & Render Stratejisi

### 2.1 Temel kurulum (greenfield)

```bash
npm create astro@latest
npx astro add cloudflare
npx astro add react tailwind
npx astro add sitemap   # veya elle /sitemap.xml endpoint
```

Bootstrap sırası (FAZ 0): **Astro iskelet → Cloudflare binding kaynakları → GitHub init → `wrangler deploy` → Workers Builds / Actions**. Ayrıntı §13.

- **Astro 7+** + `@astrojs/cloudflare` (adapter 14+)
- `output: "server"` — varsayılan on-demand SSR
- `wrangler.jsonc` zorunlu (bindings var); `wrangler.toml` kullanılmaz
- Worker **`name`** alanı dashboard’daki Worker adıyla **birebir aynı** olmalı (Workers Builds bunu zorunlu kılar)
- `compatibility_flags: ["nodejs_compat"]`
- `compatibility_date`: proje oluşturulduğu gün
- Binding tipleri: `npx wrangler types` — **elle `Env` yazılmaz**
- Binding erişimi: `import { env } from "cloudflare:workers"` (eski `Astro.locals.runtime.env` kullanılmaz)
- İlk yayın hedefi: `*.workers.dev`; custom domain FAZ 9

### 2.2 Sayfa render politikası

| Sayfa tipi | Strateji | Gerekçe |
|---|---|---|
| Ürün / marka / kategori / blog detay | SSR + KV cache-first | İçerik sık değişebilir; SEO için tam HTML |
| Katalog liste / arama | SSR + kısa TTL liste cache | Filtre kombinasyonları çok |
| Ana sayfa / section sayfalar | SSR + KV (`page:{slug}`) | CMS’ten gelir |
| `sitemap.xml` / `robots.txt` / `rss.xml` | SSR + KV | Mutasyonda invalidate |
| Statik yasal sayfalar (gerekirse) | `export const prerender = true` | Binding ihtiyacı yoksa |
| Admin UI | SSR shell + React islands | Ağır etkileşim |

### 2.3 Island kuralları

| Yer | `client:*` | Not |
|---|---|---|
| Public filtre / arama | `client:visible` | Mümkünse progressive enhancement |
| Product grid (admin) | `client:load` | Kritik etkileşim |
| Section builder DnD | `client:load` | |
| Import wizard | `client:load` | |
| Public ürün kartı / static hero | **island yok** | Saf HTML |
| Hero slider | `client:visible` | Autoplay / oklar / dots / klavye |

Public sayfada gereksiz React mount edilmez. Admin’de React yoğunlaşır.

### 2.4 UI stack

- Tailwind CSS + CSS değişkenleri ([`DESIGN.md`](./DESIGN.md) token’ları)
- shadcn-benzeri primitifler (kopyalanmış, light-only); Radix yalnızca erişilebilir etkileşim gerektiğinde
- İkon: `lucide-react` (admin) / `lucide` SVG (public tercihen)
- Form doğrulama: **Zod** (client + server aynı şema)

---

## 3. Klasör Yapısı (bağlayıcı)

```
/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Opsiyonel: Actions ile deploy (Workers Builds alternatifi)
├── astro.config.mjs
├── wrangler.jsonc              # name, bindings, queues, observability
├── package.json                # scripts: dev, build, deploy, types
├── drizzle.config.ts
├── db/
│   ├── schema/                 # Drizzle tabloları (modül bazlı dosyalar)
│   │   ├── products.ts
│   │   ├── taxonomy.ts         # brands, categories
│   │   ├── content.ts          # pages, sections, posts
│   │   ├── media.ts
│   │   ├── seo.ts              # seo_meta, redirects
│   │   ├── settings.ts
│   │   ├── auth.ts
│   │   └── import.ts
│   ├── index.ts                # re-export schema
│   ├── migrations/             # drizzle-kit SQL
│   └── seed.ts
├── public/                     # favicon, robots fallback vb.
└── src/
    ├── pages/
    │   ├── index.astro
    │   ├── catalog/
    │   ├── product/[slug].astro
    │   ├── brand/[slug].astro
    │   ├── category/[slug].astro
    │   ├── blog/
    │   ├── admin/              # admin sayfaları (.astro + island mount)
    │   ├── api/
    │   │   ├── health.ts
    │   │   └── admin/          # mutasyon endpoint’leri
    │   ├── sitemap.xml.ts
    │   ├── robots.txt.ts
    │   └── rss.xml.ts
    ├── layouts/
    │   ├── PublicLayout.astro
    │   └── AdminLayout.astro
    ├── components/
    │   ├── public/             # .astro tercihen
    │   ├── sections/           # section registry bileşenleri
    │   ├── admin/              # React islands
    │   │   └── product-grid/
    │   └── ui/                 # paylaşılan primitifler
    ├── lib/
    │   ├── cache/              # KV key helpers, get/set/invalidate
    │   ├── seo/                # meta, JSON-LD, canonical
    │   ├── media/              # R2 key + Images URL üretimi
    │   ├── validation/         # paylaşılan zod şemaları
    │   └── utils/
    ├── server/
    │   ├── db.ts               # drizzle(env.DB)
    │   ├── repos/              # D1 erişimi — tek yazım noktası
    │   ├── auth/               # session, password, guards
    │   ├── services/           # iş kuralları (product, seo, import…)
    │   ├── import/
    │   │   ├── adapters/
    │   │   ├── normalize.ts
    │   │   └── apply.ts
    │   └── queue/              # import consumer handlers
    ├── middleware.ts           # auth guard, redirects, security headers
    └── styles/
        └── global.css          # :root token’lar (DESIGN.md)
```

### Katman kuralları

1. **`pages/`** yalnızca orchestration: layout + service çağrısı + render.
2. **`server/repos/`** D1/Drizzle bilir; HTTP bilmez.
3. **`server/services/`** iş kuralı + cache invalidation; Zod çıktısını alır.
4. **`lib/`** edge-safe, mümkünse framework-agnostic yardımcılar.
5. Sayfa/API **doğrudan SQL yazmaz**; repo/service üzerinden gider.
6. Public bileşenler admin’e import etmez; tersi de mümkün olduğunca kaçınılır (`components/ui` ortak).

---

## 4. Cloudflare Bindings (sabit isimler)

`wrangler.jsonc` içinde binding isimleri sabittir; kod ve doküman aynı adı kullanır:

| Binding | Tip | Amaç |
|---|---|---|
| `DB` | D1 | Kaynak of truth |
| `CACHE` | KV | Public cache |
| `SESSION` | KV | Astro session storage |
| `MEDIA` | R2 | Orijinal dosyalar |
| `IMAGES` | Images | Transform binding |
| `IMPORT_QUEUE` | Queue producer | Import batch enqueue |
| *(consumer)* | Queue consumer | Aynı Worker’da import işleyici |

Örnek iskelet:

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "catalog-cms",
  "main": "@astrojs/cloudflare/entrypoints/server",
  "compatibility_date": "2026-07-27",
  "compatibility_flags": ["nodejs_compat"],
  "assets": { "binding": "ASSETS", "directory": "./dist" },
  "observability": { "enabled": true, "head_sampling_rate": 1 },
  "d1_databases": [
    { "binding": "DB", "database_name": "catalog-db", "database_id": "<id>", "migrations_dir": "db/migrations" }
  ],
  "kv_namespaces": [
    { "binding": "CACHE", "id": "<id>" },
    { "binding": "SESSION", "id": "<id>" }
  ],
  "r2_buckets": [
    { "binding": "MEDIA", "bucket_name": "catalog-media" }
  ],
  "images": { "binding": "IMAGES" },
  "queues": {
    "producers": [{ "binding": "IMPORT_QUEUE", "queue": "catalog-import" }],
    "consumers": [{
      "queue": "catalog-import",
      "max_batch_size": 10,
      "max_retries": 3
    }]
  }
}
```

**Secrets** (`wrangler secret put` / `.dev.vars` local): `SESSION_SECRET`, `ADMIN_BOOTSTRAP_PASSWORD` (yalnızca ilk kurulum), WooCommerce credentials (import job’a özel, tercihen job kaydında şifreli veya secret).

---

## 5. Veri Katmanı: D1 + Drizzle

- **ORM:** Drizzle. **Prisma kullanılmaz** (Workers/D1 bundle ve edge uyumu).
- **ID:** string `cuid` / `ulid` (integer autoincrement tercih edilmez — edge merge/import kolaylığı).
- **Zaman:** ISO text veya integer unix; tutarlı tek format (`created_at`, `updated_at`).
- **Durum alanları:** `draft | published | archived` (ürün/post/page).
- **Soft delete:** başlangıçta yok; silme hard delete + redirect/SEO temizliği. Gerekirse sonra `deleted_at` eklenir.

### 5.1 Şema (özet — bağlayıcı alanlar)

```
users(id, email UNIQUE, password_hash, role, created_at, updated_at)

seo_meta(id, title, description, canonical, og_image_media_id→media,
         noindex INTEGER, robots_extra, created_at, updated_at)

media(id, key UNIQUE, url, width, height, alt, mime, size_bytes,
      source, created_at)                          -- key = R2 object key

brands(id, slug UNIQUE, name, description, logo_media_id→media,
       seo_id→seo_meta, status, created_at, updated_at)

categories(id, slug UNIQUE, name, parent_id→categories NULL,
           description, image_media_id→media, seo_id→seo_meta,
           position, status, created_at, updated_at)

products(id, slug UNIQUE, sku UNIQUE NULL, name, description,
         price INTEGER, compare_at_price INTEGER,  -- kuruş/cent
         currency TEXT DEFAULT 'TRY',
         stock INTEGER, status, brand_id→brands,
         seo_id→seo_meta, primary_media_id→media,
         published_at, created_at, updated_at)

product_variants(id, product_id→products, sku UNIQUE NULL, name,
                 price INTEGER, stock INTEGER, attributes_json,
                 position, created_at, updated_at)

product_categories(product_id, category_id)  PK(product_id, category_id)
product_media(product_id, media_id, position) -- galeri sırası

pages(id, slug UNIQUE, title, status, seo_id→seo_meta,
      created_at, updated_at)
page_sections(id, page_id→pages, type, position, is_visible,
              config_json, created_at, updated_at)

posts(id, slug UNIQUE, title, excerpt, content, status,
      published_at, author_id→users, cover_media_id→media,
      seo_id→seo_meta, created_at, updated_at)
post_tags(post_id, tag)  -- tag normalize lowercase
-- Blog kategorileri: categories ağacından ayrı tutulabilir veya
-- post_categories(post_id, category_id) ile taxonomy paylaşılır (FAZ 6 kararı: ayrı blog_categories tablosu tercih)

redirects(id, from_path UNIQUE, to_path, status_code DEFAULT 301,
          created_at)

settings(key PRIMARY, value_json, updated_at)

import_jobs(id, source, status, mapping_json, summary_json,
            created_by→users, created_at, updated_at)
import_items(id, job_id→import_jobs, row_index, raw_json, mapped_json,
             action, status, error, created_at)
```

**İndeksler (zorunlu):** `products(status, updated_at)`, `products(brand_id)`, `categories(parent_id)`, `posts(status, published_at)`, `redirects(from_path)`, `page_sections(page_id, position)`.

### 5.2 Para birimi

Fiyatlar **integer minor unit** (ör. 1999 = ₺19,99). Float yasak. Gösterim `lib/money.ts` ile formatlanır.

---

## 6. Cache Stratejisi: KV Cache-First

### 6.1 Okuma yolu

```
request → service.getX(slug)
  → CACHE.get(key)
      hit  → parse JSON → return
      miss → repo (D1) → CACHE.put(key, json, { expirationTtl }) → return
```

### 6.2 Anahtar deseni (deterministik)

| Anahtar | İçerik | Tipik TTL |
|---|---|---|
| `product:slug:{slug}` | Ürün + varyant + medya özeti | 3600 |
| `brand:slug:{slug}` | Marka + ürün sayımı | 3600 |
| `category:slug:{slug}` | Kategori + çocuklar | 3600 |
| `page:slug:{slug}` | Sayfa + görünür section’lar | 1800 |
| `post:slug:{slug}` | Blog yazısı | 3600 |
| `list:products:{hash}` | Liste sayfası (filtre+sort+page) | 300 |
| `sitemap:v1` | Sitemap XML veya URL listesi | 3600 |
| `settings:site` | Global ayarlar | 3600 |
| `nav:main` | Menü | 3600 |

`hash` = stabil serialize edilmiş filtre objesinin kısa hash’i.

### 6.3 Invalidation (write-through)

Her admin mutasyonu ilgili anahtarları **siler** (`delete`). Liste anahtarlarında `KV.list` **kullanılmaz**.

Geçerli yaklaşımlar (öncelik sırası):

1. **Entity key sil** (`product:slug:eski`, `product:slug:yeni`).
2. **Liste sürümü:** `settings` veya KV’de `list:products:ver` sayacı artır; liste key’ine sürüm göm (`list:products:v{n}:{hash}`). Eski key’ler TTL ile ölür.
3. Slug değişince: eski entity key sil + `redirects` yaz + sitemap invalidate.

Invalidation `server/services/*` içinde, transaction başarısından **sonra** yapılır. Queue consumer da aynı helper’ı çağırır.

### 6.4 HTTP cache

- HTML public: `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` (edge CDN) **veya** yalnızca KV’ye güvenip `private, no-store` — **tek strateji seçilir (FAZ 1 kararı: KV primary + kısa s-maxage)**.
- Asset (hash’li): `immutable, max-age=31536000`.
- Admin: `private, no-store`.

---

## 7. Medya: R2 + Images

**Karar:** Orijinaller **R2**’de; teslimat **Images binding / `/cdn-cgi/image/`** ile transform.

- Upload → R2 `MEDIA` (`media/{yyyy}/{mm}/{ulid}.{ext}`)
- `media` satırı metadata
- Public URL: zone üzerinden transform veya Astro `Image` + `imageService: 'cloudflare-binding'`
- Önceden tanımlı varyant genişlikleri: `64, 128, 320, 640, 960, 1280, 1920` — sınırsız kombinasyon üretilmez
- WordPress import: uzak görsel stream edilerek R2’ye yazılır (`fetch` + `put`); buffer’lanmaz

---

## 8. Rota & API Sözleşmesi

### 8.1 Public

```
/                         ana sayfa (page slug: home)
/catalog                  ürün listesi
/product/[slug]
/brand/[slug]
/category/[slug]
/blog
/blog/[slug]
/sitemap.xml
/robots.txt
/rss.xml
/health                   { ok: true, ts }
```

### 8.2 Admin (middleware korumalı)

```
/admin/login
/admin                    dashboard
/admin/products           data grid
/admin/products/[id]
/admin/brands
/admin/categories
/admin/pages
/admin/pages/[slug]       section editor
/admin/seo
/admin/blog
/admin/blog/[id]
/admin/import
/admin/media
/admin/settings
```

### 8.3 API

- Base: `/api/admin/*`
- Auth: session cookie zorunlu
- Body/query: Zod parse; hata → `400` + alan hataları
- Yanıt zarfı:

```ts
type ApiOk<T> = { ok: true; data: T }
type ApiErr = { ok: false; error: { code: string; message: string; fields?: Record<string, string> } }
```

| Endpoint | Amaç |
|---|---|
| `PATCH /api/admin/products/bulk` | Grid batch değişiklikleri |
| `POST /api/admin/import/parse` | Dry-run / staging |
| `POST /api/admin/import/apply` | Queue’ya iş at |
| `GET /api/admin/import/jobs/[id]` | Job durumu |
| `POST /api/admin/media` | Upload (multipart) |
| `POST /api/admin/auth/login` | Giriş |
| `POST /api/admin/auth/logout` | Çıkış |

İsimlendirme: **kebab-case path**, **camelCase JSON alanları**, DB’de **snake_case**.

---

## 9. Kimlik Doğrulama & Güvenlik

- Admin: oturum tabanlı (Astro Sessions + `SESSION` KV); cookie `HttpOnly`, `Secure`, `SameSite=Lax`
- Middleware: `/admin` (login hariç) ve `/api/admin` için sunucu guard
- Rol: başlangıç `admin`; şema `role` alanıyla genişlemeye açık
- Parola: Web Crypto / edge-uyumlu KDF (ör. PBKDF2); düz metin yok
- CSRF: same-origin check + mutasyonlarda origin/referer doğrulama (veya double-submit token)
- Rate limit: login / import — KV sayaç (`rl:login:{ip}`, TTL 60s)
- Security headers middleware: `X-Content-Type-Options`, `Referrer-Policy`, `Content-Security-Policy` (admin+public ayrı politika)
- Secret’lar repoda yok; `.dev.vars` gitignore

---

## 10. WordPress / Katalog Import (FAZ 7)

```
[WooCommerce REST]┐
[CSV]             ├── adapter → ImportRecord → import_items (staging)
[WXR]             ┘
                      │
              dry-run (yazma yok) ──▶ validation report
                      │
              apply → IMPORT_QUEUE batches
                      │
              consumer: media(R2) + upsert products + invalidate CACHE
                      │
              import_jobs.summary_json
```

- Ortak model: `ImportRecord` (`name`, `slug`, `sku`, `price`, `stock`, `categories[]`, `brand`, `media[]`, `seo`, `status`)
- Upsert anahtarı: **SKU önce**, yoksa **slug**; çakışma politikası: `skip | overwrite | merge`
- Büyük işler Queue’da; HTTP request yalnızca enqueue + durum okur
- İş **idempotent** ve **tekrar çalıştırılabilir** olmalı

---

## 11. SEO Altyapısı (birinci sınıf)

Her public render:

1. `seo_meta` (varlık) → yoksa otomatik fallback (ürün adı, kırpılmış description)
2. Canonical mutlak URL
3. Open Graph + Twitter
4. `noindex` → meta robots + sitemap dışı
5. JSON-LD: `Organization`, `WebSite` (global); `Product` / `BreadcrumbList` / `Article` sayfa tipine göre
6. Slug değişimi → `redirects` + middleware 301
7. `sitemap.xml` yalnızca `published` + `noindex=false`

Performans ile kesişen SEO kuralları:

- LCP görseli: `fetchpriority="high"`, doğru boyut, modern format
- CLS: width/height veya aspect-ratio zorunlu
- Critical CSS: Astro scoped; gereksiz font subset
- JS bütçesi: public sayfada island yoksa ~0 hydration

---

## 12. Section Registry

```ts
// Kavramsal sözleşme
type SectionType =
  | 'hero' | 'featured-products' | 'brand-strip' | 'category-grid'
  | 'why-us' | 'contact-channels' | 'references' | 'blog-preview' | 'map-contact'
  | 'faq' | 'banner-cta' | 'rich-text' | 'gallery'
// hero config: variant 'static' | 'slider', overlay, image*, slides[]
// Public islands: HeroSlider, GalleryLightbox (client:visible)

type SectionDef = {
  type: SectionType
  label: string
  schema: ZodSchema   // config_json
  defaults: unknown
  Component: AstroComponent
}
```

- Bilinmeyen `type` public’te **yoksayılır** (kırılmaz)
- Admin form şemadan üretilir
- `config_json` boyutu makul tutulur; büyük HTML rich-text için ayrı sınır

---

## 13. GitHub, Ortamlar, Worker Oluşturma & Deploy

Bu bölüm FAZ 0’ın **repo + Worker** çıktısını ve sonraki CI olgunlaştırmasını (FAZ 9) tanımlar.

### 13.1 Ortamlar

| Ortam | Amaç | Nasıl |
|---|---|---|
| local | Geliştirme | `wrangler dev` + local D1/KV/R2; secret’lar `.dev.vars` |
| preview | PR / feature | Non-`main` → `wrangler versions upload` (Workers Builds default) veya staging Worker |
| production | Canlı | `main` → `wrangler deploy`; custom domain FAZ 9 |

Pipeline (olgun): `typecheck → build → d1 migrations apply → deploy`

### 13.2 GitHub init (FAZ 0 — zorunlu)

1. `.gitignore`: `node_modules/`, `dist/`, `.wrangler/`, `.dev.vars`, `.env*`, `worker-configuration.d.ts` (üretiliyorsa commit politikası ekibe göre; genelde `wrangler types` CI’da da çalıştırılır).
2. `git init -b main` → ilk commit (iskelet + `wrangler.jsonc`).
3. GitHub repo: `gh repo create <name> --private --source=. --remote=origin --push` (veya manuel remote).
4. Secret / credential **asla** commit edilmez; yalnızca Cloudflare Secrets + GitHub Actions secrets (kullanılıyorsa).

Branch modeli (başlangıç): `main` = production. Feature branch’ler PR ile birleşir. Branch protection FAZ 9’da sıkılaştırılabilir.

### 13.3 Cloudflare Worker oluşturma & ilk deploy (FAZ 0 — zorunlu)

**Önkoşul:** `npx wrangler login`; D1/KV/R2 kaynakları oluşturulmuş; `wrangler.jsonc` `name` + binding id’leri dolu.

```bash
npm run build                 # astro build
npx wrangler deploy           # Worker yoksa oluşturur, varsa günceller
npx wrangler secret put SESSION_SECRET
curl https://<worker>.<account>.workers.dev/health
```

Kurallar:
- Dashboard’daki Worker adı = `wrangler.jsonc` → `"name"` (örn. `catalog-cms`).
- İlk deploy `workers.dev` subdomain verir; custom domain sonra.
- Binding’ler deploy anında Worker’a bağlanır; eksik id deploy’u kırar veya runtime’da boş kalır — FAZ 0’da doğrulanır.
- Queue consumer aynı Worker’daysa queue kaydı deploy ile birlikte gelir.

Manuel alternatif: Dashboard → Workers & Pages → Create → GitHub repo import. Bu projede **önce lokal iskelet + `wrangler deploy`**, sonra Git bağlantısı tercih edilir (binding kontrolü elde kalır).

### 13.4 Sürekli deploy: iki geçerli yol

**Tercih A — Workers Builds (Cloudflare native, varsayılan öneri)**  
Dashboard → Worker → Settings → Builds → Connect GitHub:

| Ayar | Değer |
|---|---|
| Production branch | `main` |
| Build command | `npm ci && npm run build` (veya `npm run build`) |
| Deploy command | `npx wrangler deploy` |
| Non-production | `npx wrangler versions upload` (preview URL) |

`main` push → build → active deployment. Worker name eşleşmesi zorunlu.

**Tercih B — GitHub Actions (external CI)**  
`.github/workflows/deploy.yml`:

- Trigger: `push` to `main` (+ isteğe bağlı `pull_request` için typecheck)
- Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
- Adımlar: checkout → setup node → `npm ci` → typecheck → build → (FAZ 9+) D1 migrate → `npx wrangler deploy`

İkisinden **biri** FAZ 0’da seçilip bağlanır; ikisini aynı anda production’a deploy ettirme (çift deploy riski). FAZ 9’da migration adımı pipeline’a eklenir.

### 13.5 package.json script sözleşmesi

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro build && wrangler dev",
    "deploy": "astro build && wrangler deploy",
    "types": "wrangler types",
    "typecheck": "astro check && tsc --noEmit"
  }
}
```

### 13.6 Migration, yedek, gözlem

- Migration’lar `db/migrations`; production apply CI veya `wrangler d1 migrations apply DB --remote` (FAZ 9’da otomatik).
- Yedek: periyodik `wrangler d1 export`; restore prosedürü test edilir.
- Observability: `observability.enabled = true`; structured JSON log (`level`, `msg`, `requestId`).
- Rollback: önceki Worker version’ı dashboard’dan promote / `wrangler rollback` (runbook FAZ 9).

### 13.7 FAZ 0 vs FAZ 9 sorumluluk ayrımı

| Konu | FAZ 0 | FAZ 9 |
|---|---|---|
| GitHub repo + ilk commit | ✅ | — |
| `wrangler deploy` + `/health` | ✅ | — |
| Workers Builds veya Actions iskeleti | ✅ | Olgunlaştır |
| D1 migrate in CI | — | ✅ |
| Preview URL / PR checks | İskelet | ✅ |
| Custom domain + TLS | — | ✅ |
| Backup / rollback runbook | Not | ✅ |

---

## 14. Performans Bütçesi (public)

| Metrik | Hedef |
|---|---|
| Lighthouse Performance | ≥ 90 |
| Lighthouse SEO | ≥ 90 |
| LCP | < 2.5s (edge, tipik) |
| CLS | < 0.1 |
| Public JS (gzipped, route) | mümkünse < 50KB; tercihen 0 hydration |
| TTFB (edge cache/KV hit) | düşük; miss’te D1 kabul edilir |

Admin için Lighthouse hedefi yok; klavye a11y ve AA kontrast zorunlu.

---

## 15. Domain Sözlüğü

| Terim | Kod / UI | Anlam |
|---|---|---|
| Product | `product` | Satılabilir ürün |
| Variant | `variant` | SKU/fiyat/stok varyasyonu |
| Brand | `brand` | Marka |
| Category | `category` | Ağaç kategori |
| Page | `page` | Section’lardan oluşan sayfa |
| Section | `section` | Sayfa bloğu (`type` + `config`) |
| Post | `post` | Blog yazısı |
| Media | `media` | R2 dosya kaydı |
| SEO Meta | `seoMeta` / `seo_meta` | SEO alanları |
| Redirect | `redirect` | 301 kaydı |
| Import Job/Item | `importJob` / `importItem` | İçe aktarım |

Türkçe UI etiketleri serbest; **kod kimlikleri İngilizce** yukarıdaki sözlüğe bağlıdır.

---

## 16. Kalite Kapıları

- Mutasyon: Zod + auth + (başarı sonrası) CACHE invalidation
- Public sayfa: cache-first + meta + JSON-LD + semantik HTML
- Grid: bulk PATCH + optimistic UI + rollback
- Import: dry-run adımı zorunlu + Queue + kısmi başarı raporu
- Yayın: GitHub + Worker deploy (FAZ 0) → migration otomasyonu + D1 yedek + Lighthouse ≥ 90 (FAZ 9)
- Light-only: CI’da `dark:` grep fail

---

## 17. Bilinçli Olarak Dışarıda Bırakılanlar (v1)

- Çok kiracılı (multi-tenant) mağaza
- Sepet / ödeme / sipariş (katalog + CMS odaklı)
- Dark tema
- Prisma
- Durable Objects (v1 ihtiyaç yok; gerekirse stok rezervasyonu vb. için sonra)
- Vectorize / AI arama (sonra eklenebilir)

> Faz sırası: [`PLAN.md`](./PLAN.md) · Görsel sistem: [`DESIGN.md`](./DESIGN.md)
