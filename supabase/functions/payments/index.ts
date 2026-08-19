// /payments — Paystack integration.
// POST /payments/initialize   { orderId } -> Paystack authorization_url + reference
// POST /payments/webhook      Paystack webhook, verifies signature, flips order to 'paid'
// GET  /payments/verify?reference=xxx  manual verify fallback
//
// PAYSTACK_SECRET_KEY is not yet supplied by the user — this function reads it from env
// and will return a clear error until it's set via `supabase secrets set`.
import { handleOptions } from "../_shared/cors.ts";
import { successResponse, errorResponse } from "../_shared/response.ts";
import { serviceClient } from "../_shared/db.ts";

const PAYSTACK_BASE = "https://api.paystack.co";

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  const url = new URL(req.url);
  const segments = url.pathname.replace(/^\/+|\/+$/g, "").split("/");
  const sub = segments[1] || null;
  const secretKey = Deno.env.get("PAYSTACK_SECRET_KEY");

  try {
    if (req.method === "POST" && sub === "initialize") {
      if (!secretKey) return errorResponse("Paystack is not configured yet", null, 503);
      return await initialize(req, secretKey);
    }
    if (req.method === "POST" && sub === "webhook") {
      if (!secretKey) return errorResponse("Paystack is not configured yet", null, 503);
      return await webhook(req, secretKey);
    }
    if (req.method === "GET" && sub === "verify") {
      if (!secretKey) return errorResponse("Paystack is not configured yet", null, 503);
      return await verify(url, secretKey);
    }
    return errorResponse("Not found", null, 404);
  } catch (e) {
    return errorResponse("Unexpected error", String(e), 500);
  }
});

async function initialize(req: Request, secretKey: string) {
  const { orderId } = await req.json();
  if (!orderId) return errorResponse("orderId required", null, 400);

  const db = serviceClient();
  const { data: order, error } = await db
    .from("orders")
    .select("id, order_number, total, currency, contact_email")
    .eq("id", orderId)
    .single();
  if (error || !order) return errorResponse("Order not found", null, 404);

  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: order.contact_email,
      amount: Math.round(Number(order.total) * 100), // kobo
      currency: order.currency,
      reference: order.order_number,
      callback_url: `${Deno.env.get("PUBLIC_SITE_URL") ?? ""}/checkout/success?order=${order.order_number}`,
    }),
  });
  const payload = await res.json();
  if (!payload.status) return errorResponse("Paystack initialization failed", payload.message, 502);

  await db.from("orders").update({ payment_reference: order.order_number }).eq("id", order.id);

  return successResponse(payload.data, "Payment initialized");
}

async function verify(url: URL, secretKey: string) {
  const reference = url.searchParams.get("reference");
  if (!reference) return errorResponse("reference required", null, 400);

  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  const payload = await res.json();
  if (!payload.status) return errorResponse("Verification failed", payload.message, 502);

  if (payload.data.status === "success") {
    await markOrderPaid(reference);
  }

  return successResponse(payload.data, "Payment verified");
}

async function webhook(req: Request, secretKey: string) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secretKey),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const computed = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (computed !== signature) return errorResponse("Invalid signature", null, 401);

  const event = JSON.parse(rawBody);
  if (event.event === "charge.success") {
    await markOrderPaid(event.data.reference);
  }

  return successResponse({}, "Webhook processed");
}

async function markOrderPaid(reference: string) {
  const db = serviceClient();
  const { data: order } = await db
    .from("orders")
    .select("id, status")
    .eq("payment_reference", reference)
    .maybeSingle();
  if (!order || order.status !== "pending_payment") return;

  await db
    .from("orders")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", order.id);

  await db.from("order_status_events").insert({
    order_id: order.id,
    status: "paid",
    note: "Payment confirmed via Paystack",
  });
}
