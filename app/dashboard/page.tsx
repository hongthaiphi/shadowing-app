'use client';

import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, User } from '@/lib/auth';
import { getProgress, getStreak, getTotalMinutes, LessonProgress } from '@/lib/progress';
import { getLevelLabel } from '@/lib/levels';
import shadowingLessons from '@/data/shadowing-lessons.json';
import dictationLessons from '@/data/dictation-lessons.json';
import readingLessons from '@/data/reading-lessons.json';
import speakingLessons from '@/data/speaking-lessons.json';
import writingLessons from '@/data/writing-lessons.json';

/* ─── Types ──────────────────────────────────────────────────────────────── */
type AnyLesson = { id: string; title: string; level: string; topic: string; type: string; durationMinutes?: number; transcript?: string; chunks?: string[] };

/* ─── Topic config ───────────────────────────────────────────────────────── */
const TOPIC_CFG: Record<string, { label: string; emoji: string; cat: string }> = {
  'school':        { label: 'Trường học',         emoji: '📚', cat: 'coral'  },
  'hobbies':       { label: 'Sở thích',            emoji: '🎨', cat: 'sky'    },
  'family':        { label: 'Gia đình',             emoji: '👨‍👩‍👧', cat: 'violet' },
  'food':          { label: 'Ẩm thực',              emoji: '🍽️', cat: 'amber'  },
  'daily routine': { label: 'Cuộc sống hàng ngày', emoji: '⏰', cat: 'mint'   },
};

const CAT_COLORS: Record<string, { bg: string; fg: string }> = {
  coral:  { bg: 'var(--coral-t)',  fg: 'var(--coral)'  },
  sky:    { bg: 'var(--sky-t)',    fg: 'var(--sky)'    },
  violet: { bg: 'var(--violet-t)', fg: 'var(--violet)' },
  amber:  { bg: 'var(--amber-t)',  fg: 'var(--amber)'  },
  mint:   { bg: 'var(--mint-t)',   fg: 'var(--mint)'   },
};

/* ─── Skill config ───────────────────────────────────────────────────────── */
const SKILLS = [
  { id: 'shadowing', label: 'Shadowing',  emoji: '🎧', desc: 'Nghe và nhắc lại theo' },
  { id: 'dictation', label: 'Dictation',  emoji: '✏️', desc: 'Nghe và chép lại'       },
  { id: 'speaking',  label: 'Speaking',   emoji: '🗣️', desc: 'Luyện nói tự do'        },
  { id: 'reading',   label: 'Reading',    emoji: '📖', desc: 'Đọc hiểu đoạn văn'      },
  { id: 'writing',   label: 'Writing',    emoji: '✍️', desc: 'Viết câu / đoạn văn'    },
];

/* ─── All lessons combined ───────────────────────────────────────────────── */
const ALL_LESSONS = [
  ...(shadowingLessons as AnyLesson[]),
  ...(dictationLessons as AnyLesson[]),
  ...(readingLessons as AnyLesson[]),
  ...(speakingLessons as AnyLesson[]),
  ...(writingLessons as AnyLesson[]),
];

const ONBOARDING_KEY = 'cadence_onboarded';

/* ─── Today's greeting ───────────────────────────────────────────────────── */
function greeting(name: string | undefined) {
  const h = new Date().getHours();
  const time = h < 12 ? 'Chào buổi sáng' : h < 17 ? 'Chào buổi chiều' : 'Chào buổi tối';
  const display = name?.split(' ').pop() ?? 'bạn';
  return `${time}, ${display}!`;
}

function todayLabel() {
  return new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' });
}

function lessonHref(lesson: AnyLesson): string {
  switch (lesson.type) {
    case 'shadowing': return `/shadowing/${lesson.id}`;
    case 'speaking':  return `/speaking/${lesson.id}`;
    case 'reading':   return `/reading/${lesson.id}`;
    case 'writing':   return `/writing/${lesson.id}`;
    default:          return `/dictation/${lesson.id}`;
  }
}

