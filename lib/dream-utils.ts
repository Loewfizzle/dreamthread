import type { Dream } from './dreams';

export const formatDreamDate = (dateString: string): string => {
  const date = new Date(dateString)
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

// Simple stopwords for keyword extraction
const STOP_WORDS = new Set([
  'that', 'this', 'with', 'have', 'been', 'were', 'your', 'their', 'about', 'there', 
  'where', 'which', 'from', 'into', 'through', 'would', 'could', 'should', 'what', 
  'when', 'then', 'than', 'them', 'these', 'those', 'some', 'like', 'just', 'very',
  'much', 'even', 'still', 'only', 'also', 'back', 'down', 'over', 'under', 'again',
  'dream', 'night', 'felt', 'like', 'were', 'was', 'had', 'and', 'the', 'but', 'not'
]);

export function extractKeywords(dreams: Dream[], maxWords = 8): Array<{ word: string; count: number }> {
  if (!dreams || dreams.length === 0) return [];

  const counts: Record<string, number> = {};

  dreams.forEach(dream => {
    // From title, content, tags, mood
    const text = `${dream.title || ''} ${dream.content || ''} ${(dream.tags || []).join(' ')} ${dream.mood || ''}`.toLowerCase();
    const words = text.match(/\b[a-z]{3,}\b/g) || [];
    
    words.forEach(word => {
      if (!STOP_WORDS.has(word) && word.length > 3) {
        counts[word] = (counts[word] || 0) + 1;
      }
    });
  });

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxWords)
    .map(([word, count]) => ({ word, count }));
}

export function generatePoeticInsight(dreams: Dream[]): string {
  if (!dreams || dreams.length === 0) {
    return "The quiet is waiting for your first thread.";
  }

  const keywords = extractKeywords(dreams, 5);
  const topKeywords = keywords.slice(0, 3).map(k => k.word);

  // Collect moods
  const moodCounts: Record<string, number> = {};
  dreams.forEach(d => {
    if (d.mood) moodCounts[d.mood] = (moodCounts[d.mood] || 0) + 1;
  });
  const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  const themes = topKeywords.length > 0 
    ? topKeywords.join(', ') 
    : 'quiet moments and fleeting images';

  if (topMood) {
    return `A gentle ${topMood.toLowerCase()} has been threading through your nights, alongside ${themes}.`;
  }

  return `${themes.charAt(0).toUpperCase() + themes.slice(1)} have been visiting often lately, like quiet companions in the dark.`;
}
