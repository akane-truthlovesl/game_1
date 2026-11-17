/* Snug — levels/world2.js : Act 2, The Workshop & the Kitchen (levels 11–20). See docs/passes/pass-02-levels-11-20.md.
   Same authoring conventions as world1.js, plus the Act-2 mechanics:
     world: 'steel' (workbench) · strips[].rail {x0,y0,x1,y1,detents:[0..1],start} (a strip that slides) ... */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const LV = (G.Levels = G.Levels || []);
  (G.Acts = G.Acts || []).push({ n: 2, name: 'Workshop & Kitchen', from: 11, to: 20, done: 'Breakfast is served. Somewhere far away, a train whistles.' });

  /* ---------------------------------------------------------------- 11 */
  // found by tools/search-rail.js (SWAP=1, seed 32): one sweet-spot detent (the middle), a decoy beside it, tidy at the goal
  LV.push({
    id: 11, act: 2, name: 'Slide', cls: 'teach', dawn: 0.62, world: 'steel', par: 4, tidy: true, settleCurl: 1,
    intent: 'The strip is not fixed: slide it until every cable stops squinting.',
    strips: [{
      id: 'R', x: 108, y: 500, slots: 4, pitch: 40, angle: 0, cordAnchor: { x: 180, y: 668 },
      sockets: [{ key: 'any' }, { key: 'any' }, { key: 'any' }, { key: 'any' }],
      rail: { x0: 108, y0: 500, x1: 252, y1: 500, detents: [0, 0.25, 0.5, 0.75, 1], start: 0 },
    }],
    devices: [
      { id: 'dot', type: 'phone', x: 52, y: 330, color: 'coral', cable: { len: 155, curl: -1 }, plug: { key: 'any' }, rest: { x: 60, y: 448 } },
      { id: 'lux', type: 'lamp', x: 125, y: 118, color: 'amber', cable: { len: 360, curl: -1 }, plug: { key: 'any' }, rest: { x: 136, y: 444 } },
      { id: 'gus', type: 'console', x: 244, y: 120, color: 'mint', cable: { len: 385, curl: -1 }, plug: { key: 'any' }, rest: { x: 200, y: 442 } },
      { id: 'spike', type: 'drill', x: 306, y: 340, color: 'sky', cable: { len: 150, curl: -1 }, plug: { key: 'any' }, rest: { x: 270, y: 448 } },
    ],
    decor: [{ art: 'vice', x: 312, y: 78 }, { art: 'screwjar', x: 56, y: 592 }, { art: 'tapemeasure', x: 246, y: 594 }],
    secret: { art: 'pencil', x: 296, y: 612, on: 'tapemeasure' },
    caption: 'Moved the mountain. Mostly the strip.',
  });

  /* ---------------------------------------------------------------- 12 */
  // found by tools/search-hoops.js (seeds 51-53, curated by eye): a staircase of hoops; exactly one crossing-free arrangement
  LV.push({
    id: 12, act: 2, name: 'Fairy Lights', cls: 'puzzle', dawn: 0.78, world: 'peg', par: 3, tidy: true, settleCurl: 1, plainSockets: true,
    rules: { noCross: true },
    intent: 'A device only wakes if its cable runs THROUGH the hoops of its own colour: the route is the rule.',
    strips: [{ id: 'A', x: 180, y: 380, slots: 3, pitch: 40, angle: 0, sockets: [{ key: 'any' }, { key: 'any' }, { key: 'any' }] }],
    gates: [
      { id: 'g1', x: 100, y: 268, rot: 0, gap: 52, key: 'amber' },
      { id: 'g2', x: 174, y: 234, rot: 0, gap: 52, key: 'sky' },
      { id: 'g3', x: 246, y: 212, rot: 0, gap: 52, key: 'mint' },
      { id: 'g4', x: 218, y: 292, rot: -0.3, gap: 52, key: 'sky' },
    ],
    devices: [
      { id: 'wick', type: 'lamp', x: 62, y: 104, color: 'amber', cable: { len: 335, curl: 1 }, plug: { key: 'amber' }, rest: { x: 70, y: 218 } },
      { id: 'static', type: 'radio', x: 178, y: 92, color: 'sky', cable: { len: 360, curl: -1 }, plug: { key: 'sky' }, rest: { x: 182, y: 192 } },
      { id: 'boxy', type: 'laptop', x: 294, y: 108, color: 'mint', cable: { len: 320, curl: 1 }, plug: { key: 'mint' }, rest: { x: 306, y: 208 } },
    ],
    decor: [
      { art: 'outline', kind: 'hammer', x: 64, y: 500, rot: -0.4 },
      { art: 'outline', kind: 'wrench', x: 140, y: 526, rot: 0.3 },
      { art: 'outline', kind: 'saw', x: 232, y: 500, rot: -0.1 },
      { art: 'outline', kind: 'pliers', x: 304, y: 524, rot: 0.35 },
      { art: 'outline', kind: 'hammer', x: 118, y: 590, rot: 0.9 },
      { art: 'outline', kind: 'pliers', x: 228, y: 588, rot: -0.7 },
    ],
    secret: { art: 'goldbulb', x: 40, y: 440, on: 'outline' },
    caption: 'Threaded the needle. And the wall.',
  });

  /* ---------------------------------------------------------------- 13 */
  // found by tools/search-stereo.js (seed 72, curated by eye): one plug with two cables; the lens of the two reach discs holds one socket
  LV.push({
    id: 13, act: 2, name: 'Stereo', cls: 'teach', dawn: 0.7, world: 'garage', par: 3, tidy: true, settleCurl: -1,
    waive: ['luck'], // the puzzle here is spatial (the lens of two reach discs), felt through the squints; a random seat of a 3-plug room cannot be made harder honestly
    intent: 'One plug, two cables: the plug can only go where BOTH can reach.',
    strips: [
      { id: 'G1', kind: 'grommet', x: 142, y: 348, slots: 1, pitch: 40, angle: 0, sockets: [{ key: 'any' }] },
      { id: 'G2', kind: 'grommet', x: 70, y: 486, slots: 1, pitch: 40, angle: 0, sockets: [{ key: 'any' }] },
      { id: 'G3', kind: 'grommet', x: 240, y: 346, slots: 1, pitch: 40, angle: 0, sockets: [{ key: 'any' }] },
      { id: 'G4', kind: 'grommet', x: 236, y: 460, slots: 1, pitch: 40, angle: 0, sockets: [{ key: 'any' }] },
      { id: 'G5', kind: 'grommet', x: 152, y: 540, slots: 1, pitch: 40, angle: 0, sockets: [{ key: 'any' }] },
    ],
    devices: [
      { id: 'lefty', type: 'speaker', x: 68, y: 120, color: 'coral', cable: { len: 300, curl: 1 }, plug: { key: 'any' }, rest: { x: 188, y: 260 }, cableCol: 'coral' },
      { id: 'righty', type: 'speaker', x: 304, y: 120, color: 'sky', cable: { len: 225, curl: 1 }, sharePlug: 'lefty', cableCol: 'sky', flip: true },
      { id: 'spike', type: 'drill', x: 56, y: 300, color: 'amber', cable: { len: 105, curl: -1 }, plug: { key: 'any' }, rest: { x: 86, y: 376 } },
      { id: 'dot', type: 'phone', x: 312, y: 320, color: 'mint', cable: { len: 200, curl: -1 }, plug: { key: 'any' }, rest: { x: 296, y: 408 } },
    ],
    decor: [{ art: 'discoball', x: 180, y: 598 }],
    secret: { art: 'guitarpick', x: 130, y: 600, on: 'discoball' },
    caption: 'Left, right, and exactly one plug in the middle.',
  });

  /* ---------------------------------------------------------------- 14 */
  LV.push({
    id: 14, act: 2, name: 'Tape It', cls: 'breather', dawn: 0.34, world: 'steel', par: 4, tidy: true, settleCurl: -1,
    intent: 'Frayed sockets carry no power. A roll of tape mends only so many: the joker is a wrap saved.',
    strips: [{
      id: 'A', x: 180, y: 392, slots: 5, pitch: 40, angle: 0,
      sockets: [{ key: 'coral', frayed: true }, { key: 'sky', frayed: true }, { key: 'amber' }, { key: 'mint', frayed: true }, { key: 'any' }],
    }],
    tape: { x: 82, y: 536, wraps: 2 },
    devices: [
      { id: 'dot', type: 'phone', x: 44, y: 116, color: 'coral', cable: { len: 262, curl: -1 }, plug: { key: 'coral' }, rest: { x: 76, y: 292 } },
      { id: 'static', type: 'radio', x: 126, y: 100, color: 'sky', cable: { len: 322, curl: -1 }, plug: { key: 'sky' }, rest: { x: 150, y: 286 } },
      { id: 'lux', type: 'lamp', x: 208, y: 116, color: 'amber', cable: { len: 258, curl: -1 }, plug: { key: 'amber' }, rest: { x: 214, y: 296 } },
      { id: 'spike', type: 'drill', x: 292, y: 118, color: 'mint', cable: { len: 262, curl: 1 }, plug: { key: 'mint' }, rest: { x: 292, y: 300 } },
    ],
    decor: [{ art: 'screwjar', x: 304, y: 546 }, { art: 'vice', x: 228, y: 560 }],
    secret: { art: 'goldscrew', x: 330, y: 592, on: 'screwjar' },
    caption: 'Mended. Mostly with tape.',
  });

  /* ---------------------------------------------------------------- 15 */
  // the daisy chain: strip B is dead until its own cord is plugged into a live strip
  LV.push({
    id: 15, act: 2, name: 'The Pegboard Wall', cls: 'hard', dawn: 0.62, world: 'peg', par: 5, tidy: true, settleCurl: 1, plainSockets: false,
    waive: ['luck'], // the keys force the arrangement; the challenge is discovering that the second strip must be fed
    intent: 'Power the power: the second strip is dark until its own cord is plugged into the first.',
    strips: [
      { id: 'A', x: 100, y: 252, slots: 3, pitch: 40, angle: 0, sockets: [{ key: 'violet' }, { key: 'coral' }, { key: 'amber' }] },
      { id: 'B', x: 230, y: 470, slots: 3, pitch: 40, angle: 0, fedBy: 'cordB', sockets: [{ key: 'sky' }, { key: 'mint' }, { key: 'any' }] },
    ],
    devices: [
      { id: 'dot', type: 'phone', x: 44, y: 110, color: 'coral', cable: { len: 134, curl: -1 }, plug: { key: 'coral' }, rest: { x: 78, y: 206 } },
      { id: 'lux', type: 'lamp', x: 130, y: 104, color: 'amber', cable: { len: 124, curl: 1 }, plug: { key: 'amber' }, rest: { x: 168, y: 196 } },
      { id: 'static', type: 'radio', x: 290, y: 280, color: 'sky', cable: { len: 224, curl: -1 }, plug: { key: 'sky' }, rest: { x: 218, y: 366 } },
      { id: 'spike', type: 'drill', x: 306, y: 372, color: 'mint', cable: { len: 120, curl: 1 }, plug: { key: 'mint' }, rest: { x: 254, y: 424 } },
      { id: 'cordB', type: 'anchor', cord: true, x: 148, y: 470, color: 'violet', cable: { len: 276, curl: -1 }, plug: { key: 'violet' }, rest: { x: 112, y: 390 } },
    ],
    decor: [
      { art: 'outline', kind: 'hammer', x: 64, y: 528, rot: -0.5 },
      { art: 'outline', kind: 'wrench', x: 160, y: 560, rot: 0.4 },
      { art: 'outline', kind: 'saw', x: 300, y: 560, rot: -0.15 },
      { art: 'outline', kind: 'pliers', x: 306, y: 90, rot: 0.3 },
      { art: 'outline', kind: 'wrench', x: 40, y: 320, rot: 1.2 },
    ],
    secret: { art: 'goldbulb', x: 330, y: 190, on: 'outline' },
    caption: 'Power the power. The wall approves.',
  });

  /* ---------------------------------------------------------------- 17 */
  LV.push({
    id: 17, act: 2, name: 'Trip', cls: 'teach', dawn: 0.38, world: 'tile', par: 5, tidy: true, settleCurl: 1,
    waive: ['luck'], // a tiny state space on purpose: the lesson is the telegraphed trip (balance the singles), not a search
    intent: 'Every appliance draws bolts; a strip can only carry so many. Overload it and the breaker trips: a choked whistle, every plug popped out.',
    strips: [
      { id: 'A', x: 100, y: 330, slots: 3, pitch: 40, angle: 0, cap: 5, sockets: [{ key: 'any' }, { key: 'any' }, { key: 'any' }] },
      { id: 'B', x: 232, y: 506, slots: 3, pitch: 40, angle: 0, cap: 4, sockets: [{ key: 'any' }, { key: 'any' }, { key: 'any' }] },
    ],
    devices: [
      { id: 'toasty', type: 'toaster', x: 50, y: 150, color: 'mint', watts: 3, cable: { len: 200, curl: -1 }, plug: { key: 'any' }, rest: { x: 78, y: 236 } },
      { id: 'lux', type: 'lamp', x: 132, y: 116, color: 'amber', watts: 1, cable: { len: 208, curl: 1 }, plug: { key: 'any' }, rest: { x: 148, y: 218 } },
      { id: 'static', type: 'radio', x: 214, y: 112, color: 'sky', watts: 1, cable: { len: 430, curl: -1 }, plug: { key: 'any' }, rest: { x: 214, y: 232 } },
      { id: 'dot', type: 'phone', x: 318, y: 262, color: 'coral', watts: 1, cable: { len: 288, curl: 1 }, plug: { key: 'any' }, rest: { x: 268, y: 342 } },
      { id: 'kettle', type: 'kettle', x: 318, y: 398, color: 'coral', watts: 3, cable: { len: 128, curl: -1 }, plug: { key: 'any' }, rest: { x: 282, y: 454 } },
    ],
    caption: 'Seconds, anyone?',
  });

  /* ---------------------------------------------------------------- 16 */
  LV.push({
    id: 16, act: 2, name: 'Puddle', cls: 'puzzle', dawn: 0.62, world: 'tile', par: 4, tidy: true, settleCurl: -1, plainSockets: true,
    intent: 'The only socket for Dot sits in a puddle. A helper dries it, and then the helper has to leave: the strip has no room for it.',
    strips: [
      { id: 'A', x: 190, y: 500, slots: 2, pitch: 40, angle: 0, sockets: [{ key: 'any' }, { key: 'any' }] },
      { id: 'W', kind: 'grommet', x: 66, y: 422, slots: 1, pitch: 40, angle: 0, sockets: [{ key: 'any' }] },
    ],
    devices: [
      { id: 'dot', type: 'phone', x: 44, y: 250, color: 'coral', cable: { len: 152, curl: -1 }, plug: { key: 'coral' }, rest: { x: 62, y: 352 } },
      { id: 'dryer', type: 'dryer', x: 152, y: 300, color: 'violet', required: false, cable: { len: 196, curl: -1 }, plug: { key: 'violet' }, rest: { x: 168, y: 410 }, tool: { dries: ['W.1'] } },
      { id: 'lux', type: 'lamp', x: 250, y: 130, color: 'amber', cable: { len: 372, curl: -1 }, plug: { key: 'amber' }, rest: { x: 238, y: 336 } },
      { id: 'static', type: 'radio', x: 302, y: 400, color: 'sky', cable: { len: 172, curl: -1 }, plug: { key: 'sky' }, rest: { x: 286, y: 326 } },
    ],
    caption: 'Dried it. Wired it. Whisk says thanks.',
  });

  /* ---------------------------------------------------------------- 18 */
  // the breather: nothing to solve but the beat. Windows open 1.2 s apart, left to right after the two ends (0 and 3.6 = ends first).
  LV.push({
    id: 18, act: 2, name: 'Egg Timer', cls: 'breather', dawn: 0.34, world: 'tile', par: 4, tidy: true, settleCurl: -1, beat: 1.2,
    intent: 'Some sockets are only open on their beat. A ring fills with light; when it glows green, plug in. A plug stays plugged.',
    strips: [{
      id: 'A', x: 180, y: 420, slots: 4, pitch: 40, angle: 0,
      sockets: [
        { key: 'any', timer: { period: 4.8, on: 1.9, phase: 0 } },
        { key: 'any', timer: { period: 4.8, on: 1.9, phase: 1.2 } },
        { key: 'any', timer: { period: 4.8, on: 1.9, phase: 2.4 } },
        { key: 'any', timer: { period: 4.8, on: 1.9, phase: 3.6 } },
      ],
    }],
    // four ports on one line, four equal cables and the same fold: the rest state is a row of parallel S-curves, a pendulum row (rhythm)
    devices: [
      { id: 'kettle', type: 'kettle', x: 42, y: 145, color: 'coral', cable: { len: 340, curl: 1 }, plug: { key: 'any' }, rest: { x: 42, y: 330 } },
      { id: 'static', type: 'radio', x: 126, y: 152, color: 'sky', cable: { len: 340, curl: 1 }, plug: { key: 'any' }, rest: { x: 126, y: 330 } },
      { id: 'toasty', type: 'toaster', x: 214, y: 150, color: 'mint', cable: { len: 340, curl: 1 }, plug: { key: 'any' }, rest: { x: 214, y: 330 } },
      { id: 'dot', type: 'phone', x: 291, y: 134, color: 'coral', cable: { len: 340, curl: 1 }, plug: { key: 'any' }, rest: { x: 291, y: 330 } },
    ],
    decor: [{ art: 'eggtimer', x: 70, y: 556 }, { art: 'eggtimer', x: 300, y: 560 }],
    secret: { art: 'goldscrew', x: 184, y: 590, on: 'eggtimer' },
    caption: 'Everything in its time.',
  });

  /* ---------------------------------------------------------------- 19 */
  // a dark kitchen at 2 am: the carried plug is a lantern, the socket it fits hums, and Biscuit is asleep. Quiet hands (slow drags).
  LV.push({
    id: 19, act: 2, name: 'Midnight Snack', cls: 'story', dawn: 0.0, world: 'night', par: 3, tidy: true, settleCurl: -1,
    intent: 'A dark kitchen: the plug in your hand is a lantern, the socket it fits hums, and a cat is asleep. Softly.',
    dark: { cat: { x: 64, y: 536 } },
    strips: [{ id: 'A', x: 180, y: 410, slots: 3, pitch: 40, angle: 0, sockets: [{ key: 'coral' }, { key: 'amber' }, { key: 'sky' }] }],
    devices: [
      { id: 'dot', type: 'phone', x: 50, y: 134, color: 'coral', cable: { len: 280, curl: 1 }, plug: { key: 'coral' }, rest: { x: 56, y: 304 } },
      { id: 'lux', type: 'lamp', x: 160, y: 134, color: 'amber', cable: { len: 280, curl: 1 }, plug: { key: 'amber' }, rest: { x: 160, y: 304 } },
      { id: 'static', type: 'radio', x: 280, y: 152, color: 'sky', cable: { len: 280, curl: -1 }, plug: { key: 'sky' }, rest: { x: 274, y: 304 } },
    ],
    decor: [{ art: 'cushion', x: 64, y: 536 }, { art: 'fridge', x: 292, y: 66 }],
    secret: { art: 'goldscrew', x: 330, y: 112, on: 'fridge' },
    caption: 'Nobody tell Biscuit.',
  });

  /* ---------------------------------------------------------------- 20 */
  // the boss: every lesson of the act in one kitchen, in the order the room needs them. Dry the puddle (dryer on A, first: 2 W),
  // feed B (its cord into A), mend B's frayed socket, then everything draws through A: 3 + 5 = 8 of 8, no slack at all.
  LV.push({
    id: 20, act: 2, name: 'Breakfast for Twelve', cls: 'boss', dawn: 0.86, world: 'tile', par: 8, tidy: true, settleCurl: 1, finale: 'sunrise',
    waive: ['luck'], // keys and reach force the arrangement; the challenge is the order (dry first, feed B, mend, then load)
    intent: 'The whole kitchen at sunrise: a puddle by the sink, a strip that must be fed, a frayed socket, and a breaker with no slack.',
    strips: [
      { id: 'A', x: 180, y: 574, slots: 3, pitch: 40, angle: 0, cap: 8, sockets: [{ key: 'violet' }, { key: 'coral' }, { key: 'any' }] },
      { id: 'B', x: 236, y: 376, slots: 3, pitch: 40, angle: 0, cap: 5, fedBy: 'cordB', sockets: [{ key: 'amber' }, { key: 'sky' }, { key: 'mint', frayed: true }] },
      { id: 'W', kind: 'grommet', x: 56, y: 326, slots: 1, pitch: 40, angle: 0, sockets: [{ key: 'coral' }] },
    ],
    tape: { x: 314, y: 536, wraps: 1 },
    devices: [
      { id: 'dot', type: 'phone', x: 44, y: 130, color: 'coral', watts: 1, cable: { len: 168, curl: 1 }, plug: { key: 'coral' }, rest: { x: 60, y: 246 } },
      { id: 'lux', type: 'lamp', x: 128, y: 134, color: 'amber', watts: 1, cable: { len: 228, curl: -1 }, plug: { key: 'amber' }, rest: { x: 134, y: 262 } },
      { id: 'static', type: 'radio', x: 204, y: 152, color: 'sky', watts: 1, cable: { len: 218, curl: -1 }, plug: { key: 'sky' }, rest: { x: 200, y: 262 } },
      { id: 'toasty', type: 'toaster', x: 300, y: 150, color: 'mint', watts: 3, cable: { len: 216, curl: -1 }, plug: { key: 'mint' }, rest: { x: 294, y: 262 } },
      { id: 'kettle', type: 'kettle', x: 70, y: 500, color: 'coral', watts: 3, cable: { len: 135, curl: 1 }, plug: { key: 'coral' }, rest: { x: 134, y: 490 } },
      { id: 'dryer', type: 'dryer', x: 118, y: 410, color: 'violet', watts: 2, required: false, cable: { len: 146, curl: -1 }, plug: { key: 'violet' }, rest: { x: 186, y: 502 }, tool: { dries: ['W.1'] } },
      { id: 'cordB', type: 'anchor', cord: true, x: 322, y: 376, color: 'violet', cable: { len: 242, curl: -1 }, plug: { key: 'violet' }, rest: { x: 278, y: 474 } },
    ],
    decor: [{ art: 'fruitbowl', x: 160, y: 316 }, { art: 'mug', x: 60, y: 584 }],
    secret: { art: 'goldspoon', x: 196, y: 334, on: 'fruitbowl' },
    caption: 'Breakfast is served. Somewhere far away, a train whistles.',
  });

  G.Levels.sort((a, b) => a.id - b.id); // the file is written in build order; the game reads in level order
})();
