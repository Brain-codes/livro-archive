# Livro Archive — Build Memory

Persistent notes across sessions. Read this first when resuming work.

## Stack decisions
- **Next.js 15** (App Router, `src/` dir, Tailwind v4) — chosen over Vite for SEO
  (SSR/ISR product pages, sitemap, metadata API). Deploying to Vercel free tier.
- **Supabase**: Postgres + Auth + Storage + pg_cron. Client code NEVER queries tables
  directly — everything goes through Edge Functions, one per resource, internally
  routed via `index.ts` (see `SUPABASE RULE.txt` at the parent folder for the full
  architecture rule — it applies to this project).
- **Migrations**: written locally in `supabase/migrations/`, deployed with
  `supabase db push` (CLI is installed and confirmed working for this project).
- **Edge functions**: deployed with `supabase functions deploy <name>`.
- **Payments**: Paystack.
- **Animation**: GSAP (ScrollTrigger) for scroll/UI motion, Three.js via
  `@react-three/fiber`/`drei` for one hero 3D moment — gated on
  `prefers-reduced-motion` and lazy-loaded, same pattern proven on The Turf Ball.
- **Cart**: Zustand, persisted, guest-first.

## Admin access
Two Super Admin accounts (full `*` permissions), both email-pre-confirmed via
migration so they can sign in immediately at `/auth/sign-in` and reach `/admin`:
- `adenugaadewumi01@gmail.com` / `Admin@1234`
- `emmany4567@gmail.com` / `Admin@1234`

## Pricing model — wholesale vs retail
The supplied inventory sheet carries a wholesale AND a retail figure per title.
- `products.base_price` = **retail** (what the customer pays)
- `products.cost_price` = **wholesale** (cost of goods, never shown to customers)
Wholesale deliberately does NOT go in `compare_at_price`: a struck-through wholesale
price would tell customers they could once have bought at cost. `compare_at_price`
stays reserved for genuine former retail prices.

## Catalogue state
- **Real opening stock**: 20 business/self-help titles from the user's sheet, loaded by
  `20260819000800_real_catalogue.sql` into Non-Fiction, all active and featured-flagged
  where appropriate. `stock_quantity` is a PLACEHOLDER of 10 per title — the sheet had
  no quantities. Real counts must be set in the console under Inventory.
- **Placeholder books are drafted, not deleted.** The 29 seeded fiction/textbook/
  children's titles were set to `status = 'draft'` when real stock arrived, so the shop
  shows only real inventory. Restore with a single UPDATE (the migration documents it).
- **Placeholder stationery stays active** (15 items) — the shop genuinely sells
  stationery and the bundles reference it.
- Category strips/rails filter to categories that have active products, and the
  homepage editorial panels are derived from stocked categories, so drafting things
  out never leaves empty tiles or a hole in the layout.

## Design system — v3, Skanvi-referenced (two rejected attempts before this)
- v1 (terracotta/gold + Fraunces) and v2 (oxblood + Cormorant Garamond) were both
  rejected by the user as not good enough / bland. **Do not go back to either.**
- v3 is modelled on **skanvi.com**, which the user supplied as the explicit reference
  along with screenshots in `design ideas/` (storefront) and
  `design ideas/dashboard design ideas/` (console). Warm cream canvas `#FDF6EC`,
  near-black ink, one forest green `#2F4F3E`, sage `#7E9E8E` band, **Archivo** display
  + **Inter** body, pill controls. Full spec and component anatomy in `design.md`.
- Storefront sections deliberately mirror the reference: flush hero panel + two offset
  images with bottom-right label pills; "What are you looking for?" cutout rail with
  edge arrows; editorial bento (1 tall + 2 stacked, text bottom-left over a wash);
  full-bleed sage featured band; forest newsletter card; four-column footer.
- The console follows the dashboard screenshots: grouped sidebar, a *featured* forest
  KPI card leading the row, hand-rolled SVG charts, and an order **detail drawer** on
  the right of a dense table.
- Everything is token-driven — a palette change is one file (`globals.css`).

