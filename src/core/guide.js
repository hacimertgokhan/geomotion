// Spec reference used by the MCP `geomotion_guide` tool and the studio.
export const SPEC_GUIDE = `# geomotion spec

An animation is a list of **keyframes** (poses). Each pose is a list of **shapes**.
Between poses every shape morphs into its partner; lines are re-inked several
times per second ("boil") so it feels hand-traced.

\`\`\`json
{
  "name": "sunrise",
  "size": [1200, 1200],          // canvas; coordinates are in these units
  "fps": 24,                     // output frame rate
  "boil": 12,                    // line re-draws per second (0 = perfectly still)
  "loop": true,                  // last pose morphs back into the first
  "background": "ivory",         // palette name, hex, or "transparent"
  "seed": 1,                     // change for a different hand-drawn variation
  "hold": 0.7, "duration": 0.9, "ease": "inOutCubic",   // defaults for keyframes
  "style": {
    "ink": "ink",                // default stroke color
    "width": 24,                 // stroke width (default scales with canvas: 24 @ 1200px)
    "wobble": 1,                 // 0 = clean vector, 1 = hand-drawn, 2 = shaky
    "roughness": 1,              // width variation along the line
    "taper": 0.5,                // 0..1, thinner line ends
    "misregister": [-14, 10]     // fill offset vs ink (riso print look); false = off
  },
  "keyframes": [
    { "hold": 0.6, "duration": 0.9, "ease": "inOutBack",
      "shapes": [
        { "id": "sun", "type": "circle", "cx": 600, "cy": 560, "r": 220, "fill": "oat" },
        { "id": "ground", "type": "line", "from": [120, 900], "to": [1080, 900] }
      ] },
    { "shapes": [ ... ] }
  ]
}
\`\`\`

## Keyframe fields
- \`hold\` seconds the pose is shown (still boiling), \`duration\` seconds of the morph to the NEXT keyframe, \`ease\` for that morph.

## Shape types (coordinates in canvas units)
- circle {cx, cy, r} · ellipse {cx, cy, rx, ry} · rect {x, y, w, h, radius?} or {cx, cy, w, h}
- line {from:[x,y], to:[x,y]} or {points:[[x,y],...]} · polyline {points, closed?} · polygon {points}
- regular {cx, cy, r, sides, angle?} · triangle {cx, cy, r, angle?} · star {cx, cy, r, inner?, points?, angle?}
- heart {cx, cy, size} · blob {cx, cy, r, seed?, irregularity?} (organic pebble) · crescent {cx, cy, r, thickness?, angle?}
- wave {from, to, amplitude?, waves?, phase?} · spiral {cx, cy, r, turns?} · arc {cx, cy, r, start, end} (degrees, 0 = right, clockwise)
- path {d} — any SVG path data; each subpath becomes its own line (ids get ".0", ".1"...)

## Shape options
- \`id\` — shapes with the same id in consecutive keyframes morph into each other. Without ids, shapes match by list position. **Use ids.**
- \`stroke\`: color or false (no outline) · \`fill\`: color (soft offset blob behind the ink) · \`color\`: alias for stroke color
- \`width\`: stroke width · \`opacity\`: 0..1
- \`enter\` / \`exit\`: how a shape appears/disappears when it has no partner: "grow" (default), "pop" (springy), "draw" (traced on), "fade", "cut"
- \`delay\`: 0..0.95 — start later within the transition (stagger!) · \`ease\`: per-shape easing
- \`transform\`: { translate:[x,y], rotate:deg, scale:s|[sx,sy], origin:[x,y] }

## Palette
ink #141413 · slate #3d3d3a · ivory #faf9f5 · paper #f0eee6 · oat #e3dacc · kraft #d4a27f · clay #d97757 · coral #ebcece · fig #c46686 · sky #6a9bcc · cactus #bcd1ca · olive #788c5d · heather #cbcadb · sun #f2c46d · white

## Easings
linear, inQuad, outQuad, inOutQuad, inCubic, outCubic, inOutCubic, inOutQuart, inSine, outSine, inOutSine, outExpo, inOutExpo, outBack, inOutBack, outElastic, outBounce

## Design tips (what makes it look good)
1. Few, bold shapes. 2–5 shapes per pose on a 1200 canvas; leave ~120px margin.
2. One accent fill per pose (oat/clay/sky/cactus), ink for all lines. Fills sit behind ink with a slight offset.
3. Give every element an \`id\` so the morph tells a story (sun → wheel → coin).
4. Stagger with \`delay\` (0, 0.15, 0.3) and use "draw" for lines that should feel written.
5. Holds of 0.5–1s, morphs of 0.6–1.2s. inOutCubic is calm, inOutBack/outBack is playful.
6. Morphs read best between shapes of similar size; open lines ↔ closed shapes also work (a line can curl into a circle).
`;
