import { useEffect, useId, useState } from 'react';
import { X } from 'lucide-react';
import { channelHref } from '../../lib/sections/registry';

export type WhatsAppFloatProps = {
  phone: string;
  position: 'bottom-right' | 'bottom-left';
  headline: string;
  description: string;
  agentLabel: string;
  agentSubtitle: string;
  statusHint: string;
};

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function WhatsAppFloat({
  phone,
  position,
  headline,
  description,
  agentLabel,
  agentSubtitle,
  statusHint,
}: WhatsAppFloatProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const href = channelHref('whatsapp', phone);
  const sideClass = position === 'bottom-left' ? 'left-4 md:left-6' : 'right-4 md:right-6';

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!phone.trim()) return null;

  return (
    <div className={`pointer-events-none fixed bottom-4 z-50 md:bottom-6 ${sideClass}`}>
      <div
        className={`pointer-events-auto flex flex-col gap-3 ${
          position === 'bottom-left' ? 'items-start' : 'items-end'
        }`}
      >
        {open ? (
          <div
            id={panelId}
            role="dialog"
            aria-label={headline || 'WhatsApp'}
            className="w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-border bg-background shadow-lg"
          >
            <div className="flex gap-3 bg-whatsapp px-4 py-4 text-whatsapp-foreground">
              <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-background/15">
                <WhatsAppGlyph className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="font-display text-base font-semibold leading-tight">{headline}</p>
                {description ? (
                  <p className="mt-1 text-sm leading-snug opacity-90">{description}</p>
                ) : null}
              </div>
            </div>
            <div className="bg-background p-3">
              {statusHint ? (
                <p className="mb-2 px-1 text-xs text-muted-foreground">{statusHint}</p>
              ) : null}
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-border px-3 py-3 transition-colors hover:border-whatsapp hover:bg-muted/40"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-whatsapp text-whatsapp-foreground">
                  <WhatsAppGlyph className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-sm font-semibold text-foreground">
                    {agentLabel}
                  </span>
                  {agentSubtitle ? (
                    <span className="mt-0.5 block text-xs text-muted-foreground">{agentSubtitle}</span>
                  ) : null}
                </span>
                <WhatsAppGlyph className="size-4 shrink-0 text-whatsapp" />
              </a>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          aria-label={open ? 'WhatsApp panelini kapat' : 'WhatsApp ile iletişim'}
          className="inline-flex size-14 items-center justify-center rounded-full bg-whatsapp text-whatsapp-foreground shadow-md transition hover:opacity-90"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-6" /> : <WhatsAppGlyph className="size-7" />}
        </button>
      </div>
    </div>
  );
}
