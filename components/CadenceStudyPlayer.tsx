'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { audioToWav } from '@/lib/audio';

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Line {
  text: string;
  audioUrl?: string;
}

interface AssessResult {
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  words: { word: string; accuracyScore: number; errorType: string }[];
}

interface CadenceStudyPlayerProps {
  lessonTitle: string;
  levelTag: string;
  tagColor?: { bg: string; fg: string };
  lines: Line[];
  notes?: string;
  onComplete?: () => void;
  onBack?: () => void;
}

/* ─── Waveform bars ──────────────────────────────────────────────────────── */
const WAVE_SHAPE = Array.from({ length: 54 }, (_, i) => {
  const x = i / 54;
  return Math.max(0.18, Math.min(1, 0.5 + Math.sin(x * 8) * 0.32 + Math.sin(x * 21 + 1) * 0.18));
});

function PlayerWave({ progress, animated }: { progress: number; animated: boolean }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!animated) return;
    let raf: number;
    const step = (t: number) => { setTick(t / 400); raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [animated]);

  return (
    <div className="player-wave">
      {WAVE_SHAPE.map((h, i) => {
        const on = i / WAVE_SHAPE.length <= progress;
        const wob = animated && Math.abs(i / WAVE_SHAPE.length - progress) < 0.08
          ? 1 + 0.3 * Math.sin(tick + i)
          : 1;
        return (
          <span key={i} className={on ? 'on' : ''} style={{ height: `${Math.max(14, h * wob * 100)}%` }} />
        );
      })}
    </div>
  );
}

/* ─── Pitch comparison SVG ───────────────────────────────────────────────── */
function PitchLine({ userScores }: { userScores?: number[] }) {
  const W = 300; const H = 64;
  const makePath = (pts: [number, number][]) =>
    'M ' + pts.map((p) => p.join(' ')).join(' L ');

  const native = useMemo(() => {
    const pts: [number, number][] = Array.from({ length: 26 }, (_, i) => {
      const x = (i / 25) * W;
      const v = 0.55 + Math.sin(i * 0.6) * 0.16 + Math.sin(i * 0.24) * 0.24;
      return [x, (1 - Math.max(0.06, Math.min(0.94, v))) * H];
    });
    return makePath(pts);
  }, []);

  const user = useMemo(() => {
    const pts: [number, number][] = Array.from({ length: 26 }, (_, i) => {
      const x = (i / 25) * W;
      const base = userScores ? userScores[Math.min(i, userScores.length - 1)] / 100 : 0.5;
      const v = base + Math.sin(i * 0.6 + 1) * 0.12;
      return [x, (1 - Math.max(0.06, Math.min(0.94, v))) * H];
    });
    return makePath(pts);
  }, [userScores]);

  return (
    <div className="fpitch">
      <svg viewBox={`0 0 ${W} ${H}`}>
        {[0, 1, 2].map((i) => (
          <line key={i} x1="0" x2={W} y1={H / 3 * i + 6} y2={H / 3 * i + 6} stroke="currentColor" strokeOpacity=".07" />
        ))}
        <path d={user} fill="none" stroke="var(--ink)" strokeWidth="1.5" strokeDasharray="3 3" opacity=".5" />
        <path d={native} fill="none" stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      <div style={{ display: 'flex', gap: 14, fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginTop: 4 }}>
        <span style={{ color: 'var(--accent)' }}>— Native</span>
        <span>--- You</span>
      </div>
    </div>
  );
}

