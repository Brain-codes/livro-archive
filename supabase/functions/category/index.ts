// /category — GET list, GET :id, POST/PUT/DELETE admin-only
import { handleOptions } from "../_shared/cors.ts";
import { successResponse, errorResponse } from "../_shared/response.ts";
import { serviceClient } from "../_shared/db.ts";
import { getCallerFromRequest, can } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  const url = new URL(req.url);
  const segments = url.pathname.replace(/^\/+|\/+$/g, "").split("/");
  const id = segments[1] || null;
  const db = serviceClient();

  try {
    if (req.method === "GET" && !id) {
      const { data, error } = await db
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) return errorResponse("Failed to list categories", error.message, 500);
      return successResponse(data, "Categories fetched");
    }

    if (req.method === "GET" && id) {
      const isUuid = /^[0-9a-f-]{36}$/i.test(id);
      const { data, error } = await db
        .from("categories")
        .select("*")
        .eq(isUuid ? "id" : "slug", id)
        .single();
      if (error || !data) return errorResponse("Category not found", null, 404);
      return successResponse(data, "Category fetched");
    }

    const caller = await getCallerFromRequest(req);
    if (!can(caller, "products.manage")) {
      return errorResponse("Not authorized", null, 403);
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { data, error } = await db.from("categories").insert(body).select().single();
      if (error) return errorResponse("Failed to create category", error.message, 400);
      return successResponse(data, "Category created", {}, 201);
    }

    if (req.method === "PUT" || req.method === "PATCH") {
      if (!id) return errorResponse("Category id required", null, 400);
      const body = await req.json();
      const { data, error } = await db
        .from("categories")
        .update(body)
        .eq("id", id)
        .select()
        .single();
      if (error) return errorResponse("Failed to update category", error.message, 400);
      return successResponse(data, "Category updated");
    }

    if (req.method === "DELETE") {
      if (!id) return errorResponse("Category id required", null, 400);
      const { error } = await db.from("categories").delete().eq("id", id);
      if (error) return errorResponse("Failed to delete category", error.message, 400);
      return successResponse({}, "Category deleted");
    }

    return errorResponse("Method not allowed", null, 405);
  } catch (e) {
    return errorResponse("Unexpected error", String(e), 500);
  }
});
