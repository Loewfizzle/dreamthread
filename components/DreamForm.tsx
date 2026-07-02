"use client";

import React, { useState } from 'react';
import type { Dream } from '@/lib/dreams';
import VoiceRecorder from '@/components/VoiceRecorder';

interface DreamFormProps {
  initialDream?: Partial<Dream>;
  onSave: (dream: Omit<Dream, 'id'> & { id?: string }) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const MOODS = ['Peaceful', 'Curious', 'Joyful', 'Melancholy', 'Anxious', 'Vivid', 'Strange', 'Tender'];

export default function DreamForm({ initialDream, onSave, onCancel, isEditing = false }: DreamFormProps) {
  const [title, setTitle] = useState(initialDream?.title || '');
  const [content, setContent] = useState(initialDream?.content || '');
  const [dreamDate, setDreamDate] = useState(initialDream?.dream_date || new Date().toISOString().split('T')[0]);
  const [mood, setMood] = useState(initialDream?.mood || '');
  const [lucidity, setLucidity] = useState(initialDream?.lucidity || 3);
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

    const dreamData = {
      id: initialDream?.id,
      title: title.trim() || 'Untitled dream',
      content: content.trim(),
      dream_date: dreamDate,
      mood: mood || undefined,
      lucidity,
      tags: tags.length > 0 ? tags : undefined,
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

        {/* Voice recording (only for new dreams) */}
        {!isEditing && (
          <div className="mb-4">
            <VoiceRecorder 
              onTranscribed={(text) => {
                setContent(prev => {
                  const trimmed = text.trim();
                  if (!prev.trim()) return trimmed;
                  // Append naturally
                  return prev.trim().endsWith('.') || prev.trim().endsWith(',') || prev.trim().endsWith('…')
                    ? prev.trim() + ' ' + trimmed
                    : prev.trim() + '. ' + trimmed;
                });
              }}
              onError={(msg) => {
                // Optional: could surface globally, for now VoiceRecorder shows its own calm message
                console.log('Voice note:', msg);
              }}
            />
          </div>
        )}

        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="textarea"
          placeholder="I was standing at the edge of a forest where the trees had faces I almost recognized..."
          required
        />
      </div>

      {/* Lucidity - artistic control, large taps */}
      <div>
        <label className="label mb-3">How lucid was it?</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setLucidity(level)}
              className={`flex-1 py-3.5 rounded-3xl text-sm font-medium border active:scale-[0.985] transition-all touch-target ${lucidity === level 
                ? 'bg-accent border-accent text-white' 
                : 'bg-midnight-700 border-midnight-400 text-text-200 hover:bg-midnight-600'}`}
            >
              {level}
              <div className="text-[9px] tracking-widest opacity-70 mt-px">{level === 5 ? 'FULL' : level === 1 ? 'FAINT' : ''}</div>
            </button>
          ))}
        </div>
        <p className="text-xs text-text-400 mt-2 px-1">1 = barely remembered &nbsp;·&nbsp; 5 = fully aware and in control</p>
      </div>

      {/* Mood chips */}
      <div>
        <label className="label">How did it feel?</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {MOODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMood(mood === m ? '' : m)}
              className={`px-4 py-2 rounded-3xl text-sm transition-all border active:scale-[0.985] ${mood === m 
                ? 'tag-accent' 
                : 'tag hover:bg-midnight-500'}`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Custom mood */}
        <input 
          type="text" 
          value={mood && !MOODS.includes(mood) ? mood : ''} 
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
