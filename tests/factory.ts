import type { Dream } from '@/lib/dreams'

let n = 0

/** A minimal valid Dream with overridable fields. */
export function dream(over: Partial<Dream> = {}): Dream {
  n++
  return {
    id: `d${n}`,
    user_id: 'u1',
    title: null,
    content: 'a quiet dream about nothing in particular',
    dream_date: '2026-06-01',
    mood: null,
    is_lucid: false,
    tags: null,
    created_at: '2026-06-01T08:00:00Z',
    updated_at: '2026-06-01T08:00:00Z',
    image_url: null,
    image_generation_count: 0,
    ...over,
  }
}
