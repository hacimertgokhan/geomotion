// Closed contour → cubic Bezier via Catmull-Rom → SVG "d" / Lottie path.

/** @returns {{v:number[][], o:number[][], i:number[][]}} (o/i: tangents relative to each vertex) */
export function catmullRom(pts, tension = 1) {
  const n = pts.length;
  const v = [], o = [], ii = [];
  const k = tension / 6;
  for (let j = 0; j < n; j++) {
    const p0 = pts[(j - 1 + n) % n], p2 = pts[(j + 1) % n];
    const tx = (p2[0] - p0[0]) * k, ty = (p2[1] - p0[1]) * k;
    v.push(pts[j]);
    o.push([tx, ty]);
    ii.push([-tx, -ty]);
  }
  return { v, o, i: ii };
}

const fmt = (x, d) => {
  const m = 10 ** d;
  const r = Math.round(x * m) / m;
  return Object.is(r, -0) ? '0' : String(r);
};

function pair(a, b, d) {
  const sb = fmt(b, d);
  return fmt(a, d) + (sb[0] === '-' ? '' : ' ') + sb;
}

/** Compact relative SVG path (deltas between rounded absolutes, so no drift). */
export function contourToD(pts, decimals = 0) {
  const n = pts.length;
  if (n < 3) return '';
  const { v, o, i } = catmullRom(pts);
  const m = 10 ** decimals;
  const R = (x) => Math.round(x * m) / m;
  let cx = R(v[0][0]), cy = R(v[0][1]);
  let d = `M${pair(cx, cy, decimals)}c`;
  const parts = [];
  for (let j = 0; j < n; j++) {
    const a = v[j], b = v[(j + 1) % n];
    const c1 = [R(a[0] + o[j][0]), R(a[1] + o[j][1])];
    const nb = (j + 1) % n;
    const c2 = [R(b[0] + i[nb][0]), R(b[1] + i[nb][1])];
    const p = j === n - 1 ? [R(v[0][0]), R(v[0][1])] : [R(b[0]), R(b[1])];
    parts.push(
      `${pair(c1[0] - cx, c1[1] - cy, decimals)} ${pair(c2[0] - cx, c2[1] - cy, decimals)} ${pair(p[0] - cx, p[1] - cy, decimals)}`
    );
    cx = p[0]; cy = p[1];
  }
  d += parts.join(' ').replace(/ -/g, '-') + 'z';
  return d;
}

/** Lottie "sh" path data. */
export function contourToLottie(pts, decimals = 1) {
  const { v, o, i } = catmullRom(pts);
  const m = 10 ** decimals;
  const R = (p) => [Math.round(p[0] * m) / m, Math.round(p[1] * m) / m];
  return { c: true, v: v.map(R), i: i.map(R), o: o.map(R) };
}
