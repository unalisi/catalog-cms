import type { ReactNode } from 'react';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppSidebar } from '@/components/admin/AppSidebar';
import { TopNav, type AdminBreadcrumb, type AdminUser } from '@/components/admin/TopNav';
import { ToastFromQuery } from '@/components/admin/ToastFromQuery';
import ForcePasswordChangeModal from '@/components/admin/ForcePasswordChangeModal';
import { AdminBottomBar } from '@/components/admin/AdminBottomBar';
import { AdminChromeProvider } from '@/components/admin/AdminChromeContext';

type Props = {
  children?: ReactNode;
  pathname: string;
  title?: string;
  breadcrumbs?: AdminBreadcrumb[];
  user?: AdminUser | null;
};

export function AdminShell({
  children,
  pathname,
  breadcrumbs = [],
  user = null,
}: Props) {
  const crumbs =
    breadcrumbs.length > 0
      ? breadcrumbs
      : [{ href: '/admin', label: 'Admin' }];

  return (
    <TooltipProvider delayDuration={200}>
      <AdminChromeProvider>
        <SidebarProvider>
          <AppSidebar pathname={pathname} permissions={user?.permissions ?? []} />
          <SidebarInset className="bg-background">
            <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-3 pt-[env(safe-area-inset-top)] sm:h-16 sm:px-6 md:px-6">
              <TopNav breadcrumbs={crumbs} user={user} />
            </header>
            <main
              id="admin-main"
              className="flex flex-1 flex-col gap-5 overflow-auto p-4 pb-[calc(3.5rem+env(safe-area-inset-bottom)+1rem)] md:gap-6 md:p-6 md:pb-6"
              tabIndex={-1}
            >
              <ToastFromQuery />
              {children}
            </main>
            <AdminBottomBar pathname={pathname} permissions={user?.permissions ?? []} />
          </SidebarInset>
          {user?.mustChangePassword ? <ForcePasswordChangeModal /> : null}
        </SidebarProvider>
      </AdminChromeProvider>
    </TooltipProvider>
  );
}
