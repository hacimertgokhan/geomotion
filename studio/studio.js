import {
  compile, toAnimatedSVG, toLottie, frameIndexAt, contourToD, SPEC_GUIDE,
  encodeSpec, specFromHash, formatSpec,
} from '../src/core/index.js';
import { PRESETS, CATEGORIES } from '../src/presets/index.js';
import { hydrateGitHub } from '../site/github.js';

hydrateGitHub();

const $ = (id) => document.getElementById(id);
const canvas = $('stage');
const ctx = canvas.getContext('2d');
const textarea = $('spec');
const SITE = new URL('../', location.href).href.replace(/\/$/, '');

const STORE_KEY = 'geomotion.studio.v1';
const store = {
  get() { try { return JSON.parse(localStorage.getItem(STORE_KEY) ?? 'null'); } catch { return null; } },
  set(v) { try { localStorage.setItem(STORE_KEY, JSON.stringify(v)); } catch { /* private mode */ } },
};

let compiled = null;
let paths = [];
let playing = true;
let clock = 0;
let lastTs = null;
let drawnIndex = -1;
let currentPreset = null;
let transparent = false;

// ───────── compile & draw ─────────

function buildPaths(c) {
  return c.frames.map((f) =>
    f.ops.map((op) => ({ p: new Path2D(op.contours.map((k) => contourToD(k, 1)).join('')), color: op.color, a: op.opacity }))
  );
}

function setSpec(spec, { writeText = true } = {}) {
  const t0 = performance.now();
  const c = compile(spec, { transparent });
  const ms = performance.now() - t0;
  compiled = c;
  paths = buildPaths(c);
  canvas.width = c.meta.width;
  canvas.height = c.meta.height;
  canvas.parentElement.style.aspectRatio = `${c.meta.width} / ${c.meta.height}`;
  drawnIndex = -1;
  if (clock > c.meta.duration) clock = 0;
  if (writeText) textarea.value = formatSpec(spec);
  syncKnobs(spec);
  $('stats').textContent =
    `${c.meta.width}×${c.meta.height} · ${c.meta.duration.toFixed(2)}s · ${c.meta.fps}fps · ${c.frames.length} drawings · ${ms.toFixed(0)}ms`;
  showError(null);
  store.set({ text: textarea.value, preset: currentPreset, transparent });
  draw(true);
}

function draw(force = false) {
  if (!compiled) return;
  const i = frameIndexAt(compiled, clock);
  if (i !== drawnIndex || force) {
    drawnIndex = i;
    const { width: W, height: H, background } = compiled.meta;
    ctx.clearRect(0, 0, W, H);
    if (background) { ctx.fillStyle = background; ctx.fillRect(0, 0, W, H); }
    for (const op of paths[i]) { ctx.globalAlpha = op.a; ctx.fillStyle = op.color; ctx.fill(op.p); }
    ctx.globalAlpha = 1;
  }
  $('time').textContent = `${clock.toFixed(2)}s`;
  if (document.activeElement !== $('scrub')) $('scrub').value = String(Math.round((clock / compiled.meta.duration) * 1000));
}

function tick(ts) {
  if (lastTs != null && playing && compiled) {
    clock += (ts - lastTs) / 1000;
    const d = compiled.meta.duration;
    if (compiled.meta.loop) clock %= d;
    else if (clock >= d) { clock = d - 1e-6; setPlaying(false); }
  }
  lastTs = ts;
  draw();
  requestAnimationFrame(tick);
}

// ───────── editor ─────────

function showError(msg) {
  $('error').hidden = !msg;
  $('error').textContent = msg ?? '';
}

let editTimer = null;
textarea.addEventListener('input', () => {
  clearTimeout(editTimer);
  editTimer = setTimeout(() => {
    let spec;
    try { spec = JSON.parse(textarea.value); } catch (e) { showError(`JSON: ${e.message}`); return; }
    try { markPreset(null); setSpec(spec, { writeText: false }); } catch (e) { showError(e.message); }
  }, 300);
});
textarea.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    textarea.setRangeText('  ', textarea.selectionStart, textarea.selectionEnd, 'end');
  }
});

const currentSpec = () => { try { return JSON.parse(textarea.value); } catch { return null; } };

// ───────── knobs ─────────

function syncKnobs(spec) {
  const st = spec.style ?? {};
  const sc = Math.min(...(spec.size ?? [1200, 1200])) / 1200;
  $('k-wobble').value = st.wobble ?? 1;
  $('k-width').value = st.width ?? Math.round(24 * sc);
  $('k-boil').value = spec.boil ?? 12;
  $('k-transparent').checked = transparent;
  canvas.parentElement.classList.toggle('checker', transparent);
}

function patchSpec(fn) {
  const spec = currentSpec();
  if (!spec) return;
  fn(spec);
  try { setSpec(spec); } catch (e) { showError(e.message); }
}

$('k-wobble').addEventListener('input', (e) => patchSpec((s) => { s.style = { ...s.style, wobble: +e.target.value }; }));
$('k-width').addEventListener('input', (e) => patchSpec((s) => { s.style = { ...s.style, width: +e.target.value }; }));
$('k-boil').addEventListener('input', (e) => patchSpec((s) => { s.boil = +e.target.value; }));
$('k-seed').addEventListener('click', () => patchSpec((s) => { s.seed = Math.floor(Math.random() * 1e6); }));
$('k-transparent').addEventListener('change', (e) => { transparent = e.target.checked; patchSpec(() => {}); });

// ───────── transport ─────────

