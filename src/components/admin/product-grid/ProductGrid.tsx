import { useVirtualizer } from '@tanstack/react-virtual';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { ApiResult } from '../../../lib/api';
import { buildRangeKeys, colAt, colIndex, parseTsv } from './selection';
import {
  EDITABLE_COLUMNS,
  cellKey,
  coerceEditValue,
  displayCellValue,
  type BrandOption,
  type CellRef,
  type DirtyFields,
  type EditableColId,
  type GridProduct,
  type ProductStatus,
} from './types';

const ROW_HEIGHT = 44;
const CHECK_WIDTH = 44;
const ACTION_WIDTH = 72;

type ProductGridProps = {
  initialProducts: GridProduct[];
  brands: BrandOption[];
};

export default function ProductGrid({ initialProducts, brands }: ProductGridProps) {
  const [rows, setRows] = useState<GridProduct[]>(initialProducts);
  const [dirty, setDirty] = useState<Record<string, DirtyFields>>({});
  const [active, setActive] = useState<CellRef | null>(
    initialProducts[0] ? { rowId: initialProducts[0].id, colId: 'name' } : null,
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectedCols, setSelectedCols] = useState<Set<EditableColId>>(new Set());
  const [anchor, setAnchor] = useState<CellRef | null>(null);
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);

  const parentRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);
  const baselineRef = useRef<GridProduct[]>(initialProducts.map((r) => ({ ...r })));

  const rowIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const rowMap = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
  });

  const dirtyCount = Object.keys(dirty).length;
  const selectedCellCount = selected.size;
  const selectedRowCount = selectedRows.size;

  const applyLocalField = useCallback(
    (rowId: string, colId: EditableColId, value: DirtyFields[keyof DirtyFields]) => {
      setRows((prev) =>
        prev.map((row) => {
          if (row.id !== rowId) return row;
          const next = { ...row };
          if (colId === 'name') next.name = value as string;
          if (colId === 'sku') next.sku = value as string | null;
          if (colId === 'price') next.price = value as number;
          if (colId === 'stock') next.stock = value as number;
          if (colId === 'status') next.status = value as ProductStatus;
          if (colId === 'brandId') {
            next.brandId = value as string | null;
            next.brandName = brands.find((b) => b.id === next.brandId)?.name ?? null;
          }
          return next;
        }),
      );
      setDirty((prev) => ({
        ...prev,
        [rowId]: { ...prev[rowId], [colId]: value },
      }));
    },
    [brands],
  );

  function startEdit(ref: CellRef) {
    const row = rowMap.get(ref.rowId);
    if (!row) return;
    setActive(ref);
    setEditing(true);
    if (ref.colId === 'brandId') {
      setEditDraft(row.brandId ?? '');
    } else if (ref.colId === 'status') {
      setEditDraft(row.status);
    } else {
      setEditDraft(displayCellValue(row, ref.colId, brands));
    }
  }

  function cancelEdit() {
    setEditing(false);
    setEditDraft('');
  }

  function commitEdit() {
    if (!active || !editing) return;
    const coerced = coerceEditValue(active.colId, editDraft, brands);
    if (!coerced.ok) {
      toast.error(coerced.message );
      return;
    }
    applyLocalField(active.rowId, active.colId, coerced.value);
    setEditing(false);
    setEditDraft('');
  }

  function selectCell(ref: CellRef, opts: { shift?: boolean; meta?: boolean } = {}) {
    setActive(ref);
    if (opts.shift && (anchor || active)) {
      const from = anchor ?? active!;
      setSelected(buildRangeKeys(rowIds, from, ref));
      setSelectedRows(new Set());
      setSelectedCols(new Set());
      return;
    }
    if (opts.meta) {
      setSelected((prev) => {
        const next = new Set(prev);
        const key = cellKey(ref);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
      setAnchor(ref);
      setSelectedRows(new Set());
      setSelectedCols(new Set());
      return;
    }
    setSelected(new Set([cellKey(ref)]));
    setAnchor(ref);
    setSelectedRows(new Set());
    setSelectedCols(new Set());
  }

  function selectRow(rowId: string, opts: { shift?: boolean; meta?: boolean } = {}) {
    if (opts.meta) {
      setSelectedRows((prev) => {
        const next = new Set(prev);
        if (next.has(rowId)) next.delete(rowId);
        else next.add(rowId);
        return next;
      });
    } else if (opts.shift && selectedRows.size > 0) {
      const ids = [...selectedRows];
      const last = ids[ids.length - 1]!;
      const a = rowIds.indexOf(last);
      const b = rowIds.indexOf(rowId);
      const min = Math.min(a, b);
      const max = Math.max(a, b);
      const next = new Set(selectedRows);
      for (let i = min; i <= max; i++) next.add(rowIds[i]!);
      setSelectedRows(next);
    } else {
      setSelectedRows(new Set([rowId]));
    }
    setSelected(new Set());
    setSelectedCols(new Set());
    setActive({ rowId, colId: active?.colId ?? 'name' });
  }

  function selectCol(colId: EditableColId, opts: { meta?: boolean } = {}) {
    if (opts.meta) {
      setSelectedCols((prev) => {
        const next = new Set(prev);
        if (next.has(colId)) next.delete(colId);
        else next.add(colId);
        return next;
      });
    } else {
      setSelectedCols(new Set([colId]));
    }
    setSelected(new Set());
    setSelectedRows(new Set());
  }

  function selectAll() {
    const keys = new Set<string>();
    for (const row of rows) {
      for (const col of EDITABLE_COLUMNS) {
        keys.add(cellKey({ rowId: row.id, colId: col.id }));
      }
    }
    setSelected(keys);
    setSelectedRows(new Set(rowIds));
    setSelectedCols(new Set(EDITABLE_COLUMNS.map((c) => c.id)));
  }

  function moveActive(dRow: number, dCol: number, shift: boolean) {
    if (!active) return;
    const ri = rowIds.indexOf(active.rowId);
    const ci = colIndex(active.colId);
    const nri = Math.max(0, Math.min(rowIds.length - 1, ri + dRow));
    const nci = Math.max(0, Math.min(EDITABLE_COLUMNS.length - 1, ci + dCol));
    const next: CellRef = { rowId: rowIds[nri]!, colId: colAt(nci)! };
    selectCell(next, { shift });
    virtualizer.scrollToIndex(nri, { align: 'auto' });
  }

  function fillDown() {
    if (!active) return;
    const ri = rowIds.indexOf(active.rowId);
    const source = rowMap.get(active.rowId);
    if (!source || ri < 0) return;
    const value = (source as Record<string, unknown>)[active.colId];
    const targets =
      selected.size > 1
        ? [...selected]
            .map((k) => {
              const [rowId, colId] = k.split(':');
              return { rowId: rowId!, colId: colId as EditableColId };
            })
            .filter((c) => c.colId === active.colId && rowIds.indexOf(c.rowId) > ri)
        : rowIds.slice(ri + 1).map((rowId) => ({ rowId, colId: active.colId }));

    for (const t of targets) {
      applyLocalField(t.rowId, t.colId, value as DirtyFields[keyof DirtyFields]);
    }
    toast.success(`Aşağı dolduruldu (${targets.length})`);
  }

  function fillRight() {
    if (!active) return;
    const ci = colIndex(active.colId);
    const source = rowMap.get(active.rowId);
    if (!source || ci < 0) return;
    const raw = displayCellValue(source, active.colId, brands);
    for (let c = ci + 1; c < EDITABLE_COLUMNS.length; c++) {
      const colId = colAt(c)!;
      const coerced = coerceEditValue(colId, raw, brands);
      if (coerced.ok) applyLocalField(active.rowId, colId, coerced.value);
    }
    toast.success('Sağa dolduruldu' );
  }

  async function handlePaste(text: string) {
    if (!active) return;
    const matrix = parseTsv(text);
    if (matrix.length === 0) return;
    const startR = rowIds.indexOf(active.rowId);
    const startC = colIndex(active.colId);
    let applied = 0;
    for (let r = 0; r < matrix.length; r++) {
      const rowId = rowIds[startR + r];
      if (!rowId) break;
      const line = matrix[r]!;
      for (let c = 0; c < line.length; c++) {
        const colId = colAt(startC + c);
        if (!colId) break;
        const coerced = coerceEditValue(colId, line[c] ?? '', brands);
        if (coerced.ok) {
          applyLocalField(rowId, colId, coerced.value);
          applied++;
        }
      }
    }
    toast.success(`Yapıştırıldı (${applied} hücre)`);
  }

  async function saveDirty() {
    const changes = Object.entries(dirty).map(([id, fields]) => ({ id, fields }));
    if (changes.length === 0) return;
    setSaving(true);
    toast.success('Kaydediliyor…' );

    const res = await fetch('/api/admin/products/bulk', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ changes }),
    });
    const json = (await res.json()) as ApiResult<{
      updated: GridProduct[];
      errors: { id: string; message: string }[];
      successCount: number;
      errorCount: number;
    }>;
    setSaving(false);

    if (!json.ok) {
      setRows(baselineRef.current.map((r) => ({ ...r })));
      toast.error(json.error.message || 'Kayıt başarısız — geri alındı' );
      return;
    }

    const failedIds = new Set(json.data.errors.map((e) => e.id));
    const updatedMap = new Map(json.data.updated.map((u) => [u.id, u]));
    const nextRows = rows.map((row) => {
      if (failedIds.has(row.id)) {
        return { ...(baselineRef.current.find((s) => s.id === row.id) ?? row) };
      }
      const updated = updatedMap.get(row.id);
      if (!updated) return row;
      return { ...row, ...updated, imageUrl: row.imageUrl ?? updated.imageUrl ?? null };
    });
    setRows(nextRows);
    baselineRef.current = nextRows.map((r) => ({ ...r }));

    setDirty((prev) => {
      const next = { ...prev };
      for (const id of Object.keys(next)) {
        if (!failedIds.has(id)) delete next[id];
      }
      return next;
    });

    if (json.data.errorCount > 0) {
      toast.error(
        `${json.data.successCount} kayıt OK, ${json.data.errorCount} hata (geri alındı)`,
      );
    } else {
      toast.success(`${json.data.successCount} ürün kaydedildi`);
    }
  }

  function discardDirty() {
    setRows(baselineRef.current.map((r) => ({ ...r })));
    setDirty({});
    toast.success('Değişiklikler iptal edildi' );
  }

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing, active]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const inEditor =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'SELECT' ||
        target?.tagName === 'TEXTAREA';

      if (e.key === 'Escape') {
        if (editing) {
          e.preventDefault();
          cancelEdit();
        } else {
          setSelected(new Set());
          setSelectedRows(new Set());
          setSelectedCols(new Set());
        }
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void saveDirty();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a' && !inEditor) {
        e.preventDefault();
        selectAll();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd' && !editing) {
        e.preventDefault();
        fillDown();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'r' && !editing) {
        e.preventDefault();
        fillRight();
        return;
      }

      if (editing) {
        if (e.key === 'Enter') {
          e.preventDefault();
          commitEdit();
          moveActive(1, 0, false);
        } else if (e.key === 'Tab') {
          e.preventDefault();
          commitEdit();
          moveActive(0, e.shiftKey ? -1 : 1, false);
        }
        return;
      }

      if (!active || inEditor) return;

      if (e.key === 'Enter' || e.key === 'F2') {
        e.preventDefault();
        startEdit(active);
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        moveActive(0, e.shiftKey ? -1 : 1, false);
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveActive(1, 0, e.shiftKey);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveActive(-1, 0, e.shiftKey);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        moveActive(0, -1, e.shiftKey);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        moveActive(0, 1, e.shiftKey);
      } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
        startEdit(active);
        setEditDraft(e.key);
      }
    }

    function onPaste(e: ClipboardEvent) {
      if (editing) return;
      const text = e.clipboardData?.getData('text/plain');
      if (!text || !active) return;
      e.preventDefault();
      void handlePaste(text);
    }

    function onMouseUp() {
      setDragging(false);
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('paste', onPaste);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('paste', onPaste);
      window.removeEventListener('mouseup', onMouseUp);
    };
  });

  function isCellSelected(ref: CellRef): boolean {
    if (selected.has(cellKey(ref))) return true;
    if (selectedRows.has(ref.rowId)) return true;
    if (selectedCols.has(ref.colId)) return true;
    return false;
  }

  function isDirty(rowId: string, colId: EditableColId): boolean {
    return dirty[rowId] != null && Object.prototype.hasOwnProperty.call(dirty[rowId], colId);
  }

  const totalWidth =
    CHECK_WIDTH +
    EDITABLE_COLUMNS.reduce((s, c) => s + c.width, 0) +
    ACTION_WIDTH;

  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border px-6 py-16 text-center">
        <p className="font-display text-lg font-semibold">Henüz ürün yok</p>
        <p className="mt-1 text-sm text-muted-foreground">İlk ürünü ekleyerek grid’i doldurun.</p>
        <a
          href="/admin/products/new"
          className="mt-4 inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <span aria-hidden="true">+</span>
          Ürün ekle
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-background/95 px-3 py-2 text-sm backdrop-blur supports-[backdrop-filter]:bg-background/90">
        <div className="min-w-0 text-muted-foreground">
          {selectedCellCount > 0 && <span>{selectedCellCount} hücre</span>}
          {selectedCellCount > 0 && selectedRowCount > 0 && <span> · </span>}
          {selectedRowCount > 0 && <span>{selectedRowCount} satır</span>}
          {selectedCellCount === 0 && selectedRowCount === 0 && (
            <span className="hidden sm:inline">
              {rows.length} ürün · ok/Tab gezin · Enter düzenle · ⌘/Ctrl+S kaydet · yapıştır TSV
            </span>
          )}
          {selectedCellCount === 0 && selectedRowCount === 0 && (
            <span className="sm:hidden">{rows.length} ürün</span>
          )}
          {dirtyCount > 0 && (
            <span className="ml-2 font-medium text-foreground">· {dirtyCount} satır değişti</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="hidden min-h-11 rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-muted disabled:opacity-40 sm:inline-flex sm:items-center"
            disabled={!active || saving}
            onClick={fillDown}
          >
            Aşağı doldur
          </button>
          <button
            type="button"
            className="hidden min-h-11 rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-muted disabled:opacity-40 sm:inline-flex sm:items-center"
            disabled={!active || saving}
            onClick={fillRight}
          >
            Sağa doldur
          </button>
          <button
            type="button"
            className="min-h-11 rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-muted disabled:opacity-40"
            disabled={dirtyCount === 0 || saving}
            onClick={discardDirty}
          >
            İptal
          </button>
          <button
            type="button"
            className="min-h-11 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40"
            disabled={dirtyCount === 0 || saving}
            onClick={() => void saveDirty()}
          >
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      </div>

      <div
        ref={parentRef}
        className="max-h-[min(calc(100dvh-8rem),48rem)] overflow-auto rounded-md border border-border bg-background"
        tabIndex={0}
        role="grid"
        aria-rowcount={rows.length}
        aria-colcount={EDITABLE_COLUMNS.length}
      >
        <div style={{ width: totalWidth, position: 'relative' }}>
          <div
            className="sticky top-0 z-20 flex border-b border-border bg-muted text-xs font-medium"
            style={{ height: ROW_HEIGHT, width: totalWidth }}
          >
            <div
              className="sticky left-0 z-30 flex shrink-0 items-center justify-center border-r border-border bg-muted"
              style={{ width: CHECK_WIDTH }}
            >
              <input
                type="checkbox"
                aria-label="Tümünü seç"
                checked={selectedRows.size === rows.length && rows.length > 0}
                onChange={(e) => {
                  if (e.target.checked) selectAll();
                  else {
                    setSelected(new Set());
                    setSelectedRows(new Set());
                    setSelectedCols(new Set());
                  }
                }}
              />
            </div>
            {EDITABLE_COLUMNS.map((col) => (
              <button
                key={col.id}
                type="button"
                className={`flex shrink-0 items-center border-r border-border px-2 text-left hover:bg-primary/10 ${
                  selectedCols.has(col.id) ? 'bg-primary/20' : ''
                } ${col.align === 'right' ? 'justify-end' : ''}`}
                style={{ width: col.width }}
                onClick={(e) => selectCol(col.id, { meta: e.metaKey || e.ctrlKey })}
              >
                {col.label}
              </button>
            ))}
            <div className="flex shrink-0 items-center px-2" style={{ width: ACTION_WIDTH }}>
              —
            </div>
          </div>

          <div style={{ height: virtualizer.getTotalSize(), position: 'relative', width: totalWidth }}>
            {virtualizer.getVirtualItems().map((vRow) => {
              const row = rows[vRow.index]!;
              const rowSelected = selectedRows.has(row.id);
              return (
                <div
                  key={row.id}
                  className={`absolute left-0 flex border-b border-border ${
                    rowSelected ? 'bg-primary/10' : 'bg-background'
                  }`}
                  style={{
                    height: ROW_HEIGHT,
                    transform: `translateY(${vRow.start}px)`,
                    width: totalWidth,
                  }}
                  role="row"
                >
                  <div
                    className="sticky left-0 z-10 flex shrink-0 items-center justify-center border-r border-border bg-inherit"
                    style={{ width: CHECK_WIDTH }}
                  >
                    <input
                      type="checkbox"
                      aria-label={`Satır ${row.name}`}
                      checked={rowSelected}
                      onChange={(e) =>
                        selectRow(row.id, {
                          meta: (e.nativeEvent as MouseEvent).metaKey || (e.nativeEvent as MouseEvent).ctrlKey,
                        })
                      }
                      onClick={(e) => {
                        if (e.shiftKey) {
                          e.preventDefault();
                          selectRow(row.id, { shift: true });
                        }
                      }}
                    />
                  </div>
                  {EDITABLE_COLUMNS.map((col) => {
                    const ref: CellRef = { rowId: row.id, colId: col.id };
                    const isActive = active?.rowId === row.id && active.colId === col.id;
                    const isSel = isCellSelected(ref);
                    const dirtyCell = isDirty(row.id, col.id);
                    const isEditing = isActive && editing;

                    return (
                      <div
                        key={col.id}
                        role="gridcell"
                        tabIndex={isActive ? 0 : -1}
                        className={`relative flex shrink-0 items-center border-r border-border px-1.5 text-sm ${
                          col.mono ? 'font-mono' : ''
                        } ${col.align === 'right' ? 'justify-end' : ''} ${
                          isActive ? 'z-[1] ring-2 ring-inset ring-primary' : ''
                        } ${isSel && !isActive ? 'bg-primary/20' : ''} ${
                          dirtyCell ? 'after:absolute after:right-0 after:top-0 after:h-0 after:w-0 after:border-t-[6px] after:border-r-[6px] after:border-t-primary after:border-r-transparent' : ''
                        }`}
                        style={{ width: col.width, height: ROW_HEIGHT }}
                        onMouseDown={(e) => {
                          if (e.button !== 0) return;
                          e.preventDefault();
                          setDragging(true);
                          selectCell(ref, {
                            shift: e.shiftKey,
                            meta: e.metaKey || e.ctrlKey,
                          });
                        }}
                        onMouseEnter={() => {
                          if (!dragging || !anchor) return;
                          setActive(ref);
                          setSelected(buildRangeKeys(rowIds, anchor, ref));
                        }}
                        onDoubleClick={() => startEdit(ref)}
                      >
                        {isEditing ? (
                          col.id === 'status' || col.id === 'brandId' ? (
                            <select
                              ref={inputRef as React.RefObject<HTMLSelectElement>}
                              className="h-7 w-full rounded-sm border border-input bg-background px-1 text-sm"
                              value={editDraft}
                              onChange={(e) => setEditDraft(e.target.value)}
                              onBlur={commitEdit}
                            >
                              {col.id === 'status' ? (
                                <>
                                  <option value="published">Yayında</option>
                                  <option value="draft">Taslak</option>
                                  <option value="archived">Listedışı</option>
                                </>
                              ) : (
                                <>
                                  <option value="">—</option>
                                  {brands.map((b) => (
                                    <option key={b.id} value={b.id}>
                                      {b.name}
                                    </option>
                                  ))}
                                </>
                              )}
                            </select>
                          ) : (
                            <input
                              ref={inputRef as React.RefObject<HTMLInputElement>}
                              className={`h-7 w-full rounded-sm border border-input bg-background px-1 text-sm ${
                                col.mono ? 'font-mono' : ''
                              }`}
                              value={editDraft}
                              onChange={(e) => setEditDraft(e.target.value)}
                              onBlur={commitEdit}
                            />
                          )
                        ) : (
                          <span className="truncate">
                            {displayCellValue(row, col.id, brands) || (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  <div
                    className="flex shrink-0 items-center px-2 text-xs"
                    style={{ width: ACTION_WIDTH }}
                  >
                    <a href={`/admin/products/${row.id}`} className="hover:underline">
                      Aç
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
