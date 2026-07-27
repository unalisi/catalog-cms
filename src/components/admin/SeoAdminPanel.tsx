import { useState } from 'react';
import type { ApiResult } from '../../lib/api';
import type { SeoDefaults } from '../../lib/validation/seo';

type Redirect = {
  id: string;
  fromPath: string;
  toPath: string;
  statusCode: number;
  createdAt: string;
};

type Props = {
  initialDefaults: SeoDefaults;
  initialRedirects: Redirect[];
};

export default function SeoAdminPanel({ initialDefaults, initialRedirects }: Props) {
  const [defaults, setDefaults] = useState(initialDefaults);
  const [redirects, setRedirects] = useState(initialRedirects);
  const [fromPath, setFromPath] = useState('');
  const [toPath, setToPath] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function saveDefaults() {
    setSaving(true);
    setError(null);
    const res = await fetch('/api/admin/seo/defaults', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(defaults),
    });
    const json = (await res.json()) as ApiResult<{ defaults: SeoDefaults }>;
    setSaving(false);
    if (!json.ok) {
      setError(json.error.message);
      return;
    }
    setDefaults(json.data.defaults);
    setMessage('SEO varsayılanları kaydedildi');
  }

  async function addRedirect() {
    setSaving(true);
    setError(null);
    const res = await fetch('/api/admin/seo/redirects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromPath, toPath, statusCode: 301 }),
    });
    const json = (await res.json()) as ApiResult<{ redirect: Redirect }>;
    setSaving(false);
    if (!json.ok) {
      setError(json.error.message);
      return;
    }
    setRedirects((prev) => [...prev, json.data.redirect].sort((a, b) => a.fromPath.localeCompare(b.fromPath)));
    setFromPath('');
    setToPath('');
    setMessage('Yönlendirme eklendi');
  }

  async function removeRedirect(id: string) {
    if (!window.confirm('Yönlendirme silinsin mi?')) return;
    const res = await fetch(`/api/admin/seo/redirects/${id}`, { method: 'DELETE' });
    const json = (await res.json()) as ApiResult<unknown>;
    if (!json.ok) {
      setError(json.error.message);
      return;
    }
    setRedirects((prev) => prev.filter((r) => r.id !== id));
    setMessage('Yönlendirme silindi');
  }

  return (
    <div className="flex flex-col gap-10">
      {(message || error) && (
        <p
          className={`rounded-md border px-3 py-2 text-sm ${
            error
              ? 'border-destructive/30 bg-destructive/10 text-destructive'
              : 'border-border bg-muted/40'
          }`}
        >
          {error ?? message}
        </p>
      )}

      <section className="flex max-w-2xl flex-col gap-4">
        <h2 className="font-display text-lg font-semibold">Global varsayılanlar</h2>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Site adı</span>
          <input
            className="rounded-md border border-input bg-background px-3 py-2"
            value={defaults.siteName}
            onChange={(e) => setDefaults({ ...defaults, siteName: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Title şablonu</span>
          <input
            className="rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
            value={defaults.titleTemplate}
            onChange={(e) => setDefaults({ ...defaults, titleTemplate: e.target.value })}
          />
          <span className="text-xs text-muted-foreground">%s = sayfa başlığı</span>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Varsayılan description</span>
          <textarea
            className="min-h-20 rounded-md border border-input bg-background px-3 py-2"
            value={defaults.defaultDescription}
            onChange={(e) => setDefaults({ ...defaults, defaultDescription: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Varsayılan OG image</span>
          <input
            className="rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
            value={defaults.defaultOgImageUrl ?? ''}
            onChange={(e) => setDefaults({ ...defaults, defaultOgImageUrl: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Organization adı</span>
          <input
            className="rounded-md border border-input bg-background px-3 py-2"
            value={defaults.organizationName}
            onChange={(e) => setDefaults({ ...defaults, organizationName: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Twitter handle</span>
          <input
            className="rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
            value={defaults.twitterHandle ?? ''}
            placeholder="@ornek"
            onChange={(e) => setDefaults({ ...defaults, twitterHandle: e.target.value || null })}
          />
        </label>
        <button
          type="button"
          disabled={saving}
          onClick={() => void saveDefaults()}
          className="self-start rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          Varsayılanları kaydet
        </button>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-semibold">Yönlendirmeler</h2>
        <p className="text-sm text-muted-foreground">
          Slug değişimlerinde otomatik 301 oluşur. Manuel kayıt da ekleyebilirsiniz.
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            className="min-w-[12rem] flex-1 rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
            placeholder="/eski-path"
            value={fromPath}
            onChange={(e) => setFromPath(e.target.value)}
          />
          <input
            className="min-w-[12rem] flex-1 rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
            placeholder="/yeni-path"
            value={toPath}
            onChange={(e) => setToPath(e.target.value)}
          />
          <button
            type="button"
            disabled={saving || !fromPath || !toPath}
            onClick={() => void addRedirect()}
            className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            Ekle
          </button>
        </div>
        {redirects.length === 0 ? (
          <p className="text-sm text-muted-foreground">Henüz yönlendirme yok.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Kaynak</th>
                  <th className="px-3 py-2 font-medium">Hedef</th>
                  <th className="px-3 py-2 font-medium">Kod</th>
                  <th className="px-3 py-2 font-medium">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {redirects.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-3 py-2 font-mono text-xs">{r.fromPath}</td>
                    <td className="px-3 py-2 font-mono text-xs">{r.toPath}</td>
                    <td className="px-3 py-2">{r.statusCode}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        className="text-destructive hover:underline"
                        onClick={() => void removeRedirect(r.id)}
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
