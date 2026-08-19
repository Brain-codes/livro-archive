import { successResponse, errorResponse } from "../../_shared/response.ts";
import { markOrderPaid, markOrderFailed } from "./settle.ts";

/** Constant-time comparison — avoids leaking signature bytes through timing. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * The only trusted source of "this order was paid" (flow.md §2). Verifies Paystack's
 * HMAC-SHA512 signature over the raw body before believing anything in it.
 */
export async function handleWebhook(req: Request, secretKey: string) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");
  if (!signature) return errorResponse("Missing signature", null, 401);

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

  if (!timingSafeEqual(computed, signature)) {
    return errorResponse("Invalid signature", null, 401);
  }

  const event = JSON.parse(rawBody);
  const reference = event?.data?.reference;
  if (!reference) return successResponse({}, "Ignored — no reference");

  switch (event.event) {
    case "charge.success":
      await markOrderPaid(reference, event.data.amount);
      break;
    case "charge.failed":

      await markOrderFailed(reference);
      break;
    default:
      break; // other Paystack events are not our concern
  }

  // Always 200 on a verified webhook — a non-2xx makes Paystack retry needlessly.
  return successResponse({}, "Webhook processed");
}
