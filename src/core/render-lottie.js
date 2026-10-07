// Frames → Lottie JSON (bodymovin). One shape layer per unique frame, shown
// only between its in/out points — the same structure hand-traced Lottie
// animations use. Plays in lottie-web, LottieFiles, After Effects (via plugin),
// iOS/Android Lottie.
import { contourToLottie } from './smooth.js';
import { hexToRgb } from './palette.js';

const sv = (k) => ({ a: 0, k });

const groupTransform = () => ({
  ty: 'tr', p: sv([0, 0]), a: sv([0, 0]), s: sv([100, 100]), r: sv(0), o: sv(100), sk: sv(0), sa: sv(0), nm: 'Transform',
});

const layerTransform = () => ({
  o: sv(100), r: sv(0), p: sv([0, 0, 0]), a: sv([0, 0, 0]), s: sv([100, 100, 100]),
});

function color(hex) {
  const [r, g, b] = hexToRgb(hex);
  return [r / 255, g / 255, b / 255, 1].map((v) => Math.round(v * 1000) / 1000);
}

function opGroup(op, i, dec) {
  return {
    ty: 'gr',
    nm: `ink ${i}`,
    it: [
      ...op.contours.map((c, k) => ({ ty: 'sh', nm: `p${k}`, ks: sv(contourToLottie(c, dec)) })),
      { ty: 'fl', nm: 'Fill', c: sv(color(op.color)), o: sv(Math.round(op.opacity * 100)), r: 1 },
      groupTransform(),
    ],
  };
}

export function toLottie(compiled) {
  const { meta, frames } = compiled;
  const dec = Math.min(meta.width, meta.height) >= 600 ? 0 : 1;
  const layers = frames.map((f, i) => ({
    ddd: 0, ind: i + 1, ty: 4, nm: `frame ${i}`, sr: 1,
    ks: layerTransform(), ao: 0,
    // Lottie: earlier items draw on top → reverse our back-to-front op order
    shapes: f.ops.map((op, k) => opGroup(op, k, dec)).reverse(),
    ip: f.start, op: f.end, st: 0, bm: 0,
  }));
  if (meta.background) {
    layers.push({
      ddd: 0, ind: frames.length + 1, ty: 4, nm: 'background', sr: 1, ks: layerTransform(), ao: 0,
      shapes: [{
        ty: 'gr', nm: 'bg',
        it: [
          { ty: 'rc', nm: 'rect', d: 1, s: sv([meta.width, meta.height]), p: sv([meta.width / 2, meta.height / 2]), r: sv(0) },
          { ty: 'fl', nm: 'Fill', c: sv(color(meta.background)), o: sv(100), r: 1 },
          groupTransform(),
        ],
      }],
      ip: 0, op: meta.frames, st: 0, bm: 0,
    });
  }
  return {
    v: '5.7.4', fr: meta.fps, ip: 0, op: meta.frames, w: meta.width, h: meta.height,
    nm: meta.name, ddd: 0, assets: [], layers,
  };
}
