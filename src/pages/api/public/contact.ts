import type { APIRoute } from 'astro';
import { contactMessageSchema } from '../../../lib/validation/contact';
import { clientIp, rateLimit } from '../../../lib/security/rate-limit';
import { getDb } from '../../../server/db';
import * as contactRepo from '../../../server/repos/contact';

export const POST: APIRoute = async (context) => {
  const ip = clientIp(context.request, context.clientAddress || 'unknown');
  if (!(await rateLimit('contact', ip, 8, 60))) {
    return Response.json(
      { ok: false, error: { code: 'rate_limited', message: 'Çok fazla istek. Biraz sonra tekrar deneyin.' } },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await context.request.json();
  } catch {
    return Response.json(
      { ok: false, error: { code: 'bad_request', message: 'Geçersiz JSON' } },
      { status: 400 },
    );
  }

  const parsed = contactMessageSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: { code: 'validation', message: 'Formu kontrol edin' } },
      { status: 400 },
    );
  }

  // Honeypot filled → pretend success
  if (parsed.data.website?.trim()) {
    return Response.json({ ok: true, data: { id: 'ok' } });
  }

  const row = await contactRepo.insertContactMessage(getDb(), {
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone ?? '',
    message: parsed.data.message,
  });

  return Response.json({ ok: true, data: { id: row.id } });
};
