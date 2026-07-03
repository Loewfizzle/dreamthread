import { createClient } from '@/lib/supabase/client';
import type { DreamInsert } from '@/types/database';

// One-time migration of dreams that older builds stored in localStorage.
// Once every user's local entries are in Supabase this module can be deleted.

const STORAGE_KEY = 'dreamthread:entries';

// Demo entries seeded by older builds — never migrated.
const LEGACY_SAMPLE_IDS = new Set(['d1', 'd2', 'd3']);

interface LegacyLocalDream {
  id: string;
  title?: string | null;
  content?: string;
  dream_date?: string;
  tags?: string[] | null;
  lucidity?: number;
  is_lucid?: boolean;
  mood?: string | null;
  created_at?: string;
}

let migration: Promise<void> | null = null;

/**
 * Imports any localStorage dreams into Supabase for the signed-in user,
 * then clears the local store. Safe to call from multiple pages: runs at
 * most once per session, and a failed run is retried on the next call.
 */
export function migrateLocalDreams(): Promise<void> {
  if (!migration) {
    migration = runMigration().catch(() => {
      // Local data is kept; allow a retry on the next page view
      migration = null;
    });
  }
  return migration;
}

async function runMigration(): Promise<void> {
  if (typeof window === 'undefined') return;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return;

  let parsed: LegacyLocalDream[];
  try {
    parsed = JSON.parse(stored);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  if (!Array.isArray(parsed)) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  const locals = parsed.filter(
    d => d && typeof d.content === 'string' && d.content.trim().length > 0 && !LEGACY_SAMPLE_IDS.has(d.id)
  );
  if (locals.length === 0) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return; // keep local data until the user signs in

  // Old stub image URLs (picsum placeholders) are deliberately not migrated.
  const rows: DreamInsert[] = locals.map(d => ({
    user_id: user.id,
    title: d.title?.trim() || null,
    content: (d.content as string).trim(),
    mood: d.mood?.trim() || null,
    is_lucid: d.is_lucid ?? (d.lucidity ?? 0) >= 4,
    tags: d.tags && d.tags.length > 0 ? d.tags : null,
    ...(d.dream_date ? { dream_date: d.dream_date } : {}),
    ...(d.created_at ? { created_at: d.created_at } : {}),
  }));

  // Single batch insert = one atomic statement, so a failure never
  // leaves half the dreams migrated with the local copy cleared.
  const { error } = await supabase.from('dreams').insert(rows);
  if (error) throw error;

  localStorage.removeItem(STORAGE_KEY);
}
