import React from 'react';
import {AbsoluteFill, Audio, staticFile} from 'remotion';
import {content} from './content';
import {MotionBlur} from './kit/motion-blur';
import {CLICK, PROMPT, TICKS, B, film} from './film';
import {
  Cam, GradientField, Glass, Grain, Headline, MONO, Pointer, SANS, Scene, ScaleThrough, SlotWheel, Typed, cardStyle, drift, easeOut, p, section, sp, tween, useG, Check,
} from './kit';

const ACCENT = content.accent;

/** Hook + demo are ONE continuous scene: the pill becomes the composer, the composer grows the result card. */
const HookDemo: React.FC = () => {
  const g = useG();
  const demo = section(film, 'demo');
  const w = tween(g, [[0, 360], [demo.from, 360], [demo.from + 12, 1300]], easeOut);
  const h = tween(g, [[CLICK, 150], [CLICK + 14, 560]], easeOut);
  const s = tween(g, [[0, 1.25], [demo.from, 1.1], [CLICK, 1.15], [CLICK + 16, 1]], easeOut) * drift(g, CLICK + 16, 0.02);
  const text = g < CLICK ? PROMPT.at(g) : '';
  return (
    <AbsoluteFill style={{fontFamily: SANS}}>
      <Cam s={s} fy={560}>
        <GradientField base="#E9E4F7" colors={['#C9B8FF', '#FBE3C1', '#B6E0F5']} />
        <div style={{position: 'absolute', top: 250, width: 1920}}>
          <Headline size={88} color="#17142B" accent={ACCENT} fresh={ACCENT} exitAt={demo.from + 30}
            states={content.headline.map((text, i) => ({at: 2 + i * 7, text, accent: content.headlineAccent}))} />
        </div>
        <div style={{position: 'absolute', left: 960 - w / 2, top: 700 - h, width: w, height: h, transform: `scale(${sp(g, -6)})`, transformOrigin: 'center bottom', ...cardStyle(40), overflow: 'hidden'}}>
          {g >= CLICK + 6 && (
            <div style={{position: 'absolute', left: 56, top: 48, right: 56, opacity: p(g, CLICK + 6, CLICK + 16)}}>
              <div style={{fontSize: 40, fontWeight: 700, color: '#17142B', letterSpacing: -1}}>{content.resultTitle}</div>
              {content.summaryLines.map((t, i) => (
                <div key={t} style={{display: 'flex', gap: 18, alignItems: 'center', fontSize: 34, marginTop: 26, opacity: p(g, TICKS[i] - 8, TICKS[i]), transform: `translateY(${(1 - p(g, TICKS[i] - 8, TICKS[i])) * 20}px)`}}>
                  <span style={{transform: `scale(${g >= TICKS[i] ? sp(g, TICKS[i], 10, 260) : 0})`}}><Check size={40} color={ACCENT} /></span>{t}
                </div>
              ))}
            </div>
          )}
          <div style={{position: 'absolute', left: 44, right: 140, bottom: 48, fontSize: 40, color: text ? '#17142B' : '#9a97a8', whiteSpace: 'nowrap', overflow: 'hidden'}}>
            {w > 600 ? <Typed text={text || (g < CLICK ? '' : content.followup)} caret={g < CLICK} caretColor={ACCENT} /> : null}
          </div>
          <div style={{position: 'absolute', right: 28, bottom: 26, width: 96, height: 96, borderRadius: 48, background: ACCENT, display: 'grid', placeItems: 'center',
            transform: `scale(${1 - 0.1 * (g >= CLICK - 2 && g < CLICK + 6 ? 1 : 0)})`}}>
            <svg width="40" height="40" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" fill="none"><path d="M12 19V5M6 11l6-6 6 6" /></svg>
          </div>
        </div>
        <Pointer size={84} path={[[B(-14), 1900, 1150], [CLICK - 3, 1570, 615], [CLICK + 20, 1650, 900]]} clicks={[CLICK]} visible={[B(-14), CLICK + 20]} />
      </Cam>
    </AbsoluteFill>
  );
};

const Breath: React.FC = () => {
  const b = section(film, 'breath');
  return (
    <ScaleThrough inAt={b.from}>
      <AbsoluteFill style={{background: '#F6F4FB', display: 'grid', placeItems: 'center', fontFamily: SANS}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 26, fontSize: 96, fontWeight: 600, color: '#17142B', letterSpacing: -3}}>
          {content.reelLead}
          <Glass style={{padding: '0 34px', background: 'rgba(108,76,245,.08)', border: '2px solid rgba(108,76,245,.25)'}}>
            <SlotWheel items={content.reelWords} stepAt={[B(-4.5), B(-3.75)]} size={96} color="#17142B" activeColor={ACCENT} />
          </Glass>
        </div>
      </AbsoluteFill>
    </ScaleThrough>
  );
};

const End: React.FC = () => {
  const g = useG();
  const start = section(film, 'end').from;
  const k = sp(g, start - 4, 12, 160);
  return (
    <AbsoluteFill style={{background: '#0E0C17', display: 'grid', placeItems: 'center', fontFamily: SANS}}>
      <div style={{textAlign: 'center', transform: `scale(${0.9 + 0.1 * k})`, opacity: Math.min(1, k * 1.4)}}>
        <div style={{fontSize: 150, fontWeight: 800, color: '#fff', letterSpacing: -6}}>{content.name}<span style={{color: ACCENT}}>.</span></div>
        <div style={{fontFamily: MONO, fontSize: 30, color: '#a9a3c9', marginTop: 10, opacity: p(g, start + 8, start + 20)}}>{content.url} · concept film</div>
      </div>
    </AbsoluteFill>
  );
};

export const ExampleFilm: React.FC<{blur?: boolean}> = ({blur = true}) => {
  const d = section(film, 'demo');
  const br = section(film, 'breath');
  const e = section(film, 'end');
  const body = (
    <AbsoluteFill style={{background: '#000'}}>
      <Scene from={0} to={d.to + 6} name="hook+demo"><HookDemo /></Scene>
      <Scene from={br.from} to={br.to} name="breath"><Breath /></Scene>
      <Scene from={e.from} to={e.to} name="end"><End /></Scene>
    </AbsoluteFill>
  );
  return <>
    {blur ? <MotionBlur shutterAngle={180} samples={6}>{body}</MotionBlur> : body}
    <Grain />
    {content.musicFile && <Audio src={staticFile(content.musicFile)} volume={(frame) => content.musicVolume * p(frame, 0, 12) * (1 - p(frame, film.duration - 24, film.duration - 1))} />}
  </>;
};