## Placeholder imagery
- `scripts/generate-covers.mjs` generates 44 flat SVG book jackets / stationery cards
  into `public/covers/`, applied to the DB by migration `20260819000700`. Random
  picsum photos made a bookshop look like a travel blog. Replace with real photography
  by updating `product_images.url` — no code change needed.
- `next.config.ts` enables `dangerouslyAllowSVG` **only** because these are
  first-party generated files. Never enable it for user uploads.

## Gotcha: stale Next.js data cache
- `next build` reuses `.next/cache` fetch results across builds. After changing data
  in Supabase, a plain rebuild can still serve the old payload. `rm -rf .next` before
  rebuilding when verifying data changes. Also: kill the old `next start` before
  starting a new one, or you silently keep hitting the stale server.

## Credentials on file
- Supabase URL: `https://buezylclznarpsawhiok.supabase.co`
- Supabase project ref: `buezylclznarpsawhiok`
- Anon key: stored in `.env.local` (see `.env.example` for the shape) — never commit
  `.env.local`.
- Paystack keys: not yet provided — user said credentials come later. Payment edge
  function is being built to read `PAYSTACK_SECRET_KEY` from env; will not work until
  supplied.

## Architecture correction (user feedback, mid-build)
- **No hardcoded store config.** Anything store-wide — currency, shipping fee,
  low-stock threshold, stuck-order window, site name/tagline, support email, social
  links, default theme — lives in the `settings` table (key/value + category, seeded
  in `20260819000200_roles_and_settings.sql`) and is edited from an admin Settings page
  segmented by `category`, never by editing code or the database directly. Exposed via
  the `/settings` Edge Function: `GET /settings` returns the public subset for the
  storefront, `GET /settings/all` + `PATCH /settings/:key` are gated on the
  `settings.manage` permission.
- **Multi-role from day one, monolithic UI.** `admin_roles` is a real table (name,
  slug, permissions text[], is_super_admin) — not a hardcoded enum. Only a Super Admin
  (`is_super_admin = true`) can create/edit roles or assign them to a profile, via the
  `/roles` Edge Function (locked to `caller.isSuperAdmin`, no permission string can
  substitute for it). `_shared/auth.ts`'s `getCallerFromRequest` resolves the caller's
  `admin_roles.permissions`; `can(user, "x.manage")` is the check every admin-scoped
  handler uses (see product/category/orders/admin-stats). **There is one admin
  console UI, not one per role** — every screen and nav item is shown/hidden with a
  plain `can()`/permission check, the same pattern as if/else, never a separate
  design or route tree per role. Seeded role: "Super Admin" with `permissions: ['*']`.

## Open decisions (my calls, flag if wrong)
- Order lookup for tracking is order-ID + email/phone, no auth required — matches the
  "don't have to create an account" requirement while still gating who can see an order.
- Bundles modeled as `bundle_items` referencing other products/variants with a
  price override, not a separate discount engine — simplest way to support "buy this,
  add these for less / free."
- v1 notification email goes through a custom `send-email` edge function rather than
  external ESPs (SendGrid etc. explicitly ruled out) — swappable to a Node/SMTP
  microservice later without touching call sites.

## Progress
Tracked live in `dashboard/index.html` + `dashboard/progress-data.js` (same pattern as
The Turf Ball's build dashboard). Update `progress-data.js` as work lands — do not edit
`index.html` for status changes.

## Rules to always follow in this repo
1. No direct `supabase.from(...)` calls from app code — Edge Functions only.
2. One edge function per resource (`/product`, `/cart`, `/orders`, `/payments`,
   `/tracking`, `/auth-profile`, `/admin-*`), internally routed.
3. Standard response envelope on every edge function:
   `{ success, message, data, meta, errors }`.
4. Never run a live preview / dev server proactively — user said they'll test
   everything themselves once told it's ready. (If a future session needs to verify UI,
   ask first.)
5. Design tokens only via CSS variables in `globals.css` / Tailwind theme — no raw hex
   in components.
