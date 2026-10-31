import React from 'react';
import {interpolate, interpolateColors} from 'remotion';
import {clamp, easeIn, easeOut, p, sp} from './motion';
import {useG} from './clock';

/**
 * A sentence whose words change IN PLACE.
 * states: [{at, text, accent?}] in GLOBAL frames. Words that differ from the previous state blur in with a
 * 3-frame stagger; the newest word is tinted `fresh` and settles to its colour over `settle` frames;
 * words listed in `accent` keep the accent colour.
 */
export type HState = {at: number; text: string; accent?: string[]};
export const Headline: React.FC<{
  states: HState[];
  size?: number;
  color?: string;
  accent?: string;
  fresh?: string;
  settle?: number;
  align?: 'center' | 'left';
  exitAt?: number;
  font?: string;
  weight?: number;
  style?: React.CSSProperties;
}> = ({states, size = 72, color = '#111', accent = '#2F80F5', fresh, settle = 10, align = 'center', exitAt, font, weight = 600, style}) => {
  const g = useG();
  let idx = -1;
  states.forEach((s, i) => { if (g >= s.at) idx = i; });
  if (idx < 0) return null;
  const st = states[idx];
  const words = st.text.split(' ');
  const prev = idx > 0 ? states[idx - 1].text.split(' ') : [];
  const exit = exitAt !== undefined ? p(g, exitAt, exitAt + 9, easeIn) : 0;
  let n = 0;
  return (
    <div style={{display: 'flex', justifyContent: align === 'center' ? 'center' : 'flex-start', gap: `0 ${size * 0.24}px`, whiteSpace: 'nowrap',
      fontFamily: font, fontSize: size, fontWeight: weight, letterSpacing: -size * 0.035, lineHeight: 1.12,
      opacity: 1 - exit, filter: `blur(${exit * 14}px)`, ...style}}>
      {words.map((w, i) => {
        const isNew = prev[i] !== w;
        const d = isNew ? st.at + n++ * 3 : -9999;
        const k = p(g, d, d + 6);
        const isAcc = st.accent?.includes(w.replace(/[.,!?:;]/g, ''));
        const base = isAcc ? accent : color;
        const c = fresh && isNew ? interpolateColors(g, [d + 4, d + 4 + settle], [fresh, base]) : base;
        return (
          <span key={`${idx}-${i}-${w}`} style={{display: 'inline-block', color: c, opacity: k, filter: `blur(${(1 - k) * 8}px)`,
            transform: `translateX(${(1 - k) * size * 0.18}px)`}}>{w}</span>
        );
      })}
    </div>
  );
};

/** A big word that slams in on one axis with overshoot and entry blur. */
export const Slam: React.FC<{at: number; text: string; size: number; color?: string; from?: 'left' | 'right' | 'bottom' | 'top' | 'scale'; weight?: number; font?: string; style?: React.CSSProperties}> = ({
  at, text, size, color = '#111', from = 'scale', weight = 800, font, style,
}) => {
  const g = useG();
  if (g < at - 1) return null;
  const s = sp(g, at, 13, 220);
  const k = 1 - Math.min(1, s);
  const d = 1300;
  const tx = from === 'left' ? -d * k : from === 'right' ? d * k : 0;
  const ty = from === 'bottom' ? d * 0.6 * k : from === 'top' ? -d * 0.6 * k : 0;
  const sc = from === 'scale' ? 1 + k * 0.6 : 0.92 + 0.08 * s;
  return (
    <div style={{fontFamily: font, fontSize: size, fontWeight: weight, letterSpacing: -size * 0.05, color, lineHeight: 0.95, whiteSpace: 'nowrap',
      transform: `translate(${tx}px, ${ty}px) scale(${sc})`, filter: `blur(${Math.min(18, k * 40)}px)`, ...style}}>{text}</div>
  );
};

/**
 * Slot wheel. The varying word scrolls inside a fixed pill while the rest of
 * the line holds still. `stepAt` = global frames of each step; make the gaps GROW (e.g. 7 → 12 f) so it lands.
 */
export const SlotWheel: React.FC<{items: string[]; stepAt: number[]; size: number; color?: string; activeColor?: string; pitch?: number; font?: string}> = ({
  items, stepAt, size, color = '#fff', activeColor = '#9A4DF5', pitch, font,
}) => {
  const g = useG();
  const P = pitch ?? size * 1.75;
  let pos = 0;
  stepAt.forEach((t) => { pos += p(g, t, t + 4); });
  const moving = stepAt.some((t) => g >= t && g < t + 4);
  return (
    <div style={{position: 'relative', height: P, display: 'inline-block', verticalAlign: 'middle', fontFamily: font}}>
      {items.map((w, i) => {
        const d = i - pos;
        const a = Math.abs(d);
        if (a > 2.6) return null;
        return (
          <div key={w} style={{position: 'absolute', left: 0, top: d * P, height: P, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', fontSize: size,
            fontWeight: 600, color: a < 0.5 && !moving ? activeColor : color, opacity: [1, 0.75, 0.4, 0.15][Math.min(3, Math.round(a))],
            filter: `blur(${[0, 1, 3, 6][Math.min(3, Math.round(a))] + (moving ? 2 : 0)}px)`}}>{w}</div>
        );
      })}
      <span style={{visibility: 'hidden', fontSize: size, fontWeight: 600, whiteSpace: 'nowrap'}}>{items[Math.round(Math.min(items.length - 1, pos))]}</span>
    </div>
  );
};

/** One-frame scale cut ("punch-in"). No interpolation on the jump, then a 3 % settle. */
export const PunchIn: React.FC<{at: number; scale?: number; children: React.ReactNode; origin?: string}> = ({at, scale = 2.4, children, origin = 'center'}) => {
  const g = useG();
  const k = g < at ? 1 : scale * interpolate(g, [at, at + 16], [1.02, 1], {...clamp, easing: easeOut});
  return <div style={{transform: `scale(${k})`, transformOrigin: origin}}>{children}</div>;
};

/** Highlight sweep behind words. */
export const Highlight: React.FC<{at: number; color?: string; dur?: number; children: React.ReactNode}> = ({at, color = '#D5E3FA', dur = 7, children}) => {
  const g = useG();
  return (
    <span style={{position: 'relative', display: 'inline-block'}}>
      <span style={{position: 'absolute', left: '-0.08em', right: '-0.08em', top: '0.08em', bottom: '0.02em', background: color, borderRadius: 4,
        transformOrigin: 'left', transform: `scaleX(${p(g, at, at + dur)})`}} />
      <span style={{position: 'relative'}}>{children}</span>
    </span>
  );
};

/** Typed text with a caret. Pair with timeline.typing() so key SFX match. */
export const Typed: React.FC<{text: string; caret?: boolean; caretColor?: string}> = ({text, caret = true, caretColor = 'currentColor'}) => {
  const g = useG();
  return (
    <span>
      {text}
      {caret && <span style={{display: 'inline-block', width: '0.08em', height: '1.05em', background: caretColor, marginLeft: '0.04em', verticalAlign: '-0.15em', opacity: Math.floor(g / 8) % 2 ? 0.25 : 1}} />}
    </span>
  );
};

/** Number that counts up with an ease-out. */
export const CountUp: React.FC<{from: number; to: number; start: number; dur?: number; format?: (n: number) => string}> = ({from, to, start, dur = 24, format = (n) => Math.round(n).toLocaleString('en-US')}) => {
  const g = useG();
  return <>{format(from + (to - from) * p(g, start, start + dur))}</>;
};
