import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/app/journal/new/actions', () => ({
  createDreamDirect: vi.fn(),
}))

import { createDreamDirect } from '@/app/journal/new/actions'
import { listDrafts, saveDraft, syncOutbox } from '@/lib/outbox'

const mockCreate = vi.mocked(createDreamDirect)

beforeEach(() => {
  mockCreate.mockReset()
  const store: Record<string, string> = {}
  vi.stubGlobal('window', {})
  vi.stubGlobal('navigator', { onLine: true })
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v
    },
    removeItem: (k: string) => {
      delete store[k]
    },
  })
})

function draft(content = 'a dream from the night') {
  return { title: 'night', content, mood: 'calm', is_lucid: false }
}

describe('outbox queue', () => {
  it('saves and lists drafts with ids and timestamps', () => {
    expect(saveDraft(draft())).toBe(true)
    const drafts = listDrafts()
    expect(drafts).toHaveLength(1)
    expect(drafts[0].content).toBe('a dream from the night')
    expect(drafts[0].id).toBeTruthy()
    expect(drafts[0].created_at).toBeTruthy()
  })

  it('survives corrupted storage', () => {
    localStorage.setItem('dreamthread:outbox', '{not json')
    expect(listDrafts()).toEqual([])
  })

  it('syncs drafts, preserving the original capture time as dream_date', async () => {
    saveDraft(draft())
    mockCreate.mockResolvedValue({ success: true })

    const synced = await syncOutbox()

    expect(synced).toBe(1)
    expect(listDrafts()).toHaveLength(0)
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ content: 'a dream from the night', dream_date: expect.any(String) })
    )
  })

  it('keeps drafts when the server rejects them', async () => {
    saveDraft(draft())
    mockCreate.mockResolvedValue({ error: 'nope' })

    expect(await syncOutbox()).toBe(0)
    expect(listDrafts()).toHaveLength(1)
  })

  it('stops at the first failure and keeps the remainder', async () => {
    saveDraft(draft('first'))
    saveDraft(draft('second'))
    mockCreate.mockResolvedValueOnce({ success: true }).mockResolvedValueOnce({ error: 'nope' })

    expect(await syncOutbox()).toBe(1)
    const remaining = listDrafts()
    expect(remaining).toHaveLength(1)
    expect(remaining[0].content).toBe('second')
  })

  it('does not attempt delivery while offline', async () => {
    saveDraft(draft())
    vi.stubGlobal('navigator', { onLine: false })

    expect(await syncOutbox()).toBe(0)
    expect(mockCreate).not.toHaveBeenCalled()
    expect(listDrafts()).toHaveLength(1)
  })
})
