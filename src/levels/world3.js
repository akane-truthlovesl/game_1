/* Snug — levels/world3.js : Act 3, the Toy Room & the Studio (levels 21–30). See docs/passes/pass-03-levels-21-30.md.
   Same authoring conventions as world1/2, plus the Act-3 mechanics:
     world: 'toy' (pine floor, felt play mat) · strips[].carrier {speed, dock, cord, keepOut:[rects], snacks:[{x,y,secs}]} (a strip that rides a snail) */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const LV = (G.Levels = G.Levels || []);
  // track geometry helpers: points along an elliptical arc (degrees; increasing = clockwise on screen), a smooth curve through
  // control points (Catmull-Rom), and the arclength of the point on a polyline nearest to (x, y)
  const D2R = Math.PI / 180;
  const ell = (cx, cy, rx, ry, a0, a1, n) =>
    Array.from({ length: n + 1 }, (_, i) => {
      const a = (a0 + ((a1 - a0) * i) / n) * D2R;
      return { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) };
    });
  const spl = (P, n) => {
    const out = [];
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[Math.max(0, i - 1)],
        p1 = P[i],
        p2 = P[i + 1],
        p3 = P[Math.min(P.length - 1, i + 2)];
      for (let k = 0; k < n; k++) {
        const t = k / n,
          t2 = t * t,
          t3 = t2 * t;
        const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        out.push({ x: f(p0[0], p1[0], p2[0], p3[0]), y: f(p0[1], p1[1], p2[1], p3[1]) });
      }
    }
    const l = P[P.length - 1];
    out.push({ x: l[0], y: l[1] });
    return out;
  };
  const nearestS = (pts, x, y) => {
    let acc = 0,
      best = 0,
      bd = 1e9;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1],
        b = pts[i],
        dx = b.x - a.x,
        dy = b.y - a.y,
        d2 = dx * dx + dy * dy || 1,
        u = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / d2)),
        dd = Math.hypot(x - (a.x + dx * u), y - (a.y + dy * u));
      if (dd < bd) {
        bd = dd;
        best = acc + Math.sqrt(d2) * u;
      }
      acc += Math.sqrt(d2);
    }
    return best;
  };
  (G.Acts = G.Acts || []).push({ n: 3, name: 'Toy Room & Studio', from: 21, to: 30, done: 'The band takes a bow. Somewhere far above, something beeps.' });

  /* ---------------------------------------------------------------- 21 */
  // "meet at the bridge": the lamp sits on the snail's bank, the radio and the phone on the far side. A cable that is plugged
  // early TETHERS the snail: it cannot walk out of that cable's reach, so the strip parks itself on the plank deck, where all three meet.
  LV.push({
    id: 21, act: 3, name: 'Snail Mail', cls: 'teach', dawn: 0.45, world: 'toy', par: 4, tidy: true, settleCurl: 0.3,
    waive: ['luck'], // the road is the puzzle; a random player cannot walk a snail
    intent: 'The strip is on a snail, and the snail goes where you draw. Send the socket to the cables.',
    strips: [{
      id: 'S', x: 196, y: 548, slots: 3, pitch: 40, angle: 0,
      carrier: {
        speed: 24, dock: { x: 262, y: 392 }, cord: { x: -30, y: 604 },
        keepOut: [{ x: 102, y: 392, w: 168, h: 40 }],
        snacks: [{ x: 222, y: 452, secs: 2.4 }],
        teaser: 'clatterFar',
      },
      sockets: [{ key: 'amber' }, { key: 'sky' }, { key: 'coral' }],
    }],
    devices: [
      { id: 'lux', type: 'lamp', x: 56, y: 462, color: 'amber', cable: { len: 240, curl: 1 }, plug: { key: 'amber' }, rest: { x: 62, y: 584 } },
      { id: 'static', type: 'radio', x: 180, y: 152, color: 'sky', cable: { len: 270, curl: 1 }, plug: { key: 'sky' }, rest: { x: 180, y: 240 } },
      { id: 'dot', type: 'phone', x: 294, y: 134, color: 'coral', cable: { len: 290, curl: -1 }, plug: { key: 'coral' }, rest: { x: 322, y: 240 } },
    ],
    decor: [
      { art: 'river', x: 102, y: 392, w: 168, h: 40 },
      { art: 'plank', x: 264, y: 392, w: 156, h: 44 },
      { art: 'lettuce', x: 222, y: 452 },
    ],
    secret: { art: 'goldleaf', x: 214, y: 470, on: 'lettuce', taps: 5 }, // tap the lettuce five times
    caption: 'Slow mail is still mail.',
  });

  /* ---------------------------------------------------------------- 22 */
  // Biscuit sits on the middle socket, in the sun. Press the floor: a spot of light. She hunts it; lead her to the corner and plug in
  // while she guards it (or let go: the spot stays where it was left and she keeps pouncing on it for a few seconds).
  LV.push({
    id: 22, act: 3, name: 'Laser Pointer', cls: 'puzzle', dawn: 0.8, world: 'toy', par: 4, tidy: true, settleCurl: 0.3,
    waive: ['luck'], // a cat is a state machine, not a dice roll
    intent: 'Biscuit is sitting on the socket you need. You cannot lift a cat. You can show her something better.',
    herd: { cat: { on: 'A.2' }, beam: { x: 290, y: 446, r: 110 }, lure: { x: 62, y: 556 }, guardT: 4.5, boredT: 2.4, teaser: 'whistleFar' },
    strips: [{ id: 'A', x: 180, y: 400, slots: 3, pitch: 40, angle: 0, sockets: [{ key: 'amber' }, { key: 'sky' }, { key: 'coral' }] }],
    devices: [
      { id: 'lux', type: 'lamp', x: 50, y: 134, color: 'amber', cable: { len: 270, curl: 1 }, plug: { key: 'amber' }, rest: { x: 50, y: 284 } },
      { id: 'static', type: 'radio', x: 168, y: 152, color: 'sky', cable: { len: 270, curl: 1 }, plug: { key: 'sky' }, rest: { x: 168, y: 284 } },
      { id: 'dot', type: 'phone', x: 282, y: 134, color: 'coral', cable: { len: 270, curl: 1 }, plug: { key: 'coral' }, rest: { x: 282, y: 284 } },
    ],
    decor: [{ art: 'sunpatch', x: 180, y: 420, w: 270, h: 170, inert: true }, { art: 'yarn', x: 296, y: 566 }],
    secret: { art: 'goldyarn', x: 292, y: 512, on: 'catches', taps: 2 }, // she catches the light twice
    caption: 'Nobody told her it was only light.',
  });

  /* ---------------------------------------------------------------- 23 */
  // two loops that share a stretch; the points choose between them. With every cable plugged only the small loop (round the devices) is
  // safe: the big loop leaves their reach, and the strip is a dynamo, so the room wakes only while the train rolls.
  const SMALL = ell(180, 360, 100, 44, 125, 415, 64); // J_w, up the left, over the top, down the right, J_e (clockwise)
  const SHARED = ell(180, 360, 100, 44, 55, 125, 14); // J_e, along the bottom heading west, J_w
  const BIG = spl([[123, 391], [92, 420], [58, 468], [50, 520], [86, 564], [150, 590], [210, 590], [274, 564], [310, 520], [302, 468], [268, 420], [237, 391]], 8); // J_w, round the yard, J_e
  LV.push({
    id: 23, act: 3, name: 'All Aboard', cls: 'puzzle', dawn: 0.5, world: 'toy', par: 6, tidy: true, settleCurl: 0.3,
    waive: ['luck'], // a train is a state machine: the plan is points, lever, plugs, lever
    intent: 'The strip rides a toy train and is powered by its wheels. The points choose the loop; the lever holds it at a station.',
    strips: [{
      id: 'S', x: 237, y: 391, slots: 3, pitch: 40, angle: 0,
      carrier: {
        speed: 46, dock: { x: 180, y: 404 }, cord: { x: 372, y: 340 }, dynamo: true, teaser: 'tinDrum',
        track: {
          segs: { shared: { pts: SHARED }, small: { pts: SMALL }, big: { pts: BIG } },
          next: { small: 'shared', big: 'shared' },
          shared: 'shared',
          points: { at: 'shared', options: ['small', 'big'], to: 'big', x: 128, y: 468 },
          lever: { x: 182, y: 498 },
          start: { seg: 'shared', s: 12 },
          stations: [{ id: 'S', seg: 'shared', s: nearestS(SHARED, 180, 404) }], // one station, on the platform the two loops share
        },
      },
      sockets: [{ key: 'coral' }, { key: 'sky' }, { key: 'amber' }],
    }],
    devices: [
      { id: 'dot', type: 'phone', x: 56, y: 134, color: 'coral', cable: { len: 272, curl: 1 }, plug: { key: 'coral' }, rest: { x: 56, y: 252 } },
      { id: 'static', type: 'radio', x: 170, y: 152, color: 'sky', cable: { len: 246, curl: 1 }, plug: { key: 'sky' }, rest: { x: 170, y: 252 } },
      { id: 'lux', type: 'lamp', x: 284, y: 134, color: 'amber', cable: { len: 272, curl: 1 }, plug: { key: 'amber' }, rest: { x: 284, y: 252 } },
    ],
    decor: [{ art: 'station', x: 180, y: 362, w: 70, h: 46, inert: true }],
    secret: { art: 'goldwhistle', x: 300, y: 330, on: 'toots', taps: 4 }, // toot the engine four times
    caption: 'On time, for once.',
  });

  /* ---------------------------------------------------------------- 24 */
  // a tin drummer carries the strip. Aim it, wind its key (one click per quarter-turn, 55 u a click): it walks straight, turns right at
  // a wall or the edge, and goes on if it has wind left. A wall of toy blocks crosses the rug with a gap on the right; the cables only
  // reach where the strip sits near the devices (and settle tidily from y 270 down). East, north through the gap, west: three walks.
  const DEVWALLS = [{ x: 56, y: 134, w: 50, h: 92 }, { x: 170, y: 152, w: 92, h: 56 }, { x: 284, y: 134, w: 46, h: 92 }]; // the toy cannot walk through its friends
  const BLOCKS24 = [{ x: 84, y: 430, w: 132, h: 44 }, { x: 62, y: 330, w: 84, h: 44 }];
  LV.push({
    id: 24, act: 3, name: 'Wind-Up Parade', cls: 'puzzle', dawn: 0.6, world: 'toy', par: 3, tidy: true, settleCurl: 0.3,
    waive: ['luck'], // a wind-up toy is a walk to plan, not a dice roll
    intent: 'The strip rides a tin drummer. Aim it, wind its key, let it march: it turns right at every wall.',
    strips: [{
      id: 'S', x: 190, y: 556, slots: 3, pitch: 40, angle: 0,
      carrier: {
        mode: 'wind', speed: 26, heading: -Math.PI / 2, dock: { x: 170, y: 285 }, cord: { x: -30, y: 600 },
        walls: BLOCKS24.concat(DEVWALLS), turn: 'right', maxClicks: 8, hx: 80, hy: 36, stepSound: 'tinStep', stepT: 0.34, teaser: 'blockClack',
      },
      sockets: [{ key: 'coral' }, { key: 'sky' }, { key: 'amber' }],
    }],
    devices: [
      { id: 'dot', type: 'phone', x: 56, y: 134, color: 'coral', cable: { len: 160, curl: 1 }, plug: { key: 'coral' }, rest: { x: 56, y: 232 } },
      { id: 'static', type: 'radio', x: 170, y: 152, color: 'sky', cable: { len: 145, curl: 1 }, plug: { key: 'sky' }, rest: { x: 170, y: 232 } },
      { id: 'lux', type: 'lamp', x: 284, y: 134, color: 'amber', cable: { len: 160, curl: 1 }, plug: { key: 'amber' }, rest: { x: 284, y: 232 } },
    ],
    decor: [
      { art: 'blockwall', x: 84, y: 430, w: 132, h: 44, text: 'TOY', seed: 0, inert: true },
      { art: 'blockwall', x: 62, y: 330, w: 84, h: 44, text: 'GO', seed: 2, inert: true },
      { art: 'tinsoldier', x: 70, y: 500, loop: { x: 70, y: 500, w: 90, h: 60 }, count: 3, speed: 15, phase: 0, inert: true },
    ],
    secret: { art: 'goldkey', x: 300, y: 330, on: 'wound', taps: 8 }, // wind it all the way (eight clicks) once
    caption: 'Left, right, left, right, plugged.',
  });

  // ---- Level 25 "Block Party": a toy box packed with alphabet blocks, a power strip lying on its floor under them. The cables cannot pass
  // through a block and an outlet under one is lost: free the three outlets and the cell above each (the way in for the plug). Blocky
  // (2x2) hides two of them. Slide the blocks (they are heavy, they clack: each is a marimba bar) into the wings of the box.
  // The tray is 7 x 3 cells (cols 0-6, grid rows 7-9); the shortest way out is seven moves (Rules.blockSearch).
  LV.push({
    id: 25, act: 3, name: 'Block Party', cls: 'puzzle', dawn: 0.5, world: 'toy', par: 3, tidy: true, settleCurl: 0.3,
    waive: ['luck'], // a sliding puzzle is a plan, not a dice roll
    intent: 'The cables cannot pass through a block. The outlets are under the toys: move the toys, then plug.',
    strips: [{ id: 'S', x: 180, y: 436, slots: 3, pitch: 44, angle: 0, sockets: [{ key: 'coral' }, { key: 'sky' }, { key: 'amber' }] }],
    devices: [
      { id: 'dot', type: 'phone', x: 56, y: 178, color: 'coral', cable: { len: 262, curl: -1 }, plug: { key: 'coral' }, rest: { x: 84, y: 312 } },
      { id: 'static', type: 'radio', x: 170, y: 196, color: 'sky', cable: { len: 236, curl: 1 }, plug: { key: 'sky' }, rest: { x: 170, y: 306 } },
      { id: 'lux', type: 'lamp', x: 284, y: 178, color: 'amber', cable: { len: 262, curl: 1 }, plug: { key: 'amber' }, rest: { x: 256, y: 312 } },
    ],
    blockGrid: { x0: 26, y0: 62, cols: 7, rows: 12 },
    blockTray: { c0: 0, r0: 7, c1: 6, r1: 9 },
    blockGoal: { free: [[2, 7], [3, 7], [4, 7], [2, 8], [3, 8], [4, 8]] },
    blocks: [
      { id: 'B', letter: 'B', c: 2, r: 8, w: 2, h: 2, heavy: true, face: true, color: 5 },
      { id: 'A', letter: 'A', c: 1, r: 7, color: 4 },
      { id: 'S', letter: 'S', c: 2, r: 7, color: 0 },
      { id: 'C', letter: 'C', c: 3, r: 7, color: 3 },
      { id: 'N', letter: 'N', c: 4, r: 7, color: 1 },
      { id: 'U', letter: 'U', c: 0, r: 8, color: 2 },
      { id: 'F', letter: 'F', c: 1, r: 8, color: 0 },
      { id: 'G', letter: 'G', c: 6, r: 8, color: 3 },
      { id: 'D', letter: 'D', c: 4, r: 9, color: 4 },
      { id: 'E', letter: 'E', c: 6, r: 9, color: 1 },
    ],
    // one layout the level is solved at (the static solver and the validator judge the reach with the blocks here)
    blocksGoal: [[0, 8], [0, 7], [1, 7], [5, 7], [6, 7], [5, 8], [6, 8], [4, 9], [5, 9], [6, 9]],
    decor: [
      { art: 'toybox', x: 180, y: 436, w: 308, h: 132, text: 'TOYS', inert: true },
      { art: 'sunpatch', x: 150, y: 566, w: 250, h: 84, skew: 30, inert: true },
    ],
    secret: { art: 'goldblock', x: 312, y: 540, on: 'spelled', word: 'SNUG' }, // S, N, U, G side by side in a row, in order: anywhere, even for a moment
    finale: { word: 'SNUG', row: { x: 168, y: 98, pitch: 48 }, cat: { x: 296, y: 100 } }, // the Wake: the four hop out of the box to the top of the mat and spell the name over the awake room; Biscuit naps beside them
    teaser: 'needleDrop', // a needle on a record: Level 26's backstage
    caption: 'You moved a mountain. A small one.',
  });

  // ---- Level 26 "Order Up": backstage. One long strip of six sockets in a flight case's foam; five devices that LISTEN to one another.
  // Chalk arrows say who follows whom: a device wakes only when the one it follows is awake to its LEFT on the same strip (the beat
  // runs left to right along a strip). A chalk bolt says two must never be neighbours (feedback). Plug them under themselves, left to
  // right, and the two speakers howl: the spare socket is a buffer. Every plug is a cable long enough for any socket, so the Tidy star
  // needs the order of the row (no crossing): Tick, Pip, Lefty, [gap], Righty, Lumi.
  LV.push({
    id: 26, act: 3, name: 'Order Up', cls: 'puzzle', dawn: 0.45, world: 'studio', par: 5, tidy: true, settleCurl: -0.5,
    intent: 'The beat runs left to right along a strip. Plug the leaders to the left of those who follow, and keep the feuding neighbours apart.',
    strips: [{ id: 'S', x: 180, y: 536, slots: 6, pitch: 44, angle: 0, sockets: [{}, {}, {}, {}, {}, {}] }],
    devices: [
      { id: 'tick', label: 'Tick', type: 'metronome', x: 44, y: 232, color: 'mint', cable: { len: 384, curl: 1 }, plug: { key: 'mint' }, rest: { x: 100, y: 384 } },
      { id: 'pip', label: 'Pip', type: 'phone', x: 104, y: 232, color: 'coral', cable: { len: 372, curl: 1 }, plug: { key: 'coral' }, rest: { x: 144, y: 392 }, after: 'tick' },
      { id: 'lefty', label: 'Lefty', type: 'speaker', x: 164, y: 236, color: 'sky', cable: { len: 352, curl: 1 }, plug: { key: 'sky' }, rest: { x: 188, y: 384 }, after: 'pip', clash: ['righty'] },
      { id: 'righty', label: 'Righty', type: 'speaker', x: 228, y: 236, color: 'violet', cable: { len: 352, curl: 1 }, plug: { key: 'violet' }, rest: { x: 232, y: 392 }, after: 'pip', clash: ['lefty'] },
      { id: 'lumi', label: 'Lumi', type: 'lamp', x: 286, y: 232, color: 'amber', cable: { len: 384, curl: -1 }, plug: { key: 'amber' }, rest: { x: 276, y: 384 } },
    ],
    decor: [
      {
        art: 'chalkboard', x: 180, y: 106, w: 292, h: 90, r: 70, note: 'the beat runs this way',
        nodes: [
          { id: 'tick', x: -112, y: 8, label: 'TICK', color: 'mint' },
          { id: 'pip', x: -42, y: 8, label: 'PIP', color: 'coral' },
          { id: 'lefty', x: 38, y: -16, label: 'LEFTY', color: 'sky' },
          { id: 'righty', x: 38, y: 30, label: 'RIGHTY', color: 'violet' },
          { id: 'lumi', x: 112, y: 8, label: 'LUMI', color: 'amber' },
        ],
        edges: [{ a: 'tick', b: 'pip', kind: 'after' }, { a: 'pip', b: 'lefty', kind: 'after' }, { a: 'pip', b: 'righty', kind: 'after' }, { a: 'lefty', b: 'righty', kind: 'clash' }],
      },
      { art: 'flightcase', x: 180, y: 536, w: 308, h: 88, cutW: 296, cutH: 62, inert: true },
    ],
    secret: { art: 'goldpick', x: 316, y: 472, on: 'chalkboard', taps: 3 }, // smudge the chalk (three taps): a golden pick
    teaser: 'humFar', // four sockets glowing in a row, humming: Level 27
    caption: 'Count us in.',
  });

  // ---- Level 27 "First Four Notes": the strip is a sequencer. Four sockets are four beats of a loop; a light walks along them, one step
  // per beat, and whatever is plugged in plays its note when the light arrives. The room plays the tune once (and again when you ask
  // or tap the strip); each device is one instrument (a woodblock, a pluck, a bell, a celesta) and belongs on one step. Tap a device to
  // hear who is who. The sound is the clue: the colours and the places mislead on purpose (the one crossing-free arrangement is not
  // "each under itself"). A device on the wrong step sits out and the loop buzzes at it. Play it right with no wrong plug: a music-box key.
  LV.push({
    id: 27, act: 3, name: 'First Four Notes', cls: 'teach', dawn: 0.4, world: 'studio', par: 4, tidy: true, settleCurl: -0.5,
    intent: 'The strip is a sequencer: four beats. Listen to the tune, tap the devices to hear who is who, and plug each one into the step it played.',
    strips: [{ id: 'S', x: 180, y: 524, slots: 4, pitch: 60, angle: 0, seq: { bpm: 100, demoAt: 1.4 }, sockets: [{}, {}, {}, {}] }],
    devices: [
      { id: 'dot', label: 'Dot', type: 'phone', x: 266, y: 188, color: 'coral', cable: { len: 392, curl: 1 }, plug: { key: 'coral' }, rest: { x: 244, y: 290 }, seq: { step: 3, voice: 'bell', note: 79 } },
      { id: 'lux', label: 'Lux', type: 'lamp', x: 312, y: 338, color: 'amber', cable: { len: 314, curl: -1 }, plug: { key: 'amber' }, rest: { x: 304, y: 446 }, seq: { step: 4, voice: 'celesta', note: 74 } },
      { id: 'static', label: 'Static', type: 'radio', x: 100, y: 246, color: 'sky', cable: { len: 346, curl: 1 }, plug: { key: 'sky' }, rest: { x: 70, y: 332 }, seq: { step: 2, voice: 'pluck', note: 72 } },
      { id: 'tick', label: 'Tick', type: 'metronome', x: 122, y: 372, color: 'mint', cable: { len: 225, curl: -1 }, plug: { key: 'mint' }, rest: { x: 150, y: 462 }, seq: { step: 1, voice: 'wood', note: 76 } },
    ],
    decor: [
      { art: 'staff', x: 180, y: 426, w: 276, steps: [-90, -30, 30, 90], inert: true }, // the tune appears on the chalk staff as it plays
      { art: 'flightcase', x: 180, y: 524, w: 276, h: 88, cutW: 262, cutH: 62, inert: true },
    ],
    secret: { art: 'goldkey', x: 40, y: 462, on: 'perfect' }, // the tune rebuilt with no wrong plug at all: a music-box key
    teaser: 'thumpFar', // a bass drum tried through a wall: Level 28
    caption: 'You remembered it.',
  });

  // ---- Level 28 "Bass Drop": the speaker wall kicks on every beat, and a plug that is not locked in pops out on the thump. A quarter-turn
  // twist of the thumb round a seated plug closes its brass collar: a locked plug only shivers, refuses a pull, and a twist back frees it.
  // A plug has a second's grace after it seats (its collar says "twist it"); the collar flares red just before a kick. Hold a plug through
  // a thump and seat it ON the beat: a gold plug. Every arrangement is legal, so the puzzle is the hands: lock each plug before the next
  // thump finds it loose. Pops cost you the Clean star (each one is a second seat).
  LV.push({
    id: 28, act: 3, name: 'Bass Drop', cls: 'teach', dawn: 0.4, world: 'studio', par: 4, tidy: true, settleCurl: -0.25,
    intent: 'The speakers thump on every beat. Plug in, then twist the plug round to lock it, or the next thump pops it out.',
    bass: { bpm: 92, startAt: 1.8, grace: 1.1 },
    strips: [{ id: 'S', x: 180, y: 520, slots: 4, pitch: 60, angle: 0, sockets: [{}, {}, {}, {}] }],
    devices: [
      { id: 'lefty', label: 'Lefty', type: 'speaker', x: 56, y: 380, color: 'coral', cable: { len: 265, curl: 1 }, plug: { key: 'coral' }, rest: { x: 56, y: 200 } },
      { id: 'boxy', label: 'Boxy', type: 'laptop', x: 140, y: 380, color: 'mint', cable: { len: 185, curl: -1 }, plug: { key: 'mint' }, rest: { x: 140, y: 270 } },
      { id: 'righty', label: 'Righty', type: 'speaker', x: 232, y: 380, color: 'amber', cable: { len: 195, curl: 1 }, plug: { key: 'amber' }, rest: { x: 232, y: 250 } },
      { id: 'spike', label: 'Spike', type: 'drill', x: 306, y: 380, color: 'sky', cable: { len: 268, curl: -1 }, plug: { key: 'sky' }, rest: { x: 306, y: 200 } },
    ],
    decor: [{ art: 'speakerwall', x: 180, y: 110, w: 270, h: 120, inert: true }],
    secret: { art: 'goldplug', x: 326, y: 232, on: 'onbeat' }, // seated ON the beat, after being held through a thump: a gold plug
    waive: ['luck'], // the lock is a gesture and every arrangement is legal: the plan is in the hands, not the dice
    teaser: 'padsFlash', // the pads of a drum machine light up in time, far off: Level 29's groove
    caption: 'Lock it in.',
  });

  // ---- Level 29 "On the Beat": the groove. One bar of eight pads; the bright pads (1, 3, 5, 7) are the accents: the LOUD voices (kick,
  // snare, tom) belong on them, the SOFT ones (hat, bass, chord, bell) between. Pad 7 is silent by design: the rest is the pocket.
  // A voice off its pocket still sounds, but ragged (pushed or dragged a few milliseconds) and the room will not wake until the
  // groove is tight. The devices stand in the order the groove runs (left to right), so the tidy cables and the groove agree, and
  // the trap is the obvious one: fill the strip left to right and the bell lands one pad too early. Tap a device to hear it; tap the
  // silent pad ON the beat and it is a ghost hit: the pocket (a golden drumstick).
  LV.push({
    id: 29, act: 3, name: 'On the Beat', cls: 'puzzle', dawn: 0.4, world: 'studio', par: 7, tidy: true, settleCurl: -0.25,
    intent: 'One bar of eight pads. Loud voices go on the bright pads, soft ones between, and one bright pad is silent. Tap a device to hear it.',
    strips: [{ id: 'S', x: 180, y: 524, slots: 8, pitch: 38, pad: 4, angle: 0, seq: { bpm: 100, beat: 0.5, demoAt: 1.4, groove: true, rest: 7 }, sockets: [{}, {}, {}, {}, {}, {}, {}, {}] }],
    devices: [
      { id: 'kick', label: 'Kick', type: 'speaker', x: 60, y: 230, color: 'coral', cable: { len: 400, curl: 1 }, plug: { key: 'coral' }, rest: { x: 40, y: 330 }, seq: { step: 1, voice: 'kick', note: 36, vel: 1 } },
      { id: 'hat', label: 'Hat', type: 'kettle', x: 95, y: 400, color: 'mint', cable: { len: 267, curl: -1 }, plug: { key: 'mint' }, rest: { x: 40, y: 440 }, seq: { step: 2, voice: 'hat', note: 84, vel: 0.6 } },
      { id: 'snare', label: 'Snare', type: 'radio', x: 150, y: 230, color: 'amber', cable: { len: 350, curl: -1 }, plug: { key: 'amber' }, rest: { x: 146, y: 330 }, seq: { step: 3, voice: 'snare', note: 60, vel: 1 } },
      { id: 'bass', label: 'Bass', type: 'drill', x: 177, y: 400, color: 'sky', cable: { len: 179, curl: 1 }, plug: { key: 'sky' }, rest: { x: 210, y: 470 }, seq: { step: 4, voice: 'bass', note: 40, vel: 0.6 } },
      { id: 'tom', label: 'Tom', type: 'toaster', x: 240, y: 230, color: 'violet', cable: { len: 365, curl: 1 }, plug: { key: 'violet' }, rest: { x: 232, y: 326 }, seq: { step: 5, voice: 'tom', note: 50, vel: 1 } },
      { id: 'chord', label: 'Chord', type: 'tablet', x: 267, y: 400, color: 'amber', cable: { len: 263, curl: -1 }, plug: { key: 'amber' }, rest: { x: 324, y: 446 }, seq: { step: 6, voice: 'chord', note: 60, vel: 0.6 } },
      { id: 'bell', label: 'Bell', type: 'phone', x: 312, y: 230, color: 'sky', cable: { len: 405, curl: 1 }, plug: { key: 'sky' }, rest: { x: 324, y: 340 }, seq: { step: 8, voice: 'bell', note: 79, vel: 0.6 } },
    ],
    decor: [
      { art: 'flightcase', x: 180, y: 524, w: 282, h: 88, cutW: 270, cutH: 62, inert: true },
    ],
    secret: { art: 'golddrumstick', x: 28, y: 380, on: 'ghost' }, // tap the silent pad on the beat: a golden drumstick
    teaser: 'spotOn', // a stage spot comes on, far out front: Level 30
    caption: 'Right on the beat.',
  });

  // ---- Level 30 "Jam Session" (the boss): everything at once, in the order the room needs it. The CLOCK first: Tick is the downbeat
  // of the groove, and Hat, Chord and (through Hat) Bass, and (through Chord) Bell listen to him, so each waits in standby until its
  // leader is on. The GROOVE: Level 29's eight pads, one silent. The BASS: the speaker wall kicks, and every voice that is not locked
  // in pops out on the thump. The stage comes up as the band locks in, and the Wake is a finale sung by the voices themselves.
  // The trap is the order: lock the groove before the bass is locked and the pads keep popping out; build before the clock is on
  // and everything waits in standby. Find the golden microphone: tap the stage microphone three times.
  LV.push({
    id: 30, act: 3, name: 'Jam Session', cls: 'boss', dawn: 0.35, world: 'studio', par: 10, tidy: true, settleCurl: -0.25,
    intent: 'The whole show: wake the clock first, then the groove, and lock every voice before the thump finds it loose.',
    bass: { bpm: 100, startAt: 1.6, grace: 1.2 },
    boss: true,
    noTapes: true, // the band is known by ear, as on Level 29 (the bubbles still name a waiting device's leader)
    strips: [{ id: 'S', x: 180, y: 524, slots: 8, pitch: 38, pad: 4, angle: 0, seq: { bpm: 100, beat: 0.5, demoAt: 1.2, groove: true, rest: 7 }, sockets: [{}, {}, {}, {}, {}, {}, {}, {}] }],
    devices: [
      { id: 'tick', label: 'Tick', type: 'metronome', x: 60, y: 230, color: 'mint', cable: { len: 400, curl: 1 }, plug: { key: 'mint' }, rest: { x: 40, y: 340 }, seq: { step: 1, voice: 'wood', note: 76, vel: 1 } },
      { id: 'hat', label: 'Hat', type: 'kettle', x: 95, y: 400, color: 'coral', cable: { len: 267, curl: -1 }, plug: { key: 'coral' }, rest: { x: 40, y: 440 }, seq: { step: 2, voice: 'hat', note: 84, vel: 0.6 }, after: 'tick' },
      { id: 'snare', label: 'Snare', type: 'radio', x: 150, y: 230, color: 'amber', cable: { len: 350, curl: -1 }, plug: { key: 'amber' }, rest: { x: 146, y: 330 }, seq: { step: 3, voice: 'snare', note: 60, vel: 1 } },
      { id: 'bass', label: 'Bass', type: 'drill', x: 177, y: 400, color: 'sky', cable: { len: 179, curl: 1 }, plug: { key: 'sky' }, rest: { x: 210, y: 470 }, seq: { step: 4, voice: 'bass', note: 40, vel: 0.6 }, after: 'hat' },
      { id: 'tom', label: 'Tom', type: 'toaster', x: 240, y: 230, color: 'violet', cable: { len: 365, curl: 1 }, plug: { key: 'violet' }, rest: { x: 232, y: 326 }, seq: { step: 5, voice: 'tom', note: 50, vel: 1 } },
      { id: 'chord', label: 'Chord', type: 'tablet', x: 267, y: 400, color: 'amber', cable: { len: 263, curl: -1 }, plug: { key: 'amber' }, rest: { x: 324, y: 446 }, seq: { step: 6, voice: 'chord', note: 60, vel: 0.6 }, after: 'tick' },
      { id: 'bell', label: 'Bell', type: 'phone', x: 312, y: 230, color: 'sky', cable: { len: 405, curl: 1 }, plug: { key: 'sky' }, rest: { x: 324, y: 340 }, seq: { step: 8, voice: 'bell', note: 79, vel: 0.6 }, after: 'chord' },
    ],
    decor: [
      { art: 'speakerwall', x: 180, y: 96, w: 270, h: 96, inert: true },
      { art: 'spot', x: 40, y: 150, inert: true },
      { art: 'spot', x: 320, y: 150, inert: true },
      { art: 'flightcase', x: 180, y: 524, w: 282, h: 88, cutW: 270, cutH: 62, inert: true },
      { art: 'mic', x: 330, y: 588, r: 26 },
    ],
    secret: { art: 'goldmic', x: 298, y: 602, on: 'mic', taps: 3 }, // three taps on the stage microphone: the golden one
    waive: ['luck'], // a recipe: the one legal order of operations is the plan (the clock, the groove, the locks), not a dice roll
    teaser: 'stationBeep', // a space station's soft beep, far off in the dark of the Act 3 sheet
    caption: 'Same time tomorrow.',
  });
})();
