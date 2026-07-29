import { useEffect, useState } from 'react';
import type { ApiResult } from '../../lib/api';
import DeleteButton from './DeleteButton';
import MediaPicker, { type MediaItem } from './MediaPicker';
import { mediaTransformPath } from '../../lib/media/urls';

export default function MediaLibrary() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editAlt, setEditAlt] = useState('');

  async function load(query = q) {
    setError(null);
    const res = await fetch(`/api/admin/media?pageSize=48&q=${encodeURIComponent(query)}`);
    const json = (await res.json()) as ApiResult<{ items: MediaItem[]; total: number }>;
    if (!json.ok) {
      setError(json.error.message ?? 'Liste alınamadı');
      return;
    }
    setItems(json.data.items);
    setTotal(json.data.total);
  }

  useEffect(() => {
    void load('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveAlt() {
    if (!editId) return;
    const res = await fetch(`/api/admin/media/${editId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alt: editAlt }),
    });
    const json = (await res.json()) as ApiResult<{ media: MediaItem }>;
    if (!json.ok) {
      setError(json.error.message ?? 'Güncellenemedi');
      return;
    }
    setEditId(null);
    await load();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-[12rem] flex-1 flex-col gap-1.5 text-sm">
          <span className="font-medium">Ara</span>
          <input
            className="rounded-md border border-input bg-background px-3 py-2"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void load(q);
            }}
          />
        </label>
        <button
          type="button"
          className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
          onClick={() => void load(q)}
        >
          Ara
        </button>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          onClick={() => setPickerOpen(true)}
        >
          <span aria-hidden="true">+</span>
          Yükle
        </button>
      </div>

      <p className="text-sm text-muted-foreground">{total} dosya</p>
      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          Henüz medya yok. Yükle ile ekleyin; alt metin zorunludur.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <li key={item.id} className="overflow-hidden rounded-md border border-border">
              <img
                src={item.mime === 'image/svg+xml' ? item.url : mediaTransformPath(item.key, 320)}
                alt={item.alt}
                className="aspect-square w-full bg-muted object-cover"
                loading="lazy"
              />
              <div className="flex flex-col gap-2 p-3">
                {editId === item.id ? (
                  <>
                    <input
                      className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                      value={editAlt}
                      onChange={(e) => setEditAlt(e.target.value)}
                    />
                    <div className="flex gap-2 text-sm">
                      <button type="button" className="hover:underline" onClick={() => void saveAlt()}>
                        Kaydet
                      </button>
                      <button type="button" className="hover:underline" onClick={() => setEditId(null)}>
                        İptal
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="truncate text-sm font-medium">{item.alt || '—'}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">{item.key}</p>
                    <div className="flex items-center gap-3 text-sm">
                      <button
                        type="button"
                        className="hover:underline"
                        onClick={() => {
                          setEditId(item.id);
                          setEditAlt(item.alt);
                        }}
                      >
                        Alt düzenle
                      </button>
                      <a href={item.url} target="_blank" rel="noreferrer" className="hover:underline">
                        Aç
                      </a>
                      <DeleteButton endpoint={`/api/admin/media/${item.id}`} />
                    </div>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <MediaPicker
        open={pickerOpen}
        onClose={() => {
          setPickerOpen(false);
          void load();
        }}
        onSelect={() => {
          void load();
        }}
        title="Medya yükle"
      />
    </div>
  );
}
