'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getCompletedIds } from '@/lib/progress';
import { getTopicLabel, loadTopics } from '@/lib/topics';
import { getLevelColor, loadLevels } from '@/lib/levels';
import shadowingLessons from '@/data/shadowing-lessons.json';
import dictationLessons from '@/data/dictation-lessons.json';
import speakingLessons from '@/data/speaking-lessons.json';
import readingLessons from '@/data/reading-lessons.json';
import writingLessons from '@/data/writing-lessons.json';

type Lesson = {
  id: string;
  title: string;
  level: string;
  topic: string;
  type: string;
  image?: string;
  durationMinutes: number;
  transcript?: string;
  subtype?: string;
};

const allLessons: Lesson[] = [
  ...(shadowingLessons as Lesson[]),
  ...(dictationLessons as Lesson[]),
  ...(speakingLessons as Lesson[]),
  ...(readingLessons as Lesson[]),
  ...(writingLessons as Lesson[]),
];

const TYPE_COLORS: Record<string, string> = {
  shadowing: 'bg-cyan-100 text-cyan-700',
  dictation: 'bg-violet-100 text-violet-700',
  speaking: 'bg-orange-100 text-orange-700',
  reading: 'bg-green-100 text-green-700',
  writing: 'bg-amber-100 text-amber-700',
};

const PAGE_SIZE = 12;

export default function LessonsContent() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') || 'all';

  const [typeFilter, setTypeFilter] = useState(initialType);
  const [levelFilter, setLevelFilter] = useState('all');
  const [topicFilter, setTopicFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setCompletedIds(getCompletedIds());
  }, []);

  useEffect(() => {
    setPage(1);
  }, [typeFilter, levelFilter, topicFilter, statusFilter]);

  const filtered = allLessons.filter((l) => {
    if (typeFilter !== 'all' && l.type !== typeFilter) return false;
    if (levelFilter !== 'all' && l.level !== levelFilter) return false;
    if (topicFilter !== 'all' && l.topic !== topicFilter) return false;
    if (statusFilter === 'completed' && !completedIds.includes(l.id)) return false;
    if (statusFilter === 'new' && completedIds.includes(l.id)) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const typeFilters = ['all', 'shadowing', 'dictation', 'speaking', 'reading', 'writing'];
  const levelFilters = ['all', ...loadLevels().map((l) => l.id)];
  const topicFilters = ['all', ...loadTopics().map((t) => t.id)];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-violet-600 rounded-2xl p-8 mb-8 text-white">
        <h1 className="text-3xl font-black mb-2">Practice Lessons</h1>
        <p className="text-blue-100">Choose a lesson and start practising your English</p>
        <p className="text-sm mt-2 text-blue-200">
          {allLessons.length} lessons available &bull; {completedIds.length} completed
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-8 space-y-4">
        {/* Type filter */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Type</p>
          <div className="flex flex-wrap gap-2">
            {typeFilters.map((f) => (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                  typeFilter === f
                    ? 'bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? 'All Types' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Level filter */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Level</p>
          <div className="flex flex-wrap gap-2">
            {levelFilters.map((f) => (
              <button
                key={f}
                onClick={() => setLevelFilter(f)}
                className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                  levelFilter === f
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? 'All Levels' : f}
              </button>
            ))}
          </div>
        </div>

        {/* Topic filter */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Topic</p>
          <div className="flex flex-wrap gap-2">
            {topicFilters.map((f) => (
              <button
                key={f}
                onClick={() => setTopicFilter(f)}
                className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                  topicFilter === f
                    ? 'bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? 'All Topics' : getTopicLabel(f)}
              </button>
            ))}
          </div>
        </div>

        {/* Status filter */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Status</p>
          <div className="flex flex-wrap gap-2">
            {(['all', 'new', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                  statusFilter === f
                    ? 'bg-gradient-to-r from-gray-600 to-gray-800 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? '📚 All' : f === 'new' ? '🆕 New' : '✅ Completed'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-4 font-medium">
        {filtered.length} lesson{filtered.length !== 1 ? 's' : ''} found
        {totalPages > 1 && (
          <span className="text-gray-400"> — page {page} of {totalPages}</span>
        )}
      </p>

      {/* Lesson cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-lg font-bold text-gray-700 mb-2">No lessons found</h3>
          <p className="text-gray-400">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {paginated.map((lesson) => {
            const completed = completedIds.includes(lesson.id);
            const href = lesson.type === 'shadowing'
              ? `/shadowing/${lesson.id}`
              : lesson.type === 'speaking'
              ? `/speaking/${lesson.id}`
              : lesson.type === 'reading'
              ? `/reading/${lesson.id}`
              : lesson.type === 'writing'
              ? `/writing/${lesson.id}`
              : `/dictation/${lesson.id}`;

            return (
              <Link
                key={lesson.id}
                href={href}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 overflow-hidden group"
              >
                {/* Image (shadowing lessons) */}
                {lesson.image && (
                  <div className="relative h-36 overflow-hidden bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={lesson.image}
                      alt={lesson.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {completed && (
                      <div className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Completed
                      </div>
                    )}
                  </div>
                )}

                <div className="p-5">
                  {/* Badges */}
                  <div className="flex items-center flex-wrap gap-2 mb-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${getLevelColor(lesson.level)}`}>
                      {lesson.level}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${TYPE_COLORS[lesson.type] || 'bg-gray-100 text-gray-600'}`}>
                      {lesson.type === 'shadowing' ? '🎧 Shadowing'
                      : lesson.type === 'speaking' ? '🗣️ Speaking'
                      : lesson.type === 'reading'  ? '📖 Reading'
                      : lesson.type === 'writing'  ? '✍️ Writing'
                      : '✏️ Dictation'}
                    </span>
                    {lesson.subtype && (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">
                        {lesson.subtype}
                      </span>
                    )}
                    {!lesson.image && completed && (
                      <span className="ml-auto bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Done
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-gray-800 text-lg mb-1 group-hover:text-blue-600 transition-colors">
                    {lesson.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-3">
                    {getTopicLabel(lesson.topic)}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {lesson.durationMinutes} min
                    </span>
                    <span className="text-xs font-semibold text-blue-600 group-hover:text-violet-600 transition-colors">
                      Start →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Prev
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              const isActive = p === page;
              const showDot =
                totalPages > 5 &&
                p !== 1 &&
                p !== totalPages &&
                Math.abs(p - page) > 1;
              if (showDot && (p === page - 2 || p === page + 2)) {
                return <span key={p} className="px-1 text-gray-400 text-sm">…</span>;
              }
              if (showDot) return null;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-sm'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            Next
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
