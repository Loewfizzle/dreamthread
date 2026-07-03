"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) =>
    pathname === path || (path === '/journal' && pathname?.startsWith('/journal/') && pathname !== '/journal/new');

  const itemClass = (path: string) =>
    `flex flex-col items-center ${isActive(path) ? 'text-accent font-medium' : 'text-text-300 active:text-text-100'}`;

  return (
    <nav className="bottom-nav fixed bottom-0 left-0 right-0 bg-midnight-900/95 backdrop-blur-lg border-t border-midnight-500 z-50 sm:hidden">
      <div className="max-w-2xl mx-auto flex justify-around items-center h-16 px-2 text-sm">
        <Link href="/journal" className={itemClass('/journal')}>
          <span className="text-xl mb-px">☾</span>
          <span className="text-[10px] tracking-widest">JOURNAL</span>
        </Link>
        <Link href="/journal/new" className={itemClass('/journal/new')}>
          <span className="text-xl mb-px">✦</span>
          <span className="text-[10px] tracking-widest">NEW</span>
        </Link>
        <Link href="/patterns" className={itemClass('/patterns')}>
          <span className="text-xl mb-px">◐</span>
          <span className="text-[10px] tracking-widest">PATTERNS</span>
        </Link>
      </div>
    </nav>
  );
}
