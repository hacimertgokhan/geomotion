// Frames → self-contained animated SVG (SMIL, works in <img>, browsers, Figma import of a frame).
import { contourToD } from './smooth.js';

const esc = (s) => String(s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]);
const r4 = (x) => Math.round(x * 10000) / 10000;

export function opsToPaths(ops, decimals) {
  return ops
    .map((op) => {
      const d = op.contours.map((c) => contourToD(c, decimals)).join('');
      if (!d) return '';
      const o = op.opacity < 0.999 ? ` fill-opacity="${r4(op.opacity)}"` : '';
      return `<path fill="${op.color}"${o} d="${d}"/>`;
    })
    .join('');
}

function header(meta, extra = '') {
  const { width: W, height: H } = meta;
  const bg = meta.background ? `<rect width="${W}" height="${H}" fill="${meta.background}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"${extra}><title>${esc(meta.name)}</title>${bg}`;
}

/** Animated SVG of the whole compiled animation. */
export function toAnimatedSVG(compiled) {
  const { meta, frames } = compiled;
  const dec = Math.min(meta.width, meta.height) >= 600 ? 0 : 1;
  const T = meta.frames;
  const dur = `${r4(meta.duration)}s`;
  const rep = meta.loop ? 'repeatCount="indefinite"' : 'repeatCount="1" fill="freeze"';
  let body = '';
  if (frames.length === 1) {
    body = `<g>${opsToPaths(frames[0].ops, dec)}</g>`;
  } else {
    for (let i = 0; i < frames.length; i++) {
      const f = frames[i];
      const s = r4(f.start / T), e = r4(f.end / T);
      const isLast = i === frames.length - 1;
      let values, times;
      if (f.start === 0) { values = 'visible;hidden'; times = `0;${e}`; }
      else if (isLast && f.end >= T) { values = 'hidden;visible'; times = `0;${s}`; }
      else { values = 'hidden;visible;hidden'; times = `0;${s};${e}`; }
      // Non-looping: the last frame stays; the first frame is visible from the start.
      const vis = f.start === 0 ? 'visible' : 'hidden';
      body += `<g visibility="${vis}"><animate attributeName="visibility" calcMode="discrete" values="${values}" keyTimes="${times}" dur="${dur}" ${rep}/>${opsToPaths(f.ops, dec)}</g>`;
    }
  }
  return `${header(meta)}${body}</svg>`;
}

/** Static SVG of a single frame (by index into compiled.frames, or a list of ops). */
export function toFrameSVG(compiled, frameIndex = 0) {
  const { meta, frames } = compiled;
  const dec = Math.min(meta.width, meta.height) >= 600 ? 0 : 1;
  const f = frames[Math.max(0, Math.min(frames.length - 1, frameIndex))];
  return `${header(meta)}${opsToPaths(f.ops, dec)}</svg>`;
}

/** Index into compiled.frames for a time in seconds. */
export function frameIndexAt(compiled, seconds) {
  const { meta, frames } = compiled;
  let f = Math.floor(seconds * meta.fps);
  f = meta.loop ? ((f % meta.frames) + meta.frames) % meta.frames : Math.min(Math.max(f, 0), meta.frames - 1);
  let lo = 0, hi = frames.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (frames[mid].start <= f) lo = mid; else hi = mid - 1;
  }
  return lo;
}
