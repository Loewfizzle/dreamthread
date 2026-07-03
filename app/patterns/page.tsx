"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import Logo from '@/components/Logo';
import type { Dream } from '@/lib/dreams';
import { fetchDreams } from '@/lib/dreams';
import { computeDreamStats, extractKeywords, parseDreamDate, type DreamStats } from '@/lib/dream-utils';

interface WeekBucket {
  label: string; // e.g. "Jun 8"
  count: number;
}

interface DayCell {
  key: string;
  dreamt: boolean;
  isToday: boolean;
}

interface MoodSlice {
  mood: string;
  count: number;
}

interface Patterns {
  stats: DreamStats;
  weeks: WeekBucket[]; // oldest first, 8 buckets
  days: DayCell[]; // last 28 days, oldest first
  moods: MoodSlice[]; // top 5
  keywords: Array<{ word: string; count: number }>;
}

// All time math happens here, called from the load effect (not render)
function computePatterns(dreams: Dream[]): Patterns {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayMs = 24 * 3600 * 1000;

  const dreamDays = new Set(
    dreams.map(d => {
      const t = parseDreamDate(d.dream_date);
      return new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime();
    })
  );

  // Last 8 weeks of activity, aligned to 7-day buckets ending today
  const weeks: WeekBucket[] = [];
  for (let w = 7; w >= 0; w--) {
    const end = today.getTime() - (w * 7 - 1) * dayMs;
    const start = end - 7 * dayMs;
    const count = dreams.filter(d => {
      const t = parseDreamDate(d.dream_date).getTime();
      return t >= start && t < end;
    }).length;
    const startDate = new Date(start);
    weeks.push({
      label: startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count,
    });
  }

  // Recall grid: the last 28 days
  const days: DayCell[] = [];
  for (let i = 27; i >= 0; i--) {
    const t = today.getTime() - i * dayMs;
    days.push({
      key: new Date(t).toISOString().slice(0, 10),
      dreamt: dreamDays.has(t),
      isToday: i === 0,
    });
  }

  // Mood distribution (top 5, case-insensitive)
  const moodCounts: Record<string, number> = {};
  dreams.forEach(d => {
    const key = d.mood?.trim().toLowerCase();
    if (key) moodCounts[key] = (moodCounts[key] || 0) + 1;
  });
  const moods = Object.entries(moodCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([mood, count]) => ({ mood, count }));

  return {
    stats: computeDreamStats(dreams, now),
    weeks,
    days,
    moods,
    keywords: extractKeywords(dreams, 8),
  };
}

