import { serviceClient } from "../../_shared/db.ts";

/**
 * Turns a confirmed Paystack charge into a paid order: converts the stock reservation
 * into a real sale and queues the confirmation email.
 *
 * Idempotent by design — the status guard means a webhook replay (Paystack retries)
 * can never double-decrement stock, and record_notification_event's unique constraint
 * means it can never double-email the customer.
 */
export async function markOrderPaid(reference: string, amountKobo?: number) {
  const db = serviceClient();

  const { data: order } = await db
    .from("orders")
    .select("id, status, total")
    .eq("payment_reference", reference)
    .maybeSingle();

  if (!order) {
    console.error("payment for unknown reference", reference);
    return;
  }
  if (order.status !== "pending_payment") return; // already settled, or not payable

  // Guard against an underpayment being treated as a full payment.
  if (amountKobo != null) {
    const expected = Math.round(Number(order.total) * 100);
    if (amountKobo < expected) {
      console.error("underpayment", { reference, expected, received: amountKobo });
      return;
    }
  }

  await db
    .from("orders")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id)
    .eq("status", "pending_payment"); // conditional update = concurrency-safe

  await db.rpc("commit_order_stock", { p_order_id: order.id });

  await db.from("order_status_events").insert({
    order_id: order.id,
    status: "paid",
    note: "Payment confirmed by Paystack",
  });

  await db.rpc("record_notification_event", {
    p_event_type: "payment_succeeded",
    p_order_id: order.id,
    p_payload: {},
  });
}

/** A failed or abandoned charge: hand the held stock back to the shop. */
export async function markOrderFailed(reference: string) {
  const db = serviceClient();

  const { data: order } = await db
    .from("orders")
    .select("id, status")
    .eq("payment_reference", reference)
    .maybeSingle();

  if (!order || order.status !== "pending_payment") return;

  await db.rpc("release_order_stock", { p_order_id: order.id });
  await db
    .from("orders")
    .update({ status: "payment_failed", updated_at: new Date().toISOString() })
    .eq("id", order.id)
    .eq("status", "pending_payment");

  await db.from("order_status_events").insert({
    order_id: order.id,
    status: "payment_failed",
    note: "Payment was not completed",
  });

  await db.rpc("record_notification_event", {
    p_event_type: "payment_failed",
    p_order_id: order.id,
    p_payload: {},
  });
}
