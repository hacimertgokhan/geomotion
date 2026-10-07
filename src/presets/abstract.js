// Abstract compositions.

const orbitFrames = () => {
  const kfs = [];
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    kfs.push({ shapes: [
      { id: 'path', type: 'ellipse', cx: 600, cy: 620, rx: 420, ry: 170, width: 12, color: 'slate', transform: { rotate: -14 } },
      { id: 'sun', type: 'circle', cx: 600, cy: 620, r: 140, fill: 'sun' },
      { id: 'planet', type: 'circle', r: 58, fill: 'sky',
        cx: 600 + 420 * Math.cos(a) * Math.cos(-0.244) - 170 * Math.sin(a) * Math.sin(-0.244),
        cy: 620 + 420 * Math.cos(a) * Math.sin(-0.244) + 170 * Math.sin(a) * Math.cos(-0.244) },
    ] });
  }
  return kfs;
};

const poly = (sides, fill, rot) =>
  sides === 0
    ? { id: 'p', type: 'circle', cx: 600, cy: 600, r: 300, fill }
    : { id: 'p', type: 'regular', cx: 600, cy: 610, r: 330, sides, fill, angle: rot };

export default {
  drift: {
    title: 'Drift',
    description: 'A wandering paper blob and morphing line art.',
    tags: ['composition', 'morph'],
    spec: {
      name: 'drift', hold: 0.5, duration: 1.2, ease: 'inOutQuart',
      keyframes: [
        { shapes: [
          { id: 'blob', type: 'blob', cx: 340, cy: 830, r: 240, seed: 2, stroke: false, fill: 'oat' },
          { id: 'circle', type: 'circle', cx: 820, cy: 420, r: 210 },
          { id: 'base', type: 'line', from: [120, 1030], to: [1080, 1030] },
        ] },
        { shapes: [
          { id: 'blob', type: 'blob', cx: 830, cy: 460, r: 250, seed: 5, stroke: false, fill: 'oat' },
          { id: 'circle', type: 'circle', cx: 370, cy: 420, r: 190 },
          { id: 'base', type: 'polygon', points: [[300, 1040], [520, 700], [1040, 700], [820, 1040]] },
        ] },
        { shapes: [
          { id: 'blob', type: 'blob', cx: 600, cy: 700, r: 300, seed: 9, stroke: false, fill: 'oat' },
          { id: 'circle', type: 'circle', cx: 600, cy: 330, r: 150 },
          { id: 'base', type: 'triangle', cx: 600, cy: 800, r: 280 },
        ] },
      ],
    },
  },

  orbit: {
    title: 'Orbit',
    description: 'A little planet circling its sun on a tilted path.',
    tags: ['space', 'loop'],
    spec: { name: 'orbit', hold: 0, duration: 0.22, ease: 'linear', keyframes: orbitFrames() },
  },

  kaleido: {
    title: 'Kaleido',
    description: 'Triangle → square → pentagon → hexagon → circle, colours cycling.',
    tags: ['geometry', 'morph'],
    spec: {
      name: 'kaleido', hold: 0.3, duration: 0.7, ease: 'inOutBack',
      keyframes: [
        { shapes: [poly(3, 'clay', 0)] },
        { shapes: [poly(4, 'sun', 45)] },
        { shapes: [poly(5, 'cactus', 0)] },
        { shapes: [poly(6, 'sky', 30)] },
        { shapes: [poly(0, 'coral')] },
      ],
    },
  },

  pebbles: {
    title: 'Pebbles',
    description: 'Three organic pebbles that keep rearranging themselves.',
    tags: ['composition', 'organic'],
    spec: {
      name: 'pebbles', hold: 0.4, duration: 1.1, ease: 'inOutCubic',
      keyframes: [
        { shapes: [
          { id: 'a', type: 'blob', cx: 420, cy: 460, r: 210, seed: 3, fill: 'oat' },
          { id: 'b', type: 'blob', cx: 800, cy: 640, r: 170, seed: 7, fill: 'cactus' },
          { id: 'c', type: 'blob', cx: 470, cy: 850, r: 120, seed: 11, fill: 'clay' },
        ] },
        { shapes: [
          { id: 'a', type: 'blob', cx: 760, cy: 420, r: 170, seed: 4, fill: 'kraft' },
          { id: 'b', type: 'blob', cx: 420, cy: 700, r: 230, seed: 8, fill: 'oat' },
          { id: 'c', type: 'blob', cx: 840, cy: 860, r: 140, seed: 12, fill: 'sky' },
        ] },
        { shapes: [
          { id: 'a', type: 'blob', cx: 600, cy: 360, r: 150, seed: 5, fill: 'coral' },
          { id: 'b', type: 'blob', cx: 780, cy: 760, r: 190, seed: 9, fill: 'heather' },
          { id: 'c', type: 'blob', cx: 380, cy: 720, r: 180, seed: 13, fill: 'oat' },
        ] },
      ],
    },
  },
};
