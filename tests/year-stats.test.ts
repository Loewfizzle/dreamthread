import { describe, it, expect } from 'vitest'
import { computeYearStats } from '@/lib/year-stats'
import { dream } from './factory'

describe('computeYearStats', () => {
  it('scopes to the requested year', () => {
    const stats = computeYearStats(
      [dream({ dream_date: '2026-03-01' }), dream({ dream_date: '2025-03-01' })],
      2026
    )
    expect(stats.nights).toBe(1)
  })

  it('finds the longest consecutive-night streak', () => {
    const stats = computeYearStats(
      [
        dream({ dream_date: '2026-02-01' }),
        dream({ dream_date: '2026-02-02' }),
        dream({ dream_date: '2026-02-03' }),
        // gap
        dream({ dream_date: '2026-02-10' }),
        dream({ dream_date: '2026-02-11' }),
      ],
      2026
    )
    expect(stats.longestStreak).toBe(3)
  })

  it('counts two dreams on one night as a single streak day', () => {
    const stats = computeYearStats(
      [
        dream({ dream_date: '2026-02-01' }),
        dream({ dream_date: '2026-02-01' }),
        dream({ dream_date: '2026-02-02' }),
      ],
      2026
    )
    expect(stats.longestStreak).toBe(2)
  })

  it('buckets months and computes the lucid share', () => {
    const stats = computeYearStats(
      [
        dream({ dream_date: '2026-01-05', is_lucid: true }),
        dream({ dream_date: '2026-01-20' }),
        dream({ dream_date: '2026-06-10' }),
        dream({ dream_date: '2026-12-25' }),
      ],
      2026
    )
    expect(stats.monthly[0]).toBe(2)
    expect(stats.monthly[5]).toBe(1)
    expect(stats.monthly[11]).toBe(1)
    expect(stats.lucidShare).toBeCloseTo(0.25)
  })

  it('assigns seasonal moods, with December counted as winter', () => {
    const stats = computeYearStats(
      [
        dream({ dream_date: '2026-12-20', mood: 'melancholy' }),
        dream({ dream_date: '2026-04-10', mood: 'curious' }),
      ],
      2026
    )
    expect(stats.seasons).toContainEqual({ season: 'Winter', mood: 'melancholy' })
    expect(stats.seasons).toContainEqual({ season: 'Spring', mood: 'curious' })
  })

  it('identifies the first and longest dreams of the year', () => {
    const first = dream({ dream_date: '2026-01-02', content: 'short' })
    const longest = dream({ dream_date: '2026-08-01', content: 'a much longer dream body '.repeat(10) })
    const stats = computeYearStats([longest, first], 2026)
    expect(stats.firstDream?.id).toBe(first.id)
    expect(stats.longestDream?.id).toBe(longest.id)
  })

  it('skips arrived/faded symbols when the year is too thin', () => {
    const stats = computeYearStats(
      [
        dream({ dream_date: '2026-01-01', content: 'lighthouse water' }),
        dream({ dream_date: '2026-06-01', content: 'forest shadows' }),
      ],
      2026
    )
    expect(stats.arrived).toEqual([])
    expect(stats.faded).toEqual([])
  })

  it('detects symbols that arrived in the later half of a full year', () => {
    const earlier = ['ocean tide salt', 'ocean tide gulls', 'ocean cliffs'].map((content, i) =>
      dream({ dream_date: `2026-01-0${i + 1}`, content })
    )
    const later = ['lighthouse beam fog', 'lighthouse stairs', 'lighthouse keeper'].map((content, i) =>
      dream({ dream_date: `2026-09-0${i + 1}`, content })
    )
    const stats = computeYearStats([...earlier, ...later], 2026)
    expect(stats.arrived).toContain('lighthouse')
    expect(stats.faded).toContain('ocean')
  })

  it('handles an empty year without dividing by zero', () => {
    const stats = computeYearStats([], 2026)
    expect(stats.nights).toBe(0)
    expect(stats.lucidShare).toBe(0)
    expect(stats.longestStreak).toBe(0)
    expect(stats.firstDream).toBeNull()
  })
})
