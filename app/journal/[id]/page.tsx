import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getDream } from '@/lib/dreams'
import type { Dream } from '@/lib/dreams'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from '../SignOutButton'

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

interface DreamDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function DreamDetailPage({ params }: DreamDetailPageProps) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  let dream: Dream | null = null
  let fetchError: string | null = null

  try {
    dream = await getDream(id)
  } catch (err) {
    console.error('Failed to load dream:', err)
    fetchError = 'Could not load this dream right now.'
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <div className="mx-auto max-w-2xl px-5 py-12">
          <Link
            href="/journal"
            className="inline-flex items-center gap-1 text-sm font-medium text-muted transition hover:text-foreground mb-8"
          >
            ← Back to Journal
          </Link>

          <div className="rounded-3xl border border-border/70 bg-card p-8 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-2">
              Unable to load dream
            </h1>
            <p className="text-muted">{fetchError}</p>
            <Link
              href="/journal"
              className="mt-6 inline-flex items-center justify-center rounded-2xl border border-border bg-card px-6 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted/10"
            >
              Return to Journal
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!dream) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <div className="mx-auto max-w-2xl px-5 py-12">
          <Link
            href="/journal"
            className="inline-flex items-center gap-1 text-sm font-medium text-muted transition hover:text-foreground mb-8"
          >
            ← Back to Journal
          </Link>

          <div className="rounded-3xl border border-border/70 bg-card p-8 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-2">
              Dream not found
            </h1>
            <p className="text-muted">This dream may have been deleted or never existed.</p>
            <Link
              href="/journal"
              className="mt-6 inline-flex items-center justify-center rounded-2xl border border-border bg-card px-6 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted/10"
            >
              Return to Journal
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const formattedDate = formatDreamDate(dream.dream_date)

  return (
    <div className="min-h-screen bg-background font-sans">
      <div className="mx-auto max-w-2xl px-5 py-12">
        {/* Back navigation */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/journal"
            className="inline-flex items-center gap-1 text-sm font-medium text-muted transition hover:text-foreground"
          >
            ← Back to Journal
          </Link>
          <SignOutButton />
        </div>

        <article className="rounded-3xl border border-border/60 bg-card px-7 py-9 transition-all">
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium tracking-[3px] text-muted/80 mb-6">
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

          {/* Title */}
          {dream.title && (
            <h1 className="text-3xl font-semibold tracking-[-0.5px] leading-tight text-foreground mb-6">
              {dream.title}
            </h1>
          )}

          {/* Full content */}
          <div className="mt-6 text-[15.5px] leading-[1.75] text-foreground/85 whitespace-pre-wrap">
            {dream.content}
          </div>
        </article>
      </div>
    </div>
  )
}
