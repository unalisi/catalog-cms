import * as React from 'react';
import {
  Search,
  Bell,
  LogOut,
  User as UserIcon,
  ChevronsUpDown,
  ChevronRight,
} from 'lucide-react';
import * as Collapsible from '@radix-ui/react-collapsible';
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarInset,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuButtonAction,
  SidebarMenuBadge,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CommandPalette, triggerCommandPalette } from '@/components/admin/CommandPalette';
import {
  groupNav,
  findActiveNavItem,
  findParentDropdown,
  buildBreadcrumb,
  filterNavByPermissions,
  flattenNavItems,
  isNavDropdown,
  type BreadcrumbEntry,
  type NavDropdown,
  type NavEntry,
} from '@/lib/nav/admin-nav';
import { ToastFromQuery } from '@/components/admin/ToastFromQuery';
import ForcePasswordChangeModal from '@/components/admin/ForcePasswordChangeModal';
import { AdminChromeProvider } from '@/components/admin/AdminChromeContext';

export type AdminUser = {
  id?: string;
  name?: string;
  email: string;
  roleId?: string;
  roleSlug?: string;
  roleName?: string;
  avatarUrl?: string;
  permissions?: string[];
  mustChangePassword?: boolean;
};

export type AdminBreadcrumb = BreadcrumbEntry;

export type AdminShellProps = {
  currentPath: string;
  /** Explicit breadcrumbs from Astro pages — overrides auto trail when provided. */
  breadcrumbs?: BreadcrumbEntry[];
  breadcrumbExtra?: string;
  defaultSidebarOpen?: boolean;
  user: AdminUser | null;
  notificationCount?: number;
  children?: React.ReactNode;
};

export function AdminShell({
  currentPath,
  breadcrumbs,
  breadcrumbExtra,
  defaultSidebarOpen = true,
  user,
  notificationCount = 0,
  children,
}: AdminShellProps) {
  // Filter on the client so Lucide icons never serialize through Astro props.
  const nav = React.useMemo(
    () => filterNavByPermissions(user?.permissions ?? []),
    [user?.permissions],
  );
  const leafNav = React.useMemo(() => flattenNavItems(nav), [nav]);
  const grouped = groupNav(nav);
  const crumbTrail =
    breadcrumbs && breadcrumbs.length > 0
      ? breadcrumbs
      : buildBreadcrumb(currentPath, breadcrumbExtra);

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

  const displayUser: AdminUser = user ?? {
    email: '',
    name: 'Kullanıcı',
  };

  return (
    <AdminChromeProvider>
      <SidebarProvider defaultOpen={defaultSidebarOpen}>
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <SidebarBrand />
          </SidebarHeader>

          <SidebarContent>
            {grouped.map(({ group, items }) => (
              <SidebarGroup key={group}>
                <SidebarGroupLabel>{group}</SidebarGroupLabel>
                <SidebarMenu>
                  {items.map((entry) =>
                    isNavDropdown(entry) ? (
                      <NavDropdownItem
                        key={entry.id}
                        entry={entry}
                        currentPath={currentPath}
                        nav={nav}
                      />
                    ) : (
                      <SidebarMenuItem key={entry.id}>
                        <SidebarMenuButton
                          href={entry.href}
                          isActive={findActiveNavItem(currentPath, nav)?.id === entry.id}
                          tooltip={entry.label}
                        >
                          <entry.icon className="h-4 w-4 shrink-0" />
                          <SidebarLabel>{entry.label}</SidebarLabel>
                          {entry.badge ? (
                            <SidebarMenuBadge>
                              {entry.badge === 'new' ? 'Yeni' : 'Beta'}
                            </SidebarMenuBadge>
                          ) : null}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ),
                  )}
                </SidebarMenu>
              </SidebarGroup>
            ))}
          </SidebarContent>
        </Sidebar>

        <SidebarInset>
          <AdminTopbar
            breadcrumb={crumbTrail}
            user={displayUser}
            notificationCount={notificationCount}
            onLogout={() => void logout()}
          />
          <main
            id="admin-main"
            className="flex flex-1 flex-col gap-5 overflow-auto p-4 md:gap-6 md:p-6"
            tabIndex={-1}
          >
            <ToastFromQuery />
            {children}
          </main>
        </SidebarInset>

        <CommandPalette nav={leafNav} />
        {user?.mustChangePassword ? <ForcePasswordChangeModal /> : null}
      </SidebarProvider>
    </AdminChromeProvider>
  );
}

