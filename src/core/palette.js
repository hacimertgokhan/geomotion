// Warm "paper & ink" palette. Use names or hex values anywhere in a spec.
export const PALETTE = {
  ink: '#141413',
  slate: '#3d3d3a',
  ivory: '#faf9f5',
  paper: '#f0eee6',
  oat: '#e3dacc',
  kraft: '#d4a27f',
  clay: '#d97757',
  coral: '#ebcece',
  fig: '#c46686',
  sky: '#6a9bcc',
  cactus: '#bcd1ca',
  olive: '#788c5d',
  heather: '#cbcadb',
  sun: '#f2c46d',
  white: '#ffffff',
};

export function resolveColor(c) {
  if (c == null || c === false) return null;
  if (typeof c !== 'string') throw new Error(`Invalid color: ${JSON.stringify(c)}`);
  return PALETTE[c] ?? c;
}

export function hexToRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]) {
  const to = (v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

export function lerpColor(a, b, t) {
  if (a === b) return a;
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
}
