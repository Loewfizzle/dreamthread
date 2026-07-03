// Server-side only: requires OPENAI_API_KEY.

/**
 * Embeds text with OpenAI text-embedding-3-small (1536 dims).
 * Returns null on any failure — embeddings are an enhancement, never
 * a reason for a save to fail.
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY
  const input = text.trim().slice(0, 8000)
  if (!apiKey || !input) return null

  try {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input,
      }),
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) throw new Error(`embeddings request failed: ${res.status}`)
    const data = await res.json()
    const embedding = data.data?.[0]?.embedding
    return Array.isArray(embedding) ? embedding : null
  } catch (err) {
    console.error('generateEmbedding failed:', err)
    return null
  }
}

/** What we embed for a dream — kept in one place so save and backfill agree. */
export function dreamEmbeddingText(title: string | null, content: string): string {
  return [title, content].filter(Boolean).join('\n\n')
}
