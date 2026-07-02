import Link from 'next/link'
import { getDreams } from '@/lib/dreams'
import type { Dream } from '@/lib/dreams'

export const dynamic = 'force-dynamic'

const formatDreamDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dreamDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.floor((today.getTime() - dreamDay.getTime()) / (1000 * 3600 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) {
    return date.toLocaleDateString(undefined, { weekday: 'long' })
  }

  const opts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' }
  if (date.getFullYear() !== now.getFullYear()) {
    opts.year = 'numeric'
  }
  return date.toLocaleDateString(undefined, opts)
}

const getExcerpt = (content: string): string => {
  const text = content.trim().replace(/\s+/g, ' ')
  if (text.length <= 135) return text

  const cut = text.slice(0, 135)
  const lastPunct = Math.max(
    cut.lastIndexOf('.'),
    cut.lastIndexOf('!'),
    cut.lastIndexOf('?')
  )

  if (lastPunct > 70) {
    return cut.slice(0, lastPunct + 1).trim()
  }
  return cut.trim() + '…'
}

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
      <div className="mx-auto max-w-2xl px-5">
        {/* Poetic, minimal header */}
        <header className="pt-14 pb-9">
          <p className="text-[10px] font-medium tracking-[4px] text-muted/70">DREAMTHREAD</p>
          <h1 className="mt-1 text-6xl font-semibold tracking-[-2.8px] text-foreground">Journal</h1>
          <p className="mt-4 max-w-[17rem] text-[15px] leading-snug text-muted/90">
            The night’s quiet offerings, held gently here.
          </p>
        </header>

        {fetchError && (
          <div className="mb-8 rounded-3xl border border-border/70 bg-card p-8 text-center">
            <p className="text-muted">Unable to retrieve your dreams at the moment.</p>
            <p className="mt-1 text-sm text-muted/70">Please return in a little while.</p>
          </div>
        )}

        {dreams.length === 0 && !fetchError ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center py-12 text-center">
            <div className="mb-8 h-px w-10 bg-border/50" />
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">No dreams yet</h2>
            <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-muted/90">
              Tap the button to record your first one.
            </p>
          </div>
        ) : null}

        {dreams.length > 0 && (
          <div className="space-y-8 pb-24">
            {dreams.map((dream) => {
              const formattedDate = formatDreamDate(dream.dream_date)
              const excerpt = getExcerpt(dream.content)

              return (
                <Link
                  key={dream.id}
                  href={`/journal/${dream.id}`}
                  className="block active:scale-[0.985] transition-transform duration-150"
                >
                  <article
                    className="group rounded-3xl border border-border/60 bg-card px-7 py-8 transition-all duration-200 hover:border-border/80 hover:shadow-[0_1px_6px_rgb(0,0,0,0.03)]"
                  >
                    {/* Elegant meta row */}
                    <div className="flex items-center gap-2 text-[11px] font-medium tracking-[3px] text-muted/80">
                      <time dateTime={dream.dream_date}>{formattedDate}</time>

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

                    {/* Title or excerpt as primary text */}
                    {dream.title ? (
                      <>
                        <h3 className="mt-6 text-[21px] font-semibold tracking-[-0.35px] leading-tight text-foreground">
                          {dream.title}
                        </h3>
                        <p className="mt-3 text-[14.5px] leading-[1.7] text-foreground/75 line-clamp-3">
                          {excerpt}
                        </p>
                      </>
                    ) : (
                      <p className="mt-6 text-[15.5px] leading-[1.7] text-foreground/80 line-clamp-4">
                        {excerpt}
                      </p>
                    )}
                  </article>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Beautiful minimal floating action button */}
      <Link
        href="/journal/new"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_4px_16px_rgb(0,0,0,0.12)] transition-all active:scale-[0.96] hover:bg-primary/90"
        aria-label="Record a new dream"
      >
        <span className="text-[26px] font-light leading-none -mt-px">+</span>
      </Link>
    </div>
  )
}
