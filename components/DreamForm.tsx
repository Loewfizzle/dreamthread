"use client";

import React, { useState } from 'react';
import type { Dream } from '@/lib/dreams';
import { parseDreamDate } from '@/lib/dream-utils';

// The date input needs the LOCAL date; slicing the ISO string would use
// the UTC date and could shift dreams near midnight by a day on save.
function toLocalDateInput(iso?: string): string {
  const d = iso ? parseDreamDate(iso) : new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export interface DreamFormValues {
  id?: string;
  title: string | null;
  content: string;
  dream_date: string;
  mood: string | null;
  is_lucid: boolean;
  tags: string[] | null;
}

interface DreamFormProps {
  initialDream?: Partial<Dream>;
  onSave: (values: DreamFormValues) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const MOODS = ['Peaceful', 'Curious', 'Joyful', 'Melancholy', 'Anxious', 'Vivid', 'Strange', 'Tender'];

export default function DreamForm({ initialDream, onSave, onCancel, isEditing = false }: DreamFormProps) {
  const [title, setTitle] = useState(initialDream?.title || '');
  const [content, setContent] = useState(initialDream?.content || '');
  const [dreamDate, setDreamDate] = useState(toLocalDateInput(initialDream?.dream_date));
  const [mood, setMood] = useState(initialDream?.mood || '');
  const [isLucid, setIsLucid] = useState(initialDream?.is_lucid ?? false);
  const [tags, setTags] = useState<string[]>(initialDream?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput('');
    }
  }

  function removeTag(tagToRemove: string) {
    setTags(tags.filter(t => t !== tagToRemove));
  }

  function handleTagKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
    if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setSaving(true);

    // Store the chosen day as local NOON: a bare YYYY-MM-DD would become
    // midnight UTC and render as the previous day west of Greenwich.
    const [y, m, d] = dreamDate.split('-').map(Number);
    const dreamData: DreamFormValues = {
      id: initialDream?.id,
      title: title.trim() || null,
      content: content.trim(),
      dream_date: new Date(y, m - 1, d, 12).toISOString(),
      mood: mood.trim() || null,
      is_lucid: isLucid,
      tags: tags.length > 0 ? tags : null,
    };

    // Small artificial delay for calm feel
    await new Promise(r => setTimeout(r, 180));

    onSave(dreamData);
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      {/* Date and title row */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="date">Night of</label>
          <input
            id="date"
            type="date"
            value={dreamDate}
            onChange={(e) => setDreamDate(e.target.value)}
            className="input py-[15px]"
          />
        </div>
        <div className="sm:col-span-3">
          <label className="label" htmlFor="title">Title <span className="text-text-500">(optional)</span></label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            placeholder="The river that sang my name"
          />
        </div>
      </div>

      {/* The dream - primary content */}
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <label className="label" htmlFor="content">The dream</label>
          <span className="text-[11px] text-text-500">Write freely</span>
        </div>

        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="textarea"
          placeholder="I was standing at the edge of a forest where the trees had faces I almost recognized..."
          required
        />
      </div>

      {/* Lucid dream toggle - matches the create form */}
      <div className="flex items-start gap-3 rounded-2xl border border-midnight-400 bg-midnight-700/40 p-4">
        <input
          id="edit-is-lucid"
          type="checkbox"
          checked={isLucid}
          onChange={(e) => setIsLucid(e.target.checked)}
          className="mt-1 h-4 w-4 rounded accent-accent"
        />
        <div>
          <label htmlFor="edit-is-lucid" className="text-sm font-medium text-text-100">
            This was a lucid dream
          </label>
          <p className="text-xs text-text-400">
            You were aware that you were dreaming while it was happening.
          </p>
        </div>
      </div>

      {/* Mood chips */}
      <div>
        <label className="label">How did it feel?</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {MOODS.map((m) => {
            // Case-insensitive: DB dreams may store lowercase mood values
            const selected = mood.toLowerCase() === m.toLowerCase();
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMood(selected ? '' : m)}
                className={`px-4 py-2 rounded-3xl text-sm transition-all border active:scale-[0.985] ${selected
                  ? 'tag-accent'
                  : 'tag hover:bg-midnight-500'}`}
              >
                {m}
              </button>
            );
          })}
        </div>

        {/* Custom mood */}
        <input
          type="text"
          value={mood && !MOODS.some(m => m.toLowerCase() === mood.toLowerCase()) ? mood : ''}
          onChange={(e) => setMood(e.target.value)}
          placeholder="Or write your own feeling…"
          className="input py-3 text-sm"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="label">Tags</label>
        <div className="flex flex-wrap gap-1.5 mb-2.5 min-h-[28px]">
          {tags.map((tag, i) => (
            <button 
              key={i} 
              type="button" 
              onClick={() => removeTag(tag)} 
              className="tag text-xs flex items-center gap-1.5 active:bg-midnight-600"
            >
              {tag} <span className="opacity-60">×</span>
            </button>
          ))}
          {tags.length === 0 && <span className="text-xs text-text-500 py-1">No tags yet</span>}
        </div>
        <div className="flex gap-2">
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKey}
            placeholder="Add tag (press Enter)"
            className="input flex-1 py-3 text-sm"
          />
          <button type="button" onClick={addTag} className="btn-secondary px-6">Add</button>
        </div>
        <p className="text-[11px] text-text-500 mt-1 px-1">Separate by pressing return or comma</p>
      </div>

      {/* Actions - generous and clear */}
      <div className="pt-4 flex flex-col sm:flex-row gap-3">
        <button 
          type="submit" 
          disabled={!content.trim() || saving}
          className="btn flex-1 sm:flex-none sm:min-w-[180px] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving && (
            <span className="flex gap-1">
              <span className="w-1 h-1 bg-white/80 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1 h-1 bg-white/80 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1 h-1 bg-white/80 rounded-full animate-bounce" />
            </span>
          )}
          {saving ? 'Saving to your journal…' : isEditing ? 'Save changes' : 'Save dream'}
        </button>
        <button 
          type="button" 
          onClick={onCancel}
          className="btn-secondary flex-1 sm:flex-none"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
