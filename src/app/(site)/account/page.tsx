"use client";

import { useSession } from "@/lib/hooks/useSession";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { useRouter } from "next/navigation";

type OrderSummary = {
  id: string;
  order_number: string;
  status: string;
  total: number;
  currency: string;
  created_at: string;
};

export default function AccountPage() {
  const { user, loading } = useSession();
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    apiGet<OrderSummary[]>("orders/mine").then((res) => setOrders(res.data ?? []));
  }, [user]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) return null;

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <h1 className="font-display text-2xl text-ink mb-3">You're not signed in</h1>
        <p className="text-ink-muted mb-6">
          Sign in to see your order history, or track any order without an account.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/auth/sign-in"><Button size="lg">Sign in</Button></Link>
          <Link href="/track"><Button variant="secondary" size="lg">Track an order</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Account</p>
          <h1 className="font-display text-3xl text-ink mt-1">{user.email}</h1>
        </div>
        <Button variant="ghost" onClick={signOut}>Sign out</Button>
      </div>

      <h2 className="font-display text-lg text-ink mb-4">Your orders</h2>
      {!orders ? (
        <p className="text-ink-muted">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="text-ink-muted">No orders yet.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link key={o.id} href={`/track/${o.order_number}?contact=${user.email}`}>
              <Card className="flex items-center justify-between p-5 hover:bg-surface-muted">
                <div>
                  <p className="font-medium text-ink">{o.order_number}</p>
                  <p className="text-sm text-ink-muted capitalize">{o.status.replace(/_/g, " ")}</p>
                </div>
                <p className="font-semibold tabular-nums">{formatPrice(o.total, o.currency)}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
