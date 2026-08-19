// /roles — dynamic admin roles & permissions. Only a Super Admin may create, edit or
// assign roles — this is what lets the store add new staff roles later without any
// code change. The console UI itself stays one monolithic design for every user;
// it just reads `permissions` to decide what to render, per the standing product rule.
// GET    /roles                  list all roles (super admin only)
// POST   /roles                  create a role
// PUT    /roles/:id              update a role's name/permissions
// DELETE /roles/:id              delete a role (fails if any profile still references it)
// POST   /roles/assign           { profileId, roleId | null } assign/remove a profile's role
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

  const caller = await getCallerFromRequest(req);
  if (!caller?.isSuperAdmin) {
    return errorResponse("Only a Super Admin can manage roles", null, 403);
  }

  try {
    if (req.method === "GET" && sub === "permissions") {
      // The permission vocabulary lives in the database so the Roles screen never
      // hardcodes it — adding a capability is a data change.
      const { data, error } = await db
        .from("permission_catalog")
        .select("key, label, description")
        .order("sort_order");
      if (error) return errorResponse("Failed to list permissions", error.message, 500);
      return successResponse(data, "Permissions fetched");
    }

    if (req.method === "GET" && !sub) {
      const { data, error } = await db.from("admin_roles").select("*").order("created_at");
      if (error) return errorResponse("Failed to list roles", error.message, 500);
      return successResponse(data, "Roles fetched");
    }

    if (req.method === "POST" && sub === "assign") {
      const { profileId, roleId } = await req.json();
      if (!profileId) return errorResponse("profileId required", null, 400);
      const { data, error } = await db
        .from("profiles")
        .update({ admin_role_id: roleId ?? null, role: roleId ? "staff" : "customer" })
        .eq("id", profileId)
        .select()
        .single();
      if (error) return errorResponse("Failed to assign role", error.message, 400);
      return successResponse(data, "Role assigned");
    }

    if (req.method === "POST" && !sub) {
      const body = await req.json();
      const { data, error } = await db.from("admin_roles").insert(body).select().single();
      if (error) return errorResponse("Failed to create role", error.message, 400);
      return successResponse(data, "Role created", {}, 201);
    }

    if ((req.method === "PUT" || req.method === "PATCH") && sub && sub !== "assign") {
      const body = await req.json();
      const { data, error } = await db
        .from("admin_roles")
        .update(body)
        .eq("id", sub)
        .select()
        .single();
      if (error) return errorResponse("Failed to update role", error.message, 400);
      return successResponse(data, "Role updated");
    }

    if (req.method === "DELETE" && sub) {
      const { error } = await db.from("admin_roles").delete().eq("id", sub);
      if (error) return errorResponse("Failed to delete role — check no one is assigned to it", error.message, 400);
      return successResponse({}, "Role deleted");
    }

    return errorResponse("Not found", null, 404);
  } catch (e) {
    return errorResponse("Unexpected error", String(e), 500);
  }
});
