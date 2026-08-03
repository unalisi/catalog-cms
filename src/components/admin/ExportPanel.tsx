import * as React from 'react';

type ExportFormat = 'csv' | 'xml' | 'woocommerce-json';

type BrandOption = { id: string; name: string };
type CategoryOption = { id: string; name: string };

const FORMATS: { value: ExportFormat; label: string; hint: string }[] = [
  {
    value: 'csv',
    label: 'CSV',
    hint: 'Excel’de açılır; aynı CSV tekrar import edilebilir',
  },
  {
    value: 'xml',
    label: 'XML',
    hint: 'Genel ürün feed şeması',
  },
  {
    value: 'woocommerce-json',
    label: 'WooCommerce JSON',
    hint: 'WooCommerce REST API şemasıyla uyumlu',
  },
];

/**
 * Streaming export download — opens GET in a new tab so the browser handles the stream natively.
 */
export function ExportPanel() {
  const [format, setFormat] = React.useState<ExportFormat>('csv');
  const [status, setStatus] = React.useState<string>('published');
  const [brandId, setBrandId] = React.useState('');
  const [categoryId, setCategoryId] = React.useState('');
  const [brands, setBrands] = React.useState<BrandOption[]>([]);
  const [categories, setCategories] = React.useState<CategoryOption[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    async function loadFilters() {
      try {
        const [brandsRes, catsRes] = await Promise.all([
          fetch('/api/admin/brands'),
          fetch('/api/admin/categories'),
        ]);
        const brandsJson = (await brandsRes.json()) as {
          ok: boolean;
          data?: { brands: BrandOption[] };
        };
        const catsJson = (await catsRes.json()) as {
          ok: boolean;
          data?: { categories: CategoryOption[] };
        };
        if (cancelled) return;
        if (brandsJson.ok && brandsJson.data?.brands) setBrands(brandsJson.data.brands);
        if (catsJson.ok && catsJson.data?.categories) setCategories(catsJson.data.categories);
      } catch {
        // Filters stay empty; export still works without them.
      }
    }
    void loadFilters();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleExport() {
    const params = new URLSearchParams({ format });
    if (status !== 'all') params.set('status', status);
    if (brandId) params.set('brandId', brandId);
    if (categoryId) params.set('categoryId', categoryId);
    window.open(`/api/admin/export/products?${params.toString()}`, '_blank');
  }

  return (
    <div className="max-w-xl space-y-6 rounded-lg border border-border bg-background p-6">
      <div>
        <h2 className="font-display text-lg font-semibold text-foreground">Dışa aktarım</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Katalog ürünlerini streaming olarak indirin (büyük kataloglar için bellek dostu).
        </p>
      </div>

      <div>
        <div className="mb-2 text-sm font-medium text-foreground">Format</div>
        <div className="grid grid-cols-3 gap-2">
          {FORMATS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFormat(f.value)}
              className={
                'flex flex-col items-center gap-1.5 rounded-md border p-3 text-xs transition-colors ' +
                (format === f.value
                  ? 'border-primary bg-primary/10 font-medium text-foreground'
                  : 'border-border text-muted-foreground hover:bg-muted')
              }
            >
              {f.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {FORMATS.find((f) => f.value === format)?.hint}
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="export-status">
          Durum filtresi
        </label>
        <select
          id="export-status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
        >
          <option value="all">Tümü</option>
          <option value="published">Yalnızca yayında</option>
          <option value="draft">Yalnızca taslak</option>
          <option value="archived">Yalnızca arşivlenmiş</option>
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="export-brand">
            Marka
          </label>
          <select
            id="export-brand"
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="">Tümü</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            className="mb-2 block text-sm font-medium text-foreground"
            htmlFor="export-category"
          >
            Kategori
          </label>
          <select
            id="export-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="">Tümü</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={handleExport}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        Dışa Aktar
      </button>
    </div>
  );
}
