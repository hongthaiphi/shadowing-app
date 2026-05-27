'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth';
import {
  getProgress,
  getTotalMinutes,
  getDictationAccuracy,
  getStreak,
  LessonProgress,
} from '@/lib/progress';
import ProgressCard from '@/components/ProgressCard';
import ActivityCalendar from '@/components/ActivityCalendar';
import shadowingLessons from '@/data/shadowing-lessons.json';
import dictationLessons from '@/data/dictation-lessons.json';
import speakingLessons from '@/data/speaking-lessons.json';
import readingLessons from '@/data/reading-lessons.json';

const allLessons = [...shadowingLessons, ...dictationLessons, ...speakingLessons, ...readingLessons] as Array<{
  id: string; title: string; type: string; level: string; topic: string;
}>;

function getLessonTitle(id: string): string {
  return allLessons.find((l) => l.id === id)?.title || id;
}

function getLessonType(id: string): string {
  return allLessons.find((l) => l.id === id)?.type || '';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getMotivationalMessage(streak: number): string {
  if (streak === 0) return 'Start your streak today! Practice one lesson to begin.';
  if (streak === 1) return "Great start! Come back tomorrow to build your streak.";
  if (streak < 5) return `${streak} days in a row! You're building a great habit.`;
  if (streak < 10) return `${streak} day streak! You're on fire! Keep it up!`;
  if (streak < 30) return `Amazing! ${streak} day streak. You're seriously dedicated!`;
  return `🏆 Incredible! ${streak} day streak. You're a true champion!`;
}

export default function ProgressPage() {
  const router = useRouter();
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setProgress(getProgress());
    setTotalMinutes(getTotalMinutes());
    setAccuracy(getDictationAccuracy());
    setStreak(getStreak());
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400 text-lg">Loading...</div>
      </div>
    );
  }

  const recentLessons = progress.slice(0, 10);
  const motivMessage = getMotivationalMessage(streak);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-8 mb-8 text-white">
        <h1 className="text-3xl font-black mb-2">Your Progress</h1>
        <p className="text-emerald-100">{motivMessage}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <ProgressCard
          icon="📚"
          label="Lessons Completed"
          value={progress.length}
          sublabel={`of ${allLessons.length} total`}
          gradient="from-blue-400 to-cyan-500"
        />
        <ProgressCard
          icon="⏱️"
          label="Total Minutes"
          value={totalMinutes}
          sublabel="time practising"
          gradient="from-violet-400 to-purple-500"
        />
        <ProgressCard
          icon="🎯"
          label="Dictation Accuracy"
          value={`${accuracy}%`}
          sublabel="average score"
          gradient="from-orange-400 to-pink-500"
        />
        <ProgressCard
          icon="🔥"
          label="Day Streak"
          value={streak}
          sublabel={streak === 1 ? '1 day' : `${streak} days`}
          gradient="from-emerald-400 to-teal-500"
        />
      </div>

      {/* Streak motivational banner */}
      {streak > 0 && (
        <div className={`rounded-2xl p-5 mb-8 border ${
          streak >= 7 ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200' :
          'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{streak >= 7 ? '🔥' : '⭐'}</span>
            <div>
              <p className="font-bold text-gray-800">{streak >= 7 ? 'Hot streak!' : 'Keep it up!'}</p>
              <p className="text-sm text-gray-600">{motivMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Activity Calendar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
        <ActivityCalendar progress={progress} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-gray-100">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-2xl font-black text-blue-700">
              {progress.filter(p => getLessonType(p.lessonId) === 'shadowing').length}
            </p>
            <p className="text-sm text-blue-600 font-medium mt-1">🎧 Shadowing</p>
          </div>
          <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
            <p className="text-2xl font-black text-violet-700">
              {progress.filter(p => getLessonType(p.lessonId) === 'dictation').length}
            </p>
            <p className="text-sm text-violet-600 font-medium mt-1">✏️ Dictation</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
            <p className="text-2xl font-black text-orange-600">
              {progress.filter(p => getLessonType(p.lessonId) === 'speaking').length}
            </p>
            <p className="text-sm text-orange-600 font-medium mt-1">🗣️ Speaking</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <p className="text-2xl font-black text-green-700">
              {progress.filter(p => getLessonType(p.lessonId) === 'reading').length}
            </p>
            <p className="text-sm text-green-600 font-medium mt-1">📖 Reading</p>
          </div>
        </div>
      </div>

      {/* Recent lessons */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-800">Recent Activity</h2>
          <Link href="/lessons" className="text-sm text-blue-600 font-medium hover:underline">
            Browse lessons →
          </Link>
        </div>

        {recentLessons.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">📖</div>
            <h3 className="font-bold text-gray-700 mb-2">No lessons completed yet</h3>
            <p className="text-gray-400 text-sm mb-4">Start practising to see your progress here!</p>
            <Link
              href="/lessons"
              className="inline-block px-6 py-2.5 bg-gradient-to-r from-blue-500 to-violet-500 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-sm"
            >
              Browse Lessons
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentLessons.map((p, i) => {
              const type = getLessonType(p.lessonId);
              const title = getLessonTitle(p.lessonId);
              const href = type === 'shadowing'
                ? `/shadowing/${p.lessonId}`
                : type === 'speaking'
                ? `/speaking/${p.lessonId}`
                : type === 'reading'
                ? `/reading/${p.lessonId}`
                : `/dictation/${p.lessonId}`;

              return (
                <Link
                  key={i}
                  href={href}
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100 group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${
                      type === 'shadowing' ? 'bg-blue-100' : type === 'speaking' ? 'bg-orange-100' : type === 'reading' ? 'bg-green-100' : 'bg-violet-100'
                    }`}>
                      {type === 'shadowing' ? '🎧' : type === 'speaking' ? '🗣️' : type === 'reading' ? '📖' : '✏️'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm group-hover:text-blue-600 transition-colors">{title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(p.completedAt)}
                        {p.score !== undefined && (
                          <span className={`ml-2 font-semibold ${
                            p.score >= 80 ? 'text-emerald-600' :
                            p.score >= 50 ? 'text-amber-600' :
                            'text-red-600'
                          }`}>
                            {p.score}%
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>{Math.round(p.timeSpent / 60)} min</span>
                    <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
