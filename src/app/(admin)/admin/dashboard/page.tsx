"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Wallet,
  ShoppingCart,
  Users,
  AlertTriangle,
  PackageX,
  ArrowRight,
  Boxes,
} from "lucide-react";
import { apiGet } from "@/lib/api/client";
import { formatPrice } from "@/lib/utils";
import {
  PageHeader,
  Panel,
  PanelHeader,
  StatCard,
  StatusPill,
  TableWrap,
  Th,
  Td,
  EmptyState,
} from "@/components/admin/ui";
import { RevenueArea, StatusBars, Gauge } from "@/components/admin/charts";

type Stats = {
  revenue: number;
  revenue30: number;
  dailyRevenue: { date: string; total: number }[];
  totalOrders: number;
  byStatus: Record<string, number>;
  awaitingAction: number;
  uniqueCustomers: number;
  lowStockThreshold: number;
  lowStockCount: number;
  lowStock: { id: string; title: string; slug: string; available_quantity: number }[];
  needsAttention: { id: string; order_number: string; status: string; updated_at: string }[];
  failedPayments: { id: string; order_number: string; created_at: string }[];
  recentOrders: {
    id: string;
    order_number: string;
    status: string;
    total: number;
    currency: string;
    contact_email: string;
    created_at: string;
  }[];
  deadNotifications: number;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<Stats>("admin-stats").then((res) => {
      if (!res.success) setError(res.message);
      setStats(res.data ?? null);
    });
  }, []);

  const loading = !stats && !error;

  const delivered = stats?.byStatus.delivered ?? 0;
  const fulfillable = Object.entries(stats?.byStatus ?? {})
    .filter(([status]) => !["pending_payment", "payment_failed", "cancelled"].includes(status))
    .reduce((sum, [, count]) => sum + count, 0);
  const fulfilmentRate = fulfillable > 0 ? (delivered / fulfillable) * 100 : 0;

  const statusRows = Object.entries(stats?.byStatus ?? {})
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }));

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="What sold, what needs doing, and what's running low."
        actions={
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 rounded-full bg-forest px-4 py-2 text-[13px] font-medium text-on-dark transition-colors hover:bg-forest-deep dark:text-canvas"
          >
            Go to orders <ArrowRight className="size-3.5" />
          </Link>
        }
      />

      {error && (
        <Panel className="mb-6 border-danger/40 bg-danger/5 p-4 text-[13.5px] text-danger">
          {error}
        </Panel>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          featured
          label="Revenue (all time)"
          value={stats ? formatPrice(stats.revenue) : "—"}
          sub={stats ? `${formatPrice(stats.revenue30)} in the last 30 days` : undefined}
          icon={<Wallet className="size-4" />}
          loading={loading}
        />
        <StatCard
          label="Orders"
          value={stats?.totalOrders ?? "—"}
          sub={stats ? `${stats.awaitingAction} awaiting action` : undefined}
          icon={<ShoppingCart className="size-4" />}
          loading={loading}
        />
        <StatCard
          label="Customers"
          value={stats?.uniqueCustomers ?? "—"}
          sub="Guests included"
          icon={<Users className="size-4" />}
          loading={loading}
        />
        <StatCard
          label="Low stock"
          value={stats?.lowStockCount ?? "—"}
          sub={stats ? `At or below ${stats.lowStockThreshold}` : undefined}
          icon={<Boxes className="size-4" />}
          loading={loading}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Panel>
          <PanelHeader
            title="Revenue"
            description="Paid orders over the last 30 days"
          />
          <div className="p-5">
            {stats ? <RevenueArea data={stats.dailyRevenue} /> : <div className="h-[200px]" />}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Orders by status" />
          <div className="p-5">
            {statusRows.length > 0 ? (
              <StatusBars data={statusRows} />
            ) : (
              <p className="py-8 text-center text-[13px] text-ink-faint">No orders yet</p>
            )}
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Panel>
          <PanelHeader
            title="Recent orders"
            actions={
              <Link href="/admin/orders" className="text-[12.5px] text-forest hover:underline">
                View all
              </Link>
            }
          />
          {stats && stats.recentOrders.length === 0 ? (
            <EmptyState
              icon={<ShoppingCart className="size-5" />}
              title="No orders yet"
              description="Orders will appear here the moment someone checks out."
            />
          ) : (
            <TableWrap>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <Th>Order</Th>
                    <Th>Customer</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Total</Th>
                  </tr>
                </thead>
                <tbody>
                  {(stats?.recentOrders ?? []).map((order) => (
                    <tr key={order.id} className="border-b border-border last:border-0">
                      <Td>
                        <Link
                          href={`/admin/orders?order=${order.order_number}`}
                          className="font-medium text-ink hover:text-forest"
                        >
                          {order.order_number}
                        </Link>
                        <p className="text-[11.5px] text-ink-faint">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </Td>
                      <Td className="max-w-[200px] truncate text-ink-muted">
                        {order.contact_email}
                      </Td>
                      <Td>
                        <StatusPill status={order.status} />
                      </Td>
                      <Td className="text-right font-medium tabular-nums">
                        {formatPrice(order.total, order.currency)}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel className="p-5">
            <Gauge
              value={fulfilmentRate}
              label="Delivered"
              caption={`${delivered} of ${fulfillable} payable orders`}
            />
          </Panel>

          <Panel>
            <PanelHeader title="Needs attention" />
            <div className="divide-y divide-border">
              {stats?.needsAttention.length ? (
                stats.needsAttention.slice(0, 4).map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders?order=${order.order_number}`}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-muted"
                  >
                    <AlertTriangle className="size-4 shrink-0 text-gold" />
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-ink">{order.order_number}</p>
                      <p className="text-[11.5px] text-ink-muted">
                        Stuck at {order.status.replace(/_/g, " ")}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="px-5 py-6 text-[13px] text-ink-faint">
                  Nothing is stuck. Everything is moving.
                </p>
              )}

              {stats?.failedPayments.slice(0, 3).map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders?order=${order.order_number}`}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-muted"
                >
                  <PackageX className="size-4 shrink-0 text-danger" />
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-ink">{order.order_number}</p>
                    <p className="text-[11.5px] text-ink-muted">Payment didn't complete</p>
                  </div>
                </Link>
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="Running low"
              actions={
                <Link
                  href="/admin/inventory"
                  className="text-[12.5px] text-forest hover:underline"
                >
                  Inventory
                </Link>
              }
            />
            <div className="divide-y divide-border">
              {stats?.lowStock.length ? (
                stats.lowStock.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <span className="truncate text-[13px] text-ink">{product.title}</span>
                    <span className="shrink-0 rounded-full bg-clay/15 px-2 py-0.5 text-[11px] font-medium tabular-nums text-clay">
                      {product.available_quantity} left
                    </span>
                  </div>
                ))
              ) : (
                <p className="px-5 py-6 text-[13px] text-ink-faint">Stock levels are healthy.</p>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
