"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import Logo from '@/components/Logo';
import { askDreams, type DreamSource } from '@/app/actions/ask';
import { formatDreamDate } from '@/lib/dream-utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: DreamSource[];
}

const SAMPLE_QUESTIONS = [
  'What do I dream about most?',
  'How have my moods been shifting at night?',
  'What keeps returning in my dreams?',
];

export default function AskPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [asking, setAsking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, asking]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || asking) return;

    const history = messages.slice(-4).map(({ role, content }) => ({ role, content }));
    setMessages(m => [...m, { role: 'user', content: q }]);
    setInput('');
    setAsking(true);

    try {
      const result = await askDreams(q, history);
      setMessages(m => [
        ...m,
        {
          role: 'assistant',
          content: result.answer ?? result.error ?? 'The conversation faltered. Please try again.',
          sources: result.sources,
        },
      ]);
    } catch {
      setMessages(m => [
        ...m,
        { role: 'assistant', content: 'The conversation faltered. Please try again in a moment.' },
      ]);
    } finally {
      setAsking(false);
    }
  }

  return (
    <div className="min-h-screen bg-midnight-900 flex flex-col">
      <header className="sticky top-0 z-30 bg-midnight-900/95 backdrop-blur-md border-b border-midnight-500">
        <div className="max-w-2xl mx-auto px-5 flex h-16 items-center justify-between w-full">
          <div className="flex items-center gap-2.5">
            <Logo size="md" />
            <div className="w-px h-3 bg-text-500/30" />
            <span className="text-[10px] tracking-[1.5px] text-text-400 font-medium">ASK</span>
          </div>
          <Link href="/journal" className="text-text-300 hover:text-text-100 text-sm">
            Journal →
          </Link>
        </div>
      </header>

      <div className="flex-1 w-full max-w-2xl mx-auto px-5 pt-6 pb-40 sm:pb-32">
        {messages.length === 0 ? (
          <div className="pt-10 text-center">
            <div className="text-3xl mb-5">✶</div>
            <h1 className="text-2xl font-semibold tracking-tight text-text-50 mb-2">Ask your dreams</h1>
            <p className="text-text-300 text-sm max-w-[34ch] mx-auto leading-relaxed mb-10">
              A conversation with your own archive. Answers are drawn only from the
              nights you’ve recorded.
            </p>
            <div className="flex flex-col items-center gap-2.5">
              {SAMPLE_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => ask(q)}
                  className="tag text-sm px-5 py-2.5 rounded-3xl border hover:bg-midnight-500 transition-all active:scale-[0.985]"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((msg, i) =>
              msg.role === 'user' ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] rounded-3xl rounded-br-lg bg-accent/15 border border-accent/25 px-5 py-3 text-[15px] text-text-100 leading-relaxed">
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div key={i} className="flex justify-start">
                  <div className="max-w-[92%]">
                    <div className="card rounded-3xl rounded-bl-lg px-5 py-4 text-[15px] text-text-100 leading-relaxed">
                      {msg.content.split('\n\n').map((para, idx) => (
                        <p key={idx} className={idx > 0 ? 'mt-3' : ''}>{para}</p>
                      ))}
                    </div>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 px-1">
                        <div className="text-[9px] uppercase tracking-[1.5px] text-text-500 mb-1.5">Drawn from these nights</div>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.sources.map(s => (
                            <Link
                              key={s.id}
                              href={`/journal/${s.id}`}
                              className="tag text-[11px] px-3 py-1 rounded-3xl border hover:bg-midnight-500"
                            >
                              {s.title || formatDreamDate(s.dream_date)}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
            {asking && (
              <div className="flex justify-start">
                <div className="card rounded-3xl rounded-bl-lg px-5 py-4 inline-flex items-center gap-2 text-text-400 text-sm">
                  <div className="flex gap-1">
                    <span className="w-1 h-1 bg-accent rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1 h-1 bg-accent rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1 h-1 bg-accent rounded-full animate-bounce" />
                  </div>
                  Leafing through your nights…
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {/* Composer, above the bottom nav on mobile */}
      <div className="fixed bottom-16 sm:bottom-0 left-0 right-0 bg-midnight-900/95 backdrop-blur-md border-t border-midnight-500">
        <form
          onSubmit={(e) => { e.preventDefault(); ask(input); }}
          className="max-w-2xl mx-auto px-5 py-3.5 flex gap-2.5"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your nights…"
            disabled={asking}
            className="input flex-1 py-3 text-[15px]"
            aria-label="Ask a question about your dreams"
          />
          <button
            type="submit"
            disabled={asking || !input.trim()}
            className="btn px-6 text-sm disabled:opacity-50"
          >
            Ask
          </button>
        </form>
      </div>

      <BottomNav />
    </div>
  );
}
