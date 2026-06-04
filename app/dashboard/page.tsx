'use client';

import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { getUser, User } from '@/lib/auth';
import { getProgress, getStreak, getTotalMinutes, LessonProgress } from '@/lib/progress';
import shadowingLessons from '@/data/shadowing-lessons.json';
import dictationLessons from '@/data/dictation-lessons.json';
import readingLessons from '@/data/reading-lessons.json';
import speakingLessons from '@/data/speaking-lessons.json';
import writingLessons from '@/data/writing-lessons.json';

/* ─── Types ──────────────────────────────────────────────────────────────── */
type AnyLesson = { id: string; title: string; level: string; topic: string; type: string; durationMinutes?: number; transcript?: string; chunks?: string[] };

/* ─── Topic config ───────────────────────────────────────────────────────── */
const TOPIC_CFG: Record<string, { label: string; emoji: string; cat: string; level: string }> = {
  'school':        { label: 'School & learning',       emoji: '📚', cat: 'coral',  level: 'A2' },
  'hobbies':       { label: 'Hobbies & interests',     emoji: '🎨', cat: 'sky',    level: 'A2' },
  'family':        { label: 'Family & relationships',  emoji: '👨‍👩‍👧', cat: 'violet', level: 'B1' },
  'food':          { label: 'Food & eating out',       emoji: '🍽️', cat: 'amber',  level: 'A2' },
  'daily routine': { label: 'Daily life & routines',   emoji: '⏰', cat: 'mint',   level: 'B1' },
};

const CAT_COLORS: Record<string, { bg: string; fg: string }> = {
  coral:  { bg: 'var(--coral-t)',  fg: 'var(--coral)'  },
  sky:    { bg: 'var(--sky-t)',    fg: 'var(--sky)'    },
  violet: { bg: 'var(--violet-t)', fg: 'var(--violet)' },
  amber:  { bg: 'var(--amber-t)',  fg: 'var(--amber)'  },
  mint:   { bg: 'var(--mint-t)',   fg: 'var(--mint)'   },
  rose:   { bg: 'var(--rose-t)',   fg: 'var(--rose)'   },
};

/* ─── All lessons combined ───────────────────────────────────────────────── */
const ALL_LESSONS = [
  ...(shadowingLessons as AnyLesson[]),
  ...(dictationLessons as AnyLesson[]),
  ...(readingLessons as AnyLesson[]),
  ...(speakingLessons as AnyLesson[]),
  ...(writingLessons as AnyLesson[]),
];

/* ─── Vocab words extracted from lesson notes/transcripts ───────────────── */
const VOCAB_SAMPLES = [
  { w: 'subject',    phon: '/ˈsʌbdʒɪkt/',  pos: 'noun',    m: 'area of study at school',   cat: 'coral' },
  { w: 'routine',    phon: '/ruːˈtiːn/',    pos: 'noun',    m: 'regular sequence of actions', cat: 'mint'  },
  { w: 'together',   phon: '/təˈgɛðər/',   pos: 'adverb',  m: 'with another person',        cat: 'sky'   },
  { w: 'favourite',  phon: '/ˈfeɪvərɪt/',  pos: 'adjective', m: 'most liked above all others', cat: 'violet'},
];

/* ─── Weekly bar data ────────────────────────────────────────────────────── */
function buildWeekBars(progress: LessonProgress[]) {
  const today = new Date();
  const bars = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const mins = progress
      .filter((p) => p.completedAt.startsWith(key))
      .reduce((sum, p) => sum + Math.round(p.timeSpent / 60), 0);
    bars.push({ d: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()], v: mins, today: i === 0 });
  }
  return bars;
}

/* ─── Today's greeting ───────────────────────────────────────────────────── */
function greeting(name: string | undefined) {
  const h = new Date().getHours();
  const time = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  const display = name?.split(' ')[0] ?? 'there';
  return `Good ${time}, ${display}.`;
}

function todayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

