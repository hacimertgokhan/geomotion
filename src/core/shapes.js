// Shape definitions → centerline polylines.
import { parsePath } from './svgpath.js';
import { rotatePt, centroid, bounds } from './geometry.js';
import { mulberry32 } from './random.js';

const TAU = Math.PI * 2;
const deg = (d) => (d * Math.PI) / 180;

function ellipsePts(cx, cy, rx, ry, n = 96, startDeg = -90) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = deg(startDeg) + (i / n) * TAU;
    out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return out;
}

function roundRectPts(x, y, w, h, r) {
  r = Math.max(0, Math.min(r || 0, w / 2, h / 2));
  if (r < 0.5) return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  const out = [];
  const corner = (cx, cy, a0) => {
    for (let i = 0; i <= 8; i++) {
      const a = deg(a0 + (i / 8) * 90);
      out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  };
  corner(x + w - r, y + r, -90);
  corner(x + w - r, y + h - r, 0);
  corner(x + r, y + h - r, 90);
  corner(x + r, y + r, 180);
  return out;
}

function regularPts(cx, cy, r, sides, rot = 0) {
  const out = [];
  for (let i = 0; i < sides; i++) {
    const a = deg(rot - 90) + (i / sides) * TAU;
    out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return out;
}

function starPts(cx, cy, r, inner, points, rot = 0) {
  const ri = inner <= 1 ? r * inner : inner;
  const out = [];
  for (let i = 0; i < points * 2; i++) {
    const a = deg(rot - 90) + (i / (points * 2)) * TAU;
    const rr = i % 2 ? ri : r;
    out.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
  }
  return out;
}

function heartPts(cx, cy, size, n = 120) {
  const out = [];
  const s = size / 34;
  for (let i = 0; i < n; i++) {
    const t = Math.PI + (i / n) * TAU; // start at the top-center notch
    const x = 16 * Math.sin(t) ** 3;
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    out.push([cx + x * s, cy + (y + 2) * s]);
  }
  return out;
}

function blobPts(cx, cy, r, seed = 1, irregularity = 0.18, n = 96) {
  const rng = mulberry32(seed * 7919 + 13);
  const harmonics = [];
  for (let k = 2; k <= 5; k++) harmonics.push([k, (rng() * 2 - 1) * irregularity / (k * 0.6), rng() * TAU]);
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i / n) * TAU;
    let rr = 1;
    for (const [k, amp, ph] of harmonics) rr += amp * Math.sin(k * a + ph);
    out.push([cx + r * rr * Math.cos(a), cy + r * rr * Math.sin(a)]);
  }
  return out;
}

// Moon-like crescent: a circle with a same-size circle bitten out of it.
// thickness: 0..1 (fraction of the diameter left), angle: direction of the bite.
function crescentPts(cx, cy, r, thickness = 0.35, angle = 45, n = 72) {
  const d = 2 * r * Math.min(0.98, Math.max(0.04, thickness));
  const phi = deg(angle);
  const al = Math.acos(d / (2 * r));
  const bx = cx + d * Math.cos(phi), by = cy + d * Math.sin(phi);
  const out = [];
  for (let i = 0; i <= n; i++) {
    const th = phi + al + ((TAU - 2 * al) * i) / n;
    out.push([cx + r * Math.cos(th), cy + r * Math.sin(th)]);
  }
  const m = Math.max(8, Math.round((n * al) / Math.PI));
  for (let i = 1; i < m; i++) {
    const th = phi + Math.PI + al - (2 * al * i) / m;
    out.push([bx + r * Math.cos(th), by + r * Math.sin(th)]);
  }
  return out;
}

function wavePts(from, to, amplitude = 40, waves = 2, phase = 0, n = 80) {
  const dx = to[0] - from[0], dy = to[1] - from[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const o = Math.sin(t * TAU * waves + deg(phase)) * amplitude;
    out.push([from[0] + dx * t + nx * o, from[1] + dy * t + ny * o]);
  }
  return out;
}

function spiralPts(cx, cy, r, turns = 3, n = 160) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const a = t * turns * TAU - Math.PI / 2;
    out.push([cx + r * t * Math.cos(a), cy + r * t * Math.sin(a)]);
  }
  return out;
}

function arcPts(cx, cy, r, start = 0, end = 180, n = 64) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = deg(start + ((end - start) * i) / (n - 1));
    out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return out;
}

