-- Add image generation support to dreams table
-- Run this in Supabase SQL Editor

-- image_url was present in 001, but we ensure both here for completeness
ALTER TABLE public.dreams
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS image_generation_count integer NOT NULL DEFAULT 0;

-- Optional: index if we query by generation count later (not needed for now)
-- create index if not exists dreams_image_generation_count_idx on public.dreams (image_generation_count);

-- Update RLS comment or add new comment
comment on column public.dreams.image_url is 'URL to the generated image for this dream (nullable).';
comment on column public.dreams.image_generation_count is 'Number of times an image has been generated/regenerated for this dream (used for rate limiting to 2 max).';

-- Since it's ALTER, RLS policies already allow update for owners, no new policy needed.
