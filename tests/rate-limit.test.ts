import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { checkRateLimit, DAILY_LIMITS } from '@/lib/rate-limit'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

interface FakeOptions {
  count: number
  countError?: unknown
  insertError?: unknown
}

function fakeSupabase(opts: FakeOptions) {
  const inserted: unknown[] = []
  const client = {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            gte: () => Promise.resolve({ count: opts.count, error: opts.countError ?? null }),
          }),
        }),
      }),
      insert: (row: unknown) => {
        inserted.push(row)
        return Promise.resolve({ error: opts.insertError ?? null })
      },
    }),
  } as unknown as SupabaseClient<Database>
  return { client, inserted }
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  vi.restoreAllMocks()
})

describe('checkRateLimit', () => {
  it('allows and records usage under the limit', async () => {
    const { client, inserted } = fakeSupabase({ count: DAILY_LIMITS.image_generation - 1 })
    const { allowed } = await checkRateLimit(client, 'u1', 'image_generation')
    expect(allowed).toBe(true)
    expect(inserted).toHaveLength(1)
    expect(inserted[0]).toEqual({ user_id: 'u1', kind: 'image_generation' })
  })

  it('blocks at the limit without recording', async () => {
    const { client, inserted } = fakeSupabase({ count: DAILY_LIMITS.image_generation })
    const { allowed } = await checkRateLimit(client, 'u1', 'image_generation')
    expect(allowed).toBe(false)
    expect(inserted).toHaveLength(0)
  })

  it('fails open when the count query errors (e.g. missing table)', async () => {
    const { client } = fakeSupabase({ count: 0, countError: new Error('relation does not exist') })
    const { allowed } = await checkRateLimit(client, 'u1', 'ask')
    expect(allowed).toBe(true)
  })

  it('fails open when the insert errors', async () => {
    const { client } = fakeSupabase({ count: 0, insertError: new Error('constraint') })
    const { allowed } = await checkRateLimit(client, 'u1', 'transcription')
    expect(allowed).toBe(true)
  })
})
