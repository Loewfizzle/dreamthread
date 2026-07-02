"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DreamCard from '@/components/DreamCard';
import type { Dream } from '@/lib/dreams';
import Logo from '@/components/Logo';
import BottomNav from '@/components/BottomNav';
import { signOut } from '@/lib/supabase';
import { loadDreams, saveDreams } from '@/lib/dreams';

export default function Journal() {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'lucid' | 'recent'>('all');
  const router = useRouter();

  // Load in timeout callback so initial sets aren't direct in effect body
  useEffect(() => {
    const id = setTimeout(() => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const loaded = loadDreams();
        setDreams(loaded);
      } catch {
        setLoadError('We had trouble reaching your journal. The dreams may still be safe locally.');
        setDreams([]);
      } finally {
        setIsLoading(false);
      }
    }, 0);
    return () => clearTimeout(id);
  }, []);

  // Persist whenever dreams change (after hydration)
  useEffect(() => {
    if (typeof window !== 'undefined' && dreams.length > 0) {
      try {
        saveDreams(dreams);
      } catch {
        // non-fatal
      }
    }
  }, [dreams]);

  const filteredDreams = React.useMemo(() => {
    let result = [...dreams];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.content.toLowerCase().includes(q) ||
        (d.tags || []).some(t => t.toLowerCase().includes(q)) ||
        (d.mood || '').toLowerCase().includes(q)
      );
    }

    // Filters
    if (activeFilter === 'lucid') {
      result = result.filter(d => (d.lucidity || 0) >= 4);
    } else if (activeFilter === 'recent') {
      result.sort((a, b) => new Date(b.dream_date).getTime() - new Date(a.dream_date).getTime());
    }

    // Default sort: newest dream date first
    if (activeFilter !== 'recent') {
      result.sort((a, b) => new Date(b.dream_date).getTime() - new Date(a.dream_date).getTime());
    }

    return result;
  }, [dreams, search, activeFilter]);

  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      router.push('/');
    } catch {
      setSigningOut(false);
      // calm: still navigate or show message. For now navigate anyway.
      router.push('/');
    }
  }

  return (
    <div className="min-h-screen bg-midnight-900">
      {/* Top header - calm and consistent */}
      <header className="sticky top-0 z-30 bg-midnight-900/95 backdrop-blur-md border-b border-midnight-700">
        <div className="max-w-2xl mx-auto px-5 flex h-16 items-center justify-between">
          <Logo size="md" />

          <div className="flex items-center gap-1.5">
            <button 
              onClick={handleSignOut} 
              disabled={signingOut}
              className="btn-ghost px-3 py-1.5 text-xs rounded-2xl disabled:opacity-60"
            >
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
            <div className="w-7 h-7 rounded-full bg-midnight-600 flex items-center justify-center text-[10px] text-text-300 font-mono">B</div>
          </div>
        </div>
      </header>

      <div className="page max-w-2xl">
        <div className="page-header">
          <div>
            <h1 className="page-title">Journal</h1>
            <p className="text-text-300 text-sm mt-0.5">
              {isLoading ? 'Gathering your nights…' : `${filteredDreams.length} ${filteredDreams.length === 1 ? 'night' : 'nights'} remembered`}
            </p>
          </div>
          <Link href="/journal/new" className="btn text-sm px-5 py-3 hidden sm:inline-flex">
            + New dream
          </Link>
        </div>

        {/* Search + filters - comfortable touch targets */}
        <div className="mb-6 space-y-3">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dreams, tags, feelings…"
              className="input pl-12 py-[17px] pr-11"
              aria-label="Search dreams"
            />
            <div className="absolute left-5 top-4 text-text-400 pointer-events-none">⌘</div>
            {search && (
              <button 
                onClick={() => setSearch('')} 
                className="absolute right-4 top-4 text-text-400 hover:text-text-200 text-lg leading-none"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {/* Filter chips - easy thumb taps */}
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all', label: 'All dreams' },
              { key: 'recent', label: 'Most recent' },
              { key: 'lucid', label: 'Lucid (4–5)' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key as 'all' | 'lucid' | 'recent')}
                className={`px-5 py-2 text-sm rounded-3xl border transition-all active:scale-[0.985] touch-target ${
                  activeFilter === f.key 
                    ? 'bg-accent text-white border-accent' 
                    : 'bg-midnight-800 border-midnight-500 text-text-200 hover:bg-midnight-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* List with loading / error states */}
        {isLoading ? (
          <div className="py-12 text-center">
            <div className="inline-flex items-center gap-2 text-text-400 text-sm">
              <div className="flex gap-1">
                <span className="w-1 h-1 bg-text-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1 h-1 bg-text-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1 h-1 bg-text-400 rounded-full animate-bounce" />
              </div>
              Loading your journal…
            </div>
          </div>
        ) : loadError ? (
          <div className="card p-6 text-center border border-midnight-500">
            <p className="text-text-200 mb-2">Something felt off while opening your journal.</p>
            <p className="text-sm text-text-400 mb-4">{loadError}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="btn-secondary text-sm"
            >
              Try again
            </button>
          </div>
        ) : filteredDreams.length > 0 ? (
          <div className="dream-list">
            {filteredDreams.map((dream) => (
              <DreamCard key={dream.id} dream={dream} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon text-5xl opacity-70">🌙</div>
            <p className="text-text-200 mb-1 font-medium">No dreams found</p>
            <p className="text-text-400 text-sm max-w-[260px]">Try a different search or filter, or start a new entry.</p>
            <Link href="/journal/new" className="btn mt-6">Write a dream</Link>
          </div>
        )}

        {/* Mobile friendly New button - always visible */}
        <div className="fixed bottom-5 right-5 z-40 sm:hidden">
          <Link 
            href="/journal/new"
            className="btn flex items-center justify-center w-14 h-14 rounded-full p-0 shadow-lg text-2xl leading-none active:scale-95"
            aria-label="New dream"
          >
            +
          </Link>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
