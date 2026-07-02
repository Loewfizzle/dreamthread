'use server'

import { redirect } from 'next/navigation'
import { createDream } from '@/lib/dreams'
import { createClient } from '@/lib/supabase/server'
import type { DreamInsert } from '@/types/database'

export type NewDreamFormState = {
  error?: string
  values?: {
    title: string
    content: string
    mood: string
    is_lucid: boolean
  }
}

export async function createDreamAction(
  prevState: NewDreamFormState,
  formData: FormData
): Promise<NewDreamFormState> {
  const title = formData.get('title')?.toString().trim() ?? ''
  const content = formData.get('content')?.toString().trim() ?? ''
  const mood = formData.get('mood')?.toString().trim() ?? ''
  const isLucid = formData.get('is_lucid') === 'on'

  const submittedValues = {
    title,
    content,
    mood,
    is_lucid: isLucid,
  }

  // Basic validation
  if (!content) {
    return {
      error: 'Dream content is required.',
      values: submittedValues,
    }
  }

  if (content.length < 3) {
    return {
      error: 'Dream content must be at least a few characters.',
      values: submittedValues,
    }
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        error: 'You must be signed in to save dreams.',
        values: submittedValues,
      }
    }

    const dreamData: DreamInsert = {
      user_id: user.id,
      title: title.length > 0 ? title : null,
      content,
      mood: mood.length > 0 ? mood : null,
      is_lucid: isLucid,
    }

    await createDream(dreamData)

    // Success — redirect to journal list
    redirect('/journal')
  } catch (err) {
    // If it's a redirect, Next.js will handle it. Otherwise show error.
    if (err instanceof Error && err.message === 'NEXT_REDIRECT') {
      throw err
    }
    console.error('createDreamAction error:', err)
    return {
      error: 'Failed to save your dream. Please try again.',
      values: submittedValues,
    }
  }
}
