'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth';
import {
  getProgress,
  getTotalMinutes,
  getStreak,
  LessonProgress,
} from '@/lib/progress';
import ActivityCalendar from '@/components/ActivityCalendar';
import shadowingLessons from '@/data/shadowing-lessons.json';
import dictationLessons from '@/data/dictation-lessons.json';
import speakingLessons from '@/data/speaking-lessons.json';
import readingLessons from '@/data/reading-lessons.json';
import writingLessons from '@/data/writing-lessons.json';

const allLessons = [
  ...shadowingLessons,
  ...dictationLessons,
  ...speakingLessons,
  ...readingLessons,
  ...writingLessons,
] as Array<{ id: string; title: string; type: string; level: string; topic: string }>;

const LESSON_COUNTS = {
  shadowing: shadowingLessons.length,
  dictation: dictationLessons.length,
  speaking: speakingLessons.length,
  reading: readingLessons.length,
  writing: writingLessons.length,
};

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
  return `${streak} day streak. You're a true champion!`;
}

function getOverallAccuracy(progress: LessonProgress[]): number {
  const withScore = progress.filter((p) => p.score !== undefined);
  if (withScore.length === 0) return 0;
  return Math.round(withScore.reduce((s, p) => s + (p.score ?? 0), 0) / withScore.length);
}

type ActivityFilter = 'all' | 'shadowing' | 'dictation' | 'speaking' | 'reading' | 'writing';

const FILTERS: { key: ActivityFilter; label: string; emoji: string; color: string; bg: string }[] = [
  { key: 'all', label: 'All', emoji: '📋', color: 'text-gray-700', bg: 'bg-gray-100' },
  { key: 'shadowing', label: 'Shadowing', emoji: '🎧', color: 'text-blue-700', bg: 'bg-blue-100' },
  { key: 'dictation', label: 'Dictation', emoji: '✏️', color: 'text-violet-700', bg: 'bg-violet-100' },
  { key: 'speaking', label: 'Speaking', emoji: '🗣️', color: 'text-orange-600', bg: 'bg-orange-100' },
  { key: 'reading', label: 'Reading', emoji: '📖', color: 'text-green-700', bg: 'bg-green-100' },
  { key: 'writing', label: 'Writing', emoji: '✍️', color: 'text-amber-700', bg: 'bg-amber-100' },
];

