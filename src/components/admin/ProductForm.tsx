import { lazy, Suspense, useState } from 'react';
import type { ApiResult } from '../../lib/api';
import { stripHtmlToText } from '../../lib/html/sanitize-product-description';
import { mediaTransformPath } from '../../lib/media/urls';
import { AdminFormStickyBar } from './AdminFormStickyBar';
import MediaPicker, { type MediaItem } from './MediaPicker';
import SeoFields, { emptySeoForm, seoFormFromMeta, type SeoFormValue } from './SeoFields';

const ProductDescriptionEditor = lazy(() => import('./ProductDescriptionEditor'));

type Status = 'draft' | 'published' | 'archived';

type BrandOption = { id: string; name: string };

type Variant = {
  id: string;
  sku: string | null;
  name: string;
  price: number;
  stock: number;
};

type GalleryItem = {
  id: string;
  key: string;
  url: string;
  alt: string;
  mime: string | null;
};

type ProductFormProps = {
  mode: 'create' | 'edit';
  productId?: string;
  brands: BrandOption[];
  initial?: {
    name: string;
    slug: string;
    sku: string;
    description: string;
    price: number;
    stock: number;
    status: Status;
    brandId: string;
    compareAtPrice: number | null;
    currency: string;
    primaryMediaId?: string | null;
    primaryMediaUrl?: string | null;
    primaryMediaKey?: string | null;
    gallery?: GalleryItem[];
    seo?: {
      title?: string | null;
      description?: string | null;
      canonical?: string | null;
      ogImageUrl?: string | null;
      noindex?: boolean | null;
      robotsExtra?: string | null;
    } | null;
  };
  variants?: Variant[];
};

function majorFromMinor(minor: number): string {
  return (minor / 100).toFixed(2);
}

