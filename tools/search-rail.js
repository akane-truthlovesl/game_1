#!/usr/bin/env node
/* Snug — tools/search-rail.js : "the solver as muse" for rail levels (kinematic strips).
   Proposes device positions and cable lengths for a rail layout and keeps only the ones the validator would love:
   exactly one sweet-spot detent (clean slack there, a clear miss on both sides), a decoy detent where all but one
   device reach, a tidy arrangement at the sweet spot, no cable passing over a device body at rest or at the end,
   resting plugs that do not crowd, and a low luck score.
   usage: node tools/search-rail.js [N] [seed]      then paste the printed level into src/levels/world2.js */
'use strict';
const path = require('path');
globalThis.Snug = {};
const S = (p) => require(path.join(__dirname, '..', 'src', p));
['util.js', 'tune.js', 'geom.js', 'rope.js', 'rules.js'].forEach(S);
const G = globalThis.Snug,
  R = G.Rules,
  U = G.U;
const N = parseInt(process.argv[2] || '4000', 10);
const BASE = process.env.BASE ? JSON.parse(process.env.BASE) : null;
const seed = parseInt(process.argv[3] || '1', 10);
const rnd = U.rng(seed);
const ri = (a, b) => a + (b - a) * rnd();
const rr = (a, b, step) => Math.round(ri(a, b) / step) * step;

// L11 "Slide": the outer devices sit beside the board (their cables run diagonally, so reach is sensitive to where the
// strip is); the inner two hang from the top. One 4-socket strip on a rail along the lower middle.
function l11(P) {
  // the wide console hangs from the top; the narrow drill sits beside the board (P.swap)
  const D = P.swap ? [
    { id: 'dot', type: 'phone', x: P.dx, y: P.dy, color: 'coral', curl: P.curl[0] },
    { id: 'lux', type: 'lamp', x: P.lx, y: 118, color: 'amber', curl: P.curl[1] },
    { id: 'gus', type: 'console', x: P.sx, y: 120, color: 'mint', curl: P.curl[2] },
    { id: 'spike', type: 'drill', x: P.gx, y: P.gy, color: 'sky', curl: P.curl[3] },
  ] : [
    { id: 'dot', type: 'phone', x: P.dx, y: P.dy, color: 'coral', curl: P.curl[0] },
    { id: 'lux', type: 'lamp', x: P.lx, y: 118, color: 'amber', curl: P.curl[1] },
    { id: 'spike', type: 'drill', x: P.sx, y: 124, color: 'sky', curl: P.curl[2] },
    { id: 'gus', type: 'console', x: P.gx, y: P.gy, color: 'mint', curl: P.curl[3] },
  ];
  return {
    id: 11, act: 2, name: 'Slide', cls: 'teach', world: 'steel', settleCurl: P.sc,
    strips: [{
      id: 'R', x: 180, y: P.ry, slots: 4, pitch: 40, angle: 0, sockets: [{ key: 'any' }, { key: 'any' }, { key: 'any' }, { key: 'any' }],
      rail: { x0: 108, y0: P.ry, x1: 252, y1: P.ry, detents: [0, 0.25, 0.5, 0.75, 1], start: P.start },
    }],
    devices: D.map((d, i) => ({ id: d.id, type: d.type, x: d.x, y: d.y, color: d.color, cable: { len: P.lens[i], curl: d.curl }, plug: { key: 'any' }, rest: P.rests[i] })),
    obstacles: [],
  };
}
const arc = (port, to, len, curl) => {
  const n = Math.max(8, Math.min(64, Math.ceil(len / G.T.segLen) + 1));
  const ox = new Float64Array(n), oy = new Float64Array(n);
  G.Rope.arcPoints(port.x, port.y, to.x, to.y, len, n, curl, ox, oy);
  const pts = [];
  for (let i = 0; i < n; i++) pts.push({ x: ox[i], y: oy[i] });
  return pts;
};
// does a polyline pass over any device body other than its own (skipping the first stretch, where it leaves its own port)?
function overDevices(L, pts, ownId) {
  for (const d of L.devices) {
    if (d.id === ownId) continue;
    const poly = R.devicePoly(d);
    for (let i = 3; i < pts.length; i++) if (G.Geom.pointPolyDist(pts[i].x, pts[i].y, poly) < 3) return true;
  }
  return false;
}