function SkillBar({
  emoji, label, completed, total, colorClass, barClass,
}: {
  emoji: string; label: string; completed: number; total: number;
  colorClass: string; barClass: string;
}) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-gray-700">{emoji} {label}</span>
        <span className={`text-sm font-bold ${colorClass}`}>{completed}/{total}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function ProgressPage() {
  const router = useRouter();
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ActivityFilter>('all');

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    const p = getProgress();
    setProgress(p);
    setTotalMinutes(getTotalMinutes());
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

  const accuracy = getOverallAccuracy(progress);
  const motivMessage = getMotivationalMessage(streak);

  const completedByType = {
    shadowing: progress.filter((p) => getLessonType(p.lessonId) === 'shadowing').length,
    dictation: progress.filter((p) => getLessonType(p.lessonId) === 'dictation').length,
    speaking: progress.filter((p) => getLessonType(p.lessonId) === 'speaking').length,
    reading: progress.filter((p) => getLessonType(p.lessonId) === 'reading').length,
    writing: progress.filter((p) => getLessonType(p.lessonId) === 'writing').length,
  };

  const filteredProgress =
    filter === 'all'
      ? progress
      : progress.filter((p) => getLessonType(p.lessonId) === filter);

  const recentLessons = filteredProgress.slice(0, 15);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-8 mb-8 text-white">
        <h1 className="text-3xl font-black mb-1">Your Progress</h1>
        <p className="text-emerald-100 text-sm">{motivMessage}</p>
        {streak > 0 && (
          <div className="mt-4 inline-flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2 text-sm font-semibold">
            <span>{streak >= 7 ? '🔥' : '⭐'}</span>
            <span>{streak} day streak</span>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-xl mb-3">📚</div>
          <p className="text-2xl font-black text-gray-800">{progress.length}</p>
          <p className="text-sm font-semibold text-gray-600 mt-0.5">Lessons Done</p>
          <p className="text-xs text-gray-400">of {allLessons.length} total</p>
          <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-400 rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.round((progress.length / allLessons.length) * 100))}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-xl mb-3">⏱️</div>
          <p className="text-2xl font-black text-gray-800">{totalMinutes}</p>
          <p className="text-sm font-semibold text-gray-600 mt-0.5">Total Minutes</p>
          <p className="text-xs text-gray-400">time practising</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-xl mb-3">🎯</div>
          <p className="text-2xl font-black text-gray-800">{accuracy}%</p>
          <p className="text-sm font-semibold text-gray-600 mt-0.5">Avg Accuracy</p>
          <p className="text-xs text-gray-400">across all scored</p>
          {accuracy > 0 && (
            <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${accuracy >= 80 ? 'bg-emerald-400' : accuracy >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                style={{ width: `${accuracy}%` }}
              />
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-xl mb-3">🔥</div>
          <p className="text-2xl font-black text-gray-800">{streak}</p>
          <p className="text-sm font-semibold text-gray-600 mt-0.5">Day Streak</p>
          <p className="text-xs text-gray-400">{streak === 0 ? 'practice today!' : streak === 1 ? 'keep going!' : 'days in a row'}</p>
        </div>
      </div>

      {/* Skill breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-5">Skills Breakdown</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <SkillBar emoji="🎧" label="Shadowing" completed={completedByType.shadowing} total={LESSON_COUNTS.shadowing} colorClass="text-blue-600" barClass="bg-blue-400" />
          <SkillBar emoji="✏️" label="Dictation" completed={completedByType.dictation} total={LESSON_COUNTS.dictation} colorClass="text-violet-600" barClass="bg-violet-400" />
          <SkillBar emoji="🗣️" label="Speaking" completed={completedByType.speaking} total={LESSON_COUNTS.speaking} colorClass="text-orange-600" barClass="bg-orange-400" />
          <SkillBar emoji="📖" label="Reading" completed={completedByType.reading} total={LESSON_COUNTS.reading} colorClass="text-green-600" barClass="bg-green-400" />
          <SkillBar emoji="✍️" label="Writing" completed={completedByType.writing} total={LESSON_COUNTS.writing} colorClass="text-amber-600" barClass="bg-amber-400" />
        </div>
      </div>

      {/* Activity Calendar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <ActivityCalendar progress={progress} />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">Recent Activity</h2>
          <Link href="/lessons" className="text-sm text-blue-600 font-medium hover:underline">
            Browse lessons →
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap mb-5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === f.key
                  ? `${f.bg} ${f.color}`
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {f.emoji} {f.label}
            </button>
          ))}
        </div>

        {recentLessons.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">📖</div>
            <h3 className="font-bold text-gray-700 mb-2">
              {filter === 'all' ? 'No lessons completed yet' : `No ${filter} lessons yet`}
            </h3>
            <p className="text-gray-400 text-sm mb-4">Start practising to see your progress here!</p>
            <Link
              href="/lessons"
              className="inline-block px-6 py-2.5 bg-gradient-to-r from-blue-500 to-violet-500 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-sm"
            >
              Browse Lessons
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentLessons.map((p, i) => {
              const type = getLessonType(p.lessonId);
              const title = getLessonTitle(p.lessonId);
              const href =
                type === 'shadowing' ? `/shadowing/${p.lessonId}` :
                type === 'speaking' ? `/speaking/${p.lessonId}` :
                type === 'reading' ? `/reading/${p.lessonId}` :
                type === 'writing' ? `/writing/${p.lessonId}` :
                `/dictation/${p.lessonId}`;

              const typeStyle = FILTERS.find((f) => f.key === type);

              return (
                <Link
                  key={i}
                  href={href}
                  className="flex items-center justify-between p-3.5 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${typeStyle?.bg || 'bg-gray-100'}`}>
                      {typeStyle?.emoji || '📋'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 text-sm group-hover:text-blue-600 transition-colors truncate">{title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                        <span>{formatDate(p.completedAt)}</span>
                        {p.score !== undefined && (
                          <span className={`font-semibold ${
                            p.score >= 80 ? 'text-emerald-600' :
                            p.score >= 50 ? 'text-amber-600' :
                            'text-red-500'
                          }`}>
                            {p.score}%
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 flex-shrink-0">
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
