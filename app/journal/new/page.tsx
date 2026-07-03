"use client";

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import NewDreamForm from './NewDreamForm';
import BottomNav from '@/components/BottomNav';
import { getIntentionAction } from '@/app/actions/intentions';

function NewDreamInner() {
  // The installed PWA launches with ?capture=voice for bedside recording
  const searchParams = useSearchParams();
  const autoStartVoice = searchParams.get('capture') === 'voice';

  // In the morning, show back last night's intention
  const [morningIntention, setMorningIntention] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const now = new Date();
      const hour = now.getHours();
      if (hour < 4 || hour >= 12) return;
      const lastNight = new Date(now);
      lastNight.setDate(lastNight.getDate() - 1);
      const pad = (n: number) => String(n).padStart(2, '0');
      const nightDate = `${lastNight.getFullYear()}-${pad(lastNight.getMonth() + 1)}-${pad(lastNight.getDate())}`;
      try {
        const { intention } = await getIntentionAction(nightDate);
        if (!cancelled && intention) setMorningIntention(intention);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-midnight-900">
      {/* Consistent header */}
      <header className="sticky top-0 z-30 bg-midnight-900/95 backdrop-blur-md border-b border-midnight-500">
        <div className="max-w-2xl mx-auto px-5 flex h-16 items-center">
          <Link href="/journal" className="text-text-300 hover:text-text-100 flex items-center gap-2 text-sm">
            ← Back to journal
          </Link>
        </div>
      </header>

      <div className="page max-w-2xl pb-28">
        <div className="mb-7">
          <h1 className="page-title">New dream</h1>
          <p className="text-text-300 mt-1">Speak it or write it — we’ll keep it safe.</p>
        </div>

        {morningIntention && (
          <div className="mb-6 card p-5 border-l-2 border-accent/40">
            <div className="text-[10px] uppercase tracking-[1.5px] text-text-400 mb-1.5">
              Last night’s intention
            </div>
            <p className="text-[15px] text-text-100 italic">“{morningIntention}”</p>
            <p className="text-[11px] text-text-400 mt-2">Did it visit you? Capture what you remember.</p>
          </div>
        )}

        <div className="card p-6 sm:p-8">
          <NewDreamForm autoStartVoice={autoStartVoice} />
        </div>

        <p className="text-center text-xs text-text-400 mt-8 max-w-[26ch] mx-auto">
          Everything is private. You can always edit or delete later.
        </p>
      </div>

      <BottomNav />
    </div>
  );
}

export default function NewDream() {
  // useSearchParams requires a Suspense boundary for static prerendering
  return (
    <Suspense>
      <NewDreamInner />
    </Suspense>
  );
}
