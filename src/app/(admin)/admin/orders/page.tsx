"use client";

import { useCallback, useEffect, useState } from "react";
import { ShoppingCart, Search, X, Truck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiGet, apiPatch } from "@/lib/api/client";
import { formatPrice } from "@/lib/utils";
import {
  PageHeader,
  Panel,
  StatusPill,
  TableWrap,
  Th,
  Td,
  EmptyState,
  TableSkeleton,
} from "@/components/admin/ui";
import { OrderDrawer } from "@/components/admin/OrderDrawer";

export type Order = {
  id: string;
  order_number: string;
  status: string;
  total: number;
  currency: string;
  contact_email: string;
  contact_phone: string;
  created_at: string;
  delivery_method: string;
  courier_name: string | null;
  tracking_number: string | null;
  shipping_address: Record<string, unknown>;
};

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "pending_payment", label: "Awaiting payment" },
  { value: "paid", label: "Paid" },
  { value: "processing", label: "Processing" },
  { value: "ready_for_dispatch", label: "Ready" },
  { value: "shipped", label: "Shipped" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ pageSize: "60" });
    if (status) params.set("status", status);
    if (query.trim()) params.set("q", query.trim());

    const res = await apiGet<Order[]>(`orders?${params}`);
    if (!res.success) toast.error(res.message ?? "Could not load orders");
    setOrders(res.data ?? []);
    setLoading(false);
  }, [status, query]);

  useEffect(() => {
    const timer = setTimeout(load, query ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, query]);

  // Deep link from the dashboard: ?order=LIV-2026-00001
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("order");
    if (param) setQuery(param);
  }, []);

  async function quickAdvance(order: Order, next: string): Promise<void> {
    const res = await apiPatch(`orders/${order.id}`, { status: next });
    if (!res.success) {
      toast.error(res.message ?? "Could not update the order");
      return;
    }
    toast.success(`${order.order_number} → ${next.replace(/_/g, " ")}`);
    load();
  }

  return (
    <>
      <PageHeader
        title="Orders"
        description="Every order, and what each one is waiting on."
      />

      <Panel>
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatus(filter.value)}
                className={`cursor-pointer rounded-full px-3 py-1.5 text-[12.5px] transition-colors ${
                  status === filter.value
                    ? "bg-forest text-on-dark dark:text-canvas"
                    : "border border-border text-ink-muted hover:bg-surface-muted"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <label className="relative ml-auto w-full sm:w-64">
            <span className="sr-only">Search orders</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Order number, email or phone"
              className="h-9 w-full rounded-lg border border-border bg-canvas pl-9 pr-8 text-[13px] focus:outline-none focus:ring-2 focus:ring-forest/35"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-ink-faint hover:text-ink"
              >
                <X className="size-3.5" />
              </button>
            )}
          </label>
        </div>

        <TableWrap>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Delivery</Th>
                <Th>Status</Th>
                <Th className="text-right">Total</Th>
                <Th />
              </tr>
            </thead>

            {loading ? (
              <TableSkeleton rows={6} cols={6} />
            ) : orders.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={<ShoppingCart className="size-5" />}
                      title={query || status ? "No matching orders" : "No orders yet"}
                      description={
                        query || status
                          ? "Try a different filter or search term."
                          : "Orders appear here as soon as someone checks out."
                      }
                    />
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedId(order.id)}
                    className="cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-surface-muted"
                  >
                    <Td>
                      <p className="font-medium text-ink">{order.order_number}</p>
                      <p className="text-[11.5px] text-ink-faint">
                        {new Date(order.created_at).toLocaleString(undefined, {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </Td>
                    <Td>
                      <p className="max-w-[200px] truncate text-ink">{order.contact_email}</p>
                      <p className="text-[11.5px] text-ink-faint">{order.contact_phone}</p>
                    </Td>
                    <Td>
                      <span className="inline-flex items-center gap-1.5 text-[12.5px] capitalize text-ink-muted">
                        <Truck className="size-3.5" />
                        {order.delivery_method === "courier"
                          ? order.courier_name || "Courier"
                          : "Own delivery"}
                      </span>
                    </Td>
                    <Td>
                      <StatusPill status={order.status} />
                    </Td>
                    <Td className="text-right font-medium tabular-nums">
                      {formatPrice(order.total, order.currency)}
                    </Td>
                    <Td className="text-right">
                      <NextStepButton order={order} onAdvance={quickAdvance} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </TableWrap>
      </Panel>

      <OrderDrawer
        orderId={selectedId}
        onClose={() => setSelectedId(null)}
        onChanged={load}
      />
    </>
  );
}

const NEXT_STEP: Record<string, { next: string; label: string }> = {
  paid: { next: "processing", label: "Start packing" },
  processing: { next: "ready_for_dispatch", label: "Mark ready" },
  ready_for_dispatch: { next: "shipped", label: "Dispatch" },
  shipped: { next: "out_for_delivery", label: "Out for delivery" },
  out_for_delivery: { next: "delivered", label: "Delivered" },
};

function NextStepButton({
  order,
  onAdvance,
}: {
  order: Order;
  onAdvance: (order: Order, next: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const step = NEXT_STEP[order.status];
  if (!step) return null;

  return (
    <button
      onClick={async (e) => {
        e.stopPropagation();
        setBusy(true);
        await onAdvance(order, step.next);
        setBusy(false);
      }}
      disabled={busy}
      className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border border-border-strong px-3 py-1.5 text-[12px] font-medium text-ink transition-colors hover:bg-canvas disabled:opacity-50"
    >
      {busy && <Loader2 className="size-3 animate-spin" />}
      {step.label}
    </button>
  );
}
