import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DreamView from './DreamView';
import BottomNav from '@/components/BottomNav';
import type { Dream } from '@/types/database';

interface DreamDetailProps {
  params: Promise<{ id: string }>;
}

export default async function DreamDetail({ params }: DreamDetailProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  const supabase = await createClient();

  const { data: dream, error } = await supabase
    .from('dreams')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !dream) {
    notFound();
  }

  const typedDream = dream as Dream;

  return (
    <div className="min-h-screen bg-midnight-900 text-text-50">
      {/* Header - consistent elegant style */}
      <header className="sticky top-0 z-30 bg-midnight-900/95 backdrop-blur-md border-b border-midnight-500">
        <div className="max-w-2xl mx-auto px-5 flex h-16 items-center justify-between">
          <Link href="/journal" className="text-text-300 hover:text-text-100 flex items-center gap-2 text-sm">
            ← Journal
          </Link>
          <div className="flex gap-2 text-sm">
            <Link 
              href="/journal" 
              className="btn-ghost px-4 py-1.5 text-xs rounded-2xl"
            >
              Full journal
            </Link>
          </div>
        </div>
      </header>

      <div className="page max-w-2xl">
        <DreamView dream={typedDream} />
      </div>

      <BottomNav />
    </div>
  );
}