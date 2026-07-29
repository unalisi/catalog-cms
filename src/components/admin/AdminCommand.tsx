import { useEffect, useMemo, useState } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { adminNav } from '@/components/admin/nav';
import { FileText, Package } from 'lucide-react';

type ProductHit = {
  id: string;
  title: string;
  sku: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permissions?: string[];
};

export function AdminCommand({ open, onOpenChange, permissions = [] }: Props) {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<ProductHit[]>([]);
  const [loading, setLoading] = useState(false);

  const navItems = useMemo(
    () => adminNav.filter((item) => permissions.includes(item.permission)),
    [permissions],
  );

  useEffect(() => {
    if (!open) {
      setQuery('');
      setProducts([]);
      setLoading(false);
      return;
    }

    const q = query.trim();
    if (!q) {
      setProducts([]);
      setLoading(false);
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
        const hits = json.data.products
          .filter(
            (p) =>
              p.title.toLowerCase().includes(needle) ||
              (p.sku ?? '').toLowerCase().includes(needle),
          )
          .slice(0, 8)
          .map((p) => ({ id: p.id, title: p.title, sku: p.sku }));
        setProducts(hits);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(handle);
  }, [open, query]);

  function go(href: string) {
    onOpenChange(false);
    window.location.href = href;
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Ara"
      description="Sayfa veya ürün ara"
    >
      <CommandInput
        placeholder="Sayfa veya ürün ara…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>{loading ? 'Aranıyor…' : 'Sonuç yok.'}</CommandEmpty>
        <CommandGroup heading="Sayfalar">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.href}
                value={`${item.label} ${item.href}`}
                onSelect={() => go(item.href)}
              >
                <Icon />
                <span>{item.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
        {(products.length > 0 || (query.trim() && !loading)) && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Ürünler">
              {products.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`${p.title} ${p.sku ?? ''} ${p.id}`}
                  onSelect={() => go(`/admin/products/${p.id}`)}
                >
                  <Package />
                  <span className="truncate">{p.title}</span>
                  {p.sku ? (
                    <span className="ml-auto font-mono text-xs text-muted-foreground">
                      {p.sku}
                    </span>
                  ) : null}
                </CommandItem>
              ))}
              {query.trim() && products.length === 0 && !loading ? (
                <CommandItem disabled value="no-products">
                  <FileText />
                  <span>Ürün bulunamadı</span>
                </CommandItem>
              ) : null}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