export default function PatternsPage() {
  const [patterns, setPatterns] = useState<Patterns | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { dreams, error } = await fetchDreams();
      if (cancelled) return;
      if (error) {
        setLoadError(true);
      } else {
        setPatterns(computePatterns(dreams));
      }
      setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const maxWeek = patterns ? Math.max(1, ...patterns.weeks.map(w => w.count)) : 1;
  const maxMood = patterns && patterns.moods.length > 0 ? patterns.moods[0].count : 1;

  return (
    <div className="min-h-screen bg-midnight-900">
      <header className="sticky top-0 z-30 bg-midnight-900/95 backdrop-blur-md border-b border-midnight-500">
        <div className="max-w-2xl mx-auto px-5 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size="md" />
            <div className="w-px h-3 bg-text-500/30" />
            <span className="text-[10px] tracking-[1.5px] text-text-400 font-medium">PATTERNS</span>
          </div>
          <Link href="/journal" className="text-text-300 hover:text-text-100 text-sm">
            Journal →
          </Link>
        </div>
      </header>

      <div className="page max-w-2xl pb-28">
        <div className="page-header">
          <div>
            <h1 className="page-title">Patterns</h1>
            <p className="text-text-400 text-xs tracking-[1.25px] mt-1.5 uppercase">
              What your nights are weaving
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center">
            <div className="inline-flex items-center gap-2 text-text-400 text-sm tracking-wide">
              <div className="flex gap-1">
                <span className="w-1 h-1 bg-text-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1 h-1 bg-text-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1 h-1 bg-text-400 rounded-full animate-bounce" />
              </div>
              Tracing the threads…
            </div>
          </div>
        ) : loadError ? (
          <div className="card p-7 text-center">
            <p className="text-text-200 mb-2 tracking-tight">The threads feel tangled right now.</p>
            <p className="text-sm text-text-400">We couldn’t reach your journal. Please try again.</p>
          </div>
        ) : !patterns || patterns.stats.total === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-text-200 mb-2 tracking-tight">Patterns need a few nights first.</p>
            <p className="text-sm text-text-400 mb-5">Record a handful of dreams and the shapes will begin to show here.</p>
            <Link href="/journal/new" className="btn-secondary text-sm tracking-wide">
              Record a dream
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Stat tiles */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="card p-4">
                <div className="text-[9px] uppercase tracking-[1.5px] text-text-400 mb-1.5">All time</div>
                <div className="text-xl font-semibold tracking-[-0.02em] text-text-50 tabular-nums">{patterns.stats.total}</div>
                <div className="text-[11px] text-text-400 mt-0.5">{patterns.stats.total === 1 ? 'night' : 'nights'}</div>
              </div>
              <div className="card p-4">
                <div className="text-[9px] uppercase tracking-[1.5px] text-text-400 mb-1.5">This month</div>
                <div className="text-xl font-semibold tracking-[-0.02em] text-text-50 tabular-nums">{patterns.stats.nightsThisMonth}</div>
                <div className="text-[11px] text-text-400 mt-0.5">{patterns.stats.nightsThisMonth === 1 ? 'night' : 'nights'}</div>
              </div>
              <div className="card p-4">
                <div className="text-[9px] uppercase tracking-[1.5px] text-text-400 mb-1.5">Lucid</div>
                <div className="text-xl font-semibold tracking-[-0.02em] text-text-50 tabular-nums">{patterns.stats.lucidCount}</div>
                <div className="text-[11px] text-text-400 mt-0.5">
                  {patterns.stats.lucidCount > 0 ? `${Math.round(patterns.stats.lucidShare * 100)}% of dreams` : 'so far'}
                </div>
              </div>
            </div>

            {/* Recall calendar: last 28 nights */}
            <div>
              <div className="text-[10px] uppercase tracking-[1.5px] text-text-400 mb-3">Remembered nights · last 4 weeks</div>
              <div className="card p-5">
                <div className="grid grid-cols-7 gap-2 justify-items-center">
                  {patterns.days.map((day) => (
                    <div
                      key={day.key}
                      title={day.key}
                      className={`w-3 h-3 rounded-full ${
                        day.dreamt
                          ? 'bg-accent/80'
                          : 'bg-midnight-500'
                      } ${day.isToday ? 'ring-1 ring-accent/50 ring-offset-2 ring-offset-midnight-800' : ''}`}
                    />
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-4 text-[10px] text-text-400">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent/80" /> dream remembered</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-midnight-500" /> quiet night</span>
                </div>
              </div>
            </div>

            {/* Nights per week, last 8 weeks */}
            <div>
              <div className="text-[10px] uppercase tracking-[1.5px] text-text-400 mb-3">Rhythm · nights per week</div>
              <div className="card p-5">
                <div className="flex items-end gap-2 h-24">
                  {patterns.weeks.map((w, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <div
                        className={`w-full rounded-t-md ${w.count > 0 ? 'bg-accent/60' : 'bg-midnight-500'}`}
                        style={{ height: w.count > 0 ? `${Math.max(12, (w.count / maxWeek) * 100)}%` : '4px' }}
                        title={`${w.count} ${w.count === 1 ? 'night' : 'nights'}`}
                      />
                      <span className="text-[8.5px] text-text-500 whitespace-nowrap">{i % 2 === 0 ? w.label : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mood distribution */}
            {patterns.moods.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-[1.5px] text-text-400 mb-3">How the nights felt</div>
                <div className="card p-5 space-y-3">
                  {patterns.moods.map((m) => (
                    <div key={m.mood} className="flex items-center gap-3">
                      <span className="w-24 text-sm text-text-200 capitalize truncate">{m.mood}</span>
                      <div className="flex-1 h-2 rounded-full bg-midnight-600 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-accent/50"
                          style={{ width: `${(m.count / maxMood) * 100}%` }}
                        />
                      </div>
                      <span className="w-6 text-right text-xs text-text-400 tabular-nums">{m.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recurring symbols — tap to search the journal */}
            {patterns.keywords.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-[1.5px] text-text-400 mb-3">Recurring threads · tap to revisit</div>
                <div className="flex flex-wrap gap-1.5">
                  {patterns.keywords.map((k, i) => (
                    <Link
                      key={k.word}
                      href={`/journal?q=${encodeURIComponent(k.word)}`}
                      className={`text-xs px-3.5 py-1.5 rounded-3xl border transition-all active:scale-[0.985] ${
                        i === 0 ? 'tag-accent' : 'tag hover:bg-midnight-500'
                      }`}
                    >
                      {k.word}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
