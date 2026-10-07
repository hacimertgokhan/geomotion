// Showcase specs used by the website hero and the README banner.
export const HERO = {
  name: 'geomotion-hero',
  hold: 0.55, duration: 0.95, ease: 'inOutBack',
  keyframes: [
    { shapes: [
      { id: 'm', type: 'circle', cx: 600, cy: 600, r: 300, fill: 'oat' },
      { id: 'd', type: 'circle', cx: 930, cy: 300, r: 46, stroke: false, fill: 'ink', misregister: false },
      { id: 'l', type: 'line', from: [180, 1030], to: [1020, 1030] },
    ] },
    { shapes: [
      { id: 'm', type: 'star', cx: 600, cy: 590, r: 380, inner: 0.5, fill: 'sun' },
      { id: 'd', type: 'circle', cx: 260, cy: 280, r: 40, stroke: false, fill: 'ink', misregister: false },
      { id: 'l', type: 'wave', from: [180, 1030], to: [1020, 1030], amplitude: 30, waves: 2 },
    ] },
    { shapes: [
      { id: 'm', type: 'heart', cx: 600, cy: 590, size: 620, fill: 'clay' },
      { id: 'd', type: 'circle', cx: 960, cy: 880, r: 52, stroke: false, fill: 'ink', misregister: false },
      { id: 'l', type: 'arc', cx: 600, cy: 600, r: 470, start: 200, end: 340 },
    ] },
    { shapes: [
      { id: 'm', type: 'triangle', cx: 600, cy: 650, r: 400, fill: 'sky' },
      { id: 'd', type: 'circle', cx: 600, cy: 180, r: 56, fill: 'sun' },
      { id: 'l', type: 'line', from: [180, 1030], to: [1020, 1030] },
    ] },
    { shapes: [
      { id: 'm', type: 'rect', cx: 600, cy: 600, w: 560, h: 560, radius: 80, fill: 'cactus', transform: { rotate: 10 } },
      { id: 'd', type: 'circle', cx: 250, cy: 900, r: 44, stroke: false, fill: 'ink', misregister: false },
      { id: 'l', type: 'spiral', cx: 600, cy: 600, r: 140, turns: 2.2 },
    ] },
  ],
};
