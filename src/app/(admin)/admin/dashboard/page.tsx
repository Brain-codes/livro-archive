"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { formatPrice } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

type Stats = {
  totalOrders: number;
  revenue: number;
  lowStockCount: number;
  needsAttention: Array<{ id: string; order_number: string; status: string }>;
  recentOrders: Array<{ id: string; order_number: string; status: string; total: number; created_at: string }>;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    apiGet<Stats>("admin-stats").then((res) => setStats(res.data ?? null));
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl text-ink mb-6">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-ink-muted">Total orders</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">{stats?.totalOrders ?? "—"}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-ink-muted">Revenue (paid+)</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">
            {stats ? formatPrice(stats.revenue) : "—"}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-ink-muted">Low stock items</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">{stats?.lowStockCount ?? "—"}</p>
        </Card>
      </div>

      {stats && stats.needsAttention.length > 0 && (
        <Card className="mb-8 border-gold/40 bg-gold/5 p-5">
          <p className="flex items-center gap-2 font-medium text-ink">
            <AlertTriangle className="size-4 text-gold" /> Needs attention
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            {stats.needsAttention.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders?highlight=${o.order_number}`} className="text-primary hover:underline">
                  {o.order_number}
                </Link>{" "}
                — stuck at {o.status.replace(/_/g, " ")}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-5">
        <p className="font-medium text-ink mb-4">Recent orders</p>
        <div className="divide-y divide-border">
          {(stats?.recentOrders ?? []).map((o) => (
            <div key={o.id} className="flex items-center justify-between py-3 text-sm">
              <span>{o.order_number}</span>
              <span className="text-ink-muted capitalize">{o.status.replace(/_/g, " ")}</span>
              <span className="tabular-nums">{formatPrice(o.total)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
