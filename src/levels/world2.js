/* Snug — levels/world2.js : Act 2, The Workshop & the Kitchen (levels 11–20). See docs/passes/pass-02-levels-11-20.md.
   Same authoring conventions as world1.js, plus the Act-2 mechanics:
     world: 'steel' (workbench) · strips[].rail {x0,y0,x1,y1,detents:[0..1],start} (a strip that slides) ... */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const LV = (G.Levels = G.Levels || []);
  (G.Acts = G.Acts || []).push({ n: 2, name: 'Workshop & Kitchen', from: 11, to: 20, done: 'Breakfast is served. Somewhere far away, a train whistles.' });

  /* ---------------------------------------------------------------- 11 */
  LV.push({
    id: 11, act: 2, name: 'Slide', cls: 'teach', dawn: 0.62, world: 'steel', par: 4, tidy: true,
    intent: 'The strip is not fixed: slide it until every cable stops squinting.',
    strips: [{
      id: 'R', x: 108, y: 480, slots: 4, pitch: 40, angle: 0, cordAnchor: { x: 180, y: 668 },
      sockets: [{ key: 'any' }, { key: 'any' }, { key: 'any' }, { key: 'any' }],
      rail: { x0: 108, y0: 480, x1: 252, y1: 480, detents: [0, 0.25, 0.5, 0.75, 1], start: 4 },
    }],
    devices: [
      { id: 'dot', type: 'phone', x: 44, y: 310, color: 'coral', cable: { len: 165, curl: -1 }, plug: { key: 'any' }, rest: { x: 64, y: 430 } },
      { id: 'lux', type: 'lamp', x: 120, y: 118, color: 'amber', cable: { len: 385, curl: -1 }, plug: { key: 'any' }, dir: 12, frac: 0.6 },
      { id: 'spike', type: 'drill', x: 232, y: 124, color: 'sky', cable: { len: 345, curl: -1 }, plug: { key: 'any' }, dir: -8, frac: 0.6 },
      { id: 'gus', type: 'console', x: 304, y: 330, color: 'mint', cable: { len: 155, curl: 1 }, plug: { key: 'any' }, rest: { x: 288, y: 428 } },
    ],
    decor: [{ art: 'vice', x: 171, y: 84 }, { art: 'screwjar', x: 306, y: 578 }, { art: 'tapemeasure', x: 56, y: 582 }],
    secret: { art: 'pencil', x: 150, y: 604, on: 'tapemeasure' },
    caption: 'Moved the mountain. Mostly the strip.',
  });
})();
