'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { fetchCompletedIds } from '@/lib/progress';
import { getTopicLabel, fetchTopics, loadTopics, type Topic } from '@/lib/topics';
import { fetchLevels, loadLevels, getLevelLabel, type Level } from '@/lib/levels';
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
      .select('id, title, level, topic, duration_minutes')
      .order('created_at', { ascending: true }),
  ]);

  const shadowing = ((lessonData ?? []) as Record<string, unknown>[]).map((r) => ({
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

  const reading = ((readingData ?? []) as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    title: String(r.title),
    level: String(r.level),
    topic: String(r.topic),
    type: 'reading',
    image: r.image_url ? String(r.image_url) : undefined,
    durationMinutes: Number(r.duration_minutes) || 10,
  }));

  const writing = ((writingData ?? []) as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    title: String(r.title),
    level: String(r.level),
    topic: String(r.topic),
    type: 'writing',
    durationMinutes: Number(r.duration_minutes) || 10,
  }));

  return [...shadowing, ...reading, ...writing];
}

/* ─── Skill tab config ───────────────────────────────────────────────────── */
const SKILL_TABS = [
  { id: 'all',       label: 'Tất cả',   emoji: '📚' },
  { id: 'shadowing', label: 'Shadowing', emoji: '🎧' },
  { id: 'dictation', label: 'Dictation', emoji: '✏️' },
  { id: 'speaking',  label: 'Speaking',  emoji: '🗣️' },
  { id: 'reading',   label: 'Reading',   emoji: '📖' },
  { id: 'writing',   label: 'Writing',   emoji: '✍️' },
];

