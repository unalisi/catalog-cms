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

export function ClassicNavbar({
  siteName,
  logoUrl,
  logoAlt,
  items,
  ctas,
}: SiteNavbarProps) {
  const { openId, setOpenId, mobileOpen, setMobileOpen, scrolled } = useOpenPanel();

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b transition-[background-color,box-shadow,backdrop-filter] duration-300 motion-reduce:transition-none',
        scrolled
          ? 'border-border/80 bg-background/90 shadow-sm backdrop-blur-md'
          : 'border-border bg-background/80 backdrop-blur-sm',
      )}
    >
      <div className="relative mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 md:px-6">
        <BrandLink siteName={siteName} logoUrl={logoUrl} logoAlt={logoAlt} />

        <nav
          aria-label="Ana menü"
          className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-1 md:flex"
          onMouseLeave={() => setOpenId(null)}
        >
          {items.map((item, index) => {
            const id = `classic-${index}`;
            if (item.kind === 'link') {
              return (
                <a
                  key={id}
                  href={item.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {item.label}
                </a>
              );
            }
            const open = openId === id;
            return (
              <div
                key={id}
                className="relative"
                onMouseEnter={() => setOpenId(id)}
                onFocus={() => setOpenId(id)}
              >
                <button
                  type="button"
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium',
                    open ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? null : id)}
                >
                  {item.label}
                  <span
                    className={cn(
                      'text-[10px] transition-transform duration-200 motion-reduce:transition-none',
                      open && 'rotate-180',
                    )}
                  >
                    ▾
                  </span>
                </button>
                <div
                  className={cn(
                    'absolute left-1/2 top-full z-50 mt-2 w-[min(90vw,720px)] -translate-x-1/2 rounded-xl border border-border bg-background p-6 shadow-xl transition-[opacity,transform] duration-200 motion-reduce:transition-none',
                    open
                      ? 'pointer-events-auto translate-y-0 opacity-100'
                      : 'pointer-events-none -translate-y-1 opacity-0',
                  )}
                >
                  <PanelGrid panel={item.panel} variant="classic" />
                </div>
              </div>
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
  );
}
