-- Tonight's intentions + rate-limit kind for "Ask your dreams"
-- Run this in the Supabase SQL Editor (or via Supabase CLI: supabase db push)

-- 1. Allow the new 'ask' usage kind
alter table public.usage_events drop constraint if exists usage_events_kind_check;
alter table public.usage_events add constraint usage_events_kind_check
  check (kind in ('image_generation', 'interpretation', 'transcription', 'ask'));

-- 2. One intention per user per night
create table if not exists public.intentions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade not null,
  night_date date not null,
  content text not null,
  created_at timestamptz not null default now(),
  unique (user_id, night_date)
);

alter table public.intentions enable row level security;

create policy "Users can insert their own intentions"
  on public.intentions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can view their own intentions"
  on public.intentions
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can update their own intentions"
  on public.intentions
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on table public.intentions to authenticated;

comment on table public.intentions is 'One pre-sleep intention per user per night, shown back at morning capture.';
