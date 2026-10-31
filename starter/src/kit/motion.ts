import {Easing, interpolate, spring} from 'remotion';

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Entries: strong ease-out (≈70 % of travel in the first 30 % of time). */
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
/** Exits and dives: accelerate into the cut. */
export const easeIn = Easing.bezier(0.55, 0, 0.9, 0.4);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

/** 0→1 progress between frames a and b. */
export const p = (g: number, a: number, b: number, easing = easeOut) => interpolate(g, [a, b], [0, 1], {...clamp, easing});

/** Spring 0→1 starting at frame `at` (slight overshoot by default). */
export const sp = (g: number, at: number, damping = 13, stiffness = 180) =>
  spring({frame: g - at, fps: 30, config: {damping, stiffness, mass: 0.7}});

/** Piecewise keyframes: [[frame, value], …], eased between neighbours. */
export const tween = (g: number, keys: [number, number][], easing = easeInOut) => {
  if (g <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [f1, v1] = keys[i];
    const [f0, v0] = keys[i - 1];
    if (g <= f1) return interpolate(g, [f0, f1], [v0, v1], {...clamp, easing});
  }
  return keys[keys.length - 1][1];
};

/** Deterministic pseudo-random in [0,1). Never use Math.random() — frames must be reproducible. */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Slow drift so no hold is ever frozen (default 3 % of scale per second at 30 fps). */
export const drift = (g: number, from: number, perSecond = 0.03) => 1 + Math.max(0, g - from) * (perSecond / 30);

/** Irregular step index for "slot machine" flicker: steps is a hand-authored list of frame lengths, cycled. */
export const stepIndex = (g: number, start: number, steps: number[]) => {
  let t = start;
  let i = 0;
  while (t + steps[i % steps.length] <= g) {
    t += steps[i % steps.length];
    i++;
  }
  return g < start ? -1 : i;
};
