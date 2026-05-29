'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ChunkPlayer from '@/components/ChunkPlayer';
import { markComplete, getCompletedIds } from '@/lib/progress';
import shadowingLessons from '@/data/shadowing-lessons.json';
import { getTopicLabel } from '@/lib/topics';

type Lesson = {
  id: string;
  title: string;
  level: string;
  topic: string;
  type: string;
  image: string;
  audioUrl: string;
  audioSlowUrl: string;
  chunkAudioUrls: string[];
  transcript: string;
  chunks: string[];
  durationMinutes: number;
  notes: string;
};

const CUSTOM_KEY = 'shadowspeak_custom_lessons';

function loadCustomShadowingLesson(id: string): Lesson | null {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    if (!raw) return null;
    const customs = JSON.parse(raw) as Array<Record<string, unknown>>;
    const found = customs.find((l) => l.id === id && l.type === 'shadowing');
    if (!found) return null;
    return {
      id: String(found.id || ''),
      title: String(found.title || ''),
      level: String(found.level || ''),
      topic: String(found.topic || ''),
      type: 'shadowing',
      image: String(found.imageUrl || found.image || ''),
      audioUrl: String(found.audioUrl || ''),
      audioSlowUrl: String(found.audioSlowUrl || ''),
      chunkAudioUrls: Array.isArray(found.chunkAudioUrls) ? (found.chunkAudioUrls as string[]) : [],
      transcript: String(found.transcript || ''),
      chunks: Array.isArray(found.chunks) ? (found.chunks as string[]) : [],
      durationMinutes: Number(found.durationMinutes) || 5,
      notes: String(found.notes || ''),
    };
  } catch {
    return null;
  }
}

export default function ShadowingPage({ params }: { params: { id: string } }) {
  const { id } = params;

  // Try static JSON first (built-in lessons); custom lessons loaded after mount
  const jsonLesson = (shadowingLessons as Lesson[]).find((l) => l.id === id) || null;

  const [lesson, setLesson] = useState<Lesson | null>(jsonLesson);
  const [lessonLoaded, setLessonLoaded] = useState(!!jsonLesson);
  const [chunksDone, setChunksDone] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [startTime] = useState(Date.now());
  const [imageLoaded, setImageLoaded] = useState(false);

  // If not in static JSON, check localStorage for custom lessons
  useEffect(() => {
    if (!jsonLesson) {
      const custom = loadCustomShadowingLesson(id);
      if (custom) setLesson(custom);
      setLessonLoaded(true);
    }
  }, [id, jsonLesson]);

  useEffect(() => {
    const ids = getCompletedIds();
    if (ids.includes(id)) setCompleted(true);
  }, [id]);

  // Per-page document title for SEO / browser tab
  useEffect(() => {
    if (lesson) document.title = `${lesson.title} | ShadowSpeak`;
    return () => { document.title = 'ShadowSpeak — English Practice'; };
  }, [lesson]);

  // Show loading skeleton while checking localStorage
  if (!lessonLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!lesson) {
    notFound();
    return null; // unreachable — helps TypeScript narrow
  }

  function handleChunksComplete() {
    setChunksDone(true);
  }

  function handleMarkComplete() {
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    markComplete(lesson!.id, timeSpent, undefined, 'shadowing');
    setCompleted(true);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        href="/lessons"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 font-medium mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Lessons
      </Link>

      {/* Header banner */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-7 mb-6 text-white">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                🎧 Shadowing
              </span>
              <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {lesson.level}
              </span>
              <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {getTopicLabel(lesson.topic)}
              </span>
            </div>
            <h1 className="text-2xl font-black mb-2">{lesson.title}</h1>
            <p className="text-blue-100 text-sm">{lesson.durationMinutes} min &bull; {lesson.chunks.length} chunks</p>
          </div>
          {completed && (
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30 text-sm font-bold flex items-center gap-2 flex-shrink-0">
              <svg className="w-4 h-4 text-emerald-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Completed
            </div>
          )}
        </div>
      </div>

      {/* Lesson image */}
      {lesson.image && (
        <div className="rounded-2xl overflow-hidden mb-6 h-48 bg-gray-200 relative">
          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse bg-gray-200" />
          )}
          <Image
            src={lesson.image}
            alt={lesson.title}
            fill
            sizes="(max-width: 896px) 100vw, 896px"
            className={`object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(true)}
            priority={false}
          />
        </div>
      )}

      {/* Transcript card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Full Transcript</h2>
        <p className="text-gray-700 leading-relaxed text-base">{lesson.transcript}</p>
        {lesson.notes && (
          <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-sm text-blue-700">
              <strong>💡 Tip:</strong> {lesson.notes}
            </p>
          </div>
        )}
      </div>

      {/* Chunk player — show even without audio so custom lessons without audio still work */}
      {lesson.chunks.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-5">Chunk Practice</h2>
          {lesson.audioUrl ? (
            <ChunkPlayer
              chunks={lesson.chunks}
              audioUrl={lesson.audioUrl}
              chunkAudioUrls={lesson.chunkAudioUrls}
              onComplete={handleChunksComplete}
            />
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
              <strong>No audio file uploaded.</strong> Add an audio file to this lesson in the Admin panel to enable playback.
            </div>
          )}
        </div>
      )}

      {/* Mark complete */}
      {(chunksDone || true) && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 p-6 text-center">
          {completed ? (
            <div>
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="text-lg font-bold text-emerald-800 mb-1">Lesson completed!</h3>
              <p className="text-emerald-600 text-sm mb-4">Well done! Keep up the great work.</p>
              <Link
                href="/lessons"
                className="inline-block px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-sm"
              >
                Browse More Lessons
              </Link>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Finished practising?</h3>
              <p className="text-gray-500 text-sm mb-4">Mark this lesson as complete to track your progress.</p>
              <button
                onClick={handleMarkComplete}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-md hover:shadow-lg"
              >
                Mark as Complete ✓
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
