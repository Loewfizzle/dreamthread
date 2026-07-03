-- Weekly AI reflections, cached per user per week
-- Run this in the Supabase SQL Editor (or via Supabase CLI: supabase db push)

create table if not exists public.reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade not null,
  week_start date not null,
  content text not null,
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

alter table public.reflections enable row level security;

create policy "Users can insert their own reflections"
  on public.reflections
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can view their own reflections"
  on public.reflections
  for select
  to authenticated
  using (auth.uid() = user_id);

grant select, insert on table public.reflections to authenticated;

comment on table public.reflections is 'One cached AI reflection per user per ISO week; the cache bounds OpenAI spend to one call per user per week.';
