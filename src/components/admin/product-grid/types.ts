export type ProductStatus = 'draft' | 'published' | 'archived';

export type GridProduct = {
  id: string;
  slug: string;
  sku: string | null;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  status: ProductStatus;
  brandId: string | null;
  brandName: string | null;
  imageUrl?: string | null;
  updatedAt: string;
};

export type BrandOption = { id: string; name: string };

export type EditableColId = 'name' | 'sku' | 'price' | 'stock' | 'brandId' | 'status';

export type ColId = EditableColId;

export type CellRef = { rowId: string; colId: ColId };

export type DirtyFields = Partial<{
  name: string;
  sku: string | null;
  price: number;
  stock: number;
  brandId: string | null;
  status: ProductStatus;
}>;

export const EDITABLE_COLUMNS: {
  id: EditableColId;
  label: string;
  width: number;
  mono?: boolean;
  align?: 'left' | 'right';
}[] = [
  { id: 'name', label: 'Ad', width: 220 },
  { id: 'sku', label: 'SKU', width: 120, mono: true },
  { id: 'price', label: 'Fiyat', width: 100, mono: true, align: 'right' },
  { id: 'stock', label: 'Stok', width: 80, mono: true, align: 'right' },
  { id: 'brandId', label: 'Marka', width: 140 },
  { id: 'status', label: 'Durum', width: 110 },
];

export function cellKey(ref: CellRef): string {
  return `${ref.rowId}:${ref.colId}`;
}

export function parseCellKey(key: string): CellRef {
  const [rowId, colId] = key.split(':') as [string, ColId];
  return { rowId, colId };
}

export function formatPriceMajor(minor: number): string {
  return (minor / 100).toFixed(2);
}

export function parsePriceMajor(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.');
  if (!normalized) return null;
  const n = Number(normalized);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export function displayCellValue(row: GridProduct, colId: ColId, brands: BrandOption[]): string {
  switch (colId) {
    case 'name':
      return row.name;
    case 'sku':
      return row.sku ?? '';
    case 'price':
      return formatPriceMajor(row.price);
    case 'stock':
      return String(row.stock);
    case 'brandId':
      return brands.find((b) => b.id === row.brandId)?.name ?? row.brandName ?? '';
    case 'status':
      return row.status;
  }
}

export function coerceEditValue(
  colId: ColId,
  raw: string,
  brands: BrandOption[],
): { ok: true; value: DirtyFields[keyof DirtyFields] } | { ok: false; message: string } {
  switch (colId) {
    case 'name': {
      const v = raw.trim();
      if (!v) return { ok: false, message: 'Ad boş olamaz' };
      return { ok: true, value: v };
    }
    case 'sku':
      return { ok: true, value: raw.trim() || null };
    case 'price': {
      const minor = parsePriceMajor(raw);
      if (minor == null) return { ok: false, message: 'Geçersiz fiyat' };
      return { ok: true, value: minor };
    }
    case 'stock': {
      const n = Number.parseInt(raw.trim(), 10);
      if (!Number.isFinite(n) || n < 0) return { ok: false, message: 'Geçersiz stok' };
      return { ok: true, value: n };
    }
    case 'brandId': {
      const t = raw.trim();
      if (!t) return { ok: true, value: null };
      const byId = brands.find((b) => b.id === t);
      if (byId) return { ok: true, value: byId.id };
      const byName = brands.find((b) => b.name.toLocaleLowerCase('tr-TR') === t.toLocaleLowerCase('tr-TR'));
      if (byName) return { ok: true, value: byName.id };
      return { ok: false, message: 'Marka bulunamadı' };
    }
    case 'status': {
      const v = raw.trim().toLowerCase();
      if (v === 'draft' || v === 'published' || v === 'archived') return { ok: true, value: v };
      return { ok: false, message: 'Durum: draft | published | archived' };
    }
  }
}
