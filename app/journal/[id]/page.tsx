import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getDream } from '@/lib/dreams'
import type { Dream } from '@/lib/dreams'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from '../SignOutButton'
import DreamView from './DreamView'
import { formatDreamDate } from '@/lib/dream-utils'

export const dynamic = 'force-dynamic'

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
    redirect(`/sign-in?next=${encodeURIComponent(`/journal/${id}`)}`)
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

        <DreamView dream={dream} />
      </div>
    </div>
  )
}
