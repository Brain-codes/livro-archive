// /send-email — the single transport seam for outbound customer mail.
//
// Called only by /notifications. Renders the template here and hands the finished
// message to the Node SMTP microservice (email-service/), so swapping transport later
// touches exactly this one file. Supabase Auth still sends its own verification and
// password-reset mail natively.
import { handleOptions } from "../_shared/cors.ts";
import { successResponse, errorResponse } from "../_shared/response.ts";
import { isServiceRole } from "../_shared/auth.ts";
import { renderTemplate } from "./templates.ts";

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return errorResponse("Method not allowed", null, 405);

  // Service-role only: this is server-to-server, never called from a browser.
  if (!isServiceRole(req)) return errorResponse("Not authorized", null, 403);

  const { eventType, to, payload } = await req.json();
  if (!eventType || !to) {
    return errorResponse("eventType and to are required", null, 400);
  }

  const siteUrl = Deno.env.get("PUBLIC_SITE_URL") ?? "";
  const message = renderTemplate(eventType, { ...payload, siteUrl, to });
  if (!message) return successResponse({ skipped: true }, "No template for this event");

  const serviceUrl = Deno.env.get("EMAIL_SERVICE_URL");
  const serviceToken = Deno.env.get("EMAIL_SERVICE_TOKEN");

  if (!serviceUrl || !serviceToken) {
    // Transport not wired up yet. Fail loudly rather than silently swallowing mail —
    // /notifications will retry, and the queue makes the backlog visible in admin.
    console.error("EMAIL_SERVICE_URL / EMAIL_SERVICE_TOKEN not configured", {
      eventType,
      to,
    });
    return errorResponse("Email transport is not configured", null, 503);
  }

  const res = await fetch(`${serviceUrl.replace(/\/$/, "")}/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceToken}`,
    },
    body: JSON.stringify({ to, ...message }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("email service rejected message", res.status, detail);
    return errorResponse("Email transport failed", null, 502);
  }

  return successResponse({ sent: true }, "Email sent");
});
