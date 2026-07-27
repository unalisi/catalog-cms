import { useState } from 'react';
import type { ApiResult } from '../../lib/api';
import { mediaTransformPath } from '../../lib/media/urls';
import MediaPicker, { type MediaItem } from './MediaPicker';
import SeoFields, { emptySeoForm, seoFormFromMeta, type SeoFormValue } from './SeoFields';

type Status = 'draft' | 'published' | 'archived';

type PostFormProps = {
  mode: 'create' | 'edit';
  postId?: string;
  initial?: {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    status: Status;
    publishedAt: string;
    tags: string;
    coverMediaId?: string | null;
    coverMediaUrl?: string | null;
    coverMediaKey?: string | null;
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

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function PostForm({ mode, postId, initial }: PostFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [status, setStatus] = useState<Status>(initial?.status ?? 'draft');
  const [publishedAt, setPublishedAt] = useState(toDatetimeLocal(initial?.publishedAt));
  const [tags, setTags] = useState(initial?.tags ?? '');
  const [coverMediaId, setCoverMediaId] = useState(initial?.coverMediaId ?? '');
  const [coverPreview, setCoverPreview] = useState(
    initial?.coverMediaUrl ??
      (initial?.coverMediaKey ? mediaTransformPath(initial.coverMediaKey, 640) : ''),
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [seo, setSeo] = useState<SeoFormValue>(
    initial?.seo ? seoFormFromMeta(initial.seo) : emptySeoForm(),
  );
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function onTitleBlur() {
    if (!slug && title) {
      setSlug(
        title
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

    let publishedAtIso: string | null = null;
    if (publishedAt.trim()) {
      const d = new Date(publishedAt);
      if (Number.isNaN(d.getTime())) {
        setFields({ publishedAt: 'Geçerli bir tarih girin' });
        setSaving(false);
        return;
      }
      publishedAtIso = d.toISOString();
    }

    const payload = {
      title,
      slug,
      excerpt: excerpt || null,
      content,
      status,
      publishedAt: publishedAtIso,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      coverMediaId: coverMediaId || null,
      seo: {
        title: seo.title || null,
        description: seo.description || null,
        canonical: seo.canonical || null,
        ogImageUrl: seo.ogImageUrl || null,
        noindex: seo.noindex,
        robotsExtra: seo.robotsExtra || null,
      },
    };

    const res = await fetch(mode === 'create' ? '/api/admin/posts' : `/api/admin/posts/${postId}`, {
      method: mode === 'create' ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = (await res.json()) as ApiResult<{ post: unknown }>;
    setSaving(false);
    if (!json.ok) {
      setError(json.error.message ?? 'Kayıt başarısız');
      if (json.error.fields) setFields(json.error.fields);
      return;
    }
    window.location.href = '/admin/blog?toast=saved';
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
          <span className="font-medium">Başlık</span>
          <input
            className="rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={onTitleBlur}
            required
          />
          {fields.title && <span className="text-destructive">{fields.title}</span>}
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
          <span className="font-medium">Özet</span>
          <textarea
            className="min-h-20 rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            maxLength={500}
          />
          {fields.excerpt && <span className="text-destructive">{fields.excerpt}</span>}
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">İçerik (HTML)</span>
          <textarea
            className="min-h-56 rounded-md border border-input bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            spellCheck={false}
          />
          <span className="text-xs text-muted-foreground">
            Sanitize edilmiş HTML (p, strong, a, listeler, h2–h4…). MDX kullanılmaz.
          </span>
          {fields.content && <span className="text-destructive">{fields.content}</span>}
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
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
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Yayın tarihi</span>
            <input
              type="datetime-local"
              className="rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
            />
            <span className="text-xs text-muted-foreground">
              Gelecek tarih = planlı yayın. Boş + yayında = şimdi.
            </span>
            {fields.publishedAt && <span className="text-destructive">{fields.publishedAt}</span>}
          </label>
        </div>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Etiketler</span>
          <input
            className="rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="cms, duyuru, performans"
          />
          <span className="text-xs text-muted-foreground">Virgülle ayırın.</span>
        </label>

        <div className="flex flex-col gap-2 text-sm">
          <span className="font-medium">Kapak görseli</span>
          {coverPreview ? (
            <img
              src={coverPreview}
              alt="Kapak"
              className="h-40 w-full max-w-md rounded-md border border-border object-cover"
            />
          ) : (
            <p className="text-muted-foreground">Seçilmedi.</p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              className="rounded-md border border-border px-3 py-1.5 hover:bg-muted"
              onClick={() => setPickerOpen(true)}
            >
              Medya seç
            </button>
            {coverMediaId && (
              <button
                type="button"
                className="text-destructive hover:underline"
                onClick={() => {
                  setCoverMediaId('');
                  setCoverPreview('');
                }}
              >
                Kaldır
              </button>
            )}
          </div>
        </div>
      </div>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(media: MediaItem) => {
          setCoverMediaId(media.id);
          setCoverPreview(
            media.mime === 'image/svg+xml' ? media.url : mediaTransformPath(media.key, 640),
          );
        }}
        title="Kapak görseli seç"
      />

      <section className="border-t border-border pt-6">
        <h2 className="mb-4 font-display text-lg font-semibold">SEO</h2>
        <SeoFields
          value={seo}
          onChange={setSeo}
          fallbackTitle={title}
          fallbackDescription={excerpt}
          pathPreview={slug ? `/blog/${slug}` : '/blog/…'}
        />
      </section>

      <div className="flex gap-3 border-t border-border pt-6">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {saving ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
        <a href="/admin/blog" className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">
          İptal
        </a>
        {mode === 'edit' && slug && (
          <a
            href={`/blog/${slug}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
          >
            Önizle
          </a>
        )}
      </div>
    </form>
  );
}
