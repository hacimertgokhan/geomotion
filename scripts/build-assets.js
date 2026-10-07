#!/usr/bin/env node
// Builds the README visuals (animated SVG, SMIL — plays inside <img> on GitHub):
//   assets/readme/banner.svg   wordmark + live morph, on a rounded paper card
//   assets/readme/gallery.svg  4×2 grid of labelled preset cards
// Each image carries its own background, so it reads well in GitHub light and dark mode.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile, toAnimatedSVG } from '../src/core/index.js';
import { PRESETS, CATEGORIES } from '../src/presets/index.js';
import { HERO } from '../src/presets/showcase.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'assets', 'readme');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const C = { ink: '#141413', slate: '#3d3d3a', muted: '#73726c', paper: '#f0eee6', ivory: '#faf9f5', clay: '#d97757', line: '#e2ded2' };
const SERIF = `'Iowan Old Style','Palatino Linotype',Palatino,'Book Antiqua',Georgia,serif`;
const SANS = `-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif`;
const MONO = `ui-monospace,'SF Mono','Cascadia Code',Consolas,monospace`;

/** Animation as a nested <svg> placed at (x, y) with the given size. Small fps keeps files light. */
function nested(spec, x, y, size, fps = 12) {
  const svg = toAnimatedSVG(compile({ ...spec, fps, boil: Math.round(fps / 2) }, { transparent: true }));
  const inner = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '').replace(/<title>[\s\S]*?<\/title>/, '');
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 1200 1200">${inner}</svg>`;
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function write(name, svg) {
  fs.writeFileSync(path.join(out, name), svg);
  console.log(`${name.padEnd(12)} ${(svg.length / 1024).toFixed(0)} KB`);
}

// ───────── banner ─────────
{
  const W = 1600, H = 560;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<title>geomotion — hand-drawn motion from simple shapes</title>
<defs><clipPath id="card"><rect width="${W}" height="${H}" rx="36"/></clipPath></defs>
<g clip-path="url(#card)">
<rect width="${W}" height="${H}" fill="${C.paper}"/>
<path d="M1010 120C1090 20 1330 10 1440 90C1560 175 1580 360 1490 450C1390 550 1150 560 1060 470C980 390 940 200 1010 120Z" fill="${C.ivory}"/>
<g font-family="${SANS}">
<text x="110" y="168" font-size="17" font-weight="700" letter-spacing="3.2" fill="${C.clay}">OPEN SOURCE · ZERO DEPENDENCIES · MIT</text>
<text x="104" y="292" font-family="${SERIF}" font-size="124" font-weight="600" letter-spacing="-3" fill="${C.ink}">geomotion</text>
<text x="110" y="362" font-family="${SERIF}" font-size="38" font-style="italic" fill="${C.slate}">Hand-drawn motion, from simple shapes.</text>
<text x="110" y="440" font-family="${MONO}" font-size="20" fill="${C.muted}">animated SVG  ·  Lottie  ·  HTML  ·  share links  ·  MCP</text>
</g>
${nested(HERO, 1000, 25, 510, 15)}
</g></svg>`;
  write('banner.svg', svg);
}

// ───────── gallery grid ─────────
{
  const PICKS = ['send', 'night', 'idea', 'chat', 'sprout', 'success', 'gears', 'smile'];
  const catTitle = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.title]));
  const cols = 4, pad = 40, gap = 24, W = 1600;
  const cw = (W - pad * 2 - gap * (cols - 1)) / cols;
  const art = cw - 36;
  const ch = art + 18 + 92;
  const rows = Math.ceil(PICKS.length / cols);
  const H = pad * 2 + rows * ch + (rows - 1) * gap;
  let cards = '';
  PICKS.forEach((name, i) => {
    const p = PRESETS[name];
    const x = pad + (i % cols) * (cw + gap);
    const y = pad + Math.floor(i / cols) * (ch + gap);
    cards += `<g>
<rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="26" fill="${C.ivory}"/>
${nested(p.spec, x + 18, y + 18, art, 10)}
<text x="${x + 26}" y="${y + art + 62}" font-family="${SERIF}" font-size="29" font-weight="600" fill="${C.ink}">${esc(p.title)}</text>
<text x="${x + 27}" y="${y + art + 92}" font-family="${SANS}" font-size="14" font-weight="700" letter-spacing="2" fill="${C.muted}">${esc(catTitle[p.category].toUpperCase())}</text>
</g>`;
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<title>geomotion presets</title>
<rect width="${W}" height="${H}" rx="36" fill="${C.paper}"/>
${cards}</svg>`;
  write('gallery.svg', svg);
}
