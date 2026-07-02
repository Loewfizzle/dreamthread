export default function DreamthreadHome() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <header className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <span className="text-xl font-semibold tracking-tighter">D</span>
            </div>
            <span className="text-2xl font-semibold tracking-tight text-foreground">
              Dreamthread
            </span>
          </div>
          <nav>
            <a
              href="/journal"
              className="text-sm font-medium text-muted transition hover:text-foreground"
            >
              Open Journal
            </a>
          </nav>
        </header>

        <main>
          <div className="max-w-2xl">
            <h1 className="text-balance text-6xl font-semibold tracking-tighter text-foreground sm:text-7xl">
              Capture your dreams.
            </h1>
            <p className="mt-6 max-w-md text-pretty text-xl leading-tight text-muted">
              A calm, private space to record, reflect on, and understand the
              stories your mind tells at night.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href="/journal"
                className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                Start journaling
              </a>
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-medium text-foreground transition hover:bg-card"
              >
                Learn about Supabase
              </a>
            </div>
          </div>

          <section id="journal" className="mt-24">
            <div className="rounded-3xl border border-border bg-card p-10 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  Your Dream Journal
                </h2>
                <a
                  href="/journal"
                  className="text-sm font-medium text-muted hover:text-foreground"
                >
                  View all →
                </a>
              </div>
              <p className="mt-2 text-sm text-muted">
                Record new dreams at any time. A full list, search, and insights are coming soon.
              </p>

              <div className="mt-6">
                <a
                  href="/journal/new"
                  className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-5 py-2 text-sm font-medium text-foreground transition hover:bg-muted/10"
                >
                  + New dream entry
                </a>
              </div>

              <div className="mt-8 grid gap-4 text-sm text-muted sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-background p-4">
                  <div className="font-medium text-foreground">
                    Record
                  </div>
                  <div className="mt-1 text-xs leading-relaxed text-muted">
                    Quick capture with title, mood, and lucidity.
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-background p-4">
                  <div className="font-medium text-foreground">
                    Reflect
                  </div>
                  <div className="mt-1 text-xs leading-relaxed text-muted">
                    Patterns, symbols, and recurring themes over time.
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="mt-16 text-center text-xs text-muted">
          Built with Next.js, TypeScript, Tailwind, and Supabase.
        </footer>
      </div>
    </div>
  )
}
