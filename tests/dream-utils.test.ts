import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  parseDreamDate,
  formatDreamDate,
  getExcerpt,
  extractKeywords,
  computeDreamStats,
  findOnThisNight,
  nightDateFor,
  generatePoeticInsight,
} from '@/lib/dream-utils'
import { dream } from './factory'

describe('parseDreamDate', () => {
  it('parses date-only strings as LOCAL time, not UTC', () => {
    const d = parseDreamDate('2026-06-29')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(5)
    expect(d.getDate()).toBe(29)
    expect(d.getHours()).toBe(0)
  })

  it('passes full ISO timestamps through to Date', () => {
    const iso = '2026-06-29T14:30:00.000Z'
    expect(parseDreamDate(iso).getTime()).toBe(new Date(iso).getTime())
  })
})

describe('formatDreamDate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Local noon, July 3 2026 (a Friday)
    vi.setSystemTime(new Date(2026, 6, 3, 12, 0, 0))
  })
  afterEach(() => vi.useRealTimers())

  it('labels today and yesterday', () => {
    expect(formatDreamDate('2026-07-03')).toBe('Today')
    expect(formatDreamDate('2026-07-02')).toBe('Yesterday')
  })

  it('uses the weekday inside a week', () => {
    // 2026-06-30 is a Tuesday, 3 days before the fake "today"
    expect(formatDreamDate('2026-06-30')).toBe('Tuesday')
  })

  it('omits the year for the current year and includes it otherwise', () => {
    expect(formatDreamDate('2026-06-03')).not.toMatch(/2026/)
    expect(formatDreamDate('2025-06-03')).toMatch(/2025/)
  })
})

describe('nightDateFor', () => {
  it('keeps the evening date after 7pm', () => {
    expect(nightDateFor(new Date(2026, 6, 3, 23, 0))).toBe('2026-07-03')
  })

  it('assigns the small hours to the previous night', () => {
    expect(nightDateFor(new Date(2026, 6, 3, 2, 0))).toBe('2026-07-02')
  })

  it('treats 4am as a new day', () => {
    expect(nightDateFor(new Date(2026, 6, 3, 4, 0))).toBe('2026-07-03')
  })

  it('wraps across month boundaries', () => {
    expect(nightDateFor(new Date(2026, 6, 1, 1, 0))).toBe('2026-06-30')
  })
})

describe('getExcerpt', () => {
  it('returns short text untouched (whitespace collapsed)', () => {
    expect(getExcerpt('a  short\n dream')).toBe('a short dream')
  })

  it('cuts at sentence punctuation when one lands late enough', () => {
    const text =
      'The first sentence carries on for quite a decent while longer before it finally ends here. Then more trailing words that will not fit into the limit at all.'
    const out = getExcerpt(text, 100)
    expect(out).toBe('The first sentence carries on for quite a decent while longer before it finally ends here.')
  })

  it('falls back to an ellipsis when no punctuation is available', () => {
    const out = getExcerpt('word '.repeat(60), 100)
    expect(out.endsWith('…')).toBe(true)
    expect(out.length).toBeLessThanOrEqual(102)
  })
})

describe('extractKeywords', () => {
  it('ignores stopwords and short words', () => {
    const words = extractKeywords([
      dream({ content: 'suddenly I remember something about the lighthouse' }),
    ]).map(k => k.word)
    expect(words).toContain('lighthouse')
    expect(words).not.toContain('suddenly')
    expect(words).not.toContain('remember')
    expect(words).not.toContain('something')
  })

  it('caps how much one wordy dream can contribute', () => {
    const repeated = dream({ content: 'lighthouse '.repeat(10) })
    const [top] = extractKeywords([repeated])
    expect(top.word).toBe('lighthouse')
    expect(top.count).toBe(4) // capped, not 10
  })

  it('weights tags above prose mentions', () => {
    const d = dream({ content: 'ocean ocean waves crashing', tags: ['flying'] })
    const words = extractKeywords([d])
    const flying = words.find(k => k.word === 'flying')
    const ocean = words.find(k => k.word === 'ocean')
    expect(flying!.count).toBeGreaterThan(ocean!.count)
  })

  it('folds trivial plurals into the singular', () => {
    const words = extractKeywords([
      dream({ content: 'a single door stood there' }),
      dream({ content: 'endless doors along the hall' }),
    ])
    const door = words.find(k => k.word === 'door')
    expect(door).toBeDefined()
    expect(words.find(k => k.word === 'doors')).toBeUndefined()
    expect(door!.count).toBe(2)
  })
})

describe('computeDreamStats', () => {
  const now = new Date(2026, 6, 15) // July 15 2026

  it('counts the month, lucid share, and recency', () => {
    const stats = computeDreamStats(
      [
        dream({ dream_date: '2026-07-14', is_lucid: true }),
        dream({ dream_date: '2026-07-01' }),
        dream({ dream_date: '2026-06-20' }),
        dream({ dream_date: '2025-07-15' }),
      ],
      now
    )
    expect(stats.total).toBe(4)
    expect(stats.nightsThisMonth).toBe(2)
    expect(stats.lucidCount).toBe(1)
    expect(stats.lucidShare).toBeCloseTo(0.25)
    expect(stats.dreamedRecently).toBe(true)
  })

  it('groups moods case-insensitively', () => {
    const stats = computeDreamStats(
      [
        dream({ dream_date: '2026-07-01', mood: 'Calm' }),
        dream({ dream_date: '2026-07-02', mood: 'calm' }),
        dream({ dream_date: '2026-07-03', mood: 'Anxious' }),
      ],
      now
    )
    expect(stats.topMood).toBe('calm')
  })
})

describe('findOnThisNight', () => {
  const now = new Date(2026, 6, 15)

  it('finds a dream from a year ago within the window', () => {
    const hit = findOnThisNight([dream({ dream_date: '2025-07-16' })], now)
    expect(hit?.label).toBe('a year ago')
  })

  it('prefers the most distant anniversary', () => {
    const hit = findOnThisNight(
      [dream({ dream_date: '2026-06-15' }), dream({ dream_date: '2025-07-15' })],
      now
    )
    expect(hit?.label).toBe('a year ago')
  })

  it('rejects dreams outside the two-day window', () => {
    expect(findOnThisNight([dream({ dream_date: '2025-07-20' })], now)).toBeNull()
    expect(findOnThisNight([], now)).toBeNull()
  })
})

describe('generatePoeticInsight', () => {
  it('handles the empty and single-dream cases', () => {
    expect(generatePoeticInsight([])).toMatch(/first thread/)
    expect(generatePoeticInsight([dream()])).toMatch(/One thread/)
  })

  it('notices a lucid-heavy journal', () => {
    const dreams = [
      dream({ content: 'the lighthouse again, tall over dark water', is_lucid: true }),
      dream({ content: 'the lighthouse turning in fog', is_lucid: true }),
      dream({ content: 'walking the shoreline toward the lighthouse' }),
    ]
    expect(generatePoeticInsight(dreams)).toMatch(/waking inside your dreams/)
  })
})
