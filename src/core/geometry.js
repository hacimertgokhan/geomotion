// Polyline geometry helpers. A point is [x, y].

export const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
export const lerp = (a, b, t) => a + (b - a) * t;
export const lerpPt = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

export function polylineLength(pts, closed = false) {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += dist(pts[i - 1], pts[i]);
  if (closed && pts.length > 1) L += dist(pts[pts.length - 1], pts[0]);
  return L;
}

/**
 * n points evenly spaced by arc length.
 * Open: first and last points are kept. Closed: the start point is not repeated.
 */
export function resample(pts, n, closed = false) {
  if (pts.length === 0) return [];
  if (pts.length === 1) return Array.from({ length: n }, () => [pts[0][0], pts[0][1]]);
  const src = closed ? [...pts, pts[0]] : pts;
  const cum = [0];
  for (let i = 1; i < src.length; i++) cum.push(cum[i - 1] + dist(src[i - 1], src[i]));
  const L = cum[cum.length - 1];
  if (L < 1e-9) return Array.from({ length: n }, () => [pts[0][0], pts[0][1]]);
  const out = [];
  const steps = closed ? n : n - 1;
  let seg = 1;
  for (let k = 0; k < n; k++) {
    const target = (k / steps) * L;
    while (seg < cum.length - 1 && cum[seg] < target) seg++;
    const span = cum[seg] - cum[seg - 1] || 1;
    const t = clamp((target - cum[seg - 1]) / span, 0, 1);
    out.push(lerpPt(src[seg - 1], src[seg], t));
  }
  return out;
}

export function signedArea(pts) {
  let a = 0;
  for (let i = 0, n = pts.length; i < n; i++) {
    const p = pts[i], q = pts[(i + 1) % n];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return a / 2;
}

export function centroid(pts) {
  let x = 0, y = 0;
  for (const p of pts) { x += p[0]; y += p[1]; }
  const n = pts.length || 1;
  return [x / n, y / n];
}

export function bounds(pts) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) {
    if (x < x0) x0 = x; if (y < y0) y0 = y;
    if (x > x1) x1 = x; if (y > y1) y1 = y;
  }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}

/** Trims an open polyline to [t0, t1] (0-1, by arc length). */
export function trim(pts, t0, t1) {
  if (t1 <= t0 || pts.length < 2) return [];
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + dist(pts[i - 1], pts[i]));
  const L = cum[cum.length - 1];
  const a = t0 * L, b = t1 * L;
  const at = (s) => {
    let i = 1;
    while (i < cum.length - 1 && cum[i] < s) i++;
    const span = cum[i] - cum[i - 1] || 1;
    return lerpPt(pts[i - 1], pts[i], clamp((s - cum[i - 1]) / span, 0, 1));
  };
  const out = [at(a)];
  for (let i = 1; i < pts.length - 1; i++) if (cum[i] > a && cum[i] < b) out.push(pts[i]);
  out.push(at(b));
  return out;
}

/** Unit normal per point, from a tangent smoothed over `window` neighbours. */
export function normals(pts, closed, window = 2) {
  const n = pts.length;
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    let i0 = i - window, i1 = i + window;
    if (closed) { i0 = (i0 + n) % n; i1 = i1 % n; }
    else { i0 = Math.max(0, i0); i1 = Math.min(n - 1, i1); }
    let tx = pts[i1][0] - pts[i0][0];
    let ty = pts[i1][1] - pts[i0][1];
    let len = Math.hypot(tx, ty);
    if (len < 1e-9) {
      // Window endpoints coincide: fall back to the immediate neighbours
      const j = closed ? (i + 1) % n : Math.min(n - 1, i + 1);
      const k = closed ? (i - 1 + n) % n : Math.max(0, i - 1);
      tx = pts[j][0] - pts[k][0]; ty = pts[j][1] - pts[k][1];
      len = Math.hypot(tx, ty) || 1;
    }
    out[i] = [-ty / len, tx / len];
  }
  return out;
}

export function rotatePt(p, deg, origin) {
  const r = (deg * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
  const x = p[0] - origin[0], y = p[1] - origin[1];
  return [origin[0] + x * c - y * s, origin[1] + x * s + y * c];
}
