# DESIGN.md — UI/UX Tasarım Sistemi

> **Tema:** Yalnızca **light** — dark tema yok.
> **Palet:** Siyah · Sarı (aksan) · Beyaz + nötr griler.
> **İlgili belgeler:** [`PLAN.md`](./PLAN.md) · [`ARCHITECTURE.md`](./ARCHITECTURE.md)

Bu belge public site ve admin panelinin **tek görsel sistemini** sabitler. Kurallar bağlayıcıdır.
Token’ların CSS uygulaması `src/styles/global.css` `:root` içindedir; Tailwind theme bu değişkenlere map edilir.

---

## 1. Temel Kurallar

1. **Yalnızca light.** `dark:`, tema anahtarı, `prefers-color-scheme` yok.
2. **Token üzerinden renk.** `text-white`, `bg-black`, `#fff`, `bg-[#...]` yasak; `bg-background`, `text-foreground`, `bg-primary` vb.
3. **En fazla 2 yazı tipi + mono.** Display/başlık bir aile; gövde bir aile; SKU/fiyat için mono.
4. **Sarı yalnızca aksan.** Büyük zemin rengi olarak kullanılmaz; CTA, focus, seçim, aktif nav.
5. **Kontrast WCAG AA.** Sarı üzerinde metin **daima siyah** (`--primary-foreground`).
6. **İki bağlam, bir sistem.** Public ferah; admin kompakt — aynı token’lar, farklı spacing yoğunluğu.
7. **Kart varsayılan değil.** Kart yalnızca etkileşim/gruplama gerçekten gerektiriyorsa; hero’da kart yok.

---

## 2. Renk Token’ları (sabit değerler)

Renk uzayı: **OKLCH** (tutarsız HSL kaçınılır). Aşağıdaki değerler başlangıç paletidir; ince ayar yapılırken roller değişmez.

### Ana

| Token | OKLCH (örnek) | Hex yaklaşım | Rol |
|---|---|---|---|
| `--background` | `oklch(1 0 0)` | `#FFFFFF` | Sayfa zemini |
| `--foreground` | `oklch(0.18 0 0)` | `#1A1A1A` | Ana metin (near-black) |
| `--primary` | — (hex sabit) | `#FFD700` | Sarı aksan / CTA / aktif nav |
| `--primary-foreground` | `oklch(0.18 0 0)` | `#1A1A1A` | Sarı üzeri metin |
| `--accent` | `oklch(0.18 0 0)` | `#1A1A1A` | Koyu blok / secondary güçlü |
| `--accent-foreground` | `oklch(0.99 0 0)` | `#FAFAFA` | Koyu blok metni |

### Nötr

| Token | Rol |
|---|---|
| `--muted` | Açık gri yüzey (tablo başlığı, soft panel) ≈ `#F4F4F5` |
| `--muted-foreground` | İkincil metin ≈ `#71717A` |
| `--border` | Ayraç ≈ `#E4E4E7` |
| `--input` | Form kenarlık (= border veya bir ton koyu) |
| `--ring` | Focus — primary temelli, görünür 2–3px halka |

### Durum (yalnızca geri bildirim)

| Token | Rol |
|---|---|
| `--success` | Başarı (yeşil) |
| `--warning` | Uyarı (amber — primary sarıdan ayrışır) |
| `--destructive` | Hata / sil |
| `--destructive-foreground` | Destructive üzeri metin (açık) |

**Palet disiplini:** Marka = siyah-sarı-beyaz + gri. Durum renkleri badge, toast, validasyon dışında dekoratif kullanılmaz. Mor/violet ana renk yok.

### Tailwind eşlemesi (kavramsal)

```
background → bg-background
foreground → text-foreground
primary → bg-primary text-primary-foreground
…
```

---

## 3. Tipografi

**Seçim (sabit):**
- **Display / başlık:** `DM Sans` (geometrik, güçlü) — Google Fonts veya self-host subset.
- **Gövde:** `Source Sans 3` (okuma odaklı) — başlıktan görsel olarak ayrışır.
- **Mono:** `IBM Plex Mono` — SKU, fiyat, grid hücreleri.

> Inter / Roboto / Arial / system-ui **varsayılan stack olarak kullanılmaz.** Self-host veya `font-display: swap` + subset.

### Ölçek

| Rol | Boyut | Line-height | Weight | Kullanım |
|---|---|---|---|---|
| Display / H1 | `clamp(2rem, 4vw, 3rem)` | 1.1 | 700 | Public hero / sayfa başlığı |
| H2 | 1.75rem | 1.2 | 700 | Bölüm |
| H3 | 1.375rem | 1.3 | 600 | Alt bölüm |
| Body-lg | 1.125rem | 1.6 | 400 | Lead |
| Body | 1rem | 1.6 | 400 | Gövde |
| Small | 0.875rem | 1.5 | 500 | Meta, tablo |
| Micro | 0.75rem | 1.4 | 600 | Etiket (uppercase + tracking) |

