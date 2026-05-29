'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import DictationInput from '@/components/DictationInput';
import { markComplete, getCompletedIds } from '@/lib/progress';
import dictationLessons from '@/data/dictation-lessons.json';
import { getTopicLabel } from '@/lib/topics';

type Lesson = {
  id: string;
  title: string;
  level: string;
  topic: string;
  type: string;
  subtype: string;
  audioUrl: string;
  transcript: string;
  durationMinutes: number;
};

const SUBTYPE_LABELS: Record<string, string> = {
  sentence: '💬 Sentence',
  dialogue: '🗣️ Dialogue',
  paragraph: '📝 Paragraph',
};

const CUSTOM_KEY = 'shadowspeak_custom_lessons';

function loadCustomDictationLesson(id: string): Lesson | null {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    if (!raw) return null;
    const customs = JSON.parse(raw) as Array<Record<string, unknown>>;
    const found = customs.find((l) => l.id === id && l.type === 'dictation');
    if (!found) return null;
    return {
      id: String(found.id || ''),
      title: String(found.title || ''),
      level: String(found.level || ''),
      topic: String(found.topic || ''),
      type: 'dictation',
      subtype: String(found.subtype || 'sentence'),
      audioUrl: String(found.audioUrl || ''),
      transcript: String(found.transcript || ''),
      durationMinutes: Number(found.durationMinutes) || 5,
    };
  } catch {
    return null;
  }
}

export default function DictationPage({ params }: { params: { id: string } }) {
  const { id } = params;

  // Try static JSON first (built-in lessons); custom lessons loaded after mount
  const jsonLesson = (dictationLessons as Lesson[]).find((l) => l.id === id) || null;

  const [lesson, setLesson] = useState<Lesson | null>(jsonLesson);
  const [lessonLoaded, setLessonLoaded] = useState(!!jsonLesson);
  const [completed, setCompleted] = useState(false);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [startTime] = useState(Date.now());

  // If not in static JSON, check localStorage for custom lessons
  useEffect(() => {
    if (!jsonLesson) {
      const custom = loadCustomDictationLesson(id);
      if (custom) setLesson(custom);
      setLessonLoaded(true);
    }
  }, [id, jsonLesson]);

  useEffect(() => {
    const ids = getCompletedIds();
    if (ids.includes(id)) setCompleted(true);
  }, [id]);

  useEffect(() => {
    if (lesson) document.title = `${lesson.title} | ShadowSpeak`;
    return () => { document.title = 'ShadowSpeak — English Practice'; };
  }, [lesson]);

  // Show loading spinner while checking localStorage
  if (!lessonLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-6 h-6 border-2 border-violet-200 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!lesson) {
    notFound();
    return null; // unreachable — helps TypeScript narrow
  }

  function handleDictationComplete(accuracy: number) {
    setLastScore(accuracy);
  }

  function handleMarkComplete() {
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    markComplete(lesson!.id, timeSpent, lastScore ?? undefined, 'dictation');
    setCompleted(true);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        href="/lessons"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-violet-600 font-medium mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Lessons
      </Link>

      {/* Header banner */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-7 mb-6 text-white">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                ✏️ Dictation
              </span>
              <span className={`bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full`}>
                {lesson.level}
              </span>
              <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {getTopicLabel(lesson.topic)}
              </span>
              {lesson.subtype && (
                <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  {SUBTYPE_LABELS[lesson.subtype] || lesson.subtype}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black mb-2">{lesson.title}</h1>
            <p className="text-purple-100 text-sm">{lesson.durationMinutes} min practice</p>
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

      {/* Instructions card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">How to practice</h2>
        <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-600">
          <li>Press play and listen to the audio carefully</li>
          <li>Type exactly what you hear in the text box below</li>
          <li>Click &ldquo;Check My Answer&rdquo; to see how you did</li>
          <li>Review the word-by-word feedback</li>
          <li>Try again to improve your score!</li>
        </ol>
      </div>

      {/* Dictation input */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        {lesson.audioUrl ? (
          <DictationInput
            transcript={lesson.transcript}
            audioSrc={lesson.audioUrl}
            onComplete={handleDictationComplete}
          />
        ) : (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
              <strong>No audio file uploaded.</strong> Add an audio file to this lesson in the Admin panel to enable playback.
            </div>
            <DictationInput
              transcript={lesson.transcript}
              audioSrc=""
              onComplete={handleDictationComplete}
            />
          </div>
        )}
      </div>

      {/* Score display */}
      {lastScore !== null && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600">Latest Score</p>
              <p className={`text-3xl font-black mt-1 ${
                lastScore >= 80 ? 'text-emerald-600' :
                lastScore >= 50 ? 'text-amber-600' :
                'text-red-600'
              }`}>
                {lastScore}%
              </p>
            </div>
            <div className={`text-4xl ${lastScore >= 80 ? '' : 'opacity-60'}`}>
              {lastScore === 100 ? '🏆' : lastScore >= 80 ? '⭐' : lastScore >= 50 ? '💪' : '📖'}
            </div>
          </div>
        </div>
      )}

      {/* Mark complete */}
      <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl border border-violet-100 p-6 text-center">
        {completed ? (
          <div>
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-lg font-bold text-violet-800 mb-1">Lesson completed!</h3>
            <p className="text-violet-600 text-sm mb-4">Well done! Your progress has been saved.</p>
            <Link
              href="/lessons"
              className="inline-block px-6 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-sm"
            >
              Browse More Lessons
            </Link>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Done practising?</h3>
            <p className="text-gray-500 text-sm mb-4">Mark this lesson as complete to save your progress.</p>
            <button
              onClick={handleMarkComplete}
              className="px-8 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-md hover:shadow-lg"
            >
              Mark as Complete ✓
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