/* ─── ContinueCard ───────────────────────────────────────────────────────── */
function ContinueCard({ progress, lessons }: { progress: LessonProgress[]; lessons: AnyLesson[] }) {
  const completedIds = new Set(progress.map((p) => p.lessonId));
  const nextLesson = lessons.find((l) => !completedIds.has(l.id)) ?? lessons[0];
  const topic = nextLesson?.topic ?? 'school';
  const cfg = TOPIC_CFG[topic] ?? TOPIC_CFG.school;
  const topicLessons = lessons.filter((l) => l.topic === topic);
  const donePct = topicLessons.length
    ? Math.round((topicLessons.filter((l) => completedIds.has(l.id)).length / topicLessons.length) * 100)
    : 0;
  const lessonNum = topicLessons.findIndex((l) => l.id === nextLesson?.id) + 1;

  if (!nextLesson) return null;

  const href = nextLesson.type === 'shadowing'
    ? `/shadowing/${nextLesson.id}`
    : nextLesson.type === 'dictation'
    ? `/dictation/${nextLesson.id}`
    : `/lessons`;

  return (
    <div className="continue">
      <div className="ct-top">
        <span className="ct-emoji">{cfg.emoji}</span>
        <span className="ct-tag">Continue · Lesson {lessonNum}</span>
      </div>
      <div>
        <h2>{nextLesson.title}</h2>
        <div className="ct-meta">
          {cfg.level} · {nextLesson.durationMinutes ?? 5} min · {nextLesson.type}
        </div>
      </div>
      <div className="ct-foot">
        <div className="ct-prog">
          <div className="bar"><i style={{ width: `${Math.max(4, donePct)}%` }} /></div>
          <div className="lbl">{donePct}% of {cfg.label}</div>
        </div>
        <Link href={href} className="btn-white">
          Resume ▸
        </Link>
      </div>
    </div>
  );
}

/* ─── CourseCard ─────────────────────────────────────────────────────────── */
function CourseCard({ topic, cfg, lessons, completedIds }: {
  topic: string;
  cfg: typeof TOPIC_CFG[string];
  lessons: AnyLesson[];
  completedIds: Set<string>;
}) {
  const done = lessons.filter((l) => completedIds.has(l.id)).length;
  const pct = lessons.length ? Math.round((done / lessons.length) * 100) : 0;
  const colors = CAT_COLORS[cfg.cat] ?? CAT_COLORS.coral;

  return (
    <Link
      href={`/lessons?topic=${encodeURIComponent(topic)}`}
      className="course"
      style={{ '--ct': colors.bg, '--cc': colors.fg } as React.CSSProperties}
    >
      <div className="course-top">
        <span className="course-emoji">{cfg.emoji}</span>
        <span className="course-level">{cfg.level}</span>
      </div>
      <div>
        <h4>{cfg.label}</h4>
        <div className="c-meta">{done}/{lessons.length} lessons</div>
      </div>
      <div className="course-foot">
        <div className="pbar"><i style={{ width: `${Math.max(4, pct)}%` }} /></div>
        <span className="ppct">{pct}%</span>
      </div>
    </Link>
  );
}