- Başlık: `text-balance`; uzun paragraf: `text-pretty`.
- Gövde &lt; 14px yasak.
- Admin’de bir kademe kompakt: sayfa H1 → H2 boyutuna yakın olabilir.

---

## 4. Uzay, Radius, Gölge, Layout

### Spacing
- Tailwind 4/8 ölçeği. Arbitrary `p-[13px]` yok.
- Boşluk için `gap-*`; `space-y/x` ile `gap` karıştırılmaz.
- Public section dikey ritmi: `py-16 md:py-24`.
- Admin içerik: `p-4 md:p-6`; form stack `gap-4`.

### Radius
| Token | Değer | Kullanım |
|---|---|---|
| `--radius` | `0.5rem` | Buton, input, card |
| `--radius-sm` | `0.25rem` | Badge, grid hücresi |
| `--radius-lg` | `0.75rem` | Modal |

### Gölge
- Minimal: dropdown, modal, sticky bar.
- Dekoratif çok katmanlı gölge yok.
- Ayrım önceliği: **border → sonra gölge**.

### Grid / container
- Public max genişlik: `max-w-6xl` veya `72rem` içerik; hero full-bleed zemin olabilir, metin container içinde.
- Admin: sabit sidebar `16rem` + `flex-1` main.

---

## 5. İkonografi & Görsel Dil

- Tek set: **Lucide** (16 / 20 / 24px).
- Emoji ikon yok.
- Gradient blob / bulanık dekoratif şekil yok.
- Ürün ve blog görselleri medya kütüphanesinden; gri placeholder kutusu bırakılmaz (empty state illüstrasyonu ayrı, geçici içerik değil).
- Gradient: yalnızca ince aksan gerekirse; ana yüzeyler düz token rengi.

---

## 6. Motion

Public’te **2–3 bilinçli hareket** (FAZ 4+ section’larda):

1. Hero metin: kısa fade/slide-up (~300ms, `ease-out`).
2. Ürün kartı hover: hafif translateY veya border vurgusu (gölge patlaması yok).
3. Sayfa section giriş: `prefers-reduced-motion: reduce` ile kapatılır.

Admin’de motion minimal: toast slide, modal fade. Grid’de animasyon yok (verim).

---

## 7. Bileşen Envanteri

Her bileşen: default / hover / focus / disabled / error / empty.

| Bileşen | Kurallar |
|---|---|
| **Button** | `primary` (sarı+siyah), `secondary` (siyah+açık metin), `outline`, `ghost`, `destructive`. Focus ring zorunlu. |
| **Input / Textarea / Select** | `border-input`, focus `ring-ring`, hata metni altında. |
| **Checkbox / Radio / Switch** | Seçili = primary. |
| **Card** | Beyaz + border; admin listelerinde isteğe bağlı. Public katalogda kart sınırlı kullanım. |
| **Table** | İnce ayraç; header `muted`; row hover. |
| **Data Grid** | §9 — Table’dan ayrı. |
| **Badge** | Micro uppercase; durum renkleri kontrollü. |
| **Toast** | Sağ-alt; success / warning / destructive. |
| **Modal** | Merkez; `accent` örtü %40–50 opacity. |
| **Sidebar** | Sabit; aktif öğe sol primary şerit + soft primary/10 zemin. |
| **Breadcrumb** | Admin başlık üstü. |
| **Empty state** | İkon + 1 cümle + 1 primary CTA. |
| **Skeleton** | `muted` pulse. |
| **Pagination** | Public + admin aynı dil. |

---

## 8. İki Bağlam

### Public
- Geniş boşluk, güçlü tipografi, section ritmi.
- Primary: CTA, aktif filtre, fiyat vurgusu, “öne çıkan” rozet.
- Hero: marka/ürün atmosferi — inset kart hero yok; full-bleed zemin veya edge-to-edge görsel tercih (`ARCHITECTURE` medya ile).
- İlk viewport bütçesi: marka sinyali + bir başlık + bir destek cümlesi + CTA grubu + bir baskın görsel. İstatistik şeridi / promo chip yığını yok.

### Admin
- Kompakt; **F-pattern**: collapsible sidebar (ikonlu, İçerik/Sistem grupları) + sticky topbar (Panel › crumb, arama, bildirim, profil) + main.
- Canvas: beyaz zemin (`bg-background`); paneller border’lı yüzey. Primary sarı sinyal + `primary-soft` aktif nav.
- Primary: aktif nav (sol primary şerit + soft fill), CTA’da siyah `accent` butonlar, grid seçim.
- Her ekran: breadcrumb (topbar) + içerik; Genel Bakış’ta StatStrip + hızlı aksiyonlar.
- Yoğun veri: tablo/grid; pazarlama süsleri yok.
- Toast: sağ-alt (Sonner); `?toast=` flash köprüsü.
- Durum: `StatusDot` — Yayında / Taslak / Gizli.

---

## 9. Ürün Data Grid (FAZ 3)