const results = [];
const REJ = {};
const rej = (k) => (REJ[k] = (REJ[k] || 0) + 1);
const perm = (arr) => (arr.length <= 1 ? [arr] : arr.flatMap((x, i) => perm([...arr.slice(0, i), ...arr.slice(i + 1)]).map((r) => [x, ...r])));
const PERMS = perm([0, 1, 2, 3]);
for (let it = 0; it < N; it++) {
  const jit = (v, a, step) => Math.round((v + (rnd() - 0.5) * 2 * a) / step) * step;
  const P = BASE ? {
    dx: jit(BASE.dx, 6, 2), dy: jit(BASE.dy, 30, 10), lx: jit(BASE.lx, 12, 2), sx: jit(BASE.sx, 14, 2), gx: jit(BASE.gx, 6, 2), gy: jit(BASE.gy, 30, 10), ry: BASE.ry,
    start: BASE.start, lens: [0, 0, 0, 0], curl: BASE.curl.slice(), sc: BASE.sc, swap: BASE.swap,
  } : {
    dx: rr(42, 52, 2), dy: rr(200, 360, 10), lx: rr(110, 135, 5), sx: process.env.SWAP === '1' ? rr(228, 250, 2) : rr(215, 245, 5), gx: process.env.SWAP === '1' ? rr(300, 312, 2) : rr(298, 306, 2), gy: rr(200, 360, 10), ry: rr(470, 520, 10),
    start: rnd() < 0.5 ? 0 : 4, lens: [0, 0, 0, 0],
    curl: [rnd() < 0.5 ? -1 : 1, rnd() < 0.5 ? -1 : 1, rnd() < 0.5 ? -1 : 1, rnd() < 0.5 ? -1 : 1], sc: rnd() < 0.5 ? -1 : 1, swap: process.env.SWAP === '1',
  };
  // resting plugs in a row above the rail, well spaced
  const ry0 = P.ry - 28 - 20 - rr(0, 8, 2); // 20+ above the strip's top edge so a resting plug never touches the swept strip
  P.rests = BASE ? [{ x: jit(BASE.rests[0].x, 8, 2), y: ry0 }, { x: jit(BASE.rests[1].x, 14, 2), y: ry0 - rr(0, 14, 2) }, { x: jit(BASE.rests[2].x, 14, 2), y: ry0 - rr(0, 14, 2) }, { x: jit(BASE.rests[3].x, 8, 2), y: ry0 }]
    : [{ x: rr(52, 72, 2), y: ry0 }, { x: rr(108, 140, 2), y: ry0 - rr(0, 14, 2) }, { x: rr(190, 226, 2), y: ry0 - rr(0, 14, 2) }, { x: rr(266, 292, 2), y: ry0 }];
  // cable lengths follow the resting chords (no absurd loops): len = chord x a slack factor
  const ports = P.swap ? [{ x: P.dx, y: P.dy + 46 }, { x: P.lx, y: 118 + 46 }, { x: P.sx, y: 120 + 29 }, { x: P.gx, y: P.gy + 43 }] : [{ x: P.dx, y: P.dy + 46 }, { x: P.lx, y: 118 + 46 }, { x: P.sx, y: 124 + 43 }, { x: P.gx, y: P.gy + 29 }];
  P.lens = P.rests.map((r, i) => Math.round((Math.hypot(r.x - ports[i].x, r.y - ports[i].y) * ri(1.25, 2.2)) / 5) * 5);
  const def = l11(P);
  let L;
  try { L = R.compile(def); } catch (e) { rej('compile'); continue; }
  const lay = R.checkLayout(L);
  if (lay.length) { rej('layout: ' + lay[0].replace(/\d+(\.\d+)?/g, '#').slice(0, 40)); continue; }
  // the resting plugs should not crowd one another
  let crowd = false;
  for (let i = 0; i < 4 && !crowd; i++) for (let j = i + 1; j < 4; j++) if (Math.hypot(P.rests[i].x - P.rests[j].x, P.rests[i].y - P.rests[j].y) < 46) { crowd = true; break; }
  if (crowd) { rej('crowded rests'); continue; }
  // resting arcs: fit the stage, don't cross each other, don't pass over devices
  const rarcs = L.devices.map((d) => arc(d.port, d.rest, d.len, d.curl));
  let bad = false;
  rarcs.forEach((pts, i) => { for (const q of pts) if (q.x < 6 || q.x > 354 || q.y < 20 || q.y > P.ry - 30) bad = true; });
  if (bad) { rej('rest arcs'); continue; }
  let rc = 0;
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) rc += G.Geom.polyCross(rarcs[i], rarcs[j]);
  if (rc) { rej('rest arcs cross'); continue; }
  // per detent: the bottleneck of the best matching and the second-worst
  const sock = L.rails[0].sockets;
  const info = [];
  for (let d = 0; d < 5; d++) {
    let bn = 9, sec = 9;
    for (const pm of PERMS) {
      const rs = L.plugs.map((p, i) => L.reachAt.R[d][p.id][sock[pm[i]].id].ratio).sort((a, b) => b - a);
      if (rs[0] < bn) { bn = rs[0]; sec = rs[1]; }
    }
    info.push({ bn, sec });
  }
  const goodD = info.map((x, d) => (x.bn <= 0.95 ? d : -1)).filter((d) => d >= 0);
  if (goodD.length !== 1) { rej('sweet spots ' + (goodD.length > 1 ? '>1' : 0)); continue; }
  const gdi = goodD[0];
  if (gdi === 0 || gdi === 4) { rej('goal at an end'); continue; }
  if (Math.abs(gdi - P.start) < 2) { rej('too close'); continue; }
  if (info.some((x, d) => d !== gdi && x.bn < 1.025)) { rej('murky neighbour'); continue; }
  const decoyD = info.map((x, d) => (d !== gdi && x.sec <= 0.95 ? d : -1)).filter((d) => d >= 0);
  if (!decoyD.length) { rej('no decoy'); continue; }
  const res = R.solveRail(L);
  if (!res.goals.length) { rej('unsolvable'); continue; }
  if (new Set(res.goals.map((g) => g.st.rail.R)).size !== 1) { rej('goal detents'); continue; }
  if (res.goals.length > 12) { rej('too many assignments'); continue; }
  // the final arrangement: tidy, and no settled cable over a device
  let okFinal = false, usedG = null;
  for (const g of res.goals) {
    if (R.railGoalCrossings(L, g.st) !== 0) continue;
    R.syncRails(L, g.st);
    let over = false;
    for (const p of L.plugs) {
      const sk = L.socketsById[g.st.seat[p.id]];
      const pts = arc(p.device.port, sk, p.device.len, P.sc * p.device.curl / p.device.curl); // settleCurl applies to all
      for (const q of pts) if (q.x < 6 || q.x > 354 || q.y < 20 || q.y > 548) over = true;
      if (overDevices(L, pts, p.device.id)) over = true;
    }
    if (!over) { okFinal = true; usedG = g; break; }
  }
  R.syncRails(L, R.newState(L));
  if (!okFinal) { rej('final arcs'); continue; }
  const luck = R.luckRail(L, 300, 7, 60);
  if (luck > 0.5) { rej('luck'); continue; }
  results.push({ P, gd: gdi, decoy: decoyD[0], assigns: res.goals.length, luck: +luck.toFixed(2), depth: Math.min(...res.goals.map((g) => g.depth)), bn: info.map((x) => +x.bn.toFixed(2)) });
}
results.sort((a, b) => a.luck - b.luck);
console.log('rejected:', JSON.stringify(REJ));
console.log('kept', results.length);
for (const r of results.slice(0, 6)) console.log(JSON.stringify(r));
