/**
 * Lens helpers — the small camera / time tools behind the reference sheet `lens/` (numbered examples in lens/index.html).
 * Everything is a pure function of the frame. Use them inside fragments or moves; they do not need the skeleton.
 *
 *   handheld(g)            → {x, y, rot}   organic micro-shake for a camera (lens 18)
 *   dutch(g, at, deg)      → degrees        eased tilt in and back out (lens 19)
 *   <Parallax>             layers that slide at different speeds against one camera x (lens 20)
 *   timeline remaps        freezeAt (31), slowMo (57), speedRamp (29): map film frame → content frame
 *   <BeforeAfter>          a divider that sweeps between a "before" and an "after" node (lens 60)
 *   loopPhase(g, len)      0..1 phase that makes the last frame equal the first (lens 61)
 */
import React from 'react';
import {interpolate} from 'remotion';
import {clamp, easeInOut} from './motion';

const noise = (t: number, a: number, b: number) => Math.sin(t * a + b) * 0.55 + Math.sin(t * a * 2.31 + b * 1.7) * 0.3 + Math.sin(t * a * 4.7 + b * 0.4) * 0.15;

/** Handheld camera: a few px of drift and a fraction of a degree of roll; `amp` scales it (1 = subtle). */
export const handheld = (g: number, amp = 1, fps = 30) => {
  const t = g / fps;
  return {x: noise(t, 1.3, 1) * 6 * amp, y: noise(t, 1.7, 2) * 4 * amp, rot: noise(t, 0.9, 3) * 0.35 * amp};
};

/** Dutch angle: tilts to `deg` over `dur` frames from `at`, holds, and (if `out` is given) eases back. */
export const dutch = (g: number, at: number, deg = 8, dur = 12, out?: number) => {
  const k = interpolate(g, [at, at + dur], [0, 1], {...clamp, easing: easeInOut});
  const back = out === undefined ? 0 : interpolate(g, [out, out + dur], [0, 1], {...clamp, easing: easeInOut});
  return deg * k * (1 - back);
};

/** Parallax: each layer moves `depth` × camX (depth 0 = locked to screen, 1 = world, >1 = foreground). */
export const Parallax: React.FC<{camX: number; camY?: number; layers: {depth: number; node: React.ReactNode; blur?: number}[]}> = ({camX, camY = 0, layers}) => (
  <>
    {layers.map((l, i) => (
      <div key={i} style={{position: 'absolute', inset: 0, transform: `translate(${-camX * l.depth}px, ${-camY * l.depth}px)`, filter: l.blur ? `blur(${l.blur}px)` : undefined}}>{l.node}</div>
    ))}
  </>
);

/** Freeze frame: content time stops at `at` for `hold` frames, then continues. */
export const freezeAt = (g: number, at: number, hold: number) => (g < at ? g : g < at + hold ? at : g - hold);

/** Slow motion: from `at`, content runs at `rate` (e.g. 0.25) for `dur` film frames, then back to 1×. */
export const slowMo = (g: number, at: number, dur: number, rate = 0.25) => (g < at ? g : g < at + dur ? at + (g - at) * rate : at + dur * rate + (g - at - dur));

/**
 * Speed ramp: piecewise speeds. keys = [[filmFrame, speed], …]; returns the content frame (integrated speed),
 * speed interpolated linearly between keys. Classic ramp: [[0, 2], [20, 0.25], [40, 0.25], [50, 2]].
 */
export const speedRamp = (g: number, keys: [number, number][]) => {
  let f = 0;
  for (let x = 0; x < g; x++) {
    const v = interpolate(x + 0.5, keys.map((k) => k[0]), keys.map((k) => k[1]), clamp);
    f += v;
  }
  return f;
};

/** Before / after: a vertical divider at `k` (0..1 of the width); left shows `before`, right shows `after`. */
export const BeforeAfter: React.FC<{k: number; before: React.ReactNode; after: React.ReactNode; width?: number; height?: number; line?: string}> = ({k, before, after, width = 1920, height = 1080, line = '#fff'}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width, height, overflow: 'hidden'}}>
    <div style={{position: 'absolute', inset: 0}}>{after}</div>
    <div style={{position: 'absolute', inset: 0, clipPath: `inset(0 ${(1 - k) * 100}% 0 0)`}}>{before}</div>
    <div style={{position: 'absolute', top: 0, bottom: 0, left: width * k - 2, width: 4, background: line, boxShadow: '0 0 18px rgba(0,0,0,.18)'}} />
  </div>
);

/** Seamless loop phase: 0..1 over `len` frames, so frame `len` renders exactly like frame 0. */
export const loopPhase = (g: number, len: number) => (((g % len) + len) % len) / len;
