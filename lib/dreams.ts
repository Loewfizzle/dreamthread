/**
 * Dream query helpers for Dreamthread.
 *
 * These use the typed server client and the Database types.
 * Prefer these over raw .from() calls in your Server Components / Actions
 * so that query logic stays centralized and easy to evolve (pagination, filters, etc).
 *
 * All functions assume the caller is already authenticated (RLS will enforce).
 */

import { createClient } from '@/lib/supabase/server'
import type { Dream, DreamInsert, DreamUpdate } from '@/types/database'

/* -------------------------------------------------------------------------- */
/* Read                                                                       */
/* -------------------------------------------------------------------------- */

export async function getDreams(options?: {
  limit?: number
  offset?: number
  search?: string // simple title/content ilike search
  mood?: string
  isLucid?: boolean
  fromDate?: string
  toDate?: string
}): Promise<Dream[]> {
  const supabase = await createClient()

  let query = supabase
    .from('dreams')
    .select('*')
    .order('dream_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (options?.limit) {
    query = query.limit(options.limit)
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit ?? 20) - 1)
  }
  if (options?.search) {
    const term = `%${options.search}%`
    query = query.or(`title.ilike.${term},content.ilike.${term}`)
  }
  if (options?.mood) {
    query = query.eq('mood', options.mood)
  }
  if (options?.isLucid !== undefined) {
    query = query.eq('is_lucid', options.isLucid)
  }
  if (options?.fromDate) {
    query = query.gte('dream_date', options.fromDate)
  }
  if (options?.toDate) {
    query = query.lte('dream_date', options.toDate)
  }

  const { data, error } = await query

  if (error) {
    console.error('getDreams error:', error)
    throw error
  }

  return (data ?? []) as Dream[]
}

export async function getDream(id: string): Promise<Dream | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('dreams')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    // 406 / PGRST116 = no rows (PostgREST)
    if (error.code === 'PGRST116') return null
    console.error('getDream error:', error)
    throw error
  }

  return data as Dream
}

export async function getDreamCount(): Promise<number> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('dreams')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('getDreamCount error:', error)
    throw error
  }

  return count ?? 0
}

/* -------------------------------------------------------------------------- */
/* Write (Server Actions / Route handlers will usually call these)            */
/* -------------------------------------------------------------------------- */

export async function createDream(dream: DreamInsert): Promise<Dream> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('dreams')
    .insert(dream)
    .select()
    .single()

  if (error) {
    console.error('createDream error:', error)
    throw error
  }

  return data as Dream
}

export async function updateDream(id: string, updates: DreamUpdate): Promise<Dream> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('dreams')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('updateDream error:', error)
    throw error
  }

  return data as Dream
}

export async function deleteDream(id: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('dreams')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('deleteDream error:', error)
    throw error
  }
}

// -----------------------------------------------------------------------------
// Convenience re-exports of the raw types (so consumers only need to import from here)
// -----------------------------------------------------------------------------
export type { Dream, DreamInsert, DreamUpdate }
