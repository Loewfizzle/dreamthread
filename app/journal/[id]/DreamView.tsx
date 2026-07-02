'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateDreamAction, deleteDreamAction } from '../new/actions'
import type { Dream } from '@/lib/dreams'
import { formatDreamDate } from '@/lib/dream-utils'

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

interface DreamViewProps {
  dream: Dream
}

export default function DreamView({ dream }: DreamViewProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleteConfirm, setIsDeleteConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Local state for edit form, initialized from dream
  const [editTitle, setEditTitle] = useState(dream.title || '')
  const [editContent, setEditContent] = useState(dream.content)
  const [editMood, setEditMood] = useState(dream.mood || '')
  const [editIsLucid, setEditIsLucid] = useState(dream.is_lucid)

  const handleEdit = () => {
    setIsEditing(true)
    setIsDeleteConfirm(false)
    setError(null)
    // Reset form to current values
    setEditTitle(dream.title || '')
    setEditContent(dream.content)
    setEditMood(dream.mood || '')
    setEditIsLucid(dream.is_lucid)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setError(null)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData()
    formData.append('title', editTitle)
    formData.append('content', editContent)
    formData.append('mood', editMood)
    if (editIsLucid) {
      formData.append('is_lucid', 'on')
    }

    startTransition(async () => {
      const result = await updateDreamAction(dream.id, {} as any, formData) // prevState not really used but match sig

      if (result.error) {
        setError(result.error)
      } else if (result.success) {
        setIsEditing(false)
        // Refresh the server component to get fresh data (including updated_at)
        router.refresh()
      }
    })
  }

  const handleDelete = () => {
    setIsDeleteConfirm(true)
    setError(null)
  }

  const handleCancelDelete = () => {
    setIsDeleteConfirm(false)
  }

  const handleConfirmDelete = () => {
    setError(null)

    startTransition(async () => {
      const result = await deleteDreamAction(dream.id)

      if (result.error) {
        setError(result.error)
        setIsDeleteConfirm(false)
      } else if (result.success) {
        router.push('/journal')
        router.refresh()
      }
    })
  }

  return (
    <article className="rounded-3xl border border-border/60 bg-card px-7 py-9 transition-all">
      {/* Meta + Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium tracking-[3px] text-muted/80">
          <time dateTime={dream.dream_date}>{formatDreamDate(dream.dream_date)}</time>

          {dream.mood && (
            <>
              <span className="text-muted/40">·</span>
              <span className="font-normal tracking-normal text-accent">{dream.mood}</span>
            </>
          )}

          {dream.is_lucid && (
            <span className="ml-1 text-accent font-medium tracking-[1.5px]">LUCID</span>
          )}
        </div>

        {!isEditing && !isDeleteConfirm && (
          <div className="flex gap-3">
            <button
              onClick={handleEdit}
              className="rounded-2xl border border-border bg-card px-5 py-2 text-sm font-medium text-foreground transition hover:bg-muted/10"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="rounded-2xl border border-red-200 bg-red-50 px-5 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300 dark:hover:bg-red-950"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {isDeleteConfirm && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/50">
          <p className="text-sm text-red-700 dark:text-red-300 mb-3">
            Are you sure you want to delete this dream? This cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleCancelDelete}
              disabled={isPending}
              className="rounded-2xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted/10 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={isPending}
              className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {isPending ? 'Deleting...' : 'Yes, delete dream'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300">
          {error}
        </div>
      )}

      {!isEditing ? (
        <>
          {/* Title */}
          {dream.title && (
            <h1 className="text-3xl font-semibold tracking-[-0.5px] leading-tight text-foreground mb-6">
              {dream.title}
            </h1>
          )}

          {/* Full content */}
          <div className="mt-2 text-[15.5px] leading-[1.75] text-foreground/85 whitespace-pre-wrap">
            {dream.content}
          </div>
        </>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Edit Title */}
          <div>
            <label htmlFor="edit-title" className="mb-2 block text-sm font-medium text-foreground">
              Title <span className="text-muted">(optional)</span>
            </label>
            <input
              id="edit-title"
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="A short title for this dream..."
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-base text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>

          {/* Edit Content */}
          <div>
            <label htmlFor="edit-content" className="mb-2 block text-sm font-medium text-foreground">
              What happened in your dream? <span className="text-red-500">*</span>
            </label>
            <textarea
              id="edit-content"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={12}
              required
              className="w-full resize-y rounded-3xl border border-border bg-background px-4 py-4 text-base leading-relaxed text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>

          {/* Edit Mood */}
          <div>
            <label htmlFor="edit-mood" className="mb-2 block text-sm font-medium text-foreground">
              Mood <span className="text-muted">(optional)</span>
            </label>
            <select
              id="edit-mood"
              value={editMood}
              onChange={(e) => setEditMood(e.target.value)}
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-base text-foreground focus:border-primary focus:outline-none"
            >
              {moodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Edit is_lucid */}
          <div className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4">
            <input
              id="edit-is-lucid"
              type="checkbox"
              checked={editIsLucid}
              onChange={(e) => setEditIsLucid(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/30 accent-primary"
            />
            <div>
              <label htmlFor="edit-is-lucid" className="text-sm font-medium text-foreground">
                This was a lucid dream
              </label>
              <p className="text-xs text-muted">
                You were aware that you were dreaming while it was happening.
              </p>
            </div>
          </div>

          {/* Action buttons in edit mode */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={isPending}
              className="rounded-2xl border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition hover:bg-muted/10 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !editContent.trim()}
              className="rounded-2xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
            >
              {isPending ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      )}
    </article>
  )
}
