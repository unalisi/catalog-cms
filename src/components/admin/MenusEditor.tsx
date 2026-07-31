import { useEffect, useMemo, useState } from 'react';
import type { ApiResult } from '../../lib/api';
import { getCorePage, isCorePageSlug } from '../../lib/pages/core-pages';
import {
  NAVBAR_LAYOUT_LABELS,
  NAVBAR_LAYOUTS,
  parseNavigation,
  type NavbarCta,
  type NavbarLayout,
  type NavItem,
  type NavPanel,
  type NavPanelItem,
} from '../../lib/navigation/nav';
import { AdminFormStickyBar } from './AdminFormStickyBar';
import MediaPicker, { type MediaItem } from './MediaPicker';

type PageOption = {
  id: string;
  slug: string;
  title: string;
  status: string;
};

type SitePayload = {
  name: string;
  tagline?: string;
  logoMediaId?: string | null;
  faviconMediaId?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  social?: Record<string, string | null>;
  analytics?: Record<string, string | null>;
  navbarLayout?: NavbarLayout;
  navbarCtas?: NavbarCta[];
  navigation: unknown[];
  footerText?: string | null;
};

function pageHref(slug: string): string {
  if (isCorePageSlug(slug)) {
    const core = getCorePage(slug);
    if (core?.path && !core.path.includes('{')) return core.path;
  }
  return `/${slug}`;
}

function isNavablePage(p: PageOption): boolean {
  if (p.status !== 'published') return false;
  if (isCorePageSlug(p.slug)) {
    const core = getCorePage(p.slug);
    if (core?.path?.includes('{')) return false;
  }
  return true;
}

function emptyPanel(): NavPanel {
  return {
    columns: [{ heading: '', items: [] }],
    featured: [],
    footerLinks: [],
  };
}

function emptyPanelItem(): NavPanelItem {
  return {
    label: '',
    href: '/',
    description: '',
    imageUrl: '',
    iconUrl: '',
    badge: '',
  };
}

const LAYOUT_PREVIEWS: Record<NavbarLayout, { idle: string; active: string }> = {
  classic: {
    idle: '/admin/navbar-previews/classic-idle.png',
    active: '/admin/navbar-previews/classic-active.png',
  },
  fullscreen: {
    idle: '/admin/navbar-previews/fullscreen-idle.png',
    active: '/admin/navbar-previews/fullscreen-active.png',
  },
  mega: {
    idle: '/admin/navbar-previews/mega-idle.png',
    active: '/admin/navbar-previews/mega-active.png',
  },
  'mega-img': {
    idle: '/admin/navbar-previews/mega-img-idle.png',
    active: '/admin/navbar-previews/mega-img-active.png',
  },
};

