-- ─────────────────────────────────────────────────────────────────
--  Learning Machines OS — Supabase Schema
--  Paste this entire file into: Supabase Dashboard → SQL Editor → Run
-- ─────────────────────────────────────────────────────────────────


-- ── 1. BUILDERS ───────────────────────────────────────────────────
-- One row per accepted student. Created automatically on first login
-- via the trigger below; Skylor fills in name/project via dashboard.

create table if not exists public.builders (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text unique not null,
  name          text not null default '',
  project_name  text not null default '',
  cohort        text not null default '2026',
  week_streak   integer not null default 0,
  current_goal  text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Auto-create a builders row whenever someone accepts a magic link.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.builders (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ── 2. WEEKLY UPDATES ─────────────────────────────────────────────
-- One row per builder per week. Upserted when a builder submits.

create table if not exists public.weekly_updates (
  id            uuid primary key default gen_random_uuid(),
  builder_id    uuid not null references public.builders(id) on delete cascade,
  week          integer not null check (week >= 1 and week <= 6),
  what_shipped  text not null default '',
  metric        text not null default '',
  next_goal     text not null default '',
  raw_text      text not null default '',
  honest_flag   boolean not null default false,
  needs_text    text not null default '',
  submitted_at  timestamptz not null default now(),
  unique(builder_id, week)
);


-- ── 3. COHORT DIGESTS ─────────────────────────────────────────────
-- One row per week, written by the Sunday-night AI Edge Function.

create table if not exists public.cohort_digests (
  id              uuid primary key default gen_random_uuid(),
  cohort          text not null default '2026',
  week            integer not null,
  synthesis       text not null default '',
  momentum_json   jsonb not null default '[]',
  honest_json     jsonb not null default '[]',
  needs_json      jsonb not null default '[]',
  breakout_json   jsonb not null default '[]',
  generated_at    timestamptz not null default now(),
  unique(cohort, week)
);


-- ── 4. ROW LEVEL SECURITY ─────────────────────────────────────────

alter table public.builders       enable row level security;
alter table public.weekly_updates enable row level security;
alter table public.cohort_digests enable row level security;

-- Builders: anyone authenticated can read all profiles (ship log needs names)
create policy "read_all_builders"
  on public.builders for select
  using (auth.role() = 'authenticated');

-- Builders: can only edit their own row
create policy "update_own_builder"
  on public.builders for update
  using (auth.uid() = id);

create policy "insert_own_builder"
  on public.builders for insert
  with check (auth.uid() = id);

-- Weekly updates: authenticated users can read all (ship log + arcs)
create policy "read_all_updates"
  on public.weekly_updates for select
  using (auth.role() = 'authenticated');

-- Weekly updates: builders can only insert/update their own
create policy "insert_own_update"
  on public.weekly_updates for insert
  with check (auth.uid() = builder_id);

create policy "update_own_update"
  on public.weekly_updates for update
  using (auth.uid() = builder_id);

-- Digests: anyone authenticated can read
create policy "read_all_digests"
  on public.cohort_digests for select
  using (auth.role() = 'authenticated');

-- Digests: only service role (Edge Functions) can write — no client policy needed.


-- ── 5. REALTIME ───────────────────────────────────────────────────
-- Lets the ship log update live as builders submit.

alter publication supabase_realtime add table public.weekly_updates;


-- ── DONE ──────────────────────────────────────────────────────────
-- After running this, go to Supabase Dashboard:
--   Authentication → URL Configuration → add your redirect URLs:
--     http://localhost:8766/login.html            (local dev)
--     chrome-extension://EXTENSION_ID/login.html  (after publishing)
