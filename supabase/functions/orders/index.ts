// /orders — checkout (guest-friendly), admin order management.
// POST   /orders             create order from cart items (public — this IS checkout)
// GET    /orders/mine        signed-in user's orders (matched by email)
// GET    /orders             admin/staff list, filters: status, page, pageSize
// GET    /orders/:id         admin/staff single order with items + status history
// PATCH  /orders/:id         admin/staff update status, appends order_status_events,
//                             fires a notification via /send-email
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
  const caller = await getCallerFromRequest(req);

  try {
    if (req.method === "POST" && !sub) return await createOrder(db, req, caller?.id ?? null);

    if (req.method === "GET" && sub === "mine") {
      if (!caller?.email) return errorResponse("Sign in required", null, 401);
      return await listOrdersByEmail(db, caller.email);
    }

    if (!can(caller, "orders.manage")) {
      return errorResponse("Not authorized", null, 403);
    }

    if (req.method === "GET" && !sub) return await listOrders(db, url);
    if (req.method === "GET" && sub) return await getOrder(db, sub);
    if ((req.method === "PATCH" || req.method === "PUT") && sub) {
      return await updateOrderStatus(db, sub, req, caller!.id);
    }

    return errorResponse("Method not allowed", null, 405);
  } catch (e) {
    return errorResponse("Unexpected error", String(e), 500);
  }
});

function generateOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `LA-${date}-${rand}`;
}

async function createOrder(
  db: ReturnType<typeof serviceClient>,
  req: Request,
  profileId: string | null,
) {
  const body = await req.json();
  const {
    contact_email,
    contact_phone,
    shipping_address,
    items,
  }: {
    contact_email: string;
    contact_phone: string;
    shipping_address: Record<string, unknown>;
    items: Array<{
      product_id: string;
      variant_id?: string | null;
      bundle_id?: string | null;
      quantity: number;
    }>;
  } = body;

  if (!contact_email || !contact_phone || !shipping_address || !items?.length) {
    return errorResponse("Missing required checkout fields", null, 400);
  }

  // Price + stock authoritatively from the DB — never trust client-sent prices.
  let subtotal = 0;
  const orderItems: Array<Record<string, unknown>> = [];

  for (const item of items) {
    const { data: product, error } = await db
      .from("products")
      .select("id, title, base_price, stock_quantity")
      .eq("id", item.product_id)
      .single();
    if (error || !product) return errorResponse(`Product not found: ${item.product_id}`, null, 400);

    let unitPrice = Number(product.base_price);
    let availableStock = product.stock_quantity;

    if (item.variant_id) {
      const { data: variant } = await db
        .from("product_variants")
        .select("price_override, stock_quantity")
        .eq("id", item.variant_id)
        .single();
      if (variant) {
        if (variant.price_override != null) unitPrice = Number(variant.price_override);
        availableStock = variant.stock_quantity;
      }
    }

    if (item.bundle_id) {
      const { data: bundleItem } = await db
        .from("bundle_items")
        .select("price_override")
        .eq("bundle_id", item.bundle_id)
        .eq("product_id", item.product_id)
        .maybeSingle();
      if (bundleItem?.price_override != null) unitPrice = Number(bundleItem.price_override);
    }

    if (availableStock < item.quantity) {
      return errorResponse(`Insufficient stock for ${product.title}`, null, 409);
    }

    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;

    orderItems.push({
      product_id: item.product_id,
      variant_id: item.variant_id ?? null,
      bundle_id: item.bundle_id ?? null,
      title_snapshot: product.title,
      quantity: item.quantity,
      unit_price: unitPrice,
      line_total: lineTotal,
    });
  }

  const total = subtotal; // shipping/discount added in a later pass

  const { data: order, error: orderError } = await db
    .from("orders")
    .insert({
      order_number: generateOrderNumber(),
      profile_id: profileId,
      contact_email,
      contact_phone,
      shipping_address,
      status: "pending_payment",
      subtotal,
      total,
    })
    .select()
    .single();
  if (orderError) return errorResponse("Failed to create order", orderError.message, 500);

  const rows = orderItems.map((it) => ({ ...it, order_id: order.id }));
  const { error: itemsError } = await db.from("order_items").insert(rows);
  if (itemsError) return errorResponse("Failed to create order items", itemsError.message, 500);

  await db.from("order_status_events").insert({
    order_id: order.id,
    status: "pending_payment",
    note: "Order created, awaiting payment",
  });

  // Decrement stock immediately to hold inventory through payment (v1: optimistic hold).
  for (const item of items) {
    if (item.variant_id) {
      const { data: variant } = await db
        .from("product_variants")
        .select("stock_quantity")
        .eq("id", item.variant_id)
        .single();
      if (variant) {
        await db
          .from("product_variants")
          .update({ stock_quantity: Math.max(0, variant.stock_quantity - item.quantity) })
          .eq("id", item.variant_id);
      }
    } else {
      const { data: product } = await db
        .from("products")
        .select("stock_quantity")
        .eq("id", item.product_id)
        .single();
      if (product) {
        await db
          .from("products")
          .update({ stock_quantity: Math.max(0, product.stock_quantity - item.quantity) })
          .eq("id", item.product_id);
      }
    }
  }

  return successResponse(order, "Order created", {}, 201);
}

async function listOrdersByEmail(db: ReturnType<typeof serviceClient>, email: string) {
  const { data, error } = await db
    .from("orders")
    .select("id, order_number, status, total, currency, created_at")
    .eq("contact_email", email)
    .order("created_at", { ascending: false });
  if (error) return errorResponse("Failed to fetch orders", error.message, 500);
  return successResponse(data, "Orders fetched");
}

async function listOrders(db: ReturnType<typeof serviceClient>, url: URL) {
  const status = url.searchParams.get("status");
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? "25")));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = db
    .from("orders")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  if (status) query = query.eq("status", status);

  const { data, error, count } = await query;
  if (error) return errorResponse("Failed to list orders", error.message, 500);
  return successResponse(data, "Orders fetched", { page, pageSize, total: count ?? 0 });
}

async function getOrder(db: ReturnType<typeof serviceClient>, id: string) {
  const { data: order, error } = await db.from("orders").select("*").eq("id", id).single();
  if (error || !order) return errorResponse("Order not found", null, 404);

  const { data: items } = await db.from("order_items").select("*").eq("order_id", id);
  const { data: events } = await db
    .from("order_status_events")
    .select("*")
    .eq("order_id", id)
    .order("created_at", { ascending: true });

  return successResponse({ order, items, events }, "Order fetched");
}

async function updateOrderStatus(
  db: ReturnType<typeof serviceClient>,
  id: string,
  req: Request,
  adminId: string,
) {
  const { status, note } = await req.json();
  const allowed = [
    "pending_payment",
    "paid",
    "processing",
    "packed",
    "shipped",
    "out_for_delivery",
    "delivered",
    "cancelled",
    "refunded",
  ];
  if (!allowed.includes(status)) return errorResponse("Invalid status", null, 400);

  const { data: order, error } = await db
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return errorResponse("Failed to update order", error.message, 400);

  await db.from("order_status_events").insert({
    order_id: id,
    status,
    note: note ?? null,
    created_by: adminId,
  });

  // Fire-and-forget customer notification (see /send-email resource).
  try {
    await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({
        type: "order_status",
        to: order.contact_email,
        orderNumber: order.order_number,
        status,
      }),
    });
  } catch {
    // Notification failure should never block the status update itself.
  }

  return successResponse(order, "Order status updated");
}