/* ─── Onboarding Banner ─────────────────────────────────────────────────── */
function OnboardingBanner({ userName, onDone }: { userName?: string; onDone: () => void }) {
  const router = useRouter();

  function choose(skillId: string) {
    localStorage.setItem(ONBOARDING_KEY, '1');
    onDone();
    router.push(`/lessons?type=${skillId}`);
  }

  function skip() {
    localStorage.setItem(ONBOARDING_KEY, '1');
    onDone();
  }

  return (
    <div className="ob-overlay">
      <div className="ob-card">
        <div className="ob-head">
          <div className="ob-wave" aria-hidden="true">🎉</div>
          <h2 className="ob-title">
            Chào mừng{userName ? `, ${userName.split(' ').pop()}` : ''}!
          </h2>
          <p className="ob-sub">Hôm nay em muốn luyện kỹ năng gì trước?</p>
        </div>

        <div className="ob-skills">
          {SKILLS.map((s) => (
            <button key={s.id} className="ob-skill" onClick={() => choose(s.id)}>
              <span className="ob-skill-emoji">{s.emoji}</span>
              <span className="ob-skill-label">{s.label}</span>
              <span className="ob-skill-desc">{s.desc}</span>
            </button>
          ))}
        </div>

        <button className="ob-skip" onClick={skip}>
          Để sau, cho xem tổng quan →
        </button>
      </div>
    </div>
  );
}

/* ─── Hero CTA (returning user) ─────────────────────────────────────────── */
function HeroCTA({ progress, user }: { progress: LessonProgress[]; user: User | null }) {
  const completedIds = new Set(progress.map((p) => p.lessonId));
  const nextLesson = ALL_LESSONS.find((l) => !completedIds.has(l.id)) ?? ALL_LESSONS[0];

  if (!nextLesson) return null;

  const topic = nextLesson.topic ?? 'school';
  const cfg = TOPIC_CFG[topic] ?? TOPIC_CFG['school'];
  const colors = CAT_COLORS[cfg.cat] ?? CAT_COLORS.coral;
  const href = lessonHref(nextLesson);

  const skillEmoji = SKILLS.find((s) => s.id === nextLesson.type)?.emoji ?? '📚';
  const levelLabel = getLevelLabel(nextLesson.level);

  const completedToday = progress.filter((p) => {
    const today = new Date().toISOString().slice(0, 10);
    return p.completedAt.startsWith(today);
  }).length;

  return (
    <section className="hero-cta">
      {/* Greeting */}
      <div className="hero-greeting">
        <span className="hero-date">{todayLabel()}</span>
        <h1 className="hero-h1">{greeting(user?.name)}</h1>
        {completedToday > 0 && (
          <p className="hero-done">
            ✓ Hôm nay đã hoàn thành {completedToday} bài — tiếp tục nào!
          </p>
        )}
      </div>

      {/* Next lesson card */}
      <Link href={href} className="hero-next">
        <div className="hero-next-top">
          <span className="hero-next-skill" style={{ background: colors.bg, color: colors.fg }}>
            {skillEmoji} {nextLesson.type}
          </span>
          <span className="hero-next-level">{levelLabel}</span>
        </div>

        <h2 className="hero-next-title">{nextLesson.title}</h2>

        <div className="hero-next-meta">
          {cfg.emoji} {cfg.label} · {nextLesson.durationMinutes ?? 5} phút
        </div>

        <div className="hero-next-btn">
          {progress.length === 0 ? 'Bắt đầu bài đầu tiên' : 'Tiếp tục học'}
          <svg width="18" height="12" viewBox="0 0 18 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M1 6 H16 M11 1 L16 6 L11 11" />
          </svg>
        </div>
      </Link>
    </section>
  );
}

