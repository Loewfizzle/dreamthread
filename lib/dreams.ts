import { createClient } from '@/lib/supabase/client';
import type { Dream } from '@/types/database';

// Supabase is the single source of truth for dreams.
export type { Dream };

/** Loads the signed-in user's dreams, newest first. */
export async function fetchDreams(): Promise<{ dreams: Dream[]; error: boolean }> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('dreams')
      .select('*')
      .order('dream_date', { ascending: false });
    if (error) throw error;
    return { dreams: data ?? [], error: false };
  } catch {
    return { dreams: [], error: true };
  }
}
