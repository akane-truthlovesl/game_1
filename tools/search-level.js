#!/usr/bin/env node
/* Snug — tools/search-level.js : "the solver as muse".
   Randomly proposes layouts for a level template, keeps only those the validator would love
   (unique solution, tidy-feasible, clear reach margins, low luck score, the obstacle really matters),
   and prints the best with ASCII maps so a human can pick by taste.
   usage: node tools/search-level.js l6 [N] [seed]      (levels are then pasted into src/levels/world1.js) */
'use strict';
const path = require('path');
globalThis.Snug = {};
const S = (p) => require(path.join(__dirname, '..', 'src', p));
['util.js', 'tune.js', 'geom.js', 'rope.js', 'rules.js'].forEach(S);
const G = globalThis.Snug,
  R = G.Rules,
  U = G.U;

const mode = process.argv[2] || 'l6';
const N = parseInt(process.argv[3] || '60000', 10);
const seed = parseInt(process.argv[4] || '1', 10);
const rnd = U.rng(seed);
const ri = (a, b) => a + (b - a) * rnd();
const rr = (a, b, step) => Math.round(ri(a, b) / step) * step;

const grommet = (id, x, y) => ({ id, kind: 'grommet', x, y, slots: 1, pitch: 40, angle: 0, sockets: [{ key: 'any' }] });

function noObstacles(def) {
  return Object.assign({}, def, { obstacles: [] });
}

/* ---------------------------------------------------------------- L6 : Read the Room */
const REJ = {};
const rej = (k) => { REJ[k] = (REJ[k] || 0) + 1; return null; };

// lengths are DERIVED from geometry so reach gaps are clean by construction:
// plug i reaches exactly its k nearest sockets: len = d_k / 0.9, and d_{k+1} must exceed 1.1 * len.
function deriveLengths(def, want) {
  // want: array of desired reach counts (or null for "any clean one"); picks only clean gaps
  const L = R.compile(Object.assign({}, def, { devices: def.devices.map((d) => Object.assign({}, d, { cable: { len: 1000, curl: d.cable.curl } })) }));
  const out = {};
  for (let i = 0; i < L.plugs.length; i++) {
    const p = L.plugs[i];
    const d = L.sockets.map((s) => L.reach[p.id][s.id].needed).sort((a, b) => a - b);
    const options = [];
    for (let k = 1; k <= d.length; k++) {
      const len = Math.ceil(d[k - 1] / 0.9 / 5) * 5;
      if (k < d.length && d[k] < 1.12 * len) continue;
      options.push({ k, len });
    }
    if (!options.length) return null;
    let pick = options.find((o) => o.k === want[i]);
    if (!pick) pick = options[Math.floor(rnd() * options.length)];
    out[p.id] = pick.len;
  }
  return out;
}

// choose collision-free resting positions for every plug (explicit `rest`), or give up
function pickRests(def) {
  const L = R.compile(def);
  const items = [];
  for (const st of L.strips) items.push(R.stripPoly(st));
  for (const o of L.obstacles) items.push(R.obstaclePoly(o));
  for (const d of L.devices) items.push(R.devicePoly(d));
  for (const dev of L.devices) {
    let ok = null;
    for (let t = 0; t < 40 && !ok; t++) {
      const ang = ((rnd() * 70 - 35) * Math.PI) / 180;
      const c = dev.len * (0.45 + rnd() * 0.2);
      const x = dev.port.x + Math.sin(ang) * c,
        y = dev.port.y + Math.cos(ang) * c;
      if (x < 24 || x > 336 || y < 60 || y > 580) continue;
      if (c > dev.len * 0.97 || dev.len / c > 2.3) continue;
      let good = true;
      for (const pl of items) if (G.Geom.pointPolyDist(x, y, pl) < 20) { good = false; break; }
      if (good) ok = { x: Math.round(x), y: Math.round(y) };
    }
    if (!ok) return false;
    def.devices.find((d) => d.id === dev.id).rest = ok;
  }
  return true;
}

