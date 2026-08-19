# Livro Archive — Design System

The source of truth for how Livro Archive looks. One system covers the storefront **and**
the admin console — change a token here and both follow.

**Direction:** modern Scandinavian-retail commerce (referenced against skanvi.com), adapted
for a bookshop. Warm cream canvas, near-black type, one confident forest green, tight
grotesque headlines, pill controls, generous whitespace. Premium and calm — not neon, not
brutalist, not gendered.

---

## 1. Tokens — the only place colour and type are defined

Everything lives in [`src/app/globals.css`](src/app/globals.css) as CSS variables exposed
through Tailwind v4 `@theme`. Components use the generated utilities (`bg-canvas`,
`text-ink`, `bg-forest`, `font-display`) and **never raw hex**.

### Surfaces

| Token | Light | Dark | Use |
|---|---|---|---|
| `canvas` | `#FDF6EC` | `#12130F` | Page background — warm cream paper |
| `surface` | `#FFFFFF` | `#1A1C17` | Cards, inputs, raised panels |
| `surface-muted` | `#F2EDE3` | `#22251E` | Hero type panel, image wells, hover fills |
| `surface-sunken` | `#EFECE6` | `#191B15` | Footer, newsletter band, console background |

### Ink

| Token | Light | Dark | Use |
|---|---|---|---|
| `ink` | `#1A1A18` | `#F4F1E8` | Primary text |
| `ink-muted` | `#6B6B63` | `#A8A89B` | Secondary text |
| `ink-faint` | `#9A9A90` | `#7C7C71` | Meta, placeholders, timestamps |
| `border` | `#E6DFD2` | `#2E3128` | Hairlines |
| `border-strong` | `#D5CBB8` | `#3D4136` | Outline buttons, focused edges |

### Brand & accent

| Token | Light | Dark | Use |
|---|---|---|---|
| `forest` | `#2F4F3E` | `#8FB8A1` | **Primary action.** CTA pills, active nav, charts |
| `forest-deep` | `#24402F` | `#A9CBB8` | Primary hover, mega-menu ground |
| `sage` | `#7E9E8E` | `#7E9E8E` | The full-bleed featured band |
| `sage-soft` | `#B9CEC3` | `#46564C` | Mega-menu links, soft info fills |
| `clay` | `#C96F4A` | `#E08A63` | Low stock, badges, saved-heart fill |
| `gold` | `#B08238` | `#D2A75D` | Bundles, "featured", warnings |
| `danger` | `#B3432E` | `#E2745A` | Errors, destructive |
| `success` | `#2F6D4F` | `#7CB894` | Paid, delivered, healthy stock |
| `on-dark` | `#F7F3EA` | `#F7F3EA` | Text on forest/sage surfaces |

Dark mode is a real design, not an inversion: the canvas goes warm near-black, and
`forest` **lightens** so it still reads as the action colour against it.

### Typography

| Role | Family | Notes |
|---|---|---|
| Display | **Archivo** 600 | Headlines, page titles, prices in hero. `letter-spacing: -0.03em`, `line-height: 1.04` — tight and confident |
| Body / UI | **Inter** 400/500 | Everything else |
| Numerals | Inter + `tabular-nums` | Prices, counts and stock never jitter |

`h1–h3` and `.font-display` pick up Archivo automatically. Sizes are fluid:
`text-[clamp(38px,5vw,68px)]` hero, `clamp(30px,4.2vw,54px)` section, `clamp(26px,3.6vw,44px)`
product title.

**`.eyebrow`** is a global utility — 11px, 600, `0.14em` tracking, uppercase, `ink-muted`.
It sits above nearly every section heading.

### Geometry & motion

- Buttons and status pills: **fully round** (`rounded-full`)
- Cards, images, panels: `rounded-xl` (12px) / `rounded-2xl` (16px)
- Console panels and inputs: `rounded-lg` (8px) — denser than the storefront
- Focus: `ring-2 ring-forest/50 ring-offset-2 ring-offset-canvas` on every control
- Transitions 200–300ms; image hovers up to 700ms; press feedback `active:scale-[0.98]`
- `prefers-reduced-motion` kills all of it globally in `globals.css`

---

## 2. Storefront anatomy

The homepage sequence, in order:

1. **Header** (`SiteHeader`) — wordmark, centred pill search, account/saved/basket icon
   buttons. Second row: icon nav that opens the mega-menu, plus a forest "Track your
   order" pill on the right.
2. **Mega-menu** (`MegaMenu`) — full-screen `forest-deep` overlay, category links at
   `clamp(28px,5.2vw,64px)` in `sage-soft`, an oversized ghosted "Livro" wordmark bleeding
   off the bottom, GSAP stagger in, Escape to close.
