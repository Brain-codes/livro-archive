// /auth-profile — complex signup logic that plain Supabase Auth can't do atomically:
// creates the auth user AND the matching profiles row, with pre-checks.
// POST /auth-profile/signup   { email, password, full_name, phone }
// GET  /auth-profile/check-email?email=   availability check before signup
import { handleOptions } from "../_shared/cors.ts";
import { successResponse, errorResponse } from "../_shared/response.ts";
import { serviceClient } from "../_shared/db.ts";
import { getCallerFromRequest } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  const url = new URL(req.url);
  const segments = url.pathname.replace(/^\/+|\/+$/g, "").split("/");
  const sub = segments[1] || null;
  const db = serviceClient();

  try {
    if (req.method === "GET" && sub === "me") {
      const caller = await getCallerFromRequest(req);
      if (!caller) return errorResponse("Not signed in", null, 401);
      return successResponse(caller, "Session resolved");
    }

    if (req.method === "GET" && sub === "check-email") {
      const email = url.searchParams.get("email");
      if (!email) return errorResponse("email required", null, 400);
      const { data } = await db.from("profiles").select("id").eq("email", email).maybeSingle();
      return successResponse({ available: !data }, "Checked");
    }

    if (req.method === "POST" && sub === "signup") {
      const { email, password, full_name, phone } = await req.json();
      if (!email || !password) return errorResponse("email and password required", null, 400);

      const { data: existing } = await db.from("profiles").select("id").eq("email", email).maybeSingle();
      if (existing) return errorResponse("An account with this email already exists", null, 409);

      const { data: created, error: createError } = await db.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
      });
      if (createError || !created.user) {
        return errorResponse("Failed to create account", createError?.message, 400);
      }

      const { error: profileError } = await db.from("profiles").insert({
        id: created.user.id,
        email,
        full_name: full_name ?? null,
        phone: phone ?? null,
      });
      if (profileError) {
        await db.auth.admin.deleteUser(created.user.id);
        return errorResponse("Failed to create profile", profileError.message, 500);
      }

      return successResponse({ id: created.user.id, email }, "Account created", {}, 201);
    }

    return errorResponse("Not found", null, 404);
  } catch (e) {
    return errorResponse("Unexpected error", String(e), 500);
  }
});
