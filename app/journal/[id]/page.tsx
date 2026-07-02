"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import DreamForm from '@/components/DreamForm';
import BottomNav from '@/components/BottomNav';
import type { Dream } from '@/lib/dreams';
import { loadDreams, saveDreams } from '@/lib/dreams';

export default function DreamDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [dream, setDream] = useState<Dream | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [interpreting, setInterpreting] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load the specific dream with calm loading
  useEffect(() => {
    const id = params.id;
    if (!id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNotFound(true);
      return;
    }
    // Small artificial breath for perceived loading (keeps UI calm)
    const t = setTimeout(() => {
      try {
        const all = loadDreams();
        const found = all.find(d => d.id === id);
        if (found) {
          setDream(found);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true); // treat as not found gracefully rather than crash
      }
    }, 80);
    return () => clearTimeout(t);
  }, [params.id]);

  function updateDream(updated: Dream) {
    setSaveError(null);
    try {
      const all = loadDreams();
      const newAll = all.map(d => d.id === updated.id ? updated : d);
      saveDreams(newAll);
      setDream(updated);
      setIsEditing(false);
    } catch {
      setSaveError('We couldn’t save the changes. Your edits are still here — please try again.');
    }
  }

  function handleSaveFromForm(data: Partial<Dream>) {
    if (!dream) return;
    const updatedDream: Dream = {
      ...dream,
      ...data,
    } as Dream;
    updateDream(updatedDream);
  }

  async function deleteDream() {
    if (!dream || !confirm('Delete this dream forever?')) return;
    setDeleting(true);
    setSaveError(null);
    try {
      const all = loadDreams();
      const filtered = all.filter(d => d.id !== dream.id);
      saveDreams(filtered);
      router.push('/journal');
    } catch {
      setSaveError('We couldn’t remove the dream right now. Please try again.');
      setDeleting(false);
    }
  }

  async function generateInterpretation() {
    if (!dream) return;
    setInterpreting(true);
    setInterpretation(null);

    try {
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: dream.title,
          content: dream.content,
          mood: dream.mood,
          lucidity: dream.lucidity,
        }),
      });
      const data = await res.json();
      setInterpretation(data.interpretation || 'The dream is still unfolding its meaning for you.');
    } catch {
      setInterpretation('There is a quiet thread running through this night. Sit with the feeling it left behind.');
    } finally {
      setInterpreting(false);
    }
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-midnight-900 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-text-300 mb-4">Dream not found.</p>
          <Link href="/journal" className="btn">Return to journal</Link>
        </div>
      </div>
    );
  }

  if (!dream) {
    return (
      <div className="min-h-screen bg-midnight-900 flex items-center justify-center p-6">
        <div className="text-center text-text-400 text-sm flex items-center gap-2">
          <div className="flex gap-1">
            <span className="w-1 h-1 bg-text-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1 h-1 bg-text-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1 h-1 bg-text-400 rounded-full animate-bounce" />
          </div>
          Opening this night…
        </div>
      </div>
    );
  }

  const date = new Date(dream.dream_date);
  const formattedDate = date.toLocaleDateString('en-US', { 
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-midnight-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-midnight-900/95 backdrop-blur-md border-b border-midnight-500">
        <div className="max-w-2xl mx-auto px-5 flex h-16 items-center justify-between">
          <Link href="/journal" className="text-text-300 hover:text-text-100 flex items-center gap-2 text-sm">
            ← Journal
          </Link>
          <div className="flex gap-2 text-sm">
            {!isEditing && (
              <>
                <button 
                  onClick={() => setIsEditing(true)} 
                  disabled={deleting}
                  className="btn-ghost px-4 py-1.5 text-xs disabled:opacity-50"
                >
                  Edit
                </button>
                <button 
                  onClick={deleteDream} 
                  disabled={deleting}
                  className="btn-ghost px-4 py-1.5 text-xs text-text-400 hover:text-red-400/80 disabled:opacity-50"
                >
                  {deleting ? 'Removing…' : 'Delete'}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="page max-w-2xl">
        {saveError && (
          <div className="mb-4 rounded-2xl border border-red-900/30 bg-midnight-700 px-4 py-3 text-sm text-red-400/80">
            {saveError}
          </div>
        )}

        {!isEditing ? (
          <>
            {/* View mode - calm reading experience */}
            <div className="mb-6">
              <div className="text-xs uppercase tracking-[1.5px] text-text-400 mb-1.5">{formattedDate}</div>
              <h1 className="text-3xl sm:text-[32px] font-semibold tracking-[-0.025em] leading-none text-text-50 pr-3">
                {dream.title}
              </h1>
            </div>

            {/* Meta row - refined */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm mb-6 text-text-300">
              <div className="flex items-center gap-2">
                <span>Lucidity</span>
                <div className="flex gap-px pl-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 mt-0.5 rounded-full ${i < (dream.lucidity || 3) ? 'bg-accent' : 'bg-midnight-400'}`} />
                  ))}
                </div>
                <span className="text-text-400 tabular-nums">{dream.lucidity || 3}/5</span>
              </div>
              {dream.mood && <div>Mood · <span className="text-text-100">{dream.mood}</span></div>}
            </div>

            {dream.tags && dream.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {dream.tags.map((tag, i) => (
                  <span key={i} className="tag">{tag}</span>
                ))}
              </div>
            )}

            {/* The dream body - generous reading */}
            <div className="card p-7 sm:p-9">
              <div className="dream-content whitespace-pre-line">
                {dream.content}
              </div>
            </div>

            {/* Interpretation / Reflect */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-3 px-1">
                <div>
                  <div className="uppercase text-[10px] tracking-[1.5px] text-text-400">Reflection</div>
                  <div className="text-lg font-medium tracking-tight">A quiet mirror</div>
                </div>
                {!interpretation && (
                  <button 
                    onClick={generateInterpretation} 
                    disabled={interpreting}
                    className="btn-secondary text-xs px-5 py-2.5"
                  >
                    {interpreting ? 'Reflecting…' : 'Ask for an interpretation'}
                  </button>
                )}
              </div>

              {interpreting && (
                <div className="card p-7 text-text-300 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-1 h-1 bg-accent rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1 h-1 bg-accent rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1 h-1 bg-accent rounded-full animate-bounce" />
                    </div>
                    <span>A quiet reflection is forming…</span>
                  </div>
                </div>
              )}

              {interpretation && (
                <div className="card p-7 sm:p-8 border-l-2 border-accent/60 bg-midnight-700">
                  <div className="prose text-[15px] leading-relaxed text-text-100">
                    {interpretation.split('\n\n').map((para, idx) => (
                      <p key={idx} className={idx > 0 ? 'mt-4' : ''}>{para}</p>
                    ))}
                  </div>
                  <button 
                    onClick={() => setInterpretation(null)} 
                    className="mt-6 text-xs text-text-400 hover:text-text-200 underline-offset-4 hover:underline"
                  >
                    Hide reflection
                  </button>
                </div>
              )}

              {!interpretation && !interpreting && (
                <p className="text-xs px-1 text-text-400 max-w-prose">A gentle, non-prescriptive reflection generated for you. Always take what resonates and leave the rest.</p>
              )}
            </div>
          </>
        ) : (
          /* Edit mode - reuse same form */
          <div>
            <div className="mb-6">
              <h1 className="page-title text-2xl">Edit dream</h1>
            </div>
            <div className="card p-6 sm:p-8">
              <DreamForm 
                initialDream={dream} 
                onSave={handleSaveFromForm} 
                onCancel={() => setIsEditing(false)} 
                isEditing 
              />
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
