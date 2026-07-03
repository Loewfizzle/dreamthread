-- Self-service account deletion
-- Run this in the Supabase SQL Editor (or via Supabase CLI: supabase db push)

-- SECURITY DEFINER lets the caller delete their own auth.users row;
-- every app table references auth.users with ON DELETE CASCADE, so this
-- single delete erases dreams, reflections, intentions, and usage rows.
create or replace function public.delete_account()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = auth.uid();
$$;

revoke all on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;

comment on function public.delete_account is 'Deletes the calling user and, via FK cascades, all of their data.';
