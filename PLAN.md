# PLAN.md — Fazlı Geliştirme Yol Haritası

> **Proje:** Cloudflare tabanlı Ürün Katalog + İçerik Yönetim Sistemi (CMS)
> **Kurulum:** Sıfırdan Astro 7 + `@astrojs/cloudflare` (Next.js migrasyonu yok)
> **Hedef mimari:** Astro · Workers · D1 · KV · R2 · Images · Queues · Drizzle · Zod
> **Tema:** Yalnızca **light** — Siyah / Sarı / Beyaz ([`DESIGN.md`](./DESIGN.md))
> **Odak:** SEO + hız
> **İlgili belgeler:** [`ARCHITECTURE.md`](./ARCHITECTURE.md) · [`DESIGN.md`](./DESIGN.md)

Her faz: **kapsam → çıktılar → kabul kriterleri → bağımlılıklar**.
Kabul kriterleri karşılanmadan sonraki faza geçilmez (Definition of Done kapısı).
Teknik çelişkide [`ARCHITECTURE.md`](./ARCHITECTURE.md) üstündür.

---

## 0. Prensipler (tüm fazlarda)

1. **Tutarlılık önce.** Domain sözlüğü, binding isimleri ve klasör kuralları `ARCHITECTURE.md`’ye bağlıdır.
2. **Yalnızca light tema.** `dark:`, tema anahtarı, `prefers-color-scheme` yok.
3. **Cache-first okuma.** Public: KV → miss’te D1; yazımda hedefli invalidation.
4. **Admin birinci sınıf.** SEO, Blog, Product Edit, Section Edit, Import sonradan “yama” değil.
5. **Her yazım doğrulanır.** Zod + sunucu auth; API zarfı `{ ok, data | error }`.
6. **Kör nokta yok.** Seed + empty state + hata durumu birlikte teslim.
7. **SEO ve hız birlikte.** Her public route’ta meta/JSON-LD ve JS bütçesi düşünülür.
8. **Greenfield disiplin.** FAZ 0’da iskelet doğru kurulur; “sonra düzeltiriz” borç birikmez.
9. **Repo + Worker erken.** GitHub remote ve ilk `workers.dev` deploy FAZ 0 çıktısıdır; deploy “son gün” işi değildir.

---

## FAZ 0 — Greenfield İskelet · GitHub · Workers

**Kapsam** (sıra bağlayıcı — [`ARCHITECTURE.md`](./ARCHITECTURE.md) §13)

1. **Astro iskelet:** Astro 6 + `@astrojs/cloudflare` + React + Tailwind; klasör yapısı; light-only token’lar; `/health`; layout kabukları.
2. **Cloudflare kaynakları:** `wrangler login` → D1 / KV (`CACHE`, `SESSION`) / R2 oluştur; `wrangler.jsonc` binding’leri doldur; `nodejs_compat` + `observability`; `wrangler types`.
3. **GitHub init:** `git init` → `.gitignore` (`.dev.vars`, `node_modules`, `.wrangler`, dist) → ilk commit → GitHub repo oluştur (`gh repo create`) → `main` push.
4. **Worker oluştur + ilk deploy:** `npm run build` → `wrangler deploy` (Worker adı = `wrangler.jsonc` `name`) → `workers.dev` URL’de `/health` doğrula.
5. **Git ↔ Workers bağla (CI temeli):** Dashboard **Workers Builds** ile GitHub repo’yu Worker’a bağla *veya* GitHub Actions iskeleti ekle (`ARCHITECTURE.md` §13.4). `main` push → otomatik build/deploy hedefi.

