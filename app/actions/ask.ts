'use server'

import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { generateEmbedding } from '@/lib/embeddings'

export interface DreamSource {
  id: string
  title: string | null
  dream_date: string
}

export interface AskResult {
  answer?: string
  sources?: DreamSource[]
  error?: string
}

const MAX_QUESTION_LENGTH = 500
// Loose retrieval floor — the model decides what's actually relevant
const RETRIEVAL_THRESHOLD = 0.15

/**
 * Answers a question grounded in the user's own dreams: the question is
 * embedded, the closest dreams retrieved via match_dreams (RLS-scoped),
 * and the model answers from those dreams only.
 */
export async function askDreams(
  question: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<AskResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }

  const trimmed = question.trim().slice(0, MAX_QUESTION_LENGTH)
  if (!trimmed) return { error: 'Ask something about your dreams.' }

  if (!process.env.OPENAI_API_KEY) {
    return { error: 'Conversations aren’t configured on this server.' }
  }

  const { allowed } = await checkRateLimit(supabase, user.id, 'ask')
  if (!allowed) {
    return { error: 'You’ve reached today’s conversation limit. It resets tomorrow.' }
  }

  const embedding = await generateEmbedding(trimmed)
  if (!embedding) {
    return { error: 'The archive couldn’t be reached right now. Please try again.' }
  }

  const { data: matches, error: matchError } = await supabase.rpc('match_dreams', {
    query_embedding: JSON.stringify(embedding),
    match_count: 6,
  })
  if (matchError) {
    console.error('askDreams retrieval failed:', matchError)
    return { error: 'The archive couldn’t be reached right now. Please try again.' }
  }

  const relevant = (matches ?? []).filter(m => m.similarity >= RETRIEVAL_THRESHOLD)
  if (relevant.length === 0) {
    return {
      answer:
        'Your journal doesn’t seem to hold anything close to that yet. Ask about the nights you’ve recorded, or record a few more and return.',
      sources: [],
    }
  }

  const dreamBlock = relevant
    .map((d, i) => {
      const date = d.dream_date.slice(0, 10)
      const marks = [d.is_lucid ? 'lucid' : null, d.mood].filter(Boolean).join(', ')
      return `Dream ${i + 1} — ${date}${marks ? ` (${marks})` : ''}${d.title ? ` — "${d.title}"` : ''}:\n${d.content.slice(0, 600)}`
    })
    .join('\n\n')

  const messages = [
    {
      role: 'system',
      content:
        'You are a calm, artistic companion helping someone converse with their own dream journal. Ground every answer ONLY in the dreams provided — never invent dreams or details. Reference specific nights naturally by their date (e.g. "in your dream from June 3rd"). If the provided dreams do not hold an answer, say so gently. No diagnoses, no definitive claims about what dreams "mean". Keep answers to 2–6 sentences unless asked for more.',
    },
    ...history.slice(-4).map(m => ({
      role: m.role,
      content: String(m.content).slice(0, 1000),
    })),
    {
      role: 'user',
      content: `Here are the dreams from my journal most related to my question:\n\n${dreamBlock}\n\nMy question: ${trimmed}`,
    },
  ]

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 400,
        temperature: 0.6,
      }),
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) throw new Error(`OpenAI request failed: ${res.status}`)

    const data = await res.json()
    const answer = data.choices?.[0]?.message?.content?.trim()
    if (!answer) throw new Error('empty answer')

    return {
      answer,
      sources: relevant.map(d => ({ id: d.id, title: d.title, dream_date: d.dream_date })),
    }
  } catch (err) {
    console.error('askDreams failed:', err)
    return { error: 'The conversation faltered. Please try again in a moment.' }
  }
}
