// /notifications — drains the notification_events queue (flow.md §7).
//
// POST /notifications/dispatch   process pending events (called by pg_cron / manually)
// GET  /notifications            admin view of the queue (orders.manage)
//
// Notifications are consequences of business events, not side effects of a handler:
// a state change writes a durable row, and this function delivers it with retries.
import { handleOptions } from "../_shared/cors.ts";
import { successResponse, errorResponse } from "../_shared/response.ts";
import { serviceClient } from "../_shared/db.ts";
import { getCallerFromRequest, can, isServiceRole } from "../_shared/auth.ts";
import { getSettings, num } from "../_shared/settings.ts";

const BATCH_SIZE = 25;

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  const url = new URL(req.url);
  const segments = url.pathname.replace(/^\/+|\/+$/g, "").split("/");
  const sub = segments[1] || null;
  const db = serviceClient();

  try {
    if (req.method === "POST" && sub === "dispatch") {
      // Called by pg_cron with the service-role key, or manually by an admin.
      if (!isServiceRole(req)) {
        const caller = await getCallerFromRequest(req);
        if (!can(caller, "orders.manage")) return errorResponse("Not authorized", null, 403);
      }
      return await dispatchPending(db);
    }

    if (req.method === "GET") {
      const caller = await getCallerFromRequest(req);
      if (!can(caller, "orders.manage")) return errorResponse("Not authorized", null, 403);

      const status = url.searchParams.get("status");
      let query = db
        .from("notification_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (status) query = query.eq("status", status);

      const { data, error } = await query;
      if (error) return errorResponse("Could not load notifications", error.message, 500);
      return successResponse(data, "Notifications fetched");
    }

    return errorResponse("Not found", null, 404);
  } catch (e) {
    console.error("notifications error", e);
    return errorResponse("Something went wrong", null, 500);
  }
});

async function dispatchPending(db: ReturnType<typeof serviceClient>) {
  const settings = await getSettings(db, ["notification_max_attempts"]);
  const maxAttempts = num(settings.notification_max_attempts, 5);

  const { data: pending, error } = await db
    .from("notification_events")
    .select("*")
    .in("status", ["pending", "failed"])
    .lte("next_attempt_at", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) return errorResponse("Could not read the queue", error.message, 500);

  let sent = 0;
  let failed = 0;

  for (const event of pending ?? []) {
    const attempts = event.attempts + 1;
    try {
      const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          eventType: event.event_type,
          to: event.recipient_email,
          payload: event.payload,
        }),
      });

      if (!res.ok) throw new Error(`transport responded ${res.status}`);

      await db
        .from("notification_events")
        .update({ status: "sent", attempts, sent_at: new Date().toISOString(), last_error: null })
        .eq("id", event.id);
      sent++;
    } catch (e) {
      // Exponential backoff: 1, 2, 4, 8… minutes, then give up and mark dead.
      const backoffMinutes = Math.pow(2, attempts - 1);
      await db
        .from("notification_events")
        .update({
          status: attempts >= maxAttempts ? "dead" : "failed",
          attempts,
          last_error: String(e),
          next_attempt_at: new Date(Date.now() + backoffMinutes * 60_000).toISOString(),
        })
        .eq("id", event.id);
      failed++;
    }
  }

  return successResponse({ processed: pending?.length ?? 0, sent, failed }, "Queue drained");
}
