import React from 'react';
import {spring} from 'remotion';
import {p} from './motion';

/**
 * Closed-form-style springs that stay a pure function of the frame.
 * Presets: snappy = buttons, toggles, leading edges · default = cards, containers, camera ·
 * heavy = big type, logos, 3D (no overshoot) · playful = mascots, stickers (visible overshoot).
 * Tiny overshoot on UI, none on type.
 */
export type Preset = 'snappy' | 'default' | 'heavy' | 'playful';
const CFG: Record<Preset, {stiffness: number; mass: number; damping: number}> = {
  snappy: {stiffness: 400, mass: 0.5, damping: 24}, // ζ≈0.85, settles ≈ 5 f
  default: {stiffness: 200, mass: 1, damping: 24}, // ζ≈0.85, settles ≈ 10 f
  heavy: {stiffness: 120, mass: 1.4, damping: 26}, // ζ≈1, no overshoot
  playful: {stiffness: 220, mass: 0.8, damping: 14.6}, // ζ≈0.55, ≈12 % overshoot
};

/** 0→1 spring step starting at frame `at`. */
export const springK = (t: number, at: number, preset: Preset = 'default') =>
  t <= at ? 0 : spring({frame: t - at, fps: 30, config: CFG[preset]});

/**
 * A value that changes target many times: the SUM of one spring per change, each starting at its own frame.
 * Never restarts, never jumps, and frame 812 renders without simulating 0–811. keys: [[frame, value], …].
 */
export const track = (t: number, keys: [number, number][], preset: Preset = 'default') => {
  let v = keys[0][1];
  for (let i = 1; i < keys.length; i++) v += (keys[i][1] - keys[i - 1][1]) * springK(t, keys[i][0], preset);
  return v;
};

/**
 * Two edges of one bar/indicator on their own springs: the edge in the direction of travel leads (snappy),
 * the other trails (default), so the bar stretches while it moves — the "liquid" tab/toggle look.
 * keys: [[frame, startEdge, endEdge], …]. Returns [startEdge, endEdge].
 */
export const edges = (t: number, keys: [number, number, number][]): [number, number] => {
  let a = keys[0][1];
  let b = keys[0][2];
  for (let i = 1; i < keys.length; i++) {
    const da = keys[i][1] - keys[i - 1][1];
    const db = keys[i][2] - keys[i - 1][2];
    const fwd = da + db > 0;
    a += da * springK(t, keys[i][0], fwd ? 'default' : 'snappy');
    b += db * springK(t, keys[i][0], fwd ? 'snappy' : 'default');
  }
  return [a, b];
};

/**
 * Content that swaps inside a morphing container: the old content blurs out, the new blurs in 2 f later,
 * each with its own timing so text never overlaps. items: [{at, node}] in frames, ascending.
 */
export const Swap: React.FC<{t: number; items: {at: number; node: React.ReactNode}[]; out?: number; inn?: number; blur?: number}> = ({t, items, out = 5, inn = 8, blur = 10}) => (
  <>
    {items.map((it, i) => {
      const next = items[i + 1]?.at ?? Infinity;
      if (t < it.at || t > next + out) return null;
      const kin = i === 0 && it.at <= 0 ? 1 : p(t, it.at + 2, it.at + 2 + inn);
      const kout = next === Infinity ? 1 : 1 - p(t, next, next + out, (x) => x);
      const k = Math.min(kin, kout);
      if (k <= 0) return null;
      return (
        <div key={i} style={{position: 'absolute', inset: 0, opacity: k, filter: k < 1 ? `blur(${(1 - k) * blur}px)` : undefined, transform: `scale(${0.97 + 0.03 * kin})`}}>{it.node}</div>
      );
    })}
  </>
);
