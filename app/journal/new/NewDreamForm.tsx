'use client'

import { useActionState } from 'react'
import { createDreamAction, type NewDreamFormState } from './actions'

const moodOptions = [
  { value: '', label: 'No particular mood' },
  { value: 'calm', label: 'Calm' },
  { value: 'anxious', label: 'Anxious' },
  { value: 'exciting', label: 'Exciting' },
  { value: 'happy', label: 'Happy / Joyful' },
  { value: 'scary', label: 'Scary or Nightmare' },
  { value: 'sad', label: 'Sad' },
  { value: 'vivid', label: 'Vivid / Intense' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'confusing', label: 'Confusing' },
]

const initialState: NewDreamFormState = {}

export default function NewDreamForm() {
  const [state, formAction, isPending] = useActionState(
    createDreamAction,
    initialState
  )

  const values = state.values ?? {
    title: '',
    content: '',
    mood: '',
    is_lucid: false,
  }

  return (
    <form action={formAction} className="space-y-8">
      {/* Error banner */}
      {state.error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300">
          {state.error}
        </div>
      )}

      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          Title <span className="text-muted">(optional)</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          defaultValue={values.title}
          placeholder="A short title for this dream..."
          className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-base text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
        />
      </div>

      {/* Content - required */}
      <div>
        <label
          htmlFor="content"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          What happened in your dream? <span className="text-red-500">*</span>
        </label>
        <textarea
          id="content"
          name="content"
          required
          defaultValue={values.content}
          rows={12}
          placeholder="Describe the dream in as much detail as you remember..."
          className="w-full resize-y rounded-3xl border border-border bg-card px-4 py-4 text-base leading-relaxed text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
        />
        <p className="mt-1.5 text-xs text-muted">
          Be as detailed as you like. You can always edit later.
        </p>
      </div>

      {/* Mood select */}
      <div>
        <label
          htmlFor="mood"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          Mood <span className="text-muted">(optional)</span>
        </label>
        <select
          id="mood"
          name="mood"
          defaultValue={values.mood}
          className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-base text-foreground focus:border-primary focus:outline-none"
        >
          {moodOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Lucid checkbox */}
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
        <input
          id="is_lucid"
          name="is_lucid"
          type="checkbox"
          defaultChecked={values.is_lucid}
          className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/30 accent-primary"
        />
        <div>
          <label
            htmlFor="is_lucid"
            className="text-sm font-medium text-foreground"
          >
            This was a lucid dream
          </label>
          <p className="text-xs text-muted">
            You were aware that you were dreaming while it was happening.
          </p>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-2xl bg-primary py-3.5 text-base font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
      >
        {isPending ? 'Saving your dream…' : 'Save Dream Entry'}
      </button>

      <p className="text-center text-xs text-muted">
        Your dream is private and only visible to you.
      </p>
    </form>
  )
}
