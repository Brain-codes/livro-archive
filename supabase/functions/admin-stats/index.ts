// /admin-stats — dashboard KPIs. GET only, admin/staff only.
import { handleOptions } from "../_shared/cors.ts";
import { successResponse, errorResponse } from "../_shared/response.ts";
import { serviceClient } from "../_shared/db.ts";
import { getCallerFromRequest, can } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;
  if (req.method !== "GET") return errorResponse("Method not allowed", null, 405);

  const caller = await getCallerFromRequest(req);
  if (!can(caller, "stats.view")) return errorResponse("Not authorized", null, 403);

  const db = serviceClient();

  const { data: settingsRows } = await db
    .from("settings")
    .select("key, value")
    .in("key", ["low_stock_threshold", "stuck_order_hours"]);
  const settingsMap = Object.fromEntries((settingsRows ?? []).map((s) => [s.key, s.value]));
  const lowStockThreshold = Number(settingsMap.low_stock_threshold ?? 5);
  const stuckOrderHours = Number(settingsMap.stuck_order_hours ?? 72);

  const { count: totalOrders } = await db
    .from("orders")
    .select("*", { count: "exact", head: true });

  const { data: paidOrders } = await db
    .from("orders")
    .select("total")
    .in("status", ["paid", "processing", "packed", "shipped", "out_for_delivery", "delivered"]);

  const revenue = (paidOrders ?? []).reduce((sum, o) => sum + Number(o.total), 0);

  const { count: lowStock } = await db
    .from("products")
    .select("*", { count: "exact", head: true })
    .lte("stock_quantity", lowStockThreshold)
    .eq("status", "active");

  const { data: needsAttention } = await db
    .from("orders")
    .select("id, order_number, status, updated_at")
    .in("status", ["shipped", "out_for_delivery"])
    .lt("updated_at", new Date(Date.now() - 1000 * 60 * 60 * stuckOrderHours).toISOString());

  const { data: recentOrders } = await db
    .from("orders")
    .select("id, order_number, status, total, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  return successResponse(
    {
      totalOrders: totalOrders ?? 0,
      revenue,
      lowStockCount: lowStock ?? 0,
      needsAttention: needsAttention ?? [],
      recentOrders: recentOrders ?? [],
    },
    "Stats fetched",
  );
});
