// /tracking — public order lookup, no auth required.
// GET /tracking?orderNumber=LA-...&contact=email-or-phone
import { handleOptions } from "../_shared/cors.ts";
import { successResponse, errorResponse } from "../_shared/response.ts";
import { serviceClient } from "../_shared/db.ts";

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;
  if (req.method !== "GET") return errorResponse("Method not allowed", null, 405);

  const url = new URL(req.url);
  const orderNumber = url.searchParams.get("orderNumber");
  const contact = url.searchParams.get("contact");

  if (!orderNumber || !contact) {
    return errorResponse("orderNumber and contact are required", null, 400);
  }

  const db = serviceClient();
  const { data: order, error } = await db
    .from("orders")
    .select("id, order_number, status, total, currency, created_at, contact_email, contact_phone")
    .eq("order_number", orderNumber)
    .or(`contact_email.eq.${contact},contact_phone.eq.${contact}`)
    .maybeSingle();

  if (error || !order) return errorResponse("Order not found", null, 404);

  const { data: items } = await db
    .from("order_items")
    .select("title_snapshot, quantity, unit_price, line_total")
    .eq("order_id", order.id);

  const { data: events } = await db
    .from("order_status_events")
    .select("status, note, created_at")
    .eq("order_id", order.id)
    .order("created_at", { ascending: true });

  const { contact_email, contact_phone, ...publicOrder } = order;
  void contact_email;
  void contact_phone;

  return successResponse({ order: publicOrder, items, events }, "Order found");
});
