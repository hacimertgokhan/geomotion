// Scene compiler: spec (keyframes of shapes) → timeline → rendered frames.
//
// Each keyframe is a pose. Between poses every shape morphs to its partner
// (matched by `id`, otherwise by position in the list). Shapes without a partner
// enter/exit with grow, pop, draw or fade. While a pose is held the ink keeps
// "boiling" — it is redrawn with a new seed `boil` times per second.

import { shapeToPaths, applyTransform, SHAPE_FIELDS } from './shapes.js';
import { resample, signedArea, centroid, trim, lerp, clamp, polylineLength, bounds } from './geometry.js';
import { inkStroke, inkFill } from './ink.js';
import { resolveColor, lerpColor } from './palette.js';
import { getEasing } from './easing.js';
import { hashSeed } from './random.js';

const N = 128; // points per prepared centerline

export const DEFAULTS = {
  size: [1200, 1200],
  fps: 24,
  boil: 12,
  loop: true,
  background: 'ivory',
  seed: 1,
  hold: 0.7,
  duration: 0.9,
  ease: 'inOutCubic',
};

const STYLE_DEFAULTS = {
  ink: 'ink',
  width: 24, // at 1200px; scaled with canvas size
  wobble: 1,
  roughness: 1,
  taper: 0.5,
  fillWobble: 1,
  misregister: [-14, 10], // riso-style offset of fills vs ink, at 1200px
};

const ENTERS = ['grow', 'pop', 'draw', 'fade', 'cut'];

// ───────────────────────────── normalize ─────────────────────────────

export function normalizeSpec(input) {
  if (!input || typeof input !== 'object') throw new Error('Spec must be an object.');
  const spec = { ...DEFAULTS, ...input };
  const size = input.size ?? (input.width && input.height ? [input.width, input.height] : DEFAULTS.size);
  const [W, H] = size;
  const sc = Math.min(W, H) / 1200;
  const st = { ...STYLE_DEFAULTS, ...(input.style ?? {}) };
  const style = {
    ink: resolveColor(st.ink),
    width: input.style?.width ?? STYLE_DEFAULTS.width * sc,
    wobble: st.wobble,
    roughness: st.roughness,
    taper: st.taper,
    fillWobble: st.fillWobble,
    misregister:
      st.misregister === false ? [0, 0]
      : input.style?.misregister ? st.misregister
      : STYLE_DEFAULTS.misregister.map((v) => v * sc),
  };
  if (!Array.isArray(spec.keyframes) || spec.keyframes.length === 0) {
    throw new Error('Spec needs a non-empty "keyframes" array. Each keyframe: { hold?, duration?, ease?, shapes: [...] }');
  }
  const bg = spec.background;
  return {
    name: spec.name ?? 'geomotion',
    width: W,
    height: H,
    scale: sc,
    fps: spec.fps,
    boil: spec.boil,
    loop: spec.loop,
    background: bg == null || bg === false || bg === 'transparent' || bg === 'none' ? null : resolveColor(bg),
    seed: spec.seed,
    style,
    keyframes: spec.keyframes.map((kf, i) => normalizeKeyframe(kf, i, spec, style)),
  };
}

function normalizeKeyframe(kf, ki, spec, style) {
  const shapes = kf.shapes ?? [];
  if (!Array.isArray(shapes)) throw new Error(`keyframes[${ki}].shapes must be an array.`);
  const items = [];
  shapes.forEach((s, si) => {
    let paths;
    try {
      paths = applyTransform(shapeToPaths(s), s.transform);
    } catch (e) {
      throw new Error(`keyframes[${ki}].shapes[${si}]: ${e.message}`);
    }
    const ok = paths.length > 0 && paths.every((p) => p.points.length >= 2 && p.points.every((q) => Number.isFinite(q[0]) && Number.isFinite(q[1])));
    if (!ok) {
      throw new Error(
        `keyframes[${ki}].shapes[${si}] (type "${s.type}") has missing or invalid fields. Expected: ${SHAPE_FIELDS[s.type] ?? '?'}`
      );
    }
    const enter = s.enter ?? 'grow';
    const exit = s.exit ?? enter;
    for (const e of [enter, exit]) {
      if (!ENTERS.includes(e)) throw new Error(`keyframes[${ki}].shapes[${si}]: enter/exit "${e}" is invalid. Use: ${ENTERS.join(', ')}`);
    }
    const base = s.id != null ? String(s.id) : `#${si}`;
    const strokeColor = s.stroke === false ? null : resolveColor(typeof s.stroke === 'string' ? s.stroke : s.color ?? style.ink);
    paths.forEach((p, k) => {
      // Small shapes get proportionally thinner ink unless a width is given.
      const bb = bounds(p.points);
      const autoW = Math.min(style.width, Math.max(bb.w, bb.h) * 0.2);
      items.push(prepareItem({
        key: paths.length > 1 ? `${base}.${k}` : base,
        order: si + k / 100,
        raw: p.points,
        closed: p.closed,
        stroke: strokeColor,
        width: strokeColor ? s.width ?? autoW : 0,
        fill: resolveColor(s.fill),
        opacity: s.opacity ?? 1,
        misregister: s.misregister === false ? [0, 0] : s.misregister ?? style.misregister,
        enter, exit,
        delay: clamp(s.delay ?? 0, 0, 0.95),
        ease: s.ease,
      }));
    });
  });
  return {
    hold: kf.hold ?? spec.hold,
    duration: kf.duration ?? spec.duration,
    ease: kf.ease ?? spec.ease,
    items,
  };
}

