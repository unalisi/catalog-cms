import { useState } from 'react';
import type { ApiResult } from '../../lib/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function ForcePasswordChangeModal() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) {
      setError('Yeni parola en az 8 karakter olmalı');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Yeni parolalar eşleşmiyor');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/admin/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = (await res.json()) as ApiResult<unknown>;
      if (!json.ok) {
        setError(
          json.error.message +
            (json.error.fields ? `: ${Object.values(json.error.fields).join(', ')}` : ''),
        );
        return;
      }
      window.location.reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open modal>
      <DialogContent
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Parolanızı değiştirin</DialogTitle>
          <DialogDescription>
            Güvenlik için sistem tarafından atanan geçici parolayı değiştirmeden panele devam
            edemezsiniz.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-3" onSubmit={(e) => void onSubmit(e)}>
          {error && (
            <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Mevcut (geçici) parola</span>
            <input
              className="rounded-md border border-input bg-background px-3 py-2"
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Yeni parola</span>
            <input
              className="rounded-md border border-input bg-background px-3 py-2"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Yeni parola (tekrar)</span>
            <input
              className="rounded-md border border-input bg-background px-3 py-2"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </label>
          <Button type="submit" disabled={busy} variant="primary" className="mt-1">
            {busy ? 'Kaydediliyor…' : 'Parolayı kaydet'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
