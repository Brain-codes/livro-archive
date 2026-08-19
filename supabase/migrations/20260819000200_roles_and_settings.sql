-- Dynamic roles/permissions + a generic key/value settings store, so the admin never
-- has to touch code or the database directly to change store config or add a role.

-- ─────────────────────────────────────────────────────────────────────────
-- Roles: only Super Admin (is_super_admin = true) may create/edit other roles.
-- One monolithic admin UI reads `permissions` to decide what to show/allow per user —
-- there is no separate UI per role, just conditional rendering against this list.
-- ─────────────────────────────────────────────────────────────────────────
create table public.admin_roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  is_super_admin boolean not null default false,
  permissions text[] not null default '{}', -- e.g. {'products.manage','orders.manage','settings.manage'}
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- profiles.role stays as the coarse customer/staff split; admin_role_id carries the
-- fine-grained permission set for anyone with console access. A shopper never gets one.
alter table public.profiles
  add column admin_role_id uuid references public.admin_roles(id) on delete set null;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('customer','staff','admin'));

insert into public.admin_roles (name, slug, description, is_super_admin, permissions) values
  ('Super Admin', 'super-admin', 'Full, unrestricted access to every part of the console, including creating and editing other roles.', true, '{"*"}');

-- ─────────────────────────────────────────────────────────────────────────
-- Settings: generic key/value config so nothing store-wide requires a code change.
-- Read by /settings (public gets a filtered subset via `is_public`), written only by
-- someone with the 'settings.manage' permission (or super admin).
-- ─────────────────────────────────────────────────────────────────────────
create table public.settings (
  key text primary key,
  value jsonb not null,
  category text not null default 'general', -- groups fields into settings-page segments
  label text not null,
  description text,
  is_public boolean not null default false, -- safe to expose to the storefront (no secrets)
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

insert into public.settings (key, value, category, label, description, is_public) values
  ('site_name', '"Livro Archive"', 'general', 'Site name', 'Shown in the header, footer and page titles.', true),
  ('site_tagline', '"Books, stationery & everything in between"', 'general', 'Tagline', 'Short line used in the hero and meta description.', true),
  ('support_email', '"hello@livroarchive.com"', 'general', 'Support email', 'Shown in the footer and order emails.', true),
  ('default_currency', '"NGN"', 'commerce', 'Default currency', 'ISO currency code used across the storefront.', true),
  ('low_stock_threshold', '5', 'commerce', 'Low stock threshold', 'Products at or below this quantity are flagged on the admin dashboard.', false),
  ('flat_shipping_fee', '0', 'commerce', 'Flat shipping fee', 'Applied at checkout until zone-based shipping is configured.', true),
  ('stuck_order_hours', '72', 'commerce', 'Stuck-order window (hours)', 'How long an order can sit at shipped/out-for-delivery before it is flagged for follow-up.', false),
  ('social_links', '{"instagram":"","twitter":"","facebook":""}', 'general', 'Social links', 'Shown in the footer when set.', true),
  ('theme_default_mode', '"system"', 'appearance', 'Default theme', '"light", "dark" or "system".', true);

alter table public.admin_roles enable row level security;
alter table public.settings enable row level security;
grant all privileges on public.admin_roles to service_role;
grant all privileges on public.settings to service_role;
