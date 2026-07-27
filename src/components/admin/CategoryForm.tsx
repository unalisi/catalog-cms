import { useState } from 'react';
import type { ApiResult } from '../../lib/api';

type Status = 'draft' | 'published' | 'archived';

type Option = { id: string; name: string };

type CategoryFormProps = {
  mode: 'create' | 'edit';
  categoryId?: string;
  parents: Option[];
  initial?: {
    name: string;
    slug: string;
    description: string;
    parentId: string;
    position: number;
    status: Status;
  };
};

export default function CategoryForm({ mode, categoryId, parents, initial }: CategoryFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [parentId, setParentId] = useState(initial?.parentId ?? '');
  const [position, setPosition] = useState(initial?.position ?? 0);
  const [status, setStatus] = useState<Status>(initial?.status ?? 'draft');
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
      parentId: parentId || null,
      position,
      status,
    };
    const res = await fetch(
      mode === 'create' ? '/api/admin/categories' : `/api/admin/categories/${categoryId}`,
      {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );
    const json = (await res.json()) as ApiResult<{ category: unknown }>;
    setSaving(false);
    if (!json.ok) {
      setError(json.error.message ?? 'Kayıt başarısız');
      if (json.error.fields) setFields(json.error.fields);
      return;
    }
    window.location.href = '/admin/categories?toast=saved';
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-4">
      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
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
        <span className="font-medium">Üst kategori</span>
        <select
          className="rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
        >
          <option value="">— Yok —</option>
          {parents
            .filter((p) => p.id !== categoryId)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </select>
        {fields.parentId && <span className="text-destructive">{fields.parentId}</span>}
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Sıra</span>
        <input
          type="number"
          min={0}
          className="rounded-md border border-input bg-background px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-ring"
          value={position}
          onChange={(e) => setPosition(Number(e.target.value))}
        />
        {fields.position && <span className="text-destructive">{fields.position}</span>}
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
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {saving ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
        <a
          href="/admin/categories"
          className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
        >
          İptal
        </a>
      </div>
    </form>
  );
}
