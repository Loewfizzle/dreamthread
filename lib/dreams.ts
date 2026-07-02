// Source of truth for Dream type and storage helpers
export interface Dream {
  id: string;
  title: string;
  content: string;
  dream_date: string;
  tags?: string[];
  lucidity?: number;
  mood?: string;
  created_at?: string;
}

export const STORAGE_KEY = 'dreamthread:entries';

export const SAMPLE_DREAMS: Dream[] = [
  {
    id: 'd1',
    title: 'The library that breathed',
    content: 'I was walking through endless wooden shelves that gently rose and fell like they were breathing. Books whispered when I passed them. One book opened by itself and showed my childhood home, but it was underwater.',
    dream_date: '2026-06-29',
    tags: ['surreal', 'nostalgia'],
    lucidity: 4,
    mood: 'Curious',
  },
  {
    id: 'd2',
    title: 'Moon ladder',
    content: 'Climbing a ladder made of soft silver light up into a deep violet sky. Every rung felt like stepping on quiet water. At the top, the moon was a warm lantern and I could hear the ocean from up there.',
    dream_date: '2026-06-27',
    tags: ['flying', 'serene'],
    lucidity: 5,
    mood: 'Peaceful',
  },
  {
    id: 'd3',
    title: 'Train of forgotten names',
    content: 'A train where every passenger had my face but different ages. They were all saying names I used to know but couldn’t quite place. The windows showed cities I have never visited.',
    dream_date: '2026-06-24',
    tags: ['people', 'travel'],
    lucidity: 2,
    mood: 'Melancholy',
  },
];

export function loadDreams(): Dream[] {
  if (typeof window === 'undefined') return SAMPLE_DREAMS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Dream[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    // First visit: seed samples (gracefully)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_DREAMS));
    } catch {}
    return SAMPLE_DREAMS;
  } catch {
    // Return samples so UI never breaks
    return SAMPLE_DREAMS;
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

export function getRecentDreams(limit = 4): Dream[] {
  const all = loadDreams();
  return [...all]
    .sort((a, b) => new Date(b.dream_date).getTime() - new Date(a.dream_date).getTime())
    .slice(0, limit);
}
