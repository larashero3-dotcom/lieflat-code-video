import assert from 'node:assert/strict';
import {test} from 'node:test';
import {defineFilm, type Film} from '../src/kit/timeline';

const fixture = (): Film => ({
  fps: 30, width: 1920, height: 1080, duration: 60,
  sections: [
    {id: 'a', from: 0, to: 30, role: 'hook', density: 'mid', fill: 0.6},
    {id: 'b', from: 30, to: 60, role: 'end', density: 'still', fill: 0.2},
  ],
  transitions: [{at: 30, from: 'a', to: 'b', carry: 'same-position'}],
  events: [{at: 20, kind: 'click'}, {at: 5.5, kind: 'pop'}],
});

test('accepts adjacent sections, sorts a copy, preserves fractional event timing', () => {
  const input = fixture();
  input.sections.reverse();
  const result = defineFilm(input);
  assert.deepEqual(result.sections.map(s => s.id), ['a', 'b']);
  assert.deepEqual(result.events.map(e => e.at), [5.5, 20]);
  assert.equal(input.sections[0].id, 'b');
  assert.equal(input.events[0].at, 20);
});

const invalid: [string, (f: Film) => void, RegExp][] = [
  ['overlapping sections', f => {f.sections[1].from = 29;}, /overlaps/],
  ['gap between sections', f => {f.sections[1].from = 31;}, /gap/],
  ['gap at the start', f => {f.sections[0].from = 1;}, /gap/],
  ['uncovered ending', f => {f.sections[1].to = 59;}, /full film/],
  ['empty timeline', f => {f.sections = [];}, /at least one/],
  ['duplicate section IDs', f => {f.sections[1].id = 'a';}, /duplicated/],
  ['invalid section bound', f => {f.sections[0].from = NaN;}, /bounds/],
  ['zero-length section', f => {f.sections[0].to = 0;}, /to <= from/],
  ['invalid frame rate', f => {f.fps = 0;}, /film.fps/],
  ['fractional duration', f => {f.duration = 60.5;}, /film.duration/],
  ['unknown transition target', f => {f.transitions[0].to = 'missing';}, /unknown section/],
  ['transition past the end', f => {f.transitions[0].at = 60;}, /frame outside/],
  ['negative event time', f => {f.events[0].at = -1;}, /frame outside/],
  ['invalid event time', f => {f.events[0].at = Infinity;}, /frame outside/],
  ['event crossing the end', f => {f.events[0].dur = 41;}, /duration outside/],
];
for (const [name, mutate, expected] of invalid) {
  test(`rejects ${name}`, () => {
    const film = fixture();
    mutate(film);
    assert.throws(() => defineFilm(film), expected);
  });
}
