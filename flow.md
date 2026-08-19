# Livro Archive — Product & System Logic

This is the business model, not the code. It defines *what the system is* so the
implementation has something to be correct against. Read this before `design.md` or
any code.

---

## 1. What Livro Archive is

A commerce platform built **around books, education and related products** — not a
bookstore with an admin panel bolted on. Books are the anchor category, not the schema.

Three systems working together:

| System | Owns |
|---|---|
| **Storefront** | Discovery, browsing, cart, checkout, payment, order tracking |
| **Commerce / operations** | Products, pricing, inventory, orders, customers, promotions, payments, fulfilment, notifications |
| **Admin / back office** | Running the business day to day — not charts, *operations* |

The storefront must never dictate how the business works. Every rule below is enforced
server-side; the frontend is a view over it.

**Product philosophy:** *Discover. Explore. Buy. And discover something else you didn't
know you needed.* A customer buying a novel should naturally encounter the notebook,
the marker, the bookmark — without the store feeling pushy or cluttered.

---

## 2. The order lifecycle — the spine of the system

Everything else hangs off this. An order is always in exactly one state, and every
state change is recorded in `order_status_events` with who/when/why.

| State | Customer sees | Admin does | Trigger |
|---|---|---|---|
| `pending_payment` | Awaiting payment | Nothing yet | Order created at checkout |
| `payment_failed` | Payment didn't go through | Nothing / may follow up | Paystack failure or reservation expiry |
| `paid` | Payment confirmed | Prepare order | **Paystack webhook only** |
| `processing` | We're preparing your order | Pick & pack | Admin |
| `ready_for_dispatch` | Almost on its way | Arrange dispatch | Admin |
| `shipped` | Your order is on its way | Add courier + tracking number | Admin |
| `out_for_delivery` | Arriving today | Delivery in progress | Admin |
| `delivered` | Delivered | Close order | Admin |
| `cancelled` | Order cancelled | Record reason, release stock | Admin or customer pre-dispatch |
| `refunded` | Payment refunded | Complete refund | Admin |
| `returned` | Return received | Restock or write off | Admin |

**Rules**
- Only the Paystack webhook (or a verified server-side re-check) may set `paid`. The
  frontend never determines payment success.
- `cancelled` / `returned` from a paid state must return stock to `stock_on_hand`.
- New states can be added later without breaking existing orders — status is a
  constrained text column, not a Postgres enum, precisely so it can grow.

---

## 3. Inventory — available vs reserved vs sold

The single most important correctness rule in the system.

```
available = stock_on_hand − reserved
```

| Event | Effect |
|---|---|
| Added to cart | **Nothing.** Carts never hold stock — otherwise abandoned carts lock the shop. |
| Checkout started (payment initialized) | `reserved += qty`, with a **30-minute TTL** |
| Payment confirmed (`paid`) | `stock_on_hand −= qty`, `reserved −= qty` |
| Payment failed / reservation expired | `reserved −= qty` — stock returns to available |
| Order cancelled or returned after payment | `stock_on_hand += qty` |

A scheduled job (`pg_cron`, every 5 minutes) releases expired reservations and marks
their orders `payment_failed`. This is why an abandoned checkout costs the shop nothing
but 30 minutes of held stock.

Inventory movements are recorded in `inventory_movements` so stock is auditable —
"why do we have 7 of these?" must always be answerable.

Stock lives per **SKU**: a product with no variants uses the product row; a product
with variants uses the variant rows.

---

## 4. Promotions — five distinct mechanisms

These are genuinely different commerce concepts and must not be collapsed into one
"discount" field.

| # | Mechanism | Customer experience | Launch? |
|---|---|---|---|
| 1 | **Related product** | "You may also like" — nothing added automatically | ✅ Live |
| 2 | **Add-on** | "Add a notebook for ₦1,000" — customer opts in | ✅ Live (bundle item, opt-in) |
| 3 | **Bundle** | Book + notebook + marker together for ₦12,500 instead of ₦15,000 | ✅ Live |
| 4 | **Free item** | "Buy this book, get a free marker" — marker normally sells for ₦800 | ✅ Live (`price_override = 0`) |
| 5 | **Buy X get Y** | Buy 2 books, get a notebook free | ⏸ Schema only |
| — | **Coupon codes** | Enter `WELCOME10` at checkout | ⏸ Schema only |

Mechanisms 2–4 are all `bundle_items` rows with a `price_override`: `null` = full
price, `0` = free, any other value = the bundle price for that item. Mechanism 1 is a
separate `related_products` table (curated, plus category fallback). Mechanisms 5 and
coupons have schema but no engine yet — the model must not *prevent* them.

**Pricing is always recomputed server-side from the database at checkout.** A
client-supplied price is never trusted.

---

## 5. Customers — guest first, account optional

Two experiences, one system.

**Guest** — browse, cart, checkout, pay, receive an order ID, track the order. No
account, ever, if they don't want one.

**Registered** — everything above, plus order history, saved addresses, profile.

Key design decisions:
- **Account creation is never part of checkout.** After a successful guest purchase we
  *offer* an account ("want to manage your orders more easily?"), we never require one.
- Orders are keyed by **email**, not just `profile_id`. So if a guest later signs up
  with the same email, their previous orders appear automatically. This is why
  `/orders/mine` matches on `contact_email`.

### Guest order tracking (security)

