// Characters & emotions.

const face = (eyesRy, mouth, fill = 'sun') => [
  { id: 'face', type: 'circle', cx: 600, cy: 600, r: 320, fill },
  { id: 'eyeL', type: 'ellipse', cx: 480, cy: 520, rx: 28, ry: eyesRy, stroke: false, fill: 'ink', misregister: false },
  { id: 'eyeR', type: 'ellipse', cx: 720, cy: 520, rx: 28, ry: eyesRy, stroke: false, fill: 'ink', misregister: false },
  { id: 'mouth', ...mouth },
];
const smile = { type: 'arc', cx: 600, cy: 610, r: 150, start: 25, end: 155 };
const bigSmile = { type: 'arc', cx: 600, cy: 590, r: 180, start: 15, end: 165, width: 30 };
const oh = { type: 'circle', cx: 600, cy: 740, r: 56, fill: 'clay' };

const GHOST = (dy, flip) => {
  const b = 900 + dy;
  const z = flip ? [850, 900, 850, 900, 850] : [900, 850, 900, 850, 900];
  return `M410 ${b}L410 ${520 + dy}C410 ${380 + dy} 500 ${300 + dy} 600 ${300 + dy}C700 ${300 + dy} 790 ${380 + dy} 790 ${520 + dy}L790 ${b}` +
    `L752 ${z[0] + dy}L714 ${z[1] + dy}L676 ${z[2] + dy}L638 ${z[3] + dy}L600 ${z[4] + dy}L562 ${z[3] + dy}L524 ${z[2] + dy}L486 ${z[1] + dy}L448 ${z[0] + dy}Z`;
};
const ghost = (dy, flip) => [
  { id: 'body', type: 'path', d: GHOST(dy, flip), fill: 'heather' },
  { id: 'eL', type: 'ellipse', cx: 540, cy: 520 + dy, rx: 26, ry: 38, stroke: false, fill: 'ink', misregister: false },
  { id: 'eR', type: 'ellipse', cx: 660, cy: 520 + dy, rx: 26, ry: 38, stroke: false, fill: 'ink', misregister: false },
  { id: 'shadow', type: 'ellipse', cx: 600, cy: 1030, rx: 150 + dy * 1.1, ry: 18, stroke: false, fill: 'oat', misregister: false },
];

const sparkle = (id, cx, cy, r, extra = {}) => ({ id, type: 'star', cx, cy, r, inner: 0.28, points: 4, fill: 'sun', ...extra });

export default {
  smile: {
    title: 'Smiley',
    description: 'A face blinks, gasps and breaks into a grin.',
    tags: ['emotion', 'face'],
    spec: {
      name: 'smile', ease: 'inOutCubic',
      keyframes: [
        { hold: 0.9, duration: 0.08, shapes: face(40, smile) },
        { hold: 0.04, duration: 0.1, shapes: face(4, smile) },
        { hold: 0.7, duration: 0.5, ease: 'outBack', shapes: face(40, smile) },
        { hold: 0.7, duration: 0.5, ease: 'inOutBack', shapes: face(46, oh, 'kraft') },
        { hold: 1.0, duration: 0.6, shapes: face(40, bigSmile) },
      ],
    },
  },

  ghost: {
    title: 'Ghost',
    description: 'A friendly ghost floats up and down, its hem fluttering.',
    tags: ['character', 'loop'],
    spec: {
      name: 'ghost', hold: 0.05, duration: 0.7, ease: 'inOutSine',
      keyframes: [{ shapes: ghost(0, false) }, { shapes: ghost(-70, true) }],
    },
  },

  sparkle: {
    title: 'Sparkle',
    description: 'A star spins into place with twinkling sparkles around it.',
    tags: ['celebration', 'magic'],
    spec: {
      name: 'sparkle', ease: 'outBack', hold: 0.5, duration: 0.8,
      keyframes: [
        { shapes: [{ id: 'star', type: 'star', cx: 600, cy: 620, r: 180, inner: 0.45, fill: 'oat', transform: { rotate: -40 } }] },
        { hold: 1.0, shapes: [
          { id: 'star', type: 'star', cx: 600, cy: 620, r: 320, inner: 0.46, fill: 'sun' },
          sparkle('s1', 250, 300, 80, { enter: 'pop', delay: 0.2 }),
          sparkle('s2', 960, 360, 60, { enter: 'pop', delay: 0.35 }),
          sparkle('s3', 930, 960, 90, { enter: 'pop', delay: 0.5 }),
        ] },
      ],
    },
  },
};
