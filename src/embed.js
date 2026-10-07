// <geo-motion> web component — drop a hand-drawn animation into any page.
//
//   <script type="module" src="https://hacimertgokhan.github.io/geomotion/src/embed.js"></script>
//   <geo-motion preset="sunrise"></geo-motion>
//   <geo-motion preset="success" transparent style="width:160px"></geo-motion>
//   <geo-motion src="./my-animation.json"></geo-motion>
//   <geo-motion code="z…"></geo-motion>            (the #s=… part of a share link)
//   <geo-motion>{ "keyframes": [...] }</geo-motion> (inline JSON spec)
//
// Attributes: preset | src | code | transparent | paused | hover (play on hover) | speed | start (0..1)
import { compile, frameIndexAt, contourToD, decodeSpec } from './core/index.js';
import { PRESETS } from './presets/index.js';

const CACHE = new Map();

const STYLE = `:host{display:inline-block;width:320px;aspect-ratio:1/1;position:relative;line-height:0}
canvas{width:100%;height:100%;display:block}
:host([hidden]){display:none}`;

class GeoMotion extends HTMLElement {
  static get observedAttributes() { return ['preset', 'src', 'code', 'transparent', 'paused', 'speed']; }

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${STYLE}</style><canvas part="canvas" role="img"></canvas>`;
    this.canvas = root.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.clock = 0;
    this._loop = this._loop.bind(this);
    this._hovering = false;
  }

  connectedCallback() {
    this._load();
    this.addEventListener('mouseenter', () => { this._hovering = true; });
    this.addEventListener('mouseleave', () => { this._hovering = false; });
    this._io = new IntersectionObserver(([e]) => { this._visible = e.isIntersecting; });
    this._io.observe(this);
    this._raf = requestAnimationFrame(this._loop);
  }

  disconnectedCallback() {
    cancelAnimationFrame(this._raf);
    this._io?.disconnect();
  }

  attributeChangedCallback() { if (this.isConnected) this._load(); }

  /** Programmatic API: el.spec = {...} */
  set spec(s) { this._spec = s; this._build(); }
  get spec() { return this._spec; }

  async _load() {
    try {
      let spec = null;
      const preset = this.getAttribute('preset');
      if (preset) {
        if (!PRESETS[preset]) throw new Error(`unknown preset "${preset}"`);
        spec = PRESETS[preset].spec;
      } else if (this.getAttribute('code')) {
        spec = await decodeSpec(this.getAttribute('code'));
      } else if (this.getAttribute('src')) {
        spec = await (await fetch(this.getAttribute('src'))).json();
      } else if (this.textContent.trim()) {
        spec = JSON.parse(this.textContent);
      }
      if (spec) { this._spec = spec; this._build(); }
      else if (this._spec) this._build(); // e.g. `transparent` toggled on a programmatic spec
    } catch (e) {
      console.warn('[geo-motion]', e);
    }
  }

  _build() {
    // Identical specs on one page (e.g. a marquee) are compiled once.
    const key = (this.hasAttribute('transparent') ? 't' : 'b') + JSON.stringify(this._spec);
    let entry = CACHE.get(key);
    if (!entry) {
      const c = compile(this._spec, { transparent: this.hasAttribute('transparent') });
      entry = {
        compiled: c,
        paths: c.frames.map((f) => f.ops.map((op) => ({
          p: new Path2D(op.contours.map((k) => contourToD(k, 1)).join('')), color: op.color, a: op.opacity,
        }))),
      };
      CACHE.set(key, entry);
    }
    const c = entry.compiled;
    if (!this.compiled && this.hasAttribute('start')) {
      // start="0.4" → begin 40% into the animation (nice for thumbnails that start empty)
      this.clock = Math.max(0, Math.min(1, parseFloat(this.getAttribute('start')) || 0)) * c.meta.duration;
    }
    this.compiled = c;
    this.paths = entry.paths;
    this.canvas.width = c.meta.width;
    this.canvas.height = c.meta.height;
    this.style.aspectRatio = `${c.meta.width} / ${c.meta.height}`;
    this.canvas.setAttribute('aria-label', this.getAttribute('aria-label') ?? c.meta.name);
    this._drawn = -1;
    this._draw();
  }

  _draw() {
    const c = this.compiled;
    if (!c) return;
    const i = frameIndexAt(c, this.clock);
    if (i === this._drawn) return;
    this._drawn = i;
    const { width: W, height: H, background } = c.meta;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, W, H);
    if (background) { ctx.fillStyle = background; ctx.fillRect(0, 0, W, H); }
    for (const op of this.paths[i]) { ctx.globalAlpha = op.a; ctx.fillStyle = op.color; ctx.fill(op.p); }
    ctx.globalAlpha = 1;
  }

  _loop(ts) {
    const dt = this._last == null ? 0 : (ts - this._last) / 1000;
    this._last = ts;
    const playing = !this.hasAttribute('paused') && (!this.hasAttribute('hover') || this._hovering);
    if (this.compiled && playing && this._visible !== false) {
      this.clock += dt * Number(this.getAttribute('speed') ?? 1);
      const d = this.compiled.meta.duration;
      this.clock = this.compiled.meta.loop ? this.clock % d : Math.min(this.clock, d - 1e-6);
      this._draw();
    }
    this._raf = requestAnimationFrame(this._loop);
  }

  /** Jump to a time in seconds. */
  seek(t) { this.clock = t; this._drawn = -1; this._draw(); }
}

if (!customElements.get('geo-motion')) customElements.define('geo-motion', GeoMotion);
export { GeoMotion };
