import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { NavbarCta, ResolvedNavItem, NavPanel, NavPanelItem } from '../../../lib/navigation/nav';
import { cn } from './types';

const CLOSE_DELAY_MS = 140;

export function useOpenPanel() {
  const [openId, setOpenIdState] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const setOpenId = useCallback(
    (id: string | null) => {
      clearCloseTimer();
      setOpenIdState(id);
    },
    [clearCloseTimer],
  );

  const openWithIntent = useCallback(
    (id: string) => {
      clearCloseTimer();
      setOpenIdState(id);
    },
    [clearCloseTimer],
  );

  const scheduleClose = useCallback(
    (delayMs = CLOSE_DELAY_MS) => {
      clearCloseTimer();
      closeTimer.current = setTimeout(() => {
        setOpenIdState(null);
        closeTimer.current = null;
      }, delayMs);
    },
    [clearCloseTimer],
  );

  const cancelClose = useCallback(() => {
    clearCloseTimer();
  }, [clearCloseTimer]);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        clearCloseTimer();
        setOpenIdState(null);
        setMobileOpen(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clearCloseTimer]);

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  return {
    openId,
    setOpenId,
    openWithIntent,
    scheduleClose,
    cancelClose,
    mobileOpen,
    setMobileOpen,
    scrolled,
  };
}

export function NavScrim({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <button
      type="button"
      aria-label="Menüyü kapat"
      tabIndex={open ? 0 : -1}
      className={cn(
        'fixed inset-0 z-30 hidden md:block',
        'bg-foreground/15 backdrop-blur-[1px] transition-opacity duration-300 motion-reduce:transition-none',
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
      )}
      onClick={onClose}
    />
  );
}

export function CtaButtons({
  ctas,
  className,
  solidClass,
  ghostClass,
  textClass,
}: {
  ctas: NavbarCta[];
  className?: string;
  solidClass?: string;
  ghostClass?: string;
  textClass?: string;
}) {
  if (!ctas.length) return null;
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {ctas.map((cta) => {
        const base =
          cta.variant === 'solid'
            ? solidClass ??
              'rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90'
            : cta.variant === 'text'
              ? textClass ?? 'text-sm font-medium text-muted-foreground hover:text-foreground'
              : ghostClass ??
                'rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted';
        return (
          <a key={`${cta.label}-${cta.href}`} href={cta.href} className={base}>
            {cta.label}
          </a>
        );
      })}
    </div>
  );
}

export function BrandLink({
  siteName,
  logoUrl,
  logoAlt,
  className,
  textClass,
}: {
  siteName: string;
  logoUrl: string | null;
  logoAlt: string;
  className?: string;
  textClass?: string;
}) {
  return (
    <a
      href="/"
      className={cn(
        'flex shrink-0 items-center gap-2 font-display text-lg font-bold tracking-tight',
        className,
      )}
    >
      {logoUrl ? <img src={logoUrl} alt={logoAlt} className="h-8 w-auto" /> : null}
      <span className={cn(logoUrl && 'sr-only md:not-sr-only', textClass)}>{siteName}</span>
    </a>
  );
}

/** Skip root self-link when heading matches first item and siblings exist (dynamic categories). */
function itemsForMegaImgColumn(heading: string, items: NavPanelItem[]): NavPanelItem[] {
  if (items.length <= 1) return items;
  const first = items[0];
  if (first && heading && first.label === heading) {
    return items.slice(1);
  }
  return items;
}

