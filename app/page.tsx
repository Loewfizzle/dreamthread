"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import DreamCard from '@/components/DreamCard';
import BottomNav from '@/components/BottomNav';
import { supabase, signOut } from '@/lib/supabase';
import { getRecentDreams, loadDreams } from '@/lib/dreams';
import type { Dream } from '@/lib/dreams';

type User = { email?: string } | null;

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentDreams, setRecentDreams] = useState<Dream[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadAuthAndData() {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;

      if (isMounted) {
        setUser(currentUser);
        if (currentUser) {
          setRecentDreams(getRecentDreams(4));
        }
        setLoading(false);
      }
    }

    loadAuthAndData();

    // Listen for auth changes (sign in/out from anywhere)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        setRecentDreams(getRecentDreams(4));
      } else {
        setRecentDreams([]);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
      // listener updates the view
    } catch {
      setSigningOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight-900 flex items-center justify-center">
        <div className="flex items-center gap-2 text-text-400 text-sm tracking-widest">
          <div className="moon-dot" /> DREAMTHREAD
        </div>
      </div>
    );
  }

  // ========== LOGGED-OUT: Elegant, calm, artistic landing ==========
  if (!user) {
    return (
      <div className="min-h-screen bg-midnight-900 text-text-50 flex flex-col">
        {/* Minimal, refined top nav */}
        <nav className="flex items-center justify-between px-6 pt-6 pb-4 max-w-2xl mx-auto w-full">
          <Logo size="md" />
          <Link 
            href="/sign-in" 
            className="btn-ghost text-sm px-5 py-2 rounded-3xl hover:bg-midnight-700"
          >
            Sign in
          </Link>
        </nav>

        <main className="flex-1 flex flex-col items-center justify-center px-5 pt-8 pb-20 max-w-2xl mx-auto text-center">
          {/* Artistic centerpiece: refined moon emblem */}
          <div className="mb-12 flex flex-col items-center">
            <div className="relative mb-8">
              <div className="w-24 h-24 rounded-full border border-text-400/20 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-text-100/70 via-text-200/60 to-text-400/40" />
                {/* Crescent cutout for depth */}
                <div className="absolute w-11 h-11 rounded-full bg-midnight-900 translate-x-[7px] translate-y-[1px]" />
              </div>
              {/* Subtle accent "star" / thread point */}
              <div className="absolute -top-1 -right-0.5 w-[7px] h-[7px] rounded-full bg-accent/80" />
              <div className="absolute top-3 -left-1 w-1 h-1 rounded-full bg-text-200/40" />
            </div>

            <h1 className="text-[40px] sm:text-[52px] font-semibold tracking-[-0.045em] leading-[0.95] mb-3">
              Dreamthread
            </h1>
            <p className="text-text-300 text-lg sm:text-xl tracking-[-0.01em]">
              A quiet place for your nights.
            </p>
          </div>

          <div className="max-w-md mx-auto mb-14">
            <p className="text-[15.5px] sm:text-[16px] leading-relaxed text-text-200">
              Dreams arrive like visitors in the dark. <br className="hidden sm:block" />
              Here you can receive them with care, record their textures, 
              and return to them when the light changes.
            </p>
          </div>

          {/* Clear primary path to sign in — generous, thumb-friendly, artistic */}
          <div className="w-full max-w-sm flex flex-col gap-3">
            <Link 
              href="/sign-in" 
              className="btn w-full justify-center text-[15.5px] py-[17px] tracking-[-0.01em] active:scale-[0.985]"
            >
              Begin your journal
            </Link>

            <Link 
              href="/journal" 
              className="btn-secondary w-full justify-center text-[15px] py-[17px] tracking-[-0.01em]"
            >
              View a shared journal
            </Link>
          </div>

          <div className="mt-16 flex items-center gap-2 text-[11px] text-text-400 tracking-[1.5px] uppercase">
            <div className="h-px w-6 bg-text-500/40" />
            Calm • Private • Yours
            <div className="h-px w-6 bg-text-500/40" />
          </div>
        </main>

        <footer className="text-center pb-10 text-text-400 text-[11px] tracking-wide">
          Your dreams remain only with you.
        </footer>
      </div>
    );
  }

  // ========== LOGGED-IN: Premium, artistic dashboard experience ==========
  const totalDreams = loadDreams().length;

  return (
    <div className="min-h-screen bg-midnight-900 text-text-50">
      {/* Refined top navigation for signed-in state */}
      <nav className="sticky top-0 z-40 bg-midnight-900/95 backdrop-blur-md border-b border-midnight-500">
        <div className="max-w-2xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="md" />
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Link 
              href="/journal" 
              className="btn-ghost px-4 py-1.5 text-xs rounded-2xl"
            >
              Full journal
            </Link>
            <button 
              onClick={handleSignOut}
              disabled={signingOut}
              className="btn-ghost px-4 py-1.5 text-xs rounded-2xl text-text-400 hover:text-text-200 disabled:opacity-60"
            >
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
            <div className="ml-1 w-7 h-7 rounded-full bg-midnight-700 flex items-center justify-center text-[10px] font-mono text-text-300 ring-1 ring-inset ring-midnight-500">
              {user?.email?.[0]?.toUpperCase() || '•'}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-5 pt-9 pb-24">
        {/* Artistic, intentional header area */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="moon-dot" />
            <span className="uppercase tracking-[2px] text-xs text-text-400">Good evening</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-0.035em] leading-none mb-2">
            What did the night bring?
          </h1>
          <p className="text-text-300 text-[15.5px] max-w-[28ch]">
            There is no rush. Only the thread you choose to follow.
          </p>
        </div>

        {/* PROMINENT, BEAUTIFUL "Record your dream" — near the top, high-quality artistic presence */}
        <Link 
          href="/journal/new" 
          className="group block mb-12 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 rounded-3xl"
        >
          <div className="card p-7 sm:p-9 flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-7 transition-all group-hover:border-midnight-500 group-active:scale-[0.995]">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 rounded-2xl bg-midnight-600 flex items-center justify-center text-3xl text-accent/90 group-hover:text-accent transition-colors">
                ✧
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="text-[21px] sm:text-2xl font-semibold tracking-[-0.02em] text-text-50 group-hover:text-accent transition-colors">
                  Record your dream
                </div>
              </div>
              <p className="text-text-200 text-[14.5px] leading-snug pr-4">
                The details are still close. Give them form before they drift.
              </p>
            </div>

            <div className="self-end sm:self-center text-accent text-2xl transition-transform group-hover:translate-x-0.5">
              →
            </div>
          </div>
        </Link>

        {/* Journal list underneath — refined preview, generous and artistic */}
        <div>
          <div className="flex items-baseline justify-between mb-5 px-1">
            <div>
              <div className="text-sm uppercase tracking-[1.5px] text-text-400 mb-px">Your journal</div>
              <div className="text-[21px] font-semibold tracking-[-0.015em]">
                {totalDreams} {totalDreams === 1 ? 'night' : 'nights'} remembered
              </div>
            </div>
            <Link 
              href="/journal" 
              className="text-sm text-accent hover:text-accent-hover transition-colors font-medium flex items-center gap-1"
            >
              See all <span aria-hidden>→</span>
            </Link>
          </div>

          {recentDreams.length > 0 ? (
            <div className="dream-list space-y-[13px]">
              {recentDreams.map((dream) => (
                <DreamCard key={dream.id} dream={dream} />
              ))}
            </div>
          ) : (
            <div className="empty-state border border-midnight-500/60 bg-midnight-700/40 rounded-3xl py-14">
              <div className="journal-empty-art scale-75 mb-2" aria-hidden="true">
                <div className="journal-empty-moon" />
              </div>
              <p className="text-text-200 font-medium mb-1 tracking-tight">The first thread begins here.</p>
              <p className="text-text-400 text-sm max-w-[240px] mx-auto leading-relaxed">
                Your dreams will appear in this quiet space once recorded.
              </p>
            </div>
          )}
        </div>

        {/* Subtle artistic footer note for logged-in homepage */}
        <div className="mt-16 text-center text-[11px] text-text-400 tracking-widest">
          DREAMTHREAD · PRIVATE BY NATURE
        </div>
      </div>

      {/* Bottom nav for thumb comfort on mobile (consistent with journal) */}
      <BottomNav />
    </div>
  );
}
