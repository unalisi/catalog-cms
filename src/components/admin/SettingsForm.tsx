import { useEffect, useState } from 'react';
import type { ApiResult } from '../../lib/api';
import MediaPicker, { type MediaItem } from './MediaPicker';
import { mediaTransformPath } from '../../lib/media/urls';

type NavItem = { label: string; href: string };

type SiteForm = {
  name: string;
  tagline: string;
  logoMediaId: string | null;
  faviconMediaId: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  contactEmail: string;
  contactPhone: string;
  address: string;
  social: {
    twitter: string;
    instagram: string;
    linkedin: string;
    youtube: string;
  };
  analytics: { gaMeasurementId: string; gtmId: string };
  navigation: NavItem[];
  footerText: string;
};

type SeoForm = {
  siteName: string;
  titleTemplate: string;
  defaultDescription: string;
  defaultOgImageUrl: string;
  organizationName: string;
  twitterHandle: string;
};

export default function SettingsForm() {
  const [site, setSite] = useState<SiteForm | null>(null);
  const [seo, setSeo] = useState<SeoForm | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [picker, setPicker] = useState<'logo' | 'favicon' | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/admin/settings');
      const json = (await res.json()) as ApiResult<{
        site: SiteForm & { social?: Record<string, string | null>; analytics?: Record<string, string | null> };
        seo: {
          siteName: string;
          titleTemplate: string;
          defaultDescription: string;
          defaultOgImageUrl?: string | null;
          organizationName: string;
          twitterHandle?: string | null;
        };
      }>;
      if (!json.ok) {
        setError(json.error.message ?? 'Ayarlar yüklenemedi');
        return;
      }
      const s = json.data.site;
      setSite({
        name: s.name,
        tagline: s.tagline ?? '',
        logoMediaId: s.logoMediaId ?? null,
        faviconMediaId: s.faviconMediaId ?? null,
        logoUrl: s.logoUrl ?? null,
        faviconUrl: s.faviconUrl ?? null,
        contactEmail: s.contactEmail ?? '',
        contactPhone: s.contactPhone ?? '',
        address: s.address ?? '',
        social: {
          twitter: s.social?.twitter ?? '',
          instagram: s.social?.instagram ?? '',
          linkedin: s.social?.linkedin ?? '',
          youtube: s.social?.youtube ?? '',
        },
        analytics: {
          gaMeasurementId: s.analytics?.gaMeasurementId ?? '',
          gtmId: s.analytics?.gtmId ?? '',
        },
        navigation: s.navigation?.length ? s.navigation : [{ label: 'Katalog', href: '/catalog' }],
        footerText: s.footerText ?? '',
      });
      setSeo({
        siteName: json.data.seo.siteName,
        titleTemplate: json.data.seo.titleTemplate,
        defaultDescription: json.data.seo.defaultDescription,
        defaultOgImageUrl: json.data.seo.defaultOgImageUrl ?? '',
        organizationName: json.data.seo.organizationName,
        twitterHandle: json.data.seo.twitterHandle ?? '',
      });
    })();
  }, []);

  function onPick(media: MediaItem) {
    if (!site || !picker) return;
    if (picker === 'logo') {
      setSite({
        ...site,
        logoMediaId: media.id,
        logoUrl: media.mime === 'image/svg+xml' ? media.url : mediaTransformPath(media.key, 320),
      });
    } else {
      setSite({
        ...site,
        faviconMediaId: media.id,
        faviconUrl: media.url,
      });
    }
    setPicker(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!site || !seo) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    const payload = {
      site: {
        name: site.name,
        tagline: site.tagline,
        logoMediaId: site.logoMediaId,
        faviconMediaId: site.faviconMediaId,
        contactEmail: site.contactEmail || null,
        contactPhone: site.contactPhone || null,
        address: site.address || null,
        social: {
          twitter: site.social.twitter || null,
          instagram: site.social.instagram || null,
          linkedin: site.social.linkedin || null,
          youtube: site.social.youtube || null,
        },
        analytics: {
          gaMeasurementId: site.analytics.gaMeasurementId || null,
          gtmId: site.analytics.gtmId || null,
        },
        navigation: site.navigation.filter((n) => n.label && n.href),
        footerText: site.footerText || null,
      },
      seo: {
        siteName: seo.siteName,
        titleTemplate: seo.titleTemplate,
        defaultDescription: seo.defaultDescription,
        defaultOgImageUrl: seo.defaultOgImageUrl || null,
        organizationName: seo.organizationName,
        twitterHandle: seo.twitterHandle || null,
      },
    };
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = (await res.json()) as ApiResult<unknown>;
    setSaving(false);
    if (!json.ok) {
      setError(json.error.message ?? 'Kayıt başarısız');
      return;
    }
    setSaved(true);
  }

  if (!site || !seo) {
    return <p className="text-sm text-muted-foreground">{error ?? 'Yükleniyor…'}</p>;
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-3xl flex-col gap-10">
      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      {saved && (
        <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">Ayarlar kaydedildi.</p>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-semibold">Site</h2>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Site adı</span>
          <input
            className="rounded-md border border-input bg-background px-3 py-2"
            value={site.name}
            onChange={(e) => setSite({ ...site, name: e.target.value })}
            required
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Slogan</span>
          <input
            className="rounded-md border border-input bg-background px-3 py-2"
            value={site.tagline}
            onChange={(e) => setSite({ ...site, tagline: e.target.value })}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2 text-sm">
            <span className="font-medium">Logo</span>
            {site.logoUrl && (
              <img src={site.logoUrl} alt="Logo" className="h-12 w-auto object-contain" />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-md border border-border px-3 py-1.5 hover:bg-muted"
                onClick={() => setPicker('logo')}
              >
                Seç
              </button>
              {site.logoMediaId && (
                <button
                  type="button"
                  className="text-destructive hover:underline"
                  onClick={() => setSite({ ...site, logoMediaId: null, logoUrl: null })}
                >
                  Kaldır
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <span className="font-medium">Favicon</span>
            {site.faviconUrl && (
              <img src={site.faviconUrl} alt="Favicon" className="h-8 w-8 object-contain" />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-md border border-border px-3 py-1.5 hover:bg-muted"
                onClick={() => setPicker('favicon')}
              >
                Seç
              </button>
              {site.faviconMediaId && (
                <button
                  type="button"
                  className="text-destructive hover:underline"
                  onClick={() => setSite({ ...site, faviconMediaId: null, faviconUrl: null })}
                >
                  Kaldır
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 border-t border-border pt-6">
        <h2 className="font-display text-lg font-semibold">İletişim</h2>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">E-posta</span>
          <input
            className="rounded-md border border-input bg-background px-3 py-2"
            value={site.contactEmail}
            onChange={(e) => setSite({ ...site, contactEmail: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Telefon</span>
          <input
            className="rounded-md border border-input bg-background px-3 py-2"
            value={site.contactPhone}
            onChange={(e) => setSite({ ...site, contactPhone: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Adres</span>
          <textarea
            className="min-h-20 rounded-md border border-input bg-background px-3 py-2"
            value={site.address}
            onChange={(e) => setSite({ ...site, address: e.target.value })}
          />
        </label>
      </section>

      <section className="flex flex-col gap-4 border-t border-border pt-6">
        <h2 className="font-display text-lg font-semibold">Sosyal</h2>
        {(['twitter', 'instagram', 'linkedin', 'youtube'] as const).map((key) => (
          <label key={key} className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium capitalize">{key}</span>
            <input
              className="rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
              value={site.social[key]}
              onChange={(e) =>
                setSite({ ...site, social: { ...site.social, [key]: e.target.value } })
              }
              placeholder="https://…"
            />
          </label>
        ))}
      </section>

      <section className="flex flex-col gap-4 border-t border-border pt-6">
        <h2 className="font-display text-lg font-semibold">Navigasyon</h2>
        {site.navigation.map((item, index) => (
          <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <input
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Etiket"
              value={item.label}
              onChange={(e) => {
                const navigation = [...site.navigation];
                navigation[index] = { ...item, label: e.target.value };
                setSite({ ...site, navigation });
              }}
            />
            <input
              className="rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
              placeholder="/path"
              value={item.href}
              onChange={(e) => {
                const navigation = [...site.navigation];
                navigation[index] = { ...item, href: e.target.value };
                setSite({ ...site, navigation });
              }}
            />
            <button
              type="button"
              className="text-sm text-destructive hover:underline"
              onClick={() =>
                setSite({
                  ...site,
                  navigation: site.navigation.filter((_, i) => i !== index),
                })
              }
            >
              Sil
            </button>
          </div>
        ))}
        <button
          type="button"
          className="w-fit text-sm hover:underline"
          onClick={() =>
            setSite({ ...site, navigation: [...site.navigation, { label: '', href: '/' }] })
          }
        >
          + Menü öğesi
        </button>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Footer metni</span>
          <input
            className="rounded-md border border-input bg-background px-3 py-2"
            value={site.footerText}
            onChange={(e) => setSite({ ...site, footerText: e.target.value })}
          />
        </label>
      </section>

      <section className="flex flex-col gap-4 border-t border-border pt-6">
        <h2 className="font-display text-lg font-semibold">Analytics</h2>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">GA Measurement ID</span>
          <input
            className="rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
            value={site.analytics.gaMeasurementId}
            onChange={(e) =>
              setSite({
                ...site,
                analytics: { ...site.analytics, gaMeasurementId: e.target.value },
              })
            }
            placeholder="G-…"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">GTM ID</span>
          <input
            className="rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
            value={site.analytics.gtmId}
            onChange={(e) =>
              setSite({ ...site, analytics: { ...site.analytics, gtmId: e.target.value } })
            }
            placeholder="GTM-…"
          />
        </label>
      </section>

      <section className="flex flex-col gap-4 border-t border-border pt-6">
        <h2 className="font-display text-lg font-semibold">Varsayılan SEO</h2>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Site name</span>
          <input
            className="rounded-md border border-input bg-background px-3 py-2"
            value={seo.siteName}
            onChange={(e) => setSeo({ ...seo, siteName: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Title template</span>
          <input
            className="rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
            value={seo.titleTemplate}
            onChange={(e) => setSeo({ ...seo, titleTemplate: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Default description</span>
          <textarea
            className="min-h-20 rounded-md border border-input bg-background px-3 py-2"
            value={seo.defaultDescription}
            onChange={(e) => setSeo({ ...seo, defaultDescription: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Default OG image URL</span>
          <input
            className="rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
            value={seo.defaultOgImageUrl}
            onChange={(e) => setSeo({ ...seo, defaultOgImageUrl: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Organization</span>
          <input
            className="rounded-md border border-input bg-background px-3 py-2"
            value={seo.organizationName}
            onChange={(e) => setSeo({ ...seo, organizationName: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Twitter handle</span>
          <input
            className="rounded-md border border-input bg-background px-3 py-2"
            value={seo.twitterHandle}
            onChange={(e) => setSeo({ ...seo, twitterHandle: e.target.value })}
          />
        </label>
      </section>

      <button
        type="submit"
        disabled={saving}
        className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
      >
        {saving ? 'Kaydediliyor…' : 'Kaydet'}
      </button>

      <MediaPicker
        open={picker != null}
        onClose={() => setPicker(null)}
        onSelect={onPick}
        title={picker === 'favicon' ? 'Favicon seç' : 'Logo seç'}
      />
    </form>
  );
}
