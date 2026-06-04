'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AudioPlayer from '@/components/AudioPlayer';
import Recorder from '@/components/Recorder';
import { markComplete, fetchCompletedIds } from '@/lib/progress';
import { getSupabase } from '@/lib/supabase';
import speakingLessons from '@/data/speaking-lessons.json';
import { getTopicLabel } from '@/lib/topics';

type Lesson = {
  id: string;
  title: string;
  level: string;
  topic: string;
  type: string;
  image: string;
  prompt: string;
  exampleAnswer: string;
  hints: string[];
  tips: string;
  durationMinutes: number;
};

async function fetchSpeakingLesson(id: string): Promise<Lesson | null> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', id)
    .eq('type', 'speaking')
    .single();
  if (!data) return null;
  return {
    id: String(data.id),
    title: String(data.title),
    level: String(data.level),
    topic: String(data.topic),
    type: 'speaking',
    image: data.image_url ? String(data.image_url) : '',
    prompt: data.prompt ? String(data.prompt) : '',
    exampleAnswer: data.example_answer ? String(data.example_answer) : '',
    hints: Array.isArray(data.hints) ? (data.hints as string[]) : [],
    tips: '',
    durationMinutes: Number(data.duration_minutes) || 5,
  };
}

export default function SpeakingPage({ params }: { params: { id: string } }) {
  const { id } = params;

  const jsonLesson = (speakingLessons as Lesson[]).find((l) => l.id === id) || null;

  const [lesson, setLesson] = useState<Lesson | null>(jsonLesson);
  const [lessonLoaded, setLessonLoaded] = useState(!!jsonLesson);
  const [completed, setCompleted] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [startTime] = useState(Date.now());
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (!jsonLesson) {
      fetchSpeakingLesson(id).then((custom) => {
        if (custom) setLesson(custom);
        setLessonLoaded(true);
      });
    }
  }, [id, jsonLesson]);

  useEffect(() => {
    fetchCompletedIds().then((ids) => {
      if (ids.includes(id)) setCompleted(true);
    });
  }, [id]);

  useEffect(() => {
    if (lesson) document.title = `${lesson.title} | ShadowSpeak`;
    return () => { document.title = 'ShadowSpeak — English Practice'; };
  }, [lesson]);

  if (!lessonLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!lesson) {
    notFound();
    return null;
  }

  function handleMarkComplete() {
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    // lesson is non-null here: we returned null above if lesson was null
    markComplete(lesson!.id, timeSpent, undefined, 'speaking');
    setCompleted(true);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        href="/lessons"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-500 font-medium mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Lessons
      </Link>

      {/* Header banner */}
      <div className="bg-gradient-to-r from-orange-400 to-pink-500 rounded-2xl p-7 mb-6 text-white">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                🗣️ Speaking
              </span>
              <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {lesson.level}
              </span>
              <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {getTopicLabel(lesson.topic)}
              </span>
            </div>
            <h1 className="text-2xl font-black mb-2">{lesson.title}</h1>
            <p className="text-orange-100 text-sm">{lesson.durationMinutes} min practice</p>
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
          {!imageLoaded && <div className="absolute inset-0 animate-pulse bg-gray-200" />}
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

      {/* Prompt card */}
      <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-lg flex-shrink-0">
            💬
          </div>
          <h2 className="text-base font-bold text-gray-800">Speaking Prompt</h2>
        </div>
        <p className="text-gray-800 text-lg leading-relaxed font-medium mb-4">{lesson.prompt}</p>

        {/* Vocabulary hints */}
        {lesson.hints.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Useful words</p>
            <div className="flex flex-wrap gap-2">
              {lesson.hints.map((hint) => (
                <span
                  key={hint}
                  className="px-3 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-sm font-medium"
                >
                  {hint}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tip */}
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
          <p className="text-sm text-amber-800">
            <strong>💡 Tip:</strong> {lesson.tips}
          </p>
        </div>
      </div>

      {/* Step 1: Listen to model answer */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-black flex items-center justify-center flex-shrink-0">1</span>
          <h2 className="text-base font-bold text-gray-800">Listen to a model answer</h2>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-3">
          <p className="text-sm text-gray-600 italic leading-relaxed">&ldquo;{lesson.exampleAnswer}&rdquo;</p>
        </div>
        <AudioPlayer src="" text={lesson.exampleAnswer} label="Listen to the example" />
        <p className="text-xs text-gray-400 mt-2">This is just one example — your answer can be different!</p>
      </div>

      {/* Step 2: Record your answer */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-7 h-7 rounded-full bg-orange-100 text-orange-700 text-xs font-black flex items-center justify-center flex-shrink-0">2</span>
          <h2 className="text-base font-bold text-gray-800">Now record your answer</h2>
        </div>
        <div className="flex items-center gap-2 mb-4 p-3 bg-orange-50 rounded-xl border border-orange-100">
          <svg className="w-4 h-4 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-orange-700 font-medium">
            Aim to speak for {lesson.durationMinutes >= 7 ? '30–40' : '20–30'} seconds
          </p>
        </div>
        <Recorder
          label="Tap Record and answer the prompt out loud"
          onRecordingComplete={() => setHasRecorded(true)}
        />
      </div>

      {/* Mark complete */}
      <div className={`rounded-2xl border p-6 text-center transition-all ${
        completed
          ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100'
          : hasRecorded
          ? 'bg-gradient-to-r from-orange-50 to-pink-50 border-orange-100'
          : 'bg-gray-50 border-gray-100'
      }`}>
        {completed ? (
          <div>
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-lg font-bold text-emerald-800 mb-1">Lesson completed!</h3>
            <p className="text-emerald-600 text-sm mb-4">Great speaking practice! Keep it up.</p>
            <Link
              href="/lessons"
              className="inline-block px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-sm"
            >
              Browse More Lessons
            </Link>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              {hasRecorded ? 'Great job! Ready to mark this done?' : 'Record your answer first'}
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              {hasRecorded
                ? 'Mark this lesson as complete to save your progress.'
                : 'Complete Step 2 above, then mark the lesson as done.'}
            </p>
            <button
              onClick={handleMarkComplete}
              disabled={!hasRecorded}
              className="px-8 py-3 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Mark as Complete ✓
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
