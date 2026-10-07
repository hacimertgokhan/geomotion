#!/usr/bin/env node
// geomotion CLI
import path from 'node:path';

import { renderToFiles, resolveSpec } from './render-files.js';
import { CATEGORIES } from '../presets/index.js';
import { SPEC_GUIDE, makeLinks, compile } from '../core/index.js';

const HELP = `geomotion — hand-drawn morphing line animations

Usage
  geomotion render <preset|spec.json> [options]   Render one animation
  geomotion presets [options]                     Render every preset (or --category <id>)
  geomotion list                                  List presets by category
  geomotion link <preset|spec.json> [--transparent]  Print share / embed links
  geomotion check <spec.json>                     Validate a spec
  geomotion guide                                 Print the spec reference
  geomotion studio                                Start the local studio (http://localhost:5199)
  geomotion mcp                                   Start the MCP server (stdio)

Options
  --out <dir>          Output folder (default: ./out)
  --formats <list>     svg,lottie,html,poster (default: svg,lottie)
  --transparent        No background
  --both               Write normal + transparent versions
  --name <name>        Output file name

Examples
  geomotion render sunrise --both
  geomotion render my-spec.json --formats svg,html --out public/anim
  geomotion presets --category interface --transparent
`;

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const next = argv[i + 1];
      if (['transparent', 'both', 'help'].includes(k)) args[k] = true;
      else { args[k] = next; i++; }
    } else args._.push(a);
  }
  return args;
}

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const [cmd, target] = args._;
  const transparent = args.both ? 'both' : !!args.transparent;
  const formats = args.formats?.split(',').map((s) => s.trim());

  switch (cmd) {
    case 'render': {
      if (!target) throw new Error('render needs a preset name or a spec file.');
      const r = await renderToFiles(target, { outDir: args.out, formats, transparent, name: args.name });
      console.log(`✓ ${r.meta.name} — ${r.meta.duration.toFixed(2)}s, ${r.meta.width}×${r.meta.height}`);
      for (const f of r.files) console.log(`  ${path.relative(process.cwd(), f.path)}  (${kb(f.bytes)})`);
      console.log(`  player: ${r.links.player}`);
      break;
    }
    case 'presets': {
      const cats = args.category ? CATEGORIES.filter((c) => c.id === args.category) : CATEGORIES;
      if (!cats.length) throw new Error(`Unknown category. Use: ${CATEGORIES.map((c) => c.id).join(', ')}`);
      for (const c of cats) {
        const outDir = path.join(args.out ?? 'out', c.id);
        for (const name of Object.keys(c.presets)) {
          const r = await renderToFiles(name, { outDir, formats, transparent });
          console.log(`✓ ${c.id}/${name}  ${r.files.map((f) => path.basename(f.path)).join(', ')}`);
        }
      }
      break;
    }
    case 'list': {
      for (const c of CATEGORIES) {
        console.log(`\n${c.title} — ${c.description}`);
        for (const [name, p] of Object.entries(c.presets)) console.log(`  ${name.padEnd(10)} ${p.description}`);
      }
      break;
    }
    case 'link': {
      const spec = resolveSpec(target);
      const l = await makeLinks(spec, { transparent: !!args.transparent });
      console.log(`player: ${l.player}\nstudio: ${l.studio}\nembed:  ${l.embed}`);
      break;
    }
    case 'check': {
      const c = compile(resolveSpec(target));
      console.log(`✓ valid — ${c.meta.duration.toFixed(2)}s, ${c.frames.length} drawings`);
      break;
    }
    case 'guide': console.log(SPEC_GUIDE); break;
    case 'studio': await import('./studio-server.js'); break;
    case 'mcp': await import('./mcp.js'); break;
    default: console.log(HELP);
  }
}

main().catch((e) => { console.error(`✗ ${e.message}`); process.exit(1); });

