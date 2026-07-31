import type { SiteNavbarProps } from './types';
import {
  BrandLink,
  CtaButtons,
  HamburgerButton,
  MegaImgPanel,
  MobileAccordion,
  NavScrim,
  useOpenPanel,
} from './shared';
import { cn } from './types';

export function MegaImgNavbar({
  siteName,
  logoUrl,
  logoAlt,
  items,
  ctas,
}: SiteNavbarProps) {
  const {
    openId,
    setOpenId,
    openWithIntent,
    scheduleClose,
    cancelClose,
    mobileOpen,
    setMobileOpen,
    scrolled,
  } = useOpenPanel();

  const openIndex =
    openId?.startsWith('mimg-') ? Number(openId.slice('mimg-'.length)) : -1;
  const openItem =
    openIndex >= 0 && items[openIndex]?.kind === 'panel' ? items[openIndex] : null;
  const panelOpen = openItem != null;

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 border-b border-border bg-background transition-shadow duration-300 motion-reduce:transition-none',
          (scrolled || panelOpen) && 'shadow-sm',
        )}
      >
        <div
          className="relative"
          onMouseLeave={() => scheduleClose()}
          onMouseEnter={() => cancelClose()}
        >
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 md:px-6">
            <BrandLink siteName={siteName} logoUrl={logoUrl} logoAlt={logoAlt} />

            <nav
              aria-label="Ana menü"
              className="ml-2 hidden flex-1 items-center justify-end gap-0.5 md:flex lg:ml-6 lg:justify-start"
            >
              {items.map((item, index) => {
                const id = `mimg-${index}`;
                if (item.kind === 'link') {
                  return (
                    <a
                      key={id}
                      href={item.href}
                      className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
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
                      'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      open
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                    )}
                    aria-expanded={open}
                    onMouseEnter={() => openWithIntent(id)}
                    onFocus={() => openWithIntent(id)}
                    onClick={() => setOpenId(open ? null : id)}
                  >
                    {item.label}
                    <span
                      className="inline-flex size-5 items-center justify-center rounded border border-border font-mono text-xs leading-none"
                      aria-hidden
                    >
                      {open ? '×' : '+'}
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="ml-auto flex items-center gap-2">
              <CtaButtons ctas={ctas} className="hidden md:flex" />
              <HamburgerButton open={mobileOpen} onClick={() => setMobileOpen((v) => !v)} />
            </div>
          </div>

          {/* Full-bleed Huts-style panel — flush under bar, no gap */}
          <div
            className={cn(
              'absolute inset-x-0 top-full z-40 hidden overflow-hidden border-b border-border bg-muted/35 md:block',
              'rounded-b-2xl shadow-lg',
              'transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none',
              panelOpen
                ? 'pointer-events-auto translate-y-0 opacity-100'
                : 'pointer-events-none translate-y-2 opacity-0',
            )}
            aria-hidden={!panelOpen}
          >
            {openItem?.kind === 'panel' ? (
              <div className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-12">
                <MegaImgPanel panel={openItem.panel} />
              </div>
            ) : null}
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
              panelVariant="mega-img"
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      </header>

      <NavScrim open={panelOpen} onClose={() => setOpenId(null)} />
    </>
  );
}
