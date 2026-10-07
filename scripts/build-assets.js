#!/usr/bin/env node
// Renders the animated SVG previews used in README.md → assets/readme/*.svg
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile, toAnimatedSVG } from '../src/core/index.js';
import { PRESETS } from '../src/presets/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'assets', 'readme');
fs.mkdirSync(out, { recursive: true });

const PICKS = ['sunrise', 'send', 'success', 'idea', 'chat', 'night', 'sprout', 'gears', 'smile', 'kaleido', 'bounce', 'bell'];
for (const name of PICKS) {
  // 12 fps keeps the files small while staying in the hand-drawn "on twos" rhythm
  const svg = toAnimatedSVG(compile({ ...PRESETS[name].spec, fps: 12, boil: 6 }))
    .replace(/width="1200" height="1200"/, 'width="300" height="300"');
  fs.writeFileSync(path.join(out, `${name}.svg`), svg);
  console.log(`${name.padEnd(9)} ${(svg.length / 1024).toFixed(0)} KB`);
}
