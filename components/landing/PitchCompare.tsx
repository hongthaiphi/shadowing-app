'use client';

import { useState, useEffect, useMemo } from 'react';

interface PathData {
  line: string;
  area: string;
  pts: [number, number][];
}

function buildPath(W: number, H: number, N: number, seed: number, base: number, amp: number): PathData {
  const pts: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const x = (i / N) * W;
    const v =
      base +
      Math.sin(i * 0.6 + seed) * amp * 0.4 +
      Math.sin(i * 0.22 + seed * 1.7) * amp * 0.6 +
      (seed ? Math.sin(i * 1.1) * 0.05 : 0);
    pts.push([x, (1 - Math.max(0.05, Math.min(0.95, v))) * H]);
  }
  const line = 'M ' + pts.map((p) => p.join(' ')).join(' L ');
  const area = line + ` L ${W} ${H} L 0 ${H} Z`;
  return { line, area, pts };
}

function pathY(path: PathData, x: number, W: number): number {
  const { pts } = path;
  const N = pts.length - 1;
  const i = Math.max(0, Math.min(N - 1, Math.floor((x / W) * N)));
  const a = pts[i];
  const b = pts[i + 1] ?? pts[i];
  const f = (x - a[0]) / (b[0] - a[0] || 1);
  return a[1] + (b[1] - a[1]) * f;
}

const W = 420;
const H = 160;

export default function PitchCompare() {
  const [t, setT] = useState(0);

  useEffect(() => {
    let r: number;
    const tick = (now: number) => {
      setT(now / 1000);
      r = requestAnimationFrame(tick);
    };
    r = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(r);
  }, []);

  const native = useMemo(() => buildPath(W, H, 32, 0, 0.55, 0.42), []);
  const user = useMemo(() => buildPath(W, H, 32, 1, 0.5, 0.46), []);

  const head = (t * 60) % W;

  return (
    <div className="ss-pitch-card">
      <div className="ss-pitch-head">
        <span className="ss-tag">Pitch contour</span>
        <span className="ss-pitch-legend">
          <i className="dot native" /> Native
          <i className="dot user" /> You
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="ss-pitch-svg" aria-hidden="true">
        <defs>
          <linearGradient id="ss-g1" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity=".22" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 1, 2, 3].map((i) => (
          <line
            key={i}
            x1="0" x2={W}
            y1={H / 4 * i + 10} y2={H / 4 * i + 10}
            stroke="currentColor" strokeOpacity=".06"
          />
        ))}

        <path d={native.area} fill="url(#ss-g1)" />
        <path d={native.line} fill="none" stroke="var(--accent)" strokeWidth="2.2" />
        <path d={user.line} fill="none" stroke="var(--ink)" strokeWidth="1.6" strokeDasharray="3 3" opacity=".75" />

        <line x1={head} x2={head} y1="6" y2={H - 6} stroke="var(--ink)" strokeOpacity=".25" strokeWidth="1" />
        <circle cx={head} cy={pathY(native, head, W)} r="4" fill="var(--accent)" />
      </svg>

      <div className="ss-pitch-foot">
        <div className="ss-pitch-metric">
          <b>87<span>%</span></b>
          <i>pitch match</i>
        </div>
        <div className="ss-pitch-metric">
          <b>0.96<span>×</span></b>
          <i>tempo</i>
        </div>
        <div className="ss-pitch-metric">
          <b>4<span>/4</span></b>
          <i>stress marks</i>
        </div>
      </div>
    </div>
  );
}
