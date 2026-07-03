# Dreamthread

A calm, artistic, mobile-first dream journal. Capture dreams by voice or text the moment you wake, revisit them later, and let quiet AI features surface the threads between your nights.

**Live at [dreamthread.app](https://dreamthread.app)**

## Features

- **Capture** — voice recording with Whisper transcription, or plain text; installable as a PWA whose home-screen launch opens straight into recording. Dreams written offline queue locally and sync on the next visit.
- **Journal** — search (by word or by *meaning*, via embeddings), mood/tag facets, lucid and image filters, Markdown/JSON export.
- **Visual echoes** — an AI-generated image per dream (Fal.ai Flux), capped at two generations per dream.
- **Reflections** — a gentle per-dream interpretation, plus one cached weekly reflection across recent dreams.
- **Echoes** — dreams similar in meaning surface on each other's pages (pgvector).
- **Ask your dreams** — a retrieval-grounded conversation with your own journal.
- **Patterns & Almanac** — recall calendar, rhythms, mood distribution, and a shareable year-in-dreams review.
- **Tonight's intention** — set an evening intention; it greets you at morning capture.
- **Postcards** — share any dream as a canvas-rendered art card.

## Stack

Next.js (App Router) · Supabase (Postgres + Auth + RLS + pgvector) · OpenAI (Whisper, gpt-4o-mini, embeddings) · Fal.ai (Flux) · Tailwind CSS v4 · Vercel

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in the values (Supabase URL/key, `OPENAI_API_KEY`, `FAL_KEY`; set `NEXT_PUBLIC_SITE_URL=http://localhost:3000` for local magic links, and allowlist that callback URL in Supabase Auth settings).
3. Apply the SQL migrations in `supabase/migrations/` in order (Supabase SQL Editor or `supabase db push`).
4. `npm run dev`

All AI features degrade gracefully when their keys or tables are missing. Per-user daily rate limits on paid features are enforced through the append-only `usage_events` table.

## Conventions

- Supabase is the single source of truth for dreams; localStorage is used only as a transient offline outbox.
- Client code fetches dreams through `lib/dreams.ts` (`DREAM_COLUMNS` excludes the embedding vector).
- Server actions live in `app/actions/` and `app/journal/new/actions.ts`; all check auth and rate limits before calling paid APIs.
