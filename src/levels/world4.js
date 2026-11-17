/* Snug — levels/world4.js : Act 4, The Space Station & The Wall (levels 31–40). Pass 04 (docs/passes/pass-04-levels-31-40.md) holds the
   identity cards; this file holds the data. Levels are added one by one as each is built (toy first, then level, then bot and probe). */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const LV = (G.Levels = G.Levels || []);
  (G.Acts = G.Acts || []).push({ n: 4, name: 'Space Station & The Wall', from: 31, to: 40, done: 'The station is awake, and the Earth is in the window. Something is still falling, very slowly.' });

  // ---- Level 31 "Float": the station has no floor. A flicked plug drifts on; its cable is a tether that brings it back when taut; a slow
  // plug that passes a free socket is caught by the socket's magnet and docks; a fast one flies past. Every socket is keyed to one device,
  // so the arrangement is one answer and the question is the flick. Tap the porthole three times for the golden tumbler.
  LV.push({
    id: 31, act: 4, name: 'Float', cls: 'teach', dawn: 0.45, world: 'station', par: 4, tidy: true, settleCurl: -0.25,
    intent: 'Nothing is heavy here. Flick a plug and let it drift: the cable brings it back, and a socket slow enough catches it.',
    strips: [
      { id: 'G1', kind: 'grommet', x: 80, y: 190, slots: 1, pitch: 40, angle: 0, sockets: [{ key: 'coral' }] },
      { id: 'G2', kind: 'grommet', x: 280, y: 190, slots: 1, pitch: 40, angle: 0, sockets: [{ key: 'amber' }] },
      { id: 'G3', kind: 'grommet', x: 80, y: 430, slots: 1, pitch: 40, angle: 0, sockets: [{ key: 'sky' }] },
      { id: 'G4', kind: 'grommet', x: 280, y: 430, slots: 1, pitch: 40, angle: 0, sockets: [{ key: 'mint' }] },
    ],
    devices: [
      { id: 'pip', label: 'Pip', type: 'phone', x: 130, y: 270, color: 'coral', cable: { len: 300, curl: 1 }, plug: { key: 'coral' }, rest: { x: 60, y: 300 } },
      { id: 'rex', label: 'Rex', type: 'radio', x: 230, y: 270, color: 'amber', cable: { len: 300, curl: -1 }, plug: { key: 'amber' }, rest: { x: 290, y: 320 } },
      { id: 'lumi', label: 'Lumi', type: 'lamp', x: 130, y: 370, color: 'sky', cable: { len: 300, curl: 1 }, plug: { key: 'sky' }, rest: { x: 50, y: 360 } },
      { id: 'sleepy', label: 'Big Sleepy', type: 'tablet', x: 215, y: 370, color: 'mint', cable: { len: 300, curl: -1 }, plug: { key: 'mint' }, rest: { x: 230, y: 470 } },
    ],
    decor: [{ art: 'window', x: 180, y: 110, r: 46, inert: false }],
    waive: ['luck'], // a flick is a plan, and the physics is the puzzle: the keys already make the arrangement one answer
    secret: { art: 'goldtumbler', x: 300, y: 520, on: 'window', taps: 3 }, // three taps on the porthole: a golden tumbler, floating
    teaser: 'stationBeep', // the station's beep, far off, as the room settles
    caption: 'Nothing is heavy here.',
  });
  // ---- Level 32 "Docking": four hatches on the hull, each a timed socket whose notch turns round its ring at its own speed. A plug
  // seats only while its hatch is open (the notch covers the keyhole at the top). Released a little before the opening, it waits for it
  // (the grace); released well before, the hatch turns it away with a soft "not yet". Dock all four with no plug turned away: a golden hatch.
  LV.push({
    id: 32, act: 4, name: 'Docking', cls: 'puzzle', dawn: 0.5, world: 'station', par: 4, tidy: true, settleCurl: -0.25,
    intent: 'Each hatch opens when its notch comes round to the keyhole. Let the plug arrive as the notch does.',
    strips: [
      { id: 'H', x: 180, y: 500, slots: 4, pitch: 60, angle: 0, sockets: [
        { key: 'coral', timer: { period: 3.0, on: 0.9, phase: 0.0, hatch: true } },
        { key: 'amber', timer: { period: 3.6, on: 0.9, phase: 1.1, hatch: true } },
        { key: 'sky', timer: { period: 4.2, on: 0.9, phase: 2.0, hatch: true } },
        { key: 'mint', timer: { period: 4.8, on: 0.9, phase: 0.4, hatch: true } },
      ] },
    ],
    devices: [
      { id: 'pip', label: 'Pip', type: 'phone', x: 70, y: 230, color: 'coral', cable: { len: 300, curl: 1 }, plug: { key: 'coral' }, rest: { x: 50, y: 320 } },
      { id: 'rex', label: 'Rex', type: 'radio', x: 150, y: 330, color: 'amber', cable: { len: 300, curl: -1 }, plug: { key: 'amber' }, rest: { x: 150, y: 440 } },
      { id: 'lumi', label: 'Lumi', type: 'lamp', x: 220, y: 230, color: 'sky', cable: { len: 300, curl: 1 }, plug: { key: 'sky' }, rest: { x: 300, y: 250 } },
      { id: 'sleepy', label: 'Big Sleepy', type: 'tablet', x: 290, y: 330, color: 'mint', cable: { len: 300, curl: -1 }, plug: { key: 'mint' }, rest: { x: 335, y: 420 } },
    ],
    decor: [{ art: 'clock', x: 318, y: 118, inert: true }],
    waive: ['luck'], // a timing window is a plan of when to let go, not a dice roll: the keys already make the arrangement one answer
    secret: { art: 'goldhatch', x: 300, y: 560, on: 'docking' }, // all four hatches docked, and no plug turned away at any of them
    teaser: 'stationBeep', // a second ring, turning in the dark (a station beep, far off)
    caption: 'Right on time.',
  });
  // ---- Level 33 "Stretch": the cable is a rubber band. Pull a plug away from its device and let go: it is slung back through the device's
  // port, and while you hold it the arc it will fly is drawn (the same flight the plug makes, cable and all). A slung plug that docks
  // is the secret: the golden squeak. Each plug has one socket (keyed), so the arrangement is one answer; the sling is the way to make it.
  LV.push({
    id: 33, act: 4, name: 'Stretch', cls: 'teach', dawn: 0.5, world: 'station', par: 2, tidy: true, settleCurl: -0.25, sling: true,
    intent: 'The cable is a rubber band. Pull a plug away and let go: it is slung back through its device, and the arc is drawn while you hold it.',
    strips: [
      { id: 'G1', kind: 'grommet', x: 300, y: 230, slots: 1, pitch: 40, angle: 0, sockets: [{ key: 'coral' }] },
      { id: 'G2', kind: 'grommet', x: 300, y: 400, slots: 1, pitch: 40, angle: 0, sockets: [{ key: 'amber' }] },
    ],
    devices: [
      { id: 'squeak', label: 'Squeak', type: 'console', x: 180, y: 280, color: 'coral', cable: { len: 300, curl: 1 }, plug: { key: 'coral' }, rest: { x: 120, y: 340 } },
      { id: 'pip', label: 'Pip', type: 'phone', x: 180, y: 470, color: 'amber', cable: { len: 300, curl: -1 }, plug: { key: 'amber' }, rest: { x: 110, y: 470 } },
    ],
    decor: [],
    waive: ['luck'], // two keyed sockets make one answer; the puzzle is how to pull, not which plug goes where
    secret: { art: 'goldtumbler', x: 300, y: 540, on: 'sling' }, // a slung plug that docks: the golden squeak (the tumbler stands in until its art is drawn)
    teaser: 'stationBeep',
    caption: 'Boing.',
  });
  // ---- Level 34 "Magnet Moon": metal pulls. Three paperclips lie on the table. A plug let go within a clip's reach sticks to it, and
  // powers nothing (a clip is not a socket: the lamp stays dark and the caption asks if that is a socket). A firm pull peels it off.
  // The rail's four holes are the only sockets; each one is keyed to one device, so the arrangement is one answer, and the clips are the trap.
  // Peel each clip off at least once before the Wake: a golden clip.
  LV.push({
    id: 34, act: 4, name: 'Magnet Moon', cls: 'teach', dawn: 0.5, world: 'steel', par: 4, tidy: true, settleCurl: -0.25,
    intent: 'Metal pulls. A paperclip holds a plug the way a socket does, and powers nothing. Pull firmly to peel it off.',
    strips: [
      { id: 'R', x: 180, y: 520, slots: 4, pitch: 60, angle: 0, sockets: [{ key: 'coral' }, { key: 'amber' }, { key: 'sky' }, { key: 'mint' }] },
    ],
    devices: [
      { id: 'pip', label: 'Pip', type: 'phone', x: 70, y: 230, color: 'coral', cable: { len: 330, curl: 1 }, plug: { key: 'coral' }, rest: { x: 40, y: 320 } },
      { id: 'rex', label: 'Rex', type: 'radio', x: 150, y: 340, color: 'amber', cable: { len: 330, curl: -1 }, plug: { key: 'amber' }, rest: { x: 150, y: 440 } },
      { id: 'lumi', label: 'Lumi', type: 'lamp', x: 220, y: 230, color: 'sky', cable: { len: 330, curl: 1 }, plug: { key: 'sky' }, rest: { x: 300, y: 250 } },
      { id: 'sleepy', label: 'Big Sleepy', type: 'tablet', x: 290, y: 340, color: 'mint', cable: { len: 330, curl: -1 }, plug: { key: 'mint' }, rest: { x: 335, y: 430 } },
    ],
    decoys: [
      { id: 'c1', x: 120, y: 290, r: 13 },
      { id: 'c2', x: 215, y: 400, r: 13 },
      { id: 'c3', x: 100, y: 470, r: 13 },
    ],
    decor: [],
    waive: ['luck'], // the keys make one answer; the clips are the trap, not the arrangement
    secret: { art: 'goldclip', x: 300, y: 580, on: 'clips' }, // every clip peeled off at least once: the golden clip
    teaser: 'stationBeep', // a compass needle swinging, far off
    caption: 'Stuck on you.',
  });
  // ---- Level 35 "Orbital Repair" (the set piece): eight devices, one ring of bays, and a cascade. Each device listens to the one it
  // follows (Level 26's chain): Tick is the clock, and each wake lights the next. The planet rises behind the porthole as the ring
  // comes up. A cascade that never goes dark (nothing put back on standby once awake) is the secret: the golden crescent.
  LV.push({
    id: 35, act: 4, name: 'Orbital Repair', cls: 'puzzle', dawn: 0.5, world: 'station', par: 8, tidy: true, settleCurl: -0.25, orbital: true,
    intent: 'Wake the station in order. Each bay wakes the next; the planet comes up over the window as the ring lights.',
    strips: [
      { id: 'O', x: 180, y: 520, slots: 8, pitch: 38, pad: 4, angle: 0, sockets: [{ key: 'mint' }, { key: 'coral' }, { key: 'amber' }, { key: 'violet' }, { key: 'rose' }, { key: 'sky' }, { key: 'lime' }, { key: 'teal' }] },
    ],
    devices: [
      { id: 'tick', label: 'Tick', type: 'metronome', x: 56, y: 215, color: 'mint', cable: { len: 294, curl: 1 }, plug: { key: 'mint' }, rest: { x: 233, y: 438 } },
      { id: 'pip', label: 'Pip', type: 'phone', x: 80, y: 350, color: 'coral', cable: { len: 141, curl: -1 }, plug: { key: 'coral' }, rest: { x: 132, y: 463 }, after: 'tick' },
      { id: 'rex', label: 'Rex', type: 'radio', x: 146, y: 215, color: 'amber', cable: { len: 316, curl: 1 }, plug: { key: 'amber' }, rest: { x: 282, y: 111 }, after: 'pip' },
      { id: 'bs', label: 'Big Sleepy', type: 'tablet', x: 160, y: 350, color: 'violet', cable: { len: 134, curl: -1 }, plug: { key: 'violet' }, rest: { x: 193, y: 475 }, after: 'tick' },
      { id: 'kettle', label: 'Kettle', type: 'kettle', x: 236, y: 350, color: 'amber', cable: { len: 159, curl: 1 }, plug: { key: 'rose' }, rest: { x: 326, y: 418 }, after: 'bs' },
      { id: 'lumi', label: 'Lumi', type: 'lamp', x: 250, y: 215, color: 'sky', cable: { len: 294, curl: -1 }, plug: { key: 'sky' }, rest: { x: 146, y: 118 }, after: 'rex' },
      { id: 'gus', label: 'Gus', type: 'speaker', x: 308, y: 350, color: 'sky', cable: { len: 155, curl: 1 }, plug: { key: 'lime' }, rest: { x: 221, y: 420 }, after: 'lumi' },
      { id: 'squeak', label: 'Squeak', type: 'phone', x: 316, y: 215, color: 'violet', cable: { len: 294, curl: -1 }, plug: { key: 'teal' }, rest: { x: 322, y: 85 }, after: 'kettle' },
    ],
    decor: [{ art: 'earthwin', x: 180, y: 80, r: 30, inert: true }],
    waive: ['luck'], // the chain fixes the order of waking; the cascade is a plan, not a dice roll
    secret: { art: 'goldcrescent', x: 300, y: 580, on: 'cascade' }, // a cascade that never went dark
    teaser: 'humFar', // the station's own radio, faint, as the Earth finishes rising
    caption: 'Good morning, Earth.',
  });
  // ---- Level 36 "Hang Time": gravity is back. The plugs are heavy and the cables hang: lift each plug up the wall to its socket. The cutaway
  // (top right) is a schematic of heights: each plug's height against its socket. The sockets stay left of the panel.
  LV.push({
    id: 36, act: 4, name: 'Hang Time', cls: 'puzzle', dawn: 0.5, world: 'wall', par: 3, tidy: true, settleCurl: -0.25, inset: true,
    intent: 'Gravity is back: the plugs hang. Lift each one up the wall to its socket; the panel shows how high it is.',
    strips: [
      { id: 'W', x: 150, y: 120, slots: 3, pitch: 60, angle: 0, sockets: [{ key: 'coral' }, { key: 'amber' }, { key: 'sky' }] },
    ],
    devices: [
      { id: 'gus', label: 'Gus', type: 'speaker', x: 70, y: 500, color: 'coral', cable: { len: 490, curl: 1 }, plug: { key: 'coral' }, rest: { x: 60, y: 420 } },
      { id: 'pip', label: 'Pip', type: 'phone', x: 175, y: 500, color: 'amber', cable: { len: 540, curl: 1 }, plug: { key: 'amber' }, rest: { x: 175, y: 430 } },
      { id: 'dot', label: 'Dot', type: 'phone', x: 280, y: 500, color: 'sky', cable: { len: 500, curl: -1 }, plug: { key: 'sky' }, rest: { x: 280, y: 420 } },
    ],
    obstacles: [{ shape: 'rrect', x: 180, y: 600, w: 300, h: 10, rot: 0, cr: 4, tall: true, art: 'rackwall' }], // the floor: a heavy plug lies on it
    decor: [],
    waive: ['luck'], // keyed sockets make one answer; the lift is the puzzle, and a random thumb does not lift a plug straight
    secret: { art: 'goldpendulum', x: 46, y: 96, on: 'tidy' }, // a golden hook: every plug lifted and seated with its cable straight
    teaser: 'thumpFar',
    caption: 'Up you go.',
  });
  // ---- Level 37 "Swing & Plug": a carriage hangs from a high pivot on a rope, and its three sockets ride the swing. Each socket
  // opens twice a period, as the carriage passes beneath the pivot, for 0.8 s. Hold a plug to its socket and let go as the socket
  // comes past; let go high on the arc and the socket has gone shut, so the plug falls. The keys make one answer; the swing is the
  // puzzle. Seat all three inside one period: the golden pendulum.
  LV.push({
    id: 37, act: 4, name: 'Swing & Plug', cls: 'puzzle', dawn: 0.5, world: 'station', par: 3, tidy: false, settleCurl: -0.25, // Tidy is not promised: a 300 u cable over a short drop slacks into loops that settle differently at each seating (the real-drag bot crossed in one run of five, and the swing does not cause it)
    intent: 'The sockets swing. Each one opens for a moment at the bottom of the arc: let go as it comes past.',
    strips: [
      {
        id: 'Choo', x: 180, y: 440, slots: 3, pitch: 40, angle: 0,
        sockets: [
          { key: 'coral', timer: { period: 2.6, on: 0.8, phase: -0.4 } },
          { key: 'amber', timer: { period: 2.6, on: 0.8, phase: -0.4 } },
          { key: 'sky', timer: { period: 2.6, on: 0.8, phase: -0.4 } },
        ],
        carrier: { mode: 'pendulum', pivot: { x: 180, y: 80 }, len: 360, amp: 0.28, period: 5.2 },
      },
    ],
    devices: [
      { id: 'squeak', label: 'Squeak', type: 'console', x: 60, y: 540, color: 'coral', cable: { len: 300, curl: -1 }, plug: { key: 'coral' }, rest: { x: 60, y: 470 } },
      { id: 'spike', label: 'Spike', type: 'drill', x: 180, y: 560, color: 'amber', cable: { len: 300, curl: 1 }, plug: { key: 'amber' }, rest: { x: 180, y: 500 } },
      { id: 'dot', label: 'Dot', type: 'phone', x: 300, y: 540, color: 'sky', cable: { len: 300, curl: 1 }, plug: { key: 'sky' }, rest: { x: 300, y: 470 } },
    ],
    decor: [{ art: 'window', x: 62, y: 230, r: 34, inert: true }],
    waive: ['luck'], // the keys make one answer; a plug's chance is the timing, which the dice cannot play
    secret: { art: 'goldpendulum', x: 300, y: 130, on: 'swing' }, // all three seated inside one period of the swing: the golden pendulum
    teaser: 'thumpFar',
    caption: 'Whee!',
  });
  // ---- Level 38 "Lanes": a rack of three lanes, each a column of clips (hoops) of one colour, between channel walls. A cable runs its own
  // lane's clips and no other: the walls between the clips shut the channel to the wrong colour, so a straight shot into another lane is
  // stopped at its wall, and the cable has to go under the rack and come up its own lane. Dot the phone is on the far left and its lane is
  // the sky one on the right; Squeak is on the right and its lane is coral on the left: the two cables cross under the rack. The golden clip:
  // every clip run once, none touched twice.
  LV.push({
    id: 38, act: 4, name: 'Lanes', cls: 'puzzle', dawn: 0.5, world: 'station', par: 3, tidy: false, settleCurl: -0.25, lanes: true,
    intent: 'Each cable has its own lane of clips, between walls. A wall is shut to the wrong colour: go under the rack.',
    strips: [
      { id: 'R', x: 180, y: 230, slots: 3, pitch: 70, angle: 0, sockets: [{ key: 'coral' }, { key: 'amber' }, { key: 'sky' }] },
    ],
    gates: [
      { id: 'c1', x: 110, y: 330, rot: 0, gap: 44, key: 'coral' },
      { id: 'c2', x: 110, y: 380, rot: 0, gap: 44, key: 'coral' },
      { id: 'c3', x: 110, y: 430, rot: 0, gap: 44, key: 'coral' },
      { id: 'a1', x: 180, y: 330, rot: 0, gap: 44, key: 'amber' },
      { id: 'a2', x: 180, y: 380, rot: 0, gap: 44, key: 'amber' },
      { id: 'a3', x: 180, y: 430, rot: 0, gap: 44, key: 'amber' },
      { id: 's1', x: 250, y: 330, rot: 0, gap: 44, key: 'sky' },
      { id: 's2', x: 250, y: 380, rot: 0, gap: 44, key: 'sky' },
      { id: 's3', x: 250, y: 430, rot: 0, gap: 44, key: 'sky' },
    ],
    obstacles: [
      { shape: 'rrect', x: 88, y: 356, w: 6, h: 28, rot: 0, cr: 2, tall: true, art: 'rackwall' },
      { shape: 'rrect', x: 88, y: 406, w: 6, h: 28, rot: 0, cr: 2, tall: true, art: 'rackwall' },
      { shape: 'rrect', x: 132, y: 356, w: 6, h: 28, rot: 0, cr: 2, tall: true, art: 'rackwall' },
      { shape: 'rrect', x: 132, y: 406, w: 6, h: 28, rot: 0, cr: 2, tall: true, art: 'rackwall' },
      { shape: 'rrect', x: 158, y: 356, w: 6, h: 28, rot: 0, cr: 2, tall: true, art: 'rackwall' },
      { shape: 'rrect', x: 158, y: 406, w: 6, h: 28, rot: 0, cr: 2, tall: true, art: 'rackwall' },
      { shape: 'rrect', x: 202, y: 356, w: 6, h: 28, rot: 0, cr: 2, tall: true, art: 'rackwall' },
      { shape: 'rrect', x: 202, y: 406, w: 6, h: 28, rot: 0, cr: 2, tall: true, art: 'rackwall' },
      { shape: 'rrect', x: 228, y: 356, w: 6, h: 28, rot: 0, cr: 2, tall: true, art: 'rackwall' },
      { shape: 'rrect', x: 228, y: 406, w: 6, h: 28, rot: 0, cr: 2, tall: true, art: 'rackwall' },
      { shape: 'rrect', x: 272, y: 356, w: 6, h: 28, rot: 0, cr: 2, tall: true, art: 'rackwall' },
      { shape: 'rrect', x: 272, y: 406, w: 6, h: 28, rot: 0, cr: 2, tall: true, art: 'rackwall' },
    ],
    devices: [
      { id: 'dot', label: 'Dot', type: 'phone', x: 60, y: 520, color: 'sky', cable: { len: 490, curl: 1 }, plug: { key: 'sky' }, rest: { x: 70, y: 455 } },
      { id: 'spike', label: 'Spike', type: 'drill', x: 180, y: 520, color: 'amber', cable: { len: 390, curl: 1 }, plug: { key: 'amber' }, rest: { x: 100, y: 580 } },
      { id: 'squeak', label: 'Squeak', type: 'console', x: 290, y: 520, color: 'coral', cable: { len: 470, curl: 1 }, plug: { key: 'coral' }, rest: { x: 290, y: 455 } },
    ],
    decor: [{ art: 'window', x: 318, y: 120, r: 30, inert: true }],
    waive: ['luck'], // the keys make one answer; the lanes are the puzzle, and a random thumb does not run a lane in order
    secret: { art: 'goldclip', x: 300, y: 300, on: 'lanes' }, // every cable ran each of its clips once, and touched none twice: the golden clip
    teaser: 'humFar',
    caption: 'Tidy.',
  });
  // ---- Level 39 "Patch Panel": a switchboard. The mains board has four brass jacks; the cord K1 is a patch cord with a plug that fits any
  // jack, and its other end feeds the second board, which is dark until K1 is patched into the mains. Rex and Pip go straight into their
  // own jacks on the mains board; Lux is keyed to a jack on the second board. Patch every pair with no cord crossing another: a golden jack.
  LV.push({
    id: 39, act: 4, name: 'Patch Panel', cls: 'puzzle', dawn: 0.5, world: 'station', par: 4, tidy: true, settleCurl: -0.25,
    intent: 'A cord has a plug at each end. The second board is dark until its cord is patched into the mains: follow the power.',
    strips: [
      { id: 'A', x: 180, y: 170, slots: 4, pitch: 56, angle: 0, sockets: [{ key: 'violet' }, { key: 'coral' }, { key: 'amber' }, { key: 'mint' }] },
      { id: 'B', x: 200, y: 480, slots: 2, pitch: 70, angle: 0, fedBy: 'K1', sockets: [{ key: 'sky' }, { key: 'mint' }] },
    ],
    decor: [{ art: 'jackboard', x: 180, y: 170, w: 300, h: 96, inert: true }],
    devices: [
      { id: 'K1', label: 'Cord', type: 'anchor', cord: true, x: 50, y: 330, color: 'violet', cable: { len: 200, curl: 1 }, plug: { key: 'violet' }, rest: { x: 40, y: 250 } },
      { id: 'rex', label: 'Rex', type: 'radio', x: 250, y: 400, color: 'coral', cable: { len: 325, curl: -1 }, plug: { key: 'coral' }, rest: { x: 300, y: 470 } },
      { id: 'pip', label: 'Pip', type: 'phone', x: 320, y: 300, color: 'amber', cable: { len: 245, curl: 1 }, plug: { key: 'amber' }, rest: { x: 330, y: 380 } },
      { id: 'lux', label: 'Lux', type: 'lamp', x: 110, y: 560, color: 'sky', cable: { len: 200, curl: 1 }, plug: { key: 'sky' }, rest: { x: 60, y: 540 } },
    ],
    secret: { art: 'goldclip', x: 300, y: 130, on: 'tidy' }, // every cord patched with no cord crossing another: a golden jack
    teaser: 'humFar',
    caption: 'Connecting.',
  });
  // ---- Level 40 "The Server Hall" (boss): the three finales of this act in one hall. The rack's lanes (Level 38), with Biscuit asleep on the
  // amber socket (the lure of Level 22: she leaves for the spot of light, and the socket is free); and when the hall wakes, the light rivers
  // run down every laid cable (the wake). The trolley of the card is not built yet: the boss is a composition, as Level 30 was.
  LV.push({
    id: 40, act: 4, name: 'The Server Hall', cls: 'boss', dawn: 0.5, world: 'station', par: 3, tidy: false, settleCurl: -0.25, lanes: true, rivers: true,
    intent: 'The hall. Biscuit is asleep on the amber socket: draw the light to lure her off, then lay each cable up its own lane.',
    strips: [
      { id: 'R', x: 180, y: 230, slots: 3, pitch: 70, angle: 0, sockets: [{ key: 'coral' }, { key: 'amber' }, { key: 'sky' }] },
    ],
    gates: [
      { id: 'c1', x: 110, y: 330, rot: 0, gap: 44, key: 'coral' },
      { id: 'c2', x: 110, y: 380, rot: 0, gap: 44, key: 'coral' },
      { id: 'c3', x: 110, y: 430, rot: 0, gap: 44, key: 'coral' },
      { id: 'a1', x: 180, y: 330, rot: 0, gap: 44, key: 'amber' },
      { id: 'a2', x: 180, y: 380, rot: 0, gap: 44, key: 'amber' },
      { id: 'a3', x: 180, y: 430, rot: 0, gap: 44, key: 'amber' },
      { id: 's1', x: 250, y: 330, rot: 0, gap: 44, key: 'sky' },
      { id: 's2', x: 250, y: 380, rot: 0, gap: 44, key: 'sky' },
      { id: 's3', x: 250, y: 430, rot: 0, gap: 44, key: 'sky' },
    ],
    obstacles: [
      { shape: 'rrect', x: 88, y: 356, w: 6, h: 28, rot: 0, cr: 2, tall: true, art: 'rackwall' },
      { shape: 'rrect', x: 88, y: 406, w: 6, h: 28, rot: 0, cr: 2, tall: true, art: 'rackwall' },
      { shape: 'rrect', x: 132, y: 356, w: 6, h: 28, rot: 0, cr: 2, tall: true, art: 'rackwall' },
      { shape: 'rrect', x: 132, y: 406, w: 6, h: 28, rot: 0, cr: 2, tall: true, art: 'rackwall' },
      { shape: 'rrect', x: 158, y: 356, w: 6, h: 28, rot: 0, cr: 2, tall: true, art: 'rackwall' },
      { shape: 'rrect', x: 158, y: 406, w: 6, h: 28, rot: 0, cr: 2, tall: true, art: 'rackwall' },
      { shape: 'rrect', x: 202, y: 356, w: 6, h: 28, rot: 0, cr: 2, tall: true, art: 'rackwall' },
      { shape: 'rrect', x: 202, y: 406, w: 6, h: 28, rot: 0, cr: 2, tall: true, art: 'rackwall' },
      { shape: 'rrect', x: 228, y: 356, w: 6, h: 28, rot: 0, cr: 2, tall: true, art: 'rackwall' },
      { shape: 'rrect', x: 228, y: 406, w: 6, h: 28, rot: 0, cr: 2, tall: true, art: 'rackwall' },
      { shape: 'rrect', x: 272, y: 356, w: 6, h: 28, rot: 0, cr: 2, tall: true, art: 'rackwall' },
      { shape: 'rrect', x: 272, y: 406, w: 6, h: 28, rot: 0, cr: 2, tall: true, art: 'rackwall' },
    ],
    devices: [
      { id: 'dot', label: 'Dot', type: 'phone', x: 60, y: 520, color: 'sky', cable: { len: 490, curl: 1 }, plug: { key: 'sky' }, rest: { x: 70, y: 455 } },
      { id: 'spike', label: 'Spike', type: 'drill', x: 180, y: 520, color: 'amber', cable: { len: 390, curl: 1 }, plug: { key: 'amber' }, rest: { x: 100, y: 580 } },
      { id: 'squeak', label: 'Squeak', type: 'console', x: 290, y: 520, color: 'coral', cable: { len: 470, curl: 1 }, plug: { key: 'coral' }, rest: { x: 290, y: 455 } },
    ],
    herd: { cat: { on: 'R.2' }, beam: { x: 180, y: 300, r: 150 }, lure: { x: 330, y: 330 }, guardT: 4.5, boredT: 2.4, teaser: 'whistleFar' },
    decor: [{ art: 'window', x: 318, y: 120, r: 30, inert: true }],
    waive: ['luck'], // a recipe: Biscuit must be lured off the amber socket before its cable can seat; a random thumb does not play the recipe
    secret: { art: 'goldtumbler', x: 300, y: 300, on: 'lanes' }, // every cable ran each of its clips once: the golden torch
    teaser: 'whistleFar',
    caption: 'Lights out, everyone.',
  });
})();