/** Webflow-style mega panel: large links, featured cards, footer strip. */
export function MegaPanel({ panel }: { panel: NavPanel }) {
  const colClass =
    panel.columns.length >= 4
      ? 'md:grid-cols-2 lg:grid-cols-4'
      : panel.columns.length === 3
        ? 'md:grid-cols-3'
        : panel.columns.length === 1
          ? 'md:grid-cols-1'
          : 'md:grid-cols-2';

  return (
    <div className="flex flex-col">
      <div className={cn('grid gap-x-10 gap-y-8', colClass)}>
        {panel.columns.map((col, i) => (
          <div key={`${col.heading}-${i}`} className="flex flex-col gap-4">
            {col.heading ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {col.heading}
              </p>
            ) : null}
            <ul className="flex flex-col gap-3">
              {col.items.map((item) => (
                <li key={`${item.href}-${item.label}`}>
                  <a href={item.href} className="group block">
                    <span className="inline-flex flex-wrap items-center gap-2 font-display text-lg font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary md:text-xl">
                      {item.label}
                      {item.badge ? (
                        <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                          {item.badge}
                        </span>
                      ) : null}
                    </span>
                    {item.description ? (
                      <span className="mt-1 block max-w-[18rem] text-sm leading-snug text-muted-foreground">
                        {item.description}
                      </span>
                    ) : null}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {panel.featured.length > 0 ? (
        <div className="mt-10 grid gap-4 border-t border-border pt-8 md:grid-cols-2">
          {panel.featured.map((f) => (
            <a
              key={f.title}
              href={f.href || '#'}
              className="group relative min-h-[7.5rem] overflow-hidden rounded-2xl border border-border bg-muted"
            >
              {f.imageUrl ? (
                <img
                  src={f.imageUrl}
                  alt=""
                  className="absolute inset-0 size-full object-cover opacity-40 transition duration-300 group-hover:scale-[1.03] group-hover:opacity-50 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-muted to-muted" />
              )}
              <div className="relative flex h-full flex-col justify-end p-6">
                <p className="font-display text-xl font-bold tracking-tight">{f.title}</p>
                {f.description ? (
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">{f.description}</p>
                ) : null}
              </div>
            </a>
          ))}
        </div>
      ) : null}

      {panel.footerLinks.length > 0 ? (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          <div className="flex flex-wrap items-center gap-5 text-sm">
            {panel.footerLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Huts-style icon + title + description cards in a balanced grid. */
export function MegaImgPanel({ panel }: { panel: NavPanel }) {
  const columns = panel.columns.map((col) => ({
    heading: col.heading,
    items: itemsForMegaImgColumn(col.heading, col.items),
  }));

  const hasMultipleColumns = columns.filter((c) => c.items.length > 0).length > 1;

  return (
    <div className="flex flex-col gap-8">
      {hasMultipleColumns ? (
        <div
          className={cn(
            'grid gap-x-10 gap-y-10',
            columns.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2',
          )}
        >
          {columns.map((col, ci) =>
            col.items.length === 0 ? null : (
              <div key={`${col.heading}-${ci}`} className="flex flex-col gap-6">
                {col.heading ? (
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {col.heading}
                  </p>
                ) : null}
                <ul className="flex flex-col gap-5">
                  {col.items.map((item) => (
                    <li key={`${item.href}-${item.label}`}>
                      <MegaImgCard item={item} />
                    </li>
                  ))}
                </ul>
              </div>
            ),
          )}
        </div>
      ) : (
        <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {columns.flatMap((col) =>
            col.items.map((item) => (
              <MegaImgCard key={`${item.href}-${item.label}`} item={item} />
            )),
          )}
        </div>
      )}

      {panel.footerLinks.length > 0 ? (
        <div className="flex flex-wrap gap-4 border-t border-border/70 pt-5 text-sm">
          {panel.footerLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              {l.label}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MegaImgCard({ item }: { item: NavPanelItem }) {
  const img = item.iconUrl || item.imageUrl;
  return (
    <a href={item.href} className="group flex gap-4">
      <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-background transition group-hover:border-primary/40">
        {img ? (
          <img src={img} alt="" className="size-full object-cover" />
        ) : (
          <span className="font-display text-base font-bold text-muted-foreground">
            {item.label.slice(0, 1)}
          </span>
        )}
      </div>
      <div className="min-w-0 pt-0.5">
        <p className="font-display text-lg font-semibold leading-snug tracking-tight transition-colors group-hover:text-primary">
          {item.label}
          {item.badge ? (
            <span className="ml-2 align-middle rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary">
              {item.badge}
            </span>
          ) : null}
        </p>
        {item.description ? (
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {item.description}
          </p>
        ) : null}
      </div>
    </a>
  );
}

export function PanelGrid({
  panel,
  variant,
}: {
  panel: NavPanel;
  variant: 'classic' | 'fullscreen' | 'mega' | 'mega-img';
}) {
  if (variant === 'mega') return <MegaPanel panel={panel} />;
  if (variant === 'mega-img') return <MegaImgPanel panel={panel} />;

  return (
    <div className="flex flex-col gap-6">
      <div
        className={cn(
          'grid gap-6',
          panel.columns.length >= 4
            ? 'md:grid-cols-2 lg:grid-cols-4'
            : panel.columns.length === 3
              ? 'md:grid-cols-3'
              : 'md:grid-cols-2',
        )}
      >
        {panel.columns.map((col, i) => (
          <div key={`${col.heading}-${i}`} className="flex flex-col gap-3">
            {col.heading ? (
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {col.heading}
              </p>
            ) : null}
            <ul className="flex flex-col gap-2">
              {col.items.map((item) => (
                <li key={`${item.href}-${item.label}`}>
                  <a href={item.href} className="group block rounded-md py-1">
                    <span className="text-sm font-semibold text-foreground group-hover:text-primary">
                      {item.label}
                      {item.badge ? (
                        <span className="ml-2 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary">
                          {item.badge}
                        </span>
                      ) : null}
                    </span>
                    {item.description ? (
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    ) : null}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {variant === 'fullscreen' && panel.featured[0] ? (
          <div className="flex flex-col gap-3 border-l border-border pl-6 md:col-span-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Spotlight
            </p>
            <a href={panel.featured[0].href || '#'} className="group block">
              {panel.featured[0].imageUrl ? (
                <img
                  src={panel.featured[0].imageUrl}
                  alt=""
                  className="mb-3 aspect-video w-full rounded-lg object-cover"
                />
              ) : null}
              <p className="font-display text-lg font-semibold group-hover:text-primary">
                {panel.featured[0].title}
              </p>
              {panel.featured[0].description ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {panel.featured[0].description}
                </p>
              ) : null}
            </a>
          </div>
        ) : null}
      </div>

      {panel.footerLinks.length > 0 ? (
        <div className="flex flex-wrap items-center gap-4 border-t border-border pt-4 text-sm">
          {panel.footerLinks.map((l) => (
            <a key={l.href} href={l.href} className="font-medium text-primary hover:underline">
              {l.label}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function MobileAccordion({
  items,
  ctas,
  onNavigate,
  panelVariant = 'classic',
}: {
  items: ResolvedNavItem[];
  ctas: NavbarCta[];
  onNavigate: () => void;
  panelVariant?: 'classic' | 'mega' | 'mega-img';
}) {
  const [open, setOpen] = useState<string | null>(null);
  const baseId = useId();

  return (
    <div className="flex flex-col gap-1 px-2 pb-6">
      {items.map((item, index) => {
        const id = `${baseId}-${index}`;
        if (item.kind === 'link') {
          return (
            <a
              key={id}
              href={item.href}
              onClick={onNavigate}
              className="rounded-md px-3 py-3 text-base font-medium hover:bg-muted"
            >
              {item.label}
            </a>
          );
        }
        const isOpen = open === id;
        return (
          <div key={id} className="border-b border-border">
            <button
              type="button"
              className="flex w-full items-center justify-between px-3 py-3 text-left text-base font-medium"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : id)}
            >
              {item.label}
              <span className="text-muted-foreground">{isOpen ? '×' : '+'}</span>
            </button>
            <div
              className={cn(
                'grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none',
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
              )}
            >
              <div className="overflow-hidden">
                <div className="px-3 pb-4 pt-1">
                  <PanelGrid panel={item.panel} variant={panelVariant} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <div className="mt-4 px-3">
        <CtaButtons
          ctas={ctas}
          className="flex-col items-stretch [&>a]:justify-center [&>a]:text-center"
        />
      </div>
    </div>
  );
}

export function HamburgerButton({
  open,
  onClick,
  className,
}: {
  open: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex size-10 items-center justify-center rounded-md border border-border md:hidden',
        className,
      )}
      aria-expanded={open}
      aria-label={open ? 'Menüyü kapat' : 'Menüyü aç'}
      onClick={onClick}
    >
      <span className="font-mono text-lg">{open ? '×' : '☰'}</span>
    </button>
  );
}
