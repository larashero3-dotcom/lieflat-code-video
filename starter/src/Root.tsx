import React from 'react';
import {Composition} from 'remotion';
import {ExampleFilm} from './Video';
import {film} from './film';

export const Root: React.FC = () => (
  <Composition id="Film" component={ExampleFilm} durationInFrames={film.duration} fps={film.fps} width={film.width} height={film.height} defaultProps={{blur: true}} />
);
