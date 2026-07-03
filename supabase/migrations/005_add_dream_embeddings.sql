-- Semantic embeddings for dreams (Echoes + search by meaning)
-- Run this in the Supabase SQL Editor (or via Supabase CLI: supabase db push)

-- pgvector ships with Supabase; this just enables it
create extension if not exists vector with schema extensions;

-- text-embedding-3-small produces 1536 dimensions
alter table public.dreams
  add column if not exists embedding extensions.vector(1536);

create index if not exists dreams_embedding_idx
  on public.dreams
  using hnsw (embedding extensions.vector_cosine_ops);

-- Nearest dreams by meaning. SECURITY INVOKER so the dreams RLS policies
-- apply: callers can only ever match against their own dreams.
create or replace function public.match_dreams(
  query_embedding extensions.vector(1536),
  match_count int default 5,
  exclude_id uuid default null
)
returns table (
  id uuid,
  title text,
  content text,
  dream_date timestamptz,
  mood text,
  is_lucid boolean,
  similarity double precision
)
language sql
security invoker
set search_path = ''
as $$
  -- search_path is pinned to '' for safety, so the pgvector cosine
  -- operator must be schema-qualified via operator(extensions.<=>)
  select
    d.id,
    d.title,
    d.content,
    d.dream_date,
    d.mood,
    d.is_lucid,
    1 - (d.embedding operator(extensions.<=>) query_embedding) as similarity
  from public.dreams d
  where d.embedding is not null
    and (exclude_id is null or d.id <> exclude_id)
  order by d.embedding operator(extensions.<=>) query_embedding
  limit match_count;
$$;

grant execute on function public.match_dreams to authenticated;

comment on column public.dreams.embedding is 'OpenAI text-embedding-3-small vector of title + content; null until backfilled.';
