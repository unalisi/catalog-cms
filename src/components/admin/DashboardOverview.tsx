import { ChevronRight, Plus } from 'lucide-react';
import { StatusDot } from '@/components/admin/StatusDot';

export type DashboardOverviewProps = {
  products: number;
  published: number;
  draft: number;
  archived: number;
  coverage: number;
  recentProducts: {
    id: string;
    name: string;
    sku: string | null;
    status: 'draft' | 'published' | 'archived';
    brandName: string | null;
  }[];
  homeSections: {
    id: string;
    type: string;
    typeLabel: string;
    title: string;
    status: 'draft' | 'published' | 'archived';
  }[];
  homePageSlug: string;
};

export function DashboardOverview({
  products,
  published,
  draft,
  archived,
  coverage,
  recentProducts,
  homeSections,
  homePageSlug,
}: DashboardOverviewProps) {
  const strip = [
    { label: 'Toplam Ürün', value: String(products), delta: `${published} yayında` },
    { label: 'Yayında', value: String(published), delta: `%${coverage} kapsam` },
    { label: 'Taslak', value: String(draft), delta: draft > 0 ? 'gözden geçir' : 'temiz' },
    { label: 'Gizli / Arşiv', value: String(archived), delta: 'yayın dışı' },
  ];

  const actions = [
    { label: 'Ürün Ekle', href: '/admin/products/new' },
    { label: 'Marka Ekle', href: '/admin/brands/new' },
    { label: 'Bölüm Düzenle', href: `/admin/builder/${homePageSlug}` },
  ];

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 overflow-hidden rounded-lg border border-border bg-background md:mb-6 lg:grid-cols-4">
        {strip.map((s) => (
          <div
            key={s.label}
            className="border-b border-border px-4 py-3 last:border-b-0 odd:border-r md:px-5 md:py-4 lg:border-b-0 lg:border-r lg:last:border-r-0"
          >
            <div className="mb-1.5 text-[11px] uppercase tracking-wide text-faint">{s.label}</div>
            <div className="font-mono text-2xl font-semibold text-foreground">{s.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{s.delta}</div>
          </div>
        ))}
      </div>

      <div className="mb-5 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:flex-wrap sm:gap-3">
        {actions.map((a) => (
          <a
            key={a.label}
            href={a.href}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted sm:w-auto sm:justify-start"
          >
            <Plus className="size-3.5 text-muted-foreground" />
            {a.label}
          </a>
        ))}
      </div>

      <div className="grid gap-4 md:gap-5 lg:grid-cols-2">
        <section className="overflow-hidden rounded-lg border border-border bg-background">
          <div className="flex min-h-11 items-center justify-between gap-2 border-b border-border px-4 py-2.5 md:px-5 md:py-3.5">
            <h2 className="text-sm font-semibold text-foreground">Son Güncellenen Ürünler</h2>
            <a
              href="/admin/products"
              className="inline-flex min-h-11 shrink-0 items-center gap-1 px-1 text-xs font-medium text-primary hover:underline"
            >
              Tümü <ChevronRight className="size-3" />
            </a>
          </div>
          <div>
            {recentProducts.length === 0 ? (
              <p className="px-4 py-8 text-sm text-muted-foreground md:px-5">Henüz ürün yok.</p>
            ) : (
              recentProducts.map((p) => (
                <a
                  key={p.id}
                  href={`/admin/products/${p.id}`}
                  className="flex min-h-11 items-center justify-between border-b border-border px-4 py-3.5 last:border-b-0 hover:bg-muted/60 md:px-5 md:py-3"
                >
                  <div className="min-w-0 pr-3">
                    <div className="truncate text-sm text-foreground">{p.name}</div>
                    <div className="mt-0.5 font-mono text-[11px] text-faint">
                      {p.sku || 'SKU yok'}
                      {p.brandName ? ` · ${p.brandName}` : ''}
                    </div>
                  </div>
                  <StatusDot status={p.status} />
                </a>
              ))
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-border bg-background">
          <div className="flex min-h-11 items-center justify-between gap-2 border-b border-border px-4 py-2.5 md:px-5 md:py-3.5">
            <h2 className="text-sm font-semibold text-foreground">Anasayfa Bölüm Durumu</h2>
            <a
              href={`/admin/builder/${homePageSlug}`}
              className="inline-flex min-h-11 shrink-0 items-center gap-1 px-1 text-xs font-medium text-primary hover:underline"
            >
              Düzenle <ChevronRight className="size-3" />
            </a>
          </div>
          <div>
            {homeSections.length === 0 ? (
              <p className="px-4 py-8 text-sm text-muted-foreground md:px-5">Anasayfa bölümü yok.</p>
            ) : (
              homeSections.map((s, index) => (
                <div
                  key={s.id}
                  className="flex min-h-11 items-center justify-between border-b border-border px-4 py-3.5 last:border-b-0 md:px-5 md:py-3"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="font-mono text-xs text-faint">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm text-foreground">{s.typeLabel}</div>
                      <div className="truncate text-xs text-faint">{s.title}</div>
                    </div>
                  </div>
                  <StatusDot status={s.status} />
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
