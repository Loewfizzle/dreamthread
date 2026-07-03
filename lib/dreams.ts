// Source of truth for Dream type and storage helpers
import { createClient } from '@/lib/supabase/client';

export interface Dream {
  id: string;
  title?: string | null;
  content: string;
  dream_date: string;
  tags?: string[] | null;
  lucidity?: number;
  mood?: string | null;
  created_at?: string;
  updated_at?: string;
  // Support for remote/server Dream shape
  is_lucid?: boolean;
  user_id?: string;
  // Image generation support (from DB)
  image_url?: string | null;
  image_generation_count?: number;
}

export const STORAGE_KEY = 'dreamthread:entries';

// Ids of demo entries that older builds seeded into localStorage.
// Filtered out on load so they don't mix with a user's real journal.
const LEGACY_SAMPLE_IDS = new Set(['d1', 'd2', 'd3']);

export function loadDreams(): Dream[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as Dream[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(d => !LEGACY_SAMPLE_IDS.has(d.id))
      .map(d => ({
        ...d,
        image_url: d.image_url ?? null,
        image_generation_count: d.image_generation_count ?? 0,
      }));
  } catch {
    return [];
  }
}

export function saveDreams(dreams: Dream[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dreams));
  } catch {
    // Swallow — caller pages can show non-fatal notices if they want
  }
}

/**
 * Loads the user's dreams from Supabase merged with any local-only entries.
 * Falls back to localStorage entirely when the cloud is unreachable.
 */
export async function fetchAllDreams(): Promise<{ dreams: Dream[]; cloudError: boolean }> {
  const local = loadDreams();
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('dreams')
      .select('*')
      .order('dream_date', { ascending: false });
    if (error) throw error;
    const db = (data ?? []) as Dream[];
    const dbIds = new Set(db.map(d => d.id));
    return {
      dreams: [...db, ...local.filter(d => !dbIds.has(d.id))],
      cloudError: false,
    };
  } catch {
    return { dreams: local, cloudError: true };
  }
}
