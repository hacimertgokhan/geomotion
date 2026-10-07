import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compile, render, toLottie, encodeSpec, decodeSpec, SHAPE_TYPES } from '../src/core/index.js';
import { PRESETS, CATEGORIES } from '../src/presets/index.js';
import { parsePath } from '../src/core/svgpath.js';

const tiny = {
  name: 't',
  keyframes: [
    { shapes: [{ id: 'a', type: 'circle', cx: 600, cy: 600, r: 200, fill: 'clay' }] },
    { shapes: [{ id: 'a', type: 'star', cx: 600, cy: 600, r: 260 }] },
  ],
};

test('every preset compiles to frames', () => {
  for (const [name, p] of Object.entries(PRESETS)) {
    const c = compile(p.spec);
    assert.ok(c.frames.length > 0, name);
    assert.ok(c.meta.duration > 0, name);
  }
});

test('presets are categorized', () => {
  const total = CATEGORIES.reduce((n, c) => n + Object.keys(c.presets).length, 0);
  assert.equal(total, Object.keys(PRESETS).length);
  assert.ok(total >= 30);
});

test('rendering is deterministic', () => {
  assert.equal(render(tiny).svg, render(tiny).svg);
  assert.notEqual(render(tiny).svg, render({ ...tiny, seed: 2 }).svg);
});

test('transparent drops the background', () => {
  assert.match(render(tiny).svg, /<rect width="1200" height="1200" fill=/);
  assert.doesNotMatch(render(tiny, { transparent: true }).svg, /<rect width="1200"/);
  const l = toLottie(compile(tiny, { transparent: true }));
  assert.ok(!l.layers.some((x) => x.nm === 'background'));
});

test('lottie has one layer per drawing', () => {
  const c = compile(tiny);
  const l = toLottie(c);
  assert.equal(l.layers.length, c.frames.length + 1);
  assert.equal(l.op, c.meta.frames);
});

test('every shape type renders', () => {
  const base = { cx: 600, cy: 600, r: 200, rx: 200, ry: 120, size: 300, w: 300, h: 200, x: 400, y: 400,
    from: [200, 600], to: [1000, 600], points: [[300, 300], [900, 300], [600, 900]], start: 0, end: 180, d: 'M300 300L900 300L600 900Z' };
  for (const type of SHAPE_TYPES) {
    const extra = type === 'star' ? { points: 5 } : {};
    const c = compile({ keyframes: [{ shapes: [{ type, ...base, ...extra }] }] });
    assert.ok(c.frames[0].ops.length > 0, type);
  }
});

test('helpful errors', () => {
  assert.throws(() => compile({ keyframes: [{ shapes: [{ type: 'circle', cx: 1 }] }] }), /Expected: cx, cy, r/);
  assert.throws(() => compile({ keyframes: [{ shapes: [{ type: 'hexagon' }] }] }), /Unknown shape type/);
  assert.throws(() => compile({}), /keyframes/);
});

test('share links round-trip', async () => {
  const code = await encodeSpec(PRESETS.sunrise.spec);
  assert.deepEqual(await decodeSpec(code), PRESETS.sunrise.spec);
  assert.ok(code.length < 1200);
});

test('svg path parser handles relative commands and arcs', () => {
  const [p] = parsePath('m10 10 h100 v100 a50 50 0 0 1 -50 50 z');
  assert.equal(p.closed, true);
  assert.ok(p.points.length > 5);
});
