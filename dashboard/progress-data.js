/* Livro Archive — build progress data.
   Edit this file to update the dashboard. No build step, no server needed. */

window.PROGRESS = {
  project: "Livro Archive",
  tagline: "Books, stationery & everything in between — sold with soul",
  updated: "19 Aug 2026",
  currentlyDoing: "Backend is live: full database schema pushed and 9 Edge Functions deployed and confirmed responding against the real project. Building the storefront UI next (design tokens, layout, cart, product pages).",

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
        { name: "Flow & memory docs", plain: "Write down how the store is supposed to work and what's been decided, so nothing gets rebuilt by accident.", tech: "flow.md (shopper/order lifecycle), memory.md (stack decisions, credentials, rules).", status: "done" },
        { name: "Build dashboard", plain: "This page — a running log you can check any time.", tech: "dashboard/index.html + progress-data.js, same engine as The Turf Ball's dashboard.", status: "done" },
        { name: "Supabase project wired up", plain: "Point the app at the real database.", tech: "supabase init, .env.local populated with project URL + anon key.", status: "done" }
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
        { name: "Seed data", plain: "A few starter categories so the shop isn't empty.", tech: "Seeded categories: Fiction, Non-Fiction, Children's, Textbooks, Notebooks & Journals, Writing & Drawing, Classroom Supplies — confirmed live via curl.", status: "done" }
      ]
    },
    {
      id: 2,
      name: "Backend foundation",
      plain: "The shared plumbing every Edge Function reuses.",
      status: "done",
      tasks: [
        { name: "Shared backend utilities", plain: "Common code so every part of the backend behaves the same way.", tech: "supabase/functions/_shared/: cors.ts, response.ts, auth.ts (JWT -> profile role resolution), db.ts (service-role client).", status: "done" },
        { name: "Standard response envelope", plain: "Every request gets an answer in exactly the same shape.", tech: "{ success, message, data, meta, errors } via _shared/response.ts, used by all 9 functions.", status: "done" }
      ]
    },
    {
      id: 3,
      name: "Accounts & login",
      plain: "Optional accounts — never required to buy something.",
      status: "doing",
      tasks: [
        { name: "Sign up / sign in / sign out", plain: "The everyday account actions.", tech: "Supabase Auth SDK directly for simple flows (login/logout/reset) per Supabase rule §11 — frontend screens not yet built.", status: "todo" },
        { name: "Profile creation on signup", plain: "Create the matching profile row when someone signs up.", tech: "auth-profile Edge Function deployed: creates auth.users + profiles atomically, rolls back the auth user if the profile insert fails.", status: "done" },
        { name: "Email verification", plain: "Confirm the email address is real.", tech: "Native Supabase confirm-email, no third-party ESP — needs enabling in the Supabase Auth dashboard.", status: "todo" }
      ]
    },
    {
      id: 4,
      name: "Catalog",
      plain: "Everything about browsing and viewing products.",
      status: "doing",
      tasks: [
        { name: "Product & category Edge Functions", plain: "List, search, filter and view single products/categories.", tech: "/product and /category deployed and confirmed live — full CRUD, admin-gated writes, public reads.", status: "done" },
        { name: "Shop grid", plain: "The main browsing screen with filters and sort.", tech: "Server-rendered grid, ISR per category, client-side filter refinement.", status: "todo" },
        { name: "Product detail page", plain: "Full product view with gallery, price, stock and the bundle upsell.", tech: "PDP with bundle_items module — add whole bundle in one tap.", status: "todo" },
        { name: "Search", plain: "Find a product by name/author/ISBN.", tech: "Postgres full-text search exposed via /product?q=.", status: "todo" }
      ]
    },
    {
      id: 5,
      name: "Cart",
      plain: "Adding things to a basket, guest-friendly.",
      status: "todo",
      starred: true,
      tasks: [
        { name: "Cart store", plain: "Add, remove, adjust quantity — instantly, no login.", tech: "Zustand store persisted to localStorage; bundle-aware line items.", status: "todo" },
        { name: "Cart drawer + full cart page", plain: "See what's in the basket and edit it.", tech: "Slide-in drawer with flight-to-cart animation, full /cart page for review.", status: "todo" },
        { name: "Server cart sync", plain: "Turn the local cart into a real row once checkout starts.", tech: "/cart Edge Function deployed — persists a carts + cart_items snapshot tied to a session token or signed-in user; frontend wiring pending.", status: "done" }
      ]
    },
    {
      id: 6,
      name: "Checkout & payments",
      plain: "Taking the order and the money.",
      status: "doing",
      starred: true,
      tasks: [
        { name: "Guest + signed-in checkout", plain: "Email, shipping address, phone — account optional.", tech: "/checkout with react-hook-form + zod validation, prefill from saved address if signed in — screen not yet built.", status: "todo" },
        { name: "Order creation (checkout backend)", plain: "Turn a cart into a real order, priced and stock-checked server-side.", tech: "/orders POST deployed: re-prices every line from the DB (never trusts client prices), checks stock, decrements it, writes order + order_items + a pending_payment status event.", status: "done" },
        { name: "Paystack integration", plain: "Pay by card, bank transfer or USSD.", tech: "/payments/initialize deployed. PAYSTACK_SECRET_KEY not yet supplied — returns a clear 503 until it's set via `supabase secrets set`.", status: "doing" },
        { name: "Webhook confirms payment", plain: "Only trust the payment once Paystack itself confirms it.", tech: "/payments/webhook deployed: verifies HMAC-SHA512 signature, flips order pending_payment -> paid. Untestable until Paystack keys arrive.", status: "doing" },
        { name: "Order confirmation page", plain: "Instant receipt with the order ID, no login needed.", tech: "/checkout/success reads order by id + short-lived token, doubles as the emailed receipt content — screen not yet built.", status: "todo" }
      ]
    },
    {
      id: 7,
      name: "Orders & tracking",
      plain: "Letting anyone follow their order from placed to delivered.",
      status: "doing",
      starred: true,
      tasks: [
        { name: "Order lookup", plain: "Find your order with just the order ID and email/phone — no account needed.", tech: "/tracking Edge Function deployed: matches order_number + contact email/phone, strips contact fields from the public response.", status: "done" },
        { name: "Tracking timeline UI", plain: "A clear visual timeline: placed, confirmed, packed, shipped, delivered.", tech: "ProgressTimeline component reading order_status_events.", status: "todo" },
        { name: "Account order history", plain: "Signed-in customers see every order automatically.", tech: "/orders/mine deployed — lists orders by profile email match, not just user_id. Screen not yet built.", status: "doing" }
      ]
    },
    {
      id: 8,
      name: "Admin console",
      plain: "Where the store gets run day to day.",
      status: "doing",
      starred: true,
      tasks: [
        { name: "Admin shell + auth gate", plain: "A locked-down dashboard for staff only.", tech: "(admin) route group, role check via profiles.role, AdminShell sidebar + topbar — not yet built.", status: "todo" },
        { name: "Product & bundle manager", plain: "Add/edit products, variants, images, and build bundles.", tech: "Backend ready: full CRUD via /product (admin-scoped operations). Image upload to Supabase Storage and the manager UI not yet built.", status: "doing" },
        { name: "Inventory view", plain: "See and adjust stock across every SKU.", tech: "Bulk stock editor, low-stock filter — not yet built.", status: "todo" },
        { name: "Orders manager", plain: "See every order, update its status, add tracking notes.", tech: "Backend ready: /orders admin list/detail/PATCH deployed, fires /send-email on every status change. Manager UI not yet built.", status: "doing" },
        { name: "Dashboard KPIs", plain: "Revenue, order counts, best sellers at a glance.", tech: "/admin-stats deployed (revenue, order count, low-stock count, stuck-order flags, recent orders). Hand-rolled SVG charts + screen not yet built.", status: "doing" }
      ]
    },
    {
      id: 9,
      name: "Notifications",
      plain: "Keeping both the customer and the admin in the loop automatically.",
      status: "doing",
      tasks: [
        { name: "Order + status emails", plain: "Email the customer when an order is placed and whenever its status changes.", tech: "send-email Edge Function deployed and wired into /orders' status-update path. Transport currently logs the email (Supabase free-plan SMTP isn't meant for transactional volume) — swappable to a Node/SMTP microservice without changing callers.", status: "doing" },
        { name: "Stuck-order watchdog", plain: "Flag orders that have sat too long at 'shipped' so admin follows up.", tech: "pg_cron scheduled job surfaces stale orders on the admin dashboard.", status: "todo" }
      ]
    },
    {
      id: 10,
      name: "Making it beautiful",
      plain: "The animation, the polish, the award-winning feel.",
      status: "todo",
      tasks: [
        { name: "Hero motion", plain: "The first thing you see — parallax books, one 3D moment.", tech: "GSAP ScrollTrigger parallax + lazy-loaded R3F scene, gated on prefers-reduced-motion.", status: "todo" },
        { name: "Scroll-triggered product grid", plain: "Products animate in as you scroll, reorder smoothly on filter.", tech: "GSAP batched ScrollTrigger stagger + FLIP reorder.", status: "todo" },
        { name: "Cart & checkout micro-interactions", plain: "Small satisfying moments — add-to-cart flight, button press, price count-up.", tech: "Framer Motion + GSAP for targeted micro-interactions.", status: "todo" },
        { name: "Light & dark mode", plain: "Looks intentional in both.", tech: "CSS variable tokens switched via class, verified contrast both ways.", status: "todo" }
      ]
    },
    {
      id: 11,
      name: "Ready for real use",
      plain: "Final checks before this goes live.",
      status: "todo",
      tasks: [
        { name: "SEO", plain: "Product pages, metadata, sitemap — findable on Google.", tech: "Next.js Metadata API per route, dynamic sitemap.xml, JSON-LD product schema.", status: "todo" },
        { name: "Deployment notes", plain: "Clear instructions for pushing it live.", tech: "README with vercel deploy steps, supabase db push, functions deploy list, required env vars.", status: "todo" }
      ]
    }
  ],

  log: [
    { time: "19 Aug 2026", text: "Project kicked off. Stack decided: Next.js 15 for SEO, Supabase (Edge Function-only architecture per the standing Supabase rule), Paystack, GSAP + Three.js for motion.", kind: "note" },
    { time: "19 Aug 2026", text: "App scaffolded (Next.js + TS + Tailwind v4), full library set installed, Supabase project linked, design.md / flow.md / memory.md written, this dashboard created.", kind: "done" },
    { time: "19 Aug 2026", text: "Full database schema written and pushed live via `supabase db push`: profiles, addresses, categories, products (with full-text search), variants, images, bundles, cart, orders, order items, status-event history, discounts. RLS enabled deny-all everywhere. Starter categories seeded.", kind: "done" },
    { time: "19 Aug 2026", text: "SETBACK, CAUGHT IMMEDIATELY: the first live test of the backend returned \"permission denied for table\" — service_role had RLS bypass but no explicit table GRANTs on the new tables. Fixed with a follow-up migration granting service_role full access plus default privileges for future tables; pushed and re-verified.", kind: "issue" },
    { time: "19 Aug 2026", text: "Built and deployed all 9 Edge Functions per the resource-based architecture rule: product, category, cart, orders, tracking, payments, auth-profile, admin-stats, send-email. Every one uses the shared { success, message, data, meta, errors } envelope.", kind: "done" },
    { time: "19 Aug 2026", text: "TESTED LIVE: curled /category and /product directly against the deployed functions — both return real data from the real database (7 seeded categories, empty product list as expected with nothing added yet).", kind: "done" },
    { time: "19 Aug 2026", text: "NEXT UP: the storefront — design tokens in globals.css, shared UI components, cart store, home/shop/product/cart/checkout/tracking pages, then the admin console and the GSAP/Three.js motion pass.", kind: "note" }
  ],

  blockers: [
    "Paystack API keys not yet provided — /payments/initialize and /payments/webhook are deployed and correctly return a 503 (\"Paystack is not configured yet\") until PAYSTACK_SECRET_KEY is set via `supabase secrets set`. Checkout can be built and tested up to the payment step, but real payments won't process until the keys arrive.",
    "No live preview will be run proactively per instruction — everything gets built end-to-end first, then handed over for you to test."
  ],

  decisions: [
    { q: "Framework: Next.js or Vite?", a: "Next.js 15 App Router — stronger native SEO (SSR/ISR, Metadata API, sitemap) than Vite for a public storefront.", open: false },
    { q: "How does order tracking work without an account?", a: "My call: order ID + email/phone lookup, no login required — matches the 'don't have to create an account' requirement.", open: true },
    { q: "How are bundles modeled?", a: "My call: bundle_items table referencing other products/variants with a price override, not a separate discount engine.", open: true },
    { q: "How are order emails sent on the free Supabase plan?", a: "My call: custom send-email Edge Function now, built swappable to a Node/SMTP microservice later without changing callers.", open: true }
  ]
};
