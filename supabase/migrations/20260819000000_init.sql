-- Livro Archive — initial schema
-- Books + stationery e-commerce. RLS is deny-all everywhere; all access goes through
-- Edge Functions using the service role key, per the project's Supabase architecture rule.

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ─────────────────────────────────────────────────────────────────────────
-- Profiles (extends auth.users). Accounts are optional for shoppers.
-- ─────────────────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer','staff','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  label text,
  full_name text not null,
  phone text not null,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  country text not null default 'Nigeria',
  postal_code text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index addresses_profile_idx on public.addresses(profile_id);

-- ─────────────────────────────────────────────────────────────────────────
-- Catalog
-- ─────────────────────────────────────────────────────────────────────────
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  parent_id uuid references public.categories(id) on delete set null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text,
  description text,
  author text,
  isbn text,
  product_type text not null default 'book' check (product_type in ('book','stationery','other')),
  category_id uuid references public.categories(id) on delete set null,
  base_price numeric(12,2) not null check (base_price >= 0),
  compare_at_price numeric(12,2),
  currency text not null default 'NGN',
  stock_quantity int not null default 0 check (stock_quantity >= 0),
  sku text unique,
  status text not null default 'draft' check (status in ('draft','active','archived')),
  is_featured boolean not null default false,
  search_vector tsvector,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on public.products(category_id);
create index products_status_idx on public.products(status);
create index products_search_idx on public.products using gin(search_vector);
create index products_title_trgm_idx on public.products using gin(title gin_trgm_ops);

create function public.products_search_vector_update() returns trigger as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.author,'')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.subtitle,'')), 'C') ||
    setweight(to_tsvector('english', coalesce(new.description,'')), 'D');
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger products_search_vector_trigger
  before insert or update on public.products
  for each row execute function public.products_search_vector_update();

-- Variants (e.g. paperback vs hardcover, notebook colour) — optional per product.
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,               -- e.g. "Hardcover", "Blue"
  sku text unique,
  price_override numeric(12,2),
  stock_quantity int not null default 0 check (stock_quantity >= 0),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index product_variants_product_idx on public.product_variants(product_id);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  alt text,
  sort_order int not null default 0
);
create index product_images_product_idx on public.product_images(product_id);

-- ─────────────────────────────────────────────────────────────────────────
-- Bundles — "buy this, add these at a discount / free"
-- ─────────────────────────────────────────────────────────────────────────
create table public.bundles (
  id uuid primary key default gen_random_uuid(),
  primary_product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index bundles_primary_product_idx on public.bundles(primary_product_id);

create table public.bundle_items (
  id uuid primary key default gen_random_uuid(),
  bundle_id uuid not null references public.bundles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  quantity int not null default 1 check (quantity > 0),
  price_override numeric(12,2), -- null = full price, 0 = free, else discounted bundle price
  sort_order int not null default 0
);
create index bundle_items_bundle_idx on public.bundle_items(bundle_id);

-- ─────────────────────────────────────────────────────────────────────────
-- Carts (server-side snapshot once checkout starts; client cart is Zustand/localStorage)
-- ─────────────────────────────────────────────────────────────────────────
create table public.carts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  session_token text unique, -- guest identifier
  status text not null default 'active' check (status in ('active','converted','abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  bundle_id uuid references public.bundles(id) on delete set null,
  quantity int not null check (quantity > 0),
  unit_price numeric(12,2) not null,
  created_at timestamptz not null default now()
);
create index cart_items_cart_idx on public.cart_items(cart_id);

-- ─────────────────────────────────────────────────────────────────────────
-- Orders — guest checkout is first-class (profile_id nullable)
-- ─────────────────────────────────────────────────────────────────────────
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique, -- human-friendly, e.g. LA-20260819-0001
  profile_id uuid references public.profiles(id) on delete set null,
  contact_email text not null,
  contact_phone text not null,
  shipping_address jsonb not null,
  status text not null default 'pending_payment' check (
    status in ('pending_payment','paid','processing','packed','shipped','out_for_delivery','delivered','cancelled','refunded')
  ),
  subtotal numeric(12,2) not null,
  discount_total numeric(12,2) not null default 0,
  shipping_fee numeric(12,2) not null default 0,
  total numeric(12,2) not null,
  currency text not null default 'NGN',
  payment_provider text not null default 'paystack',
  payment_reference text unique,
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_profile_idx on public.orders(profile_id);
create index orders_email_idx on public.orders(contact_email);
create index orders_status_idx on public.orders(status);
create unique index orders_lookup_idx on public.orders(order_number, contact_email);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  bundle_id uuid references public.bundles(id) on delete set null,
  title_snapshot text not null,
  quantity int not null check (quantity > 0),
  unit_price numeric(12,2) not null,
  line_total numeric(12,2) not null
);
create index order_items_order_idx on public.order_items(order_id);

create table public.order_status_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index order_status_events_order_idx on public.order_status_events(order_id);

-- ─────────────────────────────────────────────────────────────────────────
-- Discounts (simple coupon support, separate from bundle pricing)
-- ─────────────────────────────────────────────────────────────────────────
create table public.discounts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  kind text not null check (kind in ('percent','fixed')),
  value numeric(12,2) not null,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  max_uses int,
  used_count int not null default 0,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- RLS — deny-all by default. Every table only reachable via service-role Edge Functions.
-- ─────────────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.bundles enable row level security;
alter table public.bundle_items enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_events enable row level security;
alter table public.discounts enable row level security;
-- No policies are created: RLS enabled with zero policies = deny-all for anon/authenticated.
-- The service role bypasses RLS entirely, which is how Edge Functions read/write.

-- ─────────────────────────────────────────────────────────────────────────
-- Seed: starter categories
-- ─────────────────────────────────────────────────────────────────────────
insert into public.categories (name, slug, sort_order) values
  ('Fiction', 'fiction', 1),
  ('Non-Fiction', 'non-fiction', 2),
  ('Children''s Books', 'childrens-books', 3),
  ('Textbooks', 'textbooks', 4),
  ('Notebooks & Journals', 'notebooks-journals', 5),
  ('Writing & Drawing', 'writing-drawing', 6),
  ('Classroom Supplies', 'classroom-supplies', 7);
