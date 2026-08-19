-- Livro Archive — commerce core.
-- Implements the model defined in flow.md and fixes four real defects in the first pass:
--   1. Stock was decremented at order creation (abandoned checkouts destroyed inventory).
--   2. Order numbers were random 4-digit suffixes — guaranteed collisions at low volume.
--   3. Order totals ignored shipping and discounts.
--   4. Nothing made notifications durable or retryable.

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Order lifecycle — align to the states defined in flow.md §2
-- ─────────────────────────────────────────────────────────────────────────
alter table public.orders drop constraint if exists orders_status_check;

update public.orders set status = 'ready_for_dispatch' where status = 'packed';

alter table public.orders add constraint orders_status_check check (
  status in (
    'pending_payment',
    'payment_failed',
    'paid',
    'processing',
    'ready_for_dispatch',
    'shipped',
    'out_for_delivery',
    'delivered',
    'cancelled',
    'refunded',
    'returned'
  )
);

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Collision-free order numbers: LIV-2026-00042
-- ─────────────────────────────────────────────────────────────────────────
create sequence if not exists public.order_number_seq start 1;

create or replace function public.next_order_number()
returns text
language sql
as $$
  select 'LIV-' || to_char(now(), 'YYYY') || '-' ||
         lpad(nextval('public.order_number_seq')::text, 5, '0');
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Order: idempotency, discounts, delivery (hybrid model — flow.md §6)
-- ─────────────────────────────────────────────────────────────────────────
alter table public.orders
  add column if not exists idempotency_key text unique,
  add column if not exists discount_code text,
  add column if not exists cancellation_reason text,
  add column if not exists delivery_method text not null default 'self'
    check (delivery_method in ('self', 'courier')),
  add column if not exists courier_name text,
  add column if not exists tracking_number text,
  add column if not exists delivery_agent_id uuid,
  add column if not exists dispatched_at timestamptz,
  add column if not exists delivered_at timestamptz;

create table if not exists public.delivery_agents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.orders
  drop constraint if exists orders_delivery_agent_id_fkey;
alter table public.orders
  add constraint orders_delivery_agent_id_fkey
  foreign key (delivery_agent_id) references public.delivery_agents(id) on delete set null;

-- ─────────────────────────────────────────────────────────────────────────
-- 4. Inventory: available = stock_on_hand − reserved  (flow.md §3)
--    `stock_quantity` keeps its name and now means stock ON HAND.
-- ─────────────────────────────────────────────────────────────────────────
alter table public.products
  add column if not exists reserved_quantity int not null default 0
    check (reserved_quantity >= 0);

alter table public.product_variants
  add column if not exists reserved_quantity int not null default 0
    check (reserved_quantity >= 0);

alter table public.products
  add column if not exists available_quantity int
  generated always as (greatest(stock_quantity - reserved_quantity, 0)) stored;

alter table public.product_variants
  add column if not exists available_quantity int
  generated always as (greatest(stock_quantity - reserved_quantity, 0)) stored;

