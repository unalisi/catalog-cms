import { env } from 'cloudflare:workers';
import { logEvent } from '../../lib/security/rate-limit';

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendEmailResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

function getResendConfig(): { apiKey: string; from: string } | null {
  const apiKey = (env.RESEND_API_KEY ?? '').trim();
  const from = (env.CONTACT_FROM_EMAIL ?? '').trim();
  if (!apiKey || !from) return null;
  return { apiKey, from };
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const config = getResendConfig();
  if (!config) {
    logEvent({
      level: 'warn',
      msg: 'email_skipped_missing_config',
      to: input.to,
      subject: input.subject,
    });
    return { ok: false, error: 'E-posta yapılandırması eksik (RESEND_API_KEY / CONTACT_FROM_EMAIL)' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: config.from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      logEvent({
        level: 'error',
        msg: 'email_send_failed',
        status: res.status,
        body: body.slice(0, 300),
        to: input.to,
      });
      return { ok: false, error: `Resend hata: ${res.status}` };
    }

    const json = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, id: json.id };
  } catch (err) {
    logEvent({
      level: 'error',
      msg: 'email_send_exception',
      error: err instanceof Error ? err.message : String(err),
      to: input.to,
    });
    return { ok: false, error: 'E-posta gönderilemedi' };
  }
}