/* ─── Stats strip ────────────────────────────────────────────────────────── */
function StatsStrip({ progress, streak, totalMinutes }: { progress: LessonProgress[]; streak: number; totalMinutes: number }) {
  const today = new Date().toISOString().slice(0, 10);
  const todayMins = progress
    .filter((p) => p.completedAt.startsWith(today))
    .reduce((s, p) => s + Math.round(p.timeSpent / 60), 0);

  const stats = [
    { label: 'Bài đã xong',   value: progress.length,  unit: 'bài',  emoji: '✅' },
    { label: 'Hôm nay',        value: todayMins,          unit: 'phút', emoji: '⏱️' },
    { label: 'Streak',         value: streak,             unit: 'ngày', emoji: '🔥' },
    { label: 'Tổng thời gian', value: totalMinutes,       unit: 'phút', emoji: '📈' },
  ];

  return (
    <div className="stats-strip">
      {stats.map((s) => (
        <div key={s.label} className="stat-item">
          <span className="stat-emoji" aria-hidden="true">{s.emoji}</span>
          <span className="stat-value">{s.value}</span>
          <span className="stat-unit">{s.unit}</span>
          <span className="stat-label">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Weekly bar chart ───────────────────────────────────────────────────── */
function WeekBar({ progress }: { progress: LessonProgress[] }) {
  const bars = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().slice(0, 10);
      const mins = progress
        .filter((p) => p.completedAt.startsWith(key))
        .reduce((sum, p) => sum + Math.round(p.timeSpent / 60), 0);
      return { d: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()], v: mins, today: i === 6 };
    });
  }, [progress]);

  const maxV = Math.max(...bars.map((b) => b.v), 1);

  return (
    <div className="panel">
      <div className="panel-h">
        <h4>Tuần này</h4>
        <span className="total">{bars.reduce((s, b) => s + b.v, 0)} phút</span>
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

/* ─── Streak panel ───────────────────────────────────────────────────────── */
function StreakPanel({ streak }: { streak: number }) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return {
      label: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()],
      isToday: i === 6,
      active: i >= 7 - streak && streak > 0,
    };
  });

  return (
    <div className="panel">
      <div className="panel-h">
        <h4>Streak 🔥</h4>
        <span className="total">{streak > 0 ? 'Tiếp tục!' : 'Bắt đầu hôm nay'}</span>
      </div>
      <div className="streak-cal">
        <div className="streak-big">
          <b>{streak}</b>
          <span>{streak === 1 ? 'ngày liên tiếp' : 'ngày liên tiếp'} 🔥</span>
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
      </div>
      <div>
        <h4>{cfg.label}</h4>
        <div className="c-meta">{done}/{lessons.length} bài</div>
      </div>
      <div className="course-foot">
        <div className="pbar"><i style={{ width: `${Math.max(4, pct)}%` }} /></div>
        <span className="ppct">{pct}%</span>
      </div>
    </Link>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [streak, setStreak] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    setUser(getUser());
    const prog = getProgress();
    setProgress(prog);
    setStreak(getStreak());
    setTotalMinutes(getTotalMinutes());

    // Show onboarding only if never done + no progress
    const onboarded = localStorage.getItem(ONBOARDING_KEY);
    if (!onboarded && prog.length === 0) {
      setShowOnboarding(true);
    }
  }, []);

  const completedIds = useMemo(() => new Set(progress.map((p) => p.lessonId)), [progress]);

  const courses = useMemo(() =>
    Object.entries(TOPIC_CFG).map(([topic, cfg]) => ({
      topic,
      cfg,
      lessons: ALL_LESSONS.filter((l) => l.topic === topic),
    })),
  []);

  return (
    <>
      {/* ── Onboarding overlay ── */}
      {showOnboarding && (
        <OnboardingBanner
          userName={user?.name}
          onDone={() => setShowOnboarding(false)}
        />
      )}

      <main className="dash">
        {/* ── Hero CTA ── */}
        <HeroCTA progress={progress} user={user} />

        {/* ── Stats strip ── */}
        {progress.length > 0 && (
          <StatsStrip progress={progress} streak={streak} totalMinutes={totalMinutes} />
        )}

        {/* ── Week + Streak ── */}
        {progress.length > 0 && (
          <section className="week">
            <WeekBar progress={progress} />
            <StreakPanel streak={streak} />
          </section>
        )}

        {/* ── Courses ── */}
        <section>
          <div className="sec-head">
            <h3>Chủ đề học</h3>
            <span className="sub">Tiếp tục chỗ đã dừng</span>
            <Link href="/lessons" className="more">Xem tất cả →</Link>
          </div>
          <div className="courses">
            {courses.map(({ topic, cfg, lessons }) => (
              <CourseCard key={topic} topic={topic} cfg={cfg} lessons={lessons} completedIds={completedIds} />
            ))}
          </div>
        </section>

        {/* ── First-lesson prompt for new users ── */}
        {progress.length === 0 && !showOnboarding && (
          <section className="new-user-prompt">
            <div className="nup-inner">
              <p className="nup-text">Chưa có bài nào được hoàn thành.</p>
              <Link href="/lessons" className="btn">Bắt đầu học →</Link>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
