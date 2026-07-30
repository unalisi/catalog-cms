import { useCallback, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAdminChrome } from '@/components/admin/AdminChromeContext';
import type { ApiResult } from '../../lib/api';
import ProductGrid from './product-grid/ProductGrid';
import type { BrandOption, GridProduct } from './product-grid/types';

type Props = {
  brands: BrandOption[];
};

export default function ProductBulkEditButton({ brands }: Props) {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<GridProduct[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setHideBottomBar } = useAdminChrome();

  useEffect(() => {
    setHideBottomBar(open);
    return () => setHideBottomBar(false);
  }, [open, setHideBottomBar]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/products');
      const json = (await res.json()) as ApiResult<{ products: GridProduct[] }>;
      if (!json.ok) {
        setError(json.error.message ?? 'Ürünler yüklenemedi');
        setProducts(null);
        return;
      }
      setProducts(json.data.products);
    } catch {
      setError('Ürünler yüklenemedi');
      setProducts(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void loadProducts();
  }, [open, loadProducts]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted md:h-9 md:min-h-0"
      >
        Bulk Edit
      </button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setProducts(null);
            setError(null);
            window.location.reload();
          }
        }}
      >
        <DialogContent
          showCloseButton
          className="fixed inset-0 top-0 left-0 z-50 flex h-dvh max-h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 p-0 shadow-none sm:max-w-none data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100"
        >
          <DialogHeader className="shrink-0 border-b border-border px-4 py-3 text-left sm:px-5">
            <DialogTitle>Toplu ürün düzenleme</DialogTitle>
            <DialogDescription className="hidden sm:block">
              Excel-benzeri grid · hücre düzenle · yapıştır · Kaydet ile kaydet
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-auto p-3 sm:p-5">
            {loading && (
              <p className="text-sm text-muted-foreground" aria-live="polite">
                Ürünler yükleniyor…
              </p>
            )}
            {error && (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-destructive">{error}</p>
                <button
                  type="button"
                  className="inline-flex w-fit min-h-11 items-center rounded-md border border-border px-3 text-sm hover:bg-muted"
                  onClick={() => void loadProducts()}
                >
                  Yeniden dene
                </button>
              </div>
            )}
            {!loading && !error && products ? (
              <ProductGrid initialProducts={products} brands={brands} />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
