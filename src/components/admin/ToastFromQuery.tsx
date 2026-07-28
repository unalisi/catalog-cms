import { useEffect } from 'react';
import { toast } from 'sonner';

const MESSAGES: Record<string, string> = {
  saved: 'Kaydedildi.',
  deleted: 'Silindi.',
  created: 'Oluşturuldu.',
  imported: 'İçe aktarım tamamlandı.',
  updated: 'Güncellendi.',
};

/**
 * Bridges SSR `?toast=` flash params to Sonner (DESIGN: bottom-right toasts).
 */
export function ToastFromQuery() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const key = url.searchParams.get('toast');
    if (!key) return;
    const message = MESSAGES[key] ?? (key === 'saved' ? 'Kaydedildi.' : key);
    toast.success(message);
    url.searchParams.delete('toast');
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState({}, '', next);
  }, []);

  return null;
}
