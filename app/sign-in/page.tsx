import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SignInForm from './SignInForm'

export default async function SignInPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/journal')
  }

  return (
    <div className="min-h-screen bg-background font-sans flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <span className="text-xl font-semibold tracking-tighter">D</span>
            </div>
          </div>
          <h1 className="text-4xl font-semibold tracking-tighter text-foreground">Welcome back</h1>
          <p className="mt-3 text-lg text-muted">Sign in with a magic link from Dreamthread. No password needed.</p>
        </div>

        <SignInForm />
      </div>
    </div>
  )
}
