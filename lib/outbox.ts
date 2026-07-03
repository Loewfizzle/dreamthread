import { createDreamDirect } from '@/app/journal/new/actions';

/**
 * Offline outbox: a transient send queue for dreams written without a
 * connection (bedside, airplane mode). This is NOT a data store —
 * Supabase remains the single source of truth; entries live here only
 * until the next successful sync.
 */

const OUTBOX_KEY = 'dreamthread:outbox';

export interface DraftDream {
  id: string;
  title: string;
  content: string;
  mood: string;
  is_lucid: boolean;
  created_at: string;
}

export function listDrafts(): DraftDream[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(OUTBOX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(d => d && typeof d.content === 'string') : [];
  } catch {
    return [];
  }
}

export function saveDraft(draft: Omit<DraftDream, 'id' | 'created_at'>): boolean {
  try {
    const drafts = listDrafts();
    drafts.push({
      ...draft,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    });
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(drafts));
    return true;
  } catch {
    return false;
  }
}

function removeDraft(id: string): void {
  try {
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(listDrafts().filter(d => d.id !== id)));
  } catch {}
}

/**
 * Attempts to deliver queued drafts. Returns how many were woven in.
 * Stops at the first failure (likely still offline) and keeps the rest.
 */
export async function syncOutbox(): Promise<number> {
  const drafts = listDrafts();
  if (drafts.length === 0) return 0;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return 0;

  let synced = 0;
  for (const draft of drafts) {
    try {
      const result = await createDreamDirect({
        title: draft.title,
        content: draft.content,
        mood: draft.mood,
        is_lucid: draft.is_lucid,
        dream_date: draft.created_at, // the night it was written, not the sync time
      });
      if (result.error) break;
      removeDraft(draft.id);
      synced++;
    } catch {
      break;
    }
  }
  return synced;
}
