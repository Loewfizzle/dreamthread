"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DreamForm from '@/components/DreamForm';
import BottomNav from '@/components/BottomNav';
import type { Dream } from '@/lib/dreams';
import { loadDreams, saveDreams } from '@/lib/dreams';

export default function NewDream() {
  const router = useRouter();

  function handleSave(dreamData: Partial<Dream> & { id?: string }) {
    const existing = loadDreams();

    const newDream: Dream = {
      id: dreamData.id || `d_${Date.now().toString(36)}`,
      title: dreamData.title || 'Untitled dream',
      content: dreamData.content || '',
      dream_date: dreamData.dream_date || new Date().toISOString().split('T')[0],
      tags: dreamData.tags,
      lucidity: dreamData.lucidity,
      mood: dreamData.mood,
      created_at: new Date().toISOString(),
    };

    // If editing an existing (though new page shouldn't, support reuse)
    const withoutOld = existing.filter(d => d.id !== newDream.id);
    const updated = [newDream, ...withoutOld];

    saveDreams(updated);
    router.push('/journal');
  }

  function handleCancel() {
    router.push('/journal');
  }

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
          <DreamForm 
            onSave={handleSave} 
            onCancel={handleCancel} 
          />
        </div>

        <p className="text-center text-xs text-text-400 mt-8 max-w-[26ch] mx-auto">
          Everything is private. You can always edit or delete later.
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
