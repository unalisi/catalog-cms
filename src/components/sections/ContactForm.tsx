import { useState, type FormEvent } from 'react';
import type { ApiResult } from '../../lib/api';

type Props = {
  title?: string;
  submitLabel?: string;
  successMessage?: string;
};

export default function ContactForm({
  title = 'Mesaj gönderin',
  submitLabel = 'Gönder',
  successMessage = 'Mesajınız alındı. En kısa sürede dönüş yapacağız.',
}: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch('/api/public/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, message, website: honeypot }),
    });
    const json = (await res.json()) as ApiResult<{ id: string }>;
    setSaving(false);
    if (!json.ok) {
      setError(json.error.message ?? 'Gönderilemedi');
      return;
    }
    setDone(true);
    setName('');
    setEmail('');
    setPhone('');
    setMessage('');
  }

  if (done) {
    return (
      <div className="rounded-md border border-border bg-muted/30 px-4 py-6 text-sm text-foreground">
        {successMessage}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {title ? <h3 className="font-display text-lg font-semibold tracking-tight">{title}</h3> : null}
      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Ad Soyad</span>
        <input
          required
          className="rounded-md border border-input bg-background px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">E-posta</span>
        <input
          required
          type="email"
          className="rounded-md border border-input bg-background px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Telefon</span>
        <input
          className="rounded-md border border-input bg-background px-3 py-2"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Mesaj</span>
        <textarea
          required
          className="min-h-28 rounded-md border border-input bg-background px-3 py-2"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </label>
      <button
        type="submit"
        disabled={saving}
        className="inline-flex w-fit rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {saving ? 'Gönderiliyor…' : submitLabel}
      </button>
    </form>
  );
}
