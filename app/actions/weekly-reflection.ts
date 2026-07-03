'use server'

import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'

// Monday of the current ISO week, as YYYY-MM-DD (UTC)
function currentWeekStart(): string {
  const now = new Date()
  const daysSinceMonday = (now.getUTCDay() + 6) % 7
  const monday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysSinceMonday)
  )
  return monday.toISOString().slice(0, 10)
}

/**
 * Returns this week's reflection across the user's recent dreams,
 * generating and caching it on first request. Returns {} (no error)
 * whenever a reflection simply isn't available — too few dreams, no
 * API key, rate limited — so the homepage can fall back quietly.
 */
export async function getWeeklyReflection(): Promise<{ reflection?: string; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be signed in.' }
  }

  const weekStart = currentWeekStart()

  const { data: existing } = await supabase
    .from('reflections')
    .select('content')
    .eq('user_id', user.id)
    .eq('week_start', weekStart)
    .maybeSingle()

  if (existing?.content) {
    return { reflection: existing.content }
  }

  if (!process.env.OPENAI_API_KEY) return {}

  const { data: dreams } = await supabase
    .from('dreams')
    .select('title, content, mood, is_lucid, dream_date')
    .order('dream_date', { ascending: false })
    .limit(10)

  // A reflection across one or two dreams would just be an interpretation
  if (!dreams || dreams.length < 3) return {}

  const { allowed } = await checkRateLimit(supabase, user.id, 'interpretation')
  if (!allowed) return {}

  const dreamLines = dreams
    .map(d => {
      const date = d.dream_date.slice(0, 10)
      const marks = [d.is_lucid ? 'lucid' : null, d.mood].filter(Boolean).join(', ')
      const title = d.title ? `"${d.title}" — ` : ''
      return `- ${date}${marks ? ` (${marks})` : ''}: ${title}${(d.content || '').slice(0, 400)}`
    })
    .join('\n')

  const prompt = `You are a calm, artistic companion for dream reflection. Below are one person's recent dreams, newest first. Write a short weekly reflection (3-5 sentences) noticing what recurs or shifts ACROSS the dreams — returning images, changing moods, threads between nights. Use soft, open, non-prescriptive language; make no diagnostic or definitive claims. End with a quiet invitation.

Recent dreams:
${dreamLines}

Weekly reflection:`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You write beautiful, restrained, artistic reflections on dreams.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 220,
        temperature: 0.75,
      }),
      signal: AbortSignal.timeout(30_000),
    })

    if (!res.ok) throw new Error(`OpenAI request failed: ${res.status}`)

    const data = await res.json()
    const text = data.choices?.[0]?.message?.content?.trim()
    if (!text) return {}

    // Cache it. On a duplicate-key race the other request's copy wins,
    // which is fine — both came from the same dreams.
    await supabase
      .from('reflections')
      .insert({ user_id: user.id, week_start: weekStart, content: text })

    return { reflection: text }
  } catch (err) {
    console.error('weekly reflection generation failed:', err)
    return {}
  }
}