// Precompute N-point loop (closed) and N+1-point open versions of a centerline.
function prepareItem(it) {
  if (it.closed) {
    let loop = resample(it.raw, N, true);
    if (signedArea(loop) < 0) loop.reverse();
    // start at the top-most (then left-most) point: natural "draw-on" start
    let k = 0;
    for (let i = 1; i < N; i++) {
      const p = loop[i], q = loop[k];
      if (p[1] < q[1] - 0.5 || (Math.abs(p[1] - q[1]) <= 0.5 && p[0] < q[0])) k = i;
    }
    loop = [...loop.slice(k), ...loop.slice(0, k)];
    it.loop = loop;
    it.open = [...loop, loop[0]];
  } else {
    it.open = resample(it.raw, N + 1, false);
  }
  it.c = centroid(it.closed ? it.loop : it.open);
  return it;
}

// ───────────────────────────── matching ─────────────────────────────

function cost(a, ca, b, cb, offset, dir) {
  const n = a.length;
  let s = 0;
  for (let i = 0; i < n; i++) {
    const j = ((dir > 0 ? i + offset : offset - i) % n + n) % n;
    const dx = a[i][0] - ca[0] - (b[j][0] - cb[0]);
    const dy = a[i][1] - ca[1] - (b[j][1] - cb[1]);
    s += dx * dx + dy * dy;
  }
  return s;
}

function rotateLoop(loop, offset, dir) {
  const n = loop.length;
  const out = new Array(n);
  for (let i = 0; i < n; i++) out[i] = loop[((dir > 0 ? i + offset : offset - i) % n + n) % n];
  return out;
}

/** Best starting point/direction of a closed loop to match the target points. */
function bestLoopAlignment(target, tc, loop, lc, allowReverse) {
  let best = [Infinity, 0, 1];
  const n = loop.length;
  const step = n > 64 ? 2 : 1;
  for (const dir of allowReverse ? [1, -1] : [1]) {
    for (let k = 0; k < n; k += step) {
      const c = cost(target, tc, loop, lc, k, dir);
      if (c < best[0]) best = [c, k, dir];
    }
  }
  // refine around the coarse optimum
  for (let k = best[1] - step; k <= best[1] + step; k++) {
    const c = cost(target, tc, loop, lc, k, best[2]);
    if (c < best[0]) best = [c, k, best[2]];
  }
  return best;
}

function buildPair(A, B) {
  if (A && B) {
    if (A.closed && B.closed) {
      const [, k] = bestLoopAlignment(A.loop, A.c, B.loop, B.c, false);
      return { type: 'morph', closed: true, A, B, a: A.loop, b: rotateLoop(B.loop, k, 1) };
    }
    if (!A.closed && !B.closed) {
      const rev = [...B.open].reverse();
      const keep = cost(A.open, A.c, B.open, B.c, 0, 1) <= cost(A.open, A.c, rev, B.c, 0, 1);
      return { type: 'morph', closed: false, A, B, a: A.open, b: keep ? B.open : rev };
    }
    // open ↔ closed: open the loop at the point that best matches the open line
    if (A.closed) {
      const [, k, dir] = bestLoopAlignment(B.open.slice(0, N), B.c, A.loop, A.c, true);
      const r = rotateLoop(A.loop, k, dir);
      return { type: 'morph', closed: false, A, B, a: [...r, r[0]], b: B.open };
    }
    const [, k, dir] = bestLoopAlignment(A.open.slice(0, N), A.c, B.loop, B.c, true);
    const r = rotateLoop(B.loop, k, dir);
    return { type: 'morph', closed: false, A, B, a: A.open, b: [...r, r[0]] };
  }
  if (B) return { type: 'enter', item: B };
  return { type: 'exit', item: A };
}

