import Link from 'next/link';
import Logo from '@/components/Logo';

export const metadata = {
  title: 'Privacy · Dreamthread',
  description: 'What Dreamthread stores, what leaves the device, and how to take or erase your data.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-midnight-900">
      <header className="border-b border-midnight-500">
        <div className="max-w-2xl mx-auto px-5 flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size="md" />
          </Link>
          <Link href="/" className="text-text-300 hover:text-text-100 text-sm">
            ← Home
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-5 py-12 pb-24">
        <h1 className="text-3xl font-semibold tracking-tight text-text-50 mb-3">Privacy</h1>
        <p className="text-text-300 text-sm mb-10">
          Dreams are intimate. This page says plainly what Dreamthread does with yours.
        </p>

        <div className="space-y-9 text-[15px] leading-relaxed text-text-200">
          <section>
            <h2 className="text-lg font-medium text-text-50 mb-2">What we store</h2>
            <p>
              Your dreams (text, dates, moods, tags), the images generated for them, weekly
              reflections, nightly intentions, and — for each dream — a mathematical
              &ldquo;embedding&rdquo; used to find related dreams. We also keep timestamps of when
              you used AI features, purely to enforce fair daily limits. Everything lives in a
              database where access rules guarantee each account can only ever read its own rows.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-text-50 mb-2">What leaves our database</h2>
            <p className="mb-3">
              Three AI providers process your content, only when you use the corresponding feature:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-text-300">
              <li>
                <span className="text-text-100">OpenAI</span> receives your voice recordings (for
                transcription) and dream text (for reflections, conversations, and embeddings) via
                its API, which does not use submitted content to train models.
              </li>
              <li>
                <span className="text-text-100">Fal.ai</span> receives a text prompt derived from a
                dream&rsquo;s title and content when you generate an image.
              </li>
              <li>
                <span className="text-text-100">Vercel</span> hosts the app and collects anonymous,
                cookie-less page analytics.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-text-50 mb-2">What we never do</h2>
            <p>
              We don&rsquo;t sell your data, share it with advertisers, use it to train models, or
              show it to anyone else. There are no tracking cookies — the only cookies are the ones
              that keep you signed in. Postcards and exports are rendered on your own device and go
              nowhere unless you share them.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-text-50 mb-2">Your controls</h2>
            <p>
              You can export your entire journal as Markdown or JSON at any time from the journal
              page, and you can{' '}
              <Link href="/account" className="text-accent hover:underline underline-offset-4">
                delete your account
              </Link>{' '}
              — which permanently erases your dreams, images, reflections, intentions, and usage
              history in one step. Deletion is immediate and cannot be undone.
            </p>
          </section>
        </div>

        <p className="mt-12 text-xs text-text-400">
          Your dreams remain yours.
        </p>
      </div>
    </div>
  );
}