3. **Hero** (`Hero`) — 44/34/22 grid. A `surface-muted` type panel butted **flush** against
   a tall image, then a shorter image inset and dropped lower. Each image carries a cream
   label pill bottom-right. Real products, so the first thing you see is buyable.
4. **Category rail** (`CategoryRail`) — cutouts floating directly on the canvas, no cards,
   centred labels, circular arrows overlapping the rail edges that fade at either end.
5. **Editorial bento** (`EditorialGrid`) — one tall panel plus two stacked. Artwork is
   washed with `forest-deep/70` + a bottom gradient so it reads as atmosphere and the
   panel's own headline stays loudest.
6. **Featured band** (`FeaturedRail`) — full-bleed `sage`. Cards switch to the cream
   surface via the `onSurface` prop.
7. **Trust bar** (`TrustBar`) — three promises, divided, no icons.
8. **Newsletter** (`Newsletter`) — forest card, sage panel on the left, pill email capture.
9. **Footer** (`SiteFooter`) — wordmark + tagline, four link columns, payment strip, theme
   toggle.

### Product card (`ProductCard`)

The most repeated object on the site, so it is strict:

- `aspect-[3/4]` image well (book covers are portrait — square crops decapitate them)
- Availability pill top-left: **Available** / **Only N left** (clay) / **Sold out**
- Wishlist heart top-right, filled clay when saved
- Meta line, right-aligned, `ink-faint` — author, or the product type for stationery
- Title (2-line clamp) and price on one row; `min-h-[68px]` so buttons align across a grid
- Full-width outline "View details" pill, pushed to the bottom with `mt-auto`

---

## 3. Console anatomy

Same tokens, denser: `text-[13px]` base, `rounded-lg`, 4/8px rhythm, hairline tables.

- **Shell** (`AdminShell`) — 264px sidebar on `surface`, nav in three labelled groups
  (Operations / Catalogue / Configuration), active item gets a forest tint plus a 3px left
  bar, an action-count badge on Orders, an access card and sign-out pinned at the bottom.
  Top bar carries search, a storefront link, notifications and the signed-in identity.
- **Primitives** (`components/admin/ui.tsx`) — `Panel`, `PanelHeader`, `PageHeader`,
  `StatCard`, `StatusPill`, `TableWrap`/`Th`/`Td`, `EmptyState`, `TableSkeleton`.
- **StatCard** — the lead metric on any screen is `featured`: filled forest, white numerals.
  Everything else is a white card. Deltas are small tinted pills with a direction arrow.
- **Charts** (`components/admin/charts.tsx`) — hand-rolled SVG, no charting library:
  `RevenueArea`, `StatusBars`, `Gauge`. Each carries `role="img"` and a text `aria-label`
  summary, and falls back to a written empty state rather than an empty axis frame.
- **Order drawer** (`OrderDrawer`) — right-hand panel: customer, items with totals,
  dispatch method and tracking, status control, and the full status history. Lets an
  operator work an order without losing their place in the list.

**One console, every role.** Nav and screens are filtered with `can(user, permission)` —
never a separate design or route tree per role.

---

## 4. Placeholder imagery

`public/covers/*.svg` are generated by
[`scripts/generate-covers.mjs`](scripts/generate-covers.mjs) — flat on-brand book jackets
and stationery cards drawn from the palette above. They exist so layout can be judged
honestly; **replace them with real photography before launch** by updating
`product_images.url`, which is a data change, not a code change.

`next.config.ts` sets `dangerouslyAllowSVG` for these. That is safe only because they are
first-party files we generate — never enable it for user uploads.

---

## 5. Accessibility rules

- Status is never colour alone — every pill pairs colour with a word
- Contrast checked in both themes; `forest` lightens in dark mode for exactly this reason
- Focus rings on every interactive element; `cursor-pointer` on everything clickable
- Charts expose text summaries; tables have real `<th>` scope
- All motion respects `prefers-reduced-motion`
- Theme toggle offers light / system / dark, with a blocking init script in
  `layout.tsx` so there is no flash of the wrong theme

---

## 6. Key files

| File | Role |
|---|---|
| [`src/app/globals.css`](src/app/globals.css) | **All tokens.** The single source of truth |
| [`src/components/ui/`](src/components/ui) | Shared primitives — Button, Badge, Field, Card |
| [`src/components/site/`](src/components/site) | Storefront composition |
| [`src/components/admin/ui.tsx`](src/components/admin/ui.tsx) | Console primitives |
| [`src/components/admin/charts.tsx`](src/components/admin/charts.tsx) | Hand-rolled SVG charts |
| [`scripts/generate-covers.mjs`](scripts/generate-covers.mjs) | Placeholder cover art |
