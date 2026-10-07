// "Ink" rendering: turns a centerline into a hand-drawn filled outline with
// slightly varying width, a gentle wobble and rounded, tapered ends.
// The seed changes on every "boil" frame, so lines shimmer like traced animation.
import { polylineLength, resample, normals, clamp } from './geometry.js';
import { makeNoise, hashSeed } from './random.js';

const smoothstep = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };

// u: arc length (px). Closed shapes get periodic noise so there is no seam.
function field(seed, L, wavelength, closed) {
  if (closed) {
    const P = Math.max(1, Math.round(L / wavelength));
    const n = makeNoise(seed, P);
    return (u) => n((u / L) * P);
  }
  const n = makeNoise(seed);
  const off = (seed % 97) * 0.37;
  return (u) => n(u / wavelength + off);
}

/**
 * @param {number[][]} pts  centerline
 * @param {boolean} closed
 * @param {{width:number, wobble?:number, roughness?:number, taper?:number, seed?:number, scale?:number}} o
 * @returns {number[][][]} contours (fill with the nonzero rule)
 */
export function inkStroke(pts, closed, o) {
  const scale = o.scale ?? 1;
  const width = o.width;
  if (!pts || pts.length < 2 || width < 0.4) return [];
  const L = polylineLength(pts, closed);
  if (L < Math.max(1, width * 0.15)) {
    if (L < 0.5 || width < 1.5) return [];
  }
  const spacing = 13 * scale;
  const n = clamp(Math.round(L / spacing), closed ? 16 : 6, 360);
  const c = resample(pts, n, closed);
  const steps = closed ? n : n - 1;
  const seed = o.seed ?? 1;
  const wob = (o.wobble ?? 1) * clamp(L / (160 * scale), 0.25, 1);
  const rough = o.roughness ?? 1;
  const taper = o.taper ?? 0.5;

  const fLow = field(hashSeed(seed, 'low'), L, 280 * scale, closed);
  const fMid = field(hashSeed(seed, 'mid'), L, 75 * scale, closed);
  const fW = field(hashSeed(seed, 'w'), L, 120 * scale, closed);

  const nrm = normals(c, closed, 2);
  const center = new Array(n);
  const w = new Array(n);
  for (let i = 0; i < n; i++) {
    const u = (i / steps) * L;
    const d = wob * scale * (4.2 * fLow(u) + 1.3 * fMid(u));
    center[i] = [c[i][0] + nrm[i][0] * d, c[i][1] + nrm[i][1] * d];
    let wi = width * (1 + 0.16 * rough * fW(u));
    if (!closed) {
      const e = Math.min(u, L - u);
      const tl = Math.max(1, Math.min(L * 0.3, width * 2.4));
      const minF = 1 - taper * 0.7;
      wi *= minF + (1 - minF) * smoothstep(e / tl);
    }
    w[i] = Math.max(0.3, wi);
  }
  const nn = normals(center, closed, 2);

  if (closed) {
    const outer = [], inner = [];
    for (let i = 0; i < n; i++) {
      const h = w[i] / 2;
      outer.push([center[i][0] + nn[i][0] * h, center[i][1] + nn[i][1] * h]);
      inner.push([center[i][0] - nn[i][0] * h, center[i][1] - nn[i][1] * h]);
    }
    inner.reverse();
    return [outer, inner];
  }

  const left = [], right = [];
  for (let i = 0; i < n; i++) {
    const h = w[i] / 2;
    left.push([center[i][0] + nn[i][0] * h, center[i][1] + nn[i][1] * h]);
    right.push([center[i][0] - nn[i][0] * h, center[i][1] - nn[i][1] * h]);
  }
  const cap = (p, nv, r, dir) => {
    // dir=+1: end cap (left→right around the front); dir=-1: start cap (right→left around the back)
    const t = [nv[1], -nv[0]];
    const out = [];
    const K = 5;
    for (let k = 1; k < K; k++) {
      const th = (k / K) * Math.PI;
      const cs = Math.cos(th), sn = Math.sin(th);
      const vx = dir * (nv[0] * cs + t[0] * sn);
      const vy = dir * (nv[1] * cs + t[1] * sn);
      out.push([p[0] + vx * r, p[1] + vy * r]);
    }
    return out;
  };
  const contour = [
    ...left,
    ...cap(center[n - 1], nn[n - 1], w[n - 1] / 2, 1),
    ...right.reverse(),
    ...cap(center[0], nn[0], w[0] / 2, -1),
  ];
  return [contour];
}

/** Fill blob: a softer closed contour with broader, slower wobble. */
export function inkFill(pts, o) {
  const scale = o.scale ?? 1;
  if (!pts || pts.length < 3) return [];
  const L = polylineLength(pts, true);
  if (L < 2) return [];
  const n = clamp(Math.round(L / (17 * scale)), 16, 280);
  const c = resample(pts, n, true);
  const seed = o.seed ?? 1;
  const wob = (o.wobble ?? 1) * clamp(L / (200 * scale), 0.2, 1);
  const fLow = field(hashSeed(seed, 'fill'), L, 340 * scale, true);
  const fMid = field(hashSeed(seed, 'fill2'), L, 110 * scale, true);
  const nrm = normals(c, true, 2);
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    const u = (i / n) * L;
    const d = wob * scale * (7 * fLow(u) + 1.6 * fMid(u));
    out[i] = [c[i][0] + nrm[i][0] * d, c[i][1] + nrm[i][1] * d];
  }
  return [out];
}
