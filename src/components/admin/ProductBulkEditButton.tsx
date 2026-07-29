import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ProductGrid from './product-grid/ProductGrid';
import type { BrandOption, GridProduct } from './product-grid/types';

type Props = {
  initialProducts: GridProduct[];
  brands: BrandOption[];
};

export default function ProductBulkEditButton({ initialProducts, brands }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        Bulk Edit
      </button>

      <Dialog open={open} onOpenChange={(next) => {
        setOpen(next);
        if (!next) window.location.reload();
      }}>
        <DialogContent
          showCloseButton
          className="fixed inset-0 top-0 left-0 z-50 flex h-dvh max-h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 p-0 shadow-none sm:max-w-none data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100"
        >
          <DialogHeader className="shrink-0 border-b border-border px-4 py-3 text-left sm:px-5">
            <DialogTitle>Toplu ürün düzenleme</DialogTitle>
            <DialogDescription>
              Excel-benzeri grid · hücre düzenle · yapıştır · Kaydet ile kaydet
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-5">
            {open ? <ProductGrid initialProducts={initialProducts} brands={brands} /> : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
