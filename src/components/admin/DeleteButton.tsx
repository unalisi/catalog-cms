import { useState } from 'react';
import type { ApiResult } from '../../lib/api';

type Props = {
  endpoint: string;
  label?: string;
};

export default function DeleteButton({ endpoint, label = 'Sil' }: Props) {
  const [busy, setBusy] = useState(false);

  async function onClick() {
    if (!window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
    setBusy(true);
    const res = await fetch(endpoint, { method: 'DELETE' });
    const json = (await res.json()) as ApiResult<unknown>;
    setBusy(false);
    if (!json.ok) {
      window.alert(json.error.message ?? 'Silinemedi');
      return;
    }
    window.location.reload();
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="text-sm text-destructive hover:underline disabled:opacity-60"
    >
      {busy ? 'Siliniyor…' : label}
    </button>
  );
}
