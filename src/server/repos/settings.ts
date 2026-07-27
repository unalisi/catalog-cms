import { eq } from 'drizzle-orm';
import { settings } from '../../../db/schema';
import type { Db } from '../db';
import { nowIso } from '../../lib/utils/id';
import {
  DEFAULT_SITE_SETTINGS,
  siteSettingsSchema,
  type SiteSettings,
} from '../../lib/validation/settings';
import { getMediaById } from './media';

export async function getSiteSettings(db: Db): Promise<SiteSettings> {
  const [row] = await db.select().from(settings).where(eq(settings.key, 'site')).limit(1);
  if (!row) return DEFAULT_SITE_SETTINGS;
  try {
    const parsed = siteSettingsSchema.safeParse(JSON.parse(row.valueJson));
    return parsed.success
      ? { ...DEFAULT_SITE_SETTINGS, ...parsed.data }
      : DEFAULT_SITE_SETTINGS;
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}

export async function saveSiteSettings(db: Db, input: SiteSettings): Promise<SiteSettings> {
  const valueJson = JSON.stringify(input);
  const now = nowIso();
  const [existing] = await db.select().from(settings).where(eq(settings.key, 'site')).limit(1);
  if (existing) {
    await db.update(settings).set({ valueJson, updatedAt: now }).where(eq(settings.key, 'site'));
  } else {
    await db.insert(settings).values({ key: 'site', valueJson, updatedAt: now });
  }
  return input;
}

export async function resolveSiteSettingsPublic(db: Db) {
  const site = await getSiteSettings(db);
  const logo = site.logoMediaId ? await getMediaById(db, site.logoMediaId) : null;
  const favicon = site.faviconMediaId ? await getMediaById(db, site.faviconMediaId) : null;
  return {
    ...site,
    logoUrl: logo?.url ?? null,
    logoAlt: logo?.alt ?? site.name,
    faviconUrl: favicon?.url ?? null,
  };
}
