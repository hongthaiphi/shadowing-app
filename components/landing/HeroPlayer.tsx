'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

/* Pre-computed waveform bars (deterministic, avoids hydration mismatch) */
function buildBars(N = 96): number[] {
  const arr: number[] = [];
  for (let i = 0; i < N; i++) {
    const x = i / N;
    const v =
      Math.sin(x * 8.1) * 0.4 +
      Math.sin(x * 22 + 1) * 0.3 +
      Math.sin(x * 43 + 2) * 0.2 +
      Math.cos(x * 5) * 0.15 +
      0.55;
    arr.push(Math.max(0.1, Math.min(1, v)));
  }
  return arr;
}

function Waveform({ progress, animated }: { progress: number; animated: boolean }) {
  const bars = useMemo(() => buildBars(), []);
  const [t, setT] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!animated) return;
    const tick = (now: number) => {
      setT(now / 600);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animated]);

  return (
    <div className="ss-wave" role="img" aria-label="audio waveform">
      {bars.map((h, i) => {
        const passed = i / bars.length <= progress;
        const wobble =
          animated && Math.abs(i / bars.length - progress) < 0.06
            ? 1 + 0.25 * Math.sin(t + i * 0.7)
            : 1;
        return (
          <span
            key={i}
            className={'ss-wave-bar' + (passed ? ' on' : '')}
            style={{ height: `${Math.max(8, h * wobble * 100)}%` }}
          />
        );
      })}
      <span className="ss-wave-head" style={{ left: `${progress * 100}%` }} />
    </div>
  );
}

export default function HeroPlayer() {
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0.32);
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number>(0);

  useEffect(() => {
    if (!playing) return;
    lastRef.current = performance.now();
    const tick = (now: number) => {
      const dt = (now - lastRef.current) / 1000;
      lastRef.current = now;
      setProgress((p) => {
        const n = p + dt / 14;
        return n > 1 ? 0 : n;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing]);

  return (
    <div className="ss-player">
      <div className="ss-player-top">
        <div className="ss-player-meta">
          <span className="ss-tag">Lesson 01</span>
          <span className="ss-player-title">Ordering coffee like a local</span>
        </div>
        <span className="ss-chip">A2 · 4 min</span>
      </div>

      <Waveform progress={progress} animated={playing} />

      <div className="ss-player-mid">
        <button
          className="ss-play-btn"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? 'Pause playback' : 'Resume playback'}
        >
          {playing ? (
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <rect x="3" y="2" width="3.5" height="12" fill="currentColor" />
              <rect x="9.5" y="2" width="3.5" height="12" fill="currentColor" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3 2 L14 8 L3 14 Z" fill="currentColor" />
            </svg>
          )}
        </button>

        <div className="ss-player-line">
          <span className="ss-line-text">
            Hi, can I get a <mark>medium oat latte</mark> to go, please?
          </span>
          <span className="ss-line-phon">
            hai · kæn · ai · gɛt · ə · ˈmiːdiəm · oʊt · ˈlɑːteɪ
          </span>
        </div>

        <div className="ss-player-speed">0.85×</div>
      </div>

      <div className="ss-player-foot">
        <div className="ss-mini-stat">
          <b>92<span>%</span></b>
          <i>pitch match</i>
        </div>
        <div className="ss-mini-stat">
          <b>1.04<span>×</span></b>
          <i>tempo</i>
        </div>
        <div className="ss-mini-stat">
          <b>4<span>/12</span></b>
          <i>chunks done</i>
        </div>
        <div className="ss-mini-stat ok">
          <b>•••</b>
          <i>recording</i>
        </div>
      </div>
    </div>
  );
}
