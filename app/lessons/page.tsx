import { Suspense } from 'react';
import LessonsContent from './LessonsContent';

export default function LessonsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-2xl mb-8" />
          <div className="h-40 bg-gray-100 rounded-2xl mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-100 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    }>
      <LessonsContent />
    </Suspense>
  );
}
