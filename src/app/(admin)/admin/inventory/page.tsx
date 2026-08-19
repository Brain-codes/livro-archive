"use client";

import { useCallback, useEffect, useState } from "react";
import { Boxes, Minus, Plus, History } from "lucide-react";
import { toast } from "sonner";
import { apiGet, apiPost } from "@/lib/api/client";
import {
  PageHeader,
  Panel,
  TableWrap,
  Th,
  Td,
  EmptyState,
  TableSkeleton,
} from "@/components/admin/ui";
import { cn } from "@/lib/utils";

type Variant = {
  id: string;
  name: string;
  sku: string | null;
  stock_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
};

type Row = {
  id: string;
  title: string;
  slug: string;
  sku: string | null;
  stock_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  status: string;
  product_variants: Variant[];
};

type Movement = {
  id: string;
  delta: number;
  reason: string;
  note: string | null;
  created_at: string;
  products: { title: string } | null;
};

export default function AdminInventoryPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [threshold, setThreshold] = useState(5);
  const [loading, setLoading] = useState(true);
  const [lowOnly, setLowOnly] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [stock, history] = await Promise.all([
      apiGet<Row[]>(lowOnly ? "inventory/low" : "inventory"),
      apiGet<Movement[]>("inventory/movements"),
    ]);
    if (!stock.success) toast.error(stock.message ?? "Could not load inventory");
    setRows(stock.data ?? []);
    setThreshold(Number((stock.meta as { lowStockThreshold?: number })?.lowStockThreshold ?? 5));
    setMovements(history.data ?? []);
    setLoading(false);
  }, [lowOnly]);

  useEffect(() => {
    load();
  }, [load]);

  async function adjust(productId: string, variantId: string | null, delta: number) {
    const res = await apiPost("inventory/adjust", {
      product_id: productId,
      variant_id: variantId,
      delta,
      note: delta > 0 ? "Stock received" : "Stock removed",
    });
    if (!res.success) return toast.error(res.message ?? "Could not adjust stock");
    toast.success(delta > 0 ? `+${delta} added` : `${delta} removed`);
    load();
  }

  return (
    <>
      <PageHeader
        title="Inventory"
        description="On hand, held for in-flight checkouts, and what's actually sellable."
      />

      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <Panel>
          <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
            <button
              onClick={() => setLowOnly(false)}
              className={cn(
                "cursor-pointer rounded-full px-3 py-1.5 text-[12.5px] transition-colors",
                !lowOnly
                  ? "bg-forest text-on-dark dark:text-canvas"
                  : "border border-border text-ink-muted hover:bg-surface-muted",
              )}
            >
              All stock
            </button>
            <button
              onClick={() => setLowOnly(true)}
              className={cn(
                "cursor-pointer rounded-full px-3 py-1.5 text-[12.5px] transition-colors",
                lowOnly
                  ? "bg-forest text-on-dark dark:text-canvas"
                  : "border border-border text-ink-muted hover:bg-surface-muted",
              )}
            >
              Running low
            </button>
            <p className="ml-auto text-[12px] text-ink-faint">
              Low stock threshold: {threshold} — change it in Settings
            </p>
          </div>

          <TableWrap>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <Th>Product</Th>
                  <Th className="text-right">On hand</Th>
                  <Th className="text-right">Held</Th>
                  <Th className="text-right">Available</Th>
                  <Th className="text-right">Adjust</Th>
                </tr>
              </thead>

              {loading ? (
                <TableSkeleton rows={7} cols={5} />
              ) : rows.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={5}>
                      <EmptyState
                        icon={<Boxes className="size-5" />}
                        title={lowOnly ? "Nothing is running low" : "No products yet"}
                        description={
                          lowOnly
                            ? "Every active product is above the threshold."
                            : "Add products before managing stock."
                        }
                      />
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody>
                  {rows.map((row) => (
                    <StockRows key={row.id} row={row} threshold={threshold} onAdjust={adjust} />
                  ))}
                </tbody>
              )}
            </table>
          </TableWrap>
        </Panel>

        <Panel>
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <History className="size-4 text-ink-muted" />
            <h2 className="font-display text-[15px] font-semibold">Movement history</h2>
          </div>
          <div className="max-h-[640px] divide-y divide-border overflow-y-auto">
            {movements.length === 0 ? (
              <p className="px-5 py-8 text-center text-[13px] text-ink-faint">
                No stock movements recorded yet.
              </p>
            ) : (
              movements.map((movement) => (
                <div key={movement.id} className="flex items-start gap-3 px-5 py-3">
                  <span
                    className={cn(
                      "mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
                      movement.delta > 0
                        ? "bg-success/15 text-success"
                        : "bg-danger/15 text-danger",
                    )}
                  >
                    {movement.delta > 0 ? `+${movement.delta}` : movement.delta}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] text-ink">
                      {movement.products?.title ?? "Unknown product"}
                    </p>
                    <p className="text-[11.5px] capitalize text-ink-faint">
                      {movement.reason.replace(/_/g, " ")} ·{" "}
                      {new Date(movement.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>
    </>
  );
}

function StockRows({
  row,
  threshold,
  onAdjust,
}: {
  row: Row;
  threshold: number;
  onAdjust: (productId: string, variantId: string | null, delta: number) => void;
}) {
  const variants = row.product_variants ?? [];
  const hasVariants = variants.length > 0;

  return (
    <>
      <tr className="border-b border-border last:border-0">
        <Td>
          <p className="font-medium text-ink">{row.title}</p>
          {row.sku && <p className="text-[11.5px] text-ink-faint">{row.sku}</p>}
        </Td>
        <Td className="text-right tabular-nums">{hasVariants ? "—" : row.stock_quantity}</Td>
        <Td className="text-right tabular-nums text-ink-muted">
          {hasVariants ? "—" : row.reserved_quantity}
        </Td>
        <Td className="text-right">
          {hasVariants ? (
            "—"
          ) : (
            <AvailablePill value={row.available_quantity} threshold={threshold} />
          )}
        </Td>
        <Td className="text-right">
          {!hasVariants && (
            <Stepper onAdjust={(delta) => onAdjust(row.id, null, delta)} />
          )}
        </Td>
      </tr>

      {variants.map((variant) => (
        <tr key={variant.id} className="border-b border-border bg-surface-muted/40 last:border-0">
          <Td className="pl-10">
            <p className="text-[13px] text-ink-muted">↳ {variant.name}</p>
          </Td>
          <Td className="text-right tabular-nums">{variant.stock_quantity}</Td>
          <Td className="text-right tabular-nums text-ink-muted">{variant.reserved_quantity}</Td>
          <Td className="text-right">
            <AvailablePill value={variant.available_quantity} threshold={threshold} />
          </Td>
          <Td className="text-right">
            <Stepper onAdjust={(delta) => onAdjust(row.id, variant.id, delta)} />
          </Td>
        </tr>
      ))}
    </>
  );
}

function AvailablePill({ value, threshold }: { value: number; threshold: number }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[12px] font-medium tabular-nums",
        value <= 0
          ? "bg-danger/15 text-danger"
          : value <= threshold
            ? "bg-clay/15 text-clay"
            : "bg-success/15 text-success",
      )}
    >
      {value}
    </span>
  );
}

function Stepper({ onAdjust }: { onAdjust: (delta: number) => void }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border">
      <button
        onClick={() => onAdjust(-1)}
        aria-label="Remove one"
        className="grid size-7 cursor-pointer place-items-center rounded-l-lg text-ink-muted hover:bg-surface-muted hover:text-ink"
      >
        <Minus className="size-3.5" />
      </button>
      <button
        onClick={() => onAdjust(10)}
        className="cursor-pointer px-2 text-[11.5px] font-medium text-ink-muted hover:text-ink"
      >
        +10
      </button>
      <button
        onClick={() => onAdjust(1)}
        aria-label="Add one"
        className="grid size-7 cursor-pointer place-items-center rounded-r-lg text-ink-muted hover:bg-surface-muted hover:text-ink"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
