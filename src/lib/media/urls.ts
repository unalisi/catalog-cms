/** Allowed transform widths (ARCHITECTURE §7). */
export const IMAGE_WIDTHS = [64, 128, 320, 640, 960, 1280, 1920] as const;
export type ImageWidth = (typeof IMAGE_WIDTHS)[number];

export const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export function isAllowedWidth(width: number): width is ImageWidth {
  return (IMAGE_WIDTHS as readonly number[]).includes(width);
}

export function mediaPublicPath(key: string): string {
  return `/media/${key.replace(/^\/+/, '')}`;
}

/** Transform URL for public delivery via Worker + Images binding. */
export function mediaTransformPath(key: string, width: ImageWidth): string {
  return `${mediaPublicPath(key)}?w=${width}`;
}

export function extFromMime(mime: string): string {
  switch (mime) {
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    case 'image/svg+xml':
      return 'svg';
    default:
      return 'bin';
  }
}

export function buildMediaObjectKey(ext: string, now = new Date()): string {
  const yyyy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 20);
  return `media/${yyyy}/${mm}/${id}.${ext}`;
}
