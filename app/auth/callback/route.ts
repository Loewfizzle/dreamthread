import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // Sanitize 'next' to prevent open redirect attacks. Must start with /
  let next = searchParams.get('next') ?? '/journal'
  if (!next.startsWith('/')) {
    next = '/journal'
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const isLocalEnv = process.env.NODE_ENV === 'development'
      const forwardedHost = request.headers.get('x-forwarded-host')

      // Always prefer the production domain matching the emailRedirectTo for reliability (esp. mobile)
      const redirectBase = isLocalEnv
        ? origin
        : process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dreamthread.app'

      // Fallback to forwardedHost if provided (for custom domains/vercel)
      const finalBase = forwardedHost && !isLocalEnv 
        ? `https://${forwardedHost}` 
        : redirectBase

      return NextResponse.redirect(`${finalBase}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/sign-in?error=Could not authenticate`)
}
