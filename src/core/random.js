// Deterministic randomness and 1D noise.
// The same spec + seed always produces the same animation.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 32-bit seed from any list of values (FNV-1a). */
export function hashSeed(...parts) {
  let h = 2166136261;
  const s = parts.map(String).join('|');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Smooth 1D value noise in [-1, 1].
 * With period > 0 the noise repeats over x ∈ [0, period)
 * (used on closed shapes so there is no visible seam).
 */
export function makeNoise(seed, period = 0) {
  const rng = mulberry32(seed);
  const size = period > 0 ? period : 256;
  const table = new Float64Array(size);
  for (let i = 0; i < size; i++) table[i] = rng() * 2 - 1;
  const at = (i) => table[((i % size) + size) % size];
  return function (x) {
    const i = Math.floor(x);
    const f = x - i;
    const u = f * f * f * (f * (f * 6 - 15) + 10);
    const a = at(i);
    return a + (at(i + 1) - a) * u;
  };
}
