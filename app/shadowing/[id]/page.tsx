'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import CadenceStudyPlayer from '@/components/CadenceStudyPlayer';
import { markComplete, fetchCompletedIds } from '@/lib/progress';
import { getSupabase } from '@/lib/supabase';
import shadowingLessons from '@/data/shadowing-lessons.json';
import { getTopicLabel } from '@/lib/topics';

type Lesson = {
  id: string;
  title: string;
  level: string;
  topic: string;
  type: string;
  audioUrl: string;
  chunkAudioUrls: string[];
  transcript: string;
  chunks: string[];
  durationMinutes: number;
  notes: string;
};

const TOPIC_COLORS: Record<string, { bg: string; fg: string }> = {
  school:          { bg: 'var(--coral-t)',  fg: 'var(--coral)'  },
  hobbies:         { bg: 'var(--sky-t)',    fg: 'var(--sky)'    },
  family:          { bg: 'var(--violet-t)', fg: 'var(--violet)' },
  food:            { bg: 'var(--amber-t)',  fg: 'var(--amber)'  },
  'daily routine': { bg: 'var(--mint-t)',   fg: 'var(--mint)'   },
};

async function fetchShadowingLesson(id: string): Promise<Lesson | null> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', id)
    .eq('type', 'shadowing')
    .single();
  if (!data) return null;
  return {
    id: String(data.id),
    title: String(data.title),
    level: String(data.level),
    topic: String(data.topic),
    type: 'shadowing',
    audioUrl: data.audio_url ? String(data.audio_url) : '',
    chunkAudioUrls: [],
    transcript: data.transcript ? String(data.transcript) : '',
    chunks: Array.isArray(data.chunks) ? (data.chunks as string[]) : [],
    durationMinutes: Number(data.duration_minutes) || 5,
    notes: '',
  };
}

export default function ShadowingPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();

  const jsonLesson = (shadowingLessons as Lesson[]).find((l) => l.id === id) ?? null;

  const [lesson, setLesson] = useState<Lesson | null>(jsonLesson);
  const [lessonLoaded, setLessonLoaded] = useState(!!jsonLesson);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (!jsonLesson) {
      fetchShadowingLesson(id).then((custom) => {
        if (custom) setLesson(custom);
        setLessonLoaded(true);
      });
    }
  }, [id, jsonLesson]);

  useEffect(() => {
    // Warm the localStorage cache from DB so markComplete reflects cross-device state
    fetchCompletedIds().then();
  }, [id]);

  useEffect(() => {
    if (lesson) document.title = `${lesson.title} | Cadence`;
    return () => { document.title = 'Cadence — English Speaking Studio'; };
  }, [lesson]);

  if (!lessonLoaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2.5px solid var(--line)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!lesson) {
    notFound();
    return null;
  }

  const lines = lesson.chunks.map((text, i) => ({
    text,
    audioUrl: lesson.chunkAudioUrls?.[i] ?? undefined,
  }));

  const tagColor = TOPIC_COLORS[lesson.topic] ?? { bg: 'var(--sky-t)', fg: 'var(--sky)' };
  const levelTag = `${lesson.level} · ${getTopicLabel(lesson.topic)} · American`;

  function handleComplete() {
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    markComplete(id, timeSpent, undefined, 'shadowing');
  }

  return (
    <CadenceStudyPlayer
      lessonTitle={lesson.title}
      levelTag={levelTag}
      tagColor={tagColor}
      lines={lines}
      notes={lesson.notes}
      onComplete={handleComplete}
      onBack={() => router.push('/lessons')}
    />
  );
}
