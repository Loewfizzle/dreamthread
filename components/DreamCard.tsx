"use client";

import React from 'react';
import Link from 'next/link';
import type { Dream } from '@/lib/dreams';
import { parseDreamDate } from '@/lib/dream-utils';

interface DreamCardProps {
  dream: Dream;
  onClick?: () => void;
}

export default function DreamCard({ dream, onClick }: DreamCardProps) {
  const date = dream.dream_date ? parseDreamDate(dream.dream_date) : new Date();
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });

  const content = dream.content || '';
  const excerpt = content.length > 140
    ? content.slice(0, 137).trim() + '…'
    : content;

  const isLucid = dream.is_lucid || (dream.lucidity ?? 0) >= 4;
  const lucidity = typeof dream.lucidity === 'number'
    ? Math.max(1, Math.min(5, dream.lucidity))
    : null;

  return (
    <Link 
      href={`/journal/${dream.id}`} 
      onClick={onClick}
      className="block card card-interactive px-6 py-6 active:scale-[0.997] focus-visible:ring-1 focus-visible:ring-accent/30"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[11px] font-medium text-text-400 tracking-[0.5px] mb-1.5">
            {formattedDate}
            {isLucid ? (
              <>
                <span className="inline-block w-px h-2.5 bg-text-500/40" />
                <span className="text-accent font-medium">LUCID</span>
              </>
            ) : lucidity !== null ? (
              <>
                <span className="inline-block w-px h-2.5 bg-text-500/40" />
                <span className="tabular-nums">{lucidity}/5</span>
              </>
            ) : null}
          </div>
          <h3 className="font-semibold text-[18px] tracking-[-0.02em] text-text-50 leading-tight pr-1 line-clamp-2">
            {dream.title || 'Untitled dream'}
          </h3>
        </div>
      </div>

      <p className="text-text-200 text-[14.5px] leading-relaxed line-clamp-3 pr-1 mb-4 tracking-[-0.005em]">
        {excerpt}
      </p>

      {(dream.tags && dream.tags.length > 0) || dream.mood ? (
        <div className="flex flex-wrap gap-1.5 -mb-0.5">
          {dream.mood && (
            <span className="tag text-[10px] py-px px-3 tracking-wide capitalize">{dream.mood}</span>
          )}
          {dream.tags?.slice(0, 3).map((tag, idx) => (
            <span key={idx} className="tag text-[10px] py-px px-3 tracking-wide">{tag}</span>
          ))}
        </div>
      ) : null}
    </Link>
  );
}
