'use server'

import { createClient } from '@/lib/supabase/server'

const NIGHT_DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const MAX_INTENTION_LENGTH = 300

// night_date is computed client-side (the user's timezone, not the
// server's): the date of the evening the night begins.

export async function saveIntentionAction(
  nightDate: string,
  content: string
): Promise<{ error?: string; success?: boolean }> {
  if (!NIGHT_DATE_RE.test(nightDate)) return { error: 'Invalid night.' }
  const trimmed = content.trim().slice(0, MAX_INTENTION_LENGTH)
  if (!trimmed) return { error: 'Write a small intention first.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }

  const { error } = await supabase
    .from('intentions')
    .upsert(
      { user_id: user.id, night_date: nightDate, content: trimmed },
      { onConflict: 'user_id,night_date' }
    )
  if (error) {
    console.error('saveIntention failed:', error)
    return { error: 'The intention couldn’t be held right now. Please try again.' }
  }
  return { success: true }
}

export async function getIntentionAction(nightDate: string): Promise<{ intention?: string }> {
  if (!NIGHT_DATE_RE.test(nightDate)) return {}

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return {}

  const { data } = await supabase
    .from('intentions')
    .select('content')
    .eq('user_id', user.id)
    .eq('night_date', nightDate)
    .maybeSingle()

  return data?.content ? { intention: data.content } : {}
}