function setPlaying(v) {
  playing = v;
  $('play').classList.toggle('paused', !v);
  $('play').setAttribute('aria-label', v ? 'Pause' : 'Play');
}
$('play').addEventListener('click', () => {
  if (!playing && compiled && !compiled.meta.loop && clock >= compiled.meta.duration - 0.01) clock = 0;
  setPlaying(!playing);
});
$('scrub').addEventListener('input', (e) => {
  setPlaying(false);
  clock = (+e.target.value / 1000) * compiled.meta.duration;
  draw();
});
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && e.target === document.body) { e.preventDefault(); $('play').click(); }
});

// ───────── presets ─────────

function markPreset(name) {
  currentPreset = name;
  document.querySelectorAll('.preset').forEach((b) => b.setAttribute('aria-current', String(b.dataset.name === name)));
}

function loadPreset(name) {
  clock = 0;
  markPreset(name);
  setSpec(structuredClone(PRESETS[name].spec));
  setPlaying(true);
  history.replaceState(null, '', `#preset=${name}`);
}

function buildPresetList() {
  const root = $('preset-list');
  for (const cat of CATEGORIES) {
    const sec = document.createElement('section');
    sec.className = 'cat';
    sec.innerHTML = `<h2>${cat.title}</h2><ul></ul>`;
    const ul = sec.querySelector('ul');
    for (const [name, p] of Object.entries(cat.presets)) {
      const li = document.createElement('li');
      li.dataset.search = `${name} ${p.title} ${p.description} ${(p.tags ?? []).join(' ')} ${cat.title}`.toLowerCase();
      li.innerHTML = `<button class="preset" data-name="${name}"><img alt="" /><span><b>${p.title}</b><small>${p.description}</small></span></button>`;
      li.querySelector('button').addEventListener('click', () => loadPreset(name));
      ul.appendChild(li);
    }
    root.appendChild(sec);
  }
  $('filter').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    root.querySelectorAll('.cat').forEach((sec) => {
      let any = false;
      sec.querySelectorAll('li').forEach((li) => { const hit = !q || li.dataset.search.includes(q); li.hidden = !hit; any ||= hit; });
      sec.hidden = !any;
    });
  });
  // Animated thumbnails, rendered lazily so the first paint stays fast.
  const names = Object.keys(PRESETS);
  const next = () => {
    const name = names.shift();
    if (!name) return;
    const svg = toAnimatedSVG(compile({ ...PRESETS[name].spec, fps: 12, boil: 6 }));
    root.querySelector(`[data-name="${name}"] img`).src = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    setTimeout(next, 16);
  };
  setTimeout(next, 100);
}

// ───────── exports & sharing ─────────

function download(name, data, type) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
const fileBase = () => (compiled?.meta.name ?? 'geomotion').replace(/[^\w-]+/g, '-') + (transparent ? '-transparent' : '');
$('btn-svg').addEventListener('click', () => compiled && download(`${fileBase()}.svg`, toAnimatedSVG(compiled), 'image/svg+xml'));
$('btn-lottie').addEventListener('click', () => compiled && download(`${fileBase()}.lottie.json`, JSON.stringify(toLottie(compiled)), 'application/json'));
$('btn-png').addEventListener('click', () => canvas.toBlob((b) => b && download(`${fileBase()}-${clock.toFixed(2)}s.png`, b, 'image/png')));

$('btn-share').addEventListener('click', async () => {
  const spec = currentSpec();
  if (!spec) return showError('Fix the JSON before sharing.');
  const code = await encodeSpec(spec);
  const bg = transparent ? '&bg=0' : '';
  const player = `${SITE}/play/#s=${code}${bg}`;
  $('ln-player').value = player;
  $('ln-studio').value = `${SITE}/studio/#s=${code}${bg}`;
  $('ln-iframe').value = `<iframe src="${player}" width="400" height="400" style="border:0" title="${spec.name ?? 'animation'}" loading="lazy"></iframe>`;
  $('ln-tag').value = `<script type="module" src="${SITE}/src/embed.js"></script>\n<geo-motion code="${code}"${transparent ? ' transparent' : ''}></geo-motion>`;
  history.replaceState(null, '', `#s=${code}${bg}`);
  $('share').showModal();
});
document.querySelectorAll('[data-copy]').forEach((b) =>
  b.addEventListener('click', async (e) => {
    e.preventDefault();
    const input = $(b.dataset.copy);
    try { await navigator.clipboard.writeText(input.value); b.textContent = 'Copied'; }
    catch { input.select(); b.textContent = 'Ctrl+C'; }
    setTimeout(() => { b.textContent = 'Copy'; }, 1400);
  })
);
$('btn-copy').addEventListener('click', async (e) => {
  try { await navigator.clipboard.writeText(textarea.value); e.target.textContent = 'Copied'; }
  catch { textarea.select(); e.target.textContent = 'Ctrl+C'; }
  setTimeout(() => { e.target.textContent = 'Copy'; }, 1400);
});
$('guide-text').textContent = SPEC_GUIDE;
$('btn-guide').addEventListener('click', () => $('guide').showModal());

// ───────── boot ─────────

async function boot() {
  buildPresetList();
  try {
    const fromLink = await specFromHash(location.hash, PRESETS);
    if (fromLink.spec) {
      transparent = fromLink.transparent;
      setSpec(fromLink.spec);
      markPreset(fromLink.preset);
      return;
    }
  } catch (e) { showError(`Could not read the link: ${e.message}`); }
  const saved = store.get();
  if (saved?.text) {
    try { transparent = !!saved.transparent; setSpec(JSON.parse(saved.text)); markPreset(saved.preset ?? null); return; } catch { /* ignore */ }
  }
  loadPreset('sunrise');
}

boot().finally(() => requestAnimationFrame(tick));
