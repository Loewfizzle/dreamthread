"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import BottomNav from '@/components/BottomNav';
import { createClient } from '@/lib/supabase/client';
import { fetchDreams } from '@/lib/dreams';
import { migrateLocalDreams } from '@/lib/migrate-local-dreams';
import { generatePoeticInsight, extractKeywords, getExcerpt, formatDreamDate } from '@/lib/dream-utils';
import type { Dream } from '@/lib/dreams';

type User = { email?: string } | null;

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentDreams, setRecentDreams] = useState<Dream[]>([]);
  const [insight, setInsight] = useState('');
  const [keywords, setKeywords] = useState<Array<{ word: string; count: number }>>([]);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    async function refreshDreams() {
      await migrateLocalDreams();
      const { dreams } = await fetchDreams(); // already newest-first
      if (!isMounted) return;
      setRecentDreams(dreams.slice(0, 3));
      setInsight(generatePoeticInsight(dreams));
      setKeywords(extractKeywords(dreams, 6));
    }

    async function loadAuthAndData() {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;

      if (!isMounted) return;
      setUser(currentUser);
      if (currentUser) {
        await refreshDreams();
      }
      if (isMounted) setLoading(false);
    }

    loadAuthAndData();

    // Listen for auth changes (sign in/out from anywhere).
    // Supabase warns against awaiting client calls inside this callback,
    // so data refresh is deferred to the next tick.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        setTimeout(() => { void refreshDreams(); }, 0);
      } else {
        setRecentDreams([]);
        setInsight('');
        setKeywords([]);
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
      await createClient().auth.signOut();
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

  // ========== LOGGED-IN: Artistic, personal homepage ==========
  return (
    <div className="min-h-screen bg-midnight-900 text-text-50">
      {/* Refined minimal top navigation */}
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

      <div className="max-w-2xl mx-auto px-5 pt-6 pb-24">
        {/* 1. Large, prominent "Record your dream" button as hero */}
        <Link 
          href="/journal/new" 
          className="group block mb-12 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/20 rounded-3xl"
        >
          <div className="card p-8 sm:p-10 flex flex-col gap-4 sm:gap-5 transition-all group-hover:border-midnight-400 group-active:scale-[0.993]">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-midnight-600 flex items-center justify-center text-4xl text-accent/90 group-hover:text-accent transition-colors">
                ✧
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-3xl sm:text-[34px] font-semibold tracking-[-0.03em] text-text-50 group-hover:text-accent transition-colors leading-none">
                  Record your dream
                </div>
                <p className="mt-2.5 text-text-200 text-[15px] leading-snug pr-2">
                  The night still lingers. Capture its textures while they are close.
                </p>
              </div>
            </div>
            <div className="self-end text-accent text-xl transition-transform group-hover:translate-x-0.5 pr-1">
              →
            </div>
          </div>
        </Link>

        {/* 2. "Lately in your dreams" section — artistic, calm, insightful */}
        <div>
          <div className="mb-6">
            <div className="uppercase text-[10px] tracking-[1.75px] text-text-400 mb-1">Reflection</div>
            <h2 className="text-[27px] font-semibold tracking-[-0.025em] leading-none">
              Lately in your dreams
            </h2>
          </div>

          {/* Gentle poetic insight */}
          {insight && (
            <p className="text-text-200 text-[15px] leading-relaxed italic mb-7 max-w-[32ch]">
              “{insight}”
            </p>
          )}

          {/* Refined artistic word cloud — elegant visual accent */}
          {keywords.length > 0 && (
            <div className="mb-8">
              <div className="text-[10px] uppercase tracking-[1.5px] text-text-400 mb-2.5">Frequent threads</div>
              <div className="flex flex-wrap gap-x-3.5 gap-y-1.5">
                {keywords.map((k, i) => {
                  const size = Math.max(13, Math.min(23, 12 + (k.count - 1) * 2.5));
                  const opacity = Math.min(0.95, 0.55 + (k.count - 1) * 0.08);
                  return (
                    <span 
                      key={i} 
                      className="font-medium text-text-300 select-none transition-colors"
                      style={{ 
                        fontSize: `${size}px`, 
                        opacity,
                        letterSpacing: size > 18 ? '-0.01em' : '0'
                      }}
                    >
                      {k.word}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2–3 small preview cards */}
          {recentDreams.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-[1.5px] text-text-400 mb-3">Recent glimpses</div>
              <div className="space-y-2.5">
                {recentDreams.map((dream) => {
                  const dateLabel = formatDreamDate(dream.dream_date);
                  const excerpt = getExcerpt(dream.content, 85);
                  return (
                    <Link 
                      key={dream.id} 
                      href={`/journal/${dream.id}`} 
                      className="block card p-4 active:scale-[0.993] focus-visible:ring-1 focus-visible:ring-accent/20"
                    >
                      <div className="flex items-center justify-between text-[11px] text-text-400 mb-1.5">
                        <span>{dateLabel}</span>
                        {dream.mood && <span className="text-text-300">{dream.mood}</span>}
                      </div>
                      <div className="font-medium text-[15px] tracking-[-0.01em] text-text-50 line-clamp-1 pr-2">
                        {dream.title || 'Untitled dream'}
                      </div>
                      <div className="text-text-300 text-xs leading-relaxed line-clamp-2 mt-1 pr-1">
                        {excerpt}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {recentDreams.length === 0 && !insight && (
            <div className="text-text-400 text-sm italic">
              Your first dreams will begin to weave patterns here.
            </div>
          )}
        </div>
      </div>

      {/* Bottom nav for thumb comfort on mobile */}
      <BottomNav />
    </div>
  );
}
