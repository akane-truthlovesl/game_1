#!/usr/bin/env node
/* Snug — tools/search-chain.js : "the solver as muse" for the daisy-chain set piece (Level 15, The Pegboard Wall).
   Strip A is wall-fed (violet, coral, amber sockets). Strip B has its own cord and is dead until that cord is plugged into a
   live strip (sockets sky, mint and one spare joker: the trap, because B cannot feed itself). Plugs are keyed so the
   arrangement is forced; what remains is geometry: where everything stands so that each cable honestly reaches only what it should,
   the cord reaches A (and B's spare, the trap), the room is tidy, and the layout is clean.
   usage: node tools/search-chain.js [N] [seed] */
'use strict';
const path = require('path');
globalThis.Snug = {};
const S = (p) => require(path.join(__dirname, '..', 'src', p));
['util.js', 'tune.js', 'geom.js', 'rope.js', 'rules.js'].forEach(S);
const G = globalThis.Snug,
  R = G.Rules,
  U = G.U;
const N = parseInt(process.argv[2] || '5000', 10);
const seed = parseInt(process.argv[3] || '1', 10);
const rnd = U.rng(seed);
const ri = (a, b) => a + (b - a) * rnd();
const rr = (a, b, step) => Math.round(ri(a, b) / step) * step;

function build(P) {
  return {
    id: 15, act: 2, name: 'The Pegboard Wall', cls: 'hard', world: 'peg', tidy: true, settleCurl: P.sc, par: 5,
    strips: [
      { id: 'A', x: P.ax, y: P.ay, slots: 3, pitch: 40, angle: 0, sockets: [{ key: 'violet' }, { key: 'coral' }, { key: 'amber' }] },
      { id: 'B', x: P.bx, y: P.by, slots: 3, pitch: 40, angle: 0, fedBy: 'cordB', sockets: [{ key: 'sky' }, { key: 'mint' }, { key: 'any' }] },
    ],
    devices: [
      { id: 'dot', type: 'phone', x: P.d[0].x, y: P.d[0].y, color: 'coral', cable: { len: P.lens[0], curl: P.curl[0] }, plug: { key: 'coral' }, rest: P.rests[0] },
      { id: 'lux', type: 'lamp', x: P.d[1].x, y: P.d[1].y, color: 'amber', cable: { len: P.lens[1], curl: P.curl[1] }, plug: { key: 'amber' }, rest: P.rests[1] },
      { id: 'static', type: 'radio', x: P.d[2].x, y: P.d[2].y, color: 'sky', cable: { len: P.lens[2], curl: P.curl[2] }, plug: { key: 'sky' }, rest: P.rests[2] },
      { id: 'spike', type: 'drill', x: P.d[3].x, y: P.d[3].y, color: 'mint', cable: { len: P.lens[3], curl: P.curl[3] }, plug: { key: 'mint' }, rest: P.rests[3] },
      { id: 'cordB', type: 'anchor', cord: true, x: P.bx - 82, y: P.by, color: 'violet', cable: { len: P.lens[4], curl: P.curl[4] }, plug: { key: 'violet' }, rest: P.rests[4] },
    ],
    obstacles: [],
  };
}
if (process.argv[2] === '--emit') {
  const P = JSON.parse(process.argv[3]);
  const def = build(P);
  def.dawn = 0.62;
  console.log(JSON.stringify(def));
  process.exit(0);
}
const results = [];
const REJ = {};
const rej = (k) => (REJ[k] = (REJ[k] || 0) + 1);
for (let it = 0; it < N; it++) {
  const P = {
    ax: rr(96, 130, 2), ay: rr(330, 380, 2), bx: rr(226, 250, 2), by: rr(470, 520, 2),
    d: [{ x: rr(40, 50, 2), y: rr(150, 190, 2) }, { x: rr(112, 124, 2), y: rr(130, 170, 2) }, { x: rr(250, 270, 2), y: rr(250, 330, 2) }, { x: rr(290, 300, 2), y: rr(110, 170, 2) }],
    sc: rnd() < 0.5 ? -1 : 1, lens: [900, 900, 900, 900, 900], curl: [0, 1, 2, 3, 4].map(() => (rnd() < 0.5 ? -1 : 1)),
  };
  // resting plugs hang a little way below their devices; the cord lies loose beside strip B
  P.rests = [{ x: P.d[0].x + rr(10, 30, 2), y: P.d[0].y + rr(90, 120, 2) }, { x: P.d[1].x + rr(-10, 20, 2), y: P.d[1].y + rr(100, 130, 2) }, { x: P.d[2].x + rr(-30, 6, 2), y: P.d[2].y + rr(70, 100, 2) }, { x: P.d[3].x + rr(-30, 0, 2), y: P.d[3].y + rr(100, 130, 2) }, { x: P.bx - rr(100, 130, 2), y: P.by - rr(40, 70, 2) }];
  let def = build(P);
  let L0;
  try { L0 = R.compile(def); } catch (e) { rej('compile'); continue; }
  const lay0 = R.checkLayout(L0).filter((m) => !/rest plug|too slack|too far/.test(m));
  if (lay0.length) { rej('layout0 ' + lay0[0].replace(/\d+(\.\d+)?/g, '#').slice(0, 34)); continue; }
  // each cable: just long enough for its own socket (ratio ~0.9)
  const own = { dot: 'A.2', lux: 'A.3', static: 'B.1', spike: 'B.2', cordB: 'A.1' };
  const lens = [];
  for (const id of ['dot', 'lux', 'static', 'spike', 'cordB']) lens.push(Math.ceil(L0.reach[id][own[id]].needed / ri(0.82, 0.92) / 5) * 5);
  if (lens.some((l) => l > 470)) { rej('too long'); continue; }
  P.lens = lens;
  def = build(P);
  const L = R.compile(def);
  const lay = R.checkLayout(L);
  if (lay.length) { rej('layout ' + lay[0].replace(/\d+(\.\d+)?/g, '#').slice(0, 36)); continue; }
  if (R.ambiguousReach(L).length) { rej('ambiguous'); continue; }
  const sols = R.solveAll(L, { cap: 100 });
  if (sols.length < 1) { rej('none'); continue; }
  if (sols.length > 12) { rej('many'); continue; }
  const tidy = sols.filter((m) => R.solutionCrossings(L, m) === 0);
  if (!tidy.length) { rej('not tidy'); continue; }
  const m = tidy[0];
  for (const p of L.plugs) if (L.reach[p.id][m[p.id]].ratio > R.CFG.reachDesign) { rej('margin'); continue; }
  // the trap: the cord reaches B's own spare socket (it would feed nothing), and a device on B could be seated first
  if (!L.reach.cordB['B.3'].ok) { rej('no cycle trap'); continue; }
  // devices that belong on B must not reach A (so the chain, not luck, decides)
  if (L.reach.static['A.1'].ok || L.reach.spike['A.1'].ok) { rej('B devices reach A'); continue; }
  const luck = R.luck(L, 1500, 55);
  if (luck > 0.5) { rej('luck'); continue; }
  results.push({ P, luck: +luck.toFixed(2), sols: sols.length, tidy: tidy.length });
}
results.sort((a, b) => a.luck - b.luck || a.sols - b.sols);
console.log('rejected:', JSON.stringify(REJ));
console.log('kept', results.length);
for (const r of results.slice(0, 5)) console.log(JSON.stringify(r));
require('fs').writeFileSync(process.env.OUT || '/tmp/chain-results.json', JSON.stringify(results));
