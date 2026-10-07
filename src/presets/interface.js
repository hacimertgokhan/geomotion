// Interface & feedback: loaders, confirmations, toggles, notifications.

const spinnerFrames = () => {
  const kfs = [];
  for (let k = 0; k < 24; k++) {
    const tail = -90 + k * 15;
    const len = 150 + 100 * Math.sin((k / 24) * Math.PI * 2);
    kfs.push({ shapes: [{ id: 'arc', type: 'arc', cx: 600, cy: 600, r: 240, start: tail, end: tail + len, width: 40 }] });
  }
  return kfs;
};

const BELL = 'M600 330C480 330 420 430 420 540L420 690L350 780L850 780L780 690L780 540C780 430 720 330 600 330Z';
const bell = (rot, badge) => {
  const tr = { rotate: rot, origin: [600, 300] };
  const shapes = [
    { id: 'body', type: 'path', d: BELL, fill: 'sun', transform: tr },
    { id: 'knob', type: 'circle', cx: 600, cy: 300, r: 28, transform: tr },
    { id: 'clapper', type: 'arc', cx: 600, cy: 800, r: 62, start: 20, end: 160, transform: { rotate: rot * 1.6, origin: [600, 300] } },
  ];
  if (badge) shapes.push({ id: 'badge', type: 'circle', cx: 800, cy: 350, r: 62, fill: 'clay', enter: 'pop' });
  return shapes;
};

const search = (dx, dy) => [
  { id: 'lens', type: 'circle', cx: 540 + dx, cy: 520 + dy, r: 170, fill: 'cactus' },
  { id: 'handle', type: 'line', from: [665 + dx, 645 + dy], to: [830 + dx, 810 + dy], width: 44 },
];

export default {
  loader: {
    title: 'Shape loader',
    description: 'Circle → rounded square → triangle, a playful loading loop.',
    tags: ['loading', 'morph'],
    spec: {
      name: 'loader', hold: 0.35, duration: 0.75, ease: 'inOutBack',
      keyframes: [
        { shapes: [{ id: 's', type: 'circle', cx: 600, cy: 600, r: 260, fill: 'oat' }] },
        { shapes: [{ id: 's', type: 'rect', cx: 600, cy: 600, w: 470, h: 470, radius: 50, fill: 'clay', transform: { rotate: 10 } }] },
        { shapes: [{ id: 's', type: 'triangle', cx: 600, cy: 640, r: 330, fill: 'sky' }] },
      ],
    },
  },

  spinner: {
    title: 'Ink spinner',
    description: 'A hand-drawn arc that stretches and chases its own tail.',
    tags: ['loading'],
    spec: { name: 'spinner', hold: 0, duration: 0.05, ease: 'linear', boil: 12, keyframes: spinnerFrames() },
  },

  success: {
    title: 'Success check',
    description: 'A circle is drawn, then a check mark writes itself in.',
    tags: ['confirmation', 'draw'],
    spec: {
      name: 'success', ease: 'inOutCubic',
      keyframes: [
        { hold: 0.3, duration: 1.2, shapes: [] },
        { hold: 1.3, duration: 0.5, shapes: [
          { id: 'ring', type: 'circle', cx: 600, cy: 600, r: 310, fill: 'cactus', enter: 'draw' },
          { id: 'check', type: 'polyline', points: [[440, 615], [560, 735], [790, 470]], enter: 'draw', delay: 0.5, width: 32 },
        ] },
      ],
    },
  },

  error: {
    title: 'Error cross',
    description: 'A coral circle and a cross drawn in two quick strokes.',
    tags: ['confirmation', 'draw'],
    spec: {
      name: 'error', ease: 'inOutCubic',
      keyframes: [
        { hold: 0.3, duration: 1.1, shapes: [] },
        { hold: 1.3, duration: 0.5, shapes: [
          { id: 'ring', type: 'circle', cx: 600, cy: 600, r: 310, fill: 'coral', enter: 'draw' },
          { id: 'x1', type: 'line', from: [480, 480], to: [720, 720], enter: 'draw', delay: 0.5, width: 32 },
          { id: 'x2', type: 'line', from: [720, 480], to: [480, 720], enter: 'draw', delay: 0.68, width: 32 },
        ] },
      ],
    },
  },

  toggle: {
    title: 'Toggle',
    description: 'A switch flicks on with a springy knob and a colour change.',
    tags: ['control'],
    spec: {
      name: 'toggle', hold: 0.8, duration: 0.55, ease: 'inOutBack',
      keyframes: [
        { shapes: [
          { id: 'pill', type: 'rect', cx: 600, cy: 600, w: 580, h: 290, radius: 145, fill: 'paper' },
          { id: 'knob', type: 'circle', cx: 455, cy: 600, r: 105, fill: 'white' },
        ] },
        { shapes: [
          { id: 'pill', type: 'rect', cx: 600, cy: 600, w: 580, h: 290, radius: 145, fill: 'olive' },
          { id: 'knob', type: 'circle', cx: 745, cy: 600, r: 105, fill: 'white' },
        ] },
      ],
    },
  },

  bell: {
    title: 'Notification',
    description: 'A bell rings and a badge pops in.',
    tags: ['notification'],
    spec: {
      name: 'bell', hold: 0.04, duration: 0.2, ease: 'inOutSine',
      keyframes: [
        { hold: 0.7, shapes: bell(0, false) },
        { shapes: bell(-14, true) },
        { shapes: bell(12, true) },
        { shapes: bell(-8, true) },
        { shapes: bell(5, true) },
        { hold: 1.0, duration: 0.4, shapes: bell(0, true) },
      ],
    },
  },

  search: {
    title: 'Search',
    description: 'A magnifying glass looks around the page.',
    tags: ['search'],
    spec: {
      name: 'search', hold: 0.25, duration: 0.7, ease: 'inOutCubic',
      keyframes: [
        { shapes: search(0, 0) },
        { shapes: search(-110, 70) },
        { shapes: search(120, -30) },
      ],
    },
  },
};
