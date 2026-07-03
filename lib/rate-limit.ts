import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export type UsageKind = 'image_generation' | 'interpretation' | 'transcription'

// Per-user allowance within a rolling 24h window. Generous for normal
// journaling; they exist to bound API spend if an account is abused.
export const DAILY_LIMITS: Record<UsageKind, number> = {
  image_generation: 15,
  interpretation: 30,
  transcription: 60,
}

/**
 * Records one usage attempt and reports whether the user is within their
 * daily allowance. Counting happens before the paid call so repeated
 * failures still bound spend.
 *
 * Fails open: if the usage table is unreachable (e.g. migration not yet
 * applied), the feature keeps working and the incident is logged.
 */
export async function checkRateLimit(
  supabase: SupabaseClient<Database>,
  userId: string,
  kind: UsageKind
): Promise<{ allowed: boolean }> {
  const limit = DAILY_LIMITS[kind]
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString()

  try {
    const { count, error: countError } = await supabase
      .from('usage_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('kind', kind)
      .gte('created_at', since)

    if (countError) throw countError

    if ((count ?? 0) >= limit) {
      return { allowed: false }
    }

    const { error: insertError } = await supabase
      .from('usage_events')
      .insert({ user_id: userId, kind })
    if (insertError) throw insertError

    return { allowed: true }
  } catch (err) {
    console.error(`rate-limit check failed (kind=${kind}), allowing request:`, err)
    return { allowed: true }
  }
}
