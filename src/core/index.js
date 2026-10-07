// geomotion — hand-drawn morphing line animations.
// Pure ESM, no dependencies: runs in Node and in the browser.
import { compile } from './scene.js';
import { toAnimatedSVG, toFrameSVG, frameIndexAt } from './render-svg.js';
import { toLottie } from './render-lottie.js';

export { compile, normalizeSpec, buildTimeline, stateAt, renderState, DEFAULTS } from './scene.js';
export { toAnimatedSVG, toFrameSVG, frameIndexAt, opsToPaths } from './render-svg.js';
export { toLottie } from './render-lottie.js';
export { PALETTE, resolveColor } from './palette.js';
export { EASINGS } from './easing.js';
export { SHAPE_TYPES, SHAPE_FIELDS } from './shapes.js';
export { contourToD } from './smooth.js';
export { SPEC_GUIDE } from './guide.js';
export { encodeSpec, decodeSpec, makeLinks, specFromHash, SITE_URL } from './links.js';
export { formatSpec } from './format.js';

/**
 * One-shot render.
 * @param {object} spec
 * @param {{transparent?: boolean}} [options]
 * @returns {{meta:object, svg:string, lottie:object, frameSVG:(t:number)=>string, compiled:object}}
 */
export function render(spec, options = {}) {
  const compiled = compile(spec, options);
  return {
    meta: compiled.meta,
    compiled,
    get svg() { return toAnimatedSVG(compiled); },
    get lottie() { return toLottie(compiled); },
    frameSVG: (seconds = 0) => toFrameSVG(compiled, frameIndexAt(compiled, seconds)),
  };
}
