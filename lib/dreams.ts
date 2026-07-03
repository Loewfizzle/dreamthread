import { createClient } from '@/lib/supabase/client';
import type { Dream as DreamRow } from '@/types/database';

// Supabase is the single source of truth for dreams. The embedding
// vector stays server-side — it's ~1500 floats per dream and the UI
// never reads it, so app code works with the row minus that column.
export type Dream = Omit<DreamRow, 'embedding'>;

export const DREAM_COLUMNS =
  'id, user_id, title, content, mood, is_lucid, tags, dream_date, created_at, updated_at, image_url, image_generation_count';

/** Loads the signed-in user's dreams, newest first. */
export async function fetchDreams(): Promise<{ dreams: Dream[]; error: boolean }> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('dreams')
      .select(DREAM_COLUMNS)
      .order('dream_date', { ascending: false });
    if (error) throw error;
    return { dreams: (data ?? []) as Dream[], error: false };
  } catch {
    return { dreams: [], error: true };
  }
}