**Çıktılar**
- `astro.config.mjs`, `wrangler.jsonc`, `drizzle.config.ts`, `package.json` scripts: `dev`, `build`, `deploy`, `types`.
- `src/styles/global.css`, `src/middleware.ts`, `src/pages/index.astro`, `src/pages/api/health.ts`.
- GitHub remote (`origin`), korumalı olmasa bile `main` branch.
- Canlı Worker (`*.workers.dev`) + (opsiyonel) Workers Builds / `.github/workflows/deploy.yml` iskeleti.
- README: local (`wrangler dev`), secret’lar, binding oluşturma, deploy, GitHub bağlantısı.

**Kabul kriterleri**
- [ ] `wrangler dev` ayağa kalkar; local `/health` → `{ ok: true }`.
- [ ] GitHub’da private/public repo var; `main`’de en az bir commit; `.dev.vars` ve secret’lar commit edilmemiş.
- [ ] `wrangler deploy` başarılı; production `/health` 200.
- [ ] Worker `name` dashboard ile `wrangler.jsonc` içinde aynı.
- [ ] `main` push sonrası otomatik deploy yolu tanımlı (Workers Builds **veya** Actions) — en azından dokümante + yapılandırılmış.
- [ ] Repoda `dark:` / tema anahtarı yok; renkler token üzerinden; `wrangler types` typecheck’te; lint + typecheck geçer.

**Bağımlılıklar:** Cloudflare hesabı + `wrangler login`; GitHub hesabı + `gh` auth (veya manuel remote)

---

## FAZ 1 — Veri Katmanı & Public Katalog

**Kapsam**
- Drizzle şema (ürün, marka, kategori, medya, settings, seo_meta iskeleti) + ilk migration + seed.
- `server/db.ts`, `server/repos/*`, `lib/cache/*` (get/set/invalidate + list versioning).
- Public: ana sayfa (statik veya basit seed section), `/catalog`, `/product/[slug]`, `/brand/[slug]`, `/category/[slug]`.
- Temel meta (title/description/canonical), `sitemap.xml`, `robots.txt`.
- 404 + boş liste UI (`DESIGN.md`).

**Çıktılar**
- `db/schema/*`, `db/migrations/*`, `db/seed.ts`.
- Cache key sözleşmesi (`ARCHITECTURE.md` §6) uygulanmış.
- Public route’lar SSR + KV.

**Kabul kriterleri**
- [ ] Seed ile en az 1 marka, 2 kategori, 5 ürün public’te görünür.
- [ ] Aynı ürünün ikinci isteği KV hit (log veya debug header ile kanıt).
- [ ] Mutasyon yokken bile sitemap yayınlanan URL’leri listeler.
- [ ] Bilinmeyen slug → 404 sayfası (tasarıma uygun).
- [ ] Fiyat integer minor unit; float yok.

**Bağımlılıklar:** FAZ 0

---

## FAZ 2 — Admin CMS Çekirdeği

**Kapsam**
- `users` + session auth (Astro Sessions / `SESSION` KV).
- `/admin/login`, guard middleware, admin shell (sidebar, topbar, breadcrumb).
- Marka CRUD, Kategori CRUD (parent ağaç).
- Ortak admin UI: form, tablo, toast, modal, confirm, empty state (`DESIGN.md` §6–7).
- Yazımlarda CACHE invalidation.

**Çıktılar**
- `src/server/auth/*`, `/admin/brands`, `/admin/categories`, dashboard özet kartları (sayaçlar).
- Paylaşılan zod şemaları `src/lib/validation/*`.

**Kabul kriterleri**
- [ ] Oturumsuz `/admin/*` ve `/api/admin/*` erişilemez.
- [ ] Marka/kategori CRUD çalışır; ilgili KV key’leri silinir/versiyon artar.
- [ ] Alan bazlı validasyon hataları formda görünür.
- [ ] Shell: aktif nav + breadcrumb her sayfada tutarlı.
- [ ] Light-only; sarı yalnızca aksan (DESIGN).

**Bağımlılıklar:** FAZ 1

---

## FAZ 3 — Excel-Benzeri Ürün Data Grid (Kritik)

