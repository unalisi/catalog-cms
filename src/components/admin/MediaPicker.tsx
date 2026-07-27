import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { ApiResult } from '../../lib/api';
import { mediaTransformPath } from '../../lib/media/urls';

export type MediaItem = {
  id: string;
  key: string;
  url: string;
  alt: string;
  mime: string;
  width: number | null;
  height: number | null;
  sizeBytes: number | null;
  createdAt: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (media: MediaItem) => void;
  title?: string;
};

export default function MediaPicker({ open, onClose, onSelect, title = 'Medya seç' }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [q, setQ] = useState('');
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alt, setAlt] = useState('');
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/media?pageSize=48&q=${encodeURIComponent(query)}`);
    const json = (await res.json()) as ApiResult<{ items: MediaItem[] }>;
    setLoading(false);
    if (!json.ok) {
      setError(json.error.message ?? 'Liste alınamadı');
      return;
    }
    setItems(json.data.items);
  }, []);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      void load(q);
    }
    if (!open && el.open) el.close();
  }, [open, load, q]);

  async function onUpload(file: File | null) {
    if (!file) return;
    if (!alt.trim()) {
      setError('Yükleme için alt metin zorunlu');
      return;
    }
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.set('file', file);
    fd.set('alt', alt.trim());
    const res = await fetch('/api/admin/media', { method: 'POST', body: fd });
    const json = (await res.json()) as ApiResult<{ media: MediaItem }>;
    setUploading(false);
    if (!json.ok) {
      setError(json.error.message ?? json.error.fields?.file ?? 'Yükleme başarısız');
      return;
    }
    setAlt('');
    onSelect(json.data.media);
    onClose();
  }

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 m-auto w-[min(56rem,calc(100%-2rem))] max-h-[90dvh] overflow-hidden rounded-lg border border-border bg-background p-0 shadow-lg backdrop:bg-foreground/40"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="flex max-h-[90dvh] flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 id={titleId} className="font-display text-lg font-semibold">
            {title}
          </h2>
          <button type="button" className="text-sm hover:underline" onClick={onClose}>
            Kapat
          </button>
        </div>

        <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-end">
          <label className="flex flex-1 flex-col gap-1 text-sm">
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
          <label className="flex flex-1 flex-col gap-1 text-sm">
            <span className="font-medium">Yükle · alt metin</span>
            <input
              className="rounded-md border border-input bg-background px-3 py-2"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Görsel açıklaması"
            />
          </label>
          <label className="inline-flex cursor-pointer items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
            {uploading ? 'Yükleniyor…' : 'Dosya seç'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => void onUpload(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        {error && (
          <p className="mx-4 mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Yükleniyor…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Medya bulunamadı.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="group flex w-full flex-col overflow-hidden rounded-md border border-border text-left hover:border-foreground"
                    onClick={() => {
                      onSelect(item);
                      onClose();
                    }}
                  >
                    <img
                      src={
                        item.mime === 'image/svg+xml'
                          ? item.url
                          : mediaTransformPath(item.key, 320)
                      }
                      alt={item.alt}
                      className="aspect-square w-full bg-muted object-cover"
                      loading="lazy"
                    />
                    <span className="truncate px-2 py-1.5 text-xs text-muted-foreground group-hover:text-foreground">
                      {item.alt || item.key}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </dialog>
  );
}
