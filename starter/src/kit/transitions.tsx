import React from 'react';
import {interpolate} from 'remotion';
import {clamp, easeIn, easeInOut, easeOut, p, rand} from './motion';
import {useG} from './clock';

/**
 * Pixel / tile transition. cover: tiles fill in; reveal: tiles clear away.
 * Bound it in time (render it only during [start, start+dur]) or a finished cover stays on screen forever.
 */
export const Pixels: React.FC<{start: number; dur: number; mode: 'cover' | 'reveal'; color: string; origin?: 'random' | 'left' | 'center' | [number, number]; cols?: number; keep?: [number, number]; keepColor?: string; width?: number; height?: number}> = ({
  start, dur, mode, color, origin = 'random', cols = 24, keep, keepColor, width = 1920, height = 1080,
}) => {
  const g = useG();
  const pr = (g - start) / dur;
  if (pr < -0.05 || pr > 1.05) return null;
  const cell = width / cols;
  const rows = Math.ceil(height / cell);
  const out: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const n = rand(r * 31 + c * 7 + 3);
    let th = n;
    if (origin === 'left') th = (c / cols) * 0.65 + n * 0.35;
    else if (origin === 'center') th = (Math.hypot(c - cols / 2, (r - rows / 2) * 1.3) / (cols * 0.6)) * 0.6 + n * 0.4;
    else if (Array.isArray(origin)) th = (Math.hypot(c - origin[0] * cols, r - origin[1] * rows) / (cols * 0.8)) * 0.65 + n * 0.35;
    const isKeep = keep && keep[0] === c && keep[1] === r;
    const local = mode === 'cover' ? (pr - th * 0.85) / 0.15 : 1 - (pr - th * 0.85) / 0.15;
    const a = isKeep ? 1 : Math.max(0, Math.min(1, local));
    if (a <= 0) continue;
    out.push(<div key={`${r}-${c}`} style={{position: 'absolute', left: c * cell, top: r * cell, width: cell + 0.5, height: cell + 0.5, background: isKeep && keepColor ? keepColor : color, opacity: a < 0.5 ? 0.45 : 1}} />);
  }
  return <div style={{position: 'absolute', inset: 0, zIndex: 100, pointerEvents: 'none'}}>{out}</div>;
};

/** Circle reveal from a point. */
export const CircleReveal: React.FC<{at: number; dur?: number; x: number; y: number; children: React.ReactNode}> = ({at, dur = 9, x, y, children}) => {
  const g = useG();
  const r = interpolate(g, [at, at + dur], [0, 2300], {...clamp, easing: easeIn});
  if (g < at) return null;
  return <div style={{position: 'absolute', inset: 0, clipPath: `circle(${r}px at ${x}px ${y}px)`}}>{children}</div>;
};

/**
 * Focus dissolve: blur-out → a few frames of empty glow → blur-in AT THE SAME SPOT.
 * Wrap the outgoing content with mode "out" ending at `at`, the incoming with mode "in" starting at `at + gap`.
 */
export const Focus: React.FC<{mode: 'in' | 'out'; at: number; dur?: number; children: React.ReactNode}> = ({mode, at, dur = 6, children}) => {
  const g = useG();
  const k = mode === 'in' ? p(g, at, at + dur) : 1 - p(g, at - dur, at, easeIn);
  return <div style={{position: 'absolute', inset: 0, opacity: k, filter: `blur(${(1 - k) * 14}px)`, transform: `scale(${0.97 + 0.03 * k})`}}>{children}</div>;
};

/** Scale-through: exit shrinks toward centre, entry grows from 0.6. */
export const ScaleThrough: React.FC<{inAt?: number; outAt?: number; children: React.ReactNode}> = ({inAt, outAt, children}) => {
  const g = useG();
  const i = inAt === undefined ? 1 : p(g, inAt, inAt + 5);
  const o = outAt === undefined ? 0 : p(g, outAt - 5, outAt, easeIn);
  const s = (0.6 + 0.4 * i) * (1 - 0.6 * o);
  return <div style={{position: 'absolute', inset: 0, transform: `scale(${s})`, opacity: Math.min(i, 1 - o)}}>{children}</div>;
};

/**
 * Rectangle morph: one element's box tweens from rect A to rect B (pill → card → full-frame background).
 * Use it to make the hero object BECOME the next scene.
 */
export type Rect = {x: number; y: number; w: number; h: number; r: number};
export const MorphRect: React.FC<{a: Rect; b: Rect; from: number; to: number; style?: React.CSSProperties; children?: React.ReactNode}> = ({a, b, from, to, style, children}) => {
  const g = useG();
  const k = p(g, from, to, easeInOut);
  const L = (u: number, v: number) => u + (v - u) * k;
  return <div style={{position: 'absolute', left: L(a.x, b.x), top: L(a.y, b.y), width: L(a.w, b.w), height: L(a.h, b.h), borderRadius: L(a.r, b.r), overflow: 'hidden', ...style}}>{children}</div>;
};

/** Playhead wipe: a vertical line sweeps, revealing scene B on its left. */
export const PlayheadWipe: React.FC<{x: number; color?: string; a: React.ReactNode; b: React.ReactNode}> = ({x, color = '#3EF0A8', a, b}) => (
  <div style={{position: 'absolute', inset: 0}}>
    <div style={{position: 'absolute', inset: 0}}>{a}</div>
    <div style={{position: 'absolute', inset: 0, clipPath: `inset(0 ${100 - x}% 0 0)`}}>{b}</div>
    <div style={{position: 'absolute', top: 0, bottom: 0, left: `${x}%`, width: 4, marginLeft: -2, background: color, boxShadow: `0 0 12px ${color}`}} />
  </div>
);

/** Dip to black between chapters. */
export const Dip: React.FC<{at: number; out?: number; inn?: number}> = ({at, out = 13, inn = 16}) => {
  const g = useG();
  const o = interpolate(g, [at - out, at, at + inn], [0, 1, 0], clamp);
  return o > 0 ? <div style={{position: 'absolute', inset: 0, background: '#000', opacity: o, zIndex: 90}} /> : null;
};

export {easeOut};
