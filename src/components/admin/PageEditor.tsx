import { useEffect, useMemo, useRef, useState } from 'react';
import type { ApiResult } from '../../lib/api';
import {
  sectionFields,
  sectionLabels,
  type SectionType,
} from '../../lib/sections/registry';
import MediaPicker, { type MediaItem } from './MediaPicker';

type Status = 'draft' | 'published' | 'archived';

type SectionRow = {
  id: string;
  type: string;
  position: number;
  isVisible: boolean;
  configJson: string;
};

type PageEditorProps = {
  slug: string;
  initialPage: {
    id: string;
    slug: string;
    title: string;
    status: Status;
    sections: SectionRow[];
  };
  sectionTypes: { type: string; label: string }[];
  previewPath: string;
};

type FaqItem = { question: string; answer: string };
type GalleryImage = { src: string; alt: string };
type HeroSlide = {
  imageUrl: string;
  imageAlt: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
};
type WhyItem = { icon: string; title: string; body: string };
type ChannelItem = {
  type: 'phone' | 'whatsapp' | 'email' | 'form' | 'custom';
  label: string;
  value: string;
};
type LogoItem = { src: string; alt: string; href: string };

type PickerTarget =
  | { kind: 'media'; urlKey: string; altKey?: string }
  | { kind: 'gallery'; index: number }
  | { kind: 'slide'; index: number }
  | { kind: 'logo'; index: number }
  | null;

const CHANNEL_TYPES: { value: ChannelItem['type']; label: string }[] = [
  { value: 'phone', label: 'Telefon' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'E-posta' },
  { value: 'form', label: 'Form' },
  { value: 'custom', label: 'Özel' },
];

const emptySlide = (): HeroSlide => ({
  imageUrl: '',
  imageAlt: '',
  eyebrow: '',
  title: '',
  subtitle: '',
  ctaLabel: '',
  ctaHref: '',
});

function parseConfig(configJson: string): Record<string, unknown> {
  try {
    return JSON.parse(configJson || '{}') as Record<string, unknown>;
  } catch {
    return {};
  }
}

