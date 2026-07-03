/**
 * Resolves and validates the Supabase connection settings.
 * Throws a descriptive error at first use instead of letting an
 * undefined env var surface as a cryptic fetch failure.
 */
export function getSupabaseEnv(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL. Set it in .env.local (see .env.example) or in your deployment environment variables.'
    )
  }
  if (!key) {
    throw new Error(
      'Missing Supabase key. Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) in .env.local or in your deployment environment variables.'
    )
  }

  return { url, key }
}
