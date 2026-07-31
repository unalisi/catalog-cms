import type { SiteNavbarProps } from './types';
import {
  BrandLink,
  CtaButtons,
  HamburgerButton,
  MegaPanel,
  MobileAccordion,
  NavScrim,
  useOpenPanel,
} from './shared';
import { cn } from './types';

export function MegaNavbar({ siteName, logoUrl, logoAlt, items, ctas }: SiteNavbarProps) {
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
    openId?.startsWith('mega-') ? Number(openId.slice('mega-'.length)) : -1;
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
          <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3 md:px-6">
            <BrandLink siteName={siteName} logoUrl={logoUrl} logoAlt={logoAlt} />

            <nav aria-label="Ana menü" className="hidden flex-1 items-center gap-1 md:flex">
              {items.map((item, index) => {
                const id = `mega-${index}`;
                if (item.kind === 'link') {
                  return (
                    <a
                      key={id}
                      href={item.href}
                      className="relative px-3 py-2 text-sm font-semibold text-foreground/75 after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-primary after:transition-transform after:duration-200 hover:text-foreground hover:after:scale-x-100 motion-reduce:after:transition-none"
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
                      'relative px-3 py-2 text-sm font-semibold after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-primary after:transition-opacity after:duration-200 motion-reduce:after:transition-none',
                      open
                        ? 'text-foreground after:opacity-100'
                        : 'text-foreground/75 after:opacity-0 hover:text-foreground',
                    )}
                    aria-expanded={open}
                    onMouseEnter={() => openWithIntent(id)}
                    onFocus={() => openWithIntent(id)}
                    onClick={() => setOpenId(open ? null : id)}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="ml-auto flex items-center gap-2">
              <CtaButtons ctas={ctas} className="hidden md:flex" />
              <HamburgerButton open={mobileOpen} onClick={() => setMobileOpen((v) => !v)} />
            </div>
          </div>

          {/* Full-bleed mega panel — single active panel */}
          <div
            className={cn(
              'absolute inset-x-0 top-full z-40 hidden border-b border-border bg-background md:block',
              'transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none',
              panelOpen
                ? 'pointer-events-auto translate-y-0 opacity-100'
                : 'pointer-events-none -translate-y-1 opacity-0',
            )}
            aria-hidden={!panelOpen}
          >
            {openItem?.kind === 'panel' ? (
              <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
                <MegaPanel panel={openItem.panel} />
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
              panelVariant="mega"
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      </header>

      <NavScrim open={panelOpen} onClose={() => setOpenId(null)} />
    </>
  );
}
