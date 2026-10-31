import React, {createContext, useContext} from 'react';
import {Sequence, useCurrentFrame} from 'remotion';

/**
 * One clock for the whole film.
 * Remotion's useCurrentFrame() is local to the enclosing <Sequence>, which silently breaks any component
 * whose timings are written in film frames.
 * <Scene> wraps a Sequence and publishes its start, and useG() returns the global frame inside its descendants.
 * Place Scene components at the composition root; do not nest Scene or raw Sequence wrappers.
 * Rule: write every time in global frames and read time with useG(), never useCurrentFrame().
 */
const StartCtx = createContext(0);

export const useG = () => useCurrentFrame() + useContext(StartCtx);

/** A section of the film on the global clock. CSS isolation keeps stacking local so a pointer in one scene never draws over the next. */
export const Scene: React.FC<{from: number; to: number; children: React.ReactNode; name?: string}> = ({from, to, children, name}) => {
  const f = Math.floor(from);
  return (
    <Sequence from={f} durationInFrames={Math.max(1, Math.ceil(to) - f)} name={name} style={{isolation: 'isolate'}}>
      <StartCtx.Provider value={f}>{children}</StartCtx.Provider>
    </Sequence>
  );
};
