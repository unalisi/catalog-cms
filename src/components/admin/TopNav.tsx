import { useEffect, useState } from 'react';
import { Bell, ChevronRight, ExternalLink, LogOut, Search } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { AdminCommand } from '@/components/admin/AdminCommand';

export type AdminBreadcrumb = { href?: string; label: string };

export type AdminUser = {
  id: string;
  email: string;
  role: 'admin' | 'editor';
};

type Props = {
  breadcrumbs: AdminBreadcrumb[];
  user: AdminUser | null;
};

export function TopNav({ breadcrumbs, user }: Props) {
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen((v) => !v);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  async function logout() {
    try {
      await fetch('/api/admin/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } finally {
      window.location.href = '/admin/login';
    }
  }

  const initials = (user?.email ?? 'Ü').slice(0, 1).toUpperCase();
  const crumbTrail =
    breadcrumbs.length > 0
      ? breadcrumbs
      : [{ label: 'Genel Bakış' as string, href: undefined as string | undefined }];

  return (
    <>
      <div className="flex w-full items-center gap-3">
        <SidebarTrigger className="-ml-1 md:hidden" />

        <Breadcrumb className="min-w-0 flex-1">
          <BreadcrumbList className="text-sm text-faint">
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin" className="text-faint hover:text-foreground">
                Panel
              </BreadcrumbLink>
            </BreadcrumbItem>
            {crumbTrail.map((item, index) => {
              const isLast = index === crumbTrail.length - 1;
              return (
                <span key={`${item.label}-${index}`} className="contents">
                  <BreadcrumbSeparator>
                    <ChevronRight className="size-3.5" />
                  </BreadcrumbSeparator>
                  <BreadcrumbItem>
                    {isLast || !item.href ? (
                      <BreadcrumbPage className="truncate font-medium text-foreground">
                        {item.label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={item.href} className="truncate text-faint hover:text-foreground">
                        {item.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </span>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="hidden h-9 w-[220px] items-center gap-2 rounded-md border border-border bg-background px-3 text-sm text-faint transition-colors hover:bg-muted md:flex"
          >
            <Search className="size-3.5 shrink-0" />
            <span className="truncate">Ürün, marka ara…</span>
            <kbd className="ml-auto hidden rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground lg:inline">
              ⌘K
            </kbd>
          </button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setCommandOpen(true)}
            aria-label="Ara"
          >
            <Search className="size-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="relative text-muted-foreground"
                aria-label="Bildirimler"
              >
                <Bell className="size-4" />
                <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Bildirimler</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                Yeni bildirim yok.
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Kullanıcı menüsü"
              >
                <Avatar className="size-8">
                  <AvatarFallback className="bg-primary-soft text-xs font-semibold text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{user?.email ?? 'Admin'}</span>
                  <span className="text-xs capitalize text-muted-foreground">{user?.role ?? 'admin'}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href="/">
                  <ExternalLink />
                  Siteye dön
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => void logout()}>
                <LogOut />
                Çıkış
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AdminCommand open={commandOpen} onOpenChange={setCommandOpen} />
    </>
  );
}
