/* Snug — levels/world5.js : Act 5, the Lab & the City (levels 41–50). Pass 05 (docs/passes/pass-05-levels-41-50.md) holds the identity cards;
   this file holds the data. Levels are added one by one as each is built (toy first, then level, then bot and probe). */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const LV = (G.Levels = G.Levels || []);
  (G.Acts = G.Acts || []).push({ n: 5, name: 'The Lab & The City', from: 41, to: 50, done: 'The lab is quiet. Out past the window, the city is lit one room at a time.' });

  // ---- Level 41 "Fan Mail": a box fan blows a gust along a bench. A fence of books runs across it with one narrow slot. Let a plug go in
  // the gust and the wind carries it along the fence, through the slot, and onto the socket behind: the catch. The hand can thread the slot
  // too, but a plug held against the fence bumps it; the gust does the threading.
  LV.push({
    id: 41, act: 5, name: 'Fan Mail', cls: 'puzzle', dawn: 0.5, world: 'lab', par: 1, tidy: false, settleCurl: -0.25,
    intent: 'A fan, a gust, and a fence with one slot. Let go of the plug in the wind and let it find its own way through.',
    wind: { x0: 60, x1: 340, y0: 225, y1: 448, ax: 0, ay: -1000, catch: true },
    obstacles: [
      { shape: 'rrect', x: 143, y: 330, w: 254, h: 14, rot: 0, cr: 4, tall: true, art: 'books' }, // the fence: a row of books from the left edge, with a slot (x 270 to 310) straight under the socket
      { shape: 'rrect', x: 326, y: 330, w: 32, h: 14, rot: 0, cr: 4, tall: true, art: 'books' },
    ],
    strips: [
      { id: 'S', kind: 'grommet', x: 290, y: 250, slots: 1, pitch: 40, angle: 0, sockets: [{ key: 'coral' }] },
    ],
    devices: [
      { id: 'pip', label: 'Pip', type: 'phone', x: 300, y: 560, color: 'coral', cable: { len: 430, curl: 1 }, plug: { key: 'coral' }, rest: { x: 300, y: 470 } },
    ],
    decor: [{ art: 'boxfan', x: 70, y: 500, r: 30, inert: true }],
    waive: ['luck'], // one plug, one socket: the puzzle is the gust (let it go in the band); a random thumb does not find the slot
    secret: { art: 'goldtumbler', x: 46, y: 96, on: 'caught' }, // the gust, and nothing else, put it home: the golden tumbler
    teaser: 'whistleFar',
    caption: 'Mail call.',
  });
  // ---- Level 42 "Torchlight": the room is black. A torch's pool of light is the only way to see, and a socket the pool has touched is
  // remembered. Three sockets take a plug; three more are dummies that nothing fits. A plug let go over a socket the light has not touched is
  // turned away ("not yet"), so the torch has to go first: sweep, then plug.
  LV.push({
    id: 42, act: 5, name: 'Torchlight', cls: 'puzzle', dawn: 0.4, world: 'lab', par: 3, tidy: false, settleCurl: -0.25,
    intent: 'The room is dark. Move the torch over a socket: it is remembered. Then plug in.',
    torch: { x: 180, y: 300, r: 58 },
    strips: [
      { id: 'B', x: 180, y: 200, slots: 6, pitch: 40, angle: 0, sockets: [{ key: 'coral' }, { key: 'mint' }, { key: 'amber' }, { key: 'mint' }, { key: 'sky' }, { key: 'mint' }] },
    ],
    devices: [
      { id: 'pip', label: 'Pip', type: 'phone', x: 80, y: 540, color: 'coral', cable: { len: 450, curl: 1 }, plug: { key: 'coral' }, rest: { x: 120, y: 440 } },
      { id: 'rex', label: 'Rex', type: 'radio', x: 180, y: 540, color: 'amber', cable: { len: 430, curl: -1 }, plug: { key: 'amber' }, rest: { x: 180, y: 440 } },
      { id: 'dot', label: 'Dot', type: 'phone', x: 280, y: 540, color: 'sky', cable: { len: 430, curl: 1 }, plug: { key: 'sky' }, rest: { x: 280, y: 440 } },
    ],
    decor: [],
    waive: ['luck'], // keyed sockets make one answer; the torch is the puzzle, and a plug that is turned away is a lesson, not a dice roll
    secret: { art: 'goldtumbler', x: 46, y: 96, on: 'nofail' }, // every socket found by the light, and no plug turned away: the golden tumbler
    teaser: 'humFar',
    caption: 'Found you.',
  });
  // ---- Level 43 "Crane Game": a magnet head on a cable over the bench, and a tray. Two wooden prizes sit on two sockets (Pip's and Rex's), and
  // a third sits in the middle of the cables' way. Lift each prize with a tap, carry it to the tray, and tap again over the tray. A drop away
  // from the tray is counted: the golden hook is for lifting every prize with no drop at all.
  LV.push({
    id: 43, act: 5, name: 'Crane Game', cls: 'puzzle', dawn: 0.5, world: 'lab', par: 2, tidy: false, settleCurl: -0.25,
    intent: 'A magnet on a cable. Tap a prize to take it, and tap over the tray to let it go. Lift the ones on the sockets first.',
    crane: {
      start: { x: 180, y: 110 },
      tray: { x: 290, y: 120, w: 90, h: 60 },
      prizes: [
        { id: 'c', letter: 'C', x: 150, y: 520, w: 60, h: 40 },
        { id: 'r', letter: 'R', x: 210, y: 520, w: 50, h: 40 },
        { id: 'k', letter: 'K', x: 240, y: 380, w: 50, h: 40 },
      ],
    },
    strips: [
      { id: 'B', x: 180, y: 520, slots: 2, pitch: 60, angle: 0, sockets: [{ key: 'coral' }, { key: 'amber' }] },
    ],
    devices: [
      { id: 'pip', label: 'Pip', type: 'phone', x: 60, y: 300, color: 'coral', cable: { len: 300, curl: 1 }, plug: { key: 'coral' }, rest: { x: 100, y: 420 } },
      { id: 'rex', label: 'Rex', type: 'radio', x: 300, y: 300, color: 'amber', cable: { len: 300, curl: -1 }, plug: { key: 'amber' }, rest: { x: 300, y: 380 } },
    ],
    decor: [],
    waive: ['luck'], // keyed sockets make one answer; the order of the magnet is the puzzle, and a random thumb does not run the crane
    secret: { art: 'goldhatch', x: 46, y: 96, on: 'unbroken' }, // every prize lifted into the tray, and no drop: the golden hook
    teaser: 'whistleFar',
    caption: 'Prize!',
  });
  // ---- Level 44 "Ghost Cables": a teacup stands on the bench, between three devices and three sockets, so every direct cable runs into it and
  // has to go round. The first run has no help. Its cables are left behind, and the next attempt shows them as ghosts: a cable that follows its
  // ghost glows warm. Seat all three warm, on a second run that follows the first, and the golden teacup spoon turns up.
  LV.push({
    id: 44, act: 5, name: 'Ghost Cables', cls: 'puzzle', dawn: 0.5, world: 'lab', par: 3, tidy: false, settleCurl: -0.25, ghost: true,
    intent: 'A teacup in the way. Go round it. Then do it again: your last cables are still there, as ghosts.',
    obstacles: [{ shape: 'circle', x: 180, y: 350, r: 22, tall: true, art: 'mug' }],
    strips: [
      { id: 'K', x: 180, y: 200, slots: 3, pitch: 70, angle: 0, sockets: [{ key: 'coral' }, { key: 'amber' }, { key: 'sky' }] },
    ],
    devices: [
      { id: 'pip', label: 'Pip', type: 'phone', x: 60, y: 540, color: 'coral', cable: { len: 500, curl: 1 }, plug: { key: 'coral' }, rest: { x: 100, y: 440 } },
      { id: 'rex', label: 'Rex', type: 'radio', x: 180, y: 575, color: 'amber', cable: { len: 500, curl: -1 }, plug: { key: 'amber' }, rest: { x: 230, y: 470 } },
      { id: 'dot', label: 'Dot', type: 'phone', x: 300, y: 540, color: 'sky', cable: { len: 500, curl: 1 }, plug: { key: 'sky' }, rest: { x: 270, y: 440 } },
    ],
    decor: [],
    waive: ['luck'], // keyed sockets make one answer; the teacup is the puzzle, and a second run is the way to the secret
    secret: { art: 'goldclip', x: 300, y: 96, on: 'warm' }, // every plug seated warm: each cable on its ghost, at the moment it seats
    teaser: 'whistleFar',
    caption: 'Tea for three.',
  });
  // ---- Level 45 "Mirror, Mirror": a glass seam down the middle of the bench. Three devices on the left, and their reflections on the right. Six
  // sockets in a row, mirror to mirror; each plug is keyed to its own socket, so the answer is one. The move is the mirror: a drag of a device
  // drags its reflection across the seam, so one drag seats two plugs. A drag across the seam cracks the glass.
  LV.push({
    id: 45, act: 5, name: 'Mirror, Mirror', cls: 'puzzle', dawn: 0.5, world: 'lab', par: 6, tidy: false, settleCurl: -0.25,
    intent: 'A mirror down the middle. Whatever you do on one side, its reflection does on the other.',
    mirror: { axis: 180, pairs: [['pip', 'pip2'], ['rex', 'rex2'], ['dot', 'dot2']] },
    strips: [
      { id: 'M', x: 180, y: 200, slots: 6, pitch: 40, angle: 0, sockets: [{ key: 'coral' }, { key: 'amber' }, { key: 'sky' }, { key: 'teal' }, { key: 'lime' }, { key: 'violet' }] },
    ],
    devices: [
      { id: 'pip', label: 'Pip', type: 'phone', x: 60, y: 470, color: 'coral', cable: { len: 370, curl: -1 }, plug: { key: 'coral' }, rest: { x: 100, y: 410 } },
      { id: 'rex', label: 'Rex', type: 'radio', x: 100, y: 560, color: 'amber', cable: { len: 460, curl: -1 }, plug: { key: 'amber' }, rest: { x: 100, y: 470 } },
      { id: 'dot', label: 'Dot', type: 'phone', x: 150, y: 470, color: 'sky', cable: { len: 370, curl: 1 }, plug: { key: 'sky' }, rest: { x: 150, y: 380 } },
      { id: 'pip2', label: 'Pip', type: 'phone', x: 300, y: 470, color: 'violet', cable: { len: 370, curl: 1 }, plug: { key: 'violet' }, rest: { x: 260, y: 410 } },
      { id: 'rex2', label: 'Rex', type: 'radio', x: 260, y: 560, color: 'lime', cable: { len: 460, curl: 1 }, plug: { key: 'lime' }, rest: { x: 260, y: 470 } },
      { id: 'dot2', label: 'Dot', type: 'phone', x: 210, y: 470, color: 'teal', cable: { len: 370, curl: -1 }, plug: { key: 'teal' }, rest: { x: 210, y: 380 } },
    ],
    decor: [],
    waive: ['luck'], // every plug is keyed to its own socket: one answer; the mirror is the move, and a random drag does not seat two at once
    secret: { art: 'goldcrescent', x: 180, y: 110, on: 'crackless' }, // every pair seated, and the glass never cracked
    teaser: 'humFar',
    caption: 'Symmetry.',
  });
  // ---- Level 46 "Dollhouse" (re-carded, Pass 05 §E9): a miniature board sits in a frame at the top of the bench, with two devices of its own. The big
  // room's two sockets are locked until the miniature is whole: the lock is a rule of the house, and the small room is the way in. A plug tried on
  // a locked socket says "locked" and falls. The golden door-knocker is for opening the house with no refusal at all.
  LV.push({
    id: 46, act: 5, name: 'Dollhouse', cls: 'puzzle', dawn: 0.5, world: 'lab', par: 4, tidy: false, settleCurl: -0.25, doll: true,
    intent: 'A little house in the corner, with its own sockets. The big room is locked until the little one is whole.',
    strips: [
      { id: 'B', x: 180, y: 330, slots: 2, pitch: 150, angle: 0, doll: true, sockets: [{ key: 'coral' }, { key: 'amber' }] },
      { id: 'M', x: 180, y: 150, slots: 2, pitch: 60, angle: 0, sockets: [{ key: 'sky' }, { key: 'mint' }] },
    ],
    devices: [
      { id: 'pip', label: 'Pip', type: 'phone', x: 60, y: 540, color: 'coral', cable: { len: 470, curl: -1 }, plug: { key: 'coral' }, rest: { x: 100, y: 420 } },
      { id: 'rex', label: 'Rex', type: 'radio', x: 300, y: 540, color: 'amber', cable: { len: 470, curl: 1 }, plug: { key: 'amber' }, rest: { x: 260, y: 420 } },
      { id: 'lux', label: 'Lux', type: 'lamp', x: 60, y: 96, color: 'sky', cable: { len: 170, curl: -1 }, plug: { key: 'sky' }, rest: { x: 40, y: 240 }, mini: true },
      { id: 'gus', label: 'Gus', type: 'speaker', x: 300, y: 96, color: 'mint', cable: { len: 170, curl: 1 }, plug: { key: 'mint' }, rest: { x: 320, y: 240 }, mini: true },
    ],
    decor: [{ art: 'dollhouse', x: 180, y: 150, w: 200, h: 130, inert: true }],
    waive: ['luck'], // keyed sockets make one answer; the lock is the puzzle, and a plug tried on a locked socket is a lesson
    secret: { art: 'goldtumbler', x: 46, y: 96, on: 'nofail' }, // the house opened with no plug turned away: the golden door-knocker
    teaser: 'humFar',
    caption: 'Smaller than it looks.',
  });
  // ---- Level 47 "Rewind": a cable on a reel. Pip's cable starts short, on the drum under its port; the socket it needs is across the bench, round a
  // post. Drag the drum down to let the cable out, as far as it needs. Drag it up, and the cable winds back in, and the plug is drawn home along its
  // own route, as a tape rewinds. A cable wound all the way back before the wake earns the golden hook.
  LV.push({
    id: 47, act: 5, name: 'Rewind', cls: 'puzzle', dawn: 0.5, world: 'lab', par: 2, tidy: false, settleCurl: -0.25, reels: true,
    intent: 'Pip\'s cable is on a reel. Let it out to reach across the bench; wind it back when it is done.',
    obstacles: [{ shape: 'circle', x: 180, y: 330, r: 22, tall: true, art: 'mug' }],
    strips: [
      { id: 'T', x: 180, y: 120, slots: 2, pitch: 140, angle: 0, sockets: [{ key: 'coral' }, { key: 'sky' }] },
    ],
    devices: [
      { id: 'pip', label: 'Pip', type: 'phone', x: 60, y: 430, color: 'coral', cable: { start: 200, len: 620, reel: true, curl: -1 }, plug: { key: 'coral' }, rest: { x: 170, y: 420 } },
      { id: 'dot', label: 'Dot', type: 'phone', x: 300, y: 560, color: 'sky', cable: { len: 560, curl: 1 }, plug: { key: 'sky' }, rest: { x: 200, y: 440 } },
    ],
    decor: [],
    waive: ['luck'], // keyed sockets make one answer; the reel is the puzzle: a random drag does not let a cable out to the right length
    secret: { art: 'goldhatch', x: 46, y: 96, on: 'rewound' }, // a cable wound all the way back to its drum before the wake
    teaser: 'whistleFar',
    caption: 'Rewind.',
  });

  // ---- Level 48 "Duet With Yourself": two plugs, a teacup between them, and a red record dot in the corner. Tap the dot and drag Pip round the
  // teacup to its socket: that drag is recorded. On the next attempt a ghost hand plays Pip's drag back after a pause, while your thumb plays Dot's.
  // If Pip's ghost and Dot seat within a second of each other, it is a duet: the golden crescent.
  LV.push({
    id: 48, act: 5, name: 'Duet With Yourself', cls: 'puzzle', dawn: 0.5, world: 'lab', par: 2, tidy: false, settleCurl: -0.25, duet: true,
    intent: 'Record one part (tap the red dot, then drag). Then play the other part while your ghost plays the first.',
    obstacles: [{ shape: 'circle', x: 180, y: 330, r: 22, tall: true, art: 'mug' }],
    strips: [
      { id: 'D', x: 180, y: 120, slots: 2, pitch: 150, angle: 0, sockets: [{ key: 'sky' }, { key: 'coral' }] },
    ],
    devices: [
      { id: 'pip', label: 'Pip', type: 'phone', x: 60, y: 520, color: 'coral', cable: { len: 560, curl: -1 }, plug: { key: 'coral' }, rest: { x: 120, y: 420 } },
      { id: 'dot', label: 'Dot', type: 'phone', x: 300, y: 520, color: 'sky', cable: { len: 560, curl: 1 }, plug: { key: 'sky' }, rest: { x: 240, y: 420 } },
    ],
    decor: [],
    waive: ['luck'], // keyed sockets make one answer; the duet is the puzzle: a recorded drag and a live one, at the same time
    secret: { art: 'goldcrescent', x: 46, y: 96, on: 'duet' }, // the ghost's seat and the thumb's seat, within a second of each other
    teaser: 'whistleFar',
    caption: 'Together.',
  });

  // ---- Level 49 "Brownout" (re-carded, Pass 05 §E9): the lights go out part way through. The first seat is the last light for six seconds: the
  // bench is black except a lantern under each plug in a hand, and the seated socket's LED. The other two sockets and their devices are where
  // they were, remembered from the light. Seating works in the dark. A solve that finishes in the dark earns the golden crescent.
  LV.push({
    id: 49, act: 5, name: 'Brownout', cls: 'puzzle', dawn: 0.5, world: 'lab', par: 3, tidy: false, settleCurl: -0.25, brownout: { after: 1, secs: 6 },
    intent: 'The lights go out after your first plug. Finish from memory, before they come back.',
    strips: [
      { id: 'L', x: 180, y: 200, slots: 3, pitch: 80, angle: 0, sockets: [{ key: 'coral' }, { key: 'amber' }, { key: 'sky' }] },
    ],
    devices: [
      { id: 'pip', label: 'Pip', type: 'phone', x: 60, y: 540, color: 'coral', cable: { len: 430, curl: -1 }, plug: { key: 'coral' }, rest: { x: 60, y: 430 } },
      { id: 'rex', label: 'Rex', type: 'radio', x: 180, y: 560, color: 'amber', cable: { len: 460, curl: -1 }, plug: { key: 'amber' }, rest: { x: 180, y: 470 } },
      { id: 'dot', label: 'Dot', type: 'phone', x: 300, y: 540, color: 'sky', cable: { len: 430, curl: 1 }, plug: { key: 'sky' }, rest: { x: 300, y: 430 } },
    ],
    decor: [],
    waive: ['luck'], // keyed sockets make one answer; the dark is the puzzle, and a random thumb does not finish a solve from memory
    secret: { art: 'goldcrescent', x: 300, y: 110, on: 'dark' }, // the solve finished while the lights were out: the golden crescent
    teaser: 'humFar',
    caption: 'Power cut.',
  });
  // ---- Level 50 "Blackout" (finale): the city at night, and a house at its foot. Five towers (sockets) across the skyline, five lamps in the house
  // (devices). Each lamp's power line goes to its own tower, and the lines must not cross: the skyline's windows light for every room you have
  // solved so far (read from the save). Light every tower with no crossing, and the golden door of the house opens.
  LV.push({
    id: 50, act: 5, name: 'Blackout', cls: 'puzzle', dawn: 0.5, world: 'lab', par: 5, tidy: true, settleCurl: -0.25,
    intent: 'The city is dark. Run one power line from each lamp in the house to its tower, and let no two lines cross.',
    skyline: true,
    decor: [{ art: 'skyline', x: 180, y: 330, w: 320, h: 270, inert: true }],
    strips: [
      { id: 'T', x: 180, y: 130, slots: 5, pitch: 60, angle: 0, sockets: [{ key: 'coral' }, { key: 'amber' }, { key: 'sky' }, { key: 'mint' }, { key: 'violet' }] },
    ],
    devices: [
      { id: 'l1', label: 'Lamp', type: 'lamp', x: 60, y: 560, color: 'coral', cable: { len: 540, curl: -1 }, plug: { key: 'coral' }, rest: { x: 95, y: 470 } },
      { id: 'l2', label: 'Lamp', type: 'lamp', x: 120, y: 560, color: 'amber', cable: { len: 540, curl: -1 }, plug: { key: 'amber' }, rest: { x: 120, y: 470 } },
      { id: 'l3', label: 'Lamp', type: 'lamp', x: 180, y: 560, color: 'sky', cable: { len: 540, curl: -1 }, plug: { key: 'sky' }, rest: { x: 180, y: 470 } },
      { id: 'l4', label: 'Lamp', type: 'lamp', x: 240, y: 560, color: 'mint', cable: { len: 540, curl: -1 }, plug: { key: 'mint' }, rest: { x: 240, y: 470 } },
      { id: 'l5', label: 'Lamp', type: 'lamp', x: 300, y: 560, color: 'violet', cable: { len: 540, curl: 1 }, plug: { key: 'violet' }, rest: { x: 265, y: 470 } },
    ],
    waive: ['luck'], // keyed towers make one answer; the lines must not cross, and a random thumb does not run five lines without crossing
    secret: { art: 'goldtumbler', x: 180, y: 600, on: 'tidy' }, // every tower lit with no line crossing another: the golden door of the house
    teaser: 'humFar',
    caption: 'Good night, house.',
  });
})();
