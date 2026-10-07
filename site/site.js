import '../src/embed.js';
import { hydrateGitHub } from './github.js';
import { HERO } from '../src/presets/showcase.js';
import { compile, toAnimatedSVG, toLottie } from '../src/core/index.js';
import { PRESETS, CATEGORIES } from '../src/presets/index.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// ───────── hero: one spec, five poses ─────────
$("#hero-anim").spec = HERO;
hydrateGitHub();

// ───────── lazy presets: compile only when close to the viewport ─────────
const lazyIO = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    const el = e.target;
    el.setAttribute('preset', el.dataset.lazyPreset);
    lazyIO.unobserve(el);
  }
}, { rootMargin: '300px' });
const lazy = (el) => { if (el.dataset.lazyPreset) lazyIO.observe(el); };
$$('[data-lazy-preset]').forEach(lazy);

// ───────── marquee strip ─────────
const STRIP = ['spinner', 'bell', 'like', 'sprout', 'ghost', 'toggle', 'orbit', 'rain', 'target', 'jelly', 'connect', 'sea', 'smile', 'house'];
const strip = $('#strip');
for (const name of [...STRIP, ...STRIP]) {
  const el = document.createElement('geo-motion');
  el.dataset.lazyPreset = name;
  el.setAttribute('transparent', '');
  el.setAttribute('aria-label', PRESETS[name].title);
  strip.appendChild(el);
  lazy(el);
}

// ───────── gallery ─────────
const grid = $('#grid');
const tabs = $('#tabs');

function download(name, data, type) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function card(name) {
  const p = PRESETS[name];
  const el = document.createElement('article');
  el.className = 'card';
  el.innerHTML = `
    <geo-motion data-lazy-preset="${name}" start="0.45" aria-label="${p.title}"></geo-motion>
    <h3>${p.title}</h3>
    <p>${p.description}</p>
    <div class="card-actions">
      <a class="primary" href="studio/#preset=${name}">Edit</a>
      <a href="play/#preset=${name}" target="_blank" rel="noopener">Play</a>
      <button data-dl="svg">SVG</button>
      <button data-dl="svg-t" title="Animated SVG without background">SVG · no bg</button>
      <button data-dl="lottie">Lottie</button>
    </div>`;
  el.querySelectorAll('[data-dl]').forEach((b) =>
    b.addEventListener('click', () => {
      const kind = b.dataset.dl;
      const c = compile(p.spec, { transparent: kind !== 'svg' });
      if (kind === 'lottie') download(`${name}.lottie.json`, JSON.stringify(toLottie(c)), 'application/json');
      else download(`${name}${kind === 'svg-t' ? '.transparent' : ''}.svg`, toAnimatedSVG(c), 'image/svg+xml');
      toast('Downloaded');
    })
  );
  lazy(el.querySelector('geo-motion'));
  return el;
}

function showCategory(id) {
  $$('button', tabs).forEach((b) => b.setAttribute('aria-selected', String(b.dataset.cat === id)));
  grid.replaceChildren();
  const names = id === 'all' ? Object.keys(PRESETS) : Object.keys(CATEGORIES.find((c) => c.id === id).presets);
  names.forEach((n, i) => { const c = card(n); c.style.animationDelay = `${Math.min(i, 12) * 35}ms`; grid.appendChild(c); });
}

const total = Object.keys(PRESETS).length;
for (const c of [{ id: 'all', title: 'All', n: total }, ...CATEGORIES.map((c) => ({ ...c, n: Object.keys(c.presets).length }))]) {
  const b = document.createElement('button');
  b.role = 'tab';
  b.dataset.cat = c.id;
  b.innerHTML = `${c.title}<span class="count">${c.n}</span>`;
  b.addEventListener('click', () => showCategory(c.id));
  tabs.appendChild(b);
}
showCategory('all');

// ───────── "use it" tabs ─────────
$$('#use-tabs button').forEach((b) =>
  b.addEventListener('click', () => {
    $$('#use-tabs button').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    $$('.panel').forEach((p) => { p.hidden = p.id !== b.dataset.panel; });
  })
);

// ───────── copy helpers ─────────
let toastEl;
function toast(msg) {
  toastEl ??= Object.assign(document.createElement('div'), { className: 'toast', role: 'status' });
  document.body.appendChild(toastEl);
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => toastEl.classList.remove('show'), 1400);
}
async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast('Copied to clipboard'); }
  catch { toast('Select and copy manually'); }
}
$$('[data-copy]').forEach((b) => b.addEventListener('click', () => copy(b.dataset.copy)));
$$('[data-copy-from]').forEach((b) => b.addEventListener('click', () => copy($(`#${b.dataset.copyFrom}`).textContent)));

// ───────── Lenis smooth scrolling (inertia, like a native app) ─────────
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
async function smoothScroll() {
  let lenis = null;
  if (!reduceMotion) {
    try {
      const { default: Lenis } = await import('https://cdn.jsdelivr.net/npm/lenis@1.3.26/dist/lenis.mjs');
      lenis = new Lenis({ lerp: 0.08, wheelMultiplier: 0.9, touchMultiplier: 1.4, smoothWheel: true });
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    } catch { /* offline: native scrolling */ }
  }
  // Anchor links glide to their section (with room for the sticky nav).
  $$('a[href^="#"]').forEach((a) =>
    a.addEventListener('click', (e) => {
      const target = a.getAttribute('href') === '#top' ? 0 : $(a.getAttribute('href'));
      if (target === null) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: target === 0 ? 0 : -76, duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
      else (target === 0 ? scrollTo({ top: 0, behavior: 'smooth' }) : target.scrollIntoView({ behavior: 'smooth' }));
      history.replaceState(null, '', a.getAttribute('href'));
    })
  );
}
smoothScroll();

// ───────── nav + reveal ─────────
const nav = $('.nav');
addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 8), { passive: true });
const revealIO = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); }
}, { threshold: 0.12 });
$$('.reveal').forEach((el) => revealIO.observe(el));