/** Converts a shape to raw subpaths: [{points, closed}] */
export function shapeToPaths(s) {
  const t = s.type;
  switch (t) {
    case 'circle': return [{ points: ellipsePts(s.cx, s.cy, s.r, s.r), closed: true }];
    case 'ellipse': return [{ points: ellipsePts(s.cx, s.cy, s.rx, s.ry ?? s.rx), closed: true }];
    case 'rect': {
      const w = s.w ?? s.width, h = s.h ?? s.height;
      const x = s.x ?? (s.cx != null ? s.cx - w / 2 : 0);
      const y = s.y ?? (s.cy != null ? s.cy - h / 2 : 0);
      return [{ points: roundRectPts(x, y, w, h, s.radius ?? 0), closed: true }];
    }
    case 'line': {
      const pts = s.points ?? [s.from, s.to];
      return [{ points: pts.map((p) => [...p]), closed: false }];
    }
    case 'polyline': return [{ points: s.points.map((p) => [...p]), closed: !!s.closed }];
    case 'polygon': return [{ points: s.points.map((p) => [...p]), closed: true }];
    case 'regular': return [{ points: regularPts(s.cx, s.cy, s.r, s.sides ?? 6, s.angle ?? 0), closed: true }];
    case 'triangle': return [{ points: regularPts(s.cx, s.cy, s.r, 3, s.angle ?? 0), closed: true }];
    case 'star': return [{ points: starPts(s.cx, s.cy, s.r, s.inner ?? 0.45, s.points ?? 5, s.angle ?? 0), closed: true }];
    case 'heart': return [{ points: heartPts(s.cx, s.cy, s.size ?? (s.r != null ? s.r * 2 : 200)), closed: true }];
    case 'blob': return [{ points: blobPts(s.cx, s.cy, s.r, s.seed ?? 1, s.irregularity ?? 0.18), closed: true }];
    case 'wave': return [{ points: wavePts(s.from, s.to, s.amplitude, s.waves, s.phase), closed: false }];
    case 'crescent': return [{ points: crescentPts(s.cx, s.cy, s.r, s.thickness, s.angle), closed: true }];
    case 'spiral': return [{ points: spiralPts(s.cx, s.cy, s.r, s.turns), closed: false }];
    case 'arc': return [{ points: arcPts(s.cx, s.cy, s.r, s.start, s.end), closed: false }];
    case 'path': return parsePath(s.d);
    default:
      throw new Error(`Unknown shape type: "${t}". Supported: ${SHAPE_TYPES.join(', ')}`);
  }
}

/** Fields per type (used in error messages and docs). */
export const SHAPE_FIELDS = {
  circle: 'cx, cy, r',
  ellipse: 'cx, cy, rx, ry',
  rect: 'x, y, w, h (or cx, cy, w, h), radius?',
  line: 'from:[x,y], to:[x,y]  (or points:[[x,y],...])',
  polyline: 'points:[[x,y],...], closed?',
  polygon: 'points:[[x,y],...]',
  regular: 'cx, cy, r, sides, angle?',
  triangle: 'cx, cy, r, angle?',
  star: 'cx, cy, r, inner? (ratio or px), points?, angle?',
  heart: 'cx, cy, size',
  blob: 'cx, cy, r, seed?, irregularity?',
  wave: 'from:[x,y], to:[x,y], amplitude?, waves?, phase? (deg)',
  crescent: 'cx, cy, r, thickness? (0..1), angle? (deg, direction of the bite)',
  spiral: 'cx, cy, r, turns?',
  arc: 'cx, cy, r, start (deg), end (deg)',
  path: 'd (SVG path data)',
};

export const SHAPE_TYPES = [
  'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon', 'regular', 'triangle',
  'star', 'heart', 'blob', 'crescent', 'wave', 'spiral', 'arc', 'path',
];

/** transform: { translate:[x,y], rotate:deg, scale:s|[sx,sy], origin:[x,y] } */
export function applyTransform(paths, tr) {
  if (!tr) return paths;
  const all = paths.flatMap((p) => p.points);
  const b = bounds(all);
  const origin = tr.origin ?? [(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2];
  const sc = tr.scale == null ? [1, 1] : Array.isArray(tr.scale) ? tr.scale : [tr.scale, tr.scale];
  const tx = tr.translate ?? [0, 0];
  return paths.map((p) => ({
    ...p,
    points: p.points.map((q) => {
      let r = [origin[0] + (q[0] - origin[0]) * sc[0], origin[1] + (q[1] - origin[1]) * sc[1]];
      if (tr.rotate) r = rotatePt(r, tr.rotate, origin);
      return [r[0] + tx[0], r[1] + tx[1]];
    }),
  }));
}

export { centroid };
