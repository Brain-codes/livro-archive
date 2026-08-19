-- Notification dispatch schedule + the permission vocabulary the console gates on.

-- ─────────────────────────────────────────────────────────────────────────
-- Drain the notification queue every 2 minutes.
-- Uses pg_net so Postgres can reach the Edge Function that owns transport.
-- ─────────────────────────────────────────────────────────────────────────
do $$
declare
  v_url text;
  v_key text;
begin
  create extension if not exists pg_net;

  -- Read from Vault if present, otherwise skip — the job is re-schedulable any time.
  begin
    select decrypted_secret into v_url from vault.decrypted_secrets where name = 'project_url';
    select decrypted_secret into v_key from vault.decrypted_secrets where name = 'service_role_key';
  exception when others then
    v_url := null;
  end;

  if v_url is null or v_key is null then
    raise notice 'Vault secrets (project_url / service_role_key) not set — notification cron not scheduled. Run supabase/scripts/schedule-notifications.sql after adding them.';
    return;
  end if;

  perform cron.unschedule('livro-dispatch-notifications')
    where exists (select 1 from cron.job where jobname = 'livro-dispatch-notifications');

  perform cron.schedule(
    'livro-dispatch-notifications',
    '*/2 * * * *',
    format(
      $job$select net.http_post(
        url := %L,
        headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || %L),
        body := '{}'::jsonb
      );$job$,
      v_url || '/functions/v1/notifications/dispatch',
      v_key
    )
  );
exception when others then
  raise notice 'Could not schedule notification dispatch: %', sqlerrm;
end $$;

-- ─────────────────────────────────────────────────────────────────────────
-- Permission vocabulary. Roles are data, not code (flow.md §10) — this simply
-- records the permission strings the console understands so the Roles screen can
-- offer them, and tops up Super Admin, which holds the '*' wildcard regardless.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.permission_catalog (
  key text primary key,
  label text not null,
  description text not null,
  sort_order int not null default 0
);

insert into public.permission_catalog (key, label, description, sort_order) values
  ('stats.view',        'View dashboard',      'See revenue, order counts and what needs attention.', 1),
  ('orders.manage',     'Manage orders',       'View orders, update statuses, arrange dispatch.', 2),
  ('products.manage',   'Manage products',     'Create and edit products, categories and images.', 3),
  ('inventory.manage',  'Manage inventory',    'Adjust stock levels and view the movement history.', 4),
  ('promotions.manage', 'Manage promotions',   'Create bundles, related products and discount codes.', 5),
  ('customers.manage',  'View customers',      'See customer records and their order history.', 6),
  ('settings.manage',   'Manage settings',     'Change store-wide configuration.', 7)
on conflict (key) do update
  set label = excluded.label,
      description = excluded.description,
      sort_order = excluded.sort_order;

alter table public.permission_catalog enable row level security;
grant all privileges on public.permission_catalog to service_role;
