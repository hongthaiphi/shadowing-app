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

export default function DictationPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const lesson = (dictationLessons as Lesson[]).find((l) => l.id === id);

  const [completed, setCompleted] = useState(false);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const ids = getCompletedIds();
    if (ids.includes(id)) setCompleted(true);
  }, [id]);

  if (!lesson) {
    notFound();
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
        <DictationInput
          transcript={lesson.transcript}
          audioSrc={lesson.audioUrl}
          onComplete={handleDictationComplete}
        />
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
