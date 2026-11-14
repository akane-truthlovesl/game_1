#!/usr/bin/env node
/* Snug — tools/validate-levels.js
   Certifies every level with the SAME rules module the game uses.
   usage:  node tools/validate-levels.js [--verbose] [--map] [--level N]
   Exit code 1 on any hard failure. */
'use strict';
const path = require('path');
globalThis.Snug = {};
const S = (p) => require(path.join(__dirname, '..', 'src', p));
['util.js', 'tune.js', 'geom.js', 'rope.js', 'rules.js'].forEach(S);
S('levels/world1.js');
S('levels/world2.js');
const G = globalThis.Snug;
const R = G.Rules;

const args = process.argv.slice(2);
const verbose = args.includes('--verbose');
const showMap = args.includes('--map') || verbose;
const only = args.includes('--level') ? parseInt(args[args.indexOf('--level') + 1], 10) : null;

const LUCK_TARGET = { intro: 1, breather: 1, teach: 0.55, puzzle: 0.4, hard: 0.2, boss: 0.2, story: 1 };

function asciiMap(L) {
  const W = 72,
    H = 40,
    sx = 360 / W,
    sy = 640 / H;
  const g = [];
  for (let j = 0; j < H; j++) g.push(new Array(W).fill('.'));
  const put = (x, y, ch) => {
    const i = Math.round(x / sx),
      j = Math.round(y / sy);
    if (i >= 0 && i < W && j >= 0 && j < H) g[j][i] = ch;
  };
  const poly = (pl, ch) => {
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const p of pl) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
    for (let y = y0; y <= y1; y += sy / 2) for (let x = x0; x <= x1; x += sx / 2) if (R_in(pl, x, y)) put(x, y, ch);
  };
  const R_in = (pl, x, y) => G.Geom.pointPolyDist(x, y, pl) === 0;
  for (const o of L.obstacles) poly(R.obstaclePoly(o), '#');
  for (const s of L.strips) poly(R.stripPoly(s), '=');
  for (const d of L.devices) poly(R.devicePoly(d), (d.meta.name || 'D')[0]);
  for (const s of L.sockets) put(s.x, s.y, s.dead ? 'x' : s.key === 'any' ? 'o' : s.key[0].toUpperCase());
  for (const d of L.devices) {
    put(d.port.x, d.port.y, '+');
    put(d.rest.x, d.rest.y, 'p');
  }
  return g.map((r) => '   ' + r.join('')).join('\n');
}

let hard = 0,
  warns = 0;
