"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import Logo from '@/components/Logo';
import { createClient } from '@/lib/supabase/client';
import { fetchDreams } from '@/lib/dreams';
import { downloadExport } from '@/lib/export';

export default function AccountPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!cancelled) setEmail(session?.user?.email ?? null);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  async function handleExport(format: 'markdown' | 'json') {
    if (exporting) return;
    setExporting(true);
    try {
      const { dreams } = await fetchDreams();
      downloadExport(dreams, format);
    } catch {}
    setExporting(false);
  }

  async function handleDelete() {
    if (deleting || confirmText.trim().toLowerCase() !== 'delete') return;
    setDeleting(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc('delete_account');
      if (rpcError) throw rpcError;

      // The user row is gone; clear the local session and leave.
      try {
        await supabase.auth.signOut();
      } catch {}
      window.location.href = '/';
    } catch (err) {
      console.error('account deletion failed:', err);
      setError('Your account couldn’t be deleted right now. Please try again.');
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-midnight-900">
      <header className="sticky top-0 z-30 bg-midnight-900/95 backdrop-blur-md border-b border-midnight-500">
        <div className="max-w-2xl mx-auto px-5 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size="md" />
            <div className="w-px h-3 bg-text-500/30" />
            <span className="text-[10px] tracking-[1.5px] text-text-400 font-medium">ACCOUNT</span>
          </div>
          <Link href="/journal" className="text-text-300 hover:text-text-100 text-sm">
            Journal →
          </Link>
        </div>
      </header>

      <div className="page max-w-2xl pb-28">
        <div className="page-header">
          <div>
            <h1 className="page-title">Account</h1>
            <p className="text-text-400 text-xs tracking-[1.25px] mt-1.5 uppercase">
              {email ?? 'Signed in'}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Export */}
          <div className="card p-6">
            <h2 className="text-lg font-medium text-text-50 mb-1.5">Take your dreams with you</h2>
            <p className="text-sm text-text-300 mb-4">
              Download everything you&rsquo;ve recorded. The file is created on your device.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleExport('markdown')}
                disabled={exporting}
                className="btn-secondary text-sm px-5 py-2.5 disabled:opacity-60"
              >
                Export Markdown
              </button>
              <button
                onClick={() => handleExport('json')}
                disabled={exporting}
                className="btn-secondary text-sm px-5 py-2.5 disabled:opacity-60"
              >
                Export JSON
              </button>
            </div>
          </div>

          {/* Privacy */}
          <div className="card p-6">
            <h2 className="text-lg font-medium text-text-50 mb-1.5">Privacy</h2>
            <p className="text-sm text-text-300">
              What&rsquo;s stored, what the AI providers receive, and what never happens —{' '}
              <Link href="/privacy" className="text-accent hover:underline underline-offset-4">
                read the privacy page
              </Link>
              .
            </p>
          </div>

          {/* Delete account */}
          <div className="card p-6 border-red-900/40">
            <h2 className="text-lg font-medium text-text-50 mb-1.5">Delete your account</h2>
            <p className="text-sm text-text-300 mb-4 leading-relaxed">
              This permanently erases your account and everything in it — every dream, image,
              reflection, and intention. It cannot be undone. Consider exporting first.
            </p>

            {error && (
              <div className="mb-4 rounded-2xl border border-red-900/30 bg-midnight-700 px-4 py-3 text-sm text-red-400/80">
                {error}
              </div>
            )}

            <label htmlFor="confirm-delete" className="block text-xs text-text-400 mb-2">
              Type <span className="text-text-200 font-mono">delete</span> to confirm
            </label>
            <div className="flex gap-3">
              <input
                id="confirm-delete"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="delete"
                autoComplete="off"
                className="input flex-1 py-2.5 text-sm max-w-[200px]"
              />
              <button
                onClick={handleDelete}
                disabled={deleting || confirmText.trim().toLowerCase() !== 'delete'}
                className="rounded-2xl bg-red-600/90 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleting ? 'Erasing…' : 'Delete forever'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
