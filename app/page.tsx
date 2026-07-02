import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getDreams } from '@/lib/dreams'
import { formatDreamDate, getExcerpt } from '@/lib/dream-utils'
import SignOutButton from './journal/SignOutButton'

export default async function DreamthreadHome() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const dreams = await getDreams({ limit: 5 })

    return (
      <div className="min-h-screen bg-background font-sans">
        <div className="mx-auto max-w-3xl px-5 py-12">
          {/* Header for logged-in */}
          <header className="mb-12 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <span className="text-xl font-semibold tracking-tighter">D</span>
              </div>
              <span className="text-2xl font-semibold tracking-tight text-foreground">
                Dreamthread
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/journal"
                className="text-sm font-medium text-muted transition hover:text-foreground"
              >
                Journal
              </Link>
              <SignOutButton />
            </div>
          </header>

          <main>
            {/* Prominent primary action */}
            <div className="mb-12">
              <div className="rounded-3xl border border-border bg-card p-10 md:p-12">
                <div className="max-w-xl">
                  <p className="text-sm font-medium tracking-[3px] text-accent/80">GOOD MORNING</p>
                  <h1 className="mt-3 text-4xl font-semibold tracking-[-1.5px] text-foreground sm:text-5xl">
                    The night is still with you.
                  </h1>
                  <p className="mt-4 text-lg text-muted leading-snug">
                    Capture what arrived while you slept, before it slips away.
                  </p>
                  <Link
                    href="/journal/new"
                    className="mt-8 inline-flex h-14 items-center justify-center rounded-full bg-primary px-8 text-base font-medium text-primary-foreground transition hover:bg-primary/90 active:scale-[0.985]"
                  >
                    Record your dream
                  </Link>
                </div>
              </div>
            </div>

            {/* Recent dreams, compact and artistic */}
            <div>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">Recent dreams</h2>
                <Link
                  href="/journal"
                  className="text-sm font-medium text-muted hover:text-foreground"
                >
                  View all →
                </Link>
              </div>

              {dreams.length === 0 ? (
                <div className="rounded-3xl border border-border bg-card p-8 text-center">
                  <p className="text-muted">No dreams recorded yet.</p>
                  <Link
                    href="/journal/new"
                    className="mt-4 inline-flex text-sm font-medium text-accent hover:underline"
                  >
                    Record your first one
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {dreams.map((dream) => {
                    const formattedDate = formatDreamDate(dream.dream_date)
                    const excerpt = getExcerpt(dream.content, 120)

                    return (
                      <Link
                        key={dream.id}
                        href={`/journal/${dream.id}`}
                        className="block rounded-3xl border border-border/60 bg-card px-6 py-5 transition-all hover:border-border/80 active:scale-[0.985]"
                      >
                        <div className="flex items-center gap-2 text-[11px] font-medium tracking-[2.5px] text-muted/70 mb-2">
                          <time dateTime={dream.dream_date}>{formattedDate}</time>
                          {dream.mood && (
                            <>
                              <span className="text-muted/40">·</span>
                              <span className="font-normal tracking-normal text-accent">{dream.mood}</span>
                            </>
                          )}
                          {dream.is_lucid && (
                            <span className="text-accent font-medium tracking-[1px]">LUCID</span>
                          )}
                        </div>

                        {dream.title ? (
                          <h3 className="text-lg font-semibold tracking-tight text-foreground line-clamp-1">
                            {dream.title}
                          </h3>
                        ) : null}

                        <p className="mt-2 text-[14px] leading-snug text-foreground/75 line-clamp-2">
                          {excerpt}
                        </p>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </main>

          <footer className="mt-16 text-center text-xs text-muted">
            A private space for what the night remembers.
          </footer>
        </div>
      </div>
    )
  }

  // Logged-out: elegant, poetic landing
  return (
    <div className="min-h-screen bg-background font-sans">
      <div className="mx-auto max-w-3xl px-5 py-16">
        <header className="mb-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <span className="text-xl font-semibold tracking-tighter">D</span>
            </div>
            <span className="text-2xl font-semibold tracking-tight text-foreground">
              Dreamthread
            </span>
          </div>
          <nav>
            <Link
              href="/sign-in"
              className="text-sm font-medium text-muted transition hover:text-foreground"
            >
              Sign in
            </Link>
          </nav>
        </header>

        <main>
          <div className="max-w-2xl">
            <p className="text-sm font-medium tracking-[4px] text-accent/70">A QUIET PLACE FOR WHAT COMES IN THE NIGHT</p>

            <h1 className="mt-4 text-balance text-6xl font-semibold tracking-[-2px] text-foreground sm:text-7xl">
              Dreamthread
            </h1>

            <div className="mt-6 max-w-lg space-y-4 text-lg leading-snug text-muted">
              <p>
                Some mornings, the night leaves behind a story. A fragment. A feeling.
              </p>
              <p>
                Dreamthread is a private, beautiful space to catch those stories before they fade —
                a place to record, return to, and gently understand the dreams that visit you.
              </p>
            </div>

            <div className="mt-10">
              <Link
                href="/sign-in"
                className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-base font-medium text-primary-foreground transition hover:bg-primary/90 active:scale-[0.985]"
              >
                Receive a magic link
              </Link>
              <p className="mt-3 text-sm text-muted">Sign in with a magic link from DreamThread. No password needed.</p>
            </div>
          </div>

          <section className="mt-24 border-t border-border pt-12">
            <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-foreground">Record</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">
                  Speak or write while the details are still close. Voice notes are transcribed with care.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-foreground">Return</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">
                  Revisit your dreams in a calm, artistic space. Watch patterns emerge over time.
                </p>
              </div>
            </div>
          </section>
        </main>

        <footer className="mt-20 text-center text-xs text-muted">
          Your dreams belong to you.
        </footer>
      </div>
    </div>
  )
}
