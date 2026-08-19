-- Schedules the notification dispatcher (flow.md §8).
--
-- Run this ONCE in the Supabase SQL Editor. It is not a migration because it needs the
-- service_role key, which must never be committed to the repository.
--
--   Supabase dashboard → SQL Editor → paste → replace the two placeholders → Run
--
-- Everything else about notifications already works without this: events are recorded
-- durably on every order state change, and `/notifications/dispatch` can be triggered
-- manually from the admin. This script only automates the draining.

-- 1. Store the credentials in Vault so they aren't written into the job definition.
select vault.create_secret(
  'https://buezylclznarpsawhiok.supabase.co',
  'project_url',
  'Base URL used by scheduled jobs to reach Edge Functions'
);

select vault.create_secret(
  'PASTE_YOUR_SERVICE_ROLE_KEY_HERE',   -- Settings → API → service_role key
  'service_role_key',
  'Service role key used by scheduled jobs'
);

-- 2. Schedule the dispatcher.
do $$
declare
  v_url text;
  v_key text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'service_role_key';

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
end $$;

-- 3. Confirm both jobs are scheduled.
select jobname, schedule, active from cron.job order by jobname;
