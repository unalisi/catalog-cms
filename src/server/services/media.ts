import { env } from 'cloudflare:workers';
import { z } from 'zod';
import {
  ALLOWED_MIME,
  MAX_UPLOAD_BYTES,
  buildMediaObjectKey,
  extFromMime,
  mediaPublicPath,
  mediaTransformPath,
  type ImageWidth,
} from '../../lib/media/urls';
import { zodFieldErrors } from '../../lib/validation/admin';
import { getDb } from '../db';
import * as mediaRepo from '../repos/media';

const altUpdateSchema = z.object({
  alt: z.string().min(1, 'Alt metin zorunlu').max(300),
});

function readableFromArrayBuffer(buffer: ArrayBuffer): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(buffer));
      controller.close();
    },
  });
}

async function readImageInfo(buffer: ArrayBuffer): Promise<{ width: number; height: number } | null> {
  try {
    const info = await env.IMAGES.info(readableFromArrayBuffer(buffer));
    if ('width' in info && 'height' in info) {
      return { width: info.width, height: info.height };
    }
    return null;
  } catch {
    return null;
  }
}

export async function listAdminMedia(opts: { q?: string; page?: number; pageSize?: number }) {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, opts.pageSize ?? 24));
  return mediaRepo.listMedia(getDb(), { q: opts.q, page, pageSize });
}

export async function getAdminMedia(id: string) {
  return mediaRepo.getMediaById(getDb(), id);
}

export async function uploadAdminMedia(formData: FormData): Promise<
  | { ok: true; data: Awaited<ReturnType<typeof mediaRepo.createMediaRecord>> & { thumbUrl: string } }
  | { ok: false; fields: Record<string, string> }
> {
  const file = formData.get('file');
  const altRaw = formData.get('alt');
  const alt = typeof altRaw === 'string' ? altRaw.trim() : '';

  if (!alt) {
    return { ok: false, fields: { alt: 'Alt metin zorunlu (erişilebilirlik)' } };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, fields: { file: 'Dosya gerekli' } };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, fields: { file: 'Dosya en fazla 10 MB olabilir' } };
  }

  const mime = (file.type || 'application/octet-stream').toLowerCase();
  if (!ALLOWED_MIME.has(mime)) {
    return {
      ok: false,
      fields: { file: 'Yalnızca JPEG, PNG, WebP, GIF veya SVG' },
    };
  }

  const buffer = await file.arrayBuffer();
  const info = mime === 'image/svg+xml' ? null : await readImageInfo(buffer);
  const key = buildMediaObjectKey(extFromMime(mime));

  await env.MEDIA.put(key, buffer, {
    httpMetadata: { contentType: mime },
    customMetadata: { alt },
  });

  const record = await mediaRepo.createMediaRecord(getDb(), {
    key,
    alt,
    mime,
    sizeBytes: file.size,
    width: info?.width ?? null,
    height: info?.height ?? null,
    source: 'upload',
  });

  return {
    ok: true,
    data: {
      ...record,
      thumbUrl: mediaTransformPath(record.key, 320),
    },
  };
}

export async function updateAdminMedia(id: string, input: unknown) {
  const parsed = altUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, fields: zodFieldErrors(parsed.error) };
  }
  const updated = await mediaRepo.updateMediaAlt(getDb(), id, parsed.data.alt.trim());
  if (!updated) return { ok: false as const, notFound: true as const };
  return { ok: true as const, data: updated };
}

export async function removeAdminMedia(id: string) {
  const db = getDb();
  const existing = await mediaRepo.getMediaById(db, id);
  if (!existing) return { ok: false as const, notFound: true as const };

  const refs = await mediaRepo.countMediaReferences(db, id);
  if (refs > 0) {
    return {
      ok: false as const,
      fields: { _form: `Bu medya ${refs} yerde kullanılıyor; önce bağlantıları kaldırın` },
    };
  }

  await env.MEDIA.delete(existing.key);
  const deleted = await mediaRepo.deleteMediaRecord(db, id);
  return { ok: true as const, data: deleted };
}

export async function serveMediaObject(
  key: string,
  width: number | null,
): Promise<Response> {
  const object = await env.MEDIA.get(key);
  if (!object) {
    return new Response('Not found', { status: 404 });
  }

  const contentType = object.httpMetadata?.contentType || 'application/octet-stream';
  const headers = new Headers();
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');

  const canTransform =
    width != null &&
    contentType !== 'image/svg+xml' &&
    contentType !== 'image/gif' &&
    contentType.startsWith('image/');

  if (canTransform) {
    try {
      const buffer = await object.arrayBuffer();
      const result = await env.IMAGES.input(readableFromArrayBuffer(buffer))
        .transform({ width, fit: 'scale-down' })
        .output({ format: 'image/webp', quality: 75 });
      const response = result.response();
      headers.set('Content-Type', result.contentType());
      return new Response(response.body, { status: 200, headers });
    } catch {
      // Transform failed (unsupported/corrupt) — re-fetch original bytes.
      const original = await env.MEDIA.get(key);
      if (!original) {
        return new Response('Not found', { status: 404 });
      }
      headers.set('Content-Type', contentType);
      if (original.size) headers.set('Content-Length', String(original.size));
      return new Response(original.body, { status: 200, headers });
    }
  }

  headers.set('Content-Type', contentType);
  if (object.size) headers.set('Content-Length', String(object.size));
  return new Response(object.body, { status: 200, headers });
}

export { mediaPublicPath, mediaTransformPath };
export type { ImageWidth };
