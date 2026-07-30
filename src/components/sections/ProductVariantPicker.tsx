import { useMemo, useState } from 'react';
import { formatMoney } from '../../lib/money';

export type ProductVariantOption = {
  id: string;
  sku: string | null;
  name: string;
  price: number;
  stock: number;
  attributesJson: string | null;
};

type Props = {
  variants: ProductVariantOption[];
  currency: string;
  basePrice: number;
  baseSku: string | null;
  baseStock: number;
  showSku?: boolean;
  showStock?: boolean;
};

function parseAttrs(json: string | null): Record<string, string> {
  if (!json) return {};
  try {
    const raw = JSON.parse(json) as unknown;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (v == null) continue;
      out[k] = String(v);
    }
    return out;
  } catch {
    return {};
  }
}

function labelize(key: string): string {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toLocaleUpperCase('tr-TR'));
}

export default function ProductVariantPicker({
  variants,
  currency,
  basePrice,
  baseSku,
  baseStock,
  showSku = true,
  showStock = true,
}: Props) {
  const axes = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const v of variants) {
      const attrs = parseAttrs(v.attributesJson);
      for (const [k, val] of Object.entries(attrs)) {
        if (!map.has(k)) map.set(k, new Set());
        map.get(k)!.add(val);
      }
    }
    return [...map.entries()]
      .filter(([, vals]) => vals.size > 0)
      .map(([key, vals]) => ({ key, values: [...vals].sort((a, b) => a.localeCompare(b, 'tr')) }));
  }, [variants]);

  const hasAxes = axes.length > 0;

  const [selected, setSelected] = useState<Record<string, string>>(() => {
    if (!hasAxes || variants.length === 0) return {};
    const first = parseAttrs(variants[0]!.attributesJson);
    const init: Record<string, string> = {};
    for (const axis of axes) {
      if (first[axis.key]) init[axis.key] = first[axis.key]!;
      else if (axis.values[0]) init[axis.key] = axis.values[0];
    }
    return init;
  });

  const [pickedId, setPickedId] = useState<string | null>(
    !hasAxes && variants.length > 0 ? variants[0]!.id : null,
  );

  const matched = useMemo(() => {
    if (!hasAxes) {
      return variants.find((v) => v.id === pickedId) ?? variants[0] ?? null;
    }
    return (
      variants.find((v) => {
        const attrs = parseAttrs(v.attributesJson);
        return axes.every((axis) => attrs[axis.key] === selected[axis.key]);
      }) ?? null
    );
  }, [axes, hasAxes, pickedId, selected, variants]);

  if (variants.length === 0) return null;

  const price = matched?.price ?? basePrice;
  const sku = matched?.sku ?? baseSku;
  const stock = matched?.stock ?? baseStock;

  return (
    <div className="flex flex-col gap-4" data-product-variants>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="font-mono text-2xl font-bold text-primary" data-variant-price>
          {formatMoney(price, currency)}
        </p>
        <div className="text-right text-sm text-muted-foreground">
          {showSku && (
            <p className="font-mono" data-variant-sku>
              SKU {sku ?? '—'}
            </p>
          )}
          {showStock && (
            <p data-variant-stock>
              Stok: {stock}
            </p>
          )}
        </div>
      </div>

      {hasAxes ? (
        <div className="flex flex-col gap-4">
          {axes.map((axis) => (
            <fieldset key={axis.key} className="flex flex-col gap-2">
              <legend className="text-sm font-semibold">{labelize(axis.key)}</legend>
              <div className="flex flex-wrap gap-2">
                {axis.values.map((value) => {
                  const active = selected[axis.key] === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      className={`min-h-10 rounded-md border px-3 py-1.5 text-sm transition ${
                        active
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:bg-muted'
                      }`}
                      aria-pressed={active}
                      onClick={() => setSelected((prev) => ({ ...prev, [axis.key]: value }))}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
          {!matched && (
            <p className="text-sm text-destructive">Bu kombinasyon stokta yok.</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold">Varyant</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const active = (matched?.id ?? pickedId) === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  className={`min-h-10 rounded-md border px-3 py-1.5 text-sm transition ${
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:bg-muted'
                  }`}
                  aria-pressed={active}
                  onClick={() => setPickedId(v.id)}
                >
                  {v.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
