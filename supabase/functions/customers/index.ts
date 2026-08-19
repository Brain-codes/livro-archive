// /customers — the people who buy, including guests who never made an account.
//
// GET /customers            list, aggregated from orders + profiles
// GET /customers/:email     one customer's full order history
//
// Customers are keyed by email rather than profile_id, because a guest is still a
// customer (flow.md §5) — they just don't have a login.
import { handleOptions } from "../_shared/cors.ts";
import { successResponse, errorResponse } from "../_shared/response.ts";
import { serviceClient } from "../_shared/db.ts";
import { getCallerFromRequest, can } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  const url = new URL(req.url);
  const segments = url.pathname.replace(/^\/+|\/+$/g, "").split("/");
  const email = segments[1] ? decodeURIComponent(segments[1]) : null;
  const db = serviceClient();

  const caller = await getCallerFromRequest(req);
  if (!can(caller, "customers.manage")) return errorResponse("Not authorized", null, 403);

  try {
    if (req.method === "GET" && email) {
      const { data: orders } = await db
        .from("orders")
        .select("*")
        .eq("contact_email", email.toLowerCase())
        .order("created_at", { ascending: false });

      const { data: profile } = await db
        .from("profiles")
        .select("id, email, full_name, phone, created_at")
        .eq("email", email.toLowerCase())
        .maybeSingle();

      if (!orders?.length && !profile) {
        return errorResponse("Customer not found", null, 404);
      }

      return successResponse({ email, profile, orders: orders ?? [] }, "Customer fetched");
    }

    if (req.method === "GET") {
      const q = url.searchParams.get("q");

      let query = db
        .from("orders")
        .select("contact_email, contact_phone, shipping_address, total, status, created_at, profile_id")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (q) query = query.or(`contact_email.ilike.%${q}%,contact_phone.ilike.%${q}%`);

      const { data: orders, error } = await query;
      if (error) return errorResponse("Could not load customers", error.message, 500);

      // Roll orders up per email — one row per human, guest or registered.
      const byEmail = new Map<string, {
        email: string;
        name: string | null;
        phone: string | null;
        orders: number;
        spent: number;
        hasAccount: boolean;
        lastOrderAt: string;
      }>();

      for (const o of orders ?? []) {
        const key = o.contact_email;
        const address = (o.shipping_address ?? {}) as Record<string, unknown>;
        const existing = byEmail.get(key);
        const counts = ["paid", "processing", "ready_for_dispatch", "shipped", "out_for_delivery", "delivered"]
          .includes(o.status);

        if (existing) {
          existing.orders += 1;
          if (counts) existing.spent += Number(o.total);
          existing.hasAccount ||= Boolean(o.profile_id);
        } else {
          byEmail.set(key, {
            email: key,
            name: (address.full_name as string) ?? null,
            phone: o.contact_phone,
            orders: 1,
            spent: counts ? Number(o.total) : 0,
            hasAccount: Boolean(o.profile_id),
            lastOrderAt: o.created_at,
          });
        }
      }

      const customers = [...byEmail.values()].sort(
        (a, b) => new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime(),
      );

      return successResponse(customers, "Customers fetched", { total: customers.length });
    }

    return errorResponse("Method not allowed", null, 405);
  } catch (e) {
    console.error("customers error", e);
    return errorResponse("Something went wrong", null, 500);
  }
});
