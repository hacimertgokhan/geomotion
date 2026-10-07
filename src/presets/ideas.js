// Ideas, business & building.

const BULB = 'M600 250C470 250 380 350 380 470C380 560 440 610 470 660C490 695 495 730 495 760L705 760C705 730 710 695 730 660C760 610 820 560 820 470C820 350 730 250 600 250Z';
const ray = (deg, r0, r1, cx = 600, cy = 470) => {
  const a = (deg * Math.PI) / 180;
  return { from: [cx + r0 * Math.cos(a), cy + r0 * Math.sin(a)], to: [cx + r1 * Math.cos(a), cy + r1 * Math.sin(a)] };
};
const bulbBase = (fill) => [
  { id: 'bulb', type: 'path', d: BULB, fill },
  { id: 'b1', type: 'line', from: [510, 815], to: [690, 815] },
  { id: 'b2', type: 'line', from: [540, 868], to: [660, 868] },
];

const bars = (heights, extra = {}) =>
  heights.map((h, i) => ({
    id: `bar${i}`, type: 'rect', x: 360 + i * 160, y: 930 - h, w: 110, h,
    fill: ['oat', 'kraft', 'clay', 'olive'][i], delay: i * 0.1, ...extra,
  }));
const axes = { id: 'axes', type: 'polyline', points: [[270, 230], [270, 930], [990, 930]] };

const gears = (k) => [
  { id: 'g1', type: 'star', cx: 470, cy: 520, r: 240, inner: 0.8, points: 10, fill: 'oat', angle: k * 9 },
  { id: 'h1', type: 'circle', cx: 470, cy: 520, r: 70 },
  { id: 'g2', type: 'star', cx: 800, cy: 820, r: 185, inner: 0.76, points: 8, fill: 'clay', angle: 22.5 - k * 11.25 },
  { id: 'h2', type: 'circle', cx: 800, cy: 820, r: 52 },
];

const house = [
  { id: 'ground', type: 'line', from: [160, 960], to: [1040, 960] },
  { id: 'walls', type: 'rect', x: 340, y: 560, w: 520, h: 400, fill: 'oat', enter: 'pop' },
  { id: 'roof', type: 'polygon', points: [[290, 580], [600, 290], [910, 580]], fill: 'clay', enter: 'pop', delay: 0.25 },
  { id: 'door', type: 'rect', x: 540, y: 760, w: 120, h: 200, radius: 10, fill: 'kraft', enter: 'pop', delay: 0.45 },
  { id: 'win', type: 'rect', x: 400, y: 640, w: 90, h: 90, fill: 'sky', enter: 'pop', delay: 0.55 },
  { id: 'win2', type: 'rect', x: 710, y: 640, w: 90, h: 90, fill: 'sky', enter: 'pop', delay: 0.6 },
];

export default {
  idea: {
    title: 'Idea',
    description: 'A light bulb switches on and its rays are drawn one by one.',
    tags: ['creativity', 'draw'],
    spec: {
      name: 'idea', hold: 0.8, duration: 0.9,
      keyframes: [
        { shapes: bulbBase('oat') },
        { hold: 1.2, shapes: [
          ...bulbBase('sun'),
          { id: 'r1', type: 'line', ...ray(-90, 280, 370), enter: 'draw', delay: 0.1 },
          { id: 'r2', type: 'line', ...ray(-135, 280, 370), enter: 'draw', delay: 0.25 },
          { id: 'r3', type: 'line', ...ray(-45, 280, 370), enter: 'draw', delay: 0.25 },
          { id: 'r4', type: 'line', ...ray(180, 280, 370), enter: 'draw', delay: 0.4 },
          { id: 'r5', type: 'line', ...ray(0, 280, 370), enter: 'draw', delay: 0.4 },
        ] },
      ],
    },
  },

  growth: {
    title: 'Growth chart',
    description: 'Bars spring up and a trend arrow is sketched over them.',
    tags: ['business', 'data'],
    spec: {
      name: 'growth', ease: 'outBack',
      keyframes: [
        { hold: 0.4, duration: 1.0, shapes: [axes, ...bars([30, 30, 30, 30])] },
        { hold: 1.4, duration: 0.6, ease: 'inOutCubic', shapes: [
          axes, ...bars([200, 330, 270, 520]),
          { id: 'trend', type: 'polyline', points: [[330, 640], [495, 520], [655, 590], [930, 300]], enter: 'draw', delay: 0.45, ease: 'inOutCubic', color: 'ink' },
          { id: 'tip', type: 'polyline', points: [[835, 300], [930, 300], [930, 395]], enter: 'draw', delay: 0.8, ease: 'inOutCubic' },
        ] },
      ],
    },
  },

  target: {
    title: 'Target',
    description: 'An arrow is drawn into the bullseye and the rings wobble.',
    tags: ['goal', 'business'],
    spec: {
      name: 'target', ease: 'inOutCubic',
      keyframes: [
        { hold: 0.4, duration: 0.45, ease: 'inQuad', shapes: [
          { id: 'r1', type: 'circle', cx: 560, cy: 640, r: 320, fill: 'white' },
          { id: 'r2', type: 'circle', cx: 560, cy: 640, r: 210 },
          { id: 'r3', type: 'circle', cx: 560, cy: 640, r: 100, fill: 'clay' },
        ] },
        { hold: 0.05, duration: 0.35, ease: 'outElastic', shapes: [
          { id: 'r1', type: 'circle', cx: 560, cy: 640, r: 300, fill: 'white' },
          { id: 'r2', type: 'circle', cx: 560, cy: 640, r: 200 },
          { id: 'r3', type: 'circle', cx: 560, cy: 640, r: 92, fill: 'clay' },
          { id: 'shaft', type: 'line', from: [1020, 180], to: [575, 625], enter: 'draw', width: 26 },
          { id: 'f1', type: 'line', from: [1020, 180], to: [1020, 90], enter: 'draw', width: 20 },
          { id: 'f2', type: 'line', from: [1020, 180], to: [1110, 180], enter: 'draw', width: 20 },
        ] },
        { hold: 1.3, duration: 0.5, shapes: [
          { id: 'r1', type: 'circle', cx: 560, cy: 640, r: 320, fill: 'white' },
          { id: 'r2', type: 'circle', cx: 560, cy: 640, r: 210 },
          { id: 'r3', type: 'circle', cx: 560, cy: 640, r: 100, fill: 'clay' },
          { id: 'shaft', type: 'line', from: [1020, 180], to: [575, 625], width: 26 },
          { id: 'f1', type: 'line', from: [1020, 180], to: [1020, 90], width: 20 },
          { id: 'f2', type: 'line', from: [1020, 180], to: [1110, 180], width: 20 },
        ] },
      ],
    },
  },

  gears: {
    title: 'Gears',
    description: 'Two meshing gears turning — a classic “processing” loop.',
    tags: ['process', 'loading', 'loop'],
    spec: {
      name: 'gears', hold: 0, duration: 0.12, ease: 'linear',
      keyframes: [0, 1, 2, 3].map((k) => ({ shapes: gears(k) })),
    },
  },

  house: {
    title: 'Build',
    description: 'A little house assembles itself piece by piece.',
    tags: ['build', 'home'],
    spec: {
      name: 'house', ease: 'outBack',
      keyframes: [
        { hold: 0.4, duration: 1.3, shapes: [house[0]] },
        { hold: 1.4, duration: 0.6, ease: 'inOutCubic', shapes: house },
      ],
    },
  },
};