Order ID alone is **not** sufficient — that would expose a customer's name, address and
purchase history to anyone who guesses a number.

```
Order ID:        LIV-2026-00042
Email or phone:  ****************
```

Both must match. The response omits the contact fields it was verified against, and the
endpoint is rate-limited per IP to prevent enumeration.

---

## 6. Delivery — hybrid model

Livro Archive supports **both** its own delivery and third-party couriers, chosen
per order:

- **Self-delivery** — an internal delivery agent is assigned; admin walks the order
  through `shipped → out_for_delivery → delivered`.
- **Courier** — a courier name and tracking number are recorded; the customer sees the
  courier and reference alongside Livro's own status timeline.

The admin picks the method when dispatching. Launch operations are self-delivery; the
courier path exists in schema and admin UI from day one so no migration is needed to
start using it.

---

## 7. Notifications — consequences of business events

Notifications are **not** a feature bolted onto the status handler. Every meaningful
business event writes a row to `notification_events`; a dispatcher drains that queue.

```
Business event  →  notification_events row  →  dispatcher  →  Email (SMS/push later)
                                                    ↓
                                              retry w/ backoff
```

Events that matter: `order_created`, `payment_succeeded`, `payment_failed`,
`order_processing`, `order_ready_for_dispatch`, `order_shipped`,
`order_out_for_delivery`, `order_delivered`, `order_cancelled`, `order_refunded`.

Because the event row is written **in the same transaction as the state change**, a
notification can never be silently lost — at worst it is pending. A scheduled job
retries `failed` rows with exponential backoff and a max attempt count, and
`(event_type, order_id)` is unique so a retry can never double-send.

**Transport:** a small, independently-deployable **Node microservice** (`email-service/`)
using SMTP credentials we own — chosen because Supabase's built-in SMTP is meant for
auth mail and is rate-limited on the free tier, and because the project rules exclude
third-party ESPs (SendGrid/Mailchimp/Resend). Supabase Auth still handles its own
verification/reset emails natively. The `send-email` Edge Function is the only caller
of the transport, so swapping it changes exactly one file.

---

## 8. Scheduled jobs

Cron supports reliability; it never owns business logic.

| Job | Frequency | Purpose |
|---|---|---|
| `release_expired_reservations()` | 5 min | Free stock from abandoned checkouts, mark orders `payment_failed` |
| `dispatch_pending_notifications()` | 2 min | Drain the notification queue, retry failures with backoff |
| `flag_stale_orders()` | hourly | Surface orders stuck in `shipped`/`out_for_delivery` past the configured window |

Run on **Supabase `pg_cron`**, not Vercel Cron — the free Vercel tier is too limited to
depend on.

---

## 9. The customer journey

```
                 DISCOVERY
                    │
        ┌───────────┴───────────┐
        ↓                       ↓
     Search                  Browse
        └───────────┬───────────┘
                    ↓
              Product page ──→ Related products / add-ons / bundles
                    ↓
                   Cart          (no stock held)
                    ↓
                 Checkout        (guest or signed in)
                    ↓
          Payment initialized    → stock RESERVED (30 min TTL)
                    ↓
               Paystack
                    ↓
        ┌───────────┴────────────┐
        ↓                        ↓
  Webhook: success         Failure / timeout
        ↓                        ↓
   Order = paid            payment_failed
   stock SOLD              reservation released
        ↓
   Processing → Ready for dispatch → Shipped → Out for delivery → Delivered
```

And in parallel, every state change fans out:

```
                    ORDER
                      │
          ┌───────────┼───────────┐
          ↓           ↓           ↓
      Customer      Admin     Inventory
          │           │           │
          ↓           ↓           ↓
   Notifications   Actions   Stock movements
```

---

## 10. Admin is a back office, not a dashboard

An administrator should open the console in the morning and immediately know:

- How much did we sell?
- Which orders need attention right now?
- What has to be dispatched today?
- What is low in stock?
- Which payments failed?
- Which orders are stuck?

The dashboard is only the entry point. The operational modules — Orders, Inventory,
Products, Customers, Promotions — are the actual product.

**Roles:** `admin_roles` is a real table, not a hardcoded enum. Only a Super Admin can
create roles or assign them. There is **one console UI for everyone**, gated by
permission checks — never a separate design per role.

---

## 11. Domain map

```
Storefront      Home · Products · Categories · Search · Product detail · Cart ·
                Checkout · Order confirmation · Order tracking

Customer        Profile · Orders · Order detail · Saved addresses

Commerce        Products · Categories · Inventory · Pricing · Promotions ·
                Bundles · Orders · Payments

Fulfilment      Processing · Dispatch · Delivery · Tracking

Communication   Notification events · Templates · Transport · Retry

Administration  Dashboard · Products · Orders · Customers · Inventory ·
                Promotions · Roles · Settings
```

---

## 12. Non-negotiables

1. **No direct table access from app code.** Everything goes through Edge Functions
   (see `SUPABASE RULE.txt`). RLS is deny-all; only the service role reads and writes.
2. **The backend is the source of truth** for price, stock and payment status.
3. **Nothing store-wide is hardcoded.** Currency, shipping fee, thresholds, reservation
   TTL, copy — all live in the `settings` table and are edited from the admin, never
   from code or the SQL editor.
4. **Order creation is idempotent.** A retried or double-clicked checkout must not
   create two orders or double-charge.
5. **Payment success comes from Paystack**, verified by signature — never from the
   client.
