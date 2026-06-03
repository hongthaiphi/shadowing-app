import Link from 'next/link';

/* ─── Hero section ───────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="cd-hero">
      <div className="cd-hero-eyebrow">
        <span className="cd-dot" aria-hidden="true" />
        <span>A new way to learn English — free, effective, honest</span>
      </div>

      <h1 className="cd-h1">
        Speak English<br />
        <em>the way it actually sounds.</em>
      </h1>

      <p className="cd-hero-sub">
        Most learners can read and write well — but freeze the moment they open
        their mouth. Cadence is built to close that gap. Five-minute drills
        that train your ear, your rhythm, and your confidence together.
      </p>

      <div className="cd-hero-ctas">
        <Link href="/lessons" className="btn lg">
          Start practising free
        </Link>
        <Link href="/register" className="btn ghost lg">
          Create account
        </Link>
      </div>

      {/* Mini demo player */}
      <div className="cd-demo-player" aria-hidden="true">
        <div className="cd-demo-top">
          <div className="cd-demo-label">
            <span className="cd-demo-dot" />
            <span>Lesson preview · Café & everyday errands · A2</span>
          </div>
          <span className="cd-demo-tag">shadowing</span>
        </div>
        <div className="cd-demo-line">
          &ldquo;Could I get a{' '}
          <span className="hl">medium oat-milk latte</span>
          , please?&rdquo;
        </div>
        <div className="cd-demo-phon">kʊd aɪ gɛt ə ˈmiːdiəm ˈoʊt mɪlk ˈlɑːteɪ pliːz</div>
        <div className="cd-demo-wave" aria-hidden="true">
          {Array.from({ length: 60 }, (_, i) => {
            const h = Math.max(18, Math.min(100,
              50 + Math.sin(i * 0.42) * 30 + Math.sin(i * 0.9 + 1) * 16
            ));
            const on = i < 38;
            return (
              <span
                key={i}
                style={{
                  height: `${h}%`,
                  background: on ? 'var(--accent)' : 'color-mix(in oklab, var(--ink), transparent 80%)',
                  borderRadius: 2, flex: 1, minWidth: 2,
                }}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── Mission ────────────────────────────────────────────────────────────── */
function Mission() {
  return (
    <section className="cd-mission">
      <div className="cd-mission-inner">
        <div className="cd-mission-text">
          <span className="cd-overline">Our mission</span>
          <h2 className="cd-h2">
            English fluency shouldn&rsquo;t depend on<br />
            <em>where you were born.</em>
          </h2>
          <p>
            Millions of people worldwide know English on paper but can&rsquo;t
            hold a real conversation. Grammar books and vocabulary apps teach
            the language — but not the music of it. The rhythm, the stress, the
            way sounds blend together when a native speaker talks at full speed.
          </p>
          <p>
            Cadence exists to give everyone access to the same techniques that
            actors, diplomats, and broadcast journalists use to master an accent:
            <strong> shadowing</strong> — listening closely and repeating
            immediately after, again and again, until the patterns live in your
            mouth and not just your memory.
          </p>
          <p>
            No gamification. No streaks you dread losing. No cartoon characters
            judging your progress. Just the lesson, a record button, and honest
            feedback on how close you got.
          </p>
        </div>
        <div className="cd-mission-stats">
          {[
            { n: '5 min', l: 'Minimum daily session', sub: 'Built for real schedules' },
            { n: '60+',   l: 'Curated lessons',       sub: 'Across 5 topics & 3 levels' },
            { n: '4',     l: 'Practice modes',        sub: 'Shadowing · Dictation · Speaking · Reading' },
            { n: '0',     l: 'Subscription fees',     sub: 'Free to practise, always' },
          ].map((s) => (
            <div key={s.n} className="cd-stat">
              <b>{s.n}</b>
              <span>{s.l}</span>
              <small>{s.sub}</small>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Methods ────────────────────────────────────────────────────────────── */
const METHODS = [
  {
    cat: 'coral' as const,
    emoji: '🎧',
    title: 'Shadowing',
    desc: 'Listen to a native line, then echo it back immediately — same rhythm, same melody, same connected speech. Your brain stops translating and starts imitating. That\'s when fluency begins.',
    detail: 'Chunked into short phrases · Three playback speeds · American accent',
    href: '/lessons?type=shadowing',
  },
  {
    cat: 'sky' as const,
    emoji: '✍️',
    title: 'Dictation',
    desc: 'Hear a sentence, type what you hear word for word. You\'ll quickly discover which sounds your ear collapses — the weak vowels, the linked words, the unstressed syllables you\'ve been ignoring.',
    detail: 'Word-level accuracy scoring · Highlights missed sounds',
    href: '/lessons?type=dictation',
  },
  {
    cat: 'violet' as const,
    emoji: '🎙️',
    title: 'Speaking practice',
    desc: 'Record yourself against a native take. See your pitch contour next to the original. No score — just the same visual a voice coach would draw on a whiteboard.',
    detail: 'Pitch comparison · Pronunciation assessment · Fluency score',
    href: '/lessons?type=speaking',
  },
  {
    cat: 'amber' as const,
    emoji: '📖',
    title: 'Reading aloud',
    desc: 'Read a passage out loud at full speed. Reading aloud forces your mouth to keep up with your eyes and trains the muscle memory that silently reading never does.',
    detail: 'Graded texts · Pacing guide · Common pronunciation traps noted',
    href: '/lessons?type=reading',
  },
];

const CAT_STYLE: Record<string, { bg: string; fg: string }> = {
  coral:  { bg: 'var(--coral-t)',  fg: 'var(--coral)'  },
  sky:    { bg: 'var(--sky-t)',    fg: 'var(--sky)'    },
  violet: { bg: 'var(--violet-t)', fg: 'var(--violet)' },
  amber:  { bg: 'var(--amber-t)',  fg: 'var(--amber)'  },
};

function Methods() {
  return (
    <section className="cd-methods">
      <div className="cd-section-head">
        <span className="cd-overline">How it works</span>
        <h2 className="cd-h2">
          Four loops.<br /><em>One fluent voice.</em>
        </h2>
        <p className="cd-section-sub">
          Every lesson cycles through one or more practice modes — each one
          targeting a different gap between what you know and what you can say.
        </p>
      </div>
      <div className="cd-methods-grid">
        {METHODS.map((m) => {
          const s = CAT_STYLE[m.cat];
          return (
            <Link
              key={m.title}
              href={m.href}
              className="cd-method-card"
              style={{ '--mc-bg': s.bg, '--mc-fg': s.fg } as React.CSSProperties}
            >
              <div className="cd-method-top">
                <span className="cd-method-emoji">{m.emoji}</span>
                <span className="cd-method-tag">{m.title}</span>
              </div>
              <p className="cd-method-desc">{m.desc}</p>
              <div className="cd-method-detail">{m.detail}</div>
              <div className="cd-method-cta">Try this →</div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/* ─── Testimonials ───────────────────────────────────────────────────────── */
const VOICES = [
  {
    q: 'I stopped translating in my head somewhere around week three. That was the moment it clicked.',
    name: 'Linh N.', role: 'Marketing manager, Hà Nội',
    cat: 'coral' as const,
  },
  {
    q: 'The pitch view shows you exactly where the music of your sentence breaks. Nothing else ever taught me that.',
    name: 'Marco P.', role: 'Software engineer, Milano',
    cat: 'sky' as const,
  },
  {
    q: 'Five minutes with my coffee every morning. No streak guilt, no cartoons — just the lesson and a record button.',
    name: 'Aisha R.', role: 'MBA student, Toronto',
    cat: 'violet' as const,
  },
];

function Voices() {
  return (
    <section className="cd-voices">
      <div className="cd-section-head" style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto 48px' }}>
        <span className="cd-overline">Real people</span>
        <h2 className="cd-h2" style={{ fontSize: 'clamp(32px, 4vw, 52px)' }}>
          From people who<br /><em>just kept showing up.</em>
        </h2>
      </div>
      <div className="cd-voices-grid">
        {VOICES.map((v) => {
          const s = CAT_STYLE[v.cat];
          return (
            <figure key={v.name} className="cd-voice" style={{ '--vc-bg': s.bg, '--vc-fg': s.fg } as React.CSSProperties}>
              <div className="cd-voice-accent" aria-hidden="true" />
              <blockquote>&ldquo;{v.q}&rdquo;</blockquote>
              <figcaption>
                <b>{v.name}</b>
                <span>{v.role}</span>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}

/* ─── Big CTA ────────────────────────────────────────────────────────────── */
function BigCTA() {
  return (
    <section className="cd-bigcta">
      <span className="cd-overline" style={{ display: 'block', marginBottom: 20 }}>Ready to start?</span>
      <h2 className="cd-h2" style={{ fontSize: 'clamp(48px, 8vw, 110px)', lineHeight: 0.9, marginBottom: 20 }}>
        Five minutes.<br /><em>Today.</em>
      </h2>
      <p style={{ color: 'var(--muted)', fontSize: 18, maxWidth: '32ch', margin: '0 auto 36px', lineHeight: 1.6 }}>
        That&rsquo;s the whole ask. Open a lesson, hit play, and let your mouth catch up with your ears.
      </p>
      <div className="cd-bigcta-ctas">
        <Link href="/lessons" className="btn lg">Browse lessons</Link>
        <Link href="/register" className="btn ghost lg">Create free account</Link>
      </div>
    </section>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="cd-landing">
      <Hero />
      <Mission />
      <Methods />
      <Voices />
      <BigCTA />
    </div>
  );
}
