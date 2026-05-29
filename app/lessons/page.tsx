import { Suspense } from 'react';
import LessonsContent from './LessonsContent';

function LessonsSkeleton() {
  return (
    <div className="ss-lessons" style={{ animation: 'ss-pulse 1.6s ease-in-out infinite' }}>
      {/* Header skeleton */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ height: 12, width: 60, background: 'color-mix(in oklab, var(--ink), transparent 88%)', borderRadius: 4, marginBottom: 16 }} />
        <div style={{ height: 56, width: '60%', background: 'color-mix(in oklab, var(--ink), transparent 90%)', borderRadius: 8, marginBottom: 12 }} />
        <div style={{ height: 16, width: '40%', background: 'color-mix(in oklab, var(--ink), transparent 92%)', borderRadius: 4 }} />
      </div>

      {/* Filters skeleton */}
      <div className="ss-filters">
        {[4, 5, 4, 3].map((count, row) => (
          <div key={row} className="ss-filter-row">
            <div style={{ width: 50, height: 10, background: 'color-mix(in oklab, var(--ink), transparent 88%)', borderRadius: 3 }} />
            {Array.from({ length: count }, (_, j) => (
              <div key={j} style={{ height: 34, width: 64 + j * 8, background: 'color-mix(in oklab, var(--ink), transparent 92%)', borderRadius: 999 }} />
            ))}
          </div>
        ))}
      </div>

      {/* Cards skeleton */}
      <div className="ss-lessons-grid" style={{ marginTop: 28 }}>
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className="ss-lesson-card" style={{ pointerEvents: 'none' }}>
            <div style={{ height: 12, width: 28, background: 'color-mix(in oklab, var(--ink), transparent 88%)', borderRadius: 3 }} />
            <div style={{ height: 28, width: '75%', background: 'color-mix(in oklab, var(--ink), transparent 90%)', borderRadius: 6 }} />
            <div style={{ height: 32, background: 'color-mix(in oklab, var(--ink), transparent 92%)', borderRadius: 4 }} />
            <div style={{ height: 12, width: '50%', background: 'color-mix(in oklab, var(--ink), transparent 92%)', borderRadius: 3 }} />
          </div>
        ))}
      </div>

      <style>{`@keyframes ss-pulse { 0%,100%{opacity:1} 50%{opacity:.55} }`}</style>
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
