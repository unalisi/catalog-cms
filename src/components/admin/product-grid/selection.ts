import type { CellRef, ColId, EditableColId } from './types';
import { EDITABLE_COLUMNS, cellKey } from './types';

export function colIndex(colId: ColId): number {
  return EDITABLE_COLUMNS.findIndex((c) => c.id === colId);
}

export function colAt(index: number): EditableColId | null {
  return EDITABLE_COLUMNS[index]?.id ?? null;
}

export function buildRangeKeys(
  rowIds: string[],
  a: CellRef,
  b: CellRef,
): Set<string> {
  const ri = rowIds.indexOf(a.rowId);
  const rj = rowIds.indexOf(b.rowId);
  const ci = colIndex(a.colId);
  const cj = colIndex(b.colId);
  if (ri < 0 || rj < 0 || ci < 0 || cj < 0) return new Set();

  const rMin = Math.min(ri, rj);
  const rMax = Math.max(ri, rj);
  const cMin = Math.min(ci, cj);
  const cMax = Math.max(ci, cj);
  const keys = new Set<string>();
  for (let r = rMin; r <= rMax; r++) {
    for (let c = cMin; c <= cMax; c++) {
      const col = colAt(c);
      if (!col) continue;
      keys.add(cellKey({ rowId: rowIds[r]!, colId: col }));
    }
  }
  return keys;
}

export function parseTsv(text: string): string[][] {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  if (!normalized.trim()) return [];
  return normalized.split('\n').map((line) => line.split('\t'));
}
