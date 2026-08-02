import * as React from "react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

/**
 * shadcn Sidebar primitive — sadeleştirilmiş, üretime hazır sürüm.
 *
 * Desteklenenler:
 *  - Masaüstünde sabit sidebar, `collapsible="icon"` ile ikon-rail moduna küçülür
 *  - Mobilde (< 768px) otomatik olarak Sheet (slide-over) davranışına döner
 *  - Açık/kapalı durumu cookie'de saklanır (localStorage DEĞİL — Astro tam sayfa
 *    navigasyonlarında flicker yaşamamak için sunucu bu cookie'yi okuyup
 *    ilk HTML'i doğru state ile render edebilir; bkz. AdminLayout.astro)
 *  - ⌘/Ctrl+B klavye kısayoluyla toggle
 *  - Collapsed (icon) modda SidebarMenuButton otomatik tooltip gösterir
 */

const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 gün
const SIDEBAR_WIDTH = "16rem"; // DESIGN.md §4: admin sabit sidebar 16rem
const SIDEBAR_WIDTH_ICON = "3.25rem";
const MOBILE_BREAKPOINT = 768;

type SidebarContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar, SidebarProvider içinde kullanılmalı");
  return ctx;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return isMobile;
}

type SidebarProviderProps = React.ComponentPropsWithoutRef<"div"> & {
  /** AdminLayout.astro tarafından cookie'den okunup geçirilir (SSR flicker önleme) */
  defaultOpen?: boolean;
};

export function SidebarProvider({
  defaultOpen = true,
  className,
  style,
  children,
  ...props
}: SidebarProviderProps) {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);
  const [open, _setOpen] = React.useState(defaultOpen);

  const setOpen = React.useCallback((value: boolean) => {
    _setOpen(value);
    document.cookie = `${SIDEBAR_COOKIE_NAME}=${value}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}; SameSite=Lax`;
  }, []);

  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((v) => !v) : setOpen(!open);
  }, [isMobile, open, setOpen]);

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "b" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleSidebar();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleSidebar]);

  const value: SidebarContextValue = {
    open,
    setOpen,
    openMobile,
    setOpenMobile,
    isMobile,
    toggleSidebar,
  };

  return (
    <SidebarContext.Provider value={value}>
      <div
        style={{
          ["--sidebar-width" as string]: SIDEBAR_WIDTH,
          ["--sidebar-width-icon" as string]: SIDEBAR_WIDTH_ICON,
          ...style,
        }}
        className={cn("flex min-h-svh w-full", className)}
        {...props}
      >
        <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
      </div>
    </SidebarContext.Provider>
  );
}

type SidebarProps = React.ComponentPropsWithoutRef<"div"> & {
  collapsible?: "icon" | "none";
};

