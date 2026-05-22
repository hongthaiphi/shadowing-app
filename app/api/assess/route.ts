import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch { /* read-only context */ }
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;

  if (!key || !region) {
    return NextResponse.json({ error: 'Service not available' }, { status: 503 });
  }

  try {
    const formData = await request.formData();
    const audio = formData.get('audio') as File | null;
    const referenceText = formData.get('referenceText') as string | null;

    if (!audio || !referenceText) {
      return NextResponse.json({ error: 'Missing audio or referenceText' }, { status: 400 });
    }

    const MAX_AUDIO_BYTES = 10 * 1024 * 1024; // 10 MB
    if (audio.size > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: 'Audio file too large' }, { status: 413 });
    }

    const audioBuffer = Buffer.from(await audio.arrayBuffer());

    const pronunciationConfig = JSON.stringify({
      ReferenceText: referenceText,
      GradingSystem: 'HundredMark',
      Granularity: 'Phoneme',
      EnableMiscue: true,
    });
    const pronunciationConfigB64 = Buffer.from(pronunciationConfig).toString('base64');

    const speechRes = await fetch(
      `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': key,
          'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
          'Pronunciation-Assessment': pronunciationConfigB64,
        },
        body: audioBuffer,
      }
    );

    const rawText = await speechRes.text();
    if (!speechRes.ok) {
      console.error(`[assess] Azure STT error ${speechRes.status}:`, rawText);
      return NextResponse.json({ error: 'Assessment service error' }, { status: 502 });
    }

    const speechJson = JSON.parse(rawText);
    const nBest = speechJson?.NBest?.[0];

    if (!nBest) {
      return NextResponse.json({ error: 'No recognition result' }, { status: 422 });
    }

    const words: AzureWord[] = nBest.Words ?? [];
    const spokenWords = words.filter((w) => w.Duration > 0);
    const totalWords = words.length;

    const accuracyScore = nBest.AccuracyScore ?? 0;
    const fluencyScore = nBest.FluencyScore ?? accuracyScore;
    const completenessScore = nBest.CompletenessScore ??
      (totalWords > 0 ? Math.round((spokenWords.length / totalWords) * 100) : 0);
    const prosodyScore = nBest.PronScore ?? accuracyScore;

    return NextResponse.json({
      accuracyScore,
      fluencyScore,
      completenessScore,
      prosodyScore,
      words: words.map((w) => ({
        word: w.Word,
        accuracyScore: w.AccuracyScore ?? 0,
        errorType: w.Duration === 0 ? 'Omission' : 'None',
        phonemes: (w.Phonemes ?? []).map((p) => ({
          phoneme: p.Phoneme,
          accuracyScore: p.AccuracyScore ?? 0,
        })),
      })),
    });
  } catch (error) {
    console.error('[assess] error:', error);
    return NextResponse.json({ error: 'Assessment failed' }, { status: 500 });
  }
}

interface AzureWord {
  Word: string;
  AccuracyScore?: number;
  Duration: number;
  Phonemes?: AzurePhoneme[];
}

interface AzurePhoneme {
  Phoneme: string;
  AccuracyScore?: number;
}
