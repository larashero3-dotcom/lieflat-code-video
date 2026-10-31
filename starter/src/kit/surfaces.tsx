import React from 'react';
import {clamp, easeOut, p, rand} from './motion';
import {useG} from './clock';
import {interpolate} from 'remotion';

/**
 * Virtual camera on one continuous canvas. (fx, fy) = world point at screen centre, s = zoom,
 * rx/ry/rz rotate the world around that point WITH perspective (one combined transform: perspective must sit in the
 * same transform as the rotations or 3D renders flat). Put the whole scene inside and animate — never cut when you can move.
 */
export const Cam: React.FC<{s: number; fx?: number; fy?: number; rx?: number; ry?: number; rz?: number; perspective?: number; w?: number; h?: number; children: React.ReactNode}> = ({
  s, fx = 960, fy = 540, rx = 0, ry = 0, rz = 0, perspective = 2200, w = 1920, h = 1080, children,
}) => (
  <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
    <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, transformOrigin: '0 0', transformStyle: rx || ry ? 'preserve-3d' : 'flat',
      // A planar camera does not need a 3D raster surface; this avoids tiled-filter artifacts.
      transform: `translate(${w / 2}px, ${h / 2}px) ${rx || ry ? `perspective(${perspective}px) rotateX(${rx}deg) rotateY(${ry}deg)` : ''} rotateZ(${rz}deg) scale(${s}) translate(${-fx}px, ${-fy}px)`}}>
      {children}
    </div>
  </div>
);

/** Soft drifting colour field. Never use a static background. */
export const GradientField: React.FC<{colors: string[]; base: string; speed?: number; blur?: number}> = ({colors, base, speed = 1, blur = 90}) => {
  const g = useG();
  const t = (g / 30) * speed;
  return (
    <div style={{position: 'absolute', inset: -240, background: base, overflow: 'hidden'}}>
      {colors.map((c, i) => (
        <div key={i} style={{position: 'absolute', width: 1100, height: 900, borderRadius: '50%', background: c, filter: `blur(${blur}px)`,
          left: 200 + ((i * 613) % 1500) + Math.sin(t * 0.35 + i * 1.7) * 140, top: 100 + ((i * 397) % 900) + Math.cos(t * 0.3 + i) * 110, opacity: 0.9}} />
      ))}
    </div>
  );
};

/**
 * Frosted glass panel. Glass only reads when something bright/moving is BEHIND it (a rim, blob or footage) —
 * place one there deliberately to define its edge.
 */
export const Glass: React.FC<{dark?: boolean; radius?: number; style?: React.CSSProperties; children?: React.ReactNode}> = ({dark, radius = 28, style, children}) => (
  <div style={{borderRadius: radius, backdropFilter: 'blur(24px) saturate(1.3)', WebkitBackdropFilter: 'blur(24px) saturate(1.3)',
    background: dark ? 'rgba(38,36,46,.55)' : 'rgba(255,255,255,.16)', border: `1.5px solid ${dark ? 'rgba(255,255,255,.16)' : 'rgba(255,255,255,.6)'}`,
    boxShadow: dark ? '0 20px 60px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.12)' : '0 10px 40px rgba(60,30,120,.10), inset 0 1px 0 rgba(255,255,255,.6)', ...style}}>{children}</div>
);

/** Card on light UI at video scale: layered soft shadow + 1 px inner highlight. */
export const cardStyle = (radius = 24): React.CSSProperties => ({
  background: 'rgba(255,255,255,.97)', borderRadius: radius,
  boxShadow: '0 30px 80px rgba(10,30,60,.16), 0 2px 6px rgba(0,0,0,.06), inset 0 0 0 1px rgba(255,255,255,.7)',
});

/** Dark UI surface: one key light per card, hairline top edge. */
export const darkCardStyle = (radius = 18): React.CSSProperties => ({
  background: 'radial-gradient(120% 90% at 60% 40%, #22262c, #16181a 70%)', borderRadius: radius,
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.08), 0 0 0 1px rgba(0,0,0,.6)', color: '#d9dce1',
});

