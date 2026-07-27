import { CACHE_KEYS, CACHE_TTL } from '../../lib/cache/keys';
import { cacheDelete, cacheFirst } from '../../lib/cache/kv';
import {
  DEFAULT_SEO_SETTINGS,
  redirectSchema,
  seoDefaultsSchema,
  seoFieldsSchema,
} from '../../lib/validation/seo';
import { zodFieldErrors } from '../../lib/validation/admin';
import { getDb } from '../db';
import * as seoRepo from '../repos/seo';

export async function getSeoDefaultsCached() {
  return cacheFirst(CACHE_KEYS.settings, CACHE_TTL.settings, async () => {
    // Keep site + seo in separate keys? Use dedicated key for seo defaults.
    return seoRepo.getSeoDefaults(getDb());
  });
}

export async function getSeoDefaults() {
  // Prefer dedicated cache key
  return cacheFirst('settings:seo', CACHE_TTL.settings, () => seoRepo.getSeoDefaults(getDb()));
}

export async function updateSeoDefaults(input: unknown) {
  const parsed = seoDefaultsSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, fields: zodFieldErrors(parsed.error) };
  const data = await seoRepo.saveSeoDefaults(getDb(), parsed.data);
  await cacheDelete('settings:seo', CACHE_KEYS.settings);
  return { ok: true as const, data };
}

export async function listRedirectsAdmin() {
  return seoRepo.listRedirects(getDb());
}

export async function findRedirect(pathname: string) {
  return seoRepo.getRedirectByFromPath(getDb(), pathname);
}

export async function createRedirectAdmin(input: unknown) {
  const parsed = redirectSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, fields: zodFieldErrors(parsed.error) };
  if (parsed.data.fromPath === parsed.data.toPath) {
    return { ok: false as const, fields: { toPath: 'Kaynak ve hedef aynı olamaz' } };
  }
  const existing = await seoRepo.getRedirectByFromPath(getDb(), parsed.data.fromPath);
  if (existing) {
    return { ok: false as const, fields: { fromPath: 'Bu kaynaktan zaten yönlendirme var' } };
  }
  const data = await seoRepo.createRedirect(getDb(), parsed.data);
  return { ok: true as const, data };
}

export async function removeRedirectAdmin(id: string) {
  const deleted = await seoRepo.deleteRedirect(getDb(), id);
  if (!deleted) return { ok: false as const, notFound: true as const };
  return { ok: true as const, data: deleted };
}

export function parseSeoFields(input: unknown) {
  if (input == null) return { ok: true as const, data: null };
  const parsed = seoFieldsSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, fields: zodFieldErrors(parsed.error) };
  return { ok: true as const, data: parsed.data };
}

export { DEFAULT_SEO_SETTINGS };
