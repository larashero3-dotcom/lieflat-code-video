/**
 * Timeline as data. Every section, transition and sound-worthy event of the film lives in one object
 * (see src/film.ts). Scenes read their timing from it, scripts/check.ts grades it against the craft rules,
 * and scripts/export-events.ts hands the events to the audio mixer. Never hard-code a beat time in a scene.
 */

export type Role = 'hook' | 'problem' | 'claim' | 'demo' | 'proof' | 'breath' | 'burst' | 'climax' | 'cta' | 'end';
export type Density = 'still' | 'calm' | 'mid' | 'fast';

export interface Section {
  id: string;
  from: number; // frame, inclusive
  to: number; // frame, exclusive
  role: Role;
  density: Density;
  /** Width of the lead subject as a fraction of frame width (0–1). Breaths and end cards may be small. */
  fill: number;
  note?: string;
}

/**
 * How the eye is carried across a scene change.
 * Everything except 'cut' carries something. A 'cut' must name its `motive` (cause→effect, same element at the
 * same position, palette flip as punctuation) or the checker fails it.
 */
export type Carry =
  | 'morph' // the outgoing object becomes the incoming one
  | 'zoom-in' // push into a child element until it is the next frame
  | 'zoom-out' // the whole frame shrinks into a thumbnail/tile of the next frame
  | 'scale-through' // shrink to centre, next grows from centre
  | 'same-position' // a persistent element stays at the same screen spot across the change
  | 'fly-through' // a foreground element passes the lens revealing a pre-positioned scene
  | 'whip' // directional motion-blur pan; direction continues
  | 'pixel' // brand pixel/tile wipe
  | 'focus-dissolve' // blur out → 2–4 f empty glow → blur in at the same spot
  | 'camera' // continuous camera move on one canvas
  | 'dip' // dip to black between chapters
  | 'cut';

export interface Transition {
  at: number;
  from: string; // section id
  to: string; // section id
  carry: Carry;
  /** What the viewer's eye follows across the change ("send button", "prompt bar", "cursor + key chip"). */
  carrier?: string;
  /** Required for carry: 'cut'. */
  motive?: string;
}

export type EvKind =
  | 'key' // one keystroke (desktop)
  | 'pkey' // one keystroke (phone)
  | 'click' // cursor click
  | 'tap' // finger tap
  | 'tick' // small confirmation (check mark, list row)
  | 'pop' // element appears with a spring
  | 'ready' // status pill / success pop
  | 'chime' // positive confirmation (copied, tests pass)
  | 'swish' // short soft transition air
  | 'whoosh' // scene transition
  | 'dive' // long accelerating whoosh (zoom-into)
  | 'pixel' // pixel/tile wipe texture
  | 'hit' // type slam / impact
  | 'lock' // logo lock / final settle
  | 'state' // visible state change with no sound of its own (counts for rhythm)
  | 'reveal' // a key reveal (checker wants a silence before at least one)
  | 'silence'; // music drop-out; needs `dur`

export interface Ev {
  at: number;
  kind: EvKind;
  dur?: number; // frames (silence, long sounds)
  gain?: number; // dB offset for this event
  hero?: boolean; // hero moments are mixed louder and exempt from the micro cap
  note?: string;
}

export interface Film {
  fps: number;
  width: number;
  height: number;
  duration: number; // frames
  bpm?: number;
  /** Frame that sits exactly on a beat (usually the logo lock / music landmark). */
  beatAnchor?: number;
  sections: Section[];
  transitions: Transition[];
  events: Ev[];
}

export const defineFilm = (f: Film): Film => {
  for (const key of ['fps', 'width', 'height', 'duration'] as const) {
    if (!Number.isFinite(f[key]) || f[key] <= 0 || (key !== 'fps' && !Number.isInteger(f[key]))) {
      throw new Error(`film.${key}: expected a positive ${key === 'fps' ? 'number' : 'integer'}`);
    }
  }
  if (!f.sections.length) throw new Error('film.sections: at least one section is required');
  const s = [...f.sections].sort((a, b) => a.from - b.from);
  const ids = new Set<string>();
  s.forEach((x, i) => {
    if (!x.id || ids.has(x.id)) throw new Error(`section id is empty or duplicated: ${x.id}`);
    ids.add(x.id);
    if (!Number.isFinite(x.from) || !Number.isFinite(x.to) || x.from < 0 || x.to > f.duration) {
      throw new Error(`section ${x.id}: bounds must be within the film`);
    }
    if (x.to <= x.from) throw new Error(`section ${x.id}: to <= from`);
    const previousEnd = i > 0 ? s[i - 1].to : 0;
    if (x.from < previousEnd) throw new Error(`section ${x.id} overlaps ${s[i - 1].id}`);
    if (x.from > previousEnd) throw new Error(`gap before section ${x.id}`);
  });
  if (s[s.length - 1].to !== f.duration) throw new Error('sections must cover the full film duration');
  const assertFrame = (at: number, label: string) => {
    if (!Number.isFinite(at) || at < 0 || at >= f.duration) throw new Error(`${label}: frame outside film`);
  };
  f.transitions.forEach((t) => {
    assertFrame(t.at, 'transition');
    if (!ids.has(t.from) || !ids.has(t.to)) throw new Error(`transition at ${t.at}: unknown section ${t.from}/${t.to}`);
  });
  f.events.forEach((e) => {
    assertFrame(e.at, 'event');
    if (e.dur !== undefined && (!Number.isFinite(e.dur) || e.dur <= 0 || e.at + e.dur > f.duration)) {
      throw new Error(`event at ${e.at}: duration outside film`);
    }
  });
  return {...f, sections: s, events: [...f.events].sort((a, b) => a.at - b.at)};
};

/** Frame of beat k relative to the anchor (k may be fractional: 0.5 = off-beat). */
export const beatFrame = (film: Pick<Film, 'fps' | 'bpm' | 'beatAnchor'>, k: number) => {
  if (!film.bpm) throw new Error('film.bpm not set');
  return (film.beatAnchor ?? 0) + (k * 60 * film.fps) / film.bpm;
};

/** Nearest beat index for a frame. */
export const beatIndex = (film: Pick<Film, 'fps' | 'bpm' | 'beatAnchor'>, frame: number) =>
  Math.round(((frame - (film.beatAnchor ?? 0)) * (film.bpm ?? 120)) / (60 * film.fps));

export const section = (film: Film, id: string) => {
  const s = film.sections.find((x) => x.id === id);
  if (!s) throw new Error(`no section ${id}`);
  return s;
};

/**
 * Typing helper: returns the visible text for a frame plus one key event per character.
 * Use the same call in the scene (text) and in film.ts (events) so sound and picture never drift.
 */
export const typing = (text: string, start: number, cps: number, fps = 30, kind: 'key' | 'pkey' = 'key') => {
  const perChar = fps / cps;
  return {
    end: start + text.length * perChar,
    at: (frame: number) => text.slice(0, Math.max(0, Math.min(text.length, Math.floor((frame - start) / perChar)))),
    events: Array.from({length: text.length}, (_, i): Ev => ({at: start + (i + 1) * perChar, kind})),
  };
};