function minorFromMajor(raw: string): number {
  const n = Number(raw.replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

function slugify(name: string): string {
  return name
    .toLocaleLowerCase('tr-TR')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function previewUrl(item: Pick<GalleryItem, 'key' | 'url' | 'mime'>): string {
  if (item.mime === 'image/svg+xml') return item.url;
  if (item.key) return mediaTransformPath(item.key, 320);
  return item.url;
}

function initialGallery(initial?: ProductFormProps['initial']): GalleryItem[] {
  if (initial?.gallery && initial.gallery.length > 0) return initial.gallery;
  if (initial?.primaryMediaId) {
    return [
      {
        id: initial.primaryMediaId,
        key: initial.primaryMediaKey ?? '',
        url: initial.primaryMediaUrl ?? '',
        alt: '',
        mime: null,
      },
    ];
  }
  return [];
}

export default function ProductForm({
  mode,
  productId,
  brands,
  initial,
  variants = [],
}: ProductFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [sku, setSku] = useState(initial?.sku ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [descriptionOpen, setDescriptionOpen] = useState(
    () => Boolean(initial?.description?.trim()),
  );
  const [price, setPrice] = useState(majorFromMinor(initial?.price ?? 0));
  const [stock, setStock] = useState(String(initial?.stock ?? 0));
  const [status, setStatus] = useState<Status>(initial?.status ?? 'draft');
  const [brandId, setBrandId] = useState(initial?.brandId ?? '');
  const [gallery, setGallery] = useState<GalleryItem[]>(() => initialGallery(initial));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [seo, setSeo] = useState<SeoFormValue>(
    initial?.seo ? seoFormFromMeta(initial.seo) : emptySeoForm(),
  );
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function onNameBlur() {
    if (!slug && name) setSlug(slugify(name));
  }

  function moveGalleryItem(index: number, dir: -1 | 1) {
    setGallery((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      const tmp = next[index]!;
      next[index] = next[target]!;
      next[target] = tmp;
      return next;
    });
  }

  function removeGalleryItem(id: string) {
    setGallery((prev) => prev.filter((g) => g.id !== id));
  }

  function addGalleryItem(media: MediaItem) {
    setGallery((prev) => {
      if (prev.some((g) => g.id === media.id)) return prev;
      return [
        ...prev,
        {
          id: media.id,
          key: media.key,
          url: media.url,
          alt: media.alt,
          mime: media.mime,
        },
      ];
    });
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setFields({});
    const mediaIds = gallery.map((g) => g.id);
    const payload = {
      name,
      slug,
      sku: sku || null,
      description: description || null,
      price: minorFromMajor(price),
      stock: Number.parseInt(stock, 10) || 0,
      status,
      brandId: brandId || null,
      primaryMediaId: mediaIds[0] ?? null,
      mediaIds,
      currency: initial?.currency ?? 'TRY',
      compareAtPrice: initial?.compareAtPrice ?? null,
      seo: {
        title: seo.title || null,
        description: seo.description || null,
        canonical: seo.canonical || null,
        ogImageUrl: seo.ogImageUrl || null,
        noindex: seo.noindex,
        robotsExtra: seo.robotsExtra || null,
      },
    };
    const res = await fetch(
      mode === 'create' ? '/api/admin/products' : `/api/admin/products/${productId}`,
      {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );
    const json = (await res.json()) as ApiResult<{ product: { id: string } }>;
    setSaving(false);
    if (!json.ok) {
      setError(json.error.message ?? 'Kayıt başarısız');
      if (json.error.fields) setFields(json.error.fields);
      return;
    }
    window.location.href =
      mode === 'create'
        ? `/admin/products/${json.data.product.id}?toast=saved`
        : '/admin/products?toast=saved';
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-4xl flex-col gap-8">
      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-semibold">Temel bilgiler</h2>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Ad</span>
          <input
            className="rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={onNameBlur}
            required
          />
          {fields.name && <span className="text-destructive">{fields.name}</span>}
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Slug</span>
          <input
            className="rounded-md border border-input bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />
          {fields.slug && <span className="text-destructive">{fields.slug}</span>}
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">SKU</span>
          <input
            className="rounded-md border border-input bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
          />
          {fields.sku && <span className="text-destructive">{fields.sku}</span>}
        </label>
        <div className="flex flex-col gap-1.5 text-sm">
          <button
            type="button"
            className="flex min-h-11 items-center justify-between rounded-md border border-border px-3 py-2 text-left font-medium hover:bg-muted"
            aria-expanded={descriptionOpen}
            onClick={() => setDescriptionOpen((open) => !open)}
          >
            <span>Açıklama</span>
            <span className="text-xs font-normal text-muted-foreground">
              {descriptionOpen ? 'Gizle' : 'Düzenle'}
            </span>
          </button>
          {!descriptionOpen && stripHtmlToText(description) ? (
            <p className="line-clamp-2 px-1 text-muted-foreground">{stripHtmlToText(description)}</p>
          ) : null}
          {descriptionOpen ? (
            <Suspense
              fallback={
                <div className="min-h-48 rounded-md border border-input bg-background px-3 py-2 text-muted-foreground">
                  Editör yükleniyor…
                </div>
              }
            >
              <ProductDescriptionEditor value={description} onChange={setDescription} />
            </Suspense>
          ) : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Fiyat (TRY)</span>
            <input
              className="rounded-md border border-input bg-background px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="decimal"
              required
            />
            {fields.price && <span className="text-destructive">{fields.price}</span>}
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Stok</span>
            <input
              className="rounded-md border border-input bg-background px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              inputMode="numeric"
              required
            />
            {fields.stock && <span className="text-destructive">{fields.stock}</span>}
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Marka</span>
            <select
              className="rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
            >
              <option value="">—</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Durum</span>
            <select
              className="min-h-11 rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
              aria-label="Ürün durumu"
            >
              <option value="published">Yayında</option>
              <option value="draft">Taslak</option>
              <option value="archived">Listedışı</option>
            </select>
          </label>
        </div>
      </section>

      <section className="flex flex-col gap-3 border-t border-border pt-6">
        <h2 className="font-display text-lg font-semibold">Varyantlar</h2>
        <p className="text-sm text-muted-foreground">
          Varyant yönetimi sonraki fazlarda genişletilecek. Şimdilik salt okunur liste.
        </p>
        {variants.length === 0 ? (
          <p className="text-sm text-muted-foreground">Varyant yok.</p>
        ) : (
          <>
            <div className="flex flex-col gap-2 md:hidden">
              {variants.map((v) => (
                <article key={v.id} className="rounded-md border border-border p-3 text-sm">
                  <p className="font-semibold">{v.name}</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{v.sku ?? '—'}</p>
                  <div className="mt-2 flex gap-4 text-xs">
                    <span>
                      Fiyat: <span className="font-mono">{majorFromMinor(v.price)}</span>
                    </span>
                    <span>
                      Stok: <span className="font-mono">{v.stock}</span>
                    </span>
                  </div>
                </article>
              ))}
            </div>
            <div className="hidden overflow-x-auto rounded-md border border-border md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">Ad</th>
                    <th className="px-3 py-2 font-medium">SKU</th>
                    <th className="px-3 py-2 font-medium">Fiyat</th>
                    <th className="px-3 py-2 font-medium">Stok</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v) => (
                    <tr key={v.id} className="border-t border-border">
                      <td className="px-3 py-2">{v.name}</td>
                      <td className="px-3 py-2 font-mono text-muted-foreground">{v.sku ?? '—'}</td>
                      <td className="px-3 py-2 font-mono">{majorFromMinor(v.price)}</td>
                      <td className="px-3 py-2 font-mono">{v.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section className="flex flex-col gap-3 border-t border-border pt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold">Ürün görselleri</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              İlk görsel birincil görseldir. Sıralama ürün detay slider’ında kullanılır.
            </p>
          </div>
          <button
            type="button"
            className="min-h-11 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
            onClick={() => setPickerOpen(true)}
          >
            Görsel ekle
          </button>
        </div>
        {gallery.length === 0 ? (
          <p className="text-sm text-muted-foreground">Henüz görsel yok.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {gallery.map((item, index) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center gap-3 rounded-md border border-border p-3"
              >
                <img
                  src={previewUrl(item)}
                  alt={item.alt || 'Ürün görseli'}
                  className="h-20 w-20 rounded-md border border-border object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {index === 0 ? 'Birincil görsel' : `Görsel ${index + 1}`}
                  </p>
                  <p className="truncate font-mono text-xs text-muted-foreground">{item.id}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="min-h-10 rounded-md border border-border px-2 text-sm hover:bg-muted disabled:opacity-40"
                    disabled={index === 0}
                    onClick={() => moveGalleryItem(index, -1)}
                    aria-label="Yukarı taşı"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="min-h-10 rounded-md border border-border px-2 text-sm hover:bg-muted disabled:opacity-40"
                    disabled={index === gallery.length - 1}
                    onClick={() => moveGalleryItem(index, 1)}
                    aria-label="Aşağı taşı"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="min-h-10 text-sm text-destructive hover:underline"
                    onClick={() => removeGalleryItem(item.id)}
                  >
                    Kaldır
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <MediaPicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={(media: MediaItem) => {
            addGalleryItem(media);
            setPickerOpen(false);
          }}
          title="Ürün görseli ekle"
        />
      </section>

      <section className="border-t border-border pt-6">
        <h2 className="mb-4 font-display text-lg font-semibold">SEO</h2>
        <SeoFields
          value={seo}
          onChange={setSeo}
          fallbackTitle={name}
          fallbackDescription={stripHtmlToText(description)}
          pathPreview={slug ? `/product/${slug}` : '/product/…'}
        />
      </section>

      <AdminFormStickyBar>
        <button
          type="submit"
          disabled={saving}
          className="min-h-11 flex-1 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 md:flex-none"
        >
          {saving ? 'Kaydediliyor…' : mode === 'create' ? 'Oluştur' : 'Kaydet'}
        </button>
        <a
          href="/admin/products"
          className="inline-flex min-h-11 items-center rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          Geri
        </a>
      </AdminFormStickyBar>
    </form>
  );
}
