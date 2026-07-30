import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useSidebar } from '@/components/ui/sidebar';
import {
  filterMobileTabs,
  filterMoreNavGroups,
  isNavActive,
} from '@/components/admin/nav';
import { useAdminChrome } from '@/components/admin/AdminChromeContext';
import { cn } from '@/lib/utils';

type Props = {
  pathname: string;
  permissions: string[];
};

export function AdminBottomBar({ pathname, permissions }: Props) {
  const [moreOpen, setMoreOpen] = useState(false);
  const { setOpenMobile } = useSidebar();
  const { hideBottomBar } = useAdminChrome();
  const tabs = filterMobileTabs(permissions);
  const moreGroups = filterMoreNavGroups(permissions);
  const onBuilder = pathname.startsWith('/admin/builder');

  if (hideBottomBar || onBuilder) return null;

  function openMore() {
    setOpenMobile(false);
    setMoreOpen(true);
  }

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Mobil navigasyon"
      >
        <div
          className="grid h-14"
          style={{ gridTemplateColumns: `repeat(${Math.max(tabs.length, 1) + 1}, minmax(0, 1fr))` }}
        >
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(pathname, item.href, item.exact);
            return (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  'flex min-h-11 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
                <span className={cn('truncate', active && 'font-semibold')}>{item.label}</span>
              </a>
            );
          })}
          <button
            type="button"
            onClick={openMore}
            className={cn(
              'flex min-h-11 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium transition-colors',
              moreOpen ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <MoreHorizontal className="size-5" strokeWidth={moreOpen ? 2.25 : 1.75} />
            <span className={cn(moreOpen && 'font-semibold')}>Daha fazla</span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85dvh] gap-0 rounded-t-2xl pb-[env(safe-area-inset-bottom)]"
        >
          <SheetHeader className="border-b border-border px-1 pb-3 text-left">
            <SheetTitle>Menü</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto px-1 py-3">
            {moreGroups.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                Ek menü öğesi yok.
              </p>
            ) : (
              moreGroups.map((group) => (
                <div key={group.id} className="mb-4 last:mb-0">
                  <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wide text-faint">
                    {group.label}
                  </p>
                  <ul className="flex flex-col gap-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = isNavActive(pathname, item.href, item.exact);
                      return (
                        <li key={item.href}>
                          <a
                            href={item.href}
                            onClick={() => setMoreOpen(false)}
                            className={cn(
                              'flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors',
                              active
                                ? 'bg-primary-soft text-foreground'
                                : 'text-foreground hover:bg-muted',
                            )}
                          >
                            <Icon className="size-5 text-muted-foreground" />
                            {item.label}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
