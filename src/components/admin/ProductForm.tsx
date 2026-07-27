import { useState } from 'react';
import type { ApiResult } from '../../lib/api';
import { mediaTransformPath } from '../../lib/media/urls';
import MediaPicker, { type MediaItem } from './MediaPicker';
import SeoFields, { emptySeoForm, seoFormFromMeta, type SeoFormValue } from './SeoFields';

type Status = 'draft' | 'published' | 'archived';

type BrandOption = { id: string; name: string };

type Variant = {
  id: string;
  sku: string | null;
  name: string;
  price: number;
  stock: number;
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
  const [price, setPrice] = useState(majorFromMinor(initial?.price ?? 0));
  const [stock, setStock] = useState(String(initial?.stock ?? 0));
  const [status, setStatus] = useState<Status>(initial?.status ?? 'draft');
  const [brandId, setBrandId] = useState(initial?.brandId ?? '');
  const [primaryMediaId, setPrimaryMediaId] = useState(initial?.primaryMediaId ?? '');
  const [primaryMediaPreview, setPrimaryMediaPreview] = useState(
    initial?.primaryMediaUrl ??
      (initial?.primaryMediaKey ? mediaTransformPath(initial.primaryMediaKey, 320) : ''),
  );
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

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setFields({});
    const payload = {
      name,
      slug,
      sku: sku || null,
      description: description || null,
      price: minorFromMajor(price),
      stock: Number.parseInt(stock, 10) || 0,
      status,
      brandId: brandId || null,
      primaryMediaId: primaryMediaId || null,
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
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Açıklama</span>
          <textarea
            className="min-h-24 rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
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
              className="rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="archived">archived</option>
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
          <div className="overflow-x-auto rounded-md border border-border">
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
        )}
      </section>

      <section className="flex flex-col gap-3 border-t border-border pt-6">
        <h2 className="font-display text-lg font-semibold">Medya</h2>
        {primaryMediaPreview ? (
          <img
            src={primaryMediaPreview}
            alt="Ürün görseli"
            className="h-40 w-40 rounded-md border border-border object-cover"
          />
        ) : (
          <p className="text-sm text-muted-foreground">Birincil görsel seçilmedi.</p>
        )}
        <div className="flex gap-3 text-sm">
          <button
            type="button"
            className="rounded-md border border-border px-3 py-1.5 hover:bg-muted"
            onClick={() => setPickerOpen(true)}
          >
            Medya seç
          </button>
          {primaryMediaId && (
            <button
              type="button"
              className="text-destructive hover:underline"
              onClick={() => {
                setPrimaryMediaId('');
                setPrimaryMediaPreview('');
              }}
            >
              Kaldır
            </button>
          )}
        </div>
        <MediaPicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={(media: MediaItem) => {
            setPrimaryMediaId(media.id);
            setPrimaryMediaPreview(
              media.mime === 'image/svg+xml' ? media.url : mediaTransformPath(media.key, 320),
            );
          }}
          title="Ürün görseli seç"
        />
      </section>

      <section className="border-t border-border pt-6">
        <h2 className="mb-4 font-display text-lg font-semibold">SEO</h2>
        <SeoFields
          value={seo}
          onChange={setSeo}
          fallbackTitle={name}
          fallbackDescription={description}
          pathPreview={slug ? `/product/${slug}` : '/product/…'}
        />
      </section>

      <div className="flex gap-3 border-t border-border pt-6">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Kaydediliyor…' : mode === 'create' ? 'Oluştur' : 'Kaydet'}
        </button>
        <a
          href="/admin/products"
          className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Geri
        </a>
      </div>
    </form>
  );
}