export default function MenusEditor() {
  const [site, setSite] = useState<SitePayload | null>(null);
  const [pages, setPages] = useState<PageOption[]>([]);
  const [layout, setLayout] = useState<NavbarLayout>('classic');
  const [ctas, setCtas] = useState<NavbarCta[]>([]);
  const [items, setItems] = useState<NavItem[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [mediaTarget, setMediaTarget] = useState<{
    itemIndex: number;
    colIndex: number;
    rowIndex: number;
    field: 'imageUrl' | 'iconUrl';
  } | null>(null);
  const [featuredMedia, setFeaturedMedia] = useState<{
    itemIndex: number;
    featIndex: number;
  } | null>(null);

  const pageOptions = useMemo(() => pages.filter(isNavablePage), [pages]);

  useEffect(() => {
    void (async () => {
      try {
        const [settingsRes, pagesRes] = await Promise.all([
          fetch('/api/admin/settings'),
          fetch('/api/admin/pages'),
        ]);
        const settingsJson = (await settingsRes.json()) as ApiResult<{ site: SitePayload }>;
        const pagesJson = (await pagesRes.json()) as ApiResult<{
          pages: Array<{ id: string; slug: string; title: string; status: string }>;
        }>;

        if (!settingsJson.ok) {
          setError(settingsJson.error.message ?? 'Ayarlar yüklenemedi');
          return;
        }
        if (!pagesJson.ok) {
          setError(pagesJson.error.message ?? 'Sayfalar yüklenemedi');
          return;
        }

        const s = settingsJson.data.site;
        setSite(s);
        setLayout(s.navbarLayout ?? 'classic');
        setCtas(s.navbarCtas?.length ? [...s.navbarCtas] : []);
        setItems(parseNavigation(s.navigation));
        setPages(pagesJson.data.pages);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Menü verisi yüklenemedi');
      }
    })();
  }, []);

  function markDirty() {
    setSaved(false);
  }

  function moveItem(index: number, dir: -1 | 1) {
    setItems((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      const tmp = next[index]!;
      next[index] = next[target]!;
      next[target] = tmp;
      return next;
    });
    markDirty();
  }

  function updateItem(index: number, patch: Partial<NavItem> | NavItem) {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== index) return it;
        return { ...it, ...patch } as NavItem;
      }),
    );
    markDirty();
  }

  function updatePanel(index: number, panel: NavPanel) {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== index || it.kind !== 'panel') return it;
        return { ...it, panel };
      }),
    );
    markDirty();
  }

  async function save() {
    if (!site) return;
    setSaving(true);
    setError(null);
    setSaved(false);

    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        site: {
          ...site,
          navbarLayout: layout,
          navbarCtas: ctas.filter((c) => c.label.trim() && c.href.trim()),
          navigation: items,
        },
      }),
    });
    const json = (await res.json()) as ApiResult<{ site: SitePayload }>;
    setSaving(false);
    if (!json.ok) {
      setError(json.error.message ?? 'Kayıt başarısız');
      return;
    }
    setSite(json.data.site);
    setLayout(json.data.site.navbarLayout ?? layout);
    setCtas(json.data.site.navbarCtas ?? ctas);
    setItems(parseNavigation(json.data.site.navigation));
    setSaved(true);
  }

  if (!site) {
    return <p className="text-sm text-muted-foreground">{error ?? 'Yükleniyor…'}</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      {error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {/* Layout picker */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">Navbar stili</h2>
          <p className="text-sm text-muted-foreground">
            Tüm public sayfalarda kullanılan header düzeni.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {NAVBAR_LAYOUTS.map((id) => {
            const selected = layout === id;
            const preview = LAYOUT_PREVIEWS[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setLayout(id);
                  markDirty();
                }}
                className={`overflow-hidden rounded-xl border text-left transition ${
                  selected
                    ? 'border-primary ring-2 ring-primary/30'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <div className="aspect-[16/10] bg-muted">
                  <img
                    src={selected ? preview.active : preview.idle}
                    alt={NAVBAR_LAYOUT_LABELS[id]}
                    className="size-full object-cover object-top"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 px-3 py-2">
                  <span className="text-sm font-semibold">{NAVBAR_LAYOUT_LABELS[id]}</span>
                  {selected ? (
                    <span className="text-[10px] font-bold uppercase tracking-wide text-primary">
                      Aktif
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* CTAs */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-semibold">Sağ aksiyonlar (CTA)</h2>
            <p className="text-sm text-muted-foreground">En fazla 3 buton.</p>
          </div>
          <button
            type="button"
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
            disabled={ctas.length >= 3}
            onClick={() => {
              setCtas((prev) => [...prev, { label: 'Yeni', href: '/', variant: 'ghost' }]);
              markDirty();
            }}
          >
            CTA ekle
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {ctas.map((cta, i) => (
            <div
              key={i}
              className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1fr_1fr_auto_auto]"
            >
              <input
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={cta.label}
                placeholder="Etiket"
                onChange={(e) => {
                  const next = [...ctas];
                  next[i] = { ...cta, label: e.target.value };
                  setCtas(next);
                  markDirty();
                }}
              />
              <input
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={cta.href}
                placeholder="/path"
                onChange={(e) => {
                  const next = [...ctas];
                  next[i] = { ...cta, href: e.target.value };
                  setCtas(next);
                  markDirty();
                }}
              />
              <select
                className="rounded-md border border-border bg-background px-2 py-2 text-sm"
                value={cta.variant}
                onChange={(e) => {
                  const next = [...ctas];
                  next[i] = {
                    ...cta,
                    variant: e.target.value as NavbarCta['variant'],
                  };
                  setCtas(next);
                  markDirty();
                }}
              >
                <option value="ghost">Ghost</option>
                <option value="solid">Solid</option>
                <option value="text">Text</option>
              </select>
              <button
                type="button"
                className="rounded-md border border-border px-2 py-2 text-sm text-muted-foreground hover:text-destructive"
                onClick={() => {
                  setCtas((prev) => prev.filter((_, j) => j !== i));
                  markDirty();
                }}
              >
                Sil
              </button>
            </div>
          ))}
          {!ctas.length ? (
            <p className="text-sm text-muted-foreground">Henüz CTA yok.</p>
          ) : null}
        </div>
      </section>

      {/* Nav tree */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-semibold">Menü öğeleri</h2>
            <p className="text-sm text-muted-foreground">
              Link, statik panel veya dinamik kategoriler. Yayınlanmış kategoriler hover panelinde
              listelenir. En fazla 8 üst seviye.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
              disabled={items.length >= 8}
              onClick={() => {
                setItems((prev) => [...prev, { kind: 'link', label: 'Yeni link', href: '/' }]);
                markDirty();
              }}
            >
              Link ekle
            </button>
            <button
              type="button"
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
              disabled={items.length >= 8}
              onClick={() => {
                setItems((prev) => [
                  ...prev,
                  { kind: 'categories', label: 'Katalog', href: '/catalog' },
                ]);
                markDirty();
              }}
            >
              Kategoriler (dinamik)
            </button>
            <button
              type="button"
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
              disabled={items.length >= 8}
              onClick={() => {
                setItems((prev) => [
                  ...prev,
                  { kind: 'panel', label: 'Yeni panel', href: '', panel: emptyPanel() },
                ]);
                setExpanded(items.length);
                markDirty();
              }}
            >
              Panel ekle
            </button>
          </div>
        </div>

        {pageOptions.length > 0 ? (
          <div className="flex flex-wrap items-end gap-2 rounded-lg border border-dashed border-border p-3">
            <label className="flex min-w-[180px] flex-1 flex-col gap-1 text-xs font-medium text-muted-foreground">
              Sayfadan ekle
              <select
                id="page-pick"
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                defaultValue={pageOptions[0]?.slug}
              >
                {pageOptions.map((p) => (
                  <option key={p.id} value={p.slug}>
                    {p.title} ({pageHref(p.slug)})
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="rounded-md bg-muted px-3 py-2 text-sm font-medium hover:bg-muted/80 disabled:opacity-50"
              disabled={items.length >= 8}
              onClick={() => {
                const el = document.getElementById('page-pick') as HTMLSelectElement | null;
                const slug = el?.value;
                const page = pageOptions.find((p) => p.slug === slug);
                if (!page) return;
                setItems((prev) => [
                  ...prev,
                  { kind: 'link', label: page.title, href: pageHref(page.slug) },
                ]);
                markDirty();
              }}
            >
              Link olarak ekle
            </button>
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          {items.map((item, index) => (
            <div key={index} className="rounded-xl border border-border">
              <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/30 px-3 py-2">
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    item.kind === 'categories'
                      ? 'bg-primary/15 text-primary'
                      : 'bg-background text-muted-foreground'
                  }`}
                >
                  {item.kind === 'panel'
                    ? 'Panel'
                    : item.kind === 'categories'
                      ? 'Dinamik'
                      : 'Link'}
                </span>
                <input
                  className="min-w-[120px] flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm font-medium"
                  value={item.label}
                  onChange={(e) => updateItem(index, { label: e.target.value })}
                />
                {item.kind === 'link' ? (
                  <input
                    className="min-w-[140px] flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                    value={item.href}
                    onChange={(e) => updateItem(index, { href: e.target.value })}
                  />
                ) : item.kind === 'categories' ? (
                  <input
                    className="min-w-[140px] flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                    value={item.href}
                    placeholder="/catalog"
                    onChange={(e) => updateItem(index, { href: e.target.value })}
                  />
                ) : (
                  <input
                    className="min-w-[140px] flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                    value={item.href ?? ''}
                    placeholder="Opsiyonel kök URL"
                    onChange={(e) => updateItem(index, { href: e.target.value })}
                  />
                )}
                <div className="ml-auto flex gap-1">
                  <button
                    type="button"
                    className="rounded border border-border px-2 py-1 text-xs"
                    onClick={() => moveItem(index, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="rounded border border-border px-2 py-1 text-xs"
                    onClick={() => moveItem(index, 1)}
                  >
                    ↓
                  </button>
                  {item.kind === 'panel' ? (
                    <button
                      type="button"
                      className="rounded border border-border px-2 py-1 text-xs"
                      onClick={() => setExpanded(expanded === index ? null : index)}
                    >
                      {expanded === index ? 'Gizle' : 'Düzenle'}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="rounded border border-border px-2 py-1 text-xs text-destructive"
                    onClick={() => {
                      setItems((prev) => prev.filter((_, i) => i !== index));
                      markDirty();
                    }}
                  >
                    Sil
                  </button>
                </div>
              </div>

              {item.kind === 'categories' ? (
                <p className="px-3 py-2 text-xs text-muted-foreground">
                  Yayınlanmış kategoriler otomatik listelenir (kök kolonlar + alt kategoriler). İçerik{' '}
                  <a href="/admin/categories" className="font-medium text-primary hover:underline">
                    Kategoriler
                  </a>{' '}
                  sayfasından yönetilir.
                </p>
              ) : null}

              {item.kind === 'panel' && expanded === index ? (
                <PanelEditor
                  panel={item.panel}
                  onChange={(panel) => updatePanel(index, panel)}
                  onPickMedia={(colIndex, rowIndex, field) =>
                    setMediaTarget({ itemIndex: index, colIndex, rowIndex, field })
                  }
                  onPickFeatured={(featIndex) =>
                    setFeaturedMedia({ itemIndex: index, featIndex })
                  }
                />
              ) : null}
            </div>
          ))}
          {!items.length ? (
            <p className="text-sm text-muted-foreground">Menü boş. Link veya panel ekleyin.</p>
          ) : null}
        </div>
      </section>

      <AdminFormStickyBar>
        <div className="flex items-center gap-3">
          {saved ? <span className="text-sm text-muted-foreground">Kaydedildi</span> : null}
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      </AdminFormStickyBar>

      <MediaPicker
        open={mediaTarget != null || featuredMedia != null}
        onClose={() => {
          setMediaTarget(null);
          setFeaturedMedia(null);
        }}
        onSelect={(media: MediaItem) => {
          if (mediaTarget) {
            const { itemIndex, colIndex, rowIndex, field } = mediaTarget;
            const it = items[itemIndex];
            if (it?.kind !== 'panel') return;
            const panel = structuredClone(it.panel);
            const row = panel.columns[colIndex]?.items[rowIndex];
            if (!row) return;
            row[field] = media.url;
            updatePanel(itemIndex, panel);
            setMediaTarget(null);
            return;
          }
          if (featuredMedia) {
            const { itemIndex, featIndex } = featuredMedia;
            const it = items[itemIndex];
            if (it?.kind !== 'panel') return;
            const panel = structuredClone(it.panel);
            const feat = panel.featured[featIndex];
            if (!feat) return;
            feat.imageUrl = media.url;
            updatePanel(itemIndex, panel);
            setFeaturedMedia(null);
          }
        }}
      />
    </div>
  );
}

function PanelEditor({
  panel,
  onChange,
  onPickMedia,
  onPickFeatured,
}: {
  panel: NavPanel;
  onChange: (p: NavPanel) => void;
  onPickMedia: (colIndex: number, rowIndex: number, field: 'imageUrl' | 'iconUrl') => void;
  onPickFeatured: (featIndex: number) => void;
}) {
  function setPanel(next: NavPanel) {
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Kolonlar</h3>
          <button
            type="button"
            className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
            disabled={panel.columns.length >= 6}
            onClick={() =>
              setPanel({
                ...panel,
                columns: [...panel.columns, { heading: 'Yeni kolon', items: [] }],
              })
            }
          >
            Kolon ekle
          </button>
        </div>
        {panel.columns.map((col, ci) => (
          <div key={ci} className="rounded-lg border border-border p-3">
            <div className="mb-2 flex gap-2">
              <input
                className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                value={col.heading ?? ''}
                placeholder="Kolon başlığı"
                onChange={(e) => {
                  const columns = [...panel.columns];
                  columns[ci] = { ...col, heading: e.target.value };
                  setPanel({ ...panel, columns });
                }}
              />
              <button
                type="button"
                className="text-xs text-destructive"
                onClick={() =>
                  setPanel({
                    ...panel,
                    columns: panel.columns.filter((_, i) => i !== ci),
                  })
                }
              >
                Kolonu sil
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {col.items.map((row, ri) => (
                <div
                  key={ri}
                  className="grid gap-2 rounded-md border border-dashed border-border p-2 md:grid-cols-2"
                >
                  <input
                    className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                    value={row.label}
                    placeholder="Etiket"
                    onChange={(e) => {
                      const columns = structuredClone(panel.columns);
                      columns[ci]!.items[ri]!.label = e.target.value;
                      setPanel({ ...panel, columns });
                    }}
                  />
                  <input
                    className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                    value={row.href}
                    placeholder="/href"
                    onChange={(e) => {
                      const columns = structuredClone(panel.columns);
                      columns[ci]!.items[ri]!.href = e.target.value;
                      setPanel({ ...panel, columns });
                    }}
                  />
                  <input
                    className="rounded-md border border-border bg-background px-2 py-1.5 text-sm md:col-span-2"
                    value={row.description ?? ''}
                    placeholder="Açıklama"
                    onChange={(e) => {
                      const columns = structuredClone(panel.columns);
                      columns[ci]!.items[ri]!.description = e.target.value;
                      setPanel({ ...panel, columns });
                    }}
                  />
                  <input
                    className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                    value={row.badge ?? ''}
                    placeholder="Badge"
                    onChange={(e) => {
                      const columns = structuredClone(panel.columns);
                      columns[ci]!.items[ri]!.badge = e.target.value;
                      setPanel({ ...panel, columns });
                    }}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded border border-border px-2 py-1 text-xs"
                      onClick={() => onPickMedia(ci, ri, 'iconUrl')}
                    >
                      İkon
                    </button>
                    <button
                      type="button"
                      className="rounded border border-border px-2 py-1 text-xs"
                      onClick={() => onPickMedia(ci, ri, 'imageUrl')}
                    >
                      Görsel
                    </button>
                    {(row.iconUrl || row.imageUrl) && (
                      <span className="truncate text-xs text-muted-foreground">
                        {row.iconUrl || row.imageUrl}
                      </span>
                    )}
                    <button
                      type="button"
                      className="ml-auto text-xs text-destructive"
                      onClick={() => {
                        const columns = structuredClone(panel.columns);
                        columns[ci]!.items = columns[ci]!.items.filter((_, i) => i !== ri);
                        setPanel({ ...panel, columns });
                      }}
                    >
                      Sil
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="text-left text-sm font-medium text-primary hover:underline disabled:opacity-50"
                disabled={col.items.length >= 16}
                onClick={() => {
                  const columns = structuredClone(panel.columns);
                  columns[ci]!.items.push(emptyPanelItem());
                  setPanel({ ...panel, columns });
                }}
              >
                + Öğe ekle
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Featured / spotlight</h3>
          <button
            type="button"
            className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
            disabled={panel.featured.length >= 4}
            onClick={() =>
              setPanel({
                ...panel,
                featured: [
                  ...panel.featured,
                  { title: 'Başlık', description: '', href: '/', imageUrl: '' },
                ],
              })
            }
          >
            Ekle
          </button>
        </div>
        {panel.featured.map((f, fi) => (
          <div key={fi} className="grid gap-2 rounded-lg border border-border p-3 md:grid-cols-2">
            <input
              className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              value={f.title}
              placeholder="Başlık"
              onChange={(e) => {
                const featured = structuredClone(panel.featured);
                featured[fi]!.title = e.target.value;
                setPanel({ ...panel, featured });
              }}
            />
            <input
              className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              value={f.href ?? ''}
              placeholder="/href"
              onChange={(e) => {
                const featured = structuredClone(panel.featured);
                featured[fi]!.href = e.target.value;
                setPanel({ ...panel, featured });
              }}
            />
            <input
              className="rounded-md border border-border bg-background px-2 py-1.5 text-sm md:col-span-2"
              value={f.description ?? ''}
              placeholder="Açıklama"
              onChange={(e) => {
                const featured = structuredClone(panel.featured);
                featured[fi]!.description = e.target.value;
                setPanel({ ...panel, featured });
              }}
            />
            <div className="flex gap-2 md:col-span-2">
              <button
                type="button"
                className="rounded border border-border px-2 py-1 text-xs"
                onClick={() => onPickFeatured(fi)}
              >
                Görsel seç
              </button>
              {f.imageUrl ? (
                <span className="truncate text-xs text-muted-foreground">{f.imageUrl}</span>
              ) : null}
              <button
                type="button"
                className="ml-auto text-xs text-destructive"
                onClick={() =>
                  setPanel({
                    ...panel,
                    featured: panel.featured.filter((_, i) => i !== fi),
                  })
                }
              >
                Sil
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Alt linkler</h3>
          <button
            type="button"
            className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
            disabled={panel.footerLinks.length >= 8}
            onClick={() =>
              setPanel({
                ...panel,
                footerLinks: [...panel.footerLinks, { label: 'Link', href: '/' }],
              })
            }
          >
            Ekle
          </button>
        </div>
        {panel.footerLinks.map((l, li) => (
          <div key={li} className="flex flex-wrap gap-2">
            <input
              className="min-w-[120px] flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              value={l.label}
              onChange={(e) => {
                const footerLinks = structuredClone(panel.footerLinks);
                footerLinks[li]!.label = e.target.value;
                setPanel({ ...panel, footerLinks });
              }}
            />
            <input
              className="min-w-[120px] flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              value={l.href}
              onChange={(e) => {
                const footerLinks = structuredClone(panel.footerLinks);
                footerLinks[li]!.href = e.target.value;
                setPanel({ ...panel, footerLinks });
              }}
            />
            <button
              type="button"
              className="text-xs text-destructive"
              onClick={() =>
                setPanel({
                  ...panel,
                  footerLinks: panel.footerLinks.filter((_, i) => i !== li),
                })
              }
            >
              Sil
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
