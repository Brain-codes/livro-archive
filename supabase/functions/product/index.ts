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
import { getSettings, num } from "../_shared/settings.ts";

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

    // /product/images — attach or remove cover art for a product.
    if (req.method === "POST" && id === "images") {
      const body = await req.json();
      if (!body.product_id || !body.url) {
        return errorResponse("product_id and url are required", null, 400);
      }
      const { data, error } = await db
        .from("product_images")
        .insert({
          product_id: body.product_id,
          url: body.url,
          alt: body.alt ?? null,
          sort_order: body.sort_order ?? 0,
        })
        .select()
        .single();
      if (error) return errorResponse("Failed to attach image", error.message, 400);
      return successResponse(data, "Image attached", {}, 201);
    }

    if (req.method === "DELETE" && segments[1] === "images" && segments[2]) {
      const { error } = await db.from("product_images").delete().eq("id", segments[2]);
      if (error) return errorResponse("Failed to remove image", error.message, 400);
      return successResponse({}, "Image removed");
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

  const inStockOnly = url.searchParams.get("inStock") === "true";
  const minPrice = url.searchParams.get("minPrice");
  const maxPrice = url.searchParams.get("maxPrice");
  const productType = url.searchParams.get("type");
  const sort = url.searchParams.get("sort") ?? "newest";

  let query = db
    .from("products")
    .select(
      "id, slug, title, subtitle, author, base_price, compare_at_price, currency, " +
        "stock_quantity, available_quantity, status, is_featured, category_id, product_type, " +
        "product_images(url, alt, sort_order)",
      { count: "exact" },
    )
    .eq("status", "active")
    .range(from, to);

  if (category) query = query.eq("category_id", category);
  if (featured === "true") query = query.eq("is_featured", true);
  if (productType) query = query.eq("product_type", productType);
  if (inStockOnly) query = query.gt("available_quantity", 0);
  if (minPrice) query = query.gte("base_price", Number(minPrice));
  if (maxPrice) query = query.lte("base_price", Number(maxPrice));
  if (q) query = query.textSearch("search_vector", q, { type: "websearch" });

  const SORTS: Record<string, { column: string; ascending: boolean }> = {
    newest: { column: "created_at", ascending: false },
    "price-asc": { column: "base_price", ascending: true },
    "price-desc": { column: "base_price", ascending: false },
    title: { column: "title", ascending: true },
  };
  const order = SORTS[sort] ?? SORTS.newest;
  query = query.order(order.column, { ascending: order.ascending });

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
       product_variants(id, name, sku, price_override, stock_quantity, available_quantity, sort_order),
       bundles!bundles_primary_product_id_fkey(
         id, name, description, is_active,
         bundle_items(id, product_id, variant_id, quantity, price_override,
           products(id, slug, title, base_price, available_quantity, product_images(url, sort_order)))
       )`,
    )
    .eq(isUuid ? "id" : "slug", idOrSlug)
    .eq("status", "active")
    .single();

  if (error || !product) return errorResponse("Product not found", null, 404);

  // Related products (flow.md §4, mechanism 1): curated links first, then a
  // same-category fallback so a product page is never a dead end.
  const settings = await getSettings(db, ["related_products_count"]);
  const limit = num(settings.related_products_count, 4);

  const { data: curated } = await db
    .from("related_products")
    .select(
      "sort_order, related:products!related_products_related_product_id_fkey" +
        "(id, slug, title, author, base_price, compare_at_price, currency, " +
        "available_quantity, stock_quantity, status, product_images(url, alt, sort_order))",
    )
    .eq("product_id", product.id)
    .order("sort_order")
    .limit(limit);

  let related = (curated ?? [])
    .map((r) => r.related)
    .filter((p) => (p as { status?: string } | null)?.status === "active");

  if (related.length < limit && product.category_id) {
    const { data: fallback } = await db
      .from("products")
      .select(
        "id, slug, title, author, base_price, compare_at_price, currency, " +
          "available_quantity, stock_quantity, status, product_images(url, alt, sort_order)",
      )
      .eq("category_id", product.category_id)
      .eq("status", "active")
      .neq("id", product.id)
      .limit(limit * 2);

    const seen = new Set(related.map((p) => (p as { id: string }).id));
    for (const candidate of fallback ?? []) {
      if (related.length >= limit) break;
      if (seen.has(candidate.id)) continue;
      related.push(candidate);
      seen.add(candidate.id);
    }
  }

  related = related.slice(0, limit);

  return successResponse({ ...product, related_products: related }, "Product fetched");
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