/* ─── Deterministic decorative mini-wave ────────────────────────────────── */
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

  const [skillFilter,  setSkillFilter]  = useState(initialType);
  const [levelFilter,  setLevelFilter]  = useState('all');
  const [topicFilter,  setTopicFilter]  = useState(searchParams.get('topic') || 'all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [allLessons, setAllLessons] = useState<Lesson[]>(STATIC_LESSONS);
  const [levels, setLevels] = useState<Level[]>(loadLevels());
  const [topics, setTopics] = useState<Topic[]>(loadTopics());
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
    fetchCompletedIds().then(setCompletedIds);
    fetchTopics().then(setTopics);
    fetchLevels().then(setLevels);
    fetchDynamicLessons().then((dynamic) => {
      const staticSds = STATIC_LESSONS.filter((l) => ['shadowing', 'dictation', 'speaking'].includes(l.type));
      const staticSdsIds = new Set(staticSds.map((l) => l.id));
      const dynamicSds = dynamic
        .filter((l) => ['shadowing', 'dictation', 'speaking'].includes(l.type))
        .filter((l) => !staticSdsIds.has(l.id));

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
  }, [skillFilter, levelFilter, topicFilter, statusFilter, searchQuery]);

  const filtered = useMemo(() => allLessons.filter((l) => {
    if (skillFilter !== 'all'  && l.type  !== skillFilter)  return false;
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
  }), [allLessons, skillFilter, levelFilter, topicFilter, statusFilter, completedIds, searchQuery]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const activeFilterCount = [
    levelFilter !== 'all',
    topicFilter !== 'all',
    statusFilter !== 'all',
  ].filter(Boolean).length;

  function resetAllFilters() {
    setSkillFilter('all');
    setLevelFilter('all');
    setTopicFilter('all');
    setStatusFilter('all');
    setSearchQuery('');
  }

  return (
    <div className="ss-lessons">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="ss-lessons-head">
        <div>
          <span className="ss-section-num">§ Thư viện bài học</span>
          <h1 className="ss-h1 sm">
            Hôm nay học <em>kỹ năng gì?</em>
          </h1>
          <p className="ss-section-sub">
            {allLessons.length} bài học
            {completedIds.length > 0 && ` · ${completedIds.length} đã hoàn thành`}
          </p>
        </div>

        <div className="ss-lessons-search">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <circle cx="6" cy="6" r="4" />
            <path d="M9 9 L12 12" />
          </svg>
          <input
            ref={searchRef}
            placeholder="Tìm bài học…"
            aria-label="Tìm bài học"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Xoá tìm kiếm"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--muted)', lineHeight: 1 }}
            >
              ✕
            </button>
          ) : (
            <kbd>⌘ K</kbd>
          )}
        </div>
      </header>

      {/* ── Skill Tabs (Primary Filter) ─────────────────────────────────────── */}
      <div className="ss-skill-tabs" role="tablist" aria-label="Chọn kỹ năng">
        {SKILL_TABS.map((tab) => {
          const count = tab.id === 'all'
            ? allLessons.length
            : allLessons.filter((l) => l.type === tab.id).length;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={skillFilter === tab.id}
              className={'ss-skill-tab' + (skillFilter === tab.id ? ' on' : '')}
              onClick={() => setSkillFilter(tab.id)}
            >
              <span className="ss-skill-tab-emoji" aria-hidden="true">{tab.emoji}</span>
              <span className="ss-skill-tab-label">{tab.label}</span>
              <span className="ss-skill-tab-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* ── Lớp Filter ─────────────────────────────────────────────────────── */}
      <div className="ss-lop-row">
        <span className="ss-filter-label">Lớp</span>
        <button
          className={'ss-chip-btn' + (levelFilter === 'all' ? ' on' : '')}
          onClick={() => setLevelFilter('all')}
        >
          Tất cả
        </button>
        {levels.map((lv) => (
          <button
            key={lv.id}
            className={'ss-chip-btn' + (levelFilter === lv.id ? ' on' : '')}
            onClick={() => setLevelFilter(lv.id)}
          >
            {lv.label}
          </button>
        ))}
      </div>

      {/* ── Advanced Filter Toggle ──────────────────────────────────────────── */}
      <div className="ss-advanced-row">
        <button
          className={'ss-advanced-toggle' + (showAdvanced ? ' open' : '')}
          onClick={() => setShowAdvanced((v) => !v)}
          aria-expanded={showAdvanced}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <circle cx="3" cy="4" r="1.2" /><line x1="3" y1="4" x2="3" y2="1" /><line x1="3" y1="5.2" x2="3" y2="13" />
            <circle cx="7" cy="8" r="1.2" /><line x1="7" y1="8" x2="7" y2="1" /><line x1="7" y1="9.2" x2="7" y2="13" />
            <circle cx="11" cy="5" r="1.2" /><line x1="11" y1="5" x2="11" y2="1" /><line x1="11" y1="6.2" x2="11" y2="13" />
          </svg>
          Bộ lọc nâng cao
          {activeFilterCount > 0 && (
            <span className="ss-adv-badge">{activeFilterCount}</span>
          )}
          <svg
            width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
            style={{ marginLeft: 'auto', transition: 'transform 0.2s', transform: showAdvanced ? 'rotate(180deg)' : 'none' }}
            aria-hidden="true"
          >
            <path d="M2 3.5 L5 6.5 L8 3.5" />
          </svg>
        </button>

        {showAdvanced && (
          <div className="ss-advanced-panel">
            {/* Topic */}
            <div className="ss-filter-row">
              <span className="ss-filter-label">Chủ đề</span>
              <button
                className={'ss-chip-btn' + (topicFilter === 'all' ? ' on' : '')}
                onClick={() => setTopicFilter('all')}
              >
                Tất cả
              </button>
              {topics.map((t) => (
                <button
                  key={t.id}
                  className={'ss-chip-btn' + (topicFilter === t.id ? ' on' : '')}
                  onClick={() => setTopicFilter(t.id)}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>

            {/* Status */}
            <div className="ss-filter-row">
              <span className="ss-filter-label">Trạng thái</span>
              {(['all', 'new', 'completed'] as const).map((f) => (
                <button
                  key={f}
                  className={'ss-chip-btn' + (statusFilter === f ? ' on' : '')}
                  onClick={() => setStatusFilter(f)}
                >
                  {f === 'all' ? 'Tất cả' : f === 'new' ? 'Chưa học' : '✓ Đã xong'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Results count ───────────────────────────────────────────────────── */}
      <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16, fontFamily: 'var(--ff-mono)' }}>
        {filtered.length} bài{filtered.length !== 1 ? '' : ''}
        {totalPages > 1 && ` — trang ${page}/${totalPages}`}
      </p>

      {/* ── Lesson Grid ─────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '64px var(--pad)',
          background: 'var(--surface)',
          border: '1px solid color-mix(in oklab, var(--ink), transparent 90%)',
          borderRadius: 'var(--r-lg)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <p style={{ fontFamily: 'var(--ff-display)', fontStyle: 'var(--display-style)', fontSize: 22, margin: '0 0 8px', color: 'var(--ink)' }}>
            Không tìm thấy bài học
          </p>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
            Thử bỏ bớt bộ lọc để xem thêm bài.
          </p>
          <button
            onClick={resetAllFilters}
            className="ss-btn-ghost"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            ↺ Xem tất cả bài học
          </button>
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
                    ? <span className="ss-lesson-badge done">✓ Xong</span>
                    : globalIdx < 3 && <span className="ss-lesson-badge new">MỚI</span>
                  }
                </div>

                {/* Title */}
                <h3 className="ss-lesson-title">{lesson.title}</h3>

                {/* Mini-wave decoration */}
                <MiniWave seed={globalIdx} />

                {/* Foot meta */}
                <div className="ss-lesson-foot">
                  <span><b>{getLevelLabel(lesson.level)}</b></span>
                  <span>{lesson.durationMinutes} phút</span>
                  <span style={{ textTransform: 'capitalize' }}>{lesson.type}</span>
                  <span>{getTopicLabel(lesson.topic)}</span>
                </div>

                {/* CTA row */}
                <div className="ss-lesson-cta">
                  <span>Vào học</span>
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
            ← Trước
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
            Sau →
          </button>
        </div>
      )}
    </div>
  );
}
