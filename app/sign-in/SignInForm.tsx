'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface SignInFormProps {
  next?: string
}

export default function SignInForm({ next }: SignInFormProps) {
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState(urlError || '')

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const supabase = createClient()

    // Hardcoded to production for reliable Magic Link redirects (as per requirements)
    const emailRedirectTo = 'https://dreamthread.app/auth/callback'

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage("Check your inbox — the email is from DreamThread. It may take a minute to arrive.")
    }
    setLoading(false)
  }

  if (message) {
    return (
      <div className="bg-card border border-border rounded-3xl p-8 text-center">
        <h2 className="text-xl font-semibold tracking-tight text-foreground mb-2">Magic link sent</h2>
        <p className="text-muted mb-6">{message}</p>
        <p className="text-sm text-muted/80">Didn't receive it? Check your spam or promotions folder — look for an email from DreamThread. You can try sending another link below.</p>
        <button
          onClick={() => {
            setMessage('')
            setEmail('')
          }}
          className="mt-4 text-sm font-medium text-accent hover:underline"
        >
          Send another link
        </button>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-3xl p-8">
      <form onSubmit={handleSignIn} className="space-y-6">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-base text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
          />
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email}
          className="w-full rounded-2xl bg-primary py-3.5 text-base font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
        >
          {loading ? 'Sending magic link...' : 'Send magic link'}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-muted">
        We'll send you a secure, one-time link from DreamThread. No password required.
      </p>
    </div>
  )
}
