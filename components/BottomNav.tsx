"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
      router.push('/');
    } catch {
      setSigningOut(false);
      router.push('/');
    }
  }

  const isActive = (path: string) => pathname === path || (path === '/journal' && pathname?.startsWith('/journal/'));

  return (
    <nav className="bottom-nav fixed bottom-0 left-0 right-0 bg-midnight-900/95 backdrop-blur-lg border-t border-midnight-500 z-50 sm:hidden">
      <div className="max-w-2xl mx-auto flex justify-around items-center h-16 px-2 text-sm">
        <Link 
          href="/journal" 
          className={`flex flex-col items-center ${isActive('/journal') ? 'text-accent font-medium' : 'text-text-300 active:text-text-100'}`}
        >
          <span className="text-xl mb-px">☾</span>
          <span className="text-[10px] tracking-widest">JOURNAL</span>
        </Link>
        <Link 
          href="/journal/new" 
          className={`flex flex-col items-center ${isActive('/journal/new') ? 'text-accent font-medium' : 'text-text-300 active:text-text-100'}`}
        >
          <span className="text-xl mb-px">✦</span>
          <span className="text-[10px] tracking-widest">NEW</span>
        </Link>
        <button 
          onClick={handleSignOut} 
          disabled={signingOut}
          className="flex flex-col items-center text-text-300 active:text-text-100 disabled:opacity-60"
        >
          <span className="text-xl mb-px">↩</span>
          <span className="text-[10px] tracking-widest">{signingOut ? '...' : 'LEAVE'}</span>
        </button>
      </div>
    </nav>
  );
}