/* ─── WeekPanel ──────────────────────────────────────────────────────────── */
function WeekPanel({ progress }: { progress: LessonProgress[] }) {
  const bars = useMemo(() => buildWeekBars(progress), [progress]);
  const totalMins = useMemo(() => bars.reduce((s, b) => s + b.v, 0), [bars]);
  const maxV = Math.max(...bars.map((b) => b.v), 1);

  return (
    <div className="panel">
      <div className="panel-h">
        <h4>This week</h4>
        <span className="total">{totalMins} min</span>
      </div>
      <div className="bars">
        {bars.map((b, i) => (
          <div key={i} className={`b${b.today ? ' today' : ''}`}>
            <div className="col" style={{ height: `${Math.max(8, (b.v / maxV) * 100)}%` }} />
            <div className="d">{b.d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── StreakPanel ────────────────────────────────────────────────────────── */
function StreakPanel({ streak }: { streak: number }) {
  const today = new Date();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({ label: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()], isToday: i === 0, active: i < streak });
  }

  return (
    <div className="panel">
      <div className="panel-h">
        <h4>Streak</h4>
        <span className="total">🔥 Keep it up</span>
      </div>
      <div className="streak-cal">
        <div className="streak-big">
          <b>{streak}</b>
          <span>{streak === 1 ? 'day in a row' : 'days in a row'} 🔥</span>
        </div>
        <div className="streak-dots">
          {days.map((d, i) => (
            <div key={i} className={`dd${d.isToday ? ' today' : d.active ? ' on' : ''}`}>{d.label}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setUser(getUser());
    setProgress(getProgress());
    setStreak(getStreak());
  }, []);

  const completedIds = useMemo(() => new Set(progress.map((p) => p.lessonId)), [progress]);

  const courses = useMemo(() =>
    Object.entries(TOPIC_CFG).map(([topic, cfg]) => ({
      topic,
      cfg,
      lessons: ALL_LESSONS.filter((l) => l.topic === topic),
    })),
  []);

  const todayPlan = [
    { label: 'Warm-up', cat: 'mint' as const,   done: progress.length > 0 },
    { label: 'New lesson', cat: 'coral' as const,  done: false },
    { label: 'Review words', cat: 'violet' as const, done: false },
  ];

  const totalMinutes = useMemo(() => getTotalMinutes(), []);

  return (
    <main className="dash">
      {/* ── Today section ── */}
      <section className="today">
        <div className="today-intro">
          <div className="today-date">{todayLabel()}</div>
          <h1 className="today-h1">
            {greeting(user?.name)}<br />
            Ready for <em>five minutes?</em>
          </h1>
          <div className="today-plan">
            {todayPlan.map((p, i) => (
              <span key={i} className={`plan-chip${p.done ? ' done' : ''}`}>
                {p.done
                  ? <span className="check">✓</span>
                  : <span className="dot" style={{ background: `var(--${p.cat})` }} />}
                <span className="label">{p.label}</span>
              </span>
            ))}
          </div>
        </div>
        <ContinueCard progress={progress} lessons={ALL_LESSONS} />
      </section>

      {/* ── Courses ── */}
      <section>
        <div className="sec-head">
          <h3>Your courses</h3>
          <span className="sub">Pick up where you left off</span>
          <Link href="/lessons" className="more">Browse all →</Link>
        </div>
        <div className="courses">
          {courses.map(({ topic, cfg, lessons }) => (
            <CourseCard key={topic} topic={topic} cfg={cfg} lessons={lessons} completedIds={completedIds} />
          ))}
        </div>
      </section>

      {/* ── Vocab ── */}
      <section>
        <div className="sec-head">
          <h3>Words you&rsquo;re learning</h3>
          <span className="sub">From your recent sessions</span>
          <Link href="/lessons" className="more">Open deck →</Link>
        </div>
        <div className="vocab-row">
          {VOCAB_SAMPLES.map((v, i) => (
            <div key={i} className="vcard" style={{ '--vc': `var(--${v.cat})` } as React.CSSProperties}>
              <div className="vw">{v.w}</div>
              <div className="vp">{v.phon}</div>
              <div className="vpos">{v.pos}</div>
              <div className="vm">{v.m}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="week">
        <WeekPanel progress={progress} />
        <StreakPanel streak={streak} />
      </section>

      {/* ── Empty state for new users ── */}
      {progress.length === 0 && (
        <section style={{ textAlign: 'center', padding: '20px 0 0' }}>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 16 }}>
            No lessons completed yet. Start your first lesson to track progress here.
          </p>
          <Link href="/lessons" className="btn">
            Browse lessons →
          </Link>
        </section>
      )}

      {/* ── Total minutes stat ── */}
      {totalMinutes > 0 && (
        <section style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '14px 24px', borderRadius: 999, background: 'var(--card)', boxShadow: 'inset 0 0 0 1px var(--line)', fontSize: 14, fontWeight: 600, color: 'var(--muted)' }}>
            <span style={{ fontSize: 22, fontFamily: 'var(--ff-display)', fontWeight: 700, color: 'var(--accent)' }}>{totalMinutes}</span>
            minutes practised in total
          </div>
        </section>
      )}
    </main>
  );
}
