import { useState } from 'react';
import type { ApiResult } from '../../lib/api';
import { AdminFormStickyBar } from './AdminFormStickyBar';
import SeoFields, { emptySeoForm, seoFormFromMeta, type SeoFormValue } from './SeoFields';

type Status = 'draft' | 'published' | 'archived';

type BrandFormProps = {
  mode: 'create' | 'edit';
  brandId?: string;
  initial?: {
    name: string;
    slug: string;
    description: string;
    status: Status;
    seo?: {
      title?: string | null;
      description?: string | null;
      canonical?: string | null;
      ogImageUrl?: string | null;
      noindex?: boolean | null;
      robotsExtra?: string | null;
    } | null;
  };
};

export default function BrandForm({ mode, brandId, initial }: BrandFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [status, setStatus] = useState<Status>(initial?.status ?? 'draft');
  const [seo, setSeo] = useState<SeoFormValue>(
    initial?.seo ? seoFormFromMeta(initial.seo) : emptySeoForm(),
  );
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function onNameBlur() {
    if (!slug && name) {
      setSlug(
        name
          .toLocaleLowerCase('tr-TR')
          .replace(/ğ/g, 'g')
          .replace(/ü/g, 'u')
          .replace(/ş/g, 's')
          .replace(/ı/g, 'i')
          .replace(/ö/g, 'o')
          .replace(/ç/g, 'c')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, ''),
      );
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setFields({});
    const payload = {
      name,
      slug,
      description: description || null,
      status,
      seo: {
        title: seo.title || null,
        description: seo.description || null,
        canonical: seo.canonical || null,
        ogImageUrl: seo.ogImageUrl || null,
        noindex: seo.noindex,
        robotsExtra: seo.robotsExtra || null,
      },
    };
    const res = await fetch(mode === 'create' ? '/api/admin/brands' : `/api/admin/brands/${brandId}`, {
      method: mode === 'create' ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = (await res.json()) as ApiResult<{ brand: unknown }>;
    setSaving(false);
    if (!json.ok) {
      setError(json.error.message ?? 'Kayıt başarısız');
      if (json.error.fields) setFields(json.error.fields);
      return;
    }
    window.location.href = '/admin/brands?toast=saved';
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-4xl flex-col gap-8">
      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex max-w-xl flex-col gap-4">
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
            className="rounded-md border border-input bg-background px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />
          {fields.slug && <span className="text-destructive">{fields.slug}</span>}
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Açıklama</span>
          <textarea
            className="min-h-24 rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Durum</span>
          <select
            className="rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
          >
            <option value="draft">Taslak</option>
            <option value="published">Yayında</option>
            <option value="archived">Arşiv</option>
          </select>
        </label>
      </div>

      <section className="border-t border-border pt-6">
        <h2 className="mb-4 font-display text-lg font-semibold">SEO</h2>
        <SeoFields
          value={seo}
          onChange={setSeo}
          fallbackTitle={name}
          fallbackDescription={description}
          pathPreview={slug ? `/brand/${slug}` : '/brand/…'}
        />
      </section>

      <AdminFormStickyBar>
        <button
          type="submit"
          disabled={saving}
          className="min-h-11 flex-1 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 md:flex-none"
        >
          {saving ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
        <a
          href="/admin/brands"
          className="inline-flex min-h-11 items-center rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
        >
          İptal
        </a>
      </AdminFormStickyBar>
    </form>
  );
}
