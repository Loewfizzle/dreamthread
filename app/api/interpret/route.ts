import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { title, content, mood, lucidity } = await req.json();

  if (!content || typeof content !== 'string') {
    return NextResponse.json({ error: 'Dream content is required.' }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ 
      interpretation: 'In the quiet of this moment, the symbols of the library breathing and the silver ladder suggest a call to gentle self-inquiry. Notice the parts of yourself that feel submerged, and the curiosity that remains even in uncertainty. What small truth might be ready to surface if you simply sit with it?' 
    });
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
    const text = data.choices?.[0]?.message?.content?.trim() || 'The night holds more than words can say right now.';

    return NextResponse.json({ interpretation: text });
  } catch {
    // graceful fallback
    return NextResponse.json({ 
      interpretation: 'There is a quiet thread running through this night — something about returning to what you already know but see differently now. Sit with the feeling it left behind rather than chasing its story.' 
    });
  }
}
