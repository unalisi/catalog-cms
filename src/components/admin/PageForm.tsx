import { useState } from 'react';
import type { ApiResult } from '../../lib/api';

export default function PageForm() {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function onTitleBlur() {
    if (slug || !title) return;
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

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setFields({});
    const res = await fetch('/api/admin/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, slug, status }),
    });
    const json = (await res.json()) as ApiResult<{ page: { slug: string } }>;
    setSaving(false);
    if (!json.ok) {
      setError(json.error.message ?? 'Kayıt başarısız');
      if (json.error.fields) setFields(json.error.fields);
      return;
    }
    window.location.href = `/admin/builder/${json.data.page.slug}`;
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-4">
      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
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
          className="rounded-md border border-input bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
        />
        {fields.slug && <span className="text-destructive">{fields.slug}</span>}
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Durum</span>
        <select
          className="rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
        >
          <option value="draft">draft</option>
          <option value="published">published</option>
          <option value="archived">archived</option>
        </select>
      </label>
      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {saving ? 'Oluşturuluyor…' : 'Oluştur'}
      </button>
    </form>
  );
}
