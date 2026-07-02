import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

/**
 * Typed Supabase client for use in Client Components.
 * Always call createClient() inside your component (it is safe and cheap).
 */
export function createClient() {
  // Create a supabase client on the browser with project's credentials
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createBrowserClient<Database>(supabaseUrl, supabaseKey)
}
