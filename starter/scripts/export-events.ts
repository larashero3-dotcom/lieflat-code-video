/** Writes out/events.json as timing cues for an external audio editor. Run: npm run events */
import {mkdirSync, writeFileSync} from 'node:fs';
import {film} from '../src/film';

mkdirSync('out', {recursive: true});
writeFileSync('out/events.json', JSON.stringify({fps: film.fps, duration: film.duration, bpm: film.bpm, beatAnchor: film.beatAnchor, events: film.events, transitions: film.transitions}, null, 1));
console.log(`wrote out/events.json (${film.events.length} events)`);
