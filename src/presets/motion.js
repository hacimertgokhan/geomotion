// Motion & physics: squash, stretch and swing.

const pend = (deg) => {
  const tr = { rotate: deg, origin: [600, 180] };
  return [
    { id: 'beam', type: 'line', from: [380, 180], to: [820, 180] },
    { id: 'rod', type: 'line', from: [600, 180], to: [600, 760], width: 16, transform: tr },
    { id: 'bob', type: 'circle', cx: 600, cy: 840, r: 92, fill: 'clay', transform: tr },
    { id: 'pivot', type: 'circle', cx: 600, cy: 180, r: 18, stroke: false, fill: 'ink', misregister: false },
  ];
};

const jelly = (sx, sy) => [
  { id: 'j', type: 'rect', cx: 600, cy: 940 - 170 * sy, w: 380 * sx, h: 340 * sy, radius: 120, fill: 'cactus' },
  { id: 'eL', type: 'circle', cx: 600 - 60 * sx, cy: 940 - 200 * sy, r: 18, stroke: false, fill: 'ink', misregister: false },
  { id: 'eR', type: 'circle', cx: 600 + 60 * sx, cy: 940 - 200 * sy, r: 18, stroke: false, fill: 'ink', misregister: false },
  { id: 'floor', type: 'line', from: [240, 945], to: [960, 945] },
];

export default {
  bounce: {
    title: 'Bounce',
    description: 'A squash-and-stretch ball bouncing on a hand-drawn floor.',
    tags: ['physics', 'loop'],
    spec: {
      name: 'bounce', boil: 12,
      keyframes: [
        { hold: 0.05, duration: 0.42, ease: 'inQuad', shapes: [
          { id: 'ball', type: 'circle', cx: 600, cy: 300, r: 130, fill: 'clay' },
          { id: 'shadow', type: 'ellipse', cx: 600, cy: 1000, rx: 70, ry: 14, stroke: false, fill: 'oat', misregister: false },
          { id: 'floor', type: 'line', from: [200, 985], to: [1000, 985] },
        ] },
        { hold: 0.04, duration: 0.1, ease: 'outQuad', shapes: [
          { id: 'ball', type: 'ellipse', cx: 600, cy: 905, rx: 175, ry: 78, fill: 'clay' },
          { id: 'shadow', type: 'ellipse', cx: 600, cy: 1000, rx: 190, ry: 22, stroke: false, fill: 'oat', misregister: false },
          { id: 'floor', type: 'wave', from: [200, 985], to: [1000, 985], amplitude: 8, waves: 1 },
        ] },
        { hold: 0, duration: 0.38, ease: 'outQuad', shapes: [
          { id: 'ball', type: 'ellipse', cx: 600, cy: 760, rx: 112, ry: 150, fill: 'clay' },
          { id: 'shadow', type: 'ellipse', cx: 600, cy: 1000, rx: 130, ry: 18, stroke: false, fill: 'oat', misregister: false },
          { id: 'floor', type: 'line', from: [200, 985], to: [1000, 985] },
        ] },
      ],
    },
  },

  pendulum: {
    title: 'Pendulum',
    description: 'A heavy bob swinging back and forth.',
    tags: ['physics', 'loop'],
    spec: {
      name: 'pendulum', hold: 0,
      keyframes: [
        { duration: 0.55, ease: 'inSine', shapes: pend(-30) },
        { duration: 0.55, ease: 'outSine', shapes: pend(0) },
        { duration: 0.55, ease: 'inSine', shapes: pend(30) },
        { duration: 0.55, ease: 'outSine', shapes: pend(0) },
      ],
    },
  },

  jelly: {
    title: 'Jelly',
    description: 'A jelly cube squishes and wobbles back with elastic easing.',
    tags: ['physics', 'character'],
    spec: {
      name: 'jelly',
      keyframes: [
        { hold: 0.6, duration: 0.25, ease: 'inQuad', shapes: jelly(1, 1) },
        { hold: 0.05, duration: 1.0, ease: 'outElastic', shapes: jelly(1.35, 0.62) },
      ],
    },
  },
};