-- A reservation is stock held for an in-flight checkout. It expires.
create table if not exists public.stock_reservations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  quantity int not null check (quantity > 0),
  status text not null default 'held' check (status in ('held', 'committed', 'released')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists stock_reservations_order_idx on public.stock_reservations(order_id);
create index if not exists stock_reservations_expiry_idx
  on public.stock_reservations(status, expires_at);

-- Every change to stock_on_hand is auditable — "why do we have 7 of these?"
create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  delta int not null,
  reason text not null check (reason in (
    'sale', 'restock', 'manual_adjustment', 'cancellation', 'return', 'correction'
  )),
  order_id uuid references public.orders(id) on delete set null,
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists inventory_movements_product_idx
  on public.inventory_movements(product_id, created_at desc);

-- ─────────────────────────────────────────────────────────────────────────
-- 5. Inventory functions — the only sanctioned way stock ever moves
-- ─────────────────────────────────────────────────────────────────────────

-- Reserve every line of an order. Returns false (and reserves nothing) if any line
-- lacks availability, so a checkout can never partially hold stock.
create or replace function public.reserve_order_stock(
  p_order_id uuid,
  p_ttl_minutes int default 30
)
returns boolean
language plpgsql
as $$
declare
  item record;
  avail int;
begin
  -- Already reserved (e.g. payment re-initialized) — treat as success, extend TTL.
  if exists (select 1 from public.stock_reservations
             where order_id = p_order_id and status = 'held') then
    update public.stock_reservations
    set expires_at = now() + make_interval(mins => p_ttl_minutes)
    where order_id = p_order_id and status = 'held';
    return true;
  end if;

  -- Availability check across all lines first, locking the rows.
  for item in
    select product_id, variant_id, sum(quantity) as qty
    from public.order_items
    where order_id = p_order_id
    group by product_id, variant_id
  loop
    if item.variant_id is not null then
      select (stock_quantity - reserved_quantity) into avail
      from public.product_variants where id = item.variant_id for update;
    else
      select (stock_quantity - reserved_quantity) into avail
      from public.products where id = item.product_id for update;
    end if;

    if avail is null or avail < item.qty then
      return false;
    end if;
  end loop;

  -- All lines available — hold them.
  for item in
    select product_id, variant_id, sum(quantity) as qty
    from public.order_items
    where order_id = p_order_id
    group by product_id, variant_id
  loop
    if item.variant_id is not null then
      update public.product_variants
      set reserved_quantity = reserved_quantity + item.qty
      where id = item.variant_id;
    else
      update public.products
      set reserved_quantity = reserved_quantity + item.qty
      where id = item.product_id;
    end if;

    insert into public.stock_reservations (order_id, product_id, variant_id, quantity, expires_at)
    values (p_order_id, item.product_id, item.variant_id, item.qty,
            now() + make_interval(mins => p_ttl_minutes));
  end loop;

  return true;
end;
$$;

-- Payment confirmed: reservation becomes a real sale.
create or replace function public.commit_order_stock(p_order_id uuid)
returns void
language plpgsql
as $$
declare
  res record;
begin
  for res in
    select * from public.stock_reservations
    where order_id = p_order_id and status = 'held'
  loop
    if res.variant_id is not null then
      update public.product_variants
      set stock_quantity = greatest(stock_quantity - res.quantity, 0),
          reserved_quantity = greatest(reserved_quantity - res.quantity, 0)
      where id = res.variant_id;
    else
      update public.products
      set stock_quantity = greatest(stock_quantity - res.quantity, 0),
          reserved_quantity = greatest(reserved_quantity - res.quantity, 0)
      where id = res.product_id;
    end if;

    insert into public.inventory_movements (product_id, variant_id, delta, reason, order_id)
    values (res.product_id, res.variant_id, -res.quantity, 'sale', p_order_id);

    update public.stock_reservations set status = 'committed' where id = res.id;
  end loop;
end;
$$;

-- Payment failed / abandoned: give the stock back to the shop.
create or replace function public.release_order_stock(p_order_id uuid)
returns void
language plpgsql
as $$
declare
  res record;
begin
  for res in
    select * from public.stock_reservations
    where order_id = p_order_id and status = 'held'
  loop
    if res.variant_id is not null then
      update public.product_variants
      set reserved_quantity = greatest(reserved_quantity - res.quantity, 0)
      where id = res.variant_id;
    else
      update public.products
      set reserved_quantity = greatest(reserved_quantity - res.quantity, 0)
      where id = res.product_id;
    end if;

    update public.stock_reservations set status = 'released' where id = res.id;
  end loop;
end;
$$;

-- Cancelled or returned after payment: put the physical stock back.
create or replace function public.restock_order(p_order_id uuid, p_reason text default 'cancellation')
returns void
language plpgsql
as $$
declare
  res record;
begin
  for res in
    select * from public.stock_reservations
    where order_id = p_order_id and status = 'committed'
  loop
    if res.variant_id is not null then
      update public.product_variants
      set stock_quantity = stock_quantity + res.quantity
      where id = res.variant_id;
    else
      update public.products
      set stock_quantity = stock_quantity + res.quantity
      where id = res.product_id;
    end if;

    insert into public.inventory_movements (product_id, variant_id, delta, reason, order_id)
    values (res.product_id, res.variant_id, res.quantity, p_reason, p_order_id);

    update public.stock_reservations set status = 'released' where id = res.id;
  end loop;
end;
$$;

-- Manual stock adjustment from the admin Inventory screen.
create or replace function public.adjust_stock(
  p_product_id uuid,
  p_variant_id uuid,
  p_delta int,
  p_note text,
  p_actor uuid
)
returns void
language plpgsql
as $$
begin
  if p_variant_id is not null then
    update public.product_variants
    set stock_quantity = greatest(stock_quantity + p_delta, 0)
    where id = p_variant_id;
  else
    update public.products
    set stock_quantity = greatest(stock_quantity + p_delta, 0)
    where id = p_product_id;
  end if;

  insert into public.inventory_movements
    (product_id, variant_id, delta, reason, note, created_by)
  values (p_product_id, p_variant_id, p_delta, 'manual_adjustment', p_note, p_actor);
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 6. Notifications as durable business events (flow.md §7)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  order_id uuid references public.orders(id) on delete cascade,
  recipient_email text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'dead')),
  attempts int not null default 0,
  last_error text,
  next_attempt_at timestamptz not null default now(),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  -- One notification per event per order: a retry can never double-send.
  unique (event_type, order_id)
);
create index if not exists notification_events_queue_idx
  on public.notification_events(status, next_attempt_at);

-- Records a business event. Safe to call repeatedly — the unique constraint makes it
-- idempotent, so a re-processed webhook never emails the customer twice.
create or replace function public.record_notification_event(
  p_event_type text,
  p_order_id uuid,
  p_payload jsonb default '{}'::jsonb
)
returns void
language plpgsql
as $$
declare
  v_email text;
  v_number text;
