// /admin-stats — the back office's morning briefing (flow.md §10).
// Answers: what did we sell, what needs attention, what needs dispatching,
// what's low in stock, which payments failed.
import { handleOptions } from "../_shared/cors.ts";
import { successResponse, errorResponse } from "../_shared/response.ts";
import { serviceClient } from "../_shared/db.ts";
import { getCallerFromRequest, can } from "../_shared/auth.ts";
import { getSettings, num } from "../_shared/settings.ts";

const REVENUE_STATUSES = [
  "paid",
  "processing",
  "ready_for_dispatch",
  "shipped",
  "out_for_delivery",
  "delivered",
];

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;
  if (req.method !== "GET") return errorResponse("Method not allowed", null, 405);

  const caller = await getCallerFromRequest(req);
  if (!can(caller, "stats.view")) return errorResponse("Not authorized", null, 403);

  const db = serviceClient();
  const settings = await getSettings(db, ["low_stock_threshold", "stuck_order_hours"]);
  const lowStockThreshold = num(settings.low_stock_threshold, 5);
  const stuckOrderHours = num(settings.stuck_order_hours, 72);

  const since30 = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const stuckBefore = new Date(Date.now() - stuckOrderHours * 3_600_000).toISOString();

  const [
    revenueRows,
    recentRevenueRows,
    statusRows,
    lowStock,
    stuck,
    failedPayments,
    recentOrders,
    customerRows,
    deadNotifications,
  ] = await Promise.all([
    db.from("orders").select("total").in("status", REVENUE_STATUSES),
    db.from("orders").select("total, created_at").in("status", REVENUE_STATUSES).gte("created_at", since30),
    db.from("orders").select("status"),
    db
      .from("products")
      .select("id, title, slug, available_quantity")
      .eq("status", "active")
      .lte("available_quantity", lowStockThreshold)
      .order("available_quantity")
      .limit(20),
    db
      .from("orders")
      .select("id, order_number, status, updated_at")
      .in("status", ["shipped", "out_for_delivery"])
      .lt("updated_at", stuckBefore),
    db
      .from("orders")
      .select("id, order_number, created_at")
      .eq("status", "payment_failed")
      .gte("created_at", since30)
      .order("created_at", { ascending: false })
      .limit(10),
    db
      .from("orders")
      .select("id, order_number, status, total, currency, contact_email, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
    db.from("orders").select("contact_email"),
    db.from("notification_events").select("id", { count: "exact", head: true }).eq("status", "dead"),
  ]);

  const revenue = (revenueRows.data ?? []).reduce((sum, o) => sum + Number(o.total), 0);
  const revenue30 = (recentRevenueRows.data ?? []).reduce((sum, o) => sum + Number(o.total), 0);

  const byStatus: Record<string, number> = {};
  for (const row of statusRows.data ?? []) {
    byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
  }

  // Daily revenue for the last 30 days, zero-filled so the chart has no gaps.
  const dailyMap = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    dailyMap.set(new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10), 0);
  }
  for (const row of recentRevenueRows.data ?? []) {
    const day = String(row.created_at).slice(0, 10);
    if (dailyMap.has(day)) dailyMap.set(day, dailyMap.get(day)! + Number(row.total));
  }
  const dailyRevenue = [...dailyMap.entries()].map(([date, total]) => ({ date, total }));

  const uniqueCustomers = new Set((customerRows.data ?? []).map((o) => o.contact_email)).size;

  // "What needs doing today" — the actual operational queue.
  const awaitingAction =
    (byStatus.paid ?? 0) + (byStatus.processing ?? 0) + (byStatus.ready_for_dispatch ?? 0);

  return successResponse(
    {
      revenue,
      revenue30,
      dailyRevenue,
      totalOrders: (statusRows.data ?? []).length,
      byStatus,
      awaitingAction,
      uniqueCustomers,
      lowStockThreshold,
      lowStockCount: lowStock.data?.length ?? 0,
      lowStock: lowStock.data ?? [],
      needsAttention: stuck.data ?? [],
      failedPayments: failedPayments.data ?? [],
      recentOrders: recentOrders.data ?? [],
      deadNotifications: deadNotifications.count ?? 0,
    },
    "Stats fetched",
  );
});
