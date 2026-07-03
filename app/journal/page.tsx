"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DreamCard from '@/components/DreamCard';
import type { Dream } from '@/lib/dreams';
import { fetchDreams } from '@/lib/dreams';
import { migrateLocalDreams } from '@/lib/migrate-local-dreams';
import { parseDreamDate } from '@/lib/dream-utils';
import Logo from '@/components/Logo';
import BottomNav from '@/components/BottomNav';
import { createClient } from '@/lib/supabase/client';

export default function Journal() {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'lucid' | 'recent' | 'images'>('all');
  // Captured on click (not in render) so the memoized filter stays pure
  const [recentCutoff, setRecentCutoff] = useState<number | null>(null);
  const [moodFilter, setMoodFilter] = useState<string | null>(null); // lowercase key
  const [tagFilter, setTagFilter] = useState<string | null>(null); // lowercase key
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  // Load dreams from Supabase (after importing any legacy local entries)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!cancelled) setUserEmail(session?.user?.email ?? null);
      } catch {}

      await migrateLocalDreams();
      const { dreams: loaded, error } = await fetchDreams();
      if (cancelled) return;

      if (error) {
        setLoadError('We had trouble reaching your journal. Please try again.');
      }
      setDreams(loaded);
      setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Facets derived from the loaded dreams (lowercase keys, most frequent first)
  const moodOptions = React.useMemo(() => {
    const counts: Record<string, number> = {};
    dreams.forEach(d => {
      const key = d.mood?.trim().toLowerCase();
      if (key) counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([key]) => key);
  }, [dreams]);

  const tagOptions = React.useMemo(() => {
    const counts: Record<string, number> = {};
    dreams.forEach(d => {
      (d.tags || []).forEach(t => {
        const key = t.trim().toLowerCase();
        if (key) counts[key] = (counts[key] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 10)
      .map(([key]) => key);
  }, [dreams]);

  const filteredDreams = React.useMemo(() => {
    let result = [...dreams];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(d =>
        (d.title || '').toLowerCase().includes(q) ||
        d.content.toLowerCase().includes(q) ||
        (d.tags || []).some(t => t.toLowerCase().includes(q)) ||
        (d.mood || '').toLowerCase().includes(q)
      );
    }

    // Primary filter pill
    if (activeFilter === 'lucid') {
      result = result.filter(d => d.is_lucid);
    } else if (activeFilter === 'recent' && recentCutoff !== null) {
      result = result.filter(d => parseDreamDate(d.dream_date).getTime() >= recentCutoff);
    } else if (activeFilter === 'images') {
      result = result.filter(d => !!d.image_url);
    }

    // Facets
    if (moodFilter) {
      result = result.filter(d => d.mood?.trim().toLowerCase() === moodFilter);
    }
    if (tagFilter) {
      result = result.filter(d => (d.tags || []).some(t => t.trim().toLowerCase() === tagFilter));
    }

    // Sort: newest dream date first
    result.sort((a, b) => parseDreamDate(b.dream_date).getTime() - parseDreamDate(a.dream_date).getTime());

    return result;
  }, [dreams, search, activeFilter, recentCutoff, moodFilter, tagFilter]);

  const hasActiveFilters =
    search.trim().length > 0 || activeFilter !== 'all' || moodFilter !== null || tagFilter !== null;

  function clearFilters() {
    setSearch('');
    setActiveFilter('all');
    setRecentCutoff(null);
    setMoodFilter(null);
    setTagFilter(null);
  }

  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await createClient().auth.signOut();
      router.push('/');
    } catch {
      setSigningOut(false);
      // calm: still navigate or show message. For now navigate anyway.
      router.push('/');
    }
  }

  return (
    <div className="min-h-screen bg-midnight-900">
      {/* Top header — refined, minimal, artistic */}
      <header className="sticky top-0 z-30 bg-midnight-900/95 backdrop-blur-md border-b border-midnight-500">
        <div className="max-w-2xl mx-auto px-5 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size="md" />
            <div className="w-px h-3 bg-text-500/30" />
            <span className="text-[10px] tracking-[1.5px] text-text-400 font-medium">JOURNAL</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button 
              onClick={handleSignOut} 
              disabled={signingOut}
              className="btn-ghost px-4 py-1.5 text-xs rounded-2xl disabled:opacity-60 tracking-wide"
            >
              {signingOut ? 'Leaving…' : 'Sign out'}
            </button>
            <div className="w-6 h-6 rounded-full bg-midnight-700 ring-1 ring-inset ring-midnight-500 flex items-center justify-center text-[9px] text-text-300 font-mono">
              {userEmail?.[0]?.toUpperCase() || '•'}
            </div>
          </div>
        </div>
      </header>

      <div className="page max-w-2xl">
        {/* Intentional header with breathing room */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Journal</h1>
            <p className="text-text-400 text-xs tracking-[1.25px] mt-1.5 uppercase">
              {isLoading ? 'Gathering your nights' : `${filteredDreams.length} ${filteredDreams.length === 1 ? 'night' : 'nights'} remembered`}
            </p>
          </div>
          <Link href="/journal/new" className="btn text-sm px-6 py-3 hidden sm:inline-flex tracking-wide">
            New thread
          </Link>
        </div>

        {/* Search + filters — refined, not cluttered */}
        <div className="mb-10 space-y-4">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search nights, feelings, fragments…"
              className="input pl-11 py-[15px] pr-10 text-[14.5px]"
              aria-label="Search dreams"
            />
            <div className="absolute left-4 top-[17px] text-text-400/70 pointer-events-none">
              <span className="text-base leading-none">⌘</span>
            </div>
            {search && (
              <button 
                onClick={() => setSearch('')} 
                className="absolute right-3.5 top-3.5 text-text-400 hover:text-text-100 text-xl leading-none px-1"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {/* Elegant filter pills */}
          <div className="flex gap-2 flex-wrap items-center">
            {[
              { key: 'all', label: 'All' },
              { key: 'recent', label: 'Recent' },
              { key: 'lucid', label: 'Lucid' },
              { key: 'images', label: 'With image' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => {
                  const key = f.key as 'all' | 'lucid' | 'recent' | 'images';
                  setRecentCutoff(key === 'recent' ? Date.now() - 7 * 24 * 3600 * 1000 : null);
                  setActiveFilter(key);
                }}
                className={`px-4 py-[7px] text-xs tracking-[0.5px] rounded-3xl border transition-all active:scale-[0.985] touch-target font-medium ${
                  activeFilter === f.key
                    ? 'bg-accent text-white border-accent'
                    : 'bg-midnight-700/60 border-midnight-400 text-text-300 hover:bg-midnight-600 hover:text-text-100'
                }`}
              >
                {f.label}
              </button>
            ))}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-text-400 hover:text-text-200 px-2 py-1 underline-offset-4 hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          {/* Facets from your own dreams: moods and tags */}
          {(moodOptions.length > 0 || tagOptions.length > 0) && (
            <div className="space-y-3">
              {moodOptions.length > 0 && (
                <div>
                  <div className="text-[9px] uppercase tracking-[1.5px] text-text-500 mb-1.5 px-1">Mood</div>
                  <div className="flex flex-wrap gap-1.5">
                    {moodOptions.map((m) => (
                      <button
                        key={m}
                        onClick={() => setMoodFilter(moodFilter === m ? null : m)}
                        className={`capitalize text-xs px-3.5 py-1.5 rounded-3xl border transition-all active:scale-[0.985] ${
                          moodFilter === m ? 'tag-accent' : 'tag hover:bg-midnight-500'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {tagOptions.length > 0 && (
                <div>
                  <div className="text-[9px] uppercase tracking-[1.5px] text-text-500 mb-1.5 px-1">Threads</div>
                  <div className="flex flex-wrap gap-1.5">
                    {tagOptions.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTagFilter(tagFilter === t ? null : t)}
                        className={`text-xs px-3.5 py-1.5 rounded-3xl border transition-all active:scale-[0.985] ${
                          tagFilter === t ? 'tag-accent' : 'tag hover:bg-midnight-500'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* List area with refined states */}
        {isLoading ? (
          <div className="py-16 text-center">
            <div className="inline-flex items-center gap-2 text-text-400 text-sm tracking-wide">
              <div className="flex gap-1">
                <span className="w-1 h-1 bg-text-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1 h-1 bg-text-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1 h-1 bg-text-400 rounded-full animate-bounce" />
              </div>
              Opening the archive…
            </div>
          </div>
        ) : loadError ? (
          <div className="card p-7 text-center border border-midnight-400/60">
            <p className="text-text-200 mb-2 tracking-tight">The threads feel tangled right now.</p>
            <p className="text-sm text-text-400 mb-5 leading-relaxed">{loadError}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="btn-secondary text-sm tracking-wide"
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
        ) : dreams.length > 0 ? (
          /* Dreams exist, but nothing matches the current search/filters */
          <div className="card p-8 text-center">
            <p className="text-text-200 mb-2 tracking-tight">No nights match these threads.</p>
            <p className="text-sm text-text-400 mb-5">Try a different word, or let the filters go.</p>
            <button onClick={clearFilters} className="btn-secondary text-sm tracking-wide">
              Clear filters
            </button>
          </div>
        ) : (
          /* Significantly improved poetic empty state — minimal, artistic, welcoming */
          <div className="journal-empty">
            <div className="journal-empty-art" aria-hidden="true">
              <div className="journal-empty-moon" />
            </div>

            <p className="text-[18px] font-medium tracking-[-0.015em] text-text-100 mb-3">
              The first thread begins in silence.
            </p>

            <p className="max-w-[26ch] text-text-300 text-[14.5px] leading-relaxed tracking-[-0.005em]">
              Dreams visit in the dark. When one lingers at dawn, return here and weave it into something you can keep.
            </p>

            <Link 
              href="/journal/new" 
              className="mt-9 btn-secondary text-sm px-8 py-3 tracking-wide"
            >
              Begin your first night
            </Link>
          </div>
        )}

        {/* Elegant floating action button — well-integrated, not generic */}
        <div className="fixed bottom-6 right-6 z-40 sm:hidden">
          <Link 
            href="/journal/new"
            className="group flex h-14 w-14 items-center justify-center rounded-full border border-midnight-400/50 bg-midnight-700/90 backdrop-blur-md shadow-[0_10px_30px_-8px_rgba(0,0,0,0.55)] active:scale-[0.94] transition-all hover:border-accent/60 hover:bg-midnight-600/90"
            aria-label="Capture a new dream"
          >
            <span className="text-accent text-[26px] font-light leading-none tracking-tighter select-none transition-colors group-hover:text-accent/90">+</span>
          </Link>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