const rows = [];
const levels = G.Levels.filter((d) => only === null || d.id === only);
for (const def of levels) {
  const L = R.compile(def);
  const hardMsgs = [],
    warnMsgs = [];
  const waive = def.waive || [];
  // layout
  for (const m of R.checkLayout(L)) hardMsgs.push(m);
  // resting arcs must fit on the stage (otherwise the physics clamp yanks the chain at load)
  for (const d of L.devices) {
    const n = Math.max(8, Math.min(64, Math.ceil(d.len / G.T.segLen) + 1));
    const ox = new Float64Array(n), oy = new Float64Array(n);
    G.Rope.arcPoints(d.port.x, d.port.y, d.rest.x, d.rest.y, d.len, n, d.curl, ox, oy);
    let bad = false;
    for (let i = 0; i < n; i++) if (ox[i] < -2 || ox[i] > 362 || oy[i] < 0 || oy[i] > 636) bad = true;
    if (bad) hardMsgs.push('resting arc of ' + d.id + ' leaves the stage');
  }
  // solutions (pre-script and post-script)
  const dead0 = {};
  const railLevel = L.rails.length > 0;
  let railInfo = null;
  if (railLevel) {
    // rail levels: search the whole (arrangement x detent) state space instead of enumerating static assignments
    const res = R.solveRail(L);
    const st0 = R.newState(L);
    let bestG = null,
      bestC = 1e9;
    for (const g of res.goals) {
      const c = R.railGoalCrossings(L, g.st);
      if (c < bestC) (bestC = c), (bestG = g);
    }
    R.syncRails(L, st0);
    const gdet = new Set(res.goals.map((g) => L.rails.map((r) => g.st.rail[r.id]).join('/')));
    railInfo = { res, goals: res.goals.length, gdet: [...gdet], tidy: res.goals.filter((g) => R.railGoalCrossings(L, g.st) === 0).length, best: bestG, depth: bestG ? bestG.depth : 0 };
    R.syncRails(L, st0);
    if (!res.goals.length) hardMsgs.push('unsolvable (no arrangement + detent completes the room)');
    if (gdet.size > 1) warnMsgs.push('more than one sweet-spot detent set: ' + [...gdet].join(' | '));
    if (res.goals.some((g) => g.depth === 0)) hardMsgs.push('already solved at the start');
  }
  const sols = railLevel ? (railInfo.best ? [railInfo.best.st.seat] : []) : R.solveAll(L, { dead: dead0, cap: 5000 });
  let postSols = null;
  if (def.script && def.script.deadAfter) {
    const dead = {};
    for (const k of def.script.deadAfter) dead[k] = true;
    postSols = R.solveAll(L, { dead, cap: 5000 });
    if (!postSols.length) hardMsgs.push('unsolvable after the scripted burn-out');
  }
  const useSols = postSols || sols;
  if (!sols.length && !railLevel) hardMsgs.push('unsolvable');
  // tidy
  let tidy = 0,
    bestTidy = null;
  if (railLevel && railInfo.best) {
    for (const g of railInfo.res.goals) if (R.railGoalCrossings(L, g.st) === 0) { tidy++; if (!bestTidy) bestTidy = g.st.seat; }
    R.syncRails(L, R.newState(L));
  }
  for (const m of railLevel ? [] : useSols) {
    const c = R.solutionCrossings(L, m);
    if (c === 0) {
      tidy++;
      if (!bestTidy) bestTidy = m;
    }
  }
  const wantsTidy = (def.rules && def.rules.noCross) || def.tidy;
  if (wantsTidy && !tidy) hardMsgs.push('no tidy (crossing-free) solution exists');
  // reach margin of the best solution
  const best = bestTidy || useSols[0];
  let maxRatio = 0;
  if (railLevel && railInfo.best) {
    // the sweet-spot detent: the intended arrangement should use at most 94% of every cable there
    const g = railInfo.best.st;
    R.syncRails(L, g);
    for (const p of L.plugs) maxRatio = Math.max(maxRatio, L.reach[p.id][g.seat[p.id]].ratio);
    R.syncRails(L, R.newState(L));
  } else if (best) for (const p of L.plugs) maxRatio = Math.max(maxRatio, L.reach[p.id][best[p.id]].ratio);
  if (maxRatio > R.CFG.reachDesign + 1e-9) (waive.includes('margin') ? warnMsgs : hardMsgs).push('intended solution uses ' + (maxRatio * 100).toFixed(1) + '% of a cable (>94%)');
  // the intended tidy solution must stay tidy once its cables settle into arcs (settleCurl), and the arcs must fit
  if (bestTidy && wantsTidy && railLevel) R.syncRails(L, railInfo.best.st);
  if (bestTidy && wantsTidy) {
    const test = (sc) => {
      const arcs = [];
      let ok = true;
      for (const p of L.plugs) {
        const dev = p.device, sk = L.socketsById[bestTidy[p.id]];
        const n = Math.max(8, Math.min(64, Math.ceil(dev.len / G.T.segLen) + 1));
        const ox = new Float64Array(n), oy = new Float64Array(n);
        G.Rope.arcPoints(dev.port.x, dev.port.y, sk.x, sk.y, dev.len, n, sc, ox, oy);
        const pts = [];
        for (let i = 0; i < n; i++) { if (ox[i] < -14 || ox[i] > 374 || oy[i] < 4 || oy[i] > 636) ok = false; pts.push({ x: ox[i], y: oy[i] }); }
        arcs.push(pts);
      }
      let cr = 0;
      for (let i = 0; i < arcs.length; i++) for (let j = i + 1; j < arcs.length; j++) cr += G.Geom.polyCross(arcs[i], arcs[j]);
      return { ok, cr };
    };
    const want = def.settleCurl || 1;
    const r1 = test(want), r2 = test(-want);
    if (!r1.ok || r1.cr) hardMsgs.push('settled arcs of the tidy solution ' + (!r1.ok ? 'leave the stage' : 'cross (' + r1.cr + ')') + ' with settleCurl ' + want + (r2.ok && !r2.cr ? ' — try settleCurl: ' + -want : ''));
  }
  if (railLevel) R.syncRails(L, R.newState(L));
  // rail levels: reach ambiguity is a property of the sweet spot, not of every detent (the strip is felt, not computed)
  const amb = railLevel ? [] : R.ambiguousReach(L);
  if (amb.length) (waive.includes('ambiguousReach') ? warnMsgs : hardMsgs).push('ambiguous reach (barely reaches / barely short): ' + amb.slice(0, 6).join(', ') + (amb.length > 6 ? ' …' : ''));
  // par
  const minSeats = L.plugs.length;
  if (!def.start && def.par < minSeats) hardMsgs.push('par ' + def.par + ' < plugs ' + minSeats);
  // luck
  let luck = null;
  if (!def.start) {
    const preDead = {};
    luck = railLevel ? R.luckRail(L, 600, def.id * 7919, 60) : R.luck(L, 4000, def.id * 7919);
    const tgt = LUCK_TARGET[def.cls || 'puzzle'];
    if (luck > tgt + 1e-9) (waive.includes('luck') ? warnMsgs : hardMsgs).push('p_luck ' + luck.toFixed(2) + ' exceeds target ' + tgt + ' for class ' + def.cls);
  }
  // par for pre-seated starts: follow hints until complete
  let hintPar = null;
  if (def.start) {
    const st = R.newState(L);
    let seats = 0,
      steps = 0;
    for (; steps < 40; steps++) {
      if (R.complete(L, st, 0)) break;
      const h = R.hint(L, st);
      if (!h) break;
      if (h.type === 'seat') { st.seat[h.plug] = h.socket; seats++; }
      else if (h.type === 'unseat') st.seat[h.plug] = null;
      else if (h.type === 'switch') st.sw[h.strip] = true;
    }
    hintPar = seats;
    if (!R.complete(L, st, 0)) hardMsgs.push('hint did not reach completion from the start state');
    if (def.par < hintPar) warnMsgs.push('par ' + def.par + ' < hint-derived seats ' + hintPar);
  }
  hard += hardMsgs.length;
  warns += warnMsgs.length;
  rows.push({
    id: def.id,
    name: def.name,
    cls: def.cls,
    plugs: L.plugs.length,
    sockets: L.sockets.length,
    sols: railLevel ? railInfo.goals + '@' + railInfo.gdet.join('|') : postSols ? sols.length + '→' + postSols.length : sols.length,
    tidy,
    margin: (maxRatio * 100).toFixed(0) + '%',
    luck: luck === null ? '—' : luck.toFixed(2),
    par: def.par + (hintPar !== null ? ' (hint ' + hintPar + ')' : railLevel ? ' (steps ' + railInfo.depth + ')' : ''),
    status: hardMsgs.length ? 'FAIL' : warnMsgs.length ? 'warn' : 'ok',
  });
  if (hardMsgs.length || warnMsgs.length || verbose || showMap) {
    console.log('\n── Level ' + def.id + ' · ' + def.name + '  [' + def.cls + ']  ' + (def.intent || ''));
    hardMsgs.forEach((m) => console.log('   ✗ ' + m));
    warnMsgs.forEach((m) => console.log('   ! ' + m));
    if (verbose) {
      console.log('   reach ratios (needed/len): rows = plugs, cols = sockets');
      console.log('   ' + ' '.repeat(10) + L.sockets.map((s) => s.id.padStart(6)).join(''));
      for (const p of L.plugs)
        console.log('   ' + p.id.padEnd(10) + L.sockets.map((s) => (L.reach[p.id][s.id].ratio.toFixed(2) + (Rules_fits(p, s) ? ' ' : '*')).padStart(6)).join('') + '   len ' + p.device.len);
      const some = useSols.slice(0, 4).map((m) => L.plugs.map((p) => p.id + '→' + m[p.id]).join(' '));
      console.log('   solutions (first ' + some.length + '): \n     ' + some.join('\n     '));
    }
    if (showMap) console.log(asciiMap(L));
  }
}
function Rules_fits(p, s) {
  return R.fits(p, s) && !s.dead;
}

console.log('\n' + 'id'.padEnd(4) + 'name'.padEnd(18) + 'class'.padEnd(10) + 'plugs sock  sols    tidy  margin  luck  par          status');
for (const r of rows)
  console.log(String(r.id).padEnd(4) + r.name.padEnd(18) + String(r.cls).padEnd(10) + String(r.plugs).padStart(5) + String(r.sockets).padStart(5) + '  ' + String(r.sols).padEnd(7) + String(r.tidy).padEnd(6) + r.margin.padEnd(8) + String(r.luck).padEnd(6) + String(r.par).padEnd(13) + r.status);
console.log('\n' + (hard ? hard + ' hard failure(s)' : 'no hard failures') + ', ' + warns + ' warning(s)');
process.exit(hard ? 1 : 0);
