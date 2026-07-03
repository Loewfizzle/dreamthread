'use server'

import { createClient } from '@/lib/supabase/server'
import { generateEmbedding, dreamEmbeddingText } from '@/lib/embeddings'

export interface EchoDream {
  id: string
  title: string | null
  content: string
  dream_date: string
  mood: string | null
  is_lucid: boolean
  similarity: number
}

// Below this cosine similarity, "related" dreams are mostly noise
const ECHO_THRESHOLD = 0.35
const SEARCH_THRESHOLD = 0.25

/**
 * The dreams most similar in meaning to the given one. Embeds the dream
 * on the fly if it predates the embeddings feature.
 */
export async function getDreamEchoes(dreamId: string): Promise<{ echoes?: EchoDream[]; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }

  const { data: dream } = await supabase
    .from('dreams')
    .select('id, title, content, embedding')
    .eq('id', dreamId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!dream) return { error: 'Dream not found.' }

  let embedding = dream.embedding
  if (!embedding) {
    const generated = await generateEmbedding(dreamEmbeddingText(dream.title, dream.content))
    if (!generated) return { echoes: [] }
    embedding = JSON.stringify(generated)
    await supabase.from('dreams').update({ embedding }).eq('id', dreamId).eq('user_id', user.id)
  }

  const { data: matches, error } = await supabase.rpc('match_dreams', {
    query_embedding: embedding,
    match_count: 4,
    exclude_id: dreamId,
  })
  if (error) {
    console.error('match_dreams failed:', error)
    return { echoes: [] }
  }

  return { echoes: (matches ?? []).filter(m => m.similarity >= ECHO_THRESHOLD).slice(0, 3) }
}

/** Search the journal by meaning; returns dream ids in similarity order. */
export async function semanticSearchAction(query: string): Promise<{ ids?: string[]; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }

  const trimmed = query.trim().slice(0, 300)
  if (!trimmed) return { ids: [] }

  const embedding = await generateEmbedding(trimmed)
  if (!embedding) return { error: 'Search by meaning isn’t available right now.' }

  const { data: matches, error } = await supabase.rpc('match_dreams', {
    query_embedding: JSON.stringify(embedding),
    match_count: 20,
  })
  if (error) {
    console.error('semantic search failed:', error)
    return { error: 'Search by meaning isn’t available right now.' }
  }

  return { ids: (matches ?? []).filter(m => m.similarity >= SEARCH_THRESHOLD).map(m => m.id) }
}

/**
 * Embeds a small batch of dreams that predate the embeddings feature.
 * Called fire-and-forget from the journal; a few visits backfills
 * everything, after which this finds nothing to do.
 */
export async function backfillEmbeddingsAction(): Promise<{ done: number }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { done: 0 }

  const { data: missing } = await supabase
    .from('dreams')
    .select('id, title, content')
    .is('embedding', null)
    .limit(10)
  if (!missing || missing.length === 0) return { done: 0 }

  let done = 0
  for (const dream of missing) {
    const embedding = await generateEmbedding(dreamEmbeddingText(dream.title, dream.content))
    if (!embedding) break // likely no API key or transient failure; try next visit
    const { error } = await supabase
      .from('dreams')
      .update({ embedding: JSON.stringify(embedding) })
      .eq('id', dream.id)
    if (error) break
    done++
  }
  return { done }
}
