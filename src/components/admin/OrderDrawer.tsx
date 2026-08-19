"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Truck, MapPin, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { apiGet, apiPatch } from "@/lib/api/client";
import { formatPrice, cn } from "@/lib/utils";
import { StatusPill } from "./ui";

type OrderDetail = {
  order: {
    id: string;
    order_number: string;
    status: string;
    subtotal: number;
    discount_total: number;
    shipping_fee: number;
    total: number;
    currency: string;
    contact_email: string;
    contact_phone: string;
    shipping_address: Record<string, string>;
    created_at: string;
    delivery_method: string;
    courier_name: string | null;
    tracking_number: string | null;
    notes: string | null;
  };
  items: {
    id: string;
    title_snapshot: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }[];
  events: { status: string; note: string | null; created_at: string }[];
};

const STATUSES = [
  "pending_payment",
  "payment_failed",
  "paid",
  "processing",
  "ready_for_dispatch",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "refunded",
  "returned",
];

/**
 * Right-hand order drawer: everything an operator needs to act on one order without
 * losing their place in the list.
 */
export function OrderDrawer({
  orderId,
  onClose,
  onChanged,
}: {
  orderId: string | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [courier, setCourier] = useState("");
  const [tracking, setTracking] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (orderId) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [orderId, onClose]);

  useEffect(() => {
    if (!orderId) {
      setDetail(null);
      return;
    }
    setLoading(true);
    apiGet<OrderDetail>(`orders/${orderId}`).then((res) => {
      setDetail(res.data ?? null);
      setCourier(res.data?.order.courier_name ?? "");
      setTracking(res.data?.order.tracking_number ?? "");
      setLoading(false);
    });
  }, [orderId]);

  async function patch(body: Record<string, unknown>, successMessage: string) {
    if (!orderId) return;
    setSaving(true);
    const res = await apiPatch(`orders/${orderId}`, body);
    setSaving(false);
    if (!res.success) return toast.error(res.message ?? "Could not update the order");
    toast.success(successMessage);
    const refreshed = await apiGet<OrderDetail>(`orders/${orderId}`);
    setDetail(refreshed.data ?? null);
    onChanged();
  }

  const order = detail?.order;

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden
        className={cn(
          "fixed inset-0 z-40 bg-ink/40 transition-opacity",
          orderId ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        role="dialog"
        aria-label="Order detail"
        aria-hidden={!orderId}
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-[460px] flex-col border-l border-border bg-canvas",
          "transition-transform duration-300 ease-[cubic-bezier(.22,.9,.2,1)]",
          orderId ? "translate-x-0" : "translate-x-full",
        )}
      >
        {loading || !order ? (
          <div className="grid flex-1 place-items-center">
            {loading ? <Loader2 className="size-5 animate-spin text-ink-muted" /> : null}
          </div>
        ) : (
          <>
            <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-ink">
                  {order.order_number}
                </h2>
                <div className="mt-1.5 flex items-center gap-2">
                  <StatusPill status={order.status} />
                  <span className="text-[11.5px] text-ink-muted">
                    Placed {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg border border-border text-ink-muted hover:bg-surface-muted"
              >
                <X className="size-4" />
              </button>
            </header>

            <div className="flex-1 space-y-6 overflow-y-auto p-5">
              <section>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
                  Customer
                </p>
                <div className="space-y-1.5 rounded-lg border border-border bg-surface p-4 text-[13px]">
                  <p className="flex items-center gap-2 text-ink">
                    <Mail className="size-3.5 text-ink-faint" />
                    {order.contact_email}
                  </p>
                  <p className="flex items-center gap-2 text-ink">
                    <Phone className="size-3.5 text-ink-faint" />
                    {order.contact_phone}
                  </p>
                  <p className="flex items-start gap-2 text-ink-muted">
                    <MapPin className="mt-0.5 size-3.5 shrink-0 text-ink-faint" />
                    <span>
                      {[
                        order.shipping_address.full_name,
                        order.shipping_address.line1,
                        order.shipping_address.line2,
                        order.shipping_address.city,
                        order.shipping_address.state,
                        order.shipping_address.country,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </p>
                </div>
              </section>

              <section>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
                  Items
                </p>
                <div className="divide-y divide-border rounded-lg border border-border bg-surface">
                  {detail.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 p-3.5">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] text-ink">{item.title_snapshot}</p>
                        <p className="text-[11.5px] text-ink-faint tabular-nums">
                          {item.quantity} × {formatPrice(item.unit_price, order.currency)}
                        </p>
                      </div>
                      <span className="shrink-0 text-[13px] font-medium tabular-nums">
                        {formatPrice(item.line_total, order.currency)}
                      </span>
                    </div>
                  ))}
                  <div className="space-y-1.5 p-3.5 text-[13px]">
                    <Row label="Subtotal" value={formatPrice(order.subtotal, order.currency)} />
                    {order.discount_total > 0 && (
                      <Row
                        label="Discount"
                        value={`− ${formatPrice(order.discount_total, order.currency)}`}
                      />
                    )}
                    <Row label="Delivery" value={formatPrice(order.shipping_fee, order.currency)} />
                    <div className="flex justify-between border-t border-border pt-1.5 font-semibold">
                      <span>Total</span>
                      <span className="tabular-nums">
                        {formatPrice(order.total, order.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
                  Dispatch
                </p>
                <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
                  <div className="flex gap-2">
                    {(["self", "courier"] as const).map((method) => (
                      <button
                        key={method}
                        onClick={() => patch({ delivery_method: method }, "Delivery method updated")}
                        className={cn(
                          "flex-1 cursor-pointer rounded-lg border px-3 py-2 text-[12.5px] transition-colors",
                          order.delivery_method === method
                            ? "border-forest bg-forest/10 font-medium text-forest"
                            : "border-border text-ink-muted hover:bg-surface-muted",
                        )}
                      >
                        {method === "self" ? "Our delivery" : "Courier"}
                      </button>
                    ))}
                  </div>

                  {order.delivery_method === "courier" && (
                    <div className="space-y-2">
                      <input
                        value={courier}
                        onChange={(e) => setCourier(e.target.value)}
                        placeholder="Courier name"
                        className="h-9 w-full rounded-lg border border-border bg-canvas px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-forest/35"
                      />
                      <input
                        value={tracking}
                        onChange={(e) => setTracking(e.target.value)}
                        placeholder="Tracking number"
                        className="h-9 w-full rounded-lg border border-border bg-canvas px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-forest/35"
                      />
                      <button
                        onClick={() =>
                          patch(
                            { courier_name: courier, tracking_number: tracking },
                            "Tracking details saved",
                          )
                        }
                        disabled={saving}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-forest px-4 py-2 text-[12.5px] font-medium text-on-dark disabled:opacity-50 dark:text-canvas"
                      >
                        <Truck className="size-3.5" /> Save tracking
                      </button>
                    </div>
                  )}
                </div>
              </section>

              <section>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
                  Change status
                </p>
                <select
                  value={order.status}
                  onChange={(e) => patch({ status: e.target.value }, "Status updated — customer notified")}
                  disabled={saving}
                  className="h-10 w-full cursor-pointer rounded-lg border border-border bg-surface px-3 text-[13px] capitalize focus:outline-none focus:ring-2 focus:ring-forest/35"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-[11.5px] text-ink-faint">
                  Paid is set by Paystack, not by hand. Cancelling or returning puts stock
                  back on the shelf.
                </p>
              </section>

              <section>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
                  History
                </p>
                <ol className="space-y-3">
                  {detail.events.map((event, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-forest" />
                      <div>
                        <p className="text-[13px] capitalize text-ink">
                          {event.status.replace(/_/g, " ")}
                        </p>
                        <p className="text-[11.5px] text-ink-faint">
                          {new Date(event.created_at).toLocaleString()}
                        </p>
                        {event.note && (
                          <p className="mt-0.5 text-[12px] text-ink-muted">{event.note}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-ink-muted">
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
