import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { getSupabaseEnv } from './env'

/**
 * Typed Supabase client for use in Client Components.
 * Always call createClient() inside your component (it is safe and cheap).
 */
export function createClient() {
  const { url, key } = getSupabaseEnv()
  return createBrowserClient<Database>(url, key)
}
