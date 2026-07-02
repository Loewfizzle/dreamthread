-- Dreamthread: Core dreams table migration
-- Run this in the Supabase SQL Editor (or via Supabase CLI: supabase db push)
--
-- This creates the dreams table with all required columns, indexes,
-- automatic updated_at trigger, Row Level Security (RLS), and
-- per-user ownership policies.

-- 1. Create the dreams table
create table if not exists public.dreams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade not null,
  title text,
  content text not null,
  dream_date timestamptz not null default now(),
  mood text,
  is_lucid boolean not null default false,
  image_url text,
  tags text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Performance indexes (very useful for listing by date + filtering by user)
create index if not exists dreams_user_id_idx on public.dreams (user_id);
create index if not exists dreams_dream_date_idx on public.dreams (dream_date desc);
create index if not exists dreams_created_at_idx on public.dreams (created_at desc);

-- Optional: GIN index for tags array search (uncomment if you need fast tag queries)
-- create index if not exists dreams_tags_gin_idx on public.dreams using gin (tags);

-- 3. Automatic updated_at trigger (keeps updated_at in sync on every UPDATE)
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger dreams_set_updated_at
before update on public.dreams
for each row
execute function public.handle_updated_at();

-- 4. Enable Row Level Security
alter table public.dreams enable row level security;

-- 5. RLS Policies — users may only access their own rows
-- SELECT
create policy "Users can view their own dreams"
  on public.dreams
  for select
  to authenticated
  using (auth.uid() = user_id);

-- INSERT
create policy "Users can insert their own dreams"
  on public.dreams
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- UPDATE
create policy "Users can update their own dreams"
  on public.dreams
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- DELETE
create policy "Users can delete their own dreams"
  on public.dreams
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- 6. (Optional but recommended) Grant minimal privileges (RLS still enforces)
-- Supabase projects usually have the authenticated role granted by default,
-- but being explicit is harmless.
grant select, insert, update, delete on table public.dreams to authenticated;

-- 7. Comments for documentation (visible in Supabase Studio)
comment on table public.dreams is 'Stores individual dream journal entries. RLS ensures users only see their own data.';
comment on column public.dreams.content is 'The full transcribed or written dream content (required).';
comment on column public.dreams.tags is 'Free-form tags for categorization and search (text array).';

-- Done. After running, you can generate TypeScript types with:
--   npx supabase gen types typescript --project-id YOUR_PROJECT_REF > types/database.ts
-- (or use the manually maintained types/database.ts in this project)
