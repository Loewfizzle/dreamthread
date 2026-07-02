'use server'

import { redirect } from 'next/navigation'
import { createDream, updateDream, deleteDream } from '@/lib/dreams'
import { createClient } from '@/lib/supabase/server'
import type { DreamInsert, DreamUpdate } from '@/types/database'

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

export async function transcribeAudioAction(formData: FormData): Promise<{ text?: string; error?: string }> {
  const file = formData.get('file') as File | null
  if (!file) {
    return { error: 'No audio file provided.' }
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return { error: 'OpenAI API key is not configured on the server.' }
  }

  const openaiForm = new FormData()
  openaiForm.append('file', file)
  openaiForm.append('model', 'whisper-1')
  // Optional: openaiForm.append('language', 'en')

  try {
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: openaiForm,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Whisper API error:', errorText)
      return { error: `Transcription failed: ${response.status} ${response.statusText}` }
    }

    const data = await response.json()
    return { text: data.text?.trim() || '' }
  } catch (err) {
    console.error('Error calling Whisper API:', err)
    return { error: 'Failed to transcribe audio. Please try again or type manually.' }
  }
}

export async function updateDreamAction(
  id: string,
  prevState: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const title = formData.get('title')?.toString().trim() ?? ''
  const content = formData.get('content')?.toString().trim() ?? ''
  const mood = formData.get('mood')?.toString().trim() ?? ''
  const isLucid = formData.get('is_lucid') === 'on'

  if (!content) {
    return { error: 'Dream content is required.' }
  }

  if (content.length < 3) {
    return { error: 'Dream content must be at least a few characters.' }
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'You must be signed in to update dreams.' }
    }

    const updates: DreamUpdate = {
      title: title.length > 0 ? title : null,
      content,
      mood: mood.length > 0 ? mood : null,
      is_lucid: isLucid,
      updated_at: new Date().toISOString(),
    }

    await updateDream(id, updates)

    return { success: true }
  } catch (err) {
    console.error('updateDreamAction error:', err)
    return { error: 'Failed to update dream. Please try again.' }
  }
}

export async function deleteDreamAction(id: string): Promise<{ error?: string; success?: boolean }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'You must be signed in to delete dreams.' }
    }

    await deleteDream(id)

    return { success: true }
  } catch (err) {
    console.error('deleteDreamAction error:', err)
    return { error: 'Failed to delete dream. Please try again.' }
  }
}
