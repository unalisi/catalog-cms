import { adminNavGroups, isNavActive } from '@/components/admin/nav';
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
  SidebarRail,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

type Props = {
  pathname: string;
};

export function AppSidebar({ pathname }: Props) {
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
        {adminNavGroups.map((group) => (
          <SidebarGroup key={group.id} className="px-2 py-0">
            <SidebarGroupLabel className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-faint">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = isNavActive(pathname, item.href, item.exact);
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.href}>
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
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-3 group-data-[collapsible=icon]:p-2">
        <div className="rounded-md border border-border bg-muted px-3 py-2.5 group-data-[collapsible=icon]:hidden">
          <div className="mb-1 flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
            <span className="text-xs font-medium text-foreground">Site canlıda</span>
          </div>
          <div className="font-mono text-[11px] text-faint">Workers · production</div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
