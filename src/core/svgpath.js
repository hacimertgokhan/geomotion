// Minimal SVG path "d" parser → polyline subpaths.
// Supports M L H V C S Q T A Z (absolute + relative).

const TOKEN = /[MmLlHhVvCcSsQqTtAaZz]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g;
const ARGC = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0 };

function cubic(p0, p1, p2, p3, steps, out) {
  for (let i = 1; i <= steps; i++) {
    const t = i / steps, u = 1 - t;
    out.push([
      u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
    ]);
  }
}

function quad(p0, p1, p2, steps, out) {
  for (let i = 1; i <= steps; i++) {
    const t = i / steps, u = 1 - t;
    out.push([
      u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
      u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
    ]);
  }
}

// SVG elliptical arc (endpoint → center parameterization)
function arc(p0, rx, ry, phiDeg, large, sweep, p1, out) {
  if (rx === 0 || ry === 0) { out.push(p1); return; }
  rx = Math.abs(rx); ry = Math.abs(ry);
  const phi = (phiDeg * Math.PI) / 180, cp = Math.cos(phi), sp = Math.sin(phi);
  const dx = (p0[0] - p1[0]) / 2, dy = (p0[1] - p1[1]) / 2;
  const x1 = cp * dx + sp * dy, y1 = -sp * dx + cp * dy;
  const lam = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry);
  if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
  const num = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1;
  const den = rx * rx * y1 * y1 + ry * ry * x1 * x1;
  let co = Math.sqrt(Math.max(0, num / den));
  if (large === sweep) co = -co;
  const cx1 = (co * rx * y1) / ry, cy1 = (-co * ry * x1) / rx;
  const cx = cp * cx1 - sp * cy1 + (p0[0] + p1[0]) / 2;
  const cy = sp * cx1 + cp * cy1 + (p0[1] + p1[1]) / 2;
  const ang = (ux, uy, vx, vy) => {
    const a = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
    return a;
  };
  const t1 = ang(1, 0, (x1 - cx1) / rx, (y1 - cy1) / ry);
  let dt = ang((x1 - cx1) / rx, (y1 - cy1) / ry, (-x1 - cx1) / rx, (-y1 - cy1) / ry);
  if (!sweep && dt > 0) dt -= 2 * Math.PI;
  if (sweep && dt < 0) dt += 2 * Math.PI;
  const steps = Math.max(4, Math.ceil(Math.abs(dt) / (Math.PI / 16)));
  for (let i = 1; i <= steps; i++) {
    const t = t1 + (dt * i) / steps;
    const x = rx * Math.cos(t), y = ry * Math.sin(t);
    out.push([cp * x - sp * y + cx, sp * x + cp * y + cy]);
  }
}

/** @returns {{points:number[][], closed:boolean}[]} */
export function parsePath(d) {
  const tokens = String(d).match(TOKEN) || [];
  const subpaths = [];
  let cur = null;
  let pos = [0, 0], start = [0, 0];
  let lastCtrl = null, lastCmd = '';
  let i = 0, cmd = '';
  const num = () => parseFloat(tokens[i++]);

  const begin = (p) => {
    if (cur && cur.points.length > 1) subpaths.push(cur);
    cur = { points: [p], closed: false };
  };

  while (i < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[i])) cmd = tokens[i++];
    else if (!cmd) { i++; continue; }
    const lc = cmd.toLowerCase();
    const rel = cmd !== cmd.toUpperCase();
    if (lc === 'z') {
      if (cur) { cur.closed = true; subpaths.push(cur); cur = null; }
      pos = [...start];
      lastCtrl = null; lastCmd = 'z';
      continue;
    }
    if (i + ARGC[lc] > tokens.length) break;
    const o = rel ? pos : [0, 0];
    if (!cur && lc !== 'm') begin([...pos]);
    switch (lc) {
      case 'm': {
        const p = [o[0] + num(), o[1] + num()];
        begin(p); pos = p; start = [...p];
        cmd = rel ? 'l' : 'L'; // subsequent pairs are implicit lineto
        lastCtrl = null;
        break;
      }
      case 'l': { const p = [o[0] + num(), o[1] + num()]; cur.points.push(p); pos = p; lastCtrl = null; break; }
      case 'h': { const p = [(rel ? pos[0] : 0) + num(), pos[1]]; cur.points.push(p); pos = p; lastCtrl = null; break; }
      case 'v': { const p = [pos[0], (rel ? pos[1] : 0) + num()]; cur.points.push(p); pos = p; lastCtrl = null; break; }
      case 'c': {
        const c1 = [o[0] + num(), o[1] + num()], c2 = [o[0] + num(), o[1] + num()], p = [o[0] + num(), o[1] + num()];
        cubic(pos, c1, c2, p, 16, cur.points); lastCtrl = c2; pos = p; break;
      }
      case 's': {
        const c1 = lastCtrl && /[cs]/i.test(lastCmd) ? [2 * pos[0] - lastCtrl[0], 2 * pos[1] - lastCtrl[1]] : [...pos];
        const c2 = [o[0] + num(), o[1] + num()], p = [o[0] + num(), o[1] + num()];
        cubic(pos, c1, c2, p, 16, cur.points); lastCtrl = c2; pos = p; break;
      }
      case 'q': {
        const c = [o[0] + num(), o[1] + num()], p = [o[0] + num(), o[1] + num()];
        quad(pos, c, p, 12, cur.points); lastCtrl = c; pos = p; break;
      }
      case 't': {
        const c = lastCtrl && /[qt]/i.test(lastCmd) ? [2 * pos[0] - lastCtrl[0], 2 * pos[1] - lastCtrl[1]] : [...pos];
        const p = [o[0] + num(), o[1] + num()];
        quad(pos, c, p, 12, cur.points); lastCtrl = c; pos = p; break;
      }
      case 'a': {
        const rx = num(), ry = num(), rot = num(), large = num(), sweep = num();
        const p = [o[0] + num(), o[1] + num()];
        arc(pos, rx, ry, rot, !!large, !!sweep, p, cur.points); lastCtrl = null; pos = p; break;
      }
    }
    lastCmd = cmd;
  }
  if (cur && cur.points.length > 1) subpaths.push(cur);
  // Drop a closing point that duplicates the start
  for (const sp of subpaths) {
    if (sp.closed && sp.points.length > 2) {
      const a = sp.points[0], b = sp.points[sp.points.length - 1];
      if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-6) sp.points.pop();
    }
  }
  return subpaths;
}
