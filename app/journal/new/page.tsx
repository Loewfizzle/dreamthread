import NewDreamForm from './NewDreamForm'

export default function NewDreamPage() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <div className="mx-auto max-w-2xl px-6 py-12">
        {/* Top navigation */}
        <div className="mb-8 flex items-center justify-between">
          <a
            href="/journal"
            className="inline-flex items-center gap-1 text-sm font-medium text-muted transition hover:text-foreground"
          >
            ← Back to Journal
          </a>
          <span className="text-xs uppercase tracking-[2px] text-muted">
            Dreamthread
          </span>
        </div>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-semibold tracking-tighter text-foreground">
            New Dream
          </h1>
          <p className="mt-3 max-w-md text-lg text-muted">
            Write down what you remember. Even fragments are valuable.
          </p>
        </div>

        <NewDreamForm />
      </div>
    </div>
  )
}
