import { useEffect, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import type { ApiResult } from '../../lib/api';
import MediaPicker, { type MediaItem } from './MediaPicker';
import { mediaTransformPath } from '../../lib/media/urls';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

  async function deleteMedia(id: string) {
    if (!window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
    const res = await fetch(`/api/admin/media/${id}`, { method: 'DELETE' });
    const json = (await res.json()) as ApiResult<unknown>;
    if (!json.ok) {
      setError(json.error.message ?? 'Silinemedi');
      return;
    }
    await load();
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="sticky top-0 z-10 -mx-4 flex flex-col gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80 md:static md:mx-0 md:flex-row md:flex-wrap md:items-end md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-sm md:min-w-[12rem]">
          <span className="font-medium">Ara</span>
          <input
            className="min-h-11 rounded-md border border-input bg-background px-3 py-2"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void load(q);
            }}
          />
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            className="min-h-11 flex-1 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted md:flex-none"
            onClick={() => void load(q)}
          >
            Ara
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted md:flex-none"
            onClick={() => setPickerOpen(true)}
          >
            <span aria-hidden="true">+</span>
            Yükle
          </button>
        </div>
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
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
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
                      className="min-h-11 rounded-md border border-input bg-background px-2 py-1 text-sm"
                      value={editAlt}
                      onChange={(e) => setEditAlt(e.target.value)}
                    />
                    <div className="flex gap-2 text-sm">
                      <button
                        type="button"
                        className="min-h-11 px-1 hover:underline"
                        onClick={() => void saveAlt()}
                      >
                        Kaydet
                      </button>
                      <button
                        type="button"
                        className="min-h-11 px-1 hover:underline"
                        onClick={() => setEditId(null)}
                      >
                        İptal
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="truncate text-sm font-medium">{item.alt || '—'}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">{item.key}</p>
                    <div className="flex items-center justify-between gap-2">
                      <div className="hidden items-center gap-3 text-sm md:flex">
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
                        <button
                          type="button"
                          className="text-destructive hover:underline"
                          onClick={() => void deleteMedia(item.id)}
                        >
                          Sil
                        </button>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex size-11 items-center justify-center rounded-md border border-border hover:bg-muted md:hidden"
                            aria-label="Medya işlemleri"
                          >
                            <MoreHorizontal className="size-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onSelect={() => {
                              setEditId(item.id);
                              setEditAlt(item.alt);
                            }}
                          >
                            Alt düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a href={item.url} target="_blank" rel="noreferrer">
                              Aç
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => void deleteMedia(item.id)}
                          >
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
