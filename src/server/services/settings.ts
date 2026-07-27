import { CACHE_KEYS, CACHE_TTL } from '../../lib/cache/keys';
import { cacheDelete, cacheFirst } from '../../lib/cache/kv';
import { siteSettingsSchema, type SiteSettings } from '../../lib/validation/settings';
import { zodFieldErrors } from '../../lib/validation/admin';
import { getDb } from '../db';
import * as settingsRepo from '../repos/settings';
import { getSeoDefaults, updateSeoDefaults } from './seo';
import { seoDefaultsSchema } from '../../lib/validation/seo';

export async function getCachedSiteSettings() {
  return cacheFirst(CACHE_KEYS.settings, CACHE_TTL.settings, () =>
    settingsRepo.resolveSiteSettingsPublic(getDb()),
  );
}

export async function getCachedNav() {
  return cacheFirst(CACHE_KEYS.nav, CACHE_TTL.settings, async () => {
    const site = await settingsRepo.getSiteSettings(getDb());
    return site.navigation;
  });
}

export async function getAdminSiteSettings() {
  return settingsRepo.resolveSiteSettingsPublic(getDb());
}

export async function updateAdminSiteSettings(input: unknown) {
  const parsed = siteSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, fields: zodFieldErrors(parsed.error) };
  }
  const saved = await settingsRepo.saveSiteSettings(getDb(), parsed.data);
  await cacheDelete(CACHE_KEYS.settings, CACHE_KEYS.nav);
  return { ok: true as const, data: saved };
}

export async function updateAdminSettingsBundle(input: unknown) {
  const body = input as { site?: unknown; seo?: unknown };
  const fields: Record<string, string> = {};

  let site: SiteSettings | undefined;
  if (body.site !== undefined) {
    const parsed = siteSettingsSchema.safeParse(body.site);
    if (!parsed.success) {
      Object.assign(fields, zodFieldErrors(parsed.error));
    } else {
      site = parsed.data;
    }
  }

  if (body.seo !== undefined) {
    const parsed = seoDefaultsSchema.safeParse(body.seo);
    if (!parsed.success) {
      for (const [k, v] of Object.entries(zodFieldErrors(parsed.error))) {
        fields[`seo.${k}`] = v;
      }
    } else if (Object.keys(fields).length === 0) {
      await updateSeoDefaults(parsed.data);
    }
  }

  if (Object.keys(fields).length > 0) {
    return { ok: false as const, fields };
  }

  if (site) {
    await settingsRepo.saveSiteSettings(getDb(), site);
    await cacheDelete(CACHE_KEYS.settings, CACHE_KEYS.nav);
  }

  const [siteOut, seoOut] = await Promise.all([
    settingsRepo.resolveSiteSettingsPublic(getDb()),
    getSeoDefaults(),
  ]);

  return {
    ok: true as const,
    data: { site: siteOut, seo: seoOut.data },
  };
}
