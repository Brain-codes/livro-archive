/* Livro Archive — build progress data.
   Edit this file to update the dashboard. No build step, no server needed. */

window.PROGRESS = {
  project: "Livro Archive",
  tagline: "Books, stationery & everything in between — sold with soul",
  updated: "19 Aug 2026",
  currentlyDoing: "Rebuilt end to end. The four real defects you surfaced (stock, order numbers, totals, email) are fixed and verified against the live database, and the whole UI has been redesigned against your Skanvi reference — storefront and console. Waiting on Paystack keys and SMTP credentials; everything else is built.",

  phases: [
    {
      id: 0,
      name: "Foundation",
      plain: "Setting up the empty shell of the app so there's something to build into.",
      status: "done",
      tasks: [
        { name: "Project folders and settings", plain: "Create the app skeleton so we can start adding screens.", tech: "Next.js 15 App Router + TypeScript + Tailwind v4, src/ dir, @/* alias.", status: "done" },
        { name: "Install the stack", plain: "Pull in every library the build needs up front.", tech: "@supabase/supabase-js, @supabase/ssr, gsap, three, @react-three/fiber, @react-three/drei, framer-motion, zustand, react-hook-form, zod, lucide-react, sonner, date-fns.", status: "done" },
        { name: "Design system doc", plain: "Lock in the colours, type and motion rules before building screens.", tech: "design.md — warm literary palette (terracotta/gold/paper), Fraunces + Inter, light/dark tokens.", status: "done" },
        { name: "Flow & memory docs", plain: "Write down how the store is supposed to work and what's been decided, so nothing gets rebuilt by accident.", tech: "flow.md (shopper/order lifecycle), memory.md (stack decisions, credentials, rules, mid-build corrections).", status: "done" },
        { name: "Build dashboard", plain: "This page — a running log you can check any time.", tech: "dashboard/index.html + progress-data.js, same engine as The Turf Ball's dashboard.", status: "done" },
        { name: "Supabase project wired up", plain: "Point the app at the real database.", tech: "supabase init, .env.local populated with project URL + anon key, project linked via CLI.", status: "done" }
      ]
    },
    {
      id: 1,
      name: "Database",
      plain: "Designing where every product, order and customer actually gets stored.",
      status: "done",
      tasks: [
        { name: "Core tables", plain: "Products, variants, categories, bundles, carts, orders, order items, tracking events.", tech: "Migration pushed live: profiles, addresses, categories, products (full-text search + trigram index), product_variants, product_images, bundles, bundle_items, carts, cart_items, orders, order_items, order_status_events, discounts.", status: "done" },
        { name: "Row Level Security", plain: "Lock every table down so nothing is readable/writable except through Edge Functions.", tech: "RLS enabled deny-all on every table (zero policies); service_role explicitly granted table access via a follow-up migration after hitting a permission-denied error on first deploy.", status: "done" },
        { name: "Seed data", plain: "A few starter categories so the shop isn't empty.", tech: "Seeded categories: Fiction, Non-Fiction, Children's, Textbooks, Notebooks & Journals, Writing & Drawing, Classroom Supplies — confirmed live via curl.", status: "done" },
        { name: "Dynamic roles & settings", plain: "So nobody ever has to edit code or the database to add a staff role or change a store setting.", tech: "YOUR CALL, MID-BUILD: admin_roles table (name, permissions[], is_super_admin) + profiles.admin_role_id, and a generic settings key/value table (category, label, is_public) seeded with site name, currency, shipping fee, thresholds, social links, default theme.", status: "done" }
      ]
    },
    {
      id: 2,
      name: "Backend foundation",
      plain: "The shared plumbing every Edge Function reuses.",
      status: "done",
      tasks: [
        { name: "Shared backend utilities", plain: "Common code so every part of the backend behaves the same way.", tech: "supabase/functions/_shared/: cors.ts, response.ts, auth.ts (JWT -> profile + admin_role permission resolution, can()/requireRole() helpers), db.ts (service-role client).", status: "done" },
        { name: "Standard response envelope", plain: "Every request gets an answer in exactly the same shape.", tech: "{ success, message, data, meta, errors } via _shared/response.ts, used by all 11 functions.", status: "done" },
        { name: "Permission-gated admin operations", plain: "Every admin write checks a specific permission, not just \"is this an admin\".", tech: "can(caller, 'products.manage' | 'orders.manage' | 'stats.view' | 'settings.manage'); role creation itself is locked to isSuperAdmin only.", status: "done" }
      ]
    },
    {
      id: 3,
      name: "Accounts & login",
      plain: "Optional accounts — never required to buy something.",
      status: "done",
      tasks: [
        { name: "Sign up / sign in / sign out", plain: "The everyday account actions.", tech: "Supabase Auth SDK directly for simple flows, /auth/sign-in and /auth/sign-up screens built, useSession() hook resolves the caller + permissions client-side.", status: "done" },
        { name: "Profile creation on signup", plain: "Create the matching profile row when someone signs up.", tech: "auth-profile Edge Function: creates auth.users + profiles atomically, rolls back the auth user if the profile insert fails.", status: "done" },
        { name: "Email verification", plain: "Confirm the email address is real.", tech: "Native Supabase confirm-email, no third-party ESP — still needs enabling in the Supabase Auth dashboard (a dashboard setting, not code).", status: "todo" }
      ]
    },
    {
      id: 4,
      name: "Catalog",
      plain: "Everything about browsing and viewing products.",
      status: "done",
      tasks: [
        { name: "Product & category Edge Functions", plain: "List, search, filter and view single products/categories.", tech: "/product and /category deployed and confirmed live — full CRUD, permission-gated writes, public reads, full-text search via search_vector.", status: "done" },
        { name: "Shop grid", plain: "The main browsing screen with filters and sort.", tech: "/shop (all products) and /shop/[category], server-rendered with ISR (60s revalidate), GSAP ScrollTrigger stagger-in via ShopGrid.", status: "done" },
        { name: "Product detail page", plain: "Full product view with gallery, price, stock and the bundle upsell.", tech: "/product/[slug] — gallery, variant picker, bundle module reading bundle_items, add-to-cart and add-whole-bundle actions.", status: "done" },
        { name: "Search", plain: "Find a product by name/author/ISBN.", tech: "Postgres full-text search exposed via /product?q= — backend ready, search box in the header not yet wired to it.", status: "doing" }
      ]
    },
    {
      id: 5,
      name: "Cart",
      plain: "Adding things to a basket, guest-friendly.",
      status: "done",
      starred: true,
      tasks: [
        { name: "Cart store", plain: "Add, remove, adjust quantity — instantly, no login.", tech: "Zustand store (src/store/cart.ts) persisted to localStorage; bundle-aware line items grouped by bundleId.", status: "done" },
        { name: "Cart drawer + full cart page", plain: "See what's in the basket and edit it.", tech: "Slide-in CartDrawer (opens automatically on add) plus a full /cart review page.", status: "done" },
        { name: "Server cart sync", plain: "Turn the local cart into a real row once checkout starts.", tech: "/cart Edge Function deployed — persists a carts + cart_items snapshot tied to a session token or signed-in user. Not yet called from the frontend (checkout currently goes straight from the Zustand store to /orders); wiring this up is what would let an abandoned cart be recovered later.", status: "doing" }
      ]
    },
    {
      id: 6,
      name: "Checkout & payments",
      plain: "Taking the order and the money.",
      status: "doing",
      starred: true,
      tasks: [
        { name: "Guest + signed-in checkout", plain: "Email, shipping address, phone — account optional.", tech: "/checkout built with react-hook-form + zod validation, order summary sidebar, submits straight to /orders then /payments/initialize.", status: "done" },
        { name: "Order creation (checkout backend)", plain: "Turn a cart into a real order, priced and stock-checked server-side.", tech: "/orders POST: re-prices every line from the DB (never trusts client prices), checks stock, decrements it, writes order + order_items + a pending_payment status event.", status: "done" },
        { name: "Paystack integration", plain: "Pay by card, bank transfer or USSD.", tech: "/payments/initialize deployed. PAYSTACK_SECRET_KEY not yet supplied — returns a clear 503 until it's set via `supabase secrets set`; checkout gracefully falls back to the confirmation screen in that case so the flow can still be reviewed end to end.", status: "doing" },
        { name: "Webhook confirms payment", plain: "Only trust the payment once Paystack itself confirms it.", tech: "/payments/webhook deployed: verifies HMAC-SHA512 signature, flips order pending_payment -> paid. Untestable until Paystack keys arrive.", status: "doing" },
        { name: "Order confirmation page", plain: "Instant receipt with the order ID, no login needed.", tech: "/checkout/success shows the order number and a direct link into tracking.", status: "done" }
      ]
    },
    {
      id: 7,
      name: "Orders & tracking",
      plain: "Letting anyone follow their order from placed to delivered.",
      status: "done",
      starred: true,
      tasks: [
        { name: "Order lookup", plain: "Find your order with just the order ID and email/phone — no account needed.", tech: "/tracking Edge Function deployed: matches order_number + contact email/phone, strips contact fields from the public response.", status: "done" },
        { name: "Tracking timeline UI", plain: "A clear visual timeline: placed, confirmed, packed, shipped, delivered.", tech: "/track (lookup form) and /track/[orderId] (timeline + items), OrderTimeline component reading order_status_events.", status: "done" },
        { name: "Account order history", plain: "Signed-in customers see every order automatically.", tech: "/orders/mine deployed and wired into /account — lists orders by profile email match, not just user_id.", status: "done" }
      ]
    },
    {
      id: 8,
      name: "Admin console",
      plain: "Where the store gets run day to day.",
      status: "doing",
      starred: true,
      tasks: [
        { name: "Admin shell + auth gate", plain: "A locked-down dashboard for staff only, one design for every role.", tech: "(admin) route group, AdminShell reads useSession()+can() to show/hide nav items per permission — not a separate UI per role, just conditional rendering.", status: "done" },
        { name: "Product & bundle manager", plain: "Add/edit products, variants, images, and build bundles.", tech: "/admin/products: list + create form live. Variant/image/bundle editing and Supabase Storage upload not yet built.", status: "doing" },
        { name: "Category manager", plain: "Add and view categories.", tech: "/admin/categories: list + create form, live.", status: "done" },
        { name: "Inventory view", plain: "See and adjust stock across every SKU.", tech: "Not yet built as its own screen — stock is editable via the product form today.", status: "todo" },
        { name: "Orders manager", plain: "See every order, update its status, add tracking notes.", tech: "/admin/orders: table with inline status-change dropdown, calls /orders PATCH which fires /send-email automatically.", status: "done" },
        { name: "Dashboard KPIs", plain: "Revenue, order counts, best sellers at a glance.", tech: "/admin/dashboard: revenue, order count, low-stock count (from the settings-driven threshold), stuck-order flags, recent orders. Plain stat cards for now, not yet the hand-rolled SVG charts.", status: "doing" },
        { name: "Settings page", plain: "Edit store-wide config without touching code or the database.", tech: "YOUR CALL, MID-BUILD: /admin/settings reads every row from the settings table, grouped by category, each with an inline editable value + Save — backed by /settings/all and /settings/:key.", status: "done" },
        { name: "Roles page", plain: "Only a Super Admin can create new staff roles.", tech: "YOUR CALL, MID-BUILD: /admin/roles (locked to isSuperAdmin) lists roles and lets you build a new one from a permission checklist, via /roles.", status: "done" }
      ]
    },
    {
      id: 9,
      name: "Notifications",
      plain: "Keeping both the customer and the admin in the loop automatically.",
      status: "doing",
      tasks: [
        { name: "Order + status emails", plain: "Email the customer when an order is placed and whenever its status changes.", tech: "send-email Edge Function deployed and wired into /orders' status-update path. Transport currently logs the email (Supabase free-plan SMTP isn't meant for transactional volume) — swappable to a Node/SMTP microservice without changing callers.", status: "doing" },
        { name: "Stuck-order watchdog", plain: "Flag orders that have sat too long at 'shipped' so admin follows up.", tech: "admin-stats already computes this on every dashboard load using the settings-driven stuck_order_hours value; a real pg_cron job to run it proactively (rather than on-view) not yet added.", status: "doing" }
      ]
    },
    {
      id: 10,
      name: "Making it beautiful",
      plain: "The animation, the polish, the award-winning feel.",
      status: "doing",
      tasks: [
        { name: "Hero motion", plain: "The first thing you see — parallax books, one 3D moment.", tech: "GSAP entrance stagger built; lazy-loaded @react-three/fiber scene (a floating open book) gated on prefers-reduced-motion and viewport width, with a static fallback.", status: "done" },
        { name: "Scroll-triggered product grid", plain: "Products animate in as you scroll, reorder smoothly on filter.", tech: "GSAP ScrollTrigger stagger-in built (ShopGrid). FLIP reorder on filter/sort not yet added (no sort controls yet either).", status: "doing" },
        { name: "Cart & checkout micro-interactions", plain: "Small satisfying moments — add-to-cart flight, button press, price count-up.", tech: "Button press-scale done globally; cart-icon flight animation and price count-up not yet built.", status: "doing" },
        { name: "Light & dark mode", plain: "Looks intentional in both.", tech: "CSS variable tokens defined for both modes in globals.css; no theme toggle control built yet (follows OS preference only).", status: "doing" }
      ]
    },
    {
      id: 11,
      name: "Ready for real use",
      plain: "Final checks before this goes live.",
      status: "todo",
      tasks: [
        { name: "SEO", plain: "Product pages, metadata, sitemap — findable on Google.", tech: "Dynamic sitemap.xml, robots.txt (console/account/checkout/track excluded), canonical URLs, Open Graph + Twitter cards, and Product + BreadcrumbList JSON-LD on every product page.", status: "done" },
        { name: "Deployment notes", plain: "Clear instructions for pushing it live.", tech: "README written with local dev, db push, functions deploy, and required env vars.", status: "done" }
      ]
    },
    {
      id: 12,
      name: "Commerce model, rebuilt properly",
      plain: "You pushed back on the plan and it exposed four things that were genuinely wrong, not just missing. This phase is the fix.",
      status: "done",
      starred: true,
      tasks: [
        { name: "Stock no longer disappears on abandoned checkouts", plain: "Before, putting in an order took the books off the shelf even if the person never paid — so an abandoned basket destroyed stock forever. Now the shop only HOLDS them for 30 minutes while payment happens, and gives them straight back if it doesn't.", tech: "available = stock_on_hand − reserved. reserve_order_stock() at payment init with a TTL, commit_order_stock() on the Paystack webhook, release_order_stock() on failure, restock_order() on cancel/return, and a release_expired_reservations() job on pg_cron every 5 minutes. Every movement is written to inventory_movements so stock is auditable. TESTED LIVE against the real database: reserve 60->58 available, commit 58 on hand, restock back to 60, and an expired hold fully recovered with the order flipped to payment_failed.", status: "done" },
        { name: "Order numbers can no longer collide", plain: "The old order number ended in 4 random digits. At about 110 orders in a day there was a coin-flip chance two customers got the same number and one of them hit an error at checkout.", tech: "Replaced with a Postgres sequence: LIV-2026-00001. Collision-free by construction. Verified live.", status: "done" },
        { name: "Order totals now include delivery and discounts", plain: "The old checkout literally charged the subtotal — delivery and any discount code were ignored, so customers would have been charged the wrong amount.", tech: "New _shared/pricing.ts re-prices every line from the database, applies a validated discount code, and adds the settings-driven shipping fee with a free-delivery threshold. The client's idea of a price is never trusted.", status: "done" },
        { name: "Double-clicking checkout can't create two orders", plain: "A slow connection or an impatient second tap used to be able to place the same order twice.", tech: "Idempotency key generated per basket and stored unique on orders; a repeat returns the original order. Verified live — the same key returned LIV-2026-00001 instead of creating a second order.", status: "done" },
        { name: "Order tracking can't be brute-forced", plain: "Someone could have guessed order numbers to read other people's orders.", tech: "Tracking requires order number AND the email/phone used at checkout, returns an identical 'not found' either way so it can't confirm which numbers are real, strips the contact fields it verified against, and is rate-limited to 10 lookups per IP per 5 minutes. Verified live — wrong contact refused, and the 11th rapid lookup returned 429.", status: "done" },
        { name: "The order lifecycle matches how the business actually runs", plain: "Added the states you described that were missing.", tech: "Added payment_failed, ready_for_dispatch and returned; renamed packed. Only the verified Paystack webhook can set 'paid' — the admin UI refuses to, so a payment can never be faked from the back office.", status: "done" },
        { name: "Hybrid delivery", plain: "YOUR CALL: the shop can hand an order to a courier or deliver it itself, chosen per order.", tech: "orders.delivery_method + courier_name + tracking_number + delivery_agent_id, and a delivery_agents table. Both paths are in the admin drawer from day one.", status: "done" }
      ]
    },
    {
      id: 13,
      name: "Design, rebuilt against your reference",
      plain: "You rejected the first two looks and sent skanvi.com plus screenshots. This is the rebuild against those.",
      status: "done",
      starred: true,
      tasks: [
        { name: "New design system", plain: "Warm cream, near-black type, one deep green, and a tight modern headline face.", tech: "v3 tokens in globals.css: canvas #FDF6EC, ink #1A1A18, forest #2F4F3E, sage #7E9E8E, Archivo display + Inter body. Full light and dark palettes. Two earlier attempts (terracotta/Fraunces, oxblood/Cormorant) were rejected and are documented in memory.md so nobody drifts back to them.", status: "done" },
        { name: "Homepage rebuilt section by section", plain: "The hero, the 'What are you looking for?' rail, and the big picture panels now match the layouts you sent.", tech: "Hero: 44/34/22 grid, cream panel butted flush against a tall image with a shorter one inset and dropped, label pills bottom-right. CategoryRail: cutouts floating on the canvas with edge arrows that fade at either end. EditorialGrid: one tall panel plus two stacked, copy bottom-left over a colour wash. Plus a full-bleed sage favourites band, trust row, newsletter card and four-column footer.", status: "done" },
        { name: "Full-screen menu", plain: "Tapping the nav opens a full green screen with big category links and a giant faded logo behind them.", tech: "MegaMenu on forest-deep with a 30vw ghosted wordmark bleeding off the bottom, GSAP stagger, Escape to close, scroll locked.", status: "done" },
        { name: "Product cards and product page", plain: "Cards now show availability, a save-for-later heart and a 'View details' button, and line up evenly in a grid.", tech: "3:4 portrait crop for covers, availability pill, wishlist heart (local, guest-friendly), reserved title height so buttons align. PDP rebuilt with a thumbnail gallery, option pills, a checkbox-style bundle upsell showing the saving, delivery/returns strip and accordions.", status: "done" },
        { name: "Real cover art instead of stock photos", plain: "The placeholder images were random landscape photos, which made a bookshop look like a travel blog. Now every product has a proper generated jacket.", tech: "scripts/generate-covers.mjs writes 44 flat on-brand SVG jackets to public/covers, applied by migration. Replace with real photography by changing product_images.url — no code change.", status: "done" },
        { name: "Light and dark mode with a toggle", plain: "A three-way toggle in the footer: light, system, dark.", tech: "data-theme on <html> + localStorage, with a blocking init script so there's no flash of the wrong theme.", status: "done" },
        { name: "Console rebuilt from bland to operational", plain: "You called the admin bland. It's now built around the dashboard screenshots you sent.", tech: "Grouped sidebar with active markers and an action-count badge; a filled-green lead KPI card; hand-rolled SVG revenue area chart, status bars and a delivery gauge (no charting library); and an Orders screen with filter chips, a dense table, one-tap 'next step' buttons and a right-hand detail drawer showing customer, items, dispatch, status and full history.", status: "done" },
        { name: "New console screens", plain: "Inventory, customers and promotions now exist as real working screens.", tech: "Inventory (on hand / held / available per SKU and variant, quick adjusters, movement history), Customers (rolled up per email, guests included), Promotions (bundle builder and discount codes), plus rebuilt Products, Categories, Settings and Roles.", status: "done" }
      ]
    },
    {
      id: 14,
      name: "Notifications that can't be lost",
      plain: "Emails are now a queue, not a hopeful side effect.",
      status: "doing",
      starred: true,
      tasks: [
        { name: "Every status change records an event", plain: "When an order changes, that fact is written down permanently — so an email can be late, but never silently lost.", tech: "notification_events table written in the same breath as the status change, unique on (event_type, order_id) so a retry can never double-send. Verified live: order_created and payment_failed rows appeared automatically.", status: "done" },
        { name: "A dispatcher with retries and backoff", plain: "If sending fails, it tries again later instead of giving up.", tech: "/notifications/dispatch drains the queue with exponential backoff (1, 2, 4, 8 minutes) up to a settings-driven max, then marks the event dead so it's visible rather than forgotten. Verified live: with no transport configured, all three queued emails were marked failed with the real error and a retry time — none lost.", status: "done" },
        { name: "Branded order emails", plain: "Proper emails for every stage, in the shop's own look.", tech: "Nine templates (order created through delivered/refunded) rendered as responsive HTML + plain text with the storefront palette and a tracking button.", status: "done" },
        { name: "The email service itself", plain: "A small separate service that actually puts the mail on SMTP.", tech: "YOUR CALL: a standalone Node service in email-service/ using SMTP credentials you own — Supabase's own mail is for sign-up only and rate-limited, and the rules rule out SendGrid/Mailchimp/Resend. Built and tested locally (health, auth rejection, bad body, and a 5xx on SMTP failure so the queue retries). NOT LIVE — needs deploying and your SMTP credentials.", status: "doing" },
        { name: "Automatic queue draining", plain: "The queue should empty itself every couple of minutes.", tech: "Needs one script run in the Supabase SQL editor (supabase/scripts/schedule-notifications.sql) because it requires the service role key, which must never be committed. Until then the queue still records everything and can be drained manually from the console.", status: "todo" }
      ]
    },
  ],

  log: [
    { time: "19 Aug 2026", text: "Project kicked off. Stack decided: Next.js 15 for SEO, Supabase (Edge Function-only architecture per the standing Supabase rule), Paystack, GSAP + Three.js for motion.", kind: "note" },
    { time: "19 Aug 2026", text: "App scaffolded (Next.js + TS + Tailwind v4), full library set installed, Supabase project linked, design.md / flow.md / memory.md written, this dashboard created.", kind: "done" },
    { time: "19 Aug 2026", text: "Full database schema written and pushed live via `supabase db push`: profiles, addresses, categories, products (with full-text search), variants, images, bundles, cart, orders, order items, status-event history, discounts. RLS enabled deny-all everywhere. Starter categories seeded.", kind: "done" },
    { time: "19 Aug 2026", text: "SETBACK, CAUGHT IMMEDIATELY: the first live test of the backend returned \"permission denied for table\" — service_role had RLS bypass but no explicit table GRANTs on the new tables. Fixed with a follow-up migration granting service_role full access plus default privileges for future tables; pushed and re-verified.", kind: "issue" },
    { time: "19 Aug 2026", text: "Built and deployed the first 9 Edge Functions per the resource-based architecture rule: product, category, cart, orders, tracking, payments, auth-profile, admin-stats, send-email. Every one uses the shared { success, message, data, meta, errors } envelope.", kind: "done" },
    { time: "19 Aug 2026", text: "TESTED LIVE: curled /category and /product directly against the deployed functions — both return real data from the real database.", kind: "done" },
    { time: "19 Aug 2026", text: "YOUR FEEDBACK, MID-BUILD: nothing store-wide should be hardcoded — it all needs to live in an editable admin Settings area, segmented by category. And the platform needs multiple staff roles from day one, created only by a Super Admin, with ONE monolithic console UI (not a separate design per role) that just shows/hides screens by permission.", kind: "note" },
    { time: "19 Aug 2026", text: "Added a real roles system (admin_roles table + profiles.admin_role_id, permissions checked via a single can() helper) and a generic settings key/value table seeded with site name, currency, shipping fee, thresholds, social links and default theme. Built and deployed two new Edge Functions, /settings and /roles, and updated every admin-scoped handler (product, category, orders, admin-stats) to check specific permissions instead of a hardcoded admin/staff role.", kind: "done" },
    { time: "19 Aug 2026", text: "TESTED LIVE: curled /settings — returns the real public settings row-for-row from the database.", kind: "done" },
    { time: "19 Aug 2026", text: "YOUR FEEDBACK, MID-BUILD: keep the design system centralized — one set of color/font/size tokens, changed in one place, everywhere (including admin) picks it up. Confirmed this was already the approach (globals.css tokens -> Tailwind utilities, no raw hex in components) and logged it as a standing rule so it doesn't drift later.", kind: "note" },
    { time: "19 Aug 2026", text: "Built the full storefront: design tokens (warm literary palette, Fraunces + Inter, light/dark), header/footer/cart drawer, GSAP-animated hero with a lazy-loaded Three.js floating-book scene, shop grid with scroll stagger, product detail page with variant picker and bundle upsell, full cart page, guest-first checkout wired to /orders and /payments/initialize, order confirmation, and public order tracking (lookup + timeline) — no account required anywhere in that path.", kind: "done" },
    { time: "19 Aug 2026", text: "Built sign-in/sign-up and an account page showing order history for anyone who does choose to create an account.", kind: "done" },
    { time: "19 Aug 2026", text: "Built the admin console: permission-gated shell and nav, dashboard KPIs, categories manager, a first-pass products manager, an orders manager that updates status and triggers the customer email automatically, a Settings page that edits the new settings table in place, and a Roles page (Super Admin only) for creating new staff roles from a permission checklist.", kind: "done" },
    { time: "19 Aug 2026", text: "SETBACK, CAUGHT BY THE BUILD: `next build` initially failed TypeScript checking because it was pulling the Deno-only Edge Function code (which uses `Deno.*` globals and `jsr:` imports) into the Next.js project. Fixed by excluding `supabase/` from tsconfig.json and giving the functions their own deno.jsonc; also fixed a CSS `@import` ordering warning and renamed the deprecated `middleware.ts` to `proxy.ts` per Next 16. Full production build now passes clean, including live data fetched from the real Edge Functions at build time.", kind: "issue" },
    { time: "19 Aug 2026", text: "YOUR FEEDBACK: you didn't like the first design. Ran the ui-ux-pro-max design-system search for a bookstore/editorial brief and switched the whole site to a new palette — warm paper + near-black ink with a single oxblood accent instead of the earlier terracotta/gold — and swapped Fraunces for Cormorant Garamond (paired with Inter). Because every color/font is a token in globals.css, this was a one-file change that updated the entire storefront and admin console at once.", kind: "done" },
    { time: "19 Aug 2026", text: "Added a light/dark theme toggle in the footer (system/light/dark), with a blocking init script so there's no flash of the wrong theme on load.", kind: "done" },
    { time: "19 Aug 2026", text: "Seeded 44 dummy products across all 7 categories (real book titles/authors, real stationery items), 3 bundles, and a couple of variant-bearing products (paperback/hardcover, journal colours) with placeholder cover art. SETBACK, CAUGHT BY THE PUSH ITSELF: the first two attempts failed with \"VALUES lists must all be the same length\" — three product rows (classroom-stapler, geometry-set, sticky-notes-multi) were missing a null compare_at_price column. Fixed and re-pushed; confirmed live via curl (44 products, real bundle/variant data).", kind: "issue" },
    { time: "19 Aug 2026", text: "YOUR REQUEST: created the Super Admin account (adenugaadewumi01@gmail.com) via the auth-profile signup function, then a migration to confirm its email and grant it the Super Admin role. Confirmed live end-to-end by logging in over the real Auth API and calling /auth-profile/me — comes back as role: admin, isSuperAdmin: true, permissions: ['*'].", kind: "done" },
    { time: "19 Aug 2026", text: "NEXT UP: bundle/variant editing and image upload in the product manager, the SVG dashboard charts, FLIP grid reordering and cart-flight micro-interactions, sitemap/JSON-LD, then a full human click-through once Paystack keys are supplied.", kind: "note" }
  ],

  blockers: [
    "PAYSTACK KEYS — still not supplied. Everything up to the payment step works and is tested; /payments returns a clear 503 until PAYSTACK_SECRET_KEY is set with `supabase secrets set`. Checkout currently falls through to the confirmation screen so the flow can still be reviewed.",
    "SMTP CREDENTIALS — the email service is built and tested but not deployed. Deploy email-service/ anywhere running Node 20+, then set EMAIL_SERVICE_URL and EMAIL_SERVICE_TOKEN as Supabase secrets. Until then order emails queue up and retry rather than sending; nothing is lost.",
    "ONE SQL SCRIPT TO RUN — supabase/scripts/schedule-notifications.sql, pasted into the Supabase SQL editor, switches on automatic email dispatch every 2 minutes. It isn't a migration because it needs the service role key, which must never be committed to the repo.",
    "Email verification on sign-up needs enabling in the Supabase dashboard (Authentication -> Providers -> Email). That's a dashboard setting, not code.",
    "NOT YET CLICKED THROUGH BY A HUMAN. I verified the storefront and console myself in a headless browser and tested the commerce logic directly against the live database, but nobody has actually shopped the site end to end. That's yours to do."
  ],

  decisions: [
    { q: "Framework: Next.js or Vite?", a: "Next.js 15 App Router — stronger native SEO (SSR/ISR, Metadata API, sitemap) than Vite for a public storefront.", open: false },
    { q: "How does order tracking work without an account?", a: "My call: order ID + email/phone lookup, no login required — matches the 'don't have to create an account' requirement.", open: true },
    { q: "How are bundles modeled?", a: "My call: bundle_items table referencing other products/variants with a price override, not a separate discount engine.", open: true },
    { q: "How are order emails sent on the free Supabase plan?", a: "My call: custom send-email Edge Function now, built swappable to a Node/SMTP microservice later without changing callers.", open: true },
    { q: "How do roles work?", a: "Your instruction: admin_roles is a real, editable table — only a Super Admin can create/edit roles, and there is one console UI for everyone, gated by permission checks, not a design per role.", open: false },
    { q: "Where does store config live?", a: "Your instruction: a generic settings table edited from an admin Settings page, segmented by category — never a code or database edit for things like currency, shipping fee or thresholds.", open: false }
  ]
};
