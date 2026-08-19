"use client";

import { useEffect, useState, use as usePromise } from "react";
import { useSearchParams } from "next/navigation";
import { apiGet } from "@/lib/api/client";
import { OrderTimeline } from "@/components/site/OrderTimeline";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type TrackedOrder = {
  order: { order_number: string; status: string; total: number; currency: string; created_at: string };
  items: Array<{ title_snapshot: string; quantity: number; line_total: number }>;
  events: Array<{ status: string; note: string | null; created_at: string }>;
};

export default function TrackOrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = usePromise(params);
  const searchParams = useSearchParams();
  const [contact, setContact] = useState(searchParams.get("contact") ?? "");
  const [result, setResult] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function lookup(email: string) {
    setLoading(true);
    setError(null);
    const res = await apiGet<TrackedOrder>(
      `tracking?orderNumber=${encodeURIComponent(orderId)}&contact=${encodeURIComponent(email)}`,
    );
    setLoading(false);
    if (!res.success || !res.data) {
      setError("We couldn't find that order. Check the order number and contact details.");
      return;
    }
    setResult(res.data);
  }

  useEffect(() => {
    if (contact) lookup(contact);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!result) {
    return (
      <div className="mx-auto max-w-md px-5 py-24">
        <h1 className="font-display text-2xl text-ink mb-2">Order {orderId}</h1>
        <p className="text-ink-muted mb-6">Confirm your email or phone to view this order.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            lookup(contact);
          }}
          className="space-y-4"
        >
          <Field label="Email or phone used at checkout">
            <Input value={contact} onChange={(e) => setContact(e.target.value)} />
          </Field>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" size="lg" className="w-full" loading={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : "View order"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-14">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">Order</p>
      <h1 className="font-display text-3xl text-ink mt-1">{result.order.order_number}</h1>
      <p className="mt-1 text-ink-muted">
        Placed {new Date(result.order.created_at).toLocaleDateString()}
      </p>

      <div className="mt-10 grid gap-10 sm:grid-cols-[1fr_1.2fr]">
        <div>
          <h2 className="font-display text-lg text-ink mb-4">Status</h2>
          <OrderTimeline status={result.order.status} />
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 h-fit">
          <h2 className="font-display text-lg text-ink mb-4">Items</h2>
          <div className="space-y-3">
            {result.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-ink-muted">
                  {item.quantity} × {item.title_snapshot}
                </span>
                <span className="tabular-nums">{formatPrice(item.line_total)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-border pt-4 flex justify-between font-semibold">
            <span>Total</span>
            <span className="tabular-nums">
              {formatPrice(result.order.total, result.order.currency)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
