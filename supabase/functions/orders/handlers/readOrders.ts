import { successResponse, errorResponse } from "../../_shared/response.ts";
import { serviceClient } from "../../_shared/db.ts";

type Db = ReturnType<typeof serviceClient>;

/** Admin order list with search + status filtering. */
export async function listOrders(db: Db, url: URL) {
  const status = url.searchParams.get("status");
  const q = url.searchParams.get("q");
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? "25")));
  const from = (page - 1) * pageSize;

  let query = db
    .from("orders")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (status) query = query.eq("status", status);
  if (q) {
    query = query.or(
      `order_number.ilike.%${q}%,contact_email.ilike.%${q}%,contact_phone.ilike.%${q}%`,
    );
  }

  const { data, error, count } = await query;
  if (error) return errorResponse("Could not load orders", error.message, 500);
  return successResponse(data, "Orders fetched", { page, pageSize, total: count ?? 0 });
}

/** Admin single order: items, full status history and delivery details. */
export async function getOrder(db: Db, id: string) {
  const { data: order } = await db.from("orders").select("*").eq("id", id).maybeSingle();
  if (!order) return errorResponse("Order not found", null, 404);

  const [{ data: items }, { data: events }, { data: agent }] = await Promise.all([
    db.from("order_items").select("*").eq("order_id", id),
    db
      .from("order_status_events")
      .select("*")
      .eq("order_id", id)
      .order("created_at", { ascending: true }),
    order.delivery_agent_id
      ? db.from("delivery_agents").select("*").eq("id", order.delivery_agent_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return successResponse({ order, items, events, agent }, "Order fetched");
}

/**
 * A signed-in customer's orders, matched on email rather than profile_id — so orders
 * placed as a guest appear automatically once they create an account (flow.md §5).
 */
export async function listMyOrders(db: Db, email: string) {
  const { data, error } = await db
    .from("orders")
    .select("id, order_number, status, total, currency, created_at, delivery_method, tracking_number")
    .eq("contact_email", email.toLowerCase())
    .order("created_at", { ascending: false });
  if (error) return errorResponse("Could not load your orders", error.message, 500);
  return successResponse(data, "Orders fetched");
}
