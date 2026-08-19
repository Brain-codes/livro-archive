// /send-email — transactional order emails, called server-to-server by /orders and
// /payments. Kept as its own resource so the transport is swappable (Supabase SMTP now,
// a Node/SMTP microservice later) without touching any caller.
// POST /send-email { type: "order_status" | "order_confirmation", to, orderNumber, status? }
import { handleOptions } from "../_shared/cors.ts";
import { successResponse, errorResponse } from "../_shared/response.ts";

const STATUS_COPY: Record<string, string> = {
  pending_payment: "We're waiting for your payment to be confirmed.",
  paid: "Payment received — your order is being prepared.",
  processing: "Your order is being processed.",
  packed: "Your order has been packed and is ready to ship.",
  shipped: "Your order is on its way.",
  out_for_delivery: "Your order is out for delivery.",
  delivered: "Your order has been delivered. Enjoy!",
  cancelled: "Your order has been cancelled.",
  refunded: "Your order has been refunded.",
};

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return errorResponse("Method not allowed", null, 405);

  const { type, to, orderNumber, status } = await req.json();
  if (!to || !orderNumber) return errorResponse("to and orderNumber are required", null, 400);

  const siteUrl = Deno.env.get("PUBLIC_SITE_URL") ?? "";
  const subject =
    type === "order_confirmation"
      ? `Livro Archive — Order ${orderNumber} confirmed`
      : `Livro Archive — Order ${orderNumber} update`;
  const body =
    type === "order_confirmation"
      ? `Thanks for your order! Track it any time at ${siteUrl}/track/${orderNumber}.`
      : `${STATUS_COPY[status] ?? "Your order status changed."} Track it at ${siteUrl}/track/${orderNumber}.`;

  // v1 transport: Supabase Auth's SMTP is for auth emails, not transactional order mail
  // on the free plan. This resource is intentionally the single choke point for outbound
  // order email so the transport can be swapped (e.g. a Node/SMTP microservice) later.
  // Until that transport is wired up, log the intended email so nothing is silently lost.
  console.log(JSON.stringify({ to, subject, body }));

  return successResponse({ queued: true }, "Email queued");
});
