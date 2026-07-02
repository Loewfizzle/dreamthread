import Link from 'next/link'
import { getDreams } from '@/lib/dreams'
import type { Dream } from '@/lib/dreams'

export const dynamic = 'force-dynamic'

export default async function JournalPage() {
  let dreams: Dream[] = []
  let fetchError: string | null = null

  try {
    dreams = await getDreams({ limit: 12 })
  } catch (err) {
    console.error('Failed to load dreams:', err)
    fetchError = 'Could not load your dreams right now. You may need to sign in.'
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Header */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <span className="text-lg font-semibold tracking-tighter">D</span>
              </div>
              <span className="text-xl font-semibold tracking-tight text-foreground">
                Dreamthread
              </span>
            </div>
            <h1 className="mt-3 text-4xl font-semibold tracking-tighter text-foreground">
              Your Journal
            </h1>
          </div>

          <Link
            href="/journal/new"
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            + New Dream
          </Link>
        </div>

        {fetchError && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {fetchError}
          </div>
        )}

        {dreams.length === 0 && !fetchError ? (
          <div className="rounded-3xl border border-border bg-card p-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted/10">
              <span className="text-2xl">🌙</span>
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              No dreams yet
            </h2>
            <p className="mt-2 text-muted">
              Start your journal by recording your first dream.
            </p>
            <Link
              href="/journal/new"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-6 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted/10"
            >
              Record your first dream
            </Link>
          </div>
        ) : null}

        {dreams.length > 0 && (
          <div className="space-y-4">
            {dreams.map((dream) => {
              const date = new Date(dream.dream_date)
              const formattedDate = date.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })

              const preview =
                dream.content.length > 160
                  ? dream.content.slice(0, 157) + '…'
                  : dream.content

              return (
                <div
                  key={dream.id}
                  className="group rounded-3xl border border-border bg-card p-6 transition hover:border-primary/30"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 text-xs text-muted">
                        <time dateTime={dream.dream_date}>{formattedDate}</time>
                        {dream.is_lucid && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                            Lucid
                          </span>
                        )}
                        {dream.mood && (
                          <span className="rounded-full bg-muted/10 px-2 py-0.5 text-[10px] font-medium text-muted">
                            {dream.mood}
                          </span>
                        )}
                      </div>

                      <h3 className="mt-2 line-clamp-1 text-xl font-semibold tracking-tight text-foreground group-hover:text-primary">
                        {dream.title || 'Untitled Dream'}
                      </h3>

                      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">
                        {preview}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="text-muted">
                      {dream.content.split(/\s+/).length} words
                    </span>
                    {/* Future: link to /journal/[id] */}
                    <span className="text-muted transition group-hover:text-primary">
                      View details →
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link
            href="/journal/new"
            className="text-sm font-medium text-muted hover:text-foreground"
          >
            + Record another dream
          </Link>
        </div>
      </div>
    </div>
  )
}
