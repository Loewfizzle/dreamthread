import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';

// Bound the prompt so a single request can't run up token costs
const MAX_PROMPT_CONTENT = 6_000;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'You must be signed in to request a reflection.' }, { status: 401 });
  }

  let body: { title?: unknown; content?: unknown; mood?: unknown; is_lucid?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const { title, mood, is_lucid } = body;
  const content = typeof body.content === 'string' ? body.content.trim() : '';

  if (!content) {
    return NextResponse.json({ error: 'Dream content is required.' }, { status: 400 });
  }

  const { allowed } = await checkRateLimit(supabase, user.id, 'interpretation');
  if (!allowed) {
    return NextResponse.json(
      { error: 'You’ve reached today’s reflection limit. It resets tomorrow.' },
      { status: 429 }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Reflections are not configured on this server.' },
      { status: 503 }
    );
  }

  const prompt = `You are a calm, artistic companion for dream reflection. Offer a short, poetic, non-prescriptive reflection (3-5 sentences max) on the following dream. Use soft, open language. Avoid any diagnostic or definitive claims. End with a quiet invitation.

Dream title: ${typeof title === 'string' && title ? title.slice(0, 200) : 'Untitled'}
Felt like: ${typeof mood === 'string' && mood ? mood.slice(0, 100) : 'unknown'}
Lucid dream: ${is_lucid ? 'yes' : 'no'}

Dream:
${content.slice(0, MAX_PROMPT_CONTENT)}

Reflection:`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You write beautiful, restrained, artistic reflections on dreams.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 180,
        temperature: 0.78,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      throw new Error('OpenAI request failed');
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();

    if (!text) {
      throw new Error('OpenAI returned an empty reflection');
    }

    return NextResponse.json({ interpretation: text });
  } catch (err) {
    console.error('Interpret route error:', err);
    return NextResponse.json(
      { error: 'The reflection couldn’t form right now. Please try again in a moment.' },
      { status: 502 }
    );
  }
}
