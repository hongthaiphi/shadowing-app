'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getCompletedIds } from '@/lib/progress';
import { getTopicLabel, loadTopics } from '@/lib/topics';
import { loadLevels } from '@/lib/levels';
import { getSupabase } from '@/lib/supabase';
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

const STATIC_LESSONS: Lesson[] = [
  ...(shadowingLessons as Lesson[]),
  ...(dictationLessons as Lesson[]),
  ...(speakingLessons as Lesson[]),
  ...(readingLessons as Lesson[]),
  ...(writingLessons as Lesson[]),
];

async function fetchDynamicLessons(): Promise<Lesson[]> {
  const supabase = getSupabase();
  const [{ data: lessonData }, { data: readingData }, { data: writingData }] = await Promise.all([
    supabase
      .from('lessons')
      .select('id, title, level, topic, type, image_url, duration_minutes, transcript, subtype')
      .order('created_at', { ascending: true }),
    supabase
      .from('reading_lessons')
      .select('id, title, level, topic, image_url, duration_minutes')
      .order('created_at', { ascending: true }),
    supabase
      .from('writing_lessons')
      .select('id, title, level, topic, image_url, duration_minutes')
      .order('created_at', { ascending: true }),
  ]);

  const shadowing = (lessonData ?? []).map((r) => ({
    id: String(r.id),
    title: String(r.title),
    level: String(r.level),
    topic: String(r.topic),
    type: String(r.type),
    image: r.image_url ? String(r.image_url) : undefined,
    durationMinutes: Number(r.duration_minutes) || 5,
    transcript: r.transcript ? String(r.transcript) : undefined,
    subtype: r.subtype ? String(r.subtype) : undefined,
  }));

  const reading = (readingData ?? []).map((r) => ({
    id: String(r.id),
    title: String(r.title),
    level: String(r.level),
    topic: String(r.topic),
    type: 'reading',
    image: r.image_url ? String(r.image_url) : undefined,
    durationMinutes: Number(r.duration_minutes) || 10,
  }));

  const writing = (writingData ?? []).map((r) => ({
    id: String(r.id),
    title: String(r.title),
    level: String(r.level),
    topic: String(r.topic),
    type: 'writing',
    image: r.image_url ? String(r.image_url) : undefined,
    durationMinutes: Number(r.duration_minutes) || 10,
  }));

  return [...shadowing, ...reading, ...writing];
}

/* Deterministic decorative mini-wave (seed-based, SSR-safe) */
function MiniWave({ seed = 0 }: { seed?: number }) {
  const bars = useMemo(() =>
    Array.from({ length: 42 }, (_, i) => {
      const x = i / 42;
      return Math.max(0.15, Math.min(1, 0.55 + Math.sin(x * 9 + seed) * 0.35 + Math.cos(x * 17 + seed * 2) * 0.2));
    }),
    [seed]
  );
  return (
    <div className="ss-mini-wave" aria-hidden="true">
      {bars.map((h, i) => (
        <span key={i} style={{ height: `${h * 100}%`, opacity: 0.35 + h * 0.5 }} />
      ))}
    </div>
  );
}

const TYPE_LABELS: Record<string, string> = {
  shadowing: 'Shadowing',
  dictation: 'Dictation',
  speaking:  'Speaking',
  reading:   'Reading',
  writing:   'Writing',
};

const PAGE_SIZE = 12;

function lessonHref(lesson: Lesson): string {
  switch (lesson.type) {
    case 'shadowing': return `/shadowing/${lesson.id}`;
    case 'speaking':  return `/speaking/${lesson.id}`;
    case 'reading':   return `/reading/${lesson.id}`;
    case 'writing':   return `/writing/${lesson.id}`;
    default:          return `/dictation/${lesson.id}`;
  }
}

