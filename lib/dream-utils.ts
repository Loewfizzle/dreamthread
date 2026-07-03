import type { Dream } from './dreams';

// Date-only strings ("2026-06-29") must be parsed as local time, not UTC,
// or "Today"/"Yesterday" labels shift by a day for users west of UTC.
export const parseDreamDate = (dateString: string): Date => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString)
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(dateString)
}

export const formatDreamDate = (dateString: string): string => {
  const date = parseDreamDate(dateString)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dreamDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.floor((today.getTime() - dreamDay.getTime()) / (1000 * 3600 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) {
    return date.toLocaleDateString(undefined, { weekday: 'long' })
  }

  const opts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' }
  if (date.getFullYear() !== now.getFullYear()) {
    opts.year = 'numeric'
  }
  return date.toLocaleDateString(undefined, opts)
}

export const getExcerpt = (content: string, maxLength = 140): string => {
  const text = content.trim().replace(/\s+/g, ' ')
  if (text.length <= maxLength) return text

  const cut = text.slice(0, maxLength)
  const lastPunct = Math.max(
    cut.lastIndexOf('.'),
    cut.lastIndexOf('!'),
    cut.lastIndexOf('?')
  )

  if (lastPunct > 70) {
    return cut.slice(0, lastPunct + 1).trim()
  }
  return cut.trim() + '…'
}

// Stopwords for keyword extraction: common English plus the filler
// vocabulary of dream diaries ("suddenly", "remember", "somewhere"...)
const STOP_WORDS = new Set([
  'that', 'this', 'with', 'have', 'been', 'were', 'your', 'their', 'about', 'there',
  'where', 'which', 'from', 'into', 'through', 'would', 'could', 'should', 'what',
  'when', 'then', 'than', 'them', 'these', 'those', 'some', 'like', 'just', 'very',
  'much', 'even', 'still', 'only', 'also', 'back', 'down', 'over', 'under', 'again',
  'dream', 'dreams', 'dreamt', 'night', 'felt', 'feel', 'feeling', 'thing', 'things',
  'really', 'remember', 'started', 'starting', 'suddenly', 'something', 'someone',
  'somewhere', 'somehow', 'going', 'trying', 'tried', 'looked', 'looking', 'seemed',
  'around', 'before', 'after', 'while', 'though', 'being', 'myself', 'everyone',
  'everything', 'anything', 'nothing', 'because', 'without', 'inside', 'outside',
  'behind', 'between', 'across', 'toward', 'towards', 'though', 'almost', 'always',
  'never', 'every', 'other', 'another', 'first', 'people', 'place', 'places',
  'kept', 'knew', 'know', 'came', 'went', 'told', 'said', 'saying', 'realized',
  'woke', 'wake', 'waking', 'asleep', 'sleep', 'sleeping',
]);

/**
 * Frequent meaningful words across dreams. Tags count triple and titles
 * double (they're deliberate choices, not prose); a single wordy dream
 * can't dominate because each dream's contribution per word is capped.
 */
export function extractKeywords(dreams: Dream[], maxWords = 8): Array<{ word: string; count: number }> {
  if (!dreams || dreams.length === 0) return [];

  const counts: Record<string, number> = {};

  dreams.forEach(dream => {
    const perDream: Record<string, number> = {};
    const add = (text: string, weight: number) => {
      const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
      words.forEach(word => {
        if (!STOP_WORDS.has(word)) {
          perDream[word] = (perDream[word] || 0) + weight;
        }
      });
    };

    add(dream.content || '', 1);
    add(dream.title || '', 2);
    add(dream.mood || '', 2);
    (dream.tags || []).forEach(tag => add(tag, 3));

    Object.entries(perDream).forEach(([word, weight]) => {
      counts[word] = (counts[word] || 0) + Math.min(weight, 4);
    });
  });

  // Fold trivial plurals into their singular ("doors" -> "door")
  Object.keys(counts).forEach(word => {
    if (word.endsWith('s')) {
      const singular = word.slice(0, -1);
      if (counts[singular]) {
        counts[singular] += counts[word];
        delete counts[word];
      }
    }
  });

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxWords)
    .map(([word, count]) => ({ word, count }));
}

export interface DreamStats {
  total: number;
  nightsThisMonth: number;
  lucidCount: number;
  lucidShare: number; // 0..1
  topMood: string | null;
  dreamedRecently: boolean; // a dream dated within the last ~2 days
}

export function computeDreamStats(dreams: Dream[], now = new Date()): DreamStats {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const recentCutoff = now.getTime() - 2 * 24 * 3600 * 1000;

  let nightsThisMonth = 0;
  let lucidCount = 0;
  let dreamedRecently = false;
  const moodCounts: Record<string, number> = {};

  dreams.forEach(d => {
    const t = parseDreamDate(d.dream_date).getTime();
    if (t >= monthStart) nightsThisMonth++;
    if (t >= recentCutoff) dreamedRecently = true;
    if (d.is_lucid) lucidCount++;
    if (d.mood) {
      const key = d.mood.trim().toLowerCase();
      if (key) moodCounts[key] = (moodCounts[key] || 0) + 1;
    }
  });

  const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    total: dreams.length,
    nightsThisMonth,
    lucidCount,
    lucidShare: dreams.length > 0 ? lucidCount / dreams.length : 0,
    topMood,
    dreamedRecently,
  };
}

// "rivers, doors and light"
function formatList(words: string[]): string {
  if (words.length === 0) return '';
  if (words.length === 1) return words[0];
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

export function generatePoeticInsight(dreams: Dream[]): string {
  if (!dreams || dreams.length === 0) {
    return 'The quiet is waiting for your first thread.';
  }

  const stats = computeDreamStats(dreams);
  const themes = formatList(extractKeywords(dreams, 3).map(k => k.word));
  const mood = stats.topMood;

  if (stats.total === 1) {
    return 'One thread so far — the pattern begins when the next night joins it.';
  }

  if (stats.lucidShare >= 0.4 && themes) {
    return `You’ve been waking inside your dreams — and ${themes} keep appearing when you do.`;
  }

  if (mood && themes) {
    return stats.dreamedRecently
      ? `A ${mood} thread runs through your recent nights, woven with ${themes}.`
      : `When your dreams last visited, they carried a ${mood} feeling — and kept returning to ${themes}.`;
  }

  if (themes) {
    return `${themes.charAt(0).toUpperCase() + themes.slice(1)} have been visiting your nights like quiet companions.`;
  }

  if (mood) {
    return `Your nights have carried a mostly ${mood} feeling lately.`;
  }

  return 'Your dreams are still gathering their patterns — keep weaving.';
}
