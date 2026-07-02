"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithEmail, signUpWithEmail } from '@/lib/supabase';
import Logo from '@/components/Logo';

export default function SignIn() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await signInWithEmail(email, password);
        if (error) throw error;
        router.push('/');
      } else {
        const { error } = await signUpWithEmail(email, password);
        if (error) throw error;
        setMessage("Account created. Check your email to confirm, then sign in.");
        setMode('signin');
        setPassword('');
      }
    } catch (err: unknown) {
      let friendly = 'Something went wrong. Please try again.';
      const raw = err instanceof Error ? err.message.toLowerCase() : '';
      if (raw.includes('invalid') || raw.includes('credentials') || raw.includes('password')) {
        friendly = 'The email or password didn’t match. Please check and try again.';
      } else if (raw.includes('network') || raw.includes('fetch')) {
        friendly = 'We couldn’t reach the sign-in service. Check your connection and try again.';
      }
      setError(friendly);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-midnight-900 flex flex-col">
      {/* Minimal top nav */}
      <div className="px-5 pt-6 pb-2 max-w-md mx-auto w-full">
        <Link href="/" className="inline-flex items-center gap-2 text-text-300 hover:text-text-100 transition-colors text-sm">
          ← Back to home
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-5 pt-4 pb-12">
        <div className="w-full max-w-md">
          {/* Logo + title */}
          <div className="flex flex-col items-center mb-9">
            <div className="mb-3">
              <Logo size="md" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              {mode === 'signin' ? 'Welcome back' : 'Begin your journal'}
            </h1>
            <p className="text-text-300 text-sm mt-1.5 text-center">
              {mode === 'signin' 
                ? 'Sign in to continue your dream practice.' 
                : 'Create a private space for your nights.'}
            </p>
          </div>

          {/* Auth card */}
          <div className="auth-card p-7 sm:p-8">
            {/* Mode tabs */}
            <div className="flex mb-7 bg-midnight-800 rounded-2xl p-1">
              <button
                disabled={loading}
                onClick={() => { setMode('signin'); setError(null); setMessage(null); }}
                className={`flex-1 py-2.5 text-sm font-medium rounded-[14px] transition-all disabled:opacity-60 ${mode === 'signin' ? 'bg-midnight-700 text-text-50 shadow-sm' : 'text-text-300 hover:text-text-200'}`}
              >
                Sign in
              </button>
              <button
                disabled={loading}
                onClick={() => { setMode('signup'); setError(null); setMessage(null); }}
                className={`flex-1 py-2.5 text-sm font-medium rounded-[14px] transition-all disabled:opacity-60 ${mode === 'signup' ? 'bg-midnight-700 text-text-50 shadow-sm' : 'text-text-300 hover:text-text-200'}`}
              >
                Create account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label" htmlFor="email">Email</label>
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

              <div>
                <label className="label" htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="••••••••"
                  required
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  minLength={6}
                  disabled={loading}
                />
                {mode === 'signin' && (
                  <p className="text-[12px] text-text-400 mt-1.5 px-1">Forgot your password? <span className="text-accent cursor-pointer hover:underline">Reset it</span></p>
                )}
              </div>

              {error && (
                <div className="text-sm text-red-400/90 bg-red-950/30 border border-red-900/40 rounded-2xl px-4 py-3">
                  {error}
                </div>
              )}

              {message && (
                <div className="text-sm text-success/90 bg-emerald-950/20 border border-emerald-900/30 rounded-2xl px-4 py-3">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="btn w-full mt-2 disabled:bg-accent/60 flex items-center justify-center gap-2"
              >
                {loading && (
                  <span className="flex gap-1">
                    <span className="w-1 h-1 bg-white/70 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1 h-1 bg-white/70 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1 h-1 bg-white/70 rounded-full animate-bounce" />
                  </span>
                )}
                {loading 
                  ? (mode === 'signin' ? 'Signing in…' : 'Creating account…') 
                  : (mode === 'signin' ? 'Sign in' : 'Create account')}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-midnight-500 text-center text-xs text-text-400">
              By continuing you agree to our quiet terms.<br />Your dreams remain yours.
            </div>
          </div>

          {/* Helpful hint for demo */}
          <p className="text-center text-[11px] text-text-500 mt-6 tracking-wide">
            Use any email + password (6+ chars). Supabase will handle it.
          </p>
        </div>
      </div>
    </div>
  );
}
