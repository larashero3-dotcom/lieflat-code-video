/**
 * Checks src/film.ts for pacing, continuity and readable timing.
 * Run: npm run check        (exit code 1 if any FAIL)
 * These are timing heuristics for this starter, not a substitute for visual review.
 */
import {film, PROMPT, CLICK} from '../src/film';
import type {Ev, Section} from '../src/kit/timeline';

type Row = {rule: string; value: string; target: string; level: 'PASS' | 'WARN' | 'FAIL'; hint?: string};
const rows: Row[] = [];
const add = (rule: string, ok: boolean, value: string, target: string, hint?: string, warnOnly = false) =>
  rows.push({rule, value, target, level: ok ? 'PASS' : warnOnly ? 'WARN' : 'FAIL', hint: ok ? undefined : hint});

const fps = film.fps;
const S = film.sections;
const T = film.transitions;
const E = film.events;
const len = (s: Section) => s.to - s.from;
const sec = (f: number) => (f / fps).toFixed(2) + 's';

add('Prompt completes before send', PROMPT.end <= CLICK, `${PROMPT.end.toFixed(1)} ≤ ${CLICK}`, 'typing end ≤ click', 'Shorten content.prompt or move CLICK and the following events later.');

// 1. carried transitions
const carried = T.filter((t) => t.carry !== 'cut').length;
const carriedPct = T.length ? (carried / T.length) * 100 : 100;
add('Carried transitions', carriedPct >= 75, `${carriedPct.toFixed(0)}% (${carried}/${T.length})`, '≥ 75%',
  'Replace hard cuts with morph / zoom / same-position / scale-through. Name the carrier for each transition.');

// 2. unmotivated cuts
const badCuts = T.filter((t) => t.carry === 'cut' && !t.motive);
add('Unmotivated hard cuts', badCuts.length === 0, `${badCuts.length}`, '0',
  `Give each cut a motive (cause→effect, same element same spot, palette flip): ${badCuts.map((t) => sec(t.at)).join(', ')}`);

// 3. carriers named
const unnamed = T.filter((t) => t.carry !== 'cut' && t.carry !== 'dip' && !t.carrier);
add('Every carried transition names its carrier', unnamed.length === 0, `${unnamed.length} missing`, '0',
  `If you cannot name what the eye follows, it is not carried: ${unnamed.map((t) => sec(t.at)).join(', ')}`, true);

// 4. section length contrast
const body = S.filter((s) => s.role !== 'end');
const lens = body.map(len);
const ratio = Math.max(...lens) / Math.max(1, Math.min(...lens));
add('Longest : shortest section', ratio >= 6, `${ratio.toFixed(1)} : 1`, '≥ 6 : 1', 'Make the main demo long (6–14 s) and breaths/bridges short (0.5–2 s).');

// 5. no metronome: 3 consecutive sections within ±15 % length
let metronome = '';
for (let i = 2; i < body.length; i++) {
  const [a, b, c] = [len(body[i - 2]), len(body[i - 1]), len(body[i])];
  const m = (a + b + c) / 3;
  if ([a, b, c].every((x) => Math.abs(x - m) / m <= 0.15)) metronome += `${body[i - 2].id}/${body[i - 1].id}/${body[i].id} `;
}
add('No 3 consecutive sections of equal length', !metronome, metronome || 'none', 'none', 'Vary adjacent section lengths by > 15%.');

// 6. breath after every fast section
const missingBreath: string[] = [];
S.forEach((s, i) => {
  const fast = s.density === 'fast' || s.role === 'burst' || s.role === 'climax';
  const next = S[i + 1];
  if (fast && next && !(next.density === 'calm' || next.density === 'still' || next.role === 'breath' || next.role === 'end')) missingBreath.push(s.id);
});
add('A breath follows every fast passage', missingBreath.length === 0, missingBreath.join(', ') || 'ok', 'all', 'Insert a 1–3 s calm section (one small subject + micro-motion) after each burst.');

// 7. change density
const silentKinds = new Set(['key', 'pkey', 'swish', 'whoosh', 'dive', 'pixel', 'silence']);
let changes = 0;
let lastKey = -99;
for (const e of E) {
  if (e.kind === 'key' || e.kind === 'pkey') {
    if (e.at - lastKey > fps * 0.5) changes++; // a typing run counts once
    lastKey = e.at;
  } else if (!silentKinds.has(e.kind)) changes++;
}
const changeRatio = changes / Math.max(1, T.length);
add('Visible changes per scene change', changeRatio >= 4, `${changeRatio.toFixed(1)} (${changes}/${T.length})`, '≥ 4',
  'Cut rarely, change often: add state changes inside shots (typing, ticks, counters, swaps) instead of more cuts.');

