# Livro Archive — Design System

Livro Archive is a books-and-stationery e-commerce platform. The brief: award-winning
(Awwwards-tier) feel, but realistic and usable — rich, soothing, not neon, not punk, not
gendered. Editorial-bookstore warmth meets modern SaaS polish. Must hold up in both light
and dark mode.

---

## 1. Design tokens

### Brand palette (v2 — revised after design review)

An editorial, near-monochrome palette (warm paper + near-black ink, like a printed
book) with one confident accent — oxblood/burgundy — used deliberately rather than
scattered. Replaced the original terracotta/gold pairing, which read too "craft shop."

| Token | Light value | Dark value | Use |
|---|---|---|---|
| `--color-canvas` | `#F7F5F0` | `#0B0A09` | Page background — warm paper / warm near-black |
| `--color-surface` | `#FFFFFF` | `#17130F` | Cards, raised panels |
| `--color-surface-muted` | `#EEEAE1` | `#201A15` | Secondary panels, table stripes |
| `--color-ink` | `#16130F` | `#F5F1E9` | Primary text |
| `--color-ink-muted` | `#6E675C` | `#A89D8C` | Secondary text |
| `--color-border` | `#E1DBCD` | `#2C2419` | Hairlines |
| `--color-primary` | `#7A2230` | `#E08A7D` | Oxblood — primary actions, links |
| `--color-primary-ink` | `#5C1A24` | `#F2B2A8` | Primary text-on-light / accents |
| `--color-accent` | `#2F5D50` | `#6FA98C` | Secondary accent — deep green (in-stock, success) |
| `--color-gold` | `#A67C3D` | `#D9AC5C` | Highlights, ratings, bundle badges |
| `--color-danger` | `#B3432E` | `#E2745A` | Errors, destructive actions |

These live as CSS variables in `globals.css` under `@theme`, consumed via Tailwind v4
utilities (`bg-canvas`, `text-ink`, etc.) — never raw hex in components. Because
everything is token-driven, changing the palette again only ever means editing
`globals.css`; nothing else should hardcode a color.

### Typography (v2)

| Role | Family | Notes |
|---|---|---|
| Display / headings | **Cormorant Garamond** (serif, italic available) | Editorial, literary, higher-contrast strokes than the earlier Fraunces — the "book jacket" feel. Rendered at `font-weight: 600` by default (the thin 400 weight reads too delicate below hero size). |
| Body / UI | **Inter** | Neutral, highly legible at small sizes |
| Numeric / price | Inter, `tabular-nums` | Prices never jitter |

Scale: `text-5xl/6xl` hero, `text-3xl` section headers, `text-lg` card titles (bumped
from `text-base` — Cormorant needs more size to stay legible at card scale), `text-sm`
body, `text-xs` meta/labels.

### Geometry

- Cards: `rounded-2xl`, soft shadow in light mode, `ring-1 ring-white/5` in dark mode
- Buttons/inputs: `rounded-full` for primary CTAs, `rounded-xl` for inputs and secondary
  buttons — pill-only everywhere reads too "app-like" for a bookstore
- Generous whitespace; 8pt spacing scale
- Book covers: subtle `rotate-[-1deg]`/`rotate-[1deg]` on hover for a tactile, shelf feel

### Motion (GSAP + Three.js, used deliberately — not decoration for its own sake)

- **Hero**: GSAP ScrollTrigger-driven parallax of stacked book illustrations/covers;
  a single lazy-loaded Three.js scene (a slowly rotating open book / floating pages)
  gated behind `prefers-reduced-motion` and a capability check, same pattern as the
  Turf Ball build's 3D gating
- **Page transitions**: soft fade + 8px rise, 250–350ms, `power2.out`
- **Product grid**: stagger-in on scroll (GSAP ScrollTrigger, batched), FLIP reorder for
  filter/sort changes
- **Cart drawer**: spring-in slide, item add gets a small "flight" animation from the
  clicked card into the cart icon
- **Micro-interactions**: button press scale (0.97), price count-up on discount reveal
- Everything above respects `prefers-reduced-motion: reduce` — motion is a garnish, not
  a requirement for comprehension

### Accessibility

- Never convey status by color alone (stock badges pair icon + text)
- Contrast checked against both canvas tones (paper / near-black)
- Focus ring: `ring-2 ring-primary/60 ring-offset-2 ring-offset-canvas`

---

## 2. Layout structure — public site

```
src/app/(site)/layout.tsx        → SiteHeader, CartDrawerProvider, SiteFooter
  page.tsx                        → Home (hero, featured, bundles, categories)
  shop/page.tsx                   → Catalog (filters, sort, grid)
  shop/[category]/page.tsx        → Category listing
  product/[slug]/page.tsx         → PDP (gallery, price, bundle upsell, reviews)
  cart/page.tsx                   → Full cart view
  checkout/page.tsx               → Guest or authenticated checkout
  checkout/success/page.tsx       → Order confirmation
  track/page.tsx                  → Order lookup by order ID + email
  track/[orderId]/page.tsx        → Live tracking timeline
  account/*                       → Optional account area (orders, addresses, profile)
  auth/*                          → Sign in / sign up / reset
```

## 3. Admin console

```
src/app/(admin)/admin/layout.tsx  → Auth gate, AdminShell (sidebar + topbar)
  dashboard/                      → KPIs, revenue, recent orders
  products/                       → Product + variant + bundle manager
  inventory/                      → Stock levels, low-stock alerts
  orders/                         → Order manager, status updates, manual tracking events
  categories/
  discounts/
  customers/
  settings/                       → Store settings, shipping zones, SMTP/notification config
```

Admin reuses the same token system as the public site (no separate brand palette this
time — one cohesive system), but denser layout: `text-sm` default, tighter padding,
`rounded-xl` cards instead of `2xl`.

---

## 4. Product & bundling model (drives the UI)

- A product can declare `bundle_items`: other products/variants attached at a discounted
  bundle price (e.g. novel + notebook + marker). Shown on the PDP as an "Frequently
  paired" / "Complete the set" module with a single toggle to add the whole bundle.
- Cart line items carry an optional `bundle_id` so bundle-sourced items are visually
  grouped in the cart drawer.
- Free/add-on items (e.g. "comes with a free marker") are modeled as bundle items with
  `price_override = 0`, not a separate discount system.

## 5. Reference components (to be built once in `src/components/ui/`)

Button, IconButton, Input, Select, Field, Badge (Tone: success/warning/danger/info/gold),
Card, Modal/Sheet, Toast (via `sonner`), Skeleton, EmptyState, PriceTag, StarRating,
QuantityStepper, StatCard, TableWrap/Th/Td/Tr, ProgressTimeline (order tracking).

---

## 6. Key files (to be created)

| File | Role |
|---|---|
| `src/app/globals.css` | Token definitions, dark-mode variant |
| `src/components/ui/*` | Shared primitives |
| `src/lib/supabase/client.ts` / `server.ts` | Supabase browser/server clients (auth only — no direct table access, see Supabase rules) |
| `src/lib/api/*` | Typed wrappers calling Edge Functions per resource |
| `src/store/cart.ts` | Zustand cart store (persisted, guest-friendly) |
| `supabase/functions/*` | One Edge Function per resource, internally routed |
| `supabase/migrations/*` | SQL migrations (deployed via `supabase db push`) |
