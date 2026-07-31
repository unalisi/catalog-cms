import { useState } from 'react';
import {
  filterNavGroups,
  isAdminNavDropdown,
  isDropdownActive,
  isNavActive,
  type AdminNavDropdown,
  type AdminNavEntry,
  type AdminNavLeaf,
} from '@/components/admin/nav';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

type Props = {
  pathname: string;
  permissions?: string[];
};

function LeafItem({
  item,
  pathname,
  nested = false,
}: {
  item: AdminNavLeaf;
  pathname: string;
  nested?: boolean;
}) {
  const active = isNavActive(pathname, item.href, item.exact);
  const Icon = item.icon;

  if (nested) {
    return (
      <SidebarMenuSubItem>
        <SidebarMenuSubButton
          asChild
          isActive={active}
          className={cn(
            'rounded-md border-l-2 border-transparent',
            active &&
              'border-primary bg-primary-soft font-semibold text-foreground data-[active=true]:bg-primary-soft',
          )}
        >
          <a href={item.href} aria-current={active ? 'page' : undefined}>
            <Icon className="size-4" strokeWidth={2} />
            <span>{item.label}</span>
          </a>
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={active}
        tooltip={item.label}
        className={cn(
          'rounded-md border-l-2 border-transparent text-sm',
          active &&
            'border-primary bg-primary-soft font-semibold text-foreground data-[active=true]:bg-primary-soft data-[active=true]:font-semibold',
        )}
      >
        <a href={item.href} aria-current={active ? 'page' : undefined}>
          <Icon className="size-4" strokeWidth={2} />
          <span>{item.label}</span>
        </a>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function DropdownItem({
  entry,
  pathname,
}: {
  entry: AdminNavDropdown;
  pathname: string;
}) {
  const childActive = isDropdownActive(pathname, entry);
  const [hovered, setHovered] = useState(false);
  const open = childActive || hovered;
  const Icon = entry.icon;

  return (
    <SidebarMenuItem
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <SidebarMenuButton
        type="button"
        isActive={childActive}
        tooltip={entry.label}
        aria-expanded={open}
        onClick={() => setHovered((v) => !v)}
        className={cn(
          'rounded-md border-l-2 border-transparent text-sm',
          childActive &&
            'border-primary bg-primary-soft font-semibold text-foreground data-[active=true]:bg-primary-soft data-[active=true]:font-semibold',
        )}
      >
        <Icon className="size-4" strokeWidth={2} />
        <span className="flex-1 text-left">{entry.label}</span>
        <ChevronDown
          className={cn(
            'ml-auto size-4 shrink-0 transition-transform',
            open && 'rotate-180',
          )}
          strokeWidth={2}
        />
      </SidebarMenuButton>
      {open && (
        <SidebarMenuSub>
          {entry.children.map((child) => (
            <LeafItem key={child.href} item={child} pathname={pathname} nested />
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}

function NavEntry({ entry, pathname }: { entry: AdminNavEntry; pathname: string }) {
  if (isAdminNavDropdown(entry)) {
    return <DropdownItem entry={entry} pathname={pathname} />;
  }
  return <LeafItem item={entry} pathname={pathname} />;
}

export function AppSidebar({ pathname, permissions = [] }: Props) {
  const groups = filterNavGroups(permissions);

  return (
    <Sidebar collapsible="icon" variant="sidebar" className="border-sidebar-border">
      <SidebarHeader className="h-16 justify-center border-b border-sidebar-border px-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="Katalog CMS" className="gap-2.5">
              <a href="/admin">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-sm bg-primary font-mono text-xs font-bold text-primary-foreground">
                  K
                </span>
                <span className="flex min-w-0 flex-col gap-0 leading-tight">
                  <span className="truncate text-sm font-semibold tracking-tight">Katalog CMS</span>
                  <span className="truncate font-mono text-[11px] text-faint">v1.0.0-prod</span>
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-1 py-3">
        {groups.map((group) => (
          <SidebarGroup key={group.id} className="px-2 py-0">
            <SidebarGroupLabel className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-faint">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((entry) => (
                  <NavEntry
                    key={isAdminNavDropdown(entry) ? entry.id : entry.href}
                    entry={entry}
                    pathname={pathname}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-3 group-data-[collapsible=icon]:p-2">
        <div className="rounded-md border border-border bg-muted px-3 py-2.5 group-data-[collapsible=icon]:hidden">
          <div className="mb-1 flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
            <span className="text-xs font-medium text-foreground">Site Aktif</span>
          </div>
          <div className="font-mono text-[11px] text-faint">Workers · production</div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
