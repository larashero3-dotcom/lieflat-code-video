import React from 'react';
import {interpolate} from 'remotion';
import {clamp, tween, easeOut} from './motion';
import {useG} from './clock';

/**
 * macOS pointer at video scale (≥ 3.5 % of frame height ≈ 64 px at 1080p). `path` is [[frame, x, y], …] in
 * global frames; `clicks` are frames where it presses (scale 0.88 for ~6 f). The pointer must always land on the
 * thing that changes next, and never teleport.
 */
export const Pointer: React.FC<{path: [number, number, number][]; clicks?: number[]; size?: number; hand?: boolean; visible?: [number, number]}> = ({path, clicks = [], size = 72, hand, visible}) => {
  const g = useG();
  if (visible && (g < visible[0] || g > visible[1])) return null;
  const x = tween(g, path.map(([f, x]) => [f, x]), easeOut);
  const y = tween(g, path.map(([f, , y]) => [f, y]), easeOut);
  const press = Math.max(0, ...clicks.map((c) => interpolate(g, [c - 2, c, c + 6], [0, 1, 0], clamp)));
  return (
    <div style={{position: 'absolute', left: x, top: y, zIndex: 80, transform: `scale(${1 - press * 0.12})`, transformOrigin: 'top left', filter: 'drop-shadow(0 8px 14px rgba(0,0,0,.3))'}}>
      {hand ? (
        <svg width={size} height={size} viewBox="0 0 24 24" style={{marginLeft: -size * 0.4}}><path d="M9 11V4.5a1.5 1.5 0 0 1 3 0V10l.5-.2V8.5a1.5 1.5 0 0 1 3 0v1.8a1.5 1.5 0 0 1 3 .2v4.5c0 3.6-2.4 6-6 6h-1c-2.2 0-3.6-1-4.8-2.6L4 14.8a1.5 1.5 0 0 1 2.2-2L9 15z" fill="#fff" stroke="#111" strokeWidth="1.3" strokeLinejoin="round" /></svg>
      ) : (
        <svg width={size} height={size} viewBox="0 0 24 24"><path d="M4.5 2.8l14.2 9.3-6.4 1.2 3.8 7.2-2.8 1.4-3.7-7.2-5.1 4.4z" fill="#111" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" /></svg>
      )}
    </div>
  );
};

/** Click feedback ring on the target (pair with Pointer clicks). */
export const ClickRing: React.FC<{at: number; x: number; y: number; color?: string; r?: number}> = ({at, x, y, color = 'rgba(47,128,245,.5)', r = 40}) => {
  const g = useG();
  const k = interpolate(g, [at, at + 12], [0, 1], clamp);
  if (g < at || k >= 1) return null;
  return <div style={{position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: r, border: `${4 * (1 - k)}px solid ${color}`, transform: `scale(${0.6 + k * 1.6})`, opacity: 1 - k, zIndex: 79}} />;
};

/** Finger tap ripple for phone UI. */
export const Tap: React.FC<{at: number; x: number; y: number}> = ({at, x, y}) => {
  const g = useG();
  const k = interpolate(g, [at, at + 14], [0, 1], clamp);
  const pre = interpolate(g, [at - 6, at], [0, 1], clamp);
  if (g < at - 6 || k >= 1) return null;
  return <div style={{position: 'absolute', left: x - 40, top: y - 40, width: 80, height: 80, borderRadius: 40, zIndex: 60, background: `rgba(255,255,255,${0.5 * pre * (1 - k)})`, border: `3px solid rgba(0,0,0,${0.15 * pre * (1 - k)})`, transform: `scale(${0.6 + k * 0.9})`}} />;
};

/** Phone shell. Children render in a 390×844 screen. Scale it big: a hero phone is ≥ 80 % of frame height. */
export const Phone: React.FC<{scale?: number; children: React.ReactNode; dark?: boolean}> = ({scale = 1, children, dark}) => (
  <div style={{width: 418 * scale, height: 872 * scale, borderRadius: 64 * scale, background: '#111', padding: 14 * scale, boxSizing: 'border-box', boxShadow: '0 40px 90px rgba(0,0,0,.3), inset 0 0 0 2px #2a2a2a'}}>
    <div style={{width: 390, height: 844, transform: `scale(${scale})`, transformOrigin: 'top left', borderRadius: 50, overflow: 'hidden', background: dark ? '#000' : '#fff', position: 'relative'}}>
      {children}
      <div style={{position: 'absolute', top: 11, left: 140, width: 110, height: 32, borderRadius: 20, background: '#000', zIndex: 40}} />
    </div>
  </div>
);

/** Browser window chrome. Prefer cropping it off-frame: the UI is the subject, not the window. */
export const Browser: React.FC<{w: number; h: number; url?: string; dark?: boolean; children: React.ReactNode}> = ({w, h, url = '', dark, children}) => (
  <div style={{width: w, height: h, borderRadius: 22, overflow: 'hidden', background: dark ? '#101114' : '#fff', boxShadow: '0 60px 140px rgba(0,30,15,.22), 0 2px 8px rgba(0,0,0,.06)'}}>
    <div style={{height: 46, background: dark ? '#17181c' : '#EEEFF0', display: 'flex', alignItems: 'center', gap: 8, padding: '0 18px'}}>
      {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <span key={c} style={{width: 13, height: 13, borderRadius: 7, background: c}} />)}
      {url && <span style={{margin: '0 auto', fontSize: 15, color: '#888', background: dark ? '#222' : '#fff', borderRadius: 8, padding: '4px 120px'}}>{url}</span>}
    </div>
    <div style={{position: 'relative', height: h - 46}}>{children}</div>
  </div>
);

/** Rounded app/logo tile (integration chains, "agent | system" rows). */
export const AppTile: React.FC<{size?: number; bg?: string; children: React.ReactNode; glow?: string}> = ({size = 176, bg = '#fff', children, glow}) => (
  <div style={{width: size, height: size, borderRadius: size * 0.23, background: bg, display: 'grid', placeItems: 'center', boxShadow: `0 10px 30px rgba(0,0,0,.10)${glow ? `, 0 0 28px ${glow}` : ''}`}}>{children}</div>
);

export {easeOut};

export const Check: React.FC<{size?: number; color?: string}> = ({size = 24, color = '#2FA463'}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.2 4.2L19 7" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" /></svg>
);