function NavDropdownItem({
  entry,
  currentPath,
  nav,
}: {
  entry: NavDropdown;
  currentPath: string;
  nav: NavEntry[];
}) {
  const { open, isMobile } = useSidebar();
  const parentActive = findParentDropdown(currentPath, nav)?.id === entry.id;
  const activeLeaf = findActiveNavItem(currentPath, nav);
  const [expanded, setExpanded] = React.useState(parentActive);
  const iconCollapsed = !open && !isMobile;

  React.useEffect(() => {
    if (parentActive) setExpanded(true);
  }, [parentActive]);

  if (iconCollapsed) {
    return (
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButtonAction isActive={parentActive} tooltip={entry.label}>
              <entry.icon className="h-4 w-4 shrink-0" />
            </SidebarMenuButtonAction>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="w-48">
            <DropdownMenuLabel>{entry.label}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {entry.children.map((child) => (
              <DropdownMenuItem key={child.id} asChild>
                <a href={child.href} className="flex items-center gap-2">
                  <child.icon className="h-4 w-4" />
                  {child.label}
                </a>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <Collapsible.Root open={expanded} onOpenChange={setExpanded}>
        <Collapsible.Trigger asChild>
          <SidebarMenuButtonAction isActive={parentActive} aria-expanded={expanded}>
            <entry.icon className="h-4 w-4 shrink-0" />
            <SidebarLabel>{entry.label}</SidebarLabel>
            <ChevronRight
              className={[
                'ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                expanded ? 'rotate-90' : '',
              ].join(' ')}
            />
          </SidebarMenuButtonAction>
        </Collapsible.Trigger>
        <Collapsible.Content>
          <SidebarMenuSub>
            {entry.children.map((child) => (
              <SidebarMenuSubItem key={child.id}>
                <SidebarMenuSubButton href={child.href} isActive={activeLeaf?.id === child.id}>
                  <child.icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{child.label}</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </Collapsible.Content>
      </Collapsible.Root>
    </SidebarMenuItem>
  );
}

function SidebarBrand() {
  const { open, isMobile } = useSidebar();
  return (
    <a href="/admin" className="flex items-center gap-2.5 px-1">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-primary font-mono text-xs font-bold text-primary-foreground">
        K
      </div>
      {(open || isMobile) && (
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">Katalog CMS</div>
          <div className="truncate text-[11px] text-muted-foreground">Admin Panel</div>
        </div>
      )}
    </a>
  );
}

function SidebarLabel({ children }: { children: React.ReactNode }) {
  const { open, isMobile } = useSidebar();
  if (!open && !isMobile) return null;
  return <span className="truncate">{children}</span>;
}

function AdminTopbar({
  breadcrumb,
  user,
  notificationCount,
  onLogout,
}: {
  breadcrumb: BreadcrumbEntry[];
  user: AdminUser;
  notificationCount: number;
  onLogout?: () => void;
}) {
  const displayName = user.name || user.email || 'Kullanıcı';

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-4 pt-[env(safe-area-inset-top)] md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger />
        <div className="hidden h-5 w-px bg-border sm:block" />
        <Breadcrumb className="min-w-0">
          <BreadcrumbList>
            {breadcrumb.map((entry, i) => (
              <React.Fragment key={`${entry.label}-${i}`}>
                {i > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {entry.href ? (
                    <BreadcrumbLink href={entry.href}>{entry.label}</BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{entry.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={triggerCommandPalette}
          className="hidden items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted sm:flex"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Ara...</span>
          <kbd className="ml-2 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </button>

        <button
          type="button"
          onClick={triggerCommandPalette}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted sm:hidden"
          aria-label="Ara"
        >
          <Search className="h-4 w-4" />
        </button>

        <button
          type="button"
          className="relative inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
          aria-label="Bildirimler"
        >
          <Bell className="h-4 w-4" />
          {notificationCount > 0 && (
            <Badge className="absolute -right-0.5 -top-0.5 h-4 min-w-4 justify-center px-1 py-0 text-[9px]">
              {notificationCount > 9 ? '9+' : notificationCount}
            </Badge>
          )}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="ml-1 flex items-center gap-2 rounded-md py-1 pl-1 pr-2 text-sm hover:bg-muted"
            >
              <Avatar className="h-7 w-7">
                {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={displayName} /> : null}
                <AvatarFallback>{initials(displayName)}</AvatarFallback>
              </Avatar>
              <ChevronsUpDown className="hidden h-3.5 w-3.5 text-muted-foreground md:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="truncate text-sm font-medium text-foreground">{displayName}</div>
              <div className="truncate text-xs font-normal text-muted-foreground">{user.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/admin/settings" className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" /> Hesap Ayarları
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={onLogout}
              className="flex items-center gap-2 text-destructive"
            >
              <LogOut className="h-4 w-4" /> Çıkış Yap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Ü';
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
}
