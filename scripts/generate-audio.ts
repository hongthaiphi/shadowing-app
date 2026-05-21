/**
 * Generate audio files from lesson transcripts using Azure TTS,
 * then upload to Supabase Storage bucket "audio".
 *
 * Prerequisites:
 *   1. Supabase Storage bucket "audio" must be created and set to PUBLIC
 *   2. SUPABASE_SERVICE_ROLE_KEY must be set in .env.local
 *
 * Usage:
 *   npm run generate-audio
 *
 * Safe to re-run — already-generated files are skipped.
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// ── Load .env.local ──────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnv();

// ── Config ───────────────────────────────────────────────────────────────────
const AZURE_KEY    = process.env.AZURE_SPEECH_KEY!;
const AZURE_REGION = process.env.AZURE_SPEECH_REGION!;
const SUPA_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPA_KEY     = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET       = 'audio';
const VOICE        = 'en-US-JennyNeural';

if (!AZURE_KEY || !AZURE_REGION) {
  console.error('❌  Missing AZURE_SPEECH_KEY or AZURE_SPEECH_REGION in .env.local');
  process.exit(1);
}
if (!SUPA_KEY || SUPA_KEY === 'your_service_role_key_here') {
  console.error('❌  Missing SUPABASE_SERVICE_ROLE_KEY in .env.local');
  console.error('   → Supabase Dashboard → Project Settings → API → service_role key');
  process.exit(1);
}

const supabase = createClient(SUPA_URL, SUPA_KEY);

// ── Azure TTS ────────────────────────────────────────────────────────────────
function escapeXml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function generateAudio(text: string, rate: string): Promise<Buffer> {
  const ssml = `<speak version='1.0' xml:lang='en-US'>
  <voice name='${VOICE}'>
    <prosody rate='${rate}'>${escapeXml(text)}</prosody>
  </voice>
</speak>`;

  const res = await fetch(
    `https://${AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_KEY,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
      },
      body: ssml,
    }
  );

  if (!res.ok) throw new Error(`Azure TTS ${res.status}: ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

// ── Supabase Storage upload ──────────────────────────────────────────────────
async function upload(buffer: Buffer, storagePath: string): Promise<string> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: 'audio/mpeg', upsert: true });

  if (error) throw new Error(`Upload "${storagePath}" failed: ${error.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

function dataPath(filename: string) {
  return path.join(process.cwd(), 'data', filename);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🎙️  ShadowSpeak — Audio Generator`);
  console.log(`   Voice : ${VOICE}`);
  console.log(`   Bucket: ${BUCKET}\n`);

  // ── Shadowing lessons ─────────────────────────────────────────────────────
  // Each lesson needs:
  //   audioUrl      — full transcript, normal speed
  //   audioSlowUrl  — full transcript, slow speed (0.75x)
  //   chunkAudioUrls — one file per chunk, normal speed
  //                    (slow speed handled by AudioPlayer 0.75x playback rate)
  const shadowingFile = dataPath('shadowing-lessons.json');
  const shadowing = JSON.parse(fs.readFileSync(shadowingFile, 'utf-8'));
  let shadowingUpdated = false;

  console.log('── Shadowing lessons ─────────────────────────────────────────');
  for (const lesson of shadowing) {
    const hasFullAudio  = !!(lesson.audioUrl && lesson.audioSlowUrl);
    const hasChunkAudio = Array.isArray(lesson.chunkAudioUrls) &&
                          lesson.chunkAudioUrls.length === lesson.chunks.length;

    if (hasFullAudio && hasChunkAudio) {
      console.log(`   ⏭️  ${lesson.id}  all audio present, skipping`);
      continue;
    }

    process.stdout.write(`   🔄  ${lesson.id}  "${lesson.title}"...`);

    // Full lesson audio
    if (!hasFullAudio) {
      const [normalBuf, slowBuf] = await Promise.all([
        generateAudio(lesson.transcript, '0%'),
        generateAudio(lesson.transcript, '-25%'),
      ]);
      const [normalUrl, slowUrl] = await Promise.all([
        upload(normalBuf, `shadowing/${lesson.id}-normal.mp3`),
        upload(slowBuf,   `shadowing/${lesson.id}-slow.mp3`),
      ]);
      lesson.audioUrl     = normalUrl;
      lesson.audioSlowUrl = slowUrl;
      shadowingUpdated = true;
    }

    // Per-chunk audio (normal speed; AudioPlayer handles 0.75x via playbackRate)
    if (!hasChunkAudio) {
      const chunkUrls: string[] = [];
      for (let idx = 0; idx < lesson.chunks.length; idx++) {
        const buf = await generateAudio(lesson.chunks[idx], '0%');
        const url = await upload(buf, `shadowing/${lesson.id}-chunk-${idx}.mp3`);
        chunkUrls.push(url);
        await sleep(200);
      }
      lesson.chunkAudioUrls = chunkUrls;
      shadowingUpdated = true;
    }

    process.stdout.write(`  ✅\n`);
    await sleep(300);
  }

  if (shadowingUpdated) {
    fs.writeFileSync(shadowingFile, JSON.stringify(shadowing, null, 2));
    console.log('\n   ✅  shadowing-lessons.json updated\n');
  }

  // ── Dictation lessons ─────────────────────────────────────────────────────
  // Single audio per lesson (no chunks in dictation)
  const dictationFile = dataPath('dictation-lessons.json');
  const dictation = JSON.parse(fs.readFileSync(dictationFile, 'utf-8'));
  let dictationUpdated = false;

  console.log('── Dictation lessons ─────────────────────────────────────────');
  for (const lesson of dictation) {
    if (lesson.audioUrl) {
      console.log(`   ⏭️  ${lesson.id}  already has audio, skipping`);
      continue;
    }

    process.stdout.write(`   🔄  ${lesson.id}  "${lesson.title}"  generating...`);
    const buf = await generateAudio(lesson.transcript, '0%');
    const url = await upload(buf, `dictation/${lesson.id}.mp3`);
    lesson.audioUrl = url;
    dictationUpdated = true;
    process.stdout.write(`  ✅\n`);
    await sleep(300);
  }

  if (dictationUpdated) {
    fs.writeFileSync(dictationFile, JSON.stringify(dictation, null, 2));
    console.log('\n   ✅  dictation-lessons.json updated\n');
  }

  console.log('🎉  Done! Deploy the app to apply the new audio URLs.\n');
}

main().catch((err) => {
  console.error('\n❌ ', err.message);
  process.exit(1);
});