export default function LessonsContent() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') || 'all';

  const [typeFilter,   setTypeFilter]   = useState(initialType);
  const [levelFilter,  setLevelFilter]  = useState('all');
  const [topicFilter,  setTopicFilter]  = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [allLessons, setAllLessons] = useState<Lesson[]>(STATIC_LESSONS);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    setCompletedIds(getCompletedIds());
    fetchDynamicLessons().then((dynamic) => {
      // Shadowing/dictation/speaking: static JSON + Supabase extras (no duplicates)
      const staticSds = STATIC_LESSONS.filter((l) => ['shadowing', 'dictation', 'speaking'].includes(l.type));
      const staticSdsIds = new Set(staticSds.map((l) => l.id));
      const dynamicSds = dynamic
        .filter((l) => ['shadowing', 'dictation', 'speaking'].includes(l.type))
        .filter((l) => !staticSdsIds.has(l.id));

      // Reading/writing: Supabase is the source of truth.
      // Fall back to static JSON only if Supabase returns nothing (table may not exist yet).
      const dynamicReading = dynamic.filter((l) => l.type === 'reading');
      const dynamicWriting = dynamic.filter((l) => l.type === 'writing');
      const staticReading  = STATIC_LESSONS.filter((l) => l.type === 'reading');
      const staticWriting  = STATIC_LESSONS.filter((l) => l.type === 'writing');

      setAllLessons([
        ...staticSds,
        ...dynamicSds,
        ...(dynamicReading.length > 0 ? dynamicReading : staticReading),
        ...(dynamicWriting.length > 0 ? dynamicWriting : staticWriting),
      ]);
    });
  }, []);

  useEffect(() => {
    setPage(1);
  }, [typeFilter, levelFilter, topicFilter, statusFilter, searchQuery]);

  const filtered = allLessons.filter((l) => {
    if (typeFilter !== 'all'  && l.type  !== typeFilter)  return false;
    if (levelFilter !== 'all' && l.level !== levelFilter) return false;
    if (topicFilter !== 'all' && l.topic !== topicFilter) return false;
    if (statusFilter === 'completed' && !completedIds.includes(l.id)) return false;
    if (statusFilter === 'new'       &&  completedIds.includes(l.id)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = l.title.toLowerCase().includes(q)
        || l.topic.toLowerCase().includes(q)
        || l.type.toLowerCase().includes(q)
        || (l.transcript ?? '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const typeFilters  = ['all', 'shadowing', 'dictation', 'speaking', 'reading', 'writing'];
  const levelFilters = ['all', ...loadLevels().map((l) => l.id)];
  const topicFilters = ['all', ...loadTopics().map((t) => t.id)];

  return (
    <div className="ss-lessons">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="ss-lessons-head">
        <div>
          <span className="ss-section-num">§ Library</span>
          <h1 className="ss-h1 sm">
            Pick your <em>five minutes.</em>
          </h1>
          <p className="ss-section-sub">
            {allLessons.length} lessons available
            {completedIds.length > 0 && ` · ${completedIds.length} completed`}
          </p>
        </div>

        <div className="ss-lessons-search">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <circle cx="6" cy="6" r="4" />
            <path d="M9 9 L12 12" />
          </svg>
          <input
            ref={searchRef}
            placeholder="Search lessons…"
            aria-label="Search lessons"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--muted)', lineHeight: 1 }}
            >
              ✕
            </button>
          ) : (
            <kbd>⌘ K</kbd>
          )}
        </div>
      </header>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="ss-filters">
        <div className="ss-filter-row">
          <span className="ss-filter-label">Type</span>
          {typeFilters.map((f) => (
            <button
              key={f}
              className={'ss-chip-btn' + (typeFilter === f ? ' on' : '')}
              onClick={() => setTypeFilter(f)}
            >
              {f === 'all' ? 'All' : TYPE_LABELS[f] ?? f}
            </button>
          ))}
        </div>

        <div className="ss-filter-row">
          <span className="ss-filter-label">Level</span>
          {levelFilters.map((f) => (
            <button
              key={f}
              className={'ss-chip-btn' + (levelFilter === f ? ' on' : '')}
              onClick={() => setLevelFilter(f)}
            >
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>

        <div className="ss-filter-row">
          <span className="ss-filter-label">Topic</span>
          {topicFilters.map((f) => (
            <button
              key={f}
              className={'ss-chip-btn' + (topicFilter === f ? ' on' : '')}
              onClick={() => setTopicFilter(f)}
            >
              {f === 'all' ? 'All' : getTopicLabel(f)}
            </button>
          ))}
        </div>

        <div className="ss-filter-row">
          <span className="ss-filter-label">Status</span>
          {(['all', 'new', 'completed'] as const).map((f) => (
            <button
              key={f}
              className={'ss-chip-btn' + (statusFilter === f ? ' on' : '')}
              onClick={() => setStatusFilter(f)}
            >
              {f === 'all' ? 'All' : f === 'new' ? 'Not started' : 'Completed'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Results ────────────────────────────────────────────────────────── */}
      <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16, fontFamily: 'var(--ff-mono)' }}>
        {filtered.length} lesson{filtered.length !== 1 ? 's' : ''}
        {totalPages > 1 && ` — page ${page} of ${totalPages}`}
      </p>

      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '80px var(--pad)',
          background: 'var(--surface)',
          border: '1px solid color-mix(in oklab, var(--ink), transparent 90%)',
          borderRadius: 'var(--r-lg)',
        }}>
          <p style={{ fontFamily: 'var(--ff-display)', fontStyle: 'var(--display-style)', fontSize: 28, margin: '0 0 8px' }}>
            Nothing here yet
          </p>
          <p style={{ color: 'var(--muted)', fontSize: 15 }}>Try widening your filters.</p>
        </div>
      ) : (
        <div className="ss-lessons-grid">
          {paginated.map((lesson, i) => {
            const done = completedIds.includes(lesson.id);
            const globalIdx = (page - 1) * PAGE_SIZE + i;
            const href = lessonHref(lesson);

            return (
              <Link key={lesson.id} href={href} className="ss-lesson-card">
                {/* Top row */}
                <div className="ss-lesson-top">
                  <span className="ss-lesson-num">{String(globalIdx + 1).padStart(2, '0')}</span>
                  {done
                    ? <span className="ss-lesson-badge done">✓ Done</span>
                    : globalIdx < 3 && <span className="ss-lesson-badge new">NEW</span>
                  }
                </div>

                {/* Title */}
                <h3 className="ss-lesson-title">{lesson.title}</h3>

                {/* Mini-wave decoration */}
                <MiniWave seed={globalIdx} />

                {/* Foot meta */}
                <div className="ss-lesson-foot">
                  <span><b>{lesson.level}</b></span>
                  <span>{lesson.durationMinutes} min</span>
                  <span style={{ textTransform: 'capitalize' }}>{lesson.type}</span>
                  <span>{getTopicLabel(lesson.topic)}</span>
                </div>

                {/* CTA row */}
                <div className="ss-lesson-cta">
                  <span>Open lesson</span>
                  <svg width="16" height="10" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M1 5 H14 M10 1 L14 5 L10 9" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ── Pagination ─────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 40 }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="ss-btn-ghost"
            style={{ opacity: page === 1 ? 0.4 : 1 }}
          >
            ← Prev
          </button>

          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              const isActive = p === page;
              const hide = totalPages > 5 && p !== 1 && p !== totalPages && Math.abs(p - page) > 1;
              const showEllipsis = hide && (p === page - 2 || p === page + 2);

              if (showEllipsis) return <span key={p} style={{ padding: '0 4px', color: 'var(--muted)', lineHeight: '36px' }}>…</span>;
              if (hide) return null;

              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    width: 36, height: 36, borderRadius: 8,
                    fontSize: 13, fontFamily: 'var(--ff-mono)',
                    background: isActive ? 'var(--ink)' : 'transparent',
                    color: isActive ? 'var(--bg)' : 'var(--muted)',
                    border: '1px solid color-mix(in oklab, var(--ink), transparent 88%)',
                  }}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="ss-btn-ghost"
            style={{ opacity: page === totalPages ? 0.4 : 1 }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
