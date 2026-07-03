"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import DreamForm from '@/components/DreamForm';
import BottomNav from '@/components/BottomNav';
import type { Dream } from '@/lib/dreams';
import { DREAM_COLUMNS } from '@/lib/dreams';
import type { DreamFormValues } from '@/components/DreamForm';
import { parseDreamDate } from '@/lib/dream-utils';
import { createClient } from '@/lib/supabase/client';
import { generateDreamImageAction, updateDreamAction, deleteDreamAction } from '../new/actions';
import { getDreamEchoes, type EchoDream } from '@/app/actions/echoes';
import { getExcerpt, formatDreamDate } from '@/lib/dream-utils';
import { sharePostcard } from '@/lib/postcard';

export default function DreamDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [dream, setDream] = useState<Dream | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [interpretError, setInterpretError] = useState<string | null>(null);
  const [interpreting, setInterpreting] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [echoes, setEchoes] = useState<EchoDream[]>([]);
  const [sharing, setSharing] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);

  // Load the specific dream from Supabase
  useEffect(() => {
    const id = params.id;
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data: dbDream, error } = await supabase
          .from('dreams')
          .select(DREAM_COLUMNS)
          .eq('id', id)
          .single();
        if (cancelled) return;
        if (!error && dbDream) {
          setDream(dbDream as Dream);
        } else {
          setNotFound(true);
        }
      } catch {
        if (!cancelled) setNotFound(true);
      }
    })();
    return () => { cancelled = true; };
  }, [params.id]);

  // Echoes: dreams similar in meaning, loaded quietly after the dream itself
  useEffect(() => {
    if (!dream?.id) return;
    let cancelled = false;
    getDreamEchoes(dream.id)
      .then(({ echoes: found }) => {
        if (!cancelled && found) setEchoes(found);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [dream?.id]);

  async function handleSaveFromForm(values: DreamFormValues) {
    if (!dream) return;
    setSaveError(null);

    const result = await updateDreamAction(dream.id, {
      title: values.title,
      content: values.content,
      mood: values.mood,
      is_lucid: values.is_lucid,
      tags: values.tags,
      dream_date: values.dream_date,
    });

    if (result.error) {
      setSaveError(result.error);
      return;
    }
    setDream({ ...dream, ...values });
    setIsEditing(false);
  }

  async function deleteDream() {
    if (!dream || !confirm('Delete this dream forever?')) return;
    setDeleting(true);
    setSaveError(null);

    const result = await deleteDreamAction(dream.id);
    if (result.error) {
      setSaveError(result.error);
      setDeleting(false);
      return;
    }
    router.push('/journal');
  }

  async function generateInterpretation() {
    if (!dream) return;
    setInterpreting(true);
    setInterpretation(null);
    setInterpretError(null);

    try {
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: dream.title,
          content: dream.content,
          mood: dream.mood,
          is_lucid: dream.is_lucid,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error || !data.interpretation) {
        setInterpretError(data.error || 'The reflection couldn’t form right now. Please try again in a moment.');
      } else {
        setInterpretation(data.interpretation);
      }
    } catch {
      setInterpretError('We couldn’t reach the reflection service. Check your connection and try again.');
    } finally {
      setInterpreting(false);
    }
  }

  async function handleSharePostcard() {
    if (!dream || sharing) return;
    setSharing(true);
    setShareNote(null);
    const result = await sharePostcard(dream);
    if (result === 'downloaded') setShareNote('Postcard saved to your downloads.');
    else if (result === 'failed') setShareNote('The postcard couldn’t be made this time.');
    setSharing(false);
  }

  async function handleGenerateImage() {
    if (!dream) return;

    const currentCount = dream.image_generation_count || 0;
    if (currentCount >= 2) {
      setImageError("You've reached the regeneration limit for this dream.");
      return;
    }

    setGeneratingImage(true);
    setImageError(null);

    try {
      const result = await generateDreamImageAction(dream.id);
      if (result.error) {
        setImageError(result.error);
      } else if (result.imageUrl) {
        setDream({
          ...dream,
          image_url: result.imageUrl,
          image_generation_count: result.count ?? currentCount + 1,
        });
      }
    } catch {
      setImageError('Failed to generate image. Please try again.');
    } finally {
      setGeneratingImage(false);
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

  const date = parseDreamDate(dream.dream_date);
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
                  onClick={handleSharePostcard}
                  disabled={sharing || deleting || !dream}
                  className="btn-ghost px-4 py-1.5 text-xs disabled:opacity-50"
                >
                  {sharing ? 'Weaving…' : 'Share'}
                </button>
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

        {shareNote && (
          <div className="mb-4 rounded-2xl border border-midnight-400/60 bg-midnight-700 px-4 py-3 text-sm text-text-300 flex items-center justify-between gap-3">
            <span>{shareNote}</span>
            <button
              onClick={() => setShareNote(null)}
              className="text-text-400 hover:text-text-200 text-lg leading-none px-1"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        {!isEditing ? (
          <>
            {/* View mode - calm reading experience */}
            <div className="mb-6">
              <div className="text-xs uppercase tracking-[1.5px] text-text-400 mb-1.5">{formattedDate}</div>
              <h1 className="text-3xl sm:text-[32px] font-semibold tracking-[-0.025em] leading-none text-text-50 pr-3">
                {dream.title || 'Untitled dream'}
              </h1>
            </div>

            {/* Meta row - refined */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm mb-6 text-text-300">
              {dream.is_lucid && (
                <span className="text-accent font-medium tracking-wider">LUCID</span>
              )}
              {dream.mood && <div>Mood · <span className="text-text-100 capitalize">{dream.mood}</span></div>}
            </div>

            {(dream.tags || []).length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {(dream.tags || []).map((tag, i) => (
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

            {/* Image generation UI - artistic, calm, with limits */}
            <div className="mt-8">
              <div className="uppercase text-[10px] tracking-[1.5px] text-text-400 mb-2">Visual Echo</div>

              {dream.image_url ? (
                <div>
                  <div className="relative overflow-hidden rounded-3xl border border-midnight-500/60 bg-midnight-800">
                    <img
                      src={dream.image_url}
                      alt={`AI visualization of ${dream.title || 'this dream'}`}
                      className="w-full h-auto max-h-[420px] object-cover"
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <span className="text-text-400">AI-generated scene from this dream’s essence</span>
                    {(dream.image_generation_count || 0) < 2 ? (
                      <button
                        onClick={handleGenerateImage}
                        disabled={generatingImage}
                        className="btn-secondary text-xs px-4 py-1.5 disabled:opacity-50"
                      >
                        {generatingImage ? 'Regenerating…' : 'Regenerate (1 left)'}
                      </button>
                    ) : (
                      <span className="text-text-400">You&apos;ve reached the regeneration limit for this dream.</span>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleGenerateImage}
                  disabled={generatingImage}
                  className="w-full btn py-4 text-base flex items-center justify-center gap-3 disabled:bg-accent/60"
                >
                  {generatingImage ? (
                    <>
                      <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce" />
                      </span>
                      Weaving an image from your dream…
                    </>
                  ) : (
                    <>✧ Generate Image</>
                  )}
                </button>
              )}

              {imageError && (
                <div className="mt-3 text-sm text-red-400/80">{imageError}</div>
              )}
            </div>

            {/* Echoes: threads to other nights, matched by meaning */}
            {echoes.length > 0 && (
              <div className="mt-8">
                <div className="uppercase text-[10px] tracking-[1.5px] text-text-400 mb-3">Echoes · threads to other nights</div>
                <div className="space-y-2.5">
                  {echoes.map((echo) => (
                    <Link
                      key={echo.id}
                      href={`/journal/${echo.id}`}
                      className="block card p-4 active:scale-[0.993] focus-visible:ring-1 focus-visible:ring-accent/20"
                    >
                      <div className="flex items-center justify-between text-[11px] text-text-400 mb-1.5">
                        <span>{formatDreamDate(echo.dream_date)}</span>
                        {echo.mood && <span className="text-text-300 capitalize">{echo.mood}</span>}
                      </div>
                      <div className="font-medium text-[15px] tracking-[-0.01em] text-text-50 line-clamp-1 pr-2">
                        {echo.title || 'Untitled dream'}
                      </div>
                      <div className="text-text-300 text-xs leading-relaxed line-clamp-2 mt-1 pr-1">
                        {getExcerpt(echo.content, 100)}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

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

              {interpretError && !interpreting && (
                <div className="mb-3 rounded-2xl border border-red-900/30 bg-midnight-700 px-4 py-3 text-sm text-red-400/80">
                  {interpretError}
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