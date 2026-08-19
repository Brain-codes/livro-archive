// /payments — Paystack. Router only; handlers in ./handlers.
//
// POST /payments/initialize  { orderId }  → reserves stock, returns Paystack auth URL
// POST /payments/webhook                  → signature-verified, the ONLY path to `paid`
// GET  /payments/verify?reference=        → server-side re-check (callback fallback)
import { handleOptions } from "../_shared/cors.ts";
import { errorResponse } from "../_shared/response.ts";
import { initializePayment } from "./handlers/initialize.ts";
import { handleWebhook } from "./handlers/webhook.ts";
import { verifyPayment } from "./handlers/verify.ts";

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  const url = new URL(req.url);
  const segments = url.pathname.replace(/^\/+|\/+$/g, "").split("/");
  const sub = segments[1] || null;

  const secretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
  if (!secretKey) {
    return errorResponse(
      "Payments are not configured yet",
      { hint: "Set PAYSTACK_SECRET_KEY with `supabase secrets set`" },
      503,
    );
  }

  try {
    if (req.method === "POST" && sub === "initialize") {
      return await initializePayment(req, secretKey);
    }
    if (req.method === "POST" && sub === "webhook") {
      return await handleWebhook(req, secretKey);
    }
    if (req.method === "GET" && sub === "verify") {
      return await verifyPayment(url, secretKey);
    }
    return errorResponse("Not found", null, 404);
  } catch (e) {
    console.error("payments error", e);
    return errorResponse("Something went wrong", null, 500);
  }
});
