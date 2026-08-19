// /tracking — public order lookup, no account required (flow.md §5).
//
// GET /tracking?orderNumber=LIV-2026-00042&contact=<email or phone>
//
// Order number alone is NOT enough: it must be paired with the email or phone used at
// checkout, and the endpoint is rate-limited per IP so the number space can't be
// enumerated. The response never echoes back the contact details it verified against.
import { handleOptions } from "../_shared/cors.ts";
import { successResponse, errorResponse } from "../_shared/response.ts";
import { serviceClient } from "../_shared/db.ts";

const MAX_ATTEMPTS = 10;
const WINDOW_SECONDS = 300; // 10 lookups per 5 minutes per IP

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;
  if (req.method !== "GET") return errorResponse("Method not allowed", null, 405);

  const url = new URL(req.url);
  const orderNumber = url.searchParams.get("orderNumber")?.trim();
  const contact = url.searchParams.get("contact")?.trim();

  if (!orderNumber || !contact) {
    return errorResponse("An order number and your email or phone are required", null, 400);
  }

  const db = serviceClient();

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("cf-connecting-ip") ??
    "unknown";

  const { data: allowed } = await db.rpc("check_rate_limit", {
    p_bucket: "tracking",
    p_identifier: ip,
    p_max: MAX_ATTEMPTS,
    p_window_seconds: WINDOW_SECONDS,
  });

  if (allowed === false) {
    return errorResponse("Too many lookups. Please wait a few minutes and try again.", null, 429);
  }

  const normalized = contact.toLowerCase();
  const { data: order } = await db
    .from("orders")
    .select(
      "id, order_number, status, subtotal, discount_total, shipping_fee, total, currency, " +
        "created_at, dispatched_at, delivered_at, delivery_method, courier_name, tracking_number, " +
        "contact_email, contact_phone",
    )
    .eq("order_number", orderNumber)
    .maybeSingle();

  // Same response whether the order doesn't exist or the contact doesn't match —
  // otherwise this endpoint confirms which order numbers are real.
  const matches =
    order &&
    (order.contact_email?.toLowerCase() === normalized || order.contact_phone === contact);

  if (!matches) {
    return errorResponse(
      "We couldn't find an order matching those details",
      null,
      404,
    );
  }

  const [{ data: items }, { data: events }] = await Promise.all([
    db
      .from("order_items")
      .select("title_snapshot, quantity, unit_price, line_total")
      .eq("order_id", order!.id),
    db
      .from("order_status_events")
      .select("status, note, created_at")
      .eq("order_id", order!.id)
      .order("created_at", { ascending: true }),
  ]);

  // Strip the fields we authenticated against before returning.
  const { contact_email: _e, contact_phone: _p, id: _id, ...publicOrder } = order!;

  return successResponse({ order: publicOrder, items, events }, "Order found");
});
