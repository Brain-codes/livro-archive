// /cart — server-side cart snapshot. The client (Zustand) owns the live guest cart;
// this resource is used to sync a cart before checkout so it can survive across devices
// and be recovered if abandoned.
// GET    /cart?token=xxx            fetch cart + items (or by authed user)
// POST   /cart                      upsert cart snapshot { token?, items: [...] }
// DELETE /cart/items/:itemId        remove one item
import { handleOptions } from "../_shared/cors.ts";
import { successResponse, errorResponse } from "../_shared/response.ts";
import { serviceClient } from "../_shared/db.ts";
import { getCallerFromRequest } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  const url = new URL(req.url);
  const segments = url.pathname.replace(/^\/+|\/+$/g, "").split("/");
  const db = serviceClient();
  const caller = await getCallerFromRequest(req);

  try {
    if (req.method === "GET") return await getCart(db, url, caller?.id ?? null);
    if (req.method === "POST") return await upsertCart(db, req, caller?.id ?? null);
    if (req.method === "DELETE" && segments[1] === "items" && segments[2]) {
      return await removeItem(db, segments[2]);
    }
    return errorResponse("Method not allowed", null, 405);
  } catch (e) {
    return errorResponse("Unexpected error", String(e), 500);
  }
});

async function findOrCreateCart(
  db: ReturnType<typeof serviceClient>,
  token: string | null,
  profileId: string | null,
) {
  let query = db.from("carts").select("*").eq("status", "active");
  query = profileId ? query.eq("profile_id", profileId) : query.eq("session_token", token);
  const { data: existing } = await query.maybeSingle();
  if (existing) return existing;

  const { data, error } = await db
    .from("carts")
    .insert({ profile_id: profileId, session_token: profileId ? null : token })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function getCart(
  db: ReturnType<typeof serviceClient>,
  url: URL,
  profileId: string | null,
) {
  const token = url.searchParams.get("token");
  if (!token && !profileId) return errorResponse("token required", null, 400);

  const cart = await findOrCreateCart(db, token, profileId);
  const { data: items, error } = await db
    .from("cart_items")
    .select(
      "id, product_id, variant_id, bundle_id, quantity, unit_price, products(title, slug, product_images(url, sort_order))",
    )
    .eq("cart_id", cart.id);
  if (error) return errorResponse("Failed to fetch cart", error.message, 500);

  return successResponse({ cart, items }, "Cart fetched");
}

async function upsertCart(
  db: ReturnType<typeof serviceClient>,
  req: Request,
  profileId: string | null,
) {
  const body = await req.json();
  const token: string | null = body.token ?? null;
  const items: Array<{
    product_id: string;
    variant_id?: string | null;
    bundle_id?: string | null;
    quantity: number;
    unit_price: number;
  }> = body.items ?? [];

  if (!token && !profileId) return errorResponse("token required", null, 400);

  const cart = await findOrCreateCart(db, token, profileId);

  await db.from("cart_items").delete().eq("cart_id", cart.id);
  if (items.length > 0) {
    const rows = items.map((it) => ({ ...it, cart_id: cart.id }));
    const { error } = await db.from("cart_items").insert(rows);
    if (error) return errorResponse("Failed to sync cart items", error.message, 400);
  }

  await db.from("carts").update({ updated_at: new Date().toISOString() }).eq("id", cart.id);

  return successResponse({ cart }, "Cart synced");
}

async function removeItem(db: ReturnType<typeof serviceClient>, itemId: string) {
  const { error } = await db.from("cart_items").delete().eq("id", itemId);
  if (error) return errorResponse("Failed to remove item", error.message, 400);
  return successResponse({}, "Item removed");
}
