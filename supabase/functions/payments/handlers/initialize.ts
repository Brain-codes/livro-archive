import { successResponse, errorResponse } from "../../_shared/response.ts";
import { serviceClient } from "../../_shared/db.ts";
import { getSettings, num } from "../../_shared/settings.ts";

const PAYSTACK_BASE = "https://api.paystack.co";

/**
 * Starts a Paystack transaction and holds stock for the duration of the checkout.
 *
 * This is where inventory is reserved (flow.md §3) — not at add-to-cart, and not at
 * order creation. If someone else bought the last copy in the meantime, the
 * reservation fails here and the order is marked payment_failed rather than
 * proceeding to take money for something we can't ship.
 */
export async function initializePayment(req: Request, secretKey: string) {
  const { orderId } = await req.json();
  if (!orderId) return errorResponse("orderId is required", null, 400);

  const db = serviceClient();
  const { data: order } = await db
    .from("orders")
    .select("id, order_number, total, currency, contact_email, status")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return errorResponse("Order not found", null, 404);
  if (order.status === "paid") {
    return errorResponse("This order has already been paid", null, 409);
  }
  if (order.status !== "pending_payment") {
    return errorResponse("This order can no longer be paid for", null, 409);
  }

  const settings = await getSettings(db, ["reservation_ttl_minutes"]);
  const ttl = num(settings.reservation_ttl_minutes, 30);

  const { data: reserved, error: reserveError } = await db.rpc("reserve_order_stock", {
    p_order_id: order.id,
    p_ttl_minutes: ttl,
  });

  if (reserveError) {
    return errorResponse("Could not hold stock for this order", reserveError.message, 500);
  }
  if (reserved === false) {
    await db
      .from("orders")
      .update({ status: "payment_failed", updated_at: new Date().toISOString() })
      .eq("id", order.id);
    await db.from("order_status_events").insert({
      order_id: order.id,
      status: "payment_failed",
      note: "Stock ran out before payment could be taken",
    });
    return errorResponse(
      "Sorry — something in your basket sold out while you were checking out",
      null,
      409,
    );
  }

  const siteUrl = Deno.env.get("PUBLIC_SITE_URL") ?? "";
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: order.contact_email,
      amount: Math.round(Number(order.total) * 100), // Paystack works in kobo
      currency: order.currency,
      reference: order.order_number,
      callback_url: `${siteUrl}/checkout/success?order=${order.order_number}`,
      metadata: { order_id: order.id, order_number: order.order_number },
    }),
  });

  const payload = await res.json();
  if (!payload.status) {
    // Don't sit on held stock if the provider rejected us.
    await db.rpc("release_order_stock", { p_order_id: order.id });
    return errorResponse("Could not start the payment", payload.message ?? null, 502);
  }

  await db
    .from("orders")
    .update({ payment_reference: order.order_number })
    .eq("id", order.id);

  return successResponse(payload.data, "Payment initialized");
}