function templateL6() {
  const book = { id: 'book', art: 'books', shape: 'rrect', x: rr(110, 250, 5), y: rr(230, 310, 5), w: rr(90, 200, 10), h: rr(36, 50, 2), rot: 0, cr: 10, tall: true };
  // sockets: each independently either "tucked behind the book" (big detour) or somewhere in the lower field
  const sock = (id, lo, hi) => {
    if (rnd() < 0.55) {
      const x = rr(Math.max(44, book.x - book.w / 2 - 20), Math.min(316, book.x + book.w / 2 + 20), 5);
      const y = rr(book.y + book.h / 2 + 34, book.y + book.h / 2 + 100, 5);
      return grommet(id, x, y);
    }
    return grommet(id, rr(lo, hi, 5), rr(320, 520, 5));
  };
  const socks = [sock('S1', 44, 150), sock('S2', 110, 250), sock('S3', 210, 316)];
  const mk = (id, x, curl, color) => ({ id, type: 'phone', x, y: 120, color, cable: { len: 300, curl }, plug: { key: 'any' }, rest: { x, y: 300 } });
  const def = {
    id: 6, act: 1, name: 'Read the Room', cls: 'puzzle', dawn: 0.5, par: 3, tidy: true,
    obstacles: [book],
    strips: socks,
    devices: [mk('a', 60, 1, 'coral'), mk('b', 180, -1, 'sky'), mk('c', 300, 1, 'mint')],
  };
  // structure first (cheap reject)
  const L0 = R.compile(def);
  for (const m of R.checkLayout(L0)) if (m.startsWith('overlap') || m.startsWith('out of')) return null;
  const perm = [1, 2, 3].sort(() => rnd() - 0.5);
  const lens = deriveLengths(def, perm);
  if (!lens) return null;
  for (const d of def.devices) d.cable.len = lens[d.id];
  if (!pickRests(def)) return null;
  return def;
}

function evalL6(def) {
  if (!def) return rej('no-lengths');
  const L = R.compile(def);
  if (R.checkLayout(L).length) return rej('layout');
  const sols = R.solveAll(L, { cap: 20 });
  if (sols.length !== 1) return rej('solutions!=1 (' + (sols.length === 0 ? 'none' : 'many') + ')');
  if (R.solutionCrossings(L, sols[0]) !== 0) return rej('not tidy');
  if (R.ambiguousReach(L).length) return rej('ambiguous');
  for (const p of L.plugs) if (L.reach[p.id][sols[0][p.id]].ratio > R.CFG.reachDesign) return rej('margin');
  // the obstacle must matter: a plug that looks able to reach a socket by straight line but not by route
  const L0 = R.compile(noObstacles(def));
  let traps = 0;
  const trapList = [];
  for (const p of L.plugs)
    for (const s of L.sockets) {
      const a = L0.reach[p.id][s.id].ratio,
        b = L.reach[p.id][s.id].ratio;
      if (a <= 1.0 && b >= 1.1) { traps++; trapList.push(p.id + '→' + s.id); }
    }
  if (!traps) return rej('no trap');
  const sols0 = R.solveAll(L0, { cap: 20 });
  const same = sols0.length === 1 && JSON.stringify(sols0[0]) === JSON.stringify(sols[0]);
  if (same) return rej('obstacle changes nothing');
  const luck = R.luck(L, 1500, 77);
  if (luck > 0.55) return rej("luck");
  let score = 100 - luck * 100 + traps * 8;
  const ss = def.strips;
  const spread = Math.min(Math.hypot(ss[0].x - ss[1].x, ss[0].y - ss[1].y), Math.hypot(ss[1].x - ss[2].x, ss[1].y - ss[2].y));
  score += Math.min(spread, 120) / 6;
  score += Math.min(def.obstacles[0].w, 160) / 8;
  return { score, luck, traps, trapList, sols0: sols0.length, ratios: L.plugs.map((p) => L.reach[p.id][sols[0][p.id]].ratio.toFixed(2)).join(' ') };
}

