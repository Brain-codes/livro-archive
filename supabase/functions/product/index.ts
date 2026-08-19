// /product — resource-based Edge Function per the Supabase architecture rule.
// GET    /product            list (filters: category, q, featured, page, pageSize)
// GET    /product/:idOrSlug  single product with variants, images, bundles
// POST   /product            create (admin/staff)
// PUT    /product/:id        update (admin/staff)
// DELETE /product/:id        archive, soft delete (admin/staff)
import { handleOptions } from "../_shared/cors.ts";
import { successResponse, errorResponse } from "../_shared/response.ts";
import { serviceClient } from "../_shared/db.ts";
import { getCallerFromRequest, can } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  const url = new URL(req.url);
  const segments = url.pathname.replace(/^\/+|\/+$/g, "").split("/");
  // segments[0] === "product"; segments[1] is the optional id/slug
  const id = segments[1] || null;
  const db = serviceClient();

  try {
    if (req.method === "GET" && !id) return await listProducts(db, url);
    if (req.method === "GET" && id) return await getProduct(db, id);

    const caller = await getCallerFromRequest(req);
    if (!can(caller, "products.manage")) {
      return errorResponse("Not authorized", null, 403);
    }

    if (req.method === "POST") return await createProduct(db, req);
    if (req.method === "PUT" || req.method === "PATCH") {
      if (!id) return errorResponse("Product id required", null, 400);
      return await updateProduct(db, id, req);
    }
    if (req.method === "DELETE") {
      if (!id) return errorResponse("Product id required", null, 400);
      return await archiveProduct(db, id);
    }

    return errorResponse("Method not allowed", null, 405);
  } catch (e) {
    return errorResponse("Unexpected error", String(e), 500);
  }
});

async function listProducts(db: ReturnType<typeof serviceClient>, url: URL) {
  const category = url.searchParams.get("category");
  const q = url.searchParams.get("q");
  const featured = url.searchParams.get("featured");
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const pageSize = Math.min(
    60,
    Math.max(1, Number(url.searchParams.get("pageSize") ?? "24")),
  );
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = db
    .from("products")
    .select(
      "id, slug, title, subtitle, author, base_price, compare_at_price, currency, stock_quantity, status, is_featured, category_id, product_images(url, alt, sort_order)",
      { count: "exact" },
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (category) query = query.eq("category_id", category);
  if (featured === "true") query = query.eq("is_featured", true);
  if (q) query = query.textSearch("search_vector", q, { type: "websearch" });

  const { data, error, count } = await query;
  if (error) return errorResponse("Failed to list products", error.message, 500);

  return successResponse(data, "Products fetched", {
    page,
    pageSize,
    total: count ?? 0,
  });
}

async function getProduct(db: ReturnType<typeof serviceClient>, idOrSlug: string) {
  const isUuid = /^[0-9a-f-]{36}$/i.test(idOrSlug);
  const { data: product, error } = await db
    .from("products")
    .select(
      `*, product_images(id, url, alt, sort_order),
       product_variants(id, name, sku, price_override, stock_quantity, sort_order),
       bundles!bundles_primary_product_id_fkey(
         id, name, description, is_active,
         bundle_items(id, product_id, variant_id, quantity, price_override,
           products(id, slug, title, base_price, product_images(url, sort_order)))
       )`,
    )
    .eq(isUuid ? "id" : "slug", idOrSlug)
    .eq("status", "active")
    .single();

  if (error || !product) return errorResponse("Product not found", null, 404);
  return successResponse(product, "Product fetched");
}

async function createProduct(db: ReturnType<typeof serviceClient>, req: Request) {
  const body = await req.json();
  const { data, error } = await db.from("products").insert(body).select().single();
  if (error) return errorResponse("Failed to create product", error.message, 400);
  return successResponse(data, "Product created", {}, 201);
}

async function updateProduct(
  db: ReturnType<typeof serviceClient>,
  id: string,
  req: Request,
) {
  const body = await req.json();
  const { data, error } = await db
    .from("products")
    .update(body)
    .eq("id", id)
    .select()
    .single();
  if (error) return errorResponse("Failed to update product", error.message, 400);
  return successResponse(data, "Product updated");
}

async function archiveProduct(db: ReturnType<typeof serviceClient>, id: string) {
  const { error } = await db
    .from("products")
    .update({ status: "archived" })
    .eq("id", id);
  if (error) return errorResponse("Failed to archive product", error.message, 400);
  return successResponse({}, "Product archived");
}
