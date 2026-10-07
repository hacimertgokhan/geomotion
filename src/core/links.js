// Shareable links: a spec is deflated + base64url-encoded into the URL hash,
// so the whole animation lives in the link (no server, no account).
//   studio:  https://hacimertgokhan.github.io/geomotion/studio/#s=…   (open & edit)
//   player:  https://hacimertgokhan.github.io/geomotion/play/#s=…     (clean, embeddable)
// Works in browsers and Node 18+ (CompressionStream).

export const SITE_URL = 'https://hacimertgokhan.github.io/geomotion';

function toB64url(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(s) {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));
  const out = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
  return out;
}

async function pipe(bytes, stream) {
  const res = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await res.arrayBuffer());
}

/** spec → compact URL-safe string ("z" prefix = deflated, "j" = plain). */
export async function encodeSpec(spec) {
  const json = new TextEncoder().encode(JSON.stringify(spec));
  if (typeof CompressionStream !== 'undefined') {
    try { return 'z' + toB64url(await pipe(json, new CompressionStream('deflate-raw'))); } catch { /* fall back */ }
  }
  return 'j' + toB64url(json);
}

export async function decodeSpec(code) {
  const kind = code[0], body = fromB64url(code.slice(1));
  const bytes = kind === 'z' ? await pipe(body, new DecompressionStream('deflate-raw')) : body;
  return JSON.parse(new TextDecoder().decode(bytes));
}

/**
 * @param {object} spec
 * @param {{site?:string, transparent?:boolean}} [o]
 * @returns {Promise<{studio:string, player:string, embed:string}>}
 */
export async function makeLinks(spec, o = {}) {
  const site = (o.site ?? SITE_URL).replace(/\/+$/, '');
  const code = await encodeSpec(spec);
  const t = o.transparent ? '&bg=0' : '';
  const player = `${site}/play/#s=${code}${t}`;
  return {
    studio: `${site}/studio/#s=${code}`,
    player,
    embed: `<iframe src="${player}" width="400" height="400" style="border:0" title="${spec.name ?? 'geomotion'}" loading="lazy"></iframe>`,
  };
}

/** Reads #s=…, #preset=…, &bg=0 from a location hash. */
export async function specFromHash(hash, presets = {}) {
  const params = new URLSearchParams(String(hash).replace(/^#/, ''));
  const transparent = params.get('bg') === '0';
  if (params.get('s')) return { spec: await decodeSpec(params.get('s')), transparent, preset: null };
  const p = params.get('preset');
  if (p && presets[p]) return { spec: structuredClone(presets[p].spec), transparent, preset: p };
  return { spec: null, transparent, preset: null };
}