/* ---------------------------------------------------------------- L10 : Morning Rush (boss) */
function templateL10() {
  const strip = (id, x, y, n, keys, o) => Object.assign({ id, x, y, slots: n, pitch: 40, angle: 0, sockets: keys.map((k) => (k === 'x' ? { key: 'any', dead: true } : { key: k })) }, o || {});
  const aKeys = ['any', 'any', 'any', 'any', 'any'];
  const deadAt = [null, 1, 3][Math.floor(rnd() * 3)]; // slot index (0-based) of the sooty socket, or none
  if (deadAt !== null) aKeys[deadAt] = 'x';
  const bKeys = ['coral', 'sky', 'any'].sort(() => rnd() - 0.5);
  const mug = { id: 'mug', art: 'mug', shape: 'circle', x: rr(60, 110, 5), y: rr(290, 400, 5), r: 27, tall: true };
  const dev = (id, type, x, y, color, key, size, curl) => ({ id, type, x, y, color, cable: { len: 300, curl }, plug: { key, size: size || 'slim' }, rest: { x, y: y + 150 } });
  const def = {
    id: 10, act: 1, name: 'Morning Rush', cls: 'boss', dawn: 1.0, par: 5, tidy: true,
    obstacles: [mug],
    strips: [strip('A', 128, 478, 5, aKeys), strip('B', 196, 352, 3, bKeys, { switch: { on: false } })],
    devices: [
      dev('boxy', 'laptop', 64, 116, 'sky', 'any', 'fat', 1),
      dev('pipa', 'phone', 150, 122, 'coral', 'coral', 'slim', -1),
      dev('pipb', 'phone', 214, 122, 'sky', 'sky', 'slim', 1),
      dev('gus', 'console', 298, 126, 'violet', 'any', 'fat', -1),
      dev('lumi', 'lamp', 320, 246, 'amber', 'any', 'slim', 1),
    ],
  };
  const L0 = R.compile(def);
  for (const m of R.checkLayout(L0)) if (m.startsWith('overlap') || m.startsWith('out of')) return null;
  const want = [0, 0, 0, 0, 0].map(() => 1 + Math.floor(rnd() * 8));
  const lens = deriveLengths(def, want);
  if (!lens) return null;
  for (const d of def.devices) d.cable.len = lens[d.id];
  if (!pickRests(def)) return null;
  return def;
}
function evalL10(def) {
  if (!def) return rej('no-lengths/rest');
  const L = R.compile(def);
  const lay = R.checkLayout(L);
  if (lay.length) return rej('layout');
  const sols = R.solveAll(L, { cap: 60 });
  if (sols.length < 1 || sols.length > 12) return rej('solutions ' + (sols.length === 0 ? 'none' : 'too many'));
  // pick the best tidy solution
  const tidyIdx = sols.findIndex((m) => R.solutionCrossings(L, m) === 0);
  if (tidyIdx < 0) return rej('not tidy');
  if (tidyIdx > 0) { const t = sols[tidyIdx]; sols.splice(tidyIdx, 1); sols.unshift(t); }
  if (R.ambiguousReach(L).length) return rej('ambiguous');
  for (const p of L.plugs) if (L.reach[p.id][sols[0][p.id]].ratio > R.CFG.reachDesign) return rej('margin');
  const luck = R.luck(L, 2500, 91);
  if (luck > 0.2) return rej('luck');
  // taste: all five plugs must be forced into *different* roles: both strips used, a brick near a dead socket if any
  const used = new Set(L.plugs.map((p) => L.socketsById[sols[0][p.id]].strip.id));
  if (used.size < 2) return rej('one strip only');
  let score = 100 - luck * 200 - sols.length;
  const dead = def.strips[0].sockets.findIndex((k) => k.dead) >= 0;
  if (dead) score += 12;
  const aPlugs = L.plugs.filter((p) => L.socketsById[sols[0][p.id]].strip.id === 'A').length;
  score += aPlugs === 3 ? 8 : 0;
  return { score, luck, traps: 0, trapList: [], sols0: 1, ratios: L.plugs.map((p) => L.reach[p.id][sols[0][p.id]].ratio.toFixed(2)).join(' ') };
}

/* ---------------------------------------------------------------- driver */
const T = { l6: [templateL6, evalL6], l10: [templateL10, evalL10] }[mode];
if (!T) {
  console.error('unknown mode');
  process.exit(2);
}
let best = [];
let seen = 0;
for (let i = 0; i < N; i++) {
  const def = T[0]();
  const r = T[1](def);
  if (!r) continue;
  seen++;
  best.push({ def, r });
  best.sort((a, b) => b.r.score - a.r.score);
  if (best.length > 6) best.pop();
}
console.log('candidates passing every check: ' + seen + ' / ' + N);
console.log('rejections:', JSON.stringify(REJ));
const dump = (d) => JSON.stringify({ obstacles: d.obstacles.map((o) => [o.x, o.y, o.w, o.h]), strips: d.strips.map((s) => [s.id, s.x, s.y]), devices: d.devices.map((v) => [v.id, v.x, v.cable.len, v.cable.curl, v.rest.x, v.rest.y]) });
best.forEach((b, k) => {
  console.log('\n#' + (k + 1) + '  score ' + b.r.score.toFixed(1) + '  luck ' + b.r.luck.toFixed(2) + '  traps ' + b.r.trapList.join(',') + '  (no-obstacle solutions: ' + b.r.sols0 + ')  ratios ' + b.r.ratios);
  console.log('   ' + dump(b.def));
  console.log('   FULL ' + JSON.stringify(b.def));
});
