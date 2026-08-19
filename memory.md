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

## Credentials on file
- Supabase URL: `https://buezylclznarpsawhiok.supabase.co`
- Supabase project ref: `buezylclznarpsawhiok`
- Anon key: stored in `.env.local` (see `.env.example` for the shape) — never commit
  `.env.local`.
- Paystack keys: not yet provided — user said credentials come later. Payment edge
  function is being built to read `PAYSTACK_SECRET_KEY` from env; will not work until
  supplied.

## Design system — single source of truth (user feedback, mid-build)
- Every color, font, and commonly-reused size lives ONLY as a CSS variable / `@theme`
  token in `src/app/globals.css` (see `design.md` §1). Components consume them via
  Tailwind utilities generated from those tokens (`bg-canvas`, `text-ink`,
  `text-ink-muted`, `bg-primary`, `font-display`, etc.) — never raw hex, never a
  one-off px value for something that already has a token. Change a color or font in
  one place (`globals.css`) and it updates everywhere, admin included — the admin
  console deliberately reuses the storefront's tokens rather than a separate palette
  (unlike the Afrojazz admin, which intentionally forked its own — Livro Archive does
  not do that). Only truly one-off/rare values may be hardcoded inline, and only when
  no token fits.

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