/** Subject-centred spotlight that reaches pure black. */
export const Spotlight: React.FC<{x?: string; y?: string; radius?: number}> = ({x = '50%', y = '50%', radius = 370}) => {
  const k = radius / 370;
  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 50,
      background: `radial-gradient(ellipse 115% 100% at ${x} ${y}, rgba(0,0,0,0) 0, rgba(0,0,0,.3) ${200 * k}px, rgba(0,0,0,.57) ${340 * k}px, rgba(0,0,0,.86) ${520 * k}px, #000 ${780 * k}px)`}} />
  );
};

/**
 * Depth of field on a tilted plane: three stacked copies of the same content,
 * back blurred 12 px, mid 4 px masked to a wide band, sharp masked to a narrow band.
 * `angle` is a CSS linear-gradient angle: the band runs PERPENDICULAR to it, so a band along (nearly) horizontal text
 * lines needs ~165–175° (or ~-5…-15°), tilted 10–25° off the baselines. `focus` = band centre in % measured along the
 * gradient direction (not page y) — rack focus by animating it.
 */
export const DOFPlane: React.FC<{children: React.ReactNode; angle?: number; focus?: number; core?: number; back?: number}> = ({children, angle = 105, focus = 50, core = 6, back = 12}) => {
  const band = (w: number) => `linear-gradient(${angle}deg, transparent ${focus - w * 2}%, #000 ${focus - w}%, #000 ${focus + w}%, transparent ${focus + w * 2}%)`;
  return (
    <div style={{position: 'relative'}}>
      <div style={{filter: `blur(${back}px)`}}>{children}</div>
      <div style={{position: 'absolute', inset: 0, filter: 'blur(4px)', WebkitMaskImage: band(core * 2.5), maskImage: band(core * 2.5)}}>{children}</div>
      <div style={{position: 'absolute', inset: 0, WebkitMaskImage: band(core), maskImage: band(core)}}>{children}</div>
    </div>
  );
};

/**
 * Text that condenses out of noise. Each character starts scattered and blurred.
 * Stagger rows 5–8 f so 3–5 rows are mid-reveal at once.
 */
export const NoiseText: React.FC<{text: string; start: number; dur?: number; spread?: number; seed?: number}> = ({text, start, dur = 27, spread = 30, seed = 1}) => {
  const g = useG();
  return (
    <span>
      {text.split('').map((ch, i) => {
        const d = start + rand(seed * 100 + i) * dur * 0.45;
        const k = p(g, d, d + dur * 0.55);
        const ox = (rand(seed * 300 + i) - 0.5) * spread * (1 - k);
        const oy = (rand(seed * 500 + i) - 0.5) * spread * (1 - k);
        return <span key={i} style={{display: 'inline-block', whiteSpace: 'pre', opacity: k, transform: `translate(${ox}px, ${oy}px)`, filter: `blur(${(1 - k) * 4}px)`}}>{ch}</span>;
      })}
    </span>
  );
};

/** A diagonal light sweep across a surface. */
export const Sheen: React.FC<{at: number; dur?: number; opacity?: number; angle?: number}> = ({at, dur = 14, opacity = 0.15, angle = 25}) => {
  const g = useG();
  const k = interpolate(g, [at, at + dur], [-60, 160], clamp);
  if (g < at || g > at + dur) return null;
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'inherit', pointerEvents: 'none'}}>
      <div style={{position: 'absolute', top: '-50%', bottom: '-50%', width: '30%', left: `${k}%`, transform: `rotate(${angle}deg)`,
        background: `linear-gradient(90deg, transparent, rgba(255,255,255,${opacity}), transparent)`}} />
    </div>
  );
};

/** 2–3 % monochrome grain to stop banding in big blurred gradients. */
export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.03}) => {
  const g = useG();
  return (
    <svg style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity, mixBlendMode: 'overlay', pointerEvents: 'none', zIndex: 95}}>
      <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={g % 7} /></filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
  );
};

export {easeOut};