function buildTransition(kfA, kfB) {
  const mapA = new Map(kfA.items.map((it) => [it.key, it]));
  const mapB = new Map(kfB.items.map((it) => [it.key, it]));
  const keys = [...new Set([...mapA.keys(), ...mapB.keys()])];
  return keys.map((k) => ({ key: k, ...buildPair(mapA.get(k), mapB.get(k)) }));
}

// ───────────────────────────── evaluation ─────────────────────────────

const scalePts = (pts, c, s) => pts.map((p) => [c[0] + (p[0] - c[0]) * s, c[1] + (p[1] - c[1]) * s]);

function holdState(it) {
  return {
    key: it.key, order: it.order,
    pts: it.closed ? it.loop : it.open, closed: it.closed,
    stroke: it.stroke, width: it.width,
    fill: it.fill, fillAlpha: 1, opacity: it.opacity, misregister: it.misregister,
  };
}

function localProgress(raw, item, kfEase) {
  const d = item.delay ?? 0;
  const t = clamp((raw - d) / (1 - d), 0, 1);
  return getEasing(item.ease ?? kfEase)(t);
}

function evalPair(pair, raw, kfEase) {
  if (pair.type === 'morph') {
    const { A, B } = pair;
    const p = localProgress(raw, B, kfEase);
    const pts = pair.a.map((q, i) => [lerp(q[0], pair.b[i][0], p), lerp(q[1], pair.b[i][1], p)]);
    const stroke = A.stroke && B.stroke ? lerpColor(A.stroke, B.stroke, clamp(p, 0, 1)) : A.stroke ?? B.stroke;
    const fill = A.fill && B.fill ? lerpColor(A.fill, B.fill, clamp(p, 0, 1)) : A.fill ?? B.fill;
    const fillAlpha = A.fill && B.fill ? 1 : A.fill ? 1 - clamp(p, 0, 1) : clamp(p, 0, 1);
    return {
      key: pair.key, order: B.order,
      pts, closed: pair.closed,
      stroke, width: Math.max(0, lerp(A.width, B.width, p)),
      fill, fillAlpha,
      opacity: lerp(A.opacity, B.opacity, clamp(p, 0, 1)),
      misregister: [lerp(A.misregister[0], B.misregister[0], p), lerp(A.misregister[1], B.misregister[1], p)],
    };
  }
  const entering = pair.type === 'enter';
  const it = pair.item;
  const mode = entering ? it.enter : it.exit;
  const ease = mode === 'pop' ? 'outBack' : undefined;
  // q: how "present" the shape is (0 = gone, 1 = fully there)
  const prog = localProgress(raw, ease && entering ? { ...it, ease } : it, kfEase);
  const q = entering ? prog : 1 - prog;
  const st = holdState(it);
  switch (mode) {
    case 'grow':
    case 'pop':
      return { ...st, pts: scalePts(st.pts, it.c, Math.max(0, q)), width: st.width * clamp(q, 0, 1.2) };
    case 'draw': {
      const pts = entering ? trim(it.open, 0, clamp(q, 0, 1)) : trim(it.open, 1 - clamp(q, 0, 1), 1);
      return { ...st, pts, closed: false, fillAlpha: clamp(q, 0, 1) ** 2, fillPts: st.pts };
    }
    case 'fade':
      return { ...st, opacity: st.opacity * clamp(q, 0, 1) };
    case 'cut':
      return q >= 0.5 ? st : null;
  }
  return st;
}

// ───────────────────────────── timeline ─────────────────────────────

