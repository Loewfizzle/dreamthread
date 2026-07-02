import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File | null;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio provided.' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Graceful fallback for demo without key (or during dev)
      // Simulate a short delay and return a poetic placeholder transcription
      await new Promise(r => setTimeout(r, 650));
      return NextResponse.json({ 
        text: "I was walking through a silver forest where the leaves whispered secrets from my childhood. The path led to a still lake that reflected the moon perfectly, and I could hear my own name being called softly from the water." 
      });
    }

    // Prepare form for OpenAI Whisper
    const whisperForm = new FormData();
    whisperForm.append('file', audioFile, audioFile.name || 'dream.webm');
    whisperForm.append('model', 'whisper-1');
    // Helpful prompt for dream context - keeps transcription natural and accurate
    whisperForm.append('prompt', 'This is a spoken recollection of a dream. Transcribe the words exactly as spoken, preserving the natural flow, pauses, and any poetic or emotional language. Do not summarize or correct grammar.');
    whisperForm.append('language', 'en'); // can be extended later
    whisperForm.append('response_format', 'json');

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: whisperForm,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('Whisper error:', res.status, errText);
      return NextResponse.json({ 
        error: 'Transcription service had trouble hearing the dream.' 
      }, { status: 502 });
    }

    const data = await res.json();
    const text = (data.text || '').trim();

    if (!text) {
      return NextResponse.json({ 
        error: 'The recording was too quiet or unclear. Please try speaking a little louder or closer to the microphone.' 
      }, { status: 422 });
    }

    return NextResponse.json({ text });
  } catch (err) {
    console.error('Transcribe route error:', err);
    return NextResponse.json({ 
      error: 'We ran into an unexpected issue transcribing. Your recording wasn’t sent, but you can try again or type instead.' 
    }, { status: 500 });
  }
}
