// /inventory — stock as an operational concern, not a product field (flow.md §3).
//
// GET   /inventory                 every SKU with on-hand / reserved / available
// GET   /inventory/low             only SKUs at or below the low-stock threshold
// GET   /inventory/movements       audit trail of every stock change
// POST  /inventory/adjust          { product_id, variant_id?, delta, note }
import { handleOptions } from "../_shared/cors.ts";
import { successResponse, errorResponse } from "../_shared/response.ts";
import { serviceClient } from "../_shared/db.ts";
import { getCallerFromRequest, can } from "../_shared/auth.ts";
import { getSettings, num } from "../_shared/settings.ts";

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  const url = new URL(req.url);
  const segments = url.pathname.replace(/^\/+|\/+$/g, "").split("/");
  const sub = segments[1] || null;
  const db = serviceClient();

  const caller = await getCallerFromRequest(req);
  if (!can(caller, "inventory.manage")) return errorResponse("Not authorized", null, 403);

  try {
    if (req.method === "GET" && sub === "movements") {
      const productId = url.searchParams.get("product");
      let query = db
        .from("inventory_movements")
        .select("*, products(title)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (productId) query = query.eq("product_id", productId);

      const { data, error } = await query;
      if (error) return errorResponse("Could not load movements", error.message, 500);
      return successResponse(data, "Movements fetched");
    }

    if (req.method === "GET") {
      const settings = await getSettings(db, ["low_stock_threshold"]);
      const threshold = num(settings.low_stock_threshold, 5);

      let query = db
        .from("products")
        .select(
          "id, title, slug, sku, stock_quantity, reserved_quantity, available_quantity, status, " +
            "product_variants(id, name, sku, stock_quantity, reserved_quantity, available_quantity)",
        )
        .neq("status", "archived")
        .order("title");

      if (sub === "low") query = query.lte("available_quantity", threshold);

      const { data, error } = await query;
      if (error) return errorResponse("Could not load inventory", error.message, 500);
      return successResponse(data, "Inventory fetched", { lowStockThreshold: threshold });
    }

    if (req.method === "POST" && sub === "adjust") {
      const { product_id, variant_id, delta, note } = await req.json();
      if (!product_id || !Number.isInteger(delta) || delta === 0) {
        return errorResponse("product_id and a non-zero whole-number delta are required", null, 400);
      }

      const { error } = await db.rpc("adjust_stock", {
        p_product_id: product_id,
        p_variant_id: variant_id ?? null,
        p_delta: delta,
        p_note: note ?? null,
        p_actor: caller!.id,
      });
      if (error) return errorResponse("Could not adjust stock", error.message, 400);

      return successResponse({}, "Stock adjusted");
    }

    return errorResponse("Not found", null, 404);
  } catch (e) {
    console.error("inventory error", e);
    return errorResponse("Something went wrong", null, 500);
  }
});