**Kapsam**
- `/admin/products` sanallaştırılmış grid; `/admin/products/[id]` tam form (varyant, medya, SEO alanları iskeleti).
- Seçim: tek hücre, çoklu (Cmd/Ctrl), aralık (Shift/sürükle), satır/sütun/tümü.
- Inline edit, Tab/ok tuşları, Esc, Excel paste, fill-down/right.
- Bulk bar + `PATCH /api/admin/products/bulk` (transaction, kısmi hata, optimistic + rollback).
- Her başarılı yazımda cache invalidation.

**Çıktılar**
- `src/components/admin/product-grid/*` (React island).
- Bulk API + service katmanı.

**Kabul kriterleri**
- [x] Klavye gezinme tam (ok, Tab, Enter, Esc).
- [x] Tüm seçim modları görsel olarak ayırt edilir (`DESIGN.md` §8).
- [x] Tab-ayraçlı paste doğru hücrelere dağılır.
- [x] ≥ 1.000 satırda virtualization ile akıcı scroll.
- [x] Sunucu hatasında optimistic rollback + toast.
- [x] Grid yazımı public ürün cache’ini bozar (miss doğrulanır).

**Bağımlılıklar:** FAZ 2

---

## FAZ 4 — Section-Bazlı Sayfa Düzenleyici

**Kapsam**
- `pages` + `page_sections`; section registry (`ARCHITECTURE.md` §12).
- `/admin/pages`, `/admin/pages/[slug]`: ekle, DnD sırala, görünürlük, sil, tipli config form.
- Public section render motoru; bilinmeyen tip yoksayılır.
- Ana sayfa (`home`) section’lardan beslenir.

**Çıktılar**
- `src/components/sections/*`, `section-registry.ts`.
- Canlı önizleme (admin içinde iframe veya yan panel — FAZ içinde netleştir, tek yaklaşım seç).

**Kabul kriterleri**
- [x] DnD sırası kalıcı.
- [x] Her section tipi şemaya göre form üretir.
- [x] `is_visible=false` public’te görünmez.
- [x] Bilinmeyen tip public’i kırmaz.
- [x] `page:{slug}` cache invalidation çalışır.

**Bağımlılıklar:** FAZ 2 (tercihen FAZ 3 ile paralel değil; grid bittikten sonra odak)

---

## FAZ 5 — SEO Modülü (Kritik)

**Kapsam**
- Varlık SEO alanları (ürün, marka, kategori, sayfa, post): title, description, canonical, OG, noindex.
- Slug benzersizliği; değişince otomatik `redirects` + middleware 301.
- JSON-LD: `Organization`, `WebSite`, `Product`, `BreadcrumbList` (+ Article FAZ 6’da tamamlanır).
- `/admin/seo`: global defaults + yönlendirme listesi.
- Meta SERP/OG önizleme bileşeni.
- Sitemap/robots `noindex` ve status’a duyarlı; KV cache.

**Çıktılar**
- `src/lib/seo/*`, admin SEO paneli (gömülü + global).
- Redirect middleware entegrasyonu.

**Kabul kriterleri**
- [x] Her public sayfada title, description, canonical, OG.
- [x] Slug değişimi eski path’i 301 eder.
- [x] JSON-LD Rich Results açısından geçerli yapı.
- [x] `noindex` sitemap’te yok + robots meta.
- [x] Fallback meta (seo_meta boşsa) tutarlı üretilir.

**Bağımlılıklar:** FAZ 1, FAZ 4 (sayfa SEO’su için)

---

## FAZ 6 — Blog Modülü

**Kapsam**
- Post CRUD; etiketler; zengin içerik (MDX veya sanitizli HTML — **tek format seç, dokümante et**).
- Taslak / yayın / planlı (`published_at`).
- Public `/blog`, `/blog/[slug]`, `rss.xml`, `Article` JSON-LD.
- Section: `blog-preview` gerçek veriden beslenir.

