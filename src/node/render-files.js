// Shared by the CLI and the MCP server: spec/preset → files on disk + share links.
import fs from 'node:fs';
import path from 'node:path';
import { compile, toAnimatedSVG, toLottie, toFrameSVG, frameIndexAt, makeLinks } from '../core/index.js';
import { PRESETS } from '../presets/index.js';

export const FORMATS = ['svg', 'lottie', 'html', 'poster'];

export function resolveSpec(input) {
  if (typeof input === 'string') {
    if (PRESETS[input]) return structuredClone(PRESETS[input].spec);
    if (fs.existsSync(input)) return JSON.parse(fs.readFileSync(input, 'utf8'));
    throw new Error(`"${input}" is neither a preset name nor a JSON file. Presets: ${Object.keys(PRESETS).join(', ')}`);
  }
  return input;
}

const slug = (s) => String(s ?? 'animation').toLowerCase().replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '') || 'animation';

function htmlPage(name, svg, transparent) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${name} · geomotion</title><style>html,body{margin:0;height:100%}body{display:grid;place-items:center;background:${transparent ? 'transparent' : '#f0eee6'}}svg{width:min(100vw,100vh);height:auto}</style>
</head><body>${svg}</body></html>`;
}

/**
 * @param {object|string} input spec object, preset name or path to a JSON spec
 * @param {{outDir?:string, formats?:string[], transparent?:boolean|'both', name?:string, site?:string}} o
 */
export async function renderToFiles(input, o = {}) {
  const spec = resolveSpec(input);
  const outDir = path.resolve(o.outDir ?? 'out');
  const formats = o.formats ?? ['svg', 'lottie'];
  for (const f of formats) if (!FORMATS.includes(f)) throw new Error(`Unknown format "${f}". Use: ${FORMATS.join(', ')}`);
  fs.mkdirSync(outDir, { recursive: true });
  const base = slug(o.name ?? spec.name);
  const variants = o.transparent === 'both' ? [false, true] : [!!o.transparent];
  const files = [];
  let meta = null;
  for (const transparent of variants) {
    const c = compile(spec, { transparent });
    meta = c.meta;
    const suffix = transparent ? '.transparent' : '';
    const write = (ext, data) => {
      const p = path.join(outDir, `${base}${suffix}${ext}`);
      fs.writeFileSync(p, data);
      files.push({ path: p, bytes: Buffer.byteLength(data), transparent });
    };
    const svg = formats.includes('svg') || formats.includes('html') ? toAnimatedSVG(c) : null;
    if (formats.includes('svg')) write('.svg', svg);
    if (formats.includes('lottie')) write('.lottie.json', JSON.stringify(toLottie(c)));
    if (formats.includes('html')) write('.html', htmlPage(meta.name, svg, transparent));
    if (formats.includes('poster')) write('.poster.svg', toFrameSVG(c, frameIndexAt(c, meta.duration * 0.6)));
  }
  const links = await makeLinks(spec, { site: o.site, transparent: o.transparent === true });
  return { meta, files, links, spec };
}
