#!/usr/bin/env node
/* Snug — tools/search-stereo.js : "the solver as muse" for the Y-plug level (Level 13, Stereo).
   Lefty and Righty (speakers at the top corners) share ONE plug; Spike (drill) and Dot (phone) are ordinary singles.
   Sockets are single grommets scattered over the lower board, so reach can separate them cleanly.
   Keeps layouts where the only socket the Y-plug can use is inside the overlap of its two reach discs, a tempting
   nearer socket fails for one cable, the whole room has exactly one tidy solution and a low luck score.
   usage: node tools/search-stereo.js [N] [seed]      then paste the printed level into src/levels/world2.js */
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
const grommet = (id, x, y) => ({ id, kind: 'grommet', x, y, slots: 1, pitch: 40, angle: 0, sockets: [{ key: 'any' }] });

function build(P) {
  return {
    id: 13, act: 2, name: 'Stereo', cls: 'puzzle', world: 'garage', tidy: true, settleCurl: P.sc, par: 3,
    strips: P.socks.map((s, i) => grommet('G' + (i + 1), s.x, s.y)),
    devices: [
      { id: 'lefty', type: 'speaker', x: P.lx, y: 120, color: 'coral', cable: { len: P.lens[0], curl: P.curl[0] }, plug: { key: 'any' }, rest: P.yrest, cableCol: 'coral' },
      { id: 'righty', type: 'speaker', x: P.rx, y: 120, color: 'sky', cable: { len: P.lens[1], curl: P.curl[1] }, sharePlug: 'lefty', cableCol: 'sky', flip: true },
      { id: 'spike', type: 'drill', x: P.sx, y: P.sy, color: 'amber', cable: { len: P.lens[2], curl: P.curl[2] }, plug: { key: 'any' }, rest: P.srest },
      { id: 'dot', type: 'phone', x: P.dx, y: P.dy, color: 'mint', cable: { len: P.lens[3], curl: P.curl[3] }, plug: { key: 'any' }, rest: P.drest },
    ],
    obstacles: [],
  };
}
// cable devices carry cableCol / flip through their def (compile copies d.def)
if (process.argv[2] === '--emit') {
  const P = JSON.parse(process.argv[3]);
  const def = build(P);
  def.dawn = 0.7;
  console.log(JSON.stringify(def));
  process.exit(0);
}
const results = [];
const REJ = {};
const rej = (k) => (REJ[k] = (REJ[k] || 0) + 1);
for (let it = 0; it < N; it++) {
  const P = {
    lx: rr(48, 72, 2), rx: rr(288, 312, 2), sx: rr(44, 66, 2), sy: rr(300, 380, 10), dx: rr(294, 316, 2), dy: rr(300, 380, 10),
    sc: rnd() < 0.5 ? -1 : 1, curl: [rnd() < 0.5 ? -1 : 1, rnd() < 0.5 ? -1 : 1, rnd() < 0.5 ? -1 : 1, rnd() < 0.5 ? -1 : 1], socks: [],
    yrest: { x: rr(160, 200, 2), y: rr(250, 310, 2) },
  };
  P.srest = { x: P.sx + rr(10, 40, 2), y: P.sy + rr(70, 100, 2) };
  P.drest = { x: P.dx - rr(10, 40, 2), y: P.dy + rr(70, 100, 2) };
  // five grommets scattered over the lower board, well apart
  let ok = true;
  for (let k = 0; k < 5 && ok; k++) {
    let tries = 0, g;
    do { const gy = rr(330, 560, 2); g = gy < 430 ? { x: rr(112, 248, 2), y: gy } : { x: rr(64, 296, 2), y: gy }; tries++; } while (tries < 40 && P.socks.some((q) => Math.hypot(q.x - g.x, q.y - g.y) < 80));
    if (tries >= 40) ok = false;
    P.socks.push(g);
  }
  if (!ok) { rej('socket packing'); continue; }
  // resting plugs of the singles: clear of every grommet
  const clear = (r) => P.socks.every((q) => Math.hypot(q.x - r.x, q.y - r.y) > 46);
  for (let t = 0; t < 25 && !clear(P.srest); t++) P.srest = { x: P.sx + rr(10, 44, 2), y: P.sy + rr(60, 110, 2) };
  for (let t = 0; t < 25 && !clear(P.drest); t++) P.drest = { x: P.dx - rr(10, 44, 2), y: P.dy + rr(60, 110, 2) };
  if (!clear(P.srest) || !clear(P.drest)) { rej('rests crowd a grommet'); continue; }
  P.lens = [900, 900, 900, 900];
  const def0 = build(P);
  let L0;
  try { L0 = R.compile(def0); } catch (e) { rej('compile'); continue; }
  // the Y-plug: pick its home grommet T, then size BOTH speaker cables so T is comfortably in both reach discs
  const T = L0.sockets[(rnd() * 5) | 0];
  const eT = L0.reach.lefty[T.id].all;
  P.lens = [Math.ceil(eT.lefty.needed / ri(0.82, 0.92) / 5) * 5, Math.ceil(eT.righty.needed / ri(0.82, 0.92) / 5) * 5, 0, 0];
  if (P.lens[0] > 480 || P.lens[1] > 480) { rej('y cables too long'); continue; }
  const def1 = build(Object.assign({}, P, { lens: [P.lens[0], P.lens[1], 900, 900] }));
  try { L0 = R.compile(def1); } catch (e) { rej('compile1'); continue; }
  // single cables: derive a length that reaches exactly k nearest sockets with a clean gap (like Phase 1)
  let bad = false;
  for (const id of ['spike', 'dot']) {
    const p = L0.plugsById[id];
    const d = L0.sockets.map((s) => L0.reach[p.id][s.id].needed).sort((a, b) => a - b);
    const options = [];
    for (let k = 1; k <= d.length; k++) {
      const len = Math.ceil(d[k - 1] / 0.9 / 5) * 5;
      if (k < d.length && d[k] < 1.12 * len) continue;
      if (len > 480) continue;
      options.push({ k, len });
    }
    if (!options.length) { bad = true; break; }
    P.lens[id === 'spike' ? 2 : 3] = options[(rnd() * options.length) | 0].len;
  }
  if (bad) { rej('no clean single length'); continue; }
  const def = build(P);
  let L;
  try { L = R.compile(def); } catch (e) { rej('compile2'); continue; }
  const lay = R.checkLayout(L);
  if (lay.length) { rej('layout: ' + lay[0].replace(/\d+(\.\d+)?/g, '#').slice(0, 44)); continue; }
  if (R.ambiguousReach(L).length) { rej('ambiguous'); continue; }
  const sols = R.solveAll(L, { cap: 30 });
  if (sols.length !== 1) { rej('solutions ' + (sols.length === 0 ? 'none' : 'many')); continue; }
  if (R.solutionCrossings(L, sols[0]) !== 0) { rej('not tidy'); continue; }
  for (const p of L.plugs) if (L.reach[p.id][sols[0][p.id]].ratio > R.CFG.reachDesign) { bad = true; }
  if (bad) { rej('margin'); continue; }
  // the Y-plug: the tempting socket (the one Lefty reaches best) is NOT where the Y-plug may go
  const y = L.plugsById.lefty;
  const ysock = sols[0].lefty;
  const best = L.sockets.slice().sort((a, b) => L.reach[y.id][a.id].all.lefty.ratio - L.reach[y.id][b.id].all.lefty.ratio)[0];
  if (best.id === ysock) { rej('no trap for the Y'); continue; }
  const lens = L.reach[y.id][best.id].all;
  if (!(lens.lefty.ratio <= 0.9 && lens.righty.ratio >= 1.1)) { rej('trap not clear'); continue; }
  const luck = R.luck(L, 1500, 77);
  if (luck > 0.95) { rej('luck'); continue; }
  results.push({ P, luck: +luck.toFixed(2), sol: sols[0], ratios: L.plugs.map((p) => L.reach[p.id][sols[0][p.id]].ratio.toFixed(2)).join(' ') });
}
results.sort((a, b) => a.luck - b.luck);
console.log('rejected:', JSON.stringify(REJ));
console.log('kept', results.length);
for (const r of results.slice(0, 5)) console.log(JSON.stringify(r));
require('fs').writeFileSync(process.env.OUT || '/tmp/stereo-results.json', JSON.stringify(results));
if (process.argv[2] === '--emit') {}
