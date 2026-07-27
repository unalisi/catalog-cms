import { env } from 'cloudflare:workers';

/** Sliding window counter in CACHE KV. Returns false when limit exceeded. */
export async function rateLimit(
  bucket: string,
  id: string,
  limit: number,
  ttlSeconds = 60,
): Promise<boolean> {
  const key = `rl:${bucket}:${id || 'unknown'}`;
  const current = Number((await env.CACHE.get(key)) ?? '0');
  if (current >= limit) return false;
  await env.CACHE.put(key, String(current + 1), {
    expirationTtl: Math.max(60, ttlSeconds),
  });
  return true;
}

export function clientIp(request: Request, fallback = 'unknown'): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    fallback
  );
}

export function newRequestId(): string {
  return crypto.randomUUID().slice(0, 8);
}

export function logEvent(fields: Record<string, unknown>) {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      ...fields,
    }),
  );
}
