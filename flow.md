# Livro Archive — Product & System Flow

## What this is
A books + stationery/education-supplies e-commerce platform. Guest checkout is
first-class — nobody has to create an account to buy. Optional accounts exist for
order history and faster repeat checkout.

## Core shopper flow

1. **Browse** — home → shop grid / category / search. Filters: category, price, in
   stock, format (paperback/hardcover/stationery).
2. **Product page** — price, stock, description, images, and a bundle/upsell module
   ("Complete the set — add notebook + marker for ₦X, save ₦Y"). One tap adds the whole
   bundle as grouped cart lines.
3. **Cart** — persisted client-side (Zustand + localStorage) for guests; merged into a
   `carts` row server-side once checkout starts, so an abandoned cart can still be
   recovered by email later.
4. **Checkout** — guest by default (email + shipping address + phone), or "sign in" to
   prefill from a saved address. Payment via Paystack (card, bank transfer, USSD).
5. **Order confirmation** — order ID issued immediately, shown on screen and emailed
   (Supabase native email initially; see Notifications below). No login required to view
   it — the confirmation page IS the receipt.
6. **Tracking** — `/track` lets anyone look up an order by **order ID + email/phone**
   (no auth). Shows a timeline: Placed → Confirmed → Packed → Shipped → Out for delivery
   → Delivered, each with a timestamp, populated by admin actions (manual) and, where
   available, automated status flips (e.g. payment confirmed via Paystack webhook).
7. **Account (optional)** — if signed in, `/account/orders` lists every order tied to
   that email automatically (order lookup is email-keyed, not just account-keyed, so a
   guest order later "shows up" if they sign up with the same email).

## Order lifecycle (states)

`pending_payment → paid → processing → packed → shipped → out_for_delivery → delivered`
with `cancelled` and `refunded` as terminal side-states. Admin can set any state
manually; some transitions are automated:

- `pending_payment → paid`: Paystack webhook (edge function) on successful charge.
- Everything after `paid` is admin-driven from the Orders manager (manual, since there's
  no courier API integration in v1) — but each admin update fires a notification.

## Notifications (both ends, per the brief: admin AND customer stay updated)

- **Order placed** → email to customer (receipt) + admin dashboard live update.
- **Status change** → email to customer with the new status and tracking link.
- **Delivery-cron**: a Supabase scheduled (`pg_cron`) job periodically checks for orders
  stuck at `shipped`/`out_for_delivery` past an expected window and surfaces them on the
  admin dashboard as "needs attention" — nudging manual follow-up rather than pretending
  to auto-track a courier we don't integrate with.
- **Email delivery**: Supabase's free-plan SMTP is rate-limited and not meant for
  transactional volume. Plan is a small Node microservice (or Supabase Edge Function +
  external SMTP relay) for outbound order emails once volume needs it — v1 ships on
  Supabase's built-in auth email for account flows (verification, password reset) and a
  custom `send-email` edge function for order emails, swappable to Node/SMTP later
  without changing the calling code.

## Inventory

Every SKU (a product or a product variant) carries a `stock_quantity`. Checkout
decrements stock inside the same transaction that creates the order (via edge function,
service role) — never client-side. Low-stock and out-of-stock states are shown on the
PDP and filtered in the shop grid. Admin has a dedicated Inventory view for bulk
adjustment.

## Payments

Paystack only in v1 (card, bank transfer, USSD — Paystack's own channels). Edge function
`/payments` initializes a transaction server-side, returns the Paystack authorization
URL/reference to the client, and a `/payments/webhook` route verifies the webhook
signature and flips the order to `paid`. Never trust a client-reported "payment done."

## Future-facing (not v1, but the schema doesn't block it)

- Multiple couriers / real tracking API integration
- Multiple payment providers
- Reviews & ratings (schema has room; UI deferred)
- Wishlist / saved-for-later
- Multi-currency
