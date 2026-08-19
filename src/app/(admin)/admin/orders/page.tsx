"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPatch } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

type Order = {
  id: string;
  order_number: string;
  status: string;
  total: number;
  currency: string;
  contact_email: string;
  created_at: string;
};

const STATUSES = [
  "pending_payment", "paid", "processing", "packed", "shipped",
  "out_for_delivery", "delivered", "cancelled", "refunded",
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await apiGet<Order[]>("orders?pageSize=50");
    setOrders(res.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: string, status: string) {
    const res = await apiPatch(`orders/${id}`, { status });
    if (!res.success) return toast.error(res.message ?? "Failed to update");
    toast.success("Order updated — customer notified");
    load();
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-ink mb-6">Orders</h1>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-ink-muted">
            <tr>
              <th className="px-5 py-3">Order</th>
              <th className="px-5 py-3">Customer</th>
              <th className="px-5 py-3">Total</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td className="px-5 py-6 text-ink-muted" colSpan={4}>Loading…</td></tr>
            ) : orders.length === 0 ? (
              <tr><td className="px-5 py-6 text-ink-muted" colSpan={4}>No orders yet.</td></tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id}>
                  <td className="px-5 py-3 font-medium">{o.order_number}</td>
                  <td className="px-5 py-3 text-ink-muted">{o.contact_email}</td>
                  <td className="px-5 py-3 tabular-nums">{formatPrice(o.total, o.currency)}</td>
                  <td className="px-5 py-3">
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
