import * as React from 'react';
import { Package } from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from '@/components/ui/command';
import { ADMIN_NAV, flattenNavItems, type NavItem } from '@/lib/nav/admin-nav';

type ProductHit = { id: string; title: string; sku: string | null };

type CommandPaletteProps = {
  nav?: NavItem[];
  onNavigate?: (href: string) => void;
};

export function CommandPalette({
  nav = flattenNavItems(ADMIN_NAV),
  onNavigate,
}: CommandPaletteProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [products, setProducts] = React.useState<ProductHit[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  React.useEffect(() => {
    if (!open) {
      setQuery('');
      setProducts([]);
      return;
    }
    const q = query.trim();
    if (!q) {
      setProducts([]);
      return;
    }
    setLoading(true);
    const handle = window.setTimeout(async () => {
      try {
        const res = await fetch('/api/admin/products');
        const json = (await res.json()) as {
          ok: boolean;
          data?: { products: Array<{ id: string; title: string; sku: string | null }> };
        };
        if (!json.ok || !json.data) {
          setProducts([]);
          return;
        }
        const needle = q.toLowerCase();
        setProducts(
          json.data.products
            .filter(
              (p) =>
                p.title.toLowerCase().includes(needle) ||
                (p.sku ?? '').toLowerCase().includes(needle),
            )
            .slice(0, 8),
        );
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => window.clearTimeout(handle);
  }, [open, query]);

  function go(href: string) {
    setOpen(false);
    if (onNavigate) onNavigate(href);
    else window.location.href = href;
  }

  const grouped = React.useMemo(() => {
    const order = ['İçerik', 'Pazarlama', 'Sistem'] as const;
    const map = new Map<string, NavItem[]>();
    for (const item of nav) {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    }
    return order.filter((g) => map.has(g)).map((g) => ({ group: g, items: map.get(g)! }));
  }, [nav]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Sayfa, ürün veya komut ara..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>{loading ? 'Aranıyor…' : 'Sonuç bulunamadı.'}</CommandEmpty>
        {grouped.map(({ group, items }) => (
          <CommandGroup key={group} heading={group}>
            {items.map((item) => (
              <CommandItem key={item.id} value={item.label} onSelect={() => go(item.href)}>
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <span>{item.label}</span>
                {item.shortcut ? <CommandShortcut>{item.shortcut}</CommandShortcut> : null}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
        {products.length > 0 ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Ürünler">
              {products.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`${p.title} ${p.sku ?? ''}`}
                  onSelect={() => go(`/admin/products/${p.id}`)}
                >
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{p.title}</span>
                  {p.sku ? (
                    <span className="ml-auto font-mono text-xs text-muted-foreground">{p.sku}</span>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}

export function triggerCommandPalette() {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
}
