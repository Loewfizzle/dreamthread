-- Usage events for per-user rate limiting of paid AI features
-- Run this in the Supabase SQL Editor (or via Supabase CLI: supabase db push)

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade not null,
  kind text not null check (kind in ('image_generation', 'interpretation', 'transcription')),
  created_at timestamptz not null default now()
);

-- The rate-limit query is: count rows for (user, kind) newer than a cutoff
create index if not exists usage_events_user_kind_time_idx
  on public.usage_events (user_id, kind, created_at desc);

alter table public.usage_events enable row level security;

-- Users may record and read their own usage. There are deliberately no
-- UPDATE or DELETE policies: usage history is append-only, so limits
-- cannot be evaded by deleting rows.
create policy "Users can insert their own usage events"
  on public.usage_events
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can view their own usage events"
  on public.usage_events
  for select
  to authenticated
  using (auth.uid() = user_id);

grant select, insert on table public.usage_events to authenticated;

comment on table public.usage_events is 'Append-only log of paid AI feature usage, used for per-user daily rate limits.';
