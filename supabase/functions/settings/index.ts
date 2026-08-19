// /settings — generic store configuration, editable entirely from the admin Settings
// page. Nothing store-wide (currency, shipping fee, thresholds, copy, social links)
// should require a code or database change — it should be editable here instead.
// GET   /settings              public subset (is_public = true), no auth
// GET   /settings/all          full list, requires 'settings.manage'
// PATCH /settings/:key         update one setting's value, requires 'settings.manage'
import { handleOptions } from "../_shared/cors.ts";
import { successResponse, errorResponse } from "../_shared/response.ts";
import { serviceClient } from "../_shared/db.ts";
import { getCallerFromRequest, can } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  const url = new URL(req.url);
  const segments = url.pathname.replace(/^\/+|\/+$/g, "").split("/");
  const sub = segments[1] || null;
  const db = serviceClient();

  try {
    if (req.method === "GET" && !sub) return await getPublicSettings(db);

    if (req.method === "GET" && sub === "all") {
      const caller = await getCallerFromRequest(req);
      if (!can(caller, "settings.manage")) return errorResponse("Not authorized", null, 403);
      const { data, error } = await db.from("settings").select("*").order("category");
      if (error) return errorResponse("Failed to fetch settings", error.message, 500);
      return successResponse(data, "Settings fetched");
    }

    if ((req.method === "PATCH" || req.method === "PUT") && sub && sub !== "all") {
      const caller = await getCallerFromRequest(req);
      if (!can(caller, "settings.manage")) return errorResponse("Not authorized", null, 403);
      const { value } = await req.json();
      const { data, error } = await db
        .from("settings")
        .update({ value, updated_at: new Date().toISOString(), updated_by: caller!.id })
        .eq("key", sub)
        .select()
        .single();
      if (error) return errorResponse("Failed to update setting", error.message, 400);
      return successResponse(data, "Setting updated");
    }

    return errorResponse("Not found", null, 404);
  } catch (e) {
    return errorResponse("Unexpected error", String(e), 500);
  }
});

async function getPublicSettings(db: ReturnType<typeof serviceClient>) {
  const { data, error } = await db
    .from("settings")
    .select("key, value, category")
    .eq("is_public", true);
  if (error) return errorResponse("Failed to fetch settings", error.message, 500);

  const map = Object.fromEntries((data ?? []).map((s) => [s.key, s.value]));
  return successResponse(map, "Public settings fetched");
}
