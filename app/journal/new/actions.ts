'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { DreamInsert, DreamUpdate } from '@/types/database'
import { fal } from "@fal-ai/client"

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

    const { error: insertError } = await supabase
      .from('dreams')
      .insert(dreamData)

    if (insertError) {
      console.error('createDream insert error:', insertError)
      return {
        error: 'Failed to save your dream. Please try again.',
        values: submittedValues,
      }
    }

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

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be signed in to transcribe audio.' }
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
  input: {
    title?: string | null
    content: string
    mood?: string | null
    is_lucid?: boolean
    tags?: string[] | null
    dream_date?: string
  }
): Promise<{ error?: string; success?: boolean }> {
  const title = input.title?.trim() ?? ''
  const content = input.content?.trim() ?? ''
  const mood = input.mood?.trim() ?? ''

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
      is_lucid: input.is_lucid ?? false,
      tags: input.tags ?? null,
      updated_at: new Date().toISOString(),
    }

    if (input.dream_date) {
      updates.dream_date = input.dream_date
    }

    const { error: updateErr } = await supabase
      .from('dreams')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)

    if (updateErr) {
      console.error('updateDream update error:', updateErr)
      return { error: 'Failed to update dream. Please try again.' }
    }

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

    const { error: deleteErr } = await supabase
      .from('dreams')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteErr) {
      console.error('deleteDream delete error:', deleteErr)
      return { error: 'Failed to delete dream. Please try again.' }
    }

    return { success: true }
  } catch (err) {
    console.error('deleteDreamAction error:', err)
    return { error: 'Failed to delete dream. Please try again.' }
  }
}

export async function generateDreamImageAction(dreamId: string): Promise<{ 
  imageUrl?: string; 
  error?: string; 
  count?: number 
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be signed in to generate images.' }
  }

  if (!process.env.FAL_KEY) {
    return { error: 'Image generation service is not configured (missing FAL_KEY environment variable).' }
  }

  // Fetch current dream to check count and get content for prompt
  const { data: dream, error: fetchError } = await supabase
    .from('dreams')
    .select('title, content, image_generation_count, image_url')
    .eq('id', dreamId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !dream) {
    return { error: 'Dream not found or access denied.' }
  }

  const currentCount = dream.image_generation_count || 0

  if (currentCount >= 2) {
    return { error: "You've reached the regeneration limit for this dream." }
  }

  // Build a detailed, artistic, surreal prompt based on the dream.
  // Matches the "Artistic Night" aesthetic: dreamy, atmospheric, dark, moody, elegant.
  const basePrompt = [
    `A highly detailed, surreal and atmospheric night scene representing the dream titled "${dream.title || 'Untitled'}".`,
    dream.content ? `The scene captures the essence of: ${dream.content}` : '',
    `Style: dreamy, dark, moody, elegant, mysterious, ethereal, quiet and introspective, soft moonlight, deep shadows, intricate details, cinematic composition, high resolution, fine art photography, artistic night aesthetic, calm yet otherworldly.`
  ].filter(Boolean).join(' ');

  // Configure Fal.ai client with high-quality Flux model for image generation.
  // Image generation is powered by Fal.ai using a high-quality Flux model (fal-ai/flux/dev).
  fal.config({
    credentials: process.env.FAL_KEY!,
  });

  let imageUrl: string | undefined;

  try {
    // Use high-quality Flux dev model via Fal.ai for artistic, high-res images.
    const result = await fal.subscribe("fal-ai/flux/dev", {
      input: {
        prompt: basePrompt,
        // Note: flux/dev on Fal does not expose negative_prompt in this schema; prompt engineering handles it.
        num_inference_steps: 40,
        guidance_scale: 3.5,
        image_size: "landscape_16_9",
        num_images: 1,
      },
      logs: false,
    });

    // fal.subscribe resolves to { data, requestId }
    const output = result.data as { images?: Array<{ url?: string }> };
    imageUrl = output?.images?.[0]?.url;

    if (!imageUrl) {
      throw new Error('Fal.ai did not return an image URL.');
    }
  } catch (falError) {
    console.error('Fal.ai image generation error:', falError);
    return { error: 'Failed to generate image using Fal.ai. Please try again later.' };
  }

  const newCount = currentCount + 1;

  // Save the generated image URL and increment the generation count in the database
  const { error: updateError } = await supabase
    .from('dreams')
    .update({
      image_url: imageUrl,
      image_generation_count: newCount,
    })
    .eq('id', dreamId)
    .eq('user_id', user.id);

  if (updateError) {
    console.error('generateDreamImageAction update error:', updateError);
    return { error: 'Failed to save the generated image. Please try again.' };
  }

  return { imageUrl, count: newCount };
}
