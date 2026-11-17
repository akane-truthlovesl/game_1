#!/usr/bin/env node
/* Snug — tools/search-hoops.js : "the solver as muse" for hoop levels (Level 12, Fairy Lights).
   Three devices hang from the top, a strip waits at the bottom, coloured hoops sit between. Every cable must run through
   the hoops of its own colour on its way, and no two cables may cross. The search keeps layouts in which the hoops
   decide the puzzle: exactly one crossing-free arrangement (or two), a clean look, and a low luck score.
   usage: node tools/search-hoops.js [N] [seed]      then paste the printed level into src/levels/world2.js */
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

const COLS = ['amber', 'sky', 'mint'];
function build(P) {
  const sockets = Array.from({ length: P.nsock }, () => ({ key: 'any' }));
  return {
    id: 12, act: 2, name: 'Fairy Lights', cls: 'puzzle', world: 'peg', rules: { noCross: true }, settleCurl: P.sc,
    strips: [{ id: 'A', x: P.stx, y: P.sy, slots: P.nsock, pitch: 40, angle: 0, sockets }],
    gates: P.gates.map((g, i) => ({ id: 'g' + (i + 1), x: g.x, y: g.y, rot: g.rot, gap: g.gap, key: g.key })),
    devices: [
      { id: 'wick', type: 'lamp', x: P.ax, y: 104, color: 'amber', cable: { len: P.lens[0], curl: P.curl[0] }, plug: { key: 'amber' }, rest: P.rests[0] },
      { id: 'static', type: 'radio', x: P.bx, y: 92, color: 'sky', cable: { len: P.lens[1], curl: P.curl[1] }, plug: { key: 'sky' }, rest: P.rests[1] },
      { id: 'boxy', type: 'laptop', x: P.cx, y: 108, color: 'mint', cable: { len: P.lens[2], curl: P.curl[2] }, plug: { key: 'mint' }, rest: P.rests[2] },
    ],
    obstacles: [],
  };
}
if (process.argv[2] === '--emit') {
  const P = JSON.parse(process.argv[3]);
  const def = build(P);
  def.dawn = 0.78;
  def.plainSockets = true;
  console.log(JSON.stringify(def));
  process.exit(0);
}
const results = [];
const REJ = {};
const rej = (k) => (REJ[k] = (REJ[k] || 0) + 1);
const perm = (n, k) => { const out = []; const rec = (cur, used) => { if (cur.length === k) return out.push(cur.slice()); for (let i = 0; i < n; i++) if (!used.has(i)) { used.add(i); cur.push(i); rec(cur, used); cur.pop(); used.delete(i); } }; rec([], new Set()); return out; };
for (let it = 0; it < N; it++) {
  const ng = rr(3, 5, 1);
  const P = { nsock: rnd() < 0.5 ? 3 : 4, sy: rr(380, 430, 10), stx: rr(170, 190, 10), ax: rr(56, 84, 2), bx: rr(160, 200, 2), cx: rr(268, 296, 2), sc: rnd() < 0.5 ? -1 : 1, curl: [rnd() < 0.5 ? -1 : 1, rnd() < 0.5 ? -1 : 1, rnd() < 0.5 ? -1 : 1], gates: [] };
  // hoops: spread in the middle band, every colour used at least once, none crowding another
  let ok = true;
  for (let g = 0; g < ng && ok; g++) {
    let tries = 0, gate;
    do {
      gate = { x: rr(46, 314, 2), y: rr(196, P.sy - 74, 2), rot: [0, 0, 0, 0.3, -0.3, 0.45, -0.45][(rnd() * 7) | 0], gap: 52, key: g < 3 ? COLS[g] : COLS[(rnd() * 3) | 0] };
      tries++;
    } while (tries < 30 && P.gates.some((q) => Math.hypot(q.x - gate.x, q.y - gate.y) < 64));
    if (tries >= 30) ok = false;
    P.gates.push(gate);
  }
  if (!ok) { rej('gate packing'); continue; }
  // resting plugs hang just under their devices, above the hoops
  P.rests = [{ x: P.ax + rr(-16, 30, 2), y: rr(196, 226, 2) }, { x: P.bx + rr(-26, 26, 2), y: rr(178, 206, 2) }, { x: P.cx + rr(-30, 16, 2), y: rr(196, 226, 2) }];
  const ports = [{ x: P.ax, y: 104 + 46 }, { x: P.bx, y: 92 + 28 }, { x: P.cx, y: 108 + 43 }];
  P.lens = [0, 0, 0];
  const def0 = build(Object.assign({}, P, { lens: [900, 900, 900] }));
  let L0;
  try { L0 = R.compile(def0); } catch (e) { rej('compile'); continue; }
  // derive each cable length from its worst via-route (so every socket is comfortably reachable, ratio <= 0.9)
  let bad = false;
  for (let i = 0; i < 3; i++) {
    const p = L0.plugs[i];
    const need = Math.max(...L0.sockets.map((s) => L0.reach[p.id][s.id].needed));
    P.lens[i] = Math.ceil(need / 0.9 / 5) * 5;
    if (P.lens[i] > 480) bad = true;
    const c = Math.hypot(P.rests[i].x - ports[i].x, P.rests[i].y - ports[i].y);
    if (P.lens[i] / Math.max(c, 1) > 6) bad = true; // absurd loops at rest
  }
  if (bad) { rej('lengths'); continue; }
  const def = build(P);
  let L;
  try { L = R.compile(def); } catch (e) { rej('compile2'); continue; }
  const lay = R.checkLayout(L);
  // resting cables: inside the stage, clear of every post, and not already threaded through a hoop
  let restBad = false;
  for (const d of L.devices) {
    const n = Math.max(8, Math.min(64, Math.ceil(d.len / G.T.segLen) + 1));
    const ox = new Float64Array(n), oy = new Float64Array(n);
    G.Rope.restPoints(d.port.x, d.port.y, d.rest.x, d.rest.y, d.len, n, d.curl, ox, oy);
    const pts = [];
    for (let i = 0; i < n; i++) {
      if (ox[i] < 8 || ox[i] > 352 || oy[i] < 30 || oy[i] > 620) restBad = true;
      for (const g of L.gates) for (const e of [g.a, g.b]) if (Math.hypot(ox[i] - e.x, oy[i] - e.y) < 14) restBad = true;
      pts.push({ x: ox[i], y: oy[i] });
    }
    for (const g of L.gates) if (G.Geom.polyCross(pts, [g.a, g.b]) > 0) restBad = true;
  }
  if (restBad) { rej('rest cables'); continue; }
  if (lay.length) { rej('layout'); continue; }
  // every hoop has a visible job: each device owns >= 1 gate (guaranteed by construction)
  // which crossing-free arrangements exist?
  const arr = perm(L.sockets.length, 3);
  const good = [];
  for (const a of arr) {
    const map = {};
    L.plugs.forEach((p, i) => (map[p.id] = L.sockets[a[i]].id));
    // every cable must be able to reach AND thread from the socket it is given
    if (!L.plugs.every((p) => L.reach[p.id][map[p.id]].ok && L.reach[p.id][map[p.id]].thread !== false)) continue;
    if (R.solutionCrossings(L, map) === 0) good.push(a);
  }
  if (good.length < 1) { rej('no tidy'); continue; }
  if (good.length > 2) { rej('too many tidy (' + (good.length > 5 ? '>5' : good.length) + ')'); continue; }
  // the hoops matter: the same layout WITHOUT hoop routes has a different (more permissive) tidy set
  const luck = R.luck(L, 600, 17);
  if (luck > 0.34) { rej('luck'); continue; }
  results.push({ P, good: good.length, luck: +luck.toFixed(2), lens: P.lens });
}
results.sort((a, b) => (b.P.gates.length >= 4) - (a.P.gates.length >= 4) || a.good - b.good || a.luck - b.luck);
require('fs').writeFileSync(process.env.OUT || '/tmp/hoops-results.json', JSON.stringify(results.map((r) => r.P)));
console.log('rejected:', JSON.stringify(REJ));
console.log('kept', results.length);
for (const r of results.slice(0, 6)) console.log(JSON.stringify(r));
