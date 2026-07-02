"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Logo from '@/components/Logo';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: 'https://dreamthread.app/auth/callback',
        },
      });
      if (error) throw error;
      setMessage("Check your inbox — the email is from Dreamthread. It may take a minute to arrive.");
    } catch (err: unknown) {
      let friendly = 'Something went wrong. Please try again.';
      const raw = err instanceof Error ? err.message.toLowerCase() : '';
      if (raw.includes('invalid') || raw.includes('email')) {
        friendly = 'Please enter a valid email address.';
      } else if (raw.includes('rate') || raw.includes('too many')) {
        friendly = 'Too many requests. Please wait a moment before trying again.';
      } else if (raw.includes('network') || raw.includes('fetch')) {
        friendly = 'We couldn’t reach the sign-in service. Check your connection and try again.';
      }
      setError(friendly);
    } finally {
      setLoading(false);
    }
  }

  function handleResend() {
    setMessage(null);
    setError(null);
    // Keep the email so user can resend easily, or clear if preferred
  }

  // Support error param from callback redirect (e.g. auth failure), without useSearchParams hook for build compatibility
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const err = params.get('error');
      if (err) {
        setError(err);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-midnight-900 flex flex-col">
      {/* Minimal top nav — calm and consistent */}
      <div className="px-5 pt-6 pb-2 max-w-md mx-auto w-full">
        <Link href="/" className="inline-flex items-center gap-2 text-text-300 hover:text-text-100 transition-colors text-sm">
          ← Back to home
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-5 pt-4 pb-12">
        <div className="w-full max-w-md">
          {/* Logo + title — elegant, minimal */}
          <div className="flex flex-col items-center mb-9">
            <div className="mb-3">
              <Logo size="md" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Sign in
            </h1>
            <p className="text-text-300 text-sm mt-1.5 text-center max-w-[28ch]">
              Enter your email and we’ll send a secure magic link. No password needed.
            </p>
          </div>

          {/* Auth card — matches the refined, darker Artistic Night theme */}
          <div className="auth-card p-7 sm:p-8">
            {message ? (
              /* Confirmation state — calm and artistic */
              <div className="text-center">
                <h2 className="text-xl font-semibold tracking-tight text-text-50 mb-3">
                  Magic link sent
                </h2>
                <p className="text-text-200 mb-4 text-[15px] leading-relaxed">
                  {message}
                </p>
                <p className="text-sm text-text-400 mb-6 leading-relaxed">
                  Didn’t receive it? Check your spam or promotions folder — it’s from Dreamthread.
                </p>
                <button
                  onClick={handleResend}
                  className="btn-secondary text-sm px-6 py-2.5"
                  disabled={loading}
                >
                  Send another link
                </button>
              </div>
            ) : (
              /* Email form only */
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="label" htmlFor="email">Email address</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                    placeholder="you@night.com"
                    required
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-400/80 bg-midnight-700 border border-red-900/30 rounded-2xl px-4 py-3">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="btn w-full mt-2 disabled:bg-accent/60 flex items-center justify-center gap-2"
                >
                  {loading && (
                    <span className="flex gap-1">
                      <span className="w-1 h-1 bg-white/70 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1 h-1 bg-white/70 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1 h-1 bg-white/70 rounded-full animate-bounce" />
                    </span>
                  )}
                  {loading ? 'Sending magic link…' : 'Send magic link'}
                </button>
              </form>
            )}

            <div className="mt-6 pt-5 border-t border-midnight-400 text-center text-xs text-text-400">
              By continuing you agree to our quiet terms.<br />Your dreams remain yours.
            </div>
          </div>

          {/* Subtle footer note — artistic and reassuring */}
          <p className="text-center text-[11px] text-text-400 mt-6 tracking-wide">
            We’ll email you a one-time secure link. No passwords, no accounts to manage.
          </p>
        </div>
      </div>
    </div>
  );
}