begin
  select contact_email, order_number into v_email, v_number
  from public.orders where id = p_order_id;

  if v_email is null then return; end if;

  insert into public.notification_events (event_type, order_id, recipient_email, payload)
  values (
    p_event_type,
    p_order_id,
    v_email,
    p_payload || jsonb_build_object('order_number', v_number)
  )
  on conflict (event_type, order_id) do nothing;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 7. Promotions (flow.md §4) — related products live now, rules are schema-only
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.related_products (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  related_product_id uuid not null references public.products(id) on delete cascade,
  relationship text not null default 'related'
    check (relationship in ('related', 'cross_sell', 'upsell')),
  sort_order int not null default 0,
  unique (product_id, related_product_id),
  check (product_id <> related_product_id)
);
create index if not exists related_products_product_idx on public.related_products(product_id);

-- Buy-X-get-Y and category-wide promotions: modelled now, no engine yet.
create table if not exists public.promotion_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('buy_x_get_y', 'category_discount', 'free_shipping')),
  config jsonb not null default '{}'::jsonb,
  is_active boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- 8. Rate limiting — stops order-number enumeration on public tracking
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.rate_limits (
  bucket text not null,
  identifier text not null,
  window_start timestamptz not null,
  count int not null default 1,
  primary key (bucket, identifier, window_start)
);

create or replace function public.check_rate_limit(
  p_bucket text,
  p_identifier text,
  p_max int,
  p_window_seconds int
)
returns boolean
language plpgsql
as $$
declare
  v_window timestamptz;
  v_count int;
begin
  v_window := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  insert into public.rate_limits (bucket, identifier, window_start, count)
  values (p_bucket, p_identifier, v_window, 1)
  on conflict (bucket, identifier, window_start)
    do update set count = public.rate_limits.count + 1
  returning count into v_count;

  delete from public.rate_limits where window_start < now() - interval '1 day';

  return v_count <= p_max;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 9. Scheduled jobs (flow.md §8) — cron supports reliability, never business logic
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.release_expired_reservations()
returns int
language plpgsql
as $$
declare
  v_order record;
  v_count int := 0;
begin
  for v_order in
    select distinct order_id
    from public.stock_reservations
    where status = 'held' and expires_at < now()
  loop
    perform public.release_order_stock(v_order.order_id);

    update public.orders
    set status = 'payment_failed', updated_at = now()
    where id = v_order.order_id and status = 'pending_payment';

    insert into public.order_status_events (order_id, status, note)
    select v_order.order_id, 'payment_failed', 'Checkout expired before payment was confirmed'
    where exists (
      select 1 from public.orders where id = v_order.order_id and status = 'payment_failed'
    );

    perform public.record_notification_event('payment_failed', v_order.order_id);
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

do $$
begin
  create extension if not exists pg_cron;

  perform cron.unschedule('livro-release-reservations')
    where exists (select 1 from cron.job where jobname = 'livro-release-reservations');
  perform cron.schedule(
    'livro-release-reservations', '*/5 * * * *',
    $cron$select public.release_expired_reservations();$cron$
  );
exception when others then
  raise notice 'pg_cron unavailable, scheduled jobs not installed: %', sqlerrm;
end $$;

-- ─────────────────────────────────────────────────────────────────────────
-- 10. New settings — still nothing store-wide hardcoded (flow.md §12.3)
-- ─────────────────────────────────────────────────────────────────────────
insert into public.settings (key, value, category, label, description, is_public) values
  ('reservation_ttl_minutes', '30', 'commerce', 'Checkout hold (minutes)',
   'How long stock is held for an in-flight checkout before being released back to the shop.', false),
  ('related_products_count', '4', 'commerce', 'Related products shown',
   'How many "you may also like" products appear on a product page.', true),
  ('free_shipping_threshold', '0', 'commerce', 'Free shipping over',
   'Order subtotal above which shipping is free. Set to 0 to disable.', true),
  ('notification_max_attempts', '5', 'notifications', 'Max email attempts',
   'How many times a failed notification is retried before it is marked dead.', false),
  ('enable_courier_delivery', 'true', 'fulfilment', 'Allow courier dispatch',
   'Show the third-party courier option when dispatching an order.', false),
  ('store_phone', '""', 'general', 'Store phone number',
   'Shown in the footer and on order emails.', true),
  ('store_address', '""', 'general', 'Store address',
   'Shown in the footer and on order emails.', true)
on conflict (key) do nothing;

-- ─────────────────────────────────────────────────────────────────────────
-- 11. Lock down and grant (RLS deny-all; service role only, per SUPABASE RULE)
-- ─────────────────────────────────────────────────────────────────────────
alter table public.stock_reservations enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.notification_events enable row level security;
alter table public.related_products enable row level security;
alter table public.promotion_rules enable row level security;
alter table public.delivery_agents enable row level security;
alter table public.rate_limits enable row level security;

grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