**Yapı**
- Sticky header + sticky ilk sütun (checkbox / ad).
- Kompakt satır; sayısal hücreler `font-mono`.
- Sütun resize; yatay/dikey scroll’da sticky korunur.

**Seçim**
| Mod | Görsel |
|---|---|
| Aktif hücre | 2px primary border |
| Aralık | primary/20 fill + border |
| Satır/sütun | header vurgusu + hat fill |
| Çoklu ayrık | her hücrede primary border |
| Dirty | köşe işaretçisi (primary veya warning) |

**Etkileşim**
- Dblclick / Enter → edit; Esc iptal; Tab / ok → gezin.
- Shift veya sürükle → aralık; Cmd/Ctrl → toggle.
- Paste (TSV); fill-down / fill-right.
- Bulk bar: “N hücre / M satır” + aksiyonlar.

**Durumlar:** boş katalog, filtre yok, saving, error+rollback, virtualization skeleton.

---

## 10. Section Görsel Spesifikasyonları (FAZ 4+)

Anasayfa önerilen set (1–10). `banner-cta`, `rich-text`, `gallery` editor’da kalır.

| Section | Görsel |
|---|---|
| **Hero** (`static` \| `slider`) | Full-bleed görsel + koyu/açık overlay; display tipografi; primary + outline CTA. Slider: React island (`HeroSlider`, `client:visible`) — autoplay ~5s, oklar, dots, klavye; `prefers-reduced-motion` → autoplay kapalı. Variant yoksa static; görsel yoksa mevcut radial gradient. Hero’da kart/chip yok. |
| **Kategori Grid** | Görsel tile + isim; 2–4 kolon; hover border |
| **Marka Şeridi** | Logo grid/şerit; `logoMediaId` → gerçek logo; yoksa monogram metin; gri → hover normal |
| **Neden Biz** (`why-us`) | 3–4 sütun değer bloğu; ikon monogram + başlık + metin; üst border ayraç |
| **Öne Çıkan Ürünler** | Ürün görseli + ad + fiyat mono; hover border tile |
| **İletişim Kanalları** (`contact-channels`) | Tel / WhatsApp / e-posta / form link; 2–3 kolon border tile |
| **Referanslar** (`references`) | Müşteri logo grid (medya listesi) |
| **Blog Önizleme** | Kapak + başlık + tarih; border tile grid |
| **Harita + İletişim** (`map-contact`) | Sol adres/telefon/e-posta; sağ iframe (`mapEmbedUrl`) veya harita linki |
| **SSS** | Ferah accordion; border ayraç |
| **Banner / CTA** | `accent` zemin + `accent-foreground` + primary buton |
| **Zengin Metin** | HTML + opsiyonel scoped CSS; prose tipografi; `sanitizeCmsHtml` / `scopeCmsCss` |
| **Galeri** | Grid; lightbox public island `client:visible` |
| **İletişim layout** (`contact-layout`) | 4 varyant: map-form, form-info, info-map, stacked; form → `/api/public/contact` |
| **Ürün listesi** (`product-list`) | Katalog grid + filtreler (CMS katalog sayfası) |
| **Blog listesi** (`blog-list`) | Blog yazı listesi (CMS blog sayfası) |

Mobile-first; `md:` / `lg:` kırılımları. Section padding: `py-16 md:py-24`, içerik `max-w-6xl` (float hariç).

---

## 11. Erişilebilirlik

- Klavye: özellikle grid, modal, sidebar.
- Görünür focus (`ring`) asla `outline-none` ile silinmez (yoksa eşdeğer ring).
- Semantik HTML + gerekli ARIA.
- Anlam yalnız renge bağlı olmaz.
- `alt` zorunlu; dekoratif `alt=""`.
- `prefers-reduced-motion` saygı.
- Kontrast AA; primary üzeri siyah.

---

## 12. Yasaklar

- ❌ Dark tema / `dark:` / tema toggle  
- ❌ Sabit renk utility (`text-white`, `bg-black`, raw hex class)  
- ❌ Inter/Roboto/Arial/system varsayılan marka fontu  
- ❌ Mor/violet ana tema, glow, aşırı gölge  
- ❌ Emoji ikon, blob dekor  
- ❌ Arbitrary spacing; `space-*` + `gap` karışımı  
- ❌ Hero’da kart / floating badge / promo chip yığını  
- ❌ Public’e gereksiz React island  

---

## 13. Dosya Eşlemesi

| Tasarım | Kod |
|---|---|
| Token’lar | `src/styles/global.css` `:root` |
| Font yükleme | `PublicLayout` / `AdminLayout` head |
| Primitifler | `src/components/ui/*` |
| Public | `src/components/public/*`, `sections/*` |
| Admin | `src/components/admin/*` |
| Grid | `src/components/admin/product-grid/*` |

> Teknik kararlar: [`ARCHITECTURE.md`](./ARCHITECTURE.md) · Fazlar: [`PLAN.md`](./PLAN.md)
