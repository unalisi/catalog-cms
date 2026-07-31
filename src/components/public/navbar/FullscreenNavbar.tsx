import type { SiteNavbarProps } from './types';
import {
  BrandLink,
  CtaButtons,
  HamburgerButton,
  MobileAccordion,
  PanelGrid,
  useOpenPanel,
} from './shared';
import { cn } from './types';

export function FullscreenNavbar({
  siteName,
  logoUrl,
  logoAlt,
  items,
  ctas,
}: SiteNavbarProps) {
  const { openId, setOpenId, mobileOpen, setMobileOpen, scrolled } = useOpenPanel();
  const openItem =
    openId != null ? items[Number(openId.replace('fs-', ''))] : null;
  const panelOpen = openItem?.kind === 'panel';

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 transition-[background-color,backdrop-filter] duration-300 motion-reduce:transition-none',
          scrolled || panelOpen || mobileOpen
            ? 'border-b border-border/60 bg-background/85 backdrop-blur-md'
            : 'border-b border-transparent bg-transparent',
        )}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4 md:px-6">
          <BrandLink siteName={siteName} logoUrl={logoUrl} logoAlt={logoAlt} />

          <nav
            aria-label="Ana menü"
            className="ml-6 hidden flex-1 items-center gap-1 md:flex"
          >
            {items.map((item, index) => {
              const id = `fs-${index}`;
              if (item.kind === 'link') {
                return (
                  <a
                    key={id}
                    href={item.href}
                    className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground"
                  >
                    {item.label}
                  </a>
                );
              }
              const open = openId === id;
              return (
                <button
                  key={id}
                  type="button"
                  className={cn(
                    'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium',
                    open ? 'text-foreground' : 'text-foreground/80 hover:text-foreground',
                  )}
                  aria-expanded={open}
                  onMouseEnter={() => setOpenId(id)}
                  onFocus={() => setOpenId(id)}
                  onClick={() => setOpenId(open ? null : id)}
                >
                  {item.label}
                  <span className="font-mono text-base leading-none">{open ? '−' : '+'}</span>
                </button>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <CtaButtons ctas={ctas} className="hidden md:flex" />
            <HamburgerButton open={mobileOpen} onClick={() => setMobileOpen((v) => !v)} />
          </div>
        </div>

        <div
          className={cn(
            'border-t border-border bg-background md:hidden',
            'grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none',
            mobileOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
          )}
        >
          <div className="overflow-hidden">
            <MobileAccordion
              items={items}
              ctas={ctas}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      </header>

      {/* Fullscreen overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 hidden md:block',
          panelOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
        aria-hidden={!panelOpen}
      >
        <button
          type="button"
          className={cn(
            'absolute inset-0 bg-background/70 backdrop-blur-md transition-opacity duration-300 motion-reduce:transition-none',
            panelOpen ? 'opacity-100' : 'opacity-0',
          )}
          aria-label="Menüyü kapat"
          onClick={() => setOpenId(null)}
        />
        <div
          className={cn(
            'absolute inset-x-0 top-[4.5rem] mx-auto max-h-[calc(100dvh-5rem)] max-w-6xl overflow-y-auto px-4 pb-10 md:px-6',
            'transition-[opacity,transform] duration-300 motion-reduce:transition-none',
            panelOpen ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0',
          )}
          onMouseLeave={() => setOpenId(null)}
        >
          {openItem?.kind === 'panel' ? (
            <div className="relative rounded-2xl border border-border bg-background/95 p-8 shadow-2xl">
              <button
                type="button"
                className="absolute right-4 top-4 inline-flex size-9 items-center justify-center rounded-full border border-border text-lg hover:bg-muted"
                aria-label="Kapat"
                onClick={() => setOpenId(null)}
              >
                ×
              </button>
              <p className="mb-6 font-display text-2xl font-bold tracking-tight">
                {openItem.label}
              </p>
              <PanelGrid panel={openItem.panel} variant="fullscreen" />
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
