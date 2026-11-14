/* Snug — levels/world1.js : Act 1, The Desk (levels 1–10). See docs/passes/pass-01-levels-01-10.md.
   Stage 360x640 u, y down. Strips default to facing north (plugs arrive from the devices' side).
   Authoring notes:
     dir  = degrees from straight-down for the resting plug's offset from the port, frac = fraction of cable length
     keys: coral amber mint sky violet | any (joker)      size: slim | fat */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const LV = (G.Levels = G.Levels || []);
  (G.Acts = G.Acts || []).push({ n: 1, name: 'The Desk', from: 1, to: 10, done: 'The desk is awake. Something furry noticed.' });

  const strip = (id, x, y, n, keys, o) => {
    const sockets = [];
    for (let i = 0; i < n; i++) {
      const k = keys ? keys[i] : 'any';
      sockets.push(k === 'x' ? { key: 'any', dead: true } : { key: k || 'any' });
    }
    return Object.assign({ id, x, y, slots: n, pitch: 40, angle: 0, sockets }, o || {});
  };
  const grommet = (id, x, y, key) => ({ id, kind: 'grommet', x, y, slots: 1, pitch: 40, angle: 0, sockets: [{ key: key || 'any' }] });

  /* ---------------------------------------------------------------- 1 */
  LV.push({
    id: 1, act: 1, name: 'Hello, Pip', cls: 'intro', dawn: 0.05, par: 1,
    intent: 'Learn the verb: grab, drag, seat.',
    strips: [grommet('G', 180, 440)],
    devices: [{ id: 'pip', type: 'phone', x: 180, y: 150, color: 'mint', cable: { len: 280, curl: 1 }, plug: { key: 'any' }, dir: -16, frac: 0.62 }],
    decor: [{ art: 'lamp', x: 302, y: 96 }, { art: 'mug', x: 292, y: 330 }, { art: 'plant', x: 54, y: 556 }],
    secret: { art: 'sock', x: 40, y: 584, on: 'plant' },
    caption: 'Pip woke up first. As always.',
  });

  /* ---------------------------------------------------------------- 2 */
  LV.push({
    id: 2, act: 1, name: 'Duet', cls: 'intro', dawn: 0.12, par: 2, tidy: true,
    intent: 'Two devices, a rising chime, and the whisper of tidy.',
    strips: [strip('A', 180, 460, 2)],
    devices: [
      { id: 'a', type: 'phone', x: 104, y: 150, color: 'coral', cable: { len: 320, curl: -1 }, plug: { key: 'any' }, rest: { x: 119, y: 407 } },
      { id: 'b', type: 'phone', x: 256, y: 150, color: 'sky', cable: { len: 320, curl: -1 }, plug: { key: 'any' }, rest: { x: 275, y: 474 } },
    ],
    decor: [{ art: 'notebook', x: 296, y: 540 }, { art: 'mug', x: 64, y: 546 }],
    secret: { art: 'doodle', x: 296, y: 540, on: 'notebook' },
    caption: 'A duet for two phones and one very patient strip.',
  });

  /* ---------------------------------------------------------------- 3 */
  LV.push({
    id: 3, act: 1, name: 'Short Leash', cls: 'teach', dawn: 0.2, par: 3,
    intent: 'Reach: do the shortest cable first.',
    strips: [grommet('N', 100, 330), grommet('M', 200, 430), grommet('F', 300, 530)],
    devices: [
      { id: 'a', type: 'phone', x: 60, y: 130, color: 'coral', cable: { len: 172, curl: -1 }, plug: { key: 'any' }, rest: { x: 50, y: 325 } },
      { id: 'b', type: 'phone', x: 180, y: 130, color: 'sky', cable: { len: 275, curl: -1 }, plug: { key: 'any' }, rest: { x: 180, y: 382 } },
      { id: 'c', type: 'phone', x: 300, y: 130, color: 'mint', cable: { len: 385, curl: -1 }, plug: { key: 'any' }, rest: { x: 185, y: 491 } },
    ],
    decor: [{ art: 'plant', x: 54, y: 520, ladybird: true }],
    secret: { art: 'ladybird', x: 54, y: 520, on: 'plant' },
    caption: 'Short cable, long story.',
  });

  /* ---------------------------------------------------------------- 4 */
  LV.push({
    id: 4, act: 1, name: 'Colour Code', cls: 'teach', dawn: 0.3, par: 5, tidy: true,
    waive: ['ambiguousReach', 'luck'],
    intent: 'Keys: save the joker for the plug with no other home.',
    strips: [strip('A', 180, 450, 5, ['coral', 'sky', 'mint', 'amber', 'any'])],
    devices: [
      { id: 'a', type: 'phone', x: 45, y: 130, color: 'coral', cable: { len: 305, curl: -1 }, plug: { key: 'coral' }, rest: { x: 60, y: 395 } },
      { id: 'b', type: 'phone', x: 112, y: 130, color: 'sky', cable: { len: 300, curl: -1 }, plug: { key: 'sky' }, rest: { x: 127, y: 391 } },
      { id: 'c', type: 'phone', x: 180, y: 130, color: 'mint', cable: { len: 300, curl: -1 }, plug: { key: 'mint' }, rest: { x: 180, y: 392 } },
      { id: 'd', type: 'phone', x: 248, y: 130, color: 'amber', cable: { len: 300, curl: -1 }, plug: { key: 'amber' }, rest: { x: 233, y: 391 } },
      { id: 'e', type: 'phone', x: 315, y: 130, color: 'coral', cable: { len: 305, curl: 1 }, plug: { key: 'coral' }, rest: { x: 314, y: 382 } },
    ],
    decor: [{ art: 'stickies', x: 306, y: 546 }, { art: 'mug', x: 60, y: 546 }],
    secret: { art: 'button', x: 60, y: 546, on: 'mug' },
    caption: 'Everyone found their color.',
  });

  /* ---------------------------------------------------------------- 5 */
  LV.push({
    id: 5, act: 1, name: 'Flip It', cls: 'breather', dawn: 0.4, par: 5, tidy: true,
    waive: ['ambiguousReach'],
    intent: 'Switch: plug first, then flip for the cascade.',
    strips: [strip('A', 170, 460, 5, null, { switch: { on: false } })],
    devices: [
      { id: 'a', type: 'phone', x: 40, y: 130, color: 'coral', cable: { len: 315, curl: -1 }, plug: { key: 'any' }, rest: { x: 56, y: 402 } },
      { id: 'b', type: 'phone', x: 108, y: 130, color: 'sky', cable: { len: 310, curl: -1 }, plug: { key: 'any' }, rest: { x: 108, y: 399 } },
      { id: 'c', type: 'tablet', x: 180, y: 136, color: 'violet', cable: { len: 295, curl: -1 }, plug: { key: 'any' }, rest: { x: 180, y: 400 } },
      { id: 'd', type: 'phone', x: 252, y: 130, color: 'mint', cable: { len: 315, curl: -1 }, plug: { key: 'any' }, rest: { x: 236, y: 402 } },
      { id: 'e', type: 'lamp', x: 320, y: 134, color: 'amber', cable: { len: 315, curl: 1 }, plug: { key: 'any' }, rest: { x: 314, y: 392 } },
    ],
    decor: [{ art: 'clock', x: 308, y: 548 }],
    secret: { art: 'sticker', x: 308, y: 548, on: 'clock' },
    caption: 'Plug everything. Then, flip.',
  });

  /* ---------------------------------------------------------------- 6 */
  // Found by tools/search-level.js (seed 31, candidate #1): unique solution, tidy, clean reach gaps.
  // The book makes a→S3 and b→S2 *look* reachable by straight line but too long by route.
  LV.push({
    id: 6, act: 1, name: 'Read the Room', cls: 'teach', dawn: 0.5, par: 3, tidy: true,
    settleCurl: -1,
    intent: 'Obstacles: measure the route, not the distance.',
    obstacles: [{ id: 'book', art: 'books', shape: 'rrect', x: 175, y: 280, w: 200, h: 44, rot: 0, cr: 10, tall: true }],
    strips: [grommet('S1', 135, 385), grommet('S2', 210, 480), grommet('S3', 245, 355)],
    devices: [
      { id: 'a', type: 'phone', x: 60, y: 120, color: 'coral', cable: { len: 270, curl: 1 }, plug: { key: 'any' }, rest: { x: 151, y: 338 } },
      { id: 'b', type: 'phone', x: 180, y: 120, color: 'sky', cable: { len: 325, curl: -1 }, plug: { key: 'any' }, rest: { x: 235, y: 423 } },
      { id: 'c', type: 'phone', x: 300, y: 120, color: 'mint', cable: { len: 370, curl: 1 }, plug: { key: 'any' }, rest: { x: 332, y: 349 } },
    ],
    decor: [{ art: 'mug', x: 306, y: 470, steam: true }],
    secret: { art: 'note', x: 306, y: 470, on: 'mug' },
    caption: 'The book was not moved. The book will never be moved.',
  });

  /* ---------------------------------------------------------------- 7 */
  LV.push({
    id: 7, act: 1, name: 'Fat Bricks', cls: 'puzzle', dawn: 0.6, par: 4,
    waive: ['ambiguousReach'],
    intent: 'Footprints: a brick covers its neighbors, so it belongs at an end.',
    strips: [strip('A', 180, 470, 6)],
    devices: [
      { id: 'boxy', type: 'laptop', x: 72, y: 140, color: 'sky', cable: { len: 315, curl: -1 }, plug: { key: 'any', size: 'fat' }, rest: { x: 72, y: 410 } },
      { id: 'pipa', type: 'phone', x: 164, y: 130, color: 'coral', cable: { len: 320, curl: -1 }, plug: { key: 'any' }, rest: { x: 164, y: 416 } },
      { id: 'pipb', type: 'phone', x: 226, y: 130, color: 'mint', cable: { len: 320, curl: -1 }, plug: { key: 'any' }, rest: { x: 226, y: 416 } },
      { id: 'gus', type: 'console', x: 300, y: 140, color: 'violet', cable: { len: 330, curl: 1 }, plug: { key: 'any', size: 'fat' }, rest: { x: 306, y: 402 } },
    ],
    decor: [{ art: 'pencils', x: 306, y: 548 }],
    secret: { art: 'usb', x: 306, y: 548, on: 'pencils' },
    caption: 'Bricks: they go at the ends.',
  });

  /* ---------------------------------------------------------------- 8 */
  LV.push({
    id: 8, act: 1, name: 'Burnt Out', cls: 'story', dawn: 0.7, par: 4,
    waive: ['ambiguousReach'],
    intent: 'Power Cut: re-plan around the socket that just died; a brick can park on it.',
    script: { type: 'burnout', strip: 'A', at: 3, deadAfter: ['A.3'] },
    strips: [strip('A', 180, 470, 6)],
    devices: [
      { id: 'boxy', type: 'laptop', x: 80, y: 140, color: 'sky', cable: { len: 310, curl: -1 }, plug: { key: 'any', size: 'fat' }, rest: { x: 80, y: 416 } },
      { id: 'pipa', type: 'phone', x: 168, y: 130, color: 'coral', cable: { len: 320, curl: -1 }, plug: { key: 'any' }, rest: { x: 168, y: 416 } },
      { id: 'pipb', type: 'phone', x: 232, y: 130, color: 'mint', cable: { len: 320, curl: -1 }, plug: { key: 'any' }, rest: { x: 232, y: 416 } },
      { id: 'pipc', type: 'phone', x: 296, y: 130, color: 'amber', cable: { len: 325, curl: 1 }, plug: { key: 'any' }, rest: { x: 302, y: 402 } },
    ],
    decor: [{ art: 'cattail', x: 346, y: 300, showAfterScript: true }],
    secret: { art: 'cattail', x: 350, y: 300, on: 'cattail' },
    caption: 'Something burned out. Something else lit up.',
  });

  /* ---------------------------------------------------------------- 9 */
  LV.push({
    id: 9, act: 1, name: 'Tidy Up', cls: 'puzzle', dawn: 0.8, par: 5, tidy: true,
    waive: ['ambiguousReach'],
    intent: 'Tangle: a free socket is a workspace for sorting.',
    settleCurl: -1,
    rules: { noCross: true },
    strips: [strip('A', 150, 470, 6, null, { switch: { on: false } })],
    start: { seat: { p1: 'A.4', p2: 'A.6', p3: 'A.5', p4: 'A.2', p5: 'A.3' } },
    devices: [
      { id: 'p1', type: 'phone', x: 62, y: 130, color: 'coral', cable: { len: 340, curl: -1 }, plug: { key: 'any' }, rest: { x: 62, y: 411 } },
      { id: 'p2', type: 'phone', x: 121, y: 130, color: 'sky', cable: { len: 340, curl: -1 }, plug: { key: 'any' }, rest: { x: 105, y: 410 } },
      { id: 'p3', type: 'phone', x: 180, y: 130, color: 'mint', cable: { len: 340, curl: -1 }, plug: { key: 'any' }, rest: { x: 164, y: 410 } },
      { id: 'p4', type: 'phone', x: 239, y: 130, color: 'amber', cable: { len: 340, curl: -1 }, plug: { key: 'any' }, rest: { x: 223, y: 410 } },
      { id: 'p5', type: 'phone', x: 298, y: 130, color: 'violet', cable: { len: 340, curl: 1 }, plug: { key: 'any' }, rest: { x: 92, y: 347 } },
    ],
    decor: [{ art: 'washi', x: 306, y: 556 }],
    secret: { art: 'goldplug', x: 306, y: 556, on: 'washi' },
    caption: 'Untangled. Smug. Justified.',
  });

  /* ---------------------------------------------------------------- 10 */
  // Found by tools/search-level.js (seed 43, candidate #1): the console's short cable pins it to strip B, the
  // laptop and phones sort themselves out around the sooty socket on strip A, and the switch comes last.
  LV.push({
    id: 10, act: 1, name: 'Morning Rush', cls: 'boss', dawn: 1.0, par: 5,
    intent: 'Solve the room in layers: bricks, keys, reach, flip.',
    finale: 'rex',
    waive: ['ambiguousReach'],
    obstacles: [{ id: 'mug', art: 'mug', shape: 'circle', x: 70, y: 395, r: 27, tall: true }],
    strips: [
      { id: 'A', x: 128, y: 478, slots: 5, pitch: 40, angle: 0, sockets: [{ key: 'any' }, { key: 'any', dead: true }, { key: 'any' }, { key: 'any' }, { key: 'any' }] },
      { id: 'B', x: 196, y: 352, slots: 3, pitch: 40, angle: 0, sockets: [{ key: 'any' }, { key: 'sky' }, { key: 'coral' }], switch: { on: false } },
    ],
    devices: [
      { id: 'boxy', type: 'laptop', x: 64, y: 116, color: 'sky', cable: { len: 390, curl: 1 }, plug: { key: 'any', size: 'fat' }, rest: { x: 250, y: 415 } },
      { id: 'pipa', type: 'phone', x: 150, y: 122, color: 'coral', cable: { len: 375, curl: -1 }, plug: { key: 'coral', size: 'slim' }, rest: { x: 51, y: 331 } },
      { id: 'pipb', type: 'phone', x: 214, y: 122, color: 'sky', cable: { len: 215, curl: -1 }, plug: { key: 'sky', size: 'slim' }, rest: { x: 177, y: 298 } },
      { id: 'gus', type: 'console', x: 298, y: 126, color: 'violet', cable: { len: 275, curl: -1 }, plug: { key: 'any', size: 'fat' }, rest: { x: 222, y: 300 } },
      { id: 'lumi', type: 'lamp', x: 320, y: 246, color: 'amber', cable: { len: 375, curl: -1 }, plug: { key: 'any', size: 'slim' }, rest: { x: 167, y: 580 } },
    ],
    decor: [{ art: 'plant', x: 300, y: 556 }, { art: 'clock', x: 40, y: 560 }, { art: 'pencils', x: 322, y: 392 }],
    secret: { art: 'goldplug', x: 322, y: 392, on: 'pencils' },
    caption: 'Rex has opinions about jazz.',
  });
})();
