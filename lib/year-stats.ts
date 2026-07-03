import type { Dream } from '@/lib/dreams';
import { extractKeywords, parseDreamDate } from '@/lib/dream-utils';
import type { YearCardStats } from '@/lib/postcard';

export interface SeasonMood {
  season: string;
  mood: string;
}

export interface YearStats extends YearCardStats {
  monthly: number[]; // 12 counts
  seasons: SeasonMood[];
  arrived: string[];
  faded: string[];
  firstDream: Dream | null;
  longestDream: Dream | null;
}

function topMoodOf(dreams: Dream[]): string | null {
  const counts: Record<string, number> = {};
  dreams.forEach(d => {
    const key = d.mood?.trim().toLowerCase();
    if (key) counts[key] = (counts[key] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

export function computeYearStats(dreams: Dream[], year: number): YearStats {
  const inYear = dreams
    .filter(d => parseDreamDate(d.dream_date).getFullYear() === year)
    .sort((a, b) => parseDreamDate(a.dream_date).getTime() - parseDreamDate(b.dream_date).getTime());

  const monthly = Array(12).fill(0) as number[];
  const dayKeys = new Set<number>();
  let lucidCount = 0;

  inYear.forEach(d => {
    const t = parseDreamDate(d.dream_date);
    monthly[t.getMonth()]++;
    dayKeys.add(new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime());
    if (d.is_lucid) lucidCount++;
  });

  // Longest run of consecutive remembered nights
  const days = [...dayKeys].sort((a, b) => a - b);
  const dayMs = 24 * 3600 * 1000;
  let longestStreak = days.length > 0 ? 1 : 0;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    run = days[i] - days[i - 1] === dayMs ? run + 1 : 1;
    if (run > longestStreak) longestStreak = run;
  }

  // Seasonal moods (calendar seasons within the year)
  const seasonOf = (month: number) =>
    month <= 1 || month === 11 ? 'Winter' : month <= 4 ? 'Spring' : month <= 7 ? 'Summer' : 'Autumn';
  const seasons: SeasonMood[] = [];
  for (const season of ['Winter', 'Spring', 'Summer', 'Autumn']) {
    const mood = topMoodOf(inYear.filter(d => seasonOf(parseDreamDate(d.dream_date).getMonth()) === season));
    if (mood) seasons.push({ season, mood });
  }

  // Symbols that arrived vs faded: earlier half vs later half of the
  // year's dreams. Below ~6 nights the halves are too thin to compare —
  // nearly every word would "arrive" or "fade" — so skip it.
  let arrived: string[] = [];
  let faded: string[] = [];
  if (inYear.length >= 6) {
    const half = Math.ceil(inYear.length / 2);
    const earlier = new Set(extractKeywords(inYear.slice(0, half), 8).map(k => k.word));
    const later = new Set(extractKeywords(inYear.slice(half), 8).map(k => k.word));
    arrived = [...later].filter(w => !earlier.has(w)).slice(0, 4);
    faded = [...earlier].filter(w => !later.has(w)).slice(0, 4);
  }

  const longestDream = inYear.reduce<Dream | null>(
    (best, d) => (!best || d.content.length > best.content.length ? d : best),
    null
  );

  return {
    year,
    nights: inYear.length,
    lucidCount,
    lucidShare: inYear.length > 0 ? lucidCount / inYear.length : 0,
    longestStreak,
    topMood: topMoodOf(inYear),
    topKeywords: extractKeywords(inYear, 5).map(k => k.word),
    monthly,
    seasons,
    arrived,
    faded,
    firstDream: inYear[0] ?? null,
    longestDream,
  };
}