**Çıktılar**
- Admin blog ekranları; `posts` şeması; RSS endpoint.

**Kabul kriterleri**
- [ ] CRUD + yayın/planlama çalışır.
- [ ] Liste sayfalanır; detay SEO + Article JSON-LD.
- [ ] `rss.xml` geçerli.
- [ ] Blog önizleme section’ı güncel yazıları gösterir.

**Bağımlılıklar:** FAZ 5

---

## FAZ 7 — WordPress / Katalog İçe Aktarımı (Kritik)

**Kapsam**
- Ortak pipeline: WooCommerce REST, CSV, WXR → `ImportRecord` → staging → dry-run → apply.
- Apply: `IMPORT_QUEUE` batch; consumer upsert + medya R2 kopyası.
- Mapping UI + kaydedilebilir profil; çakışma politikası `skip | overwrite | merge`.
- Job raporlama; kısmi başarı; tekrar çalıştırılabilirlik.

**Çıktılar**
- `/admin/import` sihirbazı.
- `src/server/import/**`, queue consumer, `import_jobs` / `import_items`.

**Kabul kriterleri**
- [ ] Üç kaynak aynı normalize modele map’lenir.
- [ ] Dry-run D1 ürün tablosuna yazmadan rapor üretir.
- [ ] Upsert SKU/slug ile çift kayıt oluşturmaz.
- [ ] Uzak görseller R2’ye yazılır ve `media` bağlanır.
- [ ] Büyük iş Queue’da; HTTP timeout’a takılmaz; job izlenebilir.

**Bağımlılıklar:** FAZ 3 (ürün modeli), FAZ 8 (medya upload yolu) — FAZ 8 tamamlanmadan apply’da medya adımı bloklanır; parse/dry-run FAZ 8 ile kısmen paralel gidebilir.

---

## FAZ 8 — Medya Kütüphanesi & Site Ayarları

**Kapsam**
- `/admin/media`: yükleme, arama, alt-text, silme.
- R2 + Images transform URL’leri; tanımlı genişlik seti.
- Medya seçici (ürün, section, blog formlarına gömülü).
- `/admin/settings`: logo, favicon, iletişim, sosyal, analytics, varsayılan SEO, navigasyon.
- `settings:site` / `nav:main` cache.

**Çıktılar**
- Media API + UI; settings service; public header/footer ayarlardan beslenir.

**Kabul kriterleri**
- [ ] Upload R2’ye gider; public’te transform URL çalışır.
- [ ] Medya seçici tüm içerik formlarından açılır.
- [ ] Settings değişince public header/footer/meta güncellenir (cache invalidate).
- [ ] Alt-text zorunlu veya uyarılı (a11y).

**Bağımlılıklar:** FAZ 1; admin shell için FAZ 2

**Not:** Pratik sıra — FAZ 3 sonrası erken başlanabilir; FAZ 7 apply için tamamlanmış olmalı.

---

## FAZ 9 — Sertleştirme, Performans & Yayın

**Kapsam**
- a11y (klavye, AA, ARIA); Lighthouse / CWV.
- Güvenlik: rate limit, CSRF, CSP gözden geçirme, secret denetimi.
- **CI/CD olgunlaştırma** (FAZ 0’daki GitHub + Workers bağının üzerine): typecheck → build → **D1 migrations apply** → deploy; preview için non-`main` branch (`wrangler versions upload`); custom domain; D1 export yedek + restore testi.
- 404/500, boş durumlar, gözlemlenebilirlik (log alanları).
- Performans bütçesi (`ARCHITECTURE.md` §14) doğrulama.

**Çıktılar**
- Tam deploy pipeline (migration dahil), backup script, QA checklist, rollback runbook, custom domain.

