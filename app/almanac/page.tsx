"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import Logo from '@/components/Logo';
import type { Dream } from '@/lib/dreams';
import { fetchDreams } from '@/lib/dreams';
import { parseDreamDate, getExcerpt, formatDreamDate } from '@/lib/dream-utils';
import { computeYearStats, type YearStats } from '@/lib/year-stats';
import { shareYearCard } from '@/lib/postcard';

const MONTH_LABELS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

export default function AlmanacPage() {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [stats, setStats] = useState<YearStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { dreams: loaded } = await fetchDreams();
      if (cancelled) return;
      const distinctYears = [...new Set(loaded.map(d => parseDreamDate(d.dream_date).getFullYear()))].sort(
        (a, b) => b - a
      );
      setDreams(loaded);
      setYears(distinctYears);
      if (distinctYears.length > 0) {
        setStats(computeYearStats(loaded, distinctYears[0]));
      }
      setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  function selectYear(year: number) {
    setStats(computeYearStats(dreams, year));
  }

  async function handleShareYear() {
    if (!stats || sharing) return;
    setSharing(true);
    setShareNote(null);
    const result = await shareYearCard(stats);
    if (result === 'downloaded') setShareNote('Year card saved to your downloads.');
    else if (result === 'failed') setShareNote('The year card couldn’t be made this time.');
    setSharing(false);
  }

  const maxMonthly = stats ? Math.max(1, ...stats.monthly) : 1;

  return (
    <div className="min-h-screen bg-midnight-900">
      <header className="sticky top-0 z-30 bg-midnight-900/95 backdrop-blur-md border-b border-midnight-500">
        <div className="max-w-2xl mx-auto px-5 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size="md" />
            <div className="w-px h-3 bg-text-500/30" />
            <span className="text-[10px] tracking-[1.5px] text-text-400 font-medium">ALMANAC</span>
          </div>
          <Link href="/patterns" className="text-text-300 hover:text-text-100 text-sm">
            Patterns →
          </Link>
        </div>
      </header>

      <div className="page max-w-2xl pb-28">
        <div className="page-header">
          <div>
            <h1 className="page-title">The year in dreams</h1>
            <p className="text-text-400 text-xs tracking-[1.25px] mt-1.5 uppercase">
              A quiet almanac of your nights
            </p>
          </div>
          {stats && stats.nights > 0 && (
            <button
              onClick={handleShareYear}
              disabled={sharing}
              className="btn-secondary text-sm px-5 py-2.5 hidden sm:inline-flex disabled:opacity-60"
            >
              {sharing ? 'Weaving…' : 'Share your year'}
            </button>
          )}
        </div>

        {shareNote && (
          <div className="mb-6 rounded-2xl border border-midnight-400/60 bg-midnight-700 px-4 py-3 text-sm text-text-300">
            {shareNote}
          </div>
        )}

        {isLoading ? (
          <div className="py-16 text-center">
            <div className="inline-flex items-center gap-2 text-text-400 text-sm tracking-wide">
              <div className="flex gap-1">
                <span className="w-1 h-1 bg-text-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1 h-1 bg-text-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1 h-1 bg-text-400 rounded-full animate-bounce" />
              </div>
              Leafing back through the year…
            </div>
          </div>
        ) : !stats || stats.nights === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-text-200 mb-2 tracking-tight">The almanac is still blank.</p>
            <p className="text-sm text-text-400 mb-5">A year of dreams becomes something worth leafing through.</p>
            <Link href="/journal/new" className="btn-secondary text-sm tracking-wide">
              Record a dream
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Year selector */}
            {years.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {years.map(y => (
                  <button
                    key={y}
                    onClick={() => selectYear(y)}
                    className={`px-4 py-[7px] text-xs tracking-[0.5px] rounded-3xl border transition-all active:scale-[0.985] font-medium ${
                      stats.year === y
                        ? 'bg-accent text-white border-accent'
                        : 'bg-midnight-700/60 border-midnight-400 text-text-300 hover:bg-midnight-600 hover:text-text-100'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}

            {/* Headline numbers */}
            <div className="card p-7 text-center">
              <div className="text-[10px] uppercase tracking-[1.75px] text-text-400 mb-2">{stats.year}</div>
              <div className="text-5xl font-semibold tracking-[-0.03em] text-text-50 tabular-nums mb-1.5">
                {stats.nights}
              </div>
              <div className="text-sm text-text-300">{stats.nights === 1 ? 'night remembered' : 'nights remembered'}</div>
              <div className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-text-400">
                {stats.lucidCount > 0 && (
                  <span><span className="text-accent">{stats.lucidCount}</span> lucid · {Math.round(stats.lucidShare * 100)}%</span>
                )}
                {stats.longestStreak > 1 && (
                  <span>longest streak · <span className="text-text-200">{stats.longestStreak} nights</span></span>
                )}
                {stats.topMood && (
                  <span>most felt · <span className="text-text-200 capitalize">{stats.topMood}</span></span>
                )}
              </div>
            </div>

            {/* Month rhythm */}
            <div>
              <div className="text-[10px] uppercase tracking-[1.5px] text-text-400 mb-3">The shape of the year</div>
              <div className="card p-5">
                <div className="flex items-end gap-1.5 h-24">
                  {stats.monthly.map((count, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <div
                        className={`w-full rounded-t-md ${count > 0 ? 'bg-accent/60' : 'bg-midnight-500'}`}
                        style={{ height: count > 0 ? `${Math.max(10, (count / maxMonthly) * 100)}%` : '4px' }}
                        title={`${count} ${count === 1 ? 'night' : 'nights'}`}
                      />
                      <span className="text-[9px] text-text-500">{MONTH_LABELS[i]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Seasonal moods */}
            {stats.seasons.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-[1.5px] text-text-400 mb-3">How the seasons felt</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {stats.seasons.map(s => (
                    <div key={s.season} className="card p-4 text-center">
                      <div className="text-[9px] uppercase tracking-[1.5px] text-text-400 mb-1.5">{s.season}</div>
                      <div className="text-[15px] font-medium text-text-50 capitalize">{s.mood}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Symbols that arrived / faded */}
            {(stats.arrived.length > 0 || stats.faded.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {stats.arrived.length > 0 && (
                  <div className="card p-5">
                    <div className="text-[10px] uppercase tracking-[1.5px] text-text-400 mb-3">Threads that arrived</div>
                    <div className="flex flex-wrap gap-1.5">
                      {stats.arrived.map(w => (
                        <Link key={w} href={`/journal?q=${encodeURIComponent(w)}`} className="tag-accent text-xs px-3.5 py-1.5 rounded-3xl border">
                          {w}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {stats.faded.length > 0 && (
                  <div className="card p-5">
                    <div className="text-[10px] uppercase tracking-[1.5px] text-text-400 mb-3">Threads that faded</div>
                    <div className="flex flex-wrap gap-1.5">
                      {stats.faded.map(w => (
                        <Link key={w} href={`/journal?q=${encodeURIComponent(w)}`} className="tag text-xs px-3.5 py-1.5 rounded-3xl border hover:bg-midnight-500">
                          {w}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bookmark dreams */}
            <div className="space-y-2.5">
              {stats.firstDream && (
                <Link href={`/journal/${stats.firstDream.id}`} className="block card p-4 active:scale-[0.993]">
                  <div className="text-[10px] uppercase tracking-[1.5px] text-text-400 mb-1.5">
                    Where the year began · {formatDreamDate(stats.firstDream.dream_date)}
                  </div>
                  <div className="font-medium text-[15px] text-text-50 line-clamp-1">{stats.firstDream.title || 'Untitled dream'}</div>
                  <div className="text-text-300 text-xs leading-relaxed line-clamp-2 mt-1">{getExcerpt(stats.firstDream.content, 100)}</div>
                </Link>
              )}
              {stats.longestDream && stats.longestDream.id !== stats.firstDream?.id && (
                <Link href={`/journal/${stats.longestDream.id}`} className="block card p-4 active:scale-[0.993]">
                  <div className="text-[10px] uppercase tracking-[1.5px] text-text-400 mb-1.5">
                    The deepest night · {formatDreamDate(stats.longestDream.dream_date)}
                  </div>
                  <div className="font-medium text-[15px] text-text-50 line-clamp-1">{stats.longestDream.title || 'Untitled dream'}</div>
                  <div className="text-text-300 text-xs leading-relaxed line-clamp-2 mt-1">{getExcerpt(stats.longestDream.content, 100)}</div>
                </Link>
              )}
            </div>

            {/* Mobile share */}
            <button
              onClick={handleShareYear}
              disabled={sharing}
              className="w-full btn-secondary text-sm py-3.5 sm:hidden disabled:opacity-60"
            >
              {sharing ? 'Weaving…' : '✧ Share your year'}
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
