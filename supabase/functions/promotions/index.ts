// /promotions — the five commerce mechanisms from flow.md §4 in one resource.
//
// GET    /promotions/bundles?product=      bundles for a product (public read)
// POST   /promotions/bundles               create a bundle          (promotions.manage)
// PUT    /promotions/bundles/:id           update a bundle          (promotions.manage)
// DELETE /promotions/bundles/:id           delete a bundle          (promotions.manage)
// GET    /promotions/related?product=      related products (public read)
// POST   /promotions/related               link two products        (promotions.manage)
// DELETE /promotions/related/:id           unlink                   (promotions.manage)
// GET    /promotions/discounts             coupon codes             (promotions.manage)
// POST   /promotions/discounts             create a coupon          (promotions.manage)
import { handleOptions } from "../_shared/cors.ts";
import { successResponse, errorResponse } from "../_shared/response.ts";
import { serviceClient } from "../_shared/db.ts";
import { getCallerFromRequest, can } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  const url = new URL(req.url);
  const segments = url.pathname.replace(/^\/+|\/+$/g, "").split("/");
  const resource = segments[1] || null;
  const id = segments[2] || null;
  const db = serviceClient();

  const isRead = req.method === "GET";
  const publicRead = isRead && (resource === "bundles" || resource === "related");

  if (!publicRead) {
    const caller = await getCallerFromRequest(req);
    if (!can(caller, "promotions.manage")) return errorResponse("Not authorized", null, 403);
  }

  try {
    // ── Bundles: mechanisms 2, 3 and 4 (add-on, bundle, free item) ────────
    if (resource === "bundles") {
      if (isRead) {
        const productId = url.searchParams.get("product");
        let query = db
          .from("bundles")
          .select(
            "*, bundle_items(id, product_id, variant_id, quantity, price_override, sort_order, " +
              "products(id, slug, title, base_price, available_quantity, product_images(url, sort_order)))",
          )
          .eq("is_active", true);
        if (productId) query = query.eq("primary_product_id", productId);

        const { data, error } = await query;
        if (error) return errorResponse("Could not load bundles", error.message, 500);
        return successResponse(data, "Bundles fetched");
      }

      if (req.method === "POST") {
        const { items, ...bundle } = await req.json();
        const { data: created, error } = await db
          .from("bundles")
          .insert(bundle)
          .select()
          .single();
        if (error) return errorResponse("Could not create the bundle", error.message, 400);

        if (Array.isArray(items) && items.length > 0) {
          const { error: itemsError } = await db
            .from("bundle_items")
            .insert(items.map((i: Record<string, unknown>) => ({ ...i, bundle_id: created.id })));
          if (itemsError) {
            await db.from("bundles").delete().eq("id", created.id);
            return errorResponse("Could not add bundle items", itemsError.message, 400);
          }
        }
        return successResponse(created, "Bundle created", {}, 201);
      }

      if ((req.method === "PUT" || req.method === "PATCH") && id) {
        const { items, ...bundle } = await req.json();
        const { data, error } = await db
          .from("bundles")
          .update(bundle)
          .eq("id", id)
          .select()
          .single();
        if (error) return errorResponse("Could not update the bundle", error.message, 400);

        if (Array.isArray(items)) {
          await db.from("bundle_items").delete().eq("bundle_id", id);
          if (items.length > 0) {
            await db
              .from("bundle_items")
              .insert(items.map((i: Record<string, unknown>) => ({ ...i, bundle_id: id })));
          }
        }
        return successResponse(data, "Bundle updated");
      }

      if (req.method === "DELETE" && id) {
        const { error } = await db.from("bundles").delete().eq("id", id);
        if (error) return errorResponse("Could not delete the bundle", error.message, 400);
        return successResponse({}, "Bundle deleted");
      }
    }

    // ── Related products: mechanism 1 ─────────────────────────────────────
    if (resource === "related") {
      if (isRead) {
        const productId = url.searchParams.get("product");
        if (!productId) return errorResponse("product is required", null, 400);

        const { data, error } = await db
          .from("related_products")
          .select(
            "id, relationship, sort_order, " +
              "related:products!related_products_related_product_id_fkey" +
              "(id, slug, title, author, base_price, compare_at_price, currency, " +
              "available_quantity, stock_quantity, status, product_images(url, alt, sort_order))",
          )
          .eq("product_id", productId)
          .order("sort_order");
        if (error) return errorResponse("Could not load related products", error.message, 500);

        const active = (data ?? []).filter(
          (r) => (r.related as { status?: string } | null)?.status === "active",
        );
        return successResponse(active, "Related products fetched");
      }

      if (req.method === "POST") {
        const body = await req.json();
        const { data, error } = await db
          .from("related_products")
          .insert(body)
          .select()
          .single();
        if (error) return errorResponse("Could not link the products", error.message, 400);
        return successResponse(data, "Products linked", {}, 201);
      }

      if (req.method === "DELETE" && id) {
        const { error } = await db.from("related_products").delete().eq("id", id);
        if (error) return errorResponse("Could not unlink", error.message, 400);
        return successResponse({}, "Products unlinked");
      }
    }

    // ── Coupon codes ──────────────────────────────────────────────────────
    if (resource === "discounts") {
      if (isRead) {
        const { data, error } = await db
          .from("discounts")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) return errorResponse("Could not load discounts", error.message, 500);
        return successResponse(data, "Discounts fetched");
      }

      if (req.method === "POST") {
        const body = await req.json();
        const { data, error } = await db
          .from("discounts")
          .insert({ ...body, code: String(body.code).trim().toUpperCase() })
          .select()
          .single();
        if (error) return errorResponse("Could not create the discount", error.message, 400);
        return successResponse(data, "Discount created", {}, 201);
      }

      if (req.method === "DELETE" && id) {
        const { error } = await db.from("discounts").delete().eq("id", id);
        if (error) return errorResponse("Could not delete the discount", error.message, 400);
        return successResponse({}, "Discount deleted");
      }
    }

    return errorResponse("Not found", null, 404);
  } catch (e) {
    console.error("promotions error", e);
    return errorResponse("Something went wrong", null, 500);
  }
});
