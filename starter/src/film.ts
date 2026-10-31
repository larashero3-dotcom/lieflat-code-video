/**
 * THE TIMELINE. Edit this first (sections → transitions → events), run `npm run check`, then build scenes.
 * Pure data: import only from ./kit/timeline here so the checker can run it without a browser.
 *
 * Example: a 12 s "one-shot morph" film for a fictional notes app.
 */
import {beatFrame, defineFilm, typing} from './kit/timeline';
import {content} from './content';

const base = {fps: 30, bpm: 120, beatAnchor: 300}; // timing grid anchored at 10 s
export const B = (k: number) => beatFrame(base, k); // B(0) = 300, B(-1) = 285 …

export const PROMPT = typing(content.prompt, B(-17), 12);
export const CLICK = B(-10); // send, on a beat
export const TICKS = [B(-8), B(-7), B(-6)];

export const film = defineFilm({
  ...base,
  width: 1920,
  height: 1080,
  duration: 360,
  sections: [
    {id: 'hook', from: 0, to: B(-18), role: 'hook', density: 'mid', fill: 0.6, note: 'pill + headline builds'},
    {id: 'demo', from: B(-18), to: B(-5), role: 'demo', density: 'mid', fill: 0.75, note: 'type → send → summary card grows out of the composer'},
    {id: 'breath', from: B(-5), to: B(-3), role: 'breath', density: 'calm', fill: 0.3, note: 'slot wheel: notes / docs / plans'},
    {id: 'end', from: B(-3), to: 360, role: 'end', density: 'still', fill: 0.2, note: 'wordmark'},
  ],
  transitions: [
    {at: B(-18), from: 'hook', to: 'demo', carry: 'morph', carrier: 'headline pill widens into the composer'},
    {at: B(-5), from: 'demo', to: 'breath', carry: 'scale-through', carrier: 'summary card shrinks to centre, slot pill grows there'},
    {at: B(-3), from: 'breath', to: 'end', carry: 'same-position', carrier: 'active slot word becomes the wordmark'},
  ],
  events: [
    {at: 4, kind: 'pop'},
    ...PROMPT.events,
    {at: CLICK, kind: 'click', hero: true},
    {at: CLICK + 4, kind: 'whoosh', gain: -4},
    {at: CLICK + 8, kind: 'state', note: 'card grows'},
    ...TICKS.map((at) => ({at, kind: 'tick' as const})),
    {at: B(-6) + 4, kind: 'chime', hero: true},
    {at: B(-5), kind: 'swish'},
    {at: B(-4.5), kind: 'state'}, {at: B(-4), kind: 'state'}, {at: B(-3.5), kind: 'state'},
    {at: B(-4), kind: 'silence', dur: B(-3) - B(-4)},
    {at: B(-3), kind: 'reveal'},
    {at: B(-3), kind: 'lock'},
  ],
});
