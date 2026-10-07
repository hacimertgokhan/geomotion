// Nature & weather.

const CLOUD = 'M380 560C320 560 290 500 320 455C340 420 390 410 420 425C440 350 520 310 590 330C640 270 760 280 790 360C870 350 920 420 900 480C940 510 930 560 880 560Z';
const drops = (dy, extra = {}) =>
  [[420, 620], [530, 650], [640, 620], [750, 650], [860, 620]].map(([x, y], i) => ({
    id: `drop${i}`, type: 'line', from: [x, y + dy], to: [x - 22, y + dy + 70], enter: 'draw', delay: i * 0.08, width: 22, ...extra,
  }));

const seaFrames = () => {
  const kfs = [];
  for (let k = 0; k < 8; k++) {
    const ph = k * 45;
    kfs.push({ shapes: [
      { id: 'sun', type: 'circle', cx: 840, cy: 300, r: 120, fill: 'sun' },
      { id: 'w1', type: 'wave', from: [120, 560], to: [1080, 560], amplitude: 38, waves: 2, phase: ph },
      { id: 'w2', type: 'wave', from: [120, 700], to: [1080, 700], amplitude: 38, waves: 2, phase: ph + 120 },
      { id: 'w3', type: 'wave', from: [120, 840], to: [1080, 840], amplitude: 38, waves: 2, phase: ph + 240 },
    ] });
  }
  return kfs;
};

export default {
  sunrise: {
    title: 'Sunrise',
    description: 'A sun rises over a horizon that turns into hills, then mountains.',
    tags: ['landscape', 'morph'],
    spec: {
      name: 'sunrise', hold: 0.6, duration: 1.1, ease: 'inOutCubic',
      keyframes: [
        { shapes: [
          { id: 'sun', type: 'circle', cx: 600, cy: 720, r: 190, fill: 'oat' },
          { id: 'ground', type: 'line', from: [140, 900], to: [1060, 900] },
        ] },
        { ease: 'inOutBack', shapes: [
          { id: 'sun', type: 'circle', cx: 600, cy: 420, r: 230, fill: 'sun' },
          { id: 'ground', type: 'wave', from: [140, 900], to: [1060, 900], amplitude: 34, waves: 2 },
        ] },
        { shapes: [
          { id: 'sun', type: 'circle', cx: 830, cy: 330, r: 150, fill: 'clay' },
          { id: 'ground', type: 'polyline', points: [[140, 900], [420, 540], [600, 760], [800, 500], [1060, 900]] },
        ] },
      ],
    },
  },

  sprout: {
    title: 'Sprout',
    description: 'A stem draws itself out of a pot, leaves unfold, a flower pops.',
    tags: ['growth', 'draw'],
    spec: {
      name: 'sprout', ease: 'inOutCubic',
      keyframes: [
        { hold: 0.5, duration: 0.9, shapes: [
          { id: 'pot', type: 'polygon', points: [[430, 820], [770, 820], [725, 1040], [475, 1040]], fill: 'clay' },
        ] },
        { hold: 0.15, duration: 0.7, shapes: [
          { id: 'pot', type: 'polygon', points: [[430, 820], [770, 820], [725, 1040], [475, 1040]], fill: 'clay' },
          { id: 'stem', type: 'path', d: 'M600 820C600 720 570 640 600 500', enter: 'draw' },
        ] },
        { hold: 0.15, duration: 0.7, shapes: [
          { id: 'pot', type: 'polygon', points: [[430, 820], [770, 820], [725, 1040], [475, 1040]], fill: 'clay' },
          { id: 'stem', type: 'path', d: 'M600 820C600 720 570 640 600 500' },
          { id: 'leafL', type: 'ellipse', cx: 505, cy: 670, rx: 92, ry: 40, fill: 'olive', transform: { rotate: -28 }, enter: 'pop' },
          { id: 'leafR', type: 'ellipse', cx: 690, cy: 610, rx: 92, ry: 40, fill: 'olive', transform: { rotate: 28 }, enter: 'pop', delay: 0.2 },
        ] },
        { hold: 1.4, duration: 0.8, shapes: [
          { id: 'pot', type: 'polygon', points: [[430, 820], [770, 820], [725, 1040], [475, 1040]], fill: 'clay' },
          { id: 'stem', type: 'path', d: 'M600 820C600 720 570 640 600 500' },
          { id: 'leafL', type: 'ellipse', cx: 505, cy: 670, rx: 92, ry: 40, fill: 'olive', transform: { rotate: -28 } },
          { id: 'leafR', type: 'ellipse', cx: 690, cy: 610, rx: 92, ry: 40, fill: 'olive', transform: { rotate: 28 } },
          { id: 'petals', type: 'star', cx: 600, cy: 410, r: 140, inner: 0.62, points: 6, fill: 'coral', enter: 'pop' },
          { id: 'core', type: 'circle', cx: 600, cy: 410, r: 52, fill: 'sun', enter: 'pop', delay: 0.25 },
        ] },
      ],
    },
  },

  rain: {
    title: 'Rain → sun',
    description: 'Rain falls from a cloud, then the sun peeks out.',
    tags: ['weather'],
    spec: {
      name: 'rain', ease: 'inOutCubic',
      keyframes: [
        { hold: 0.3, duration: 0.6, shapes: [{ id: 'cloud', type: 'path', d: CLOUD, fill: 'heather' }] },
        { hold: 0, duration: 0.5, ease: 'inQuad', shapes: [{ id: 'cloud', type: 'path', d: CLOUD, fill: 'heather' }, ...drops(0)] },
        { hold: 0, duration: 0.6, shapes: [{ id: 'cloud', type: 'path', d: CLOUD, fill: 'heather' }, ...drops(170, { exit: 'draw' })] },
        { hold: 1.2, duration: 0.7, shapes: [
          { id: 'sun', type: 'circle', cx: 820, cy: 360, r: 150, stroke: false, fill: 'sun', misregister: false, enter: 'pop' },
          { id: 'cloud', type: 'path', d: CLOUD, fill: 'white' },
        ] },
      ],
    },
  },

  night: {
    title: 'Day → night',
    description: 'The sun is bitten into a crescent moon while stars pop in.',
    tags: ['sky', 'morph'],
    spec: {
      name: 'night', hold: 1, duration: 1, ease: 'inOutCubic',
      keyframes: [
        { shapes: [{ id: 'orb', type: 'circle', cx: 600, cy: 600, r: 240, fill: 'sun' }] },
        { shapes: [
          { id: 'orb', type: 'crescent', cx: 560, cy: 620, r: 240, thickness: 0.42, angle: -40, fill: 'heather' },
          { id: 's1', type: 'star', cx: 880, cy: 320, r: 52, fill: 'sun', enter: 'pop', delay: 0.3 },
          { id: 's2', type: 'star', cx: 300, cy: 290, r: 36, fill: 'sun', enter: 'pop', delay: 0.45 },
          { id: 's3', type: 'star', cx: 900, cy: 820, r: 40, fill: 'sun', enter: 'pop', delay: 0.6 },
        ] },
      ],
    },
  },

  sea: {
    title: 'Sea',
    description: 'Three rolling waves under a lazy sun.',
    tags: ['landscape', 'loop'],
    spec: { name: 'sea', hold: 0, duration: 0.16, ease: 'linear', keyframes: seaFrames() },
  },
};
