"use client";

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import NewDreamForm from './NewDreamForm';
import BottomNav from '@/components/BottomNav';

function NewDreamInner() {
  // The installed PWA launches with ?capture=voice for bedside recording
  const searchParams = useSearchParams();
  const autoStartVoice = searchParams.get('capture') === 'voice';

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
