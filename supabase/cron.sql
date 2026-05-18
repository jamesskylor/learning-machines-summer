-- ─────────────────────────────────────────────────────────────────
--  Learning Machines OS — Sunday Night Digest Cron
--  Run this in: Supabase Dashboard → SQL Editor
--
--  Triggers generate-digest every Sunday at 11:45 PM Toronto time
--  (Monday 03:45 UTC). Requires pg_net extension (enabled by default
--  on Supabase).
--
--  BEFORE RUNNING: replace SERVICE_ROLE_KEY below with your actual
--  service role key from Supabase → Settings → API → service_role
-- ─────────────────────────────────────────────────────────────────

-- Enable required extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Remove old job if it exists
select cron.unschedule('generate-weekly-digest') where exists (
  select 1 from cron.job where jobname = 'generate-weekly-digest'
);

-- Schedule: Sunday 11:45 PM ET = Monday 03:45 UTC
select cron.schedule(
  'generate-weekly-digest',
  '45 3 * * 1',
  $$
  select net.http_post(
    url     := 'https://zwwsoobzqwkziywolxrt.supabase.co/functions/v1/generate-digest',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer SERVICE_ROLE_KEY'
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- Confirm it's scheduled
select jobname, schedule, command from cron.job where jobname = 'generate-weekly-digest';
