import React from 'react';
import {AbsoluteFill, Freeze, useCurrentFrame, useVideoConfig} from 'remotion';

/**
 * Temporal supersampling for an OPAQUE composition.
 * Layer i has opacity 1/(i+1): after n layers, every sample contributes 1/n.
 * Normal alpha composition avoids filter + plus-lighter artifacts on transformed UI.
 * Keep an opaque background inside children; this is not a transparent-video compositor.
 */
export const MotionBlur: React.FC<{children: React.ReactNode; samples?: number; shutterAngle?: number}> = ({
  children, samples = 6, shutterAngle = 180,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  if (!Number.isInteger(samples) || samples < 1 || samples > 32) {
    throw new Error('MotionBlur samples must be an integer from 1 to 32.');
  }
  if (!Number.isFinite(shutterAngle) || shutterAngle < 0 || shutterAngle > 360) {
    throw new Error('MotionBlur shutterAngle must be between 0 and 360.');
  }
  return <AbsoluteFill style={{isolation: 'isolate'}}>
    {Array.from({length: samples}, (_, i) => {
      const offset = samples === 1 ? 0 : (i / (samples - 1) - 0.5) * shutterAngle / 360;
      const sampleFrame = Math.max(0, Math.min(durationInFrames - 1, frame + offset));
      return <AbsoluteFill key={i} style={{opacity: 1 / (i + 1)}}>
        <Freeze frame={sampleFrame}>{children}</Freeze>
      </AbsoluteFill>;
    })}
  </AbsoluteFill>;
};
