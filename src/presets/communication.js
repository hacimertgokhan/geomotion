// Communication & social.

const BUBBLE = 'M300 330C300 290 330 260 370 260L830 260C870 260 900 290 900 330L900 640C900 680 870 710 830 710L540 710L410 830L430 710L370 710C330 710 300 680 300 640Z';
const dot = (id, cx, delay) => ({ id, type: 'circle', cx, cy: 485, r: 32, stroke: false, fill: 'ink', misregister: false, enter: 'pop', delay });

const node = (id, cx, cy, extra = {}) => ({ id, type: 'circle', cx, cy, r: 92, fill: 'sky', ...extra });

export default {
  chat: {
    title: 'Chat → love',
    description: 'Typing dots pop into a speech bubble, the middle one becomes a heart.',
    tags: ['message', 'social'],
    spec: {
      name: 'chat', hold: 0.5, duration: 0.8,
      keyframes: [
        { shapes: [{ id: 'bubble', type: 'path', d: BUBBLE, fill: 'oat' }] },
        { hold: 0.9, shapes: [
          { id: 'bubble', type: 'path', d: BUBBLE, fill: 'oat' },
          dot('d1', 470, 0), dot('d2', 600, 0.2), dot('d3', 730, 0.4),
        ] },
        { hold: 1.1, ease: 'inOutBack', shapes: [
          { id: 'bubble', type: 'path', d: BUBBLE, fill: 'coral' },
          { id: 'd2', type: 'heart', cx: 600, cy: 480, size: 270, fill: 'clay' },
        ] },
      ],
    },
  },

  send: {
    title: 'Send',
    description: 'An envelope folds itself into a paper plane and flies away.',
    tags: ['message', 'morph'],
    spec: {
      name: 'send', ease: 'inOutCubic',
      keyframes: [
        { hold: 0.7, duration: 0.9, shapes: [
          { id: 'body', type: 'rect', x: 300, y: 420, w: 600, h: 400, radius: 18, fill: 'oat' },
          { id: 'fold', type: 'polyline', points: [[300, 430], [600, 650], [900, 430]] },
        ] },
        { hold: 0.35, duration: 0.8, ease: 'inQuad', shapes: [
          { id: 'body', type: 'polygon', points: [[260, 650], [930, 340], [650, 880], [560, 720]], fill: 'white' },
          { id: 'fold', type: 'polyline', points: [[560, 720], [930, 340], [600, 880]] },
          { id: 'trail', type: 'wave', from: [120, 820], to: [330, 690], amplitude: 22, waves: 1.5, width: 14, enter: 'draw', delay: 0.4 },
        ] },
        { hold: 0.25, duration: 0.6, shapes: [
          { id: 'body', type: 'polygon', points: [[880, 270], [1100, 170], [1010, 340], [980, 290]], fill: 'white' },
          { id: 'fold', type: 'polyline', points: [[980, 290], [1100, 170], [995, 340]] },
          { id: 'trail', type: 'path', d: 'M120 820C400 760 600 600 860 300', width: 14, exit: 'draw' },
        ] },
      ],
    },
  },

  like: {
    title: 'Like',
    description: 'A heart beats and sends little hearts floating up.',
    tags: ['social', 'love'],
    spec: {
      name: 'like', ease: 'inOutCubic',
      keyframes: [
        { hold: 0.5, duration: 0.25, ease: 'outBack', shapes: [{ id: 'h', type: 'heart', cx: 600, cy: 640, size: 380, fill: 'clay' }] },
        { hold: 0.05, duration: 0.6, shapes: [
          { id: 'h', type: 'heart', cx: 600, cy: 640, size: 460, fill: 'clay' },
          { id: 'a', type: 'heart', cx: 330, cy: 420, size: 80, fill: 'coral', enter: 'pop' },
          { id: 'b', type: 'heart', cx: 870, cy: 380, size: 100, fill: 'coral', enter: 'pop', delay: 0.15 },
          { id: 'c', type: 'heart', cx: 600, cy: 250, size: 70, fill: 'coral', enter: 'pop', delay: 0.3 },
        ] },
        { hold: 0.6, duration: 0.5, shapes: [
          { id: 'h', type: 'heart', cx: 600, cy: 640, size: 380, fill: 'clay' },
          { id: 'a', type: 'heart', cx: 300, cy: 260, size: 60, fill: 'coral', opacity: 0 },
          { id: 'b', type: 'heart', cx: 900, cy: 210, size: 70, fill: 'coral', opacity: 0 },
          { id: 'c', type: 'heart', cx: 610, cy: 90, size: 50, fill: 'coral', opacity: 0 },
        ] },
      ],
    },
  },

  connect: {
    title: 'Connect',
    description: 'One node splits into a little network and links up.',
    tags: ['network', 'share'],
    spec: {
      name: 'connect', ease: 'inOutBack', hold: 0.6, duration: 0.9,
      keyframes: [
        { shapes: [node('n1', 600, 600, { r: 130 })] },
        { hold: 1.2, shapes: [
          { id: 'l1', type: 'line', from: [487, 547], to: [703, 413], enter: 'draw', delay: 0.4, ease: 'inOutCubic' },
          { id: 'l2', type: 'line', from: [487, 653], to: [703, 787], enter: 'draw', delay: 0.55, ease: 'inOutCubic' },
          node('n1', 400, 600, { fill: 'clay' }),
          node('n2', 790, 360, { enter: 'pop' }),
          node('n3', 790, 840, { enter: 'pop', delay: 0.15, fill: 'cactus' }),
        ] },
      ],
    },
  },
};