export default function PageEditor({
  slug,
  initialPage,
  sectionTypes,
  previewPath,
}: PageEditorProps) {
  const [title, setTitle] = useState(initialPage.title);
  const [pageSlug, setPageSlug] = useState(initialPage.slug);
  const [status, setStatus] = useState<Status>(initialPage.status);
  const [sections, setSections] = useState<SectionRow[]>(initialPage.sections);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialPage.sections[0]?.id ?? null,
  );
  const [config, setConfig] = useState<Record<string, unknown>>(() =>
    parseConfig(initialPage.sections[0]?.configJson ?? '{}'),
  );
  const [addType, setAddType] = useState<string>(sectionTypes[0]?.type ?? 'hero');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const dragId = useRef<string | null>(null);

  const selected = useMemo(
    () => sections.find((s) => s.id === selectedId) ?? null,
    [sections, selectedId],
  );

  const fields = selected && selected.type in sectionLabels
    ? sectionFields[selected.type as SectionType]
    : [];

  useEffect(() => {
    if (!selected) {
      setConfig({});
      return;
    }
    setConfig(parseConfig(selected.configJson));
  }, [selected?.id, selected?.configJson]);

  function refreshPreview() {
    setPreviewKey((k) => k + 1);
  }

  async function savePageMeta() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/pages/${slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, slug: pageSlug, status }),
    });
    const json = (await res.json()) as ApiResult<{ page: { slug: string } }>;
    setSaving(false);
    if (!json.ok) {
      setError(json.error.message);
      return;
    }
    setMessage('Sayfa kaydedildi');
    if (json.data.page.slug !== slug) {
      window.location.href = `/admin/pages/${json.data.page.slug}`;
      return;
    }
    refreshPreview();
  }

  async function addSection() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/pages/${slug}/sections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: addType }),
    });
    const json = (await res.json()) as ApiResult<{ section: SectionRow }>;
    setSaving(false);
    if (!json.ok) {
      setError(json.error.message);
      return;
    }
    setSections((prev) => [...prev, json.data.section]);
    setSelectedId(json.data.section.id);
    setMessage('Section eklendi');
    refreshPreview();
  }

  async function saveSectionConfig() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/sections/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config }),
    });
    const json = (await res.json()) as ApiResult<{ section: SectionRow }>;
    setSaving(false);
    if (!json.ok) {
      setError(json.error.message);
      if (json.error.fields) setError(Object.values(json.error.fields).join(' · '));
      return;
    }
    setSections((prev) =>
      prev.map((s) => (s.id === selected.id ? { ...s, ...json.data.section } : s)),
    );
    setMessage('Section kaydedildi');
    refreshPreview();
  }

  async function toggleVisible(section: SectionRow) {
    const res = await fetch(`/api/admin/sections/${section.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isVisible: !section.isVisible }),
    });
    const json = (await res.json()) as ApiResult<{ section: SectionRow }>;
    if (!json.ok) {
      setError(json.error.message);
      return;
    }
    setSections((prev) =>
      prev.map((s) => (s.id === section.id ? { ...s, ...json.data.section } : s)),
    );
    refreshPreview();
  }

  async function deleteSection(id: string) {
    if (!window.confirm('Bu section silinsin mi?')) return;
    const res = await fetch(`/api/admin/sections/${id}`, { method: 'DELETE' });
    const json = (await res.json()) as ApiResult<unknown>;
    if (!json.ok) {
      setError(json.error.message);
      return;
    }
    setSections((prev) => prev.filter((s) => s.id !== id));
    if (selectedId === id) setSelectedId(null);
    setMessage('Section silindi');
    refreshPreview();
  }

  async function persistOrder(next: SectionRow[]) {
    setSections(next);
    const res = await fetch(`/api/admin/pages/${slug}/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds: next.map((s) => s.id) }),
    });
    const json = (await res.json()) as ApiResult<{ sections: SectionRow[] }>;
    if (!json.ok) {
      setError(json.error.message);
      return;
    }
    setSections(json.data.sections);
    refreshPreview();
  }

  function onDrop(targetId: string) {
    const fromId = dragId.current;
    dragId.current = null;
    if (!fromId || fromId === targetId) return;
    const next = [...sections];
    const fromIndex = next.findIndex((s) => s.id === fromId);
    const toIndex = next.findIndex((s) => s.id === targetId);
    if (fromIndex < 0 || toIndex < 0) return;
    const [item] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, item!);
    void persistOrder(next);
  }

  function updateField(key: string, value: unknown) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  function handleMediaSelect(media: MediaItem) {
    if (!pickerTarget) return;

    if (pickerTarget.kind === 'media') {
      setConfig((prev) => {
        const next = { ...prev, [pickerTarget.urlKey]: media.url };
        if (pickerTarget.altKey) {
          const currentAlt = String(prev[pickerTarget.altKey] ?? '');
          next[pickerTarget.altKey] = currentAlt || media.alt;
        }
        return next;
      });
    } else if (pickerTarget.kind === 'gallery') {
      const images = (config.images as GalleryImage[]) ?? [];
      const next = [...images];
      const current = next[pickerTarget.index] ?? { src: '', alt: '' };
      next[pickerTarget.index] = {
        src: media.url,
        alt: current.alt || media.alt,
      };
      updateField('images', next);
    } else if (pickerTarget.kind === 'slide') {
      const slides = (config.slides as HeroSlide[]) ?? [];
      const next = [...slides];
      const current = next[pickerTarget.index] ?? emptySlide();
      next[pickerTarget.index] = {
        ...current,
        imageUrl: media.url,
        imageAlt: current.imageAlt || media.alt,
      };
      updateField('slides', next);
    } else if (pickerTarget.kind === 'logo') {
      const logos = (config.logos as LogoItem[]) ?? [];
      const next = [...logos];
      const current = next[pickerTarget.index] ?? { src: '', alt: '', href: '' };
      next[pickerTarget.index] = {
        ...current,
        src: media.url,
        alt: current.alt || media.alt,
      };
      updateField('logos', next);
    }

    setPickerTarget(null);
  }

  return (
    <div className="flex flex-col gap-4">
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

      <div className="grid gap-3 rounded-md border border-border p-4 md:grid-cols-[1fr_1fr_auto_auto]">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Başlık</span>
          <input
            className="rounded-md border border-input bg-background px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Slug</span>
          <input
            className="rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
            value={pageSlug}
            onChange={(e) => setPageSlug(e.target.value)}
            disabled={slug === 'home'}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Durum</span>
          <select
            className="rounded-md border border-input bg-background px-3 py-2"
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
          >
            <option value="draft">draft</option>
            <option value="published">published</option>
            <option value="archived">archived</option>
          </select>
        </label>
        <div className="flex items-end">
          <button
            type="button"
            disabled={saving}
            onClick={() => void savePageMeta()}
            className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            Sayfayı kaydet
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[20rem_minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="flex flex-col gap-3 rounded-md border border-border p-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-sm font-semibold">Section’lar</h2>
            <span className="text-xs text-muted-foreground">{sections.length}</span>
          </div>
          <div className="flex gap-2 border-b border-border pb-3">
            <select
              className="min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
              value={addType}
              onChange={(e) => setAddType(e.target.value)}
            >
              {sectionTypes.map((t) => (
                <option key={t.type} value={t.type}>
                  {t.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={saving}
              onClick={() => void addSection()}
              className="rounded-md border border-border px-2.5 py-1.5 text-sm font-medium hover:bg-muted"
            >
              Ekle
            </button>
          </div>
          <ul className="flex flex-col gap-1">
            {sections.map((section) => (
              <li
                key={section.id}
                draggable
                onDragStart={() => {
                  dragId.current = section.id;
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(section.id)}
                className={`flex cursor-grab items-center gap-2 rounded-md border px-2 py-2 text-sm active:cursor-grabbing ${
                  selectedId === section.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:bg-muted/40'
                } ${!section.isVisible ? 'opacity-50' : ''}`}
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 truncate text-left"
                  onClick={() => setSelectedId(section.id)}
                >
                  {sectionLabels[section.type as SectionType] ?? section.type}
                </button>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  title="Görünürlük"
                  onClick={() => void toggleVisible(section)}
                >
                  {section.isVisible ? 'Gizle' : 'Göster'}
                </button>
                <button
                  type="button"
                  className="text-xs text-destructive"
                  onClick={() => void deleteSection(section.id)}
                >
                  Sil
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-md border border-border p-4">
          {!selected ? (
            <p className="text-sm text-muted-foreground">Düzenlemek için section seçin.</p>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-lg font-semibold">
                  {sectionLabels[selected.type as SectionType] ?? selected.type}
                </h2>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void saveSectionConfig()}
                  className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  Section kaydet
                </button>
              </div>
              {fields.map((field) => {
                if (field.showWhen && String(config[field.showWhen.key] ?? '') !== field.showWhen.equals) {
                  return null;
                }

                if (field.kind === 'faq-list') {
                  const items = (config.items as FaqItem[]) ?? [];
                  return (
                    <div key={field.key} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{field.label}</span>
                        <button
                          type="button"
                          className="text-xs font-medium hover:underline"
                          onClick={() =>
                            updateField('items', [...items, { question: '', answer: '' }])
                          }
                        >
                          Soru ekle
                        </button>
                      </div>
                      {items.map((item, index) => (
                        <div key={index} className="grid gap-2 rounded-md border border-border p-2">
                          <input
                            className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                            placeholder="Soru"
                            value={item.question}
                            onChange={(e) => {
                              const next = [...items];
                              next[index] = { ...item, question: e.target.value };
                              updateField('items', next);
                            }}
                          />
                          <textarea
                            className="min-h-16 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                            placeholder="Cevap"
                            value={item.answer}
                            onChange={(e) => {
                              const next = [...items];
                              next[index] = { ...item, answer: e.target.value };
                              updateField('items', next);
                            }}
                          />
                          <button
                            type="button"
                            className="justify-self-start text-xs text-destructive"
                            onClick={() => updateField('items', items.filter((_, i) => i !== index))}
                          >
                            Kaldır
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                }

                if (field.kind === 'gallery-list') {
                  const images = (config.images as GalleryImage[]) ?? [];
                  return (
                    <div key={field.key} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{field.label}</span>
                        <button
                          type="button"
                          className="text-xs font-medium hover:underline"
                          onClick={() => updateField('images', [...images, { src: '', alt: '' }])}
                        >
                          Görsel ekle
                        </button>
                      </div>
                      {images.map((img, index) => (
                        <div key={index} className="grid gap-2 rounded-md border border-border p-2">
                          <input
                            className="rounded-md border border-input bg-background px-2 py-1.5 font-mono text-sm"
                            placeholder="URL / path"
                            value={img.src}
                            onChange={(e) => {
                              const next = [...images];
                              next[index] = { ...img, src: e.target.value };
                              updateField('images', next);
                            }}
                          />
                          <input
                            className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                            placeholder="Alt metin"
                            value={img.alt}
                            onChange={(e) => {
                              const next = [...images];
                              next[index] = { ...img, alt: e.target.value };
                              updateField('images', next);
                            }}
                          />
                          <div className="flex gap-3">
                            <button
                              type="button"
                              className="text-xs hover:underline"
                              onClick={() => setPickerTarget({ kind: 'gallery', index })}
                            >
                              Medyadan seç
                            </button>
                            <button
                              type="button"
                              className="text-xs text-destructive"
                              onClick={() =>
                                updateField(
                                  'images',
                                  images.filter((_, i) => i !== index),
                                )
                              }
                            >
                              Kaldır
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }

                if (field.kind === 'slide-list') {
                  const slides = (config.slides as HeroSlide[]) ?? [];
                  return (
                    <div key={field.key} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{field.label}</span>
                        <button
                          type="button"
                          className="text-xs font-medium hover:underline"
                          onClick={() => updateField('slides', [...slides, emptySlide()])}
                        >
                          Slayt ekle
                        </button>
                      </div>
                      {slides.map((slide, index) => (
                        <div key={index} className="grid gap-2 rounded-md border border-border p-2">
                          <div className="text-xs font-medium text-muted-foreground">
                            Slayt {index + 1}
                          </div>
                          <input
                            className="rounded-md border border-input bg-background px-2 py-1.5 font-mono text-sm"
                            placeholder="Görsel URL"
                            value={slide.imageUrl}
                            onChange={(e) => {
                              const next = [...slides];
                              next[index] = { ...slide, imageUrl: e.target.value };
                              updateField('slides', next);
                            }}
                          />
                          <input
                            className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                            placeholder="Görsel alt metin"
                            value={slide.imageAlt}
                            onChange={(e) => {
                              const next = [...slides];
                              next[index] = { ...slide, imageAlt: e.target.value };
                              updateField('slides', next);
                            }}
                          />
                          <button
                            type="button"
                            className="justify-self-start text-xs hover:underline"
                            onClick={() => setPickerTarget({ kind: 'slide', index })}
                          >
                            Medyadan seç
                          </button>
                          <input
                            className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                            placeholder="Üst etiket"
                            value={slide.eyebrow}
                            onChange={(e) => {
                              const next = [...slides];
                              next[index] = { ...slide, eyebrow: e.target.value };
                              updateField('slides', next);
                            }}
                          />
                          <input
                            className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                            placeholder="Başlık"
                            value={slide.title}
                            onChange={(e) => {
                              const next = [...slides];
                              next[index] = { ...slide, title: e.target.value };
                              updateField('slides', next);
                            }}
                          />
                          <textarea
                            className="min-h-16 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                            placeholder="Alt metin"
                            value={slide.subtitle}
                            onChange={(e) => {
                              const next = [...slides];
                              next[index] = { ...slide, subtitle: e.target.value };
                              updateField('slides', next);
                            }}
                          />
                          <input
                            className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                            placeholder="CTA metni"
                            value={slide.ctaLabel}
                            onChange={(e) => {
                              const next = [...slides];
                              next[index] = { ...slide, ctaLabel: e.target.value };
                              updateField('slides', next);
                            }}
                          />
                          <input
                            className="rounded-md border border-input bg-background px-2 py-1.5 font-mono text-sm"
                            placeholder="CTA link"
                            value={slide.ctaHref}
                            onChange={(e) => {
                              const next = [...slides];
                              next[index] = { ...slide, ctaHref: e.target.value };
                              updateField('slides', next);
                            }}
                          />
                          <button
                            type="button"
                            className="justify-self-start text-xs text-destructive"
                            onClick={() =>
                              updateField(
                                'slides',
                                slides.filter((_, i) => i !== index),
                              )
                            }
                          >
                            Kaldır
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                }

                if (field.kind === 'why-list') {
                  const items = (config.items as WhyItem[]) ?? [];
                  return (
                    <div key={field.key} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{field.label}</span>
                        <button
                          type="button"
                          className="text-xs font-medium hover:underline"
                          onClick={() =>
                            updateField('items', [...items, { icon: '', title: '', body: '' }])
                          }
                        >
                          Madde ekle
                        </button>
                      </div>
                      {items.map((item, index) => (
                        <div key={index} className="grid gap-2 rounded-md border border-border p-2">
                          <input
                            className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                            placeholder="İkon (örn. truck)"
                            value={item.icon}
                            onChange={(e) => {
                              const next = [...items];
                              next[index] = { ...item, icon: e.target.value };
                              updateField('items', next);
                            }}
                          />
                          <input
                            className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                            placeholder="Başlık"
                            value={item.title}
                            onChange={(e) => {
                              const next = [...items];
                              next[index] = { ...item, title: e.target.value };
                              updateField('items', next);
                            }}
                          />
                          <textarea
                            className="min-h-16 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                            placeholder="Açıklama"
                            value={item.body}
                            onChange={(e) => {
                              const next = [...items];
                              next[index] = { ...item, body: e.target.value };
                              updateField('items', next);
                            }}
                          />
                          <button
                            type="button"
                            className="justify-self-start text-xs text-destructive"
                            onClick={() => updateField('items', items.filter((_, i) => i !== index))}
                          >
                            Kaldır
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                }

                if (field.kind === 'channel-list') {
                  const items = (config.items as ChannelItem[]) ?? [];
                  return (
                    <div key={field.key} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{field.label}</span>
                        <button
                          type="button"
                          className="text-xs font-medium hover:underline"
                          onClick={() =>
                            updateField('items', [
                              ...items,
                              { type: 'phone', label: '', value: '' },
                            ])
                          }
                        >
                          Kanal ekle
                        </button>
                      </div>
                      {items.map((item, index) => (
                        <div key={index} className="grid gap-2 rounded-md border border-border p-2">
                          <select
                            className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                            value={item.type}
                            onChange={(e) => {
                              const next = [...items];
                              next[index] = {
                                ...item,
                                type: e.target.value as ChannelItem['type'],
                              };
                              updateField('items', next);
                            }}
                          >
                            {CHANNEL_TYPES.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <input
                            className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                            placeholder="Etiket"
                            value={item.label}
                            onChange={(e) => {
                              const next = [...items];
                              next[index] = { ...item, label: e.target.value };
                              updateField('items', next);
                            }}
                          />
                          <input
                            className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                            placeholder="Değer"
                            value={item.value}
                            onChange={(e) => {
                              const next = [...items];
                              next[index] = { ...item, value: e.target.value };
                              updateField('items', next);
                            }}
                          />
                          <button
                            type="button"
                            className="justify-self-start text-xs text-destructive"
                            onClick={() => updateField('items', items.filter((_, i) => i !== index))}
                          >
                            Kaldır
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                }

                if (field.kind === 'logo-list') {
                  const logos = (config.logos as LogoItem[]) ?? [];
                  return (
                    <div key={field.key} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{field.label}</span>
                        <button
                          type="button"
                          className="text-xs font-medium hover:underline"
                          onClick={() =>
                            updateField('logos', [...logos, { src: '', alt: '', href: '' }])
                          }
                        >
                          Logo ekle
                        </button>
                      </div>
                      {logos.map((logo, index) => (
                        <div key={index} className="grid gap-2 rounded-md border border-border p-2">
                          <input
                            className="rounded-md border border-input bg-background px-2 py-1.5 font-mono text-sm"
                            placeholder="Görsel URL"
                            value={logo.src}
                            onChange={(e) => {
                              const next = [...logos];
                              next[index] = { ...logo, src: e.target.value };
                              updateField('logos', next);
                            }}
                          />
                          <input
                            className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                            placeholder="Alt metin"
                            value={logo.alt}
                            onChange={(e) => {
                              const next = [...logos];
                              next[index] = { ...logo, alt: e.target.value };
                              updateField('logos', next);
                            }}
                          />
                          <input
                            className="rounded-md border border-input bg-background px-2 py-1.5 font-mono text-sm"
                            placeholder="Link (opsiyonel)"
                            value={logo.href}
                            onChange={(e) => {
                              const next = [...logos];
                              next[index] = { ...logo, href: e.target.value };
                              updateField('logos', next);
                            }}
                          />
                          <div className="flex gap-3">
                            <button
                              type="button"
                              className="text-xs hover:underline"
                              onClick={() => setPickerTarget({ kind: 'logo', index })}
                            >
                              Medyadan seç
                            </button>
                            <button
                              type="button"
                              className="text-xs text-destructive"
                              onClick={() =>
                                updateField(
                                  'logos',
                                  logos.filter((_, i) => i !== index),
                                )
                              }
                            >
                              Kaldır
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }

                if (field.kind === 'select') {
                  const value = String(config[field.key] ?? '');
                  return (
                    <label key={field.key} className="flex flex-col gap-1.5 text-sm">
                      <span className="font-medium">{field.label}</span>
                      <select
                        className="rounded-md border border-input bg-background px-3 py-2"
                        value={value}
                        onChange={(e) => updateField(field.key, e.target.value)}
                      >
                        {(field.options ?? []).map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  );
                }

                if (field.kind === 'media') {
                  const urlValue = String(config[field.key] ?? '');
                  const altValue = field.altKey ? String(config[field.altKey] ?? '') : '';
                  return (
                    <div key={field.key} className="flex flex-col gap-2">
                      <span className="text-sm font-medium">{field.label}</span>
                      <input
                        className="rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
                        placeholder="URL / path"
                        value={urlValue}
                        onChange={(e) => updateField(field.key, e.target.value)}
                      />
                      {field.altKey ? (
                        <input
                          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                          placeholder="Alt metin"
                          value={altValue}
                          onChange={(e) => updateField(field.altKey!, e.target.value)}
                        />
                      ) : null}
                      <button
                        type="button"
                        className="justify-self-start text-xs hover:underline"
                        onClick={() =>
                          setPickerTarget({
                            kind: 'media',
                            urlKey: field.key,
                            altKey: field.altKey,
                          })
                        }
                      >
                        Medyadan seç
                      </button>
                    </div>
                  );
                }

                const value = String(config[field.key] ?? '');
                if (field.kind === 'textarea' || field.kind === 'html') {
                  return (
                    <label key={field.key} className="flex flex-col gap-1.5 text-sm">
                      <span className="font-medium">{field.label}</span>
                      <textarea
                        className={`min-h-28 rounded-md border border-input bg-background px-3 py-2 ${
                          field.kind === 'html' ? 'font-mono text-xs' : ''
                        }`}
                        value={value}
                        onChange={(e) => updateField(field.key, e.target.value)}
                      />
                    </label>
                  );
                }

                return (
                  <label key={field.key} className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium">{field.label}</span>
                    <input
                      type={field.kind === 'number' ? 'number' : 'text'}
                      className={`rounded-md border border-input bg-background px-3 py-2 ${
                        field.kind === 'url' ? 'font-mono text-sm' : ''
                      }`}
                      value={value}
                      onChange={(e) =>
                        updateField(
                          field.key,
                          field.kind === 'number' ? Number(e.target.value) : e.target.value,
                        )
                      }
                    />
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex min-h-[28rem] flex-col overflow-hidden rounded-md border border-border">
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-2 text-sm">
            <span className="font-medium">Canlı önizleme</span>
            <button
              type="button"
              className="text-xs font-medium hover:underline"
              onClick={refreshPreview}
            >
              Yenile
            </button>
          </div>
          <iframe
            key={previewKey}
            title="Sayfa önizleme"
            src={previewPath}
            className="h-full min-h-[28rem] w-full flex-1 bg-background"
          />
        </div>
      </div>

      <MediaPicker
        open={pickerTarget != null}
        onClose={() => setPickerTarget(null)}
        onSelect={handleMediaSelect}
        title="Medya seç"
      />
    </div>
  );
}