export function buildTimeline(spec) {
  const kfs = spec.keyframes;
  const segs = [];
  let t = 0;
  const count = kfs.length;
  for (let i = 0; i < count; i++) {
    const kf = kfs[i];
    if (kf.hold > 0) { segs.push({ type: 'hold', kf: i, t0: t, t1: t + kf.hold }); t += kf.hold; }
    const last = i === count - 1;
    if (last && !spec.loop) break;
    if (count === 1) break;
    const j = (i + 1) % count;
    if (kf.duration > 0) {
      segs.push({ type: 'trans', from: i, to: j, ease: kf.ease, t0: t, t1: t + kf.duration, pairs: buildTransition(kf, kfs[j]) });
      t += kf.duration;
    }
  }
  if (segs.length === 0) segs.push({ type: 'hold', kf: 0, t0: 0, t1: 1 });
  return { segs, duration: segs[segs.length - 1].t1 };
}

/** Returns the morph state (centerlines + styles) at time t. */
export function stateAt(spec, timeline, t) {
  const { segs, duration } = timeline;
  if (spec.loop) t = ((t % duration) + duration) % duration;
  else t = clamp(t, 0, duration - 1e-9);
  let seg = segs.find((s) => t >= s.t0 && t < s.t1) ?? segs[segs.length - 1];
  const boilIndex = spec.boil > 0 ? Math.floor(t * spec.boil + 1e-6) : 0;
  if (seg.type === 'hold') {
    return { sig: `h${seg.kf}|${boilIndex}`, boilIndex, items: spec.keyframes[seg.kf].items.map(holdState) };
  }
  const raw = (t - seg.t0) / (seg.t1 - seg.t0);
  const items = seg.pairs.map((p) => evalPair(p, raw, seg.ease)).filter(Boolean);
  items.sort((a, b) => a.order - b.order);
  return { sig: `t${seg.t0}|${raw.toFixed(5)}|${boilIndex}`, boilIndex, items };
}

// ───────────────────────────── rendering ─────────────────────────────

/**
 * Renders the ink for a morph state.
 * @returns {{contours:number[][][], color:string, opacity:number}[]} draw ops, back to front
 */
export function renderState(spec, state) {
  const fills = [], strokes = [];
  const sc = spec.scale;
  for (const it of state.items) {
    const seedBase = [spec.seed, it.key, state.boilIndex];
    const alpha = it.opacity;
    if (alpha <= 0.005) continue;
    if (it.fill && it.fillAlpha * alpha > 0.005) {
      const src = it.fillPts ?? it.pts;
      if (src.length >= 3 && polylineLength(src, true) > 2) {
        const [dx, dy] = it.misregister;
        const contours = inkFill(src, { seed: hashSeed(...seedBase, 'f'), wobble: spec.style.fillWobble, scale: sc })
          .map((c) => c.map((p) => [p[0] + dx, p[1] + dy]));
        if (contours.length) fills.push({ contours, color: it.fill, opacity: it.fillAlpha * alpha });
      }
    }
    if (it.stroke && it.width > 0.4) {
      const contours = inkStroke(it.pts, it.closed, {
        width: it.width,
        wobble: spec.style.wobble,
        roughness: spec.style.roughness,
        taper: spec.style.taper,
        seed: hashSeed(...seedBase, 's'),
        scale: sc,
      });
      if (contours.length) strokes.push({ contours, color: it.stroke, opacity: alpha });
    }
  }
  return [...fills, ...strokes];
}

/**
 * Compiles a spec into unique frames.
 * @param {object} input spec
 * @param {{transparent?: boolean}} [options] transparent: drop the background

 * @returns {{meta:object, frames:{start:number,end:number,ops:object[]}[]}}
 *   start/end are frame indices at meta.fps; consecutive identical frames are merged.
 */
export function compile(input, options = {}) {
  const spec = normalizeSpec(options.transparent ? { ...input, background: 'transparent' } : input);
  const timeline = buildTimeline(spec);
  const total = Math.max(1, Math.round(timeline.duration * spec.fps));
  const frames = [];
  let prevSig = null;
  for (let f = 0; f < total; f++) {
    const state = stateAt(spec, timeline, f / spec.fps);
    if (state.sig === prevSig) { frames[frames.length - 1].end = f + 1; continue; }
    prevSig = state.sig;
    frames.push({ start: f, end: f + 1, ops: renderState(spec, state) });
  }
  return {
    meta: {
      name: spec.name, width: spec.width, height: spec.height, fps: spec.fps,
      frames: total, duration: total / spec.fps, loop: spec.loop, background: spec.background,
    },
    frames,
    spec,
    timeline,
  };
}
