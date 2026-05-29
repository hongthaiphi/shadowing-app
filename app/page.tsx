import Link from 'next/link';
import HeroPlayer from '@/components/landing/HeroPlayer';
import PitchCompare from '@/components/landing/PitchCompare';

/* ─── MethodIcon SVGs ───────────────────────────────────────────────────────── */
const iconProps = {
  width: 28, height: 28, viewBox: '0 0 28 28',
  fill: 'none', stroke: 'currentColor', strokeWidth: 1.4,
  strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

function ShadowIcon() {
  return <svg {...iconProps}><path d="M4 14h2M9 9v10M13 5v18M17 9v10M21 12v4M24 14h0"/></svg>;
}
function DictIcon() {
  return <svg {...iconProps}><rect x="5" y="6" width="18" height="16" rx="1.5"/><path d="M9 11h10M9 14h10M9 17h6"/></svg>;
}
function MicIcon() {
  return <svg {...iconProps}><rect x="11" y="4" width="6" height="13" rx="3"/><path d="M7 14a7 7 0 0 0 14 0M14 21v3M10 24h8"/></svg>;
}
function ChartIcon() {
  return <svg {...iconProps}><path d="M4 22h20M7 22V14M12 22V9M17 22V12M22 22V6"/></svg>;
}

/* ─── Hero ──────────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="ss-hero">
      <div className="ss-hero-eyebrow">
        <span className="ss-dot" aria-hidden="true" />
        <span>Now with real-time pronunciation feedback</span>
      </div>

      <h1 className="ss-h1">
        Speak English<br />
        <em>like you mean it.</em>
      </h1>

      <p className="ss-hero-sub">
        Shadowing, dictation and live pitch-tracking — five-minute drills that
        train your ear and mouth at the same time.
      </p>

      <div className="ss-hero-ctas">
        <Link href="/lessons" className="ss-btn-solid lg">
          Start practising
        </Link>
        <Link href="/lessons" className="ss-btn-link">
          <span className="ss-play" aria-hidden="true">
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d="M2 1 L9 5 L2 9 Z" fill="currentColor" />
            </svg>
          </span>
          Browse lessons
        </Link>
      </div>

      {/* Animated player — client component */}
      <HeroPlayer />
    </section>
  );
}

