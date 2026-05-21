import { Suspense } from 'react';
import LessonsContent from './LessonsContent';

function LessonsSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
      {/* Header */}
      <div className="h-28 bg-gradient-to-r from-blue-200 to-violet-200 rounded-2xl mb-8" />

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-8 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i}>
            <div className="h-3 w-12 bg-gray-200 rounded mb-2" />
            <div className="flex gap-2">
              {[...Array(i === 1 ? 4 : i === 2 ? 6 : 3)].map((_, j) => (
                <div key={j} className="h-8 w-20 bg-gray-100 rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-36 bg-gray-200" />
            <div className="p-5">
              <div className="flex gap-2 mb-3">
                <div className="h-5 w-16 bg-gray-200 rounded-full" />
                <div className="h-5 w-20 bg-gray-200 rounded-full" />
              </div>
              <div className="h-5 bg-gray-200 rounded-lg mb-2 w-3/4" />
              <div className="h-4 bg-gray-100 rounded-lg w-1/3 mb-4" />
              <div className="flex justify-between">
                <div className="h-3 w-10 bg-gray-100 rounded" />
                <div className="h-3 w-12 bg-gray-100 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LessonsPage() {
  return (
    <Suspense fallback={<LessonsSkeleton />}>
      <LessonsContent />
    </Suspense>
  );
}
