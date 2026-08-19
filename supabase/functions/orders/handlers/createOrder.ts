import { successResponse, errorResponse } from "../../_shared/response.ts";
import { serviceClient } from "../../_shared/db.ts";
import { priceOrder, isPricingError, type RequestedItem } from "../../_shared/pricing.ts";

type Db = ReturnType<typeof serviceClient>;

/**
 * Checkout. Creates an order in `pending_payment`.
 *
 * Deliberately does NOT touch stock — stock is held at payment initialization with a
 * TTL and only decremented when Paystack confirms payment (flow.md §3). An abandoned
 * checkout must never cost the shop inventory.
 */
export async function createOrder(db: Db, req: Request, profileId: string | null) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid request body", null, 400);
  }

  const contactEmail = String(body.contact_email ?? "").trim().toLowerCase();
  const contactPhone = String(body.contact_phone ?? "").trim();
  const shippingAddress = body.shipping_address as Record<string, unknown> | undefined;
  const items = body.items as RequestedItem[] | undefined;
  const idempotencyKey = body.idempotency_key ? String(body.idempotency_key) : null;
  const discountCode = body.discount_code ? String(body.discount_code) : null;

  const errors: Record<string, string> = {};
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactEmail)) {
    errors.contact_email = "Enter a valid email address";
  }
  if (contactPhone.length < 7) errors.contact_phone = "Enter a valid phone number";
  if (!shippingAddress?.line1) errors.shipping_address = "A delivery address is required";
  if (!items?.length) errors.items = "Your basket is empty";
  if (Object.keys(errors).length > 0) {
    return errorResponse("Please check the highlighted fields", errors, 400);
  }

  // Idempotency: a double-clicked or retried checkout returns the same order rather
  // than creating a second one (flow.md §12.4).
  if (idempotencyKey) {
    const { data: existing } = await db
      .from("orders")
      .select("*")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();
    if (existing) return successResponse(existing, "Order already created");
  }

  const priced = await priceOrder(db, items!, discountCode);
  if (isPricingError(priced)) {
    return errorResponse(priced.error, null, priced.status);
  }

  const { data: orderNumberRow, error: numberError } = await db.rpc("next_order_number");
  if (numberError) {
    return errorResponse("Could not generate an order number", numberError.message, 500);
  }

  const { data: order, error: orderError } = await db
    .from("orders")
    .insert({
      order_number: orderNumberRow,
      profile_id: profileId,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      shipping_address: shippingAddress,
      status: "pending_payment",
      subtotal: priced.subtotal,
      discount_total: priced.discount_total,
      discount_code: priced.discount_code,
      shipping_fee: priced.shipping_fee,
      total: priced.total,
      idempotency_key: idempotencyKey,
    })
    .select()
    .single();

  if (orderError) {
    return errorResponse("Could not create your order", orderError.message, 500);
  }

  const { error: itemsError } = await db
    .from("order_items")
    .insert(priced.lines.map((l) => ({ ...l, order_id: order.id })));

  if (itemsError) {
    // Don't leave a headless order behind if the items fail to write.
    await db.from("orders").delete().eq("id", order.id);
    return errorResponse("Could not create your order", itemsError.message, 500);
  }

  await db.from("order_status_events").insert({
    order_id: order.id,
    status: "pending_payment",
    note: "Order created, awaiting payment",
  });

  await db.rpc("record_notification_event", {
    p_event_type: "order_created",
    p_order_id: order.id,
    p_payload: { total: priced.total },
  });

  return successResponse(order, "Order created", {}, 201);
}