**Kabul kriterleri**
- [ ] Public Lighthouse ≥ 90 (Performance, SEO, BP, a11y).
- [ ] Admin klavye ile kullanılabilir; kontrast AA.
- [ ] `main` pipeline migration dahil deploy eder; rollback dokümante.
- [ ] PR/non-production branch preview URL üretir (Workers Builds veya Actions).
- [ ] D1 yedek alınıp restore test edildi.
- [ ] `dark:` ve yasaklı sabit renk grep’leri CI’da kırmızıya düşer.

**Bağımlılıklar:** FAZ 1–8 (kritik path: 0→1→2→3→4→5→6; 8 medya; 7 import; sonra 9)

---

## Faz Bağımlılık Özeti

```
FAZ 0 ─▶ FAZ 1 ─▶ FAZ 2 ─┬─▶ FAZ 3 ─▶ FAZ 7 (import; medya için FAZ 8 gerekir)
                         ├─▶ FAZ 4 ─▶ FAZ 5 ─▶ FAZ 6
                         └─▶ FAZ 8 (medya/settings; 3’ten sonra erken başlanabilir)
                                    │
Tümü ───────────────────────────────┴──▶ FAZ 9
```

**Önerilen kritik yol (SEO + hız odaklı ürün):**  
`0 → 1 → 2 → 8 (temel medya) → 3 → 4 → 5 → 6 → 7 → 9`

---

## Kritik Modül Haritası

| Modül | Faz | Başarı ölçütü |
|---|---|---|
| **Ürün data grid** | 3 | Hücre seçim + bulk + paste + 1k satır |
| **Product Edit** | 3 | Grid + detay form (varyant/medya/SEO) |
| **Section Edit** | 4 | Registry + DnD + görünürlük |
| **SEO** | 5 | Meta + 301 + JSON-LD + sitemap |
| **Blog** | 6 | CRUD + RSS + Article |
| **WP Import** | 7 | REST + CSV + WXR + Queue |
| **Medya** | 8 | R2 + Images + seçici |

---

## FAZ 0 Komut İskeleti (referans)

Sıra: **iskelet → Cloudflare kaynakları → GitHub → ilk deploy → Git CI bağla**.  
Tam adımlar ve alternatifler: [`ARCHITECTURE.md`](./ARCHITECTURE.md) §13.

```bash
# 1) Astro + adapter
npm create astro@latest . -- --template minimal --typescript strict --no-install=false
npx astro add cloudflare react tailwind
npm i drizzle-orm zod
npm i -D drizzle-kit wrangler @types/node

# 2) Cloudflare hesabı + kaynaklar (wrangler.jsonc id'lerini doldur)
npx wrangler login
npx wrangler d1 create catalog-db
npx wrangler kv namespace create CACHE
npx wrangler kv namespace create SESSION
npx wrangler r2 bucket create catalog-media
npx wrangler types

# 3) GitHub init
# .gitignore: node_modules, dist, .wrangler, .dev.vars, .env*
git init -b main
git add .
git commit -m "chore: scaffold catalog cms (astro + cloudflare)"
gh repo create catalog-cms --private --source=. --remote=origin --push
# gh yoksa: GitHub'da boş repo aç → git remote add origin <url> → git push -u origin main

# 4) İlk Worker deploy (name = wrangler.jsonc "name")
npm run build
npx wrangler deploy
# workers.dev URL + /health doğrula
# npx wrangler secret put SESSION_SECRET

# 5) Git → otomatik deploy
# Tercih A: Dashboard → Worker → Settings → Builds → Connect GitHub (branch: main)
# Tercih B: .github/workflows/deploy.yml + CLOUDFLARE_API_TOKEN / ACCOUNT_ID secrets
```

`package.json` script örnekleri: `"dev": "astro dev"`, `"build": "astro build"`, `"deploy": "astro build && wrangler deploy"`, `"types": "wrangler types"`.

Detaylar: [`ARCHITECTURE.md`](./ARCHITECTURE.md). Görsel: [`DESIGN.md`](./DESIGN.md).
