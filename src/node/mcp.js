#!/usr/bin/env node
// geomotion MCP server — zero dependencies, stdio transport (newline-delimited JSON-RPC 2.0).
//
// Claude Code:    claude mcp add geomotion -- npx -y github:hacimertgokhan/geomotion mcp
// Claude Desktop: { "mcpServers": { "geomotion": { "command": "npx", "args": ["-y", "github:hacimertgokhan/geomotion", "mcp"] } } }
//
// Env: GEOMOTION_OUT (default output folder), GEOMOTION_SITE (base URL for share links)
import path from 'node:path';
import { createInterface } from 'node:readline';
import { SPEC_GUIDE, compile, makeLinks } from '../core/index.js';
import { CATEGORIES, PRESETS } from '../presets/index.js';
import { renderToFiles, resolveSpec, FORMATS } from './render-files.js';

const VERSION = '0.1.0';
const SITE = process.env.GEOMOTION_SITE;
const OUT = process.env.GEOMOTION_OUT ?? path.join(process.cwd(), 'geomotion-out');

const specSource = {
  spec: { type: 'object', description: 'A geomotion spec ({ keyframes: [{ shapes: [...] }] }). Call geomotion_guide first for the format.' },
  preset: { type: 'string', description: `Name of a built-in preset instead of a spec: ${Object.keys(PRESETS).join(', ')}` },
};

const TOOLS = [
  {
    name: 'geomotion_guide',
    description:
      'Returns the geomotion spec reference (shapes, keyframes, morphing, palette, easings, design tips) plus the preset catalog. ' +
      'Read this before writing a spec. geomotion turns simple shapes into hand-drawn, boiling-ink morph animations exported as animated SVG / Lottie.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'geomotion_list_presets',
    description: 'Lists built-in animations grouped by category (interface, nature, communication, ideas, characters, abstract, motion).',
    inputSchema: { type: 'object', properties: { category: { type: 'string', description: 'Optional category id filter.' } } },
  },
  {
    name: 'geomotion_get_preset',
    description: 'Returns the full JSON spec of a preset — a good starting point to modify.',
    inputSchema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
  },
  {
    name: 'geomotion_render',
    description:
      'Renders a spec (or preset) to files: animated SVG, Lottie JSON, standalone HTML and/or a poster frame. ' +
      'Also returns shareable links (player + studio) and an embed snippet. Use transparent:true for no background, or "both".',
    inputSchema: {
      type: 'object',
      properties: {
        ...specSource,
        formats: { type: 'array', items: { type: 'string', enum: FORMATS }, description: 'Default ["svg","lottie"].' },
        transparent: { description: 'true = no background, false = with background, "both" = write both versions.', anyOf: [{ type: 'boolean' }, { type: 'string', enum: ['both'] }] },
        out_dir: { type: 'string', description: `Output folder. Default: ${OUT}` },
        name: { type: 'string', description: 'Base file name (defaults to spec.name).' },
      },
    },
  },
  {
    name: 'geomotion_share_link',
    description:
      'Encodes a spec (or preset) into shareable URLs — no files written. The player link plays the animation full-screen and can be embedded in an <iframe>; the studio link opens it for editing.',
    inputSchema: { type: 'object', properties: { ...specSource, transparent: { type: 'boolean' } } },
  },
  {
    name: 'geomotion_validate',
    description: 'Checks a spec and reports duration and frame count, or a precise error message.',
    inputSchema: { type: 'object', properties: { spec: specSource.spec }, required: ['spec'] },
  },
];

function catalog(categoryId) {
  return CATEGORIES.filter((c) => !categoryId || c.id === categoryId)
    .map((c) => `## ${c.title} (${c.id})\n${c.description}\n` +
      Object.entries(c.presets).map(([n, p]) => `- **${n}** — ${p.description}`).join('\n'))
    .join('\n\n');
}

function pickSpec(args) {
  if (args.spec) return args.spec;
  if (args.preset) return resolveSpec(args.preset);
  throw new Error('Provide either "spec" or "preset".');
}

const text = (t) => ({ content: [{ type: 'text', text: t }] });

