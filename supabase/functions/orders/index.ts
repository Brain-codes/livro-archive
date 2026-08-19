// /orders — router only. Handlers live in ./handlers per the Supabase architecture rule.
//
// POST   /orders            checkout (public — guest-friendly)
// GET    /orders/mine       signed-in customer's own orders
// GET    /orders            admin list      (orders.manage)
// GET    /orders/:id        admin detail    (orders.manage)
// PATCH  /orders/:id        admin update    (orders.manage)
import { handleOptions } from "../_shared/cors.ts";
import { errorResponse } from "../_shared/response.ts";
import { serviceClient } from "../_shared/db.ts";
import { getCallerFromRequest, can } from "../_shared/auth.ts";
import { createOrder } from "./handlers/createOrder.ts";
import { updateOrder } from "./handlers/updateOrder.ts";
import { listOrders, getOrder, listMyOrders } from "./handlers/readOrders.ts";

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  const url = new URL(req.url);
  const segments = url.pathname.replace(/^\/+|\/+$/g, "").split("/");
  const sub = segments[1] || null;
  const db = serviceClient();
  const caller = await getCallerFromRequest(req);

  try {
    if (req.method === "POST" && !sub) {
      return await createOrder(db, req, caller?.id ?? null);
    }

    if (req.method === "GET" && sub === "mine") {
      if (!caller?.email) return errorResponse("Sign in required", null, 401);
      return await listMyOrders(db, caller.email);
    }

    if (!can(caller, "orders.manage")) {
      return errorResponse("Not authorized", null, 403);
    }

    if (req.method === "GET" && !sub) return await listOrders(db, url);
    if (req.method === "GET" && sub) return await getOrder(db, sub);
    if ((req.method === "PATCH" || req.method === "PUT") && sub) {
      return await updateOrder(db, sub, req, caller!);
    }

    return errorResponse("Method not allowed", null, 405);
  } catch (e) {
    console.error("orders error", e);
    return errorResponse("Something went wrong", null, 500);
  }
});
