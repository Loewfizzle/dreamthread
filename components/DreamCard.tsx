"use client";

import React from 'react';
import Link from 'next/link';
import type { Dream } from '@/lib/dreams';

interface DreamCardProps {
  dream: Dream;
  onClick?: () => void;
}

export default function DreamCard({ dream, onClick }: DreamCardProps) {
  const date = new Date(dream.dream_date);
  const formattedDate = date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined 
  });

  const excerpt = dream.content.length > 140 
    ? dream.content.slice(0, 137).trim() + '…' 
    : dream.content;

  const lucidity = Math.max(1, Math.min(5, dream.lucidity || 3));

  return (
    <Link 
      href={`/journal/${dream.id}`} 
      onClick={onClick}
      className="block card card-interactive px-5 py-5 active:scale-[0.997] focus-visible:ring-1 focus-visible:ring-accent/30"
    >
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div>
          <div className="text-[12px] font-medium text-text-400 tracking-[0.3px] mb-px">
            {formattedDate}
          </div>
          <h3 className="font-semibold text-[17px] tracking-[-0.015em] text-text-50 leading-tight pr-2">
            {dream.title || 'Untitled dream'}
          </h3>
        </div>

        {/* Lucidity indicator - subtle moon phases */}
        <div className="flex gap-px pt-1 flex-shrink-0" aria-label={`Lucidity level ${lucidity} of 5`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div 
              key={i} 
              className={`w-[5px] h-[5px] rounded-full transition-colors ${i < lucidity ? 'bg-accent/90' : 'bg-midnight-500'}`} 
            />
          ))}
        </div>
      </div>

      <p className="text-text-200 text-[14.2px] leading-[1.55] line-clamp-3 pr-1 mb-3">
        {excerpt}
      </p>

      {(dream.tags && dream.tags.length > 0) || dream.mood ? (
        <div className="flex flex-wrap gap-1.5">
          {dream.mood && (
            <span className="tag text-[11px] py-0.5 px-3">{dream.mood}</span>
          )}
          {dream.tags?.slice(0, 3).map((tag, idx) => (
            <span key={idx} className="tag text-[11px] py-0.5 px-3">{tag}</span>
          ))}
        </div>
      ) : null}
    </Link>
  );
}