async function callTool(name, args = {}) {
  switch (name) {
    case 'geomotion_guide':
      return text(`${SPEC_GUIDE}\n\n# Presets\n\n${catalog()}`);
    case 'geomotion_list_presets': {
      const out = catalog(args.category);
      if (!out) throw new Error(`Unknown category. Use: ${CATEGORIES.map((c) => c.id).join(', ')}`);
      return text(out);
    }
    case 'geomotion_get_preset': {
      const p = PRESETS[args.name];
      if (!p) throw new Error(`Unknown preset "${args.name}". Presets: ${Object.keys(PRESETS).join(', ')}`);
      return text(JSON.stringify(p.spec, null, 2));
    }
    case 'geomotion_render': {
      const r = await renderToFiles(pickSpec(args), {
        outDir: args.out_dir ?? OUT, formats: args.formats, transparent: args.transparent, name: args.name, site: SITE,
      });
      const lines = [
        `Rendered "${r.meta.name}" — ${r.meta.duration.toFixed(2)}s, ${r.meta.width}×${r.meta.height}, ${r.meta.fps}fps${r.meta.loop ? ', looping' : ''}.`,
        '', 'Files:', ...r.files.map((f) => `- ${f.path} (${(f.bytes / 1024).toFixed(0)} KB${f.transparent ? ', transparent' : ''})`),
        '', `Player link: ${r.links.player}`, `Studio link: ${r.links.studio}`, `Embed: ${r.links.embed}`,
      ];
      return text(lines.join('\n'));
    }
    case 'geomotion_share_link': {
      const spec = pickSpec(args);
      compile(spec); // validate first
      const l = await makeLinks(spec, { site: SITE, transparent: !!args.transparent });
      return text(`Player: ${l.player}\nStudio: ${l.studio}\nEmbed: ${l.embed}`);
    }
    case 'geomotion_validate': {
      const c = compile(args.spec);
      return text(`Valid. ${c.meta.duration.toFixed(2)}s, ${c.frames.length} unique drawings, ${c.meta.width}×${c.meta.height}.`);
    }
    default:
      throw Object.assign(new Error(`Unknown tool: ${name}`), { code: -32602 });
  }
}

// ───────── JSON-RPC over stdio ─────────

const send = (msg) => process.stdout.write(JSON.stringify({ jsonrpc: '2.0', ...msg }) + '\n');

async function handle(msg) {
  const { id, method, params } = msg;
  const isRequest = id !== undefined && id !== null;
  try {
    let result;
    switch (method) {
      case 'initialize':
        result = {
          protocolVersion: params?.protocolVersion ?? '2025-06-18',
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: 'geomotion', version: VERSION },
          instructions:
            'geomotion makes hand-drawn morphing animations from simple shapes. Call geomotion_guide once, write a spec ' +
            '(or start from geomotion_get_preset), then geomotion_render to export files, or geomotion_share_link for a link.',
        };
        break;
      case 'ping': result = {}; break;
      case 'tools/list': result = { tools: TOOLS }; break;
      case 'tools/call':
        try { result = await callTool(params?.name, params?.arguments ?? {}); }
        catch (e) {
          if (e.code === -32602) throw e;
          result = { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
        }
        break;
      case 'resources/list': result = { resources: [] }; break;
      case 'prompts/list': result = { prompts: [] }; break;
      default:
        if (!isRequest) return; // notifications (initialized, cancelled, …)
        throw Object.assign(new Error(`Method not found: ${method}`), { code: -32601 });
    }
    if (isRequest) send({ id, result });
  } catch (e) {
    if (isRequest) send({ id, error: { code: e.code ?? -32603, message: e.message } });
  }
}

const pending = new Set();
const track = (p) => { pending.add(p); p.finally(() => pending.delete(p)); };

const rl = createInterface({ input: process.stdin });
rl.on('line', (line) => {
  if (!line.trim()) return;
  let msg;
  try { msg = JSON.parse(line); } catch { send({ id: null, error: { code: -32700, message: 'Parse error' } }); return; }
  for (const m of Array.isArray(msg) ? msg : [msg]) track(handle(m));
});
rl.on('close', async () => { await Promise.allSettled([...pending]); process.exit(0); });
