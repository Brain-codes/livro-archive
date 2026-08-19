import { successResponse, errorResponse } from "../../_shared/response.ts";
import { markOrderPaid, markOrderFailed } from "./settle.ts";

const PAYSTACK_BASE = "https://api.paystack.co";

/**
 * Server-side re-check, used when the shopper returns from Paystack's redirect before
 * the webhook has landed. Still calls Paystack itself — the browser's claim that
 * payment succeeded is never trusted.
 */
export async function verifyPayment(url: URL, secretKey: string) {
  const reference = url.searchParams.get("reference");
  if (!reference) return errorResponse("reference is required", null, 400);

  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  const payload = await res.json();
  if (!payload.status) {
    return errorResponse("Could not verify the payment", payload.message ?? null, 502);
  }

  if (payload.data.status === "success") {
    await markOrderPaid(reference, payload.data.amount);
  } else if (["failed", "abandoned"].includes(payload.data.status)) {
    await markOrderFailed(reference);
  }

  return successResponse(
    { status: payload.data.status, reference },
    "Payment verified",
  );
}
