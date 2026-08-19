import { successResponse, errorResponse } from "../../_shared/response.ts";
import { serviceClient } from "../../_shared/db.ts";
import type { AuthedUser } from "../../_shared/auth.ts";

type Db = ReturnType<typeof serviceClient>;

const ALLOWED_STATUSES = [
  "pending_payment",
  "payment_failed",
  "paid",
  "processing",
  "ready_for_dispatch",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "refunded",
  "returned",
] as const;

// Every state change fans out into a notification event (flow.md §7).
const STATUS_EVENT: Record<string, string> = {
  processing: "order_processing",
  ready_for_dispatch: "order_ready_for_dispatch",
  shipped: "order_shipped",
  out_for_delivery: "order_out_for_delivery",
  delivered: "order_delivered",
  cancelled: "order_cancelled",
  refunded: "order_refunded",
};

/**
 * Admin order update: status transitions plus dispatch details.
 *
 * Deliberately refuses to set `paid` by hand — that state belongs to the verified
 * Paystack webhook alone (flow.md §2), so the back office can never fake a payment.
 */
export async function updateOrder(db: Db, id: string, req: Request, actor: AuthedUser) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid request body", null, 400);
  }

  const { data: order } = await db
    .from("orders")
    .select("id, status, order_number")
    .eq("id", id)
    .maybeSingle();
  if (!order) return errorResponse("Order not found", null, 404);

  const status = body.status ? String(body.status) : null;
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  // Dispatch details — hybrid delivery model (flow.md §6).
  if (body.delivery_method !== undefined) {
    const method = String(body.delivery_method);
    if (!["self", "courier"].includes(method)) {
      return errorResponse("Delivery method must be 'self' or 'courier'", null, 400);
    }
    patch.delivery_method = method;
  }
  if (body.courier_name !== undefined) patch.courier_name = body.courier_name;
  if (body.tracking_number !== undefined) patch.tracking_number = body.tracking_number;
  if (body.delivery_agent_id !== undefined) patch.delivery_agent_id = body.delivery_agent_id;
  if (body.notes !== undefined) patch.notes = body.notes;

  if (status) {
    if (!ALLOWED_STATUSES.includes(status as typeof ALLOWED_STATUSES[number])) {
      return errorResponse("Unknown order status", null, 400);
    }
    if (status === "paid" && order.status !== "paid") {
      return errorResponse(
        "Payment status is set by the payment provider, not manually",
        null,
        409,
      );
    }

    patch.status = status;
    if (status === "shipped") patch.dispatched_at = new Date().toISOString();
    if (status === "delivered") patch.delivered_at = new Date().toISOString();
    if (status === "cancelled" && body.cancellation_reason) {
      patch.cancellation_reason = body.cancellation_reason;
    }
  }

  const { data: updated, error } = await db
    .from("orders")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) return errorResponse("Could not update the order", error.message, 400);

  if (status && status !== order.status) {
    await db.from("order_status_events").insert({
      order_id: id,
      status,
      note: (body.note as string) ?? null,
      created_by: actor.id,
    });

    // Cancelled or returned after payment puts physical stock back on the shelf.
    if (["cancelled", "returned", "refunded"].includes(status)) {
      await db.rpc("restock_order", {
        p_order_id: id,
        p_reason: status === "returned" ? "return" : "cancellation",
      });
    }

    const eventType = STATUS_EVENT[status];
    if (eventType) {
      await db.rpc("record_notification_event", {
        p_event_type: eventType,
        p_order_id: id,
        p_payload: {
          courier_name: updated.courier_name,
          tracking_number: updated.tracking_number,
        },
      });
    }
  }

  return successResponse(updated, "Order updated");
}