export function Sidebar({ collapsible = "icon", className, children, ...props }: SidebarProps) {
  const { isMobile, open, openMobile, setOpenMobile } = useSidebar();

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent side="left" className="w-72 [&>button]:hidden">
          <div className="flex h-full w-full flex-col bg-background">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  const collapsed = collapsible === "icon" && !open;

  return (
    <div
      data-state={collapsed ? "collapsed" : "expanded"}
      className={cn(
        "sticky top-0 hidden h-svh shrink-0 flex-col border-r border-border bg-background transition-[width] duration-200 md:flex",
        collapsed ? "w-[--sidebar-width-icon]" : "w-[--sidebar-width]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function SidebarTrigger({ className, ...props }: React.ComponentPropsWithoutRef<"button">) {
  const { toggleSidebar } = useSidebar();
  return (
    <button
      type="button"
      onClick={toggleSidebar}
      aria-label="Kenar çubuğunu aç/kapat"
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        className,
      )}
      {...props}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <line x1="5.5" y1="2.5" x2="5.5" y2="13.5" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    </button>
  );
}

export function SidebarInset({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return <div className={cn("flex min-h-svh flex-1 flex-col bg-background", className)} {...props} />;
}

export function SidebarHeader({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return <div className={cn("flex flex-col gap-2 px-3 py-3", className)} {...props} />;
}

export function SidebarFooter({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return <div className={cn("mt-auto flex flex-col gap-2 px-3 py-3", className)} {...props} />;
}

export function SidebarContent({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div className={cn("flex flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden py-2", className)} {...props} />
  );
}

export function SidebarGroup({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return <div className={cn("flex flex-col gap-1 px-2", className)} {...props} />;
}

export function SidebarGroupLabel({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const { open, isMobile } = useSidebar();
  if (!open && !isMobile) return null; // icon modunda grup başlığı gizlenir
  return (
    <div
      className={cn(
        "px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarMenu({ className, ...props }: React.ComponentPropsWithoutRef<"ul">) {
  return <ul className={cn("flex flex-col gap-0.5", className)} {...props} />;
}

export function SidebarMenuItem({ className, ...props }: React.ComponentPropsWithoutRef<"li">) {
  return <li className={cn("relative", className)} {...props} />;
}

type SidebarMenuButtonProps = React.ComponentPropsWithoutRef<"a"> & {
  isActive?: boolean;
  tooltip?: string;
};

export const SidebarMenuButton = React.forwardRef<HTMLAnchorElement, SidebarMenuButtonProps>(
  ({ className, isActive, tooltip, children, ...props }, ref) => {
    const { open, isMobile } = useSidebar();
    const showTooltip = !open && !isMobile && tooltip;

    const button = (
      <a
        ref={ref}
        data-active={isActive}
        className={cn(
          "group flex h-9 items-center gap-2.5 overflow-hidden rounded-md px-2.5 text-sm transition-colors",
          "text-foreground hover:bg-muted",
          "data-[active=true]:bg-primary/10 data-[active=true]:font-medium data-[active=true]:text-foreground",
          "border-l-2 border-transparent data-[active=true]:border-l-primary",
          !open && !isMobile && "justify-center px-0",
          className,
        )}
        {...props}
      >
        {children}
      </a>
    );

    if (!showTooltip) return button;

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right">{tooltip}</TooltipContent>
      </Tooltip>
    );
  },
);
SidebarMenuButton.displayName = "SidebarMenuButton";

export function SidebarMenuBadge({ className, ...props }: React.ComponentPropsWithoutRef<"span">) {
  const { open, isMobile } = useSidebar();
  if (!open && !isMobile) return null;
  return (
    <span
      className={cn("ml-auto rounded-sm bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground", className)}
      {...props}
    />
  );
}

export function SidebarMenuSub({ className, ...props }: React.ComponentPropsWithoutRef<"ul">) {
  return (
    <ul
      className={cn("mx-2.5 flex min-w-0 translate-x-px flex-col gap-0.5 border-l border-border px-2.5 py-0.5", className)}
      {...props}
    />
  );
}

export function SidebarMenuSubItem({ className, ...props }: React.ComponentPropsWithoutRef<"li">) {
  return <li className={cn("relative", className)} {...props} />;
}

type SidebarMenuSubButtonProps = React.ComponentPropsWithoutRef<"a"> & {
  isActive?: boolean;
};

export const SidebarMenuSubButton = React.forwardRef<HTMLAnchorElement, SidebarMenuSubButtonProps>(
  ({ className, isActive, ...props }, ref) => (
    <a
      ref={ref}
      data-active={isActive}
      className={cn(
        "flex h-8 min-w-0 items-center gap-2 overflow-hidden rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        "data-[active=true]:bg-primary/10 data-[active=true]:font-medium data-[active=true]:text-foreground",
        className,
      )}
      {...props}
    />
  ),
);
SidebarMenuSubButton.displayName = "SidebarMenuSubButton";

type SidebarMenuButtonActionProps = React.ComponentPropsWithoutRef<"button"> & {
  isActive?: boolean;
  tooltip?: string;
};

/** Non-link menu button (collapsible parents, icon-rail dropdown triggers). */
export const SidebarMenuButtonAction = React.forwardRef<
  HTMLButtonElement,
  SidebarMenuButtonActionProps
>(({ className, isActive, tooltip, children, ...props }, ref) => {
  const { open, isMobile } = useSidebar();
  const showTooltip = !open && !isMobile && tooltip;

  const button = (
    <button
      ref={ref}
      type="button"
      data-active={isActive}
      className={cn(
        "group flex h-9 w-full items-center gap-2.5 overflow-hidden rounded-md px-2.5 text-sm transition-colors",
        "text-foreground hover:bg-muted",
        "data-[active=true]:bg-primary/10 data-[active=true]:font-medium data-[active=true]:text-foreground",
        "border-l-2 border-transparent data-[active=true]:border-l-primary",
        !open && !isMobile && "justify-center px-0",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );

  if (!showTooltip) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right">{tooltip}</TooltipContent>
    </Tooltip>
  );
});
SidebarMenuButtonAction.displayName = "SidebarMenuButtonAction";