/* ─── Marquee ───────────────────────────────────────────────────────────────── */
function Marquee() {
  const items = [
    'IELTS speaking', 'TOEIC listening', 'Business English',
    'Pronunciation drills', 'Daily fluency', 'Accent training',
  ];
  const repeated = [...items, ...items, ...items];
  return (
    <div className="ss-marquee" aria-hidden="true">
      <div className="ss-marquee-track">
        {repeated.map((x, i) => (
          <span key={i}>
            <svg width="10" height="10" viewBox="0 0 10 10">
              <circle cx="5" cy="5" r="2" fill="currentColor" />
            </svg>
            {' '}{x}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Methods ───────────────────────────────────────────────────────────────── */
const METHODS = [
  {
    id: '01',
    k: 'Shadowing',
    d: 'Echo native audio in real time. We chunk every line into bite-sized phrases so your mouth keeps up with your ears.',
    icon: <ShadowIcon />,
    href: '/lessons?type=shadowing',
  },
  {
    id: '02',
    k: 'Dictation',
    d: 'Type what you hear. We score word-level accuracy and surface the sounds you keep mishearing.',
    icon: <DictIcon />,
    href: '/lessons?type=dictation',
  },
  {
    id: '03',
    k: 'Live speaking',
    d: 'Record yourself against a native take. Pitch, tempo and stress get a quiet, honest verdict.',
    icon: <MicIcon />,
    href: '/lessons?type=speaking',
  },
  {
    id: '04',
    k: 'Progress',
    d: 'Streaks without the gamified noise. Just the words and patterns you actually mastered this week.',
    icon: <ChartIcon />,
    href: '/progress',
  },
];

function Methods() {
  return (
    <section className="ss-methods" aria-labelledby="methods-heading">
      <div className="ss-section-head">
        <span className="ss-section-num">§ 02</span>
        <h2 className="ss-h2" id="methods-heading">
          Four loops.<br /><em>One fluent voice.</em>
        </h2>
        <p className="ss-section-sub">
          Every lesson cycles through the four practice modes — short enough to
          keep your attention, long enough to actually move.
        </p>
      </div>

      <div className="ss-methods-grid">
        {METHODS.map((c, i) => (
          <Link key={c.id} href={c.href} className="ss-method-card" style={{ '--i': i } as React.CSSProperties}>
            <div className="ss-method-top">
              <span className="ss-method-num">{c.id}</span>
              <span className="ss-method-icon">{c.icon}</span>
            </div>
            <h3 className="ss-method-k">{c.k}</h3>
            <p className="ss-method-d">{c.d}</p>
            <div className="ss-method-foot">Try this →</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ─── Live demo ─────────────────────────────────────────────────────────────── */
function LiveDemo() {
  return (
    <section className="ss-live" aria-labelledby="demo-heading">
      <div className="ss-live-text">
        <span className="ss-section-num">§ 03</span>
        <h2 className="ss-h2" id="demo-heading">
          Hear it. <em>Say it.</em><br />See how close you got.
        </h2>
        <p className="ss-section-sub">
          Our pitch tracker compares your take to the native line in real time.
          No grades, no green checks — just the same visual a coach would draw
          on a napkin.
        </p>
        <ul className="ss-bullets">
          <li><span>•</span> Chunk-by-chunk replay at 0.6×, 0.85× and full speed.</li>
          <li><span>•</span> Side-by-side pitch contours and stress markers.</li>
          <li><span>•</span> Three accents — General American, British RP, and Australian.</li>
        </ul>
      </div>

      {/* Animated pitch compare — client component */}
      <PitchCompare />
    </section>
  );
}

/* ─── Stats ─────────────────────────────────────────────────────────────────── */
const STATS = [
  { n: '20+', l: 'Curated lessons', k: 'Updated weekly' },
  { n: '5',   l: 'Practice modes',  k: 'Shadowing · Dictation · Speaking · Reading · Writing' },
  { n: '5min',l: 'Minimum daily drill', k: 'Built for busy weeks' },
  { n: '94%', l: 'Report better fluency', k: 'After 30 days' },
];

function Stats() {
  return (
    <section className="ss-stats" aria-label="ShadowSpeak by the numbers">
      {STATS.map((s, i) => (
        <div key={i} className="ss-stat">
          <b className="ss-stat-n">{s.n}</b>
          <span className="ss-stat-l">{s.l}</span>
          <span className="ss-stat-k">{s.k}</span>
        </div>
      ))}
    </section>
  );
}

/* ─── Voices / testimonials ─────────────────────────────────────────────────── */
const VOICES = [
  {
    q: "I stopped translating in my head somewhere around week three. That was the moment it clicked.",
    a: 'Linh N.', r: 'Marketing manager, Hà Nội',
  },
  {
    q: "The pitch view shows you exactly where the music of your sentence breaks. Nothing else taught me that.",
    a: 'Marco P.', r: 'Software engineer, Milano',
  },
  {
    q: "I do five minutes with my coffee. No streak guilt, no cartoons — just the lesson and a record button.",
    a: 'Aisha R.', r: 'MBA student, Toronto',
  },
];

function Voices() {
  return (
    <section className="ss-voices" aria-labelledby="voices-heading">
      <div className="ss-section-head">
        <span className="ss-section-num">§ 05</span>
        <h2 className="ss-h2" id="voices-heading">
          From people who<br /><em>just kept showing up.</em>
        </h2>
      </div>
      <div className="ss-voices-grid">
        {VOICES.map((v, i) => (
          <figure key={i} className="ss-voice">
            <blockquote>&ldquo;{v.q}&rdquo;</blockquote>
            <figcaption>
              <b>{v.a}</b>
              <span>{v.r}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/* ─── Big CTA ───────────────────────────────────────────────────────────────── */
function BigCTA() {
  return (
    <section className="ss-bigcta" aria-labelledby="bigcta-heading">
      <h2 className="ss-h2 huge" id="bigcta-heading">
        Five minutes.<br /><em>Today.</em>
      </h2>
      <p>That&rsquo;s the whole bar. Open a lesson, hit play, and let your mouth catch up.</p>
      <div className="ss-bigcta-ctas">
        <Link href="/lessons" className="ss-btn-solid lg">Browse lessons</Link>
        <Link href="/register" className="ss-btn-ghost lg">Create free account</Link>
      </div>
    </section>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────────── */
export default function Home() {
  return (
    <div className="ss-landing">
      <Hero />
      <Marquee />
      <Methods />
      <LiveDemo />
      <Stats />
      <Voices />
      <BigCTA />
    </div>
  );
}
