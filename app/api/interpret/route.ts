import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'You must be signed in to request a reflection.' }, { status: 401 });
  }

  const { title, content, mood, lucidity } = await req.json();

  if (!content || typeof content !== 'string') {
    return NextResponse.json({ error: 'Dream content is required.' }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Reflections are not configured on this server.' },
      { status: 503 }
    );
  }

  const prompt = `You are a calm, artistic companion for dream reflection. Offer a short, poetic, non-prescriptive reflection (3-5 sentences max) on the following dream. Use soft, open language. Avoid any diagnostic or definitive claims. End with a quiet invitation.

Dream title: ${title || 'Untitled'}
Felt like: ${mood || 'unknown'}
Lucidity: ${lucidity || 'unknown'}/5

Dream:
${content}

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