// 8. fill
const small = S.filter((s) => !['breath', 'end', 'claim'].includes(s.role) && s.fill < 0.5);
add('Lead subject ≥ 50% frame width (non-breath)', small.length === 0, small.map((s) => `${s.id}=${s.fill}`).join(', ') || 'ok', '≥ 0.5',
  'Scale UI 2–3× real size, crop it through frame edges, push in rather than shrink.');

// 9. dead air: longest gap without any change event inside a non-end section
let worst = 0;
let worstAt = 0;
for (const s of S.filter((x) => x.role !== 'end')) {
  const marks = [s.from, ...E.filter((e) => e.at >= s.from && e.at < s.to && (e.kind === 'key' || e.kind === 'pkey' || !silentKinds.has(e.kind))).map((e) => e.at), ...T.filter((t) => t.at >= s.from && t.at <= s.to).map((t) => t.at), s.to].sort((a, b) => a - b);
  for (let i = 1; i < marks.length; i++) if (marks[i] - marks[i - 1] > worst) { worst = marks[i] - marks[i - 1]; worstAt = marks[i - 1]; }
}
add('Longest stretch without a change (non-end)', worst <= fps * 2.5, `${sec(worst)} at ${sec(worstAt)}`, '≤ 2.5 s',
  'Add a state change, or make sure the camera drifts and something micro-moves there.', true);

// 10. beat alignment
if (film.bpm) {
  const half = (30 * fps) / film.bpm; // frames per half-beat
  const anchor = film.beatAnchor ?? 0;
  const keyMoments = [...T.map((t) => t.at), ...E.filter((e) => e.hero || ['click', 'tap', 'hit', 'lock', 'reveal', 'chime'].includes(e.kind)).map((e) => e.at)];
  const off = (f: number) => { const x = (((f - anchor) % half) + half) % half; return Math.min(x, half - x); };
  const on = keyMoments.filter((f) => off(f) <= fps * 0.05).length;
  const pct = keyMoments.length ? (on / keyMoments.length) * 100 : 100;
  add('Key moments on the half-beat grid (±50 ms)', pct >= 70, `${pct.toFixed(0)}% (${on}/${keyMoments.length})`, '≥ 70%', 'Move the picture onto the grid with beatFrame(film, k); start moves ~3 f early so they LAND on the beat.');
} else add('Key moments on the half-beat grid', false, 'no bpm', 'set film.bpm', 'Pick the music first, then set bpm + beatAnchor.', true);

// 11. silence before a reveal
const reveals = E.filter((e) => e.kind === 'reveal' || e.hero);
const silences = E.filter((e) => e.kind === 'silence');
const primed = reveals.filter((r) => silences.some((s) => Math.abs(s.at + (s.dur ?? 0) - r.at) <= 3));
add('A music drop-out primes at least one reveal', primed.length >= 1, `${primed.length}`, '≥ 1', 'Add {kind:"silence", dur:15} ending exactly on your biggest reveal.', true);

// 12. end hold
const end = S.find((s) => s.role === 'end');
add('End card hold', !!end && len(end) >= fps * 3, end ? sec(len(end)) : 'none', '≥ 3 s', 'Hold the logo for at least 3 seconds.');

// 13. timeline integrity
const last = Math.max(...S.map((s) => s.to));
add('Sections cover the film', last === film.duration && S[0].from === 0, `0–${last} of ${film.duration}`, 'exact');

// report
const pad = (s: string, n: number) => (s + ' '.repeat(n)).slice(0, n);
console.log(`\n${pad('RULE', 46)}${pad('VALUE', 30)}${pad('TARGET', 12)}RESULT`);
for (const r of rows) {
  console.log(`${pad(r.rule, 46)}${pad(r.value, 30)}${pad(r.target, 12)}${r.level}`);
  if (r.hint) console.log(`    → ${r.hint}`);
}
const fails = rows.filter((r) => r.level === 'FAIL').length;
const warns = rows.filter((r) => r.level === 'WARN').length;
console.log(`\n${fails} fail, ${warns} warn, ${rows.length - fails - warns} pass\n`);
process.exit(fails ? 1 : 0);

export type {Ev};