/* ─── Feedback panel ─────────────────────────────────────────────────────── */
function Feedback({ state, result, assessing }: { state: 'idle' | 'recording' | 'graded'; result: AssessResult | null; assessing: boolean }) {
  if (state === 'recording') {
    return (
      <div className="feedback empty">
        <span className="fi">👂</span>
        <h4>Listening…</h4>
        <p className="fnote" style={{ margin: 0 }}>Speak the line clearly, then tap the mic again to stop.</p>
      </div>
    );
  }
  if (state === 'idle' && !result) {
    return (
      <div className="feedback empty">
        <span className="fi">🎙️</span>
        <h4>Your turn</h4>
        <p className="fnote" style={{ margin: 0 }}>Hit record and shadow the highlighted line. We&apos;ll show how close your rhythm and pitch landed.</p>
      </div>
    );
  }
  if (assessing) {
    return (
      <div className="feedback empty">
        <span className="fi">⏳</span>
        <h4>Analysing…</h4>
        <p className="fnote" style={{ margin: 0 }}>Checking your pronunciation — just a moment.</p>
      </div>
    );
  }
  if (!result) return null;

  const acc = result.accuracyScore;
  const fluency = result.fluencyScore;
  const complete = result.completenessScore;
  const scoreClass = (v: number) => v >= 85 ? 'good' : v >= 65 ? 'ok' : 'low';
  const comment = acc >= 85
    ? 'Warm, natural delivery. Try letting your pitch fall a touch more at the end.'
    : acc >= 65
    ? 'Decent attempt. Watch the stressed syllables and keep the rhythm steady.'
    : 'Keep practising — replay the line a few times before trying again.';

  return (
    <div className="feedback">
      <h4>How you did</h4>
      <p className="fnote">{comment}</p>
      {[
        { k: 'Pronunciation', v: acc },
        { k: 'Fluency',       v: fluency },
        { k: 'Completeness',  v: complete },
      ].map((m) => (
        <div key={m.k} className={`frow ${scoreClass(m.v)}`}>
          <div className="ft"><span>{m.k}</span><b>{Math.round(m.v)}%</b></div>
          <div className="fbar"><i style={{ width: `${m.v}%` }} /></div>
        </div>
      ))}
      <PitchLine userScores={result.words.map((w) => w.accuracyScore)} />
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function CadenceStudyPlayer({
  lessonTitle,
  levelTag,
  tagColor,
  lines,
  notes,
  onComplete,
  onBack,
}: CadenceStudyPlayerProps) {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [feedbackState, setFeedbackState] = useState<'idle' | 'recording' | 'graded'>('idle');
  const [assessing, setAssessing] = useState(false);
  const [assessResult, setAssessResult] = useState<AssessResult | null>(null);
  const [speed, setSpeed] = useState(0.85);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const rafRef = useRef<number>(0);
  const progressRef = useRef(0);

  // Sync progressRef with state for animation
  useEffect(() => { progressRef.current = progress; }, [progress]);

  /* ── Audio playback ── */
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    cancelAnimationFrame(rafRef.current);
    setPlaying(false);
  }, []);

  const playLine = useCallback((idx: number) => {
    stopAudio();
    setActive(idx);
    setProgress(0);

    const line = lines[idx];
    if (line.audioUrl) {
      const audio = new Audio(line.audioUrl);
      audio.playbackRate = speed;
      audioRef.current = audio;

      audio.addEventListener('ended', () => setPlaying(false));
      audio.addEventListener('timeupdate', () => {
        if (audio.duration) setProgress(audio.currentTime / audio.duration);
      });
      audio.play().then(() => setPlaying(true)).catch(() => {
        // Fall back to Speech Synthesis
        speakLine(line.text);
      });
    } else {
      speakLine(line.text);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines, speed, stopAudio]);

  function speakLine(text: string) {
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = speed;
    utter.lang = 'en-US';
    setPlaying(true);
    setProgress(0);
    let startTime: number;
    const estimatedDur = (text.length / 14) / speed * 1000;

    const tick = (now: number) => {
      if (!startTime) startTime = now;
      const p = Math.min((now - startTime) / estimatedDur, 1);
      setProgress(p);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    utter.onend = () => { setPlaying(false); cancelAnimationFrame(rafRef.current); setProgress(1); };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  const togglePlay = () => {
    if (playing) { stopAudio(); window.speechSynthesis.cancel(); }
    else { playLine(active); }
  };

  /* ── Recording ── */
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      mediaRecRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => { stream.getTracks().forEach((t) => t.stop()); };
      rec.start();
      setRecording(true);
      setFeedbackState('recording');
      setAssessResult(null);
    } catch {
      // Microphone not available
    }
  }, []);

  const stopRecording = useCallback(async () => {
    const rec = mediaRecRef.current;
    if (!rec) return;
    rec.stop();
    setRecording(false);
    setFeedbackState('graded');
    setAssessing(true);

    await new Promise<void>((resolve) => { rec.onstop = () => resolve(); setTimeout(resolve, 500); });

    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    try {
      const wavBuffer = await audioToWav(blob);
      const formData = new FormData();
      formData.append('audio', new Blob([wavBuffer], { type: 'audio/wav' }));
      formData.append('referenceText', lines[active].text);
      const res = await fetch('/api/assess', { method: 'POST', body: formData });
      if (res.ok) setAssessResult(await res.json());
    } catch {
      // Assessment optional — non-critical
    } finally {
      setAssessing(false);
    }
  }, [active, lines]);

  const toggleRecord = () => {
    if (recording) stopRecording();
    else startRecording();
  };

  /* ── Mark complete ── */
  const handleComplete = () => {
    setCompleted(true);
    onComplete?.();
  };

  const allDone = active === lines.length - 1 && !playing;

  /* ── Tip extraction ── */
  const tips = useMemo(() => {
    if (!notes) return [];
    return notes.split(/[.!]/).filter((s) => s.trim().length > 10).slice(0, 3).map((s, i) => ({
      b: ['Tip', 'Note', 'Focus'][i] ?? 'Tip',
      t: s.trim() + '.',
    }));
  }, [notes]);

  const tagBg = tagColor?.bg ?? 'var(--sky-t)';
  const tagFg = tagColor?.fg ?? 'var(--sky)';

  return (
    <div className="study">
      {/* Back + breadcrumb */}
      <div className="study-top">
        {onBack && (
          <button className="crumb" onClick={onBack}>
            ← Library
          </button>
        )}
      </div>

      {/* Title */}
      <div className="study-title">
        <h1>{lessonTitle}</h1>
        <span className="study-tag" style={{ background: tagBg, color: tagFg }}>{levelTag}</span>
      </div>
      <p className="study-sub">
        Listen to each line, then shadow it back. Tap any line to replay just that part.
      </p>

      <div className="study-grid">
        {/* ── Left: script + player ── */}
        <div>
          <div className="script">
            <div className="script-h">
              <h3>📖 Script</h3>
              {/* Progress indicator */}
              <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>
                {active + 1} / {lines.length}
              </span>
            </div>

            {lines.map((l, i) => (
              <div
                key={i}
                className={`line${i === active ? ' active' : ''}`}
                onClick={() => playLine(i)}
              >
                {/* Speaker badge */}
                <div style={{ display: 'grid', justifyItems: 'center' }}>
                  <div className="line-spk narrator">{i + 1}</div>
                  <div className="line-spk-name">Line</div>
                </div>

                {/* Play button */}
                <button
                  className="line-play"
                  onClick={(e) => { e.stopPropagation(); playLine(i); }}
                  aria-label={`Play line ${i + 1}`}
                >
                  <svg width="11" height="11" viewBox="0 0 11 11">
                    <path d="M3 2 L9 5.5 L3 9 Z" fill="currentColor" />
                  </svg>
                </button>

                {/* Text */}
                <div className="line-body">
                  <div className="en">{l.text}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Sticky player */}
          <div className="player">
            <button className="player-play" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
              {playing ? (
                <svg width="16" height="16" viewBox="0 0 16 16">
                  <rect x="3" y="2" width="3.5" height="12" fill="currentColor" />
                  <rect x="9.5" y="2" width="3.5" height="12" fill="currentColor" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16">
                  <path d="M4 2 L13 8 L4 14 Z" fill="currentColor" />
                </svg>
              )}
            </button>

            <div className="player-mid">
              <div className="player-line">
                Line {active + 1}: &ldquo;{lines[active]?.text}&rdquo;
              </div>
              <PlayerWave progress={progress} animated={playing} />
            </div>

            <div className="player-ctrls">
              {/* Speed */}
              <div className="spd">
                {[0.6, 0.85, 1].map((s) => (
                  <button
                    key={s}
                    className={speed === s ? 'on' : ''}
                    onClick={() => setSpeed(s)}
                    aria-label={`${s}× speed`}
                  >
                    {s}×
                  </button>
                ))}
              </div>

              {/* Repeat */}
              <button className="pico" onClick={() => playLine(active)} aria-label="Repeat line">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <path d="M2 8 a6 6 0 1 1 1.8 4.2" />
                  <path d="M2 12 V8 H6" />
                </svg>
              </button>

              {/* Record */}
              <button
                className={`pico rec${recording ? ' on' : ''}`}
                onClick={toggleRecord}
                aria-label={recording ? 'Stop recording' : 'Start recording'}
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="5" y="2" width="5" height="8" rx="2.5" />
                  <path d="M3.5 7.5 a4 4 0 0 0 8 0M7.5 11.5V13" />
                </svg>
              </button>

              {/* Next line */}
              {active < lines.length - 1 && (
                <button
                  className="pico"
                  onClick={() => { stopAudio(); setActive((a) => a + 1); setProgress(0); }}
                  aria-label="Next line"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                    <path d="M3 2 l6 5 -6 5M11 2v10" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Complete button */}
          {allDone && !completed && (
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <button className="btn lg" onClick={handleComplete}>
                Mark lesson complete ✓
              </button>
            </div>
          )}
          {completed && (
            <div style={{ textAlign: 'center', marginTop: 24, padding: '20px', borderRadius: 'var(--r)', background: 'var(--mint-t)', color: 'var(--mint)' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
              <p style={{ fontWeight: 700, margin: 0 }}>Lesson complete! Great work.</p>
            </div>
          )}
        </div>

        {/* ── Aside ── */}
        <aside className="aside">
          {tips.length > 0 && (
            <div className="note-card tips">
              <h4><span>💡</span> Pronunciation notes</h4>
              <ul className="tips-ul">
                {tips.map((t, i) => (
                  <li key={i}>
                    <span className="ti">›</span>
                    <span><b>{t.b}.</b> {t.t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="note-card words">
            <h4><span>🟢</span> Lines in this lesson</h4>
            <div className="wchips">
              {lines.slice(0, 6).map((l, i) => (
                <button
                  key={i}
                  className="wchip"
                  onClick={() => playLine(i)}
                  style={{ textAlign: 'left', cursor: 'pointer' }}
                >
                  <b>Line {i + 1}</b>
                  <span>{l.text.slice(0, 36)}{l.text.length > 36 ? '…' : ''}</span>
                </button>
              ))}
            </div>
          </div>

          <Feedback state={feedbackState} result={assessResult} assessing={assessing} />
        </aside>
      </div>
    </div>
  );
}
