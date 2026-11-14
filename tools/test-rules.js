#!/usr/bin/env node
/* Snug — tools/test-rules.js : fast checks of the rules module (no browser, no dependencies).
   usage: node tools/test-rules.js */
'use strict';
const path = require('path');
globalThis.Snug = {};
const S = (p) => require(path.join(__dirname, '..', 'src', p));
['util.js', 'tune.js', 'geom.js', 'rope.js', 'rules.js'].forEach(S);
S('levels/world1.js');
S('levels/world2.js');
const G = globalThis.Snug,
  R = G.Rules,
  Geom = G.Geom;

let pass = 0,
  fail = 0;
const t = (name, cond, extra) => {
  if (cond) pass++;
  else {
    fail++;
    console.log('FAIL  ' + name + (extra ? '  ' + extra : ''));
  }
};
const lv = (id) => R.compile(G.Levels.find((l) => l.id === id));

/* ---- compatibility ---- */
{
  const L = lv(4);
  const coral = L.plugsById.a,
    sky = L.plugsById.b;
  const coralSock = L.socketsById['A.1'],
    skySock = L.socketsById['A.2'],
    joker = L.socketsById['A.5'];
  t('coral fits coral', R.fits(coral, coralSock));
  t('coral does not fit sky', !R.fits(coral, skySock));
  t('joker takes anything', R.fits(sky, joker) && R.fits(coral, joker));
  const st = R.newState(L);
  t('wrong key is refused with a reason', R.canSeat(L, st, 'a', 'A.2').why === 'key');
  t('the odd coral out may use the joker (its home socket is out of reach or taken)', R.canSeat(L, st, 'e', 'A.5').ok);
  const sol = R.solveAll(L);
  t('level 4: the joker goes to a coral and everything else finds its own colour', sol.length >= 1 && sol.every((m) => m.e === 'A.5' && m.a === 'A.1' && m.b === 'A.2' && m.c === 'A.3' && m.d === 'A.4'));
}

/* ---- reach: the cable is the teacher ---- */
{
  const L = lv(3);
  const st = R.newState(L);
  t('short cable reaches only the near grommet', R.canSeat(L, st, 'a', 'N.1').ok && R.canSeat(L, st, 'a', 'M.1').why === 'reach' && R.canSeat(L, st, 'a', 'F.1').why === 'reach');
  t('medium reaches near and mid, not far', R.canSeat(L, st, 'b', 'M.1').ok && R.canSeat(L, st, 'b', 'F.1').why === 'reach');
  t('long reaches all three', ['N.1', 'M.1', 'F.1'].every((s) => R.canSeat(L, st, 'c', s).ok));
  const sols = R.solveAll(L);
  t('level 3 has exactly one solution: shortest cable first', sols.length === 1 && sols[0].a === 'N.1' && sols[0].b === 'M.1' && sols[0].c === 'F.1');
}

/* ---- obstacles cost length (geodesics) ---- */
{
  const ob = [{ shape: 'rrect', x: 180, y: 300, w: 160, h: 40, rot: 0, cr: 8, tall: true }];
  const straight = Math.hypot(0, 200);
  const g = Geom.shortest({ x: 180, y: 200 }, { x: 180, y: 400 }, ob, 4);
  t('a wall in the way makes the route longer than the chord', g.len > straight + 20 && g.pts.length > 2, g.len.toFixed(0));
  const g2 = Geom.shortest({ x: 10, y: 200 }, { x: 10, y: 400 }, ob, 4);
  t('a clear route is the straight line', Math.abs(g2.len - 200) < 0.5);
  const L = lv(6);
  const st = R.newState(L);
  t('level 6: the book makes the nearest socket unreachable for b', R.canSeat(L, st, 'b', 'S2.1').why === 'reach');
  t('level 6: the long cable can go around', R.canSeat(L, st, 'c', 'S2.1').ok);
  const sols = R.solveAll(L);
  t('level 6 has exactly one tidy solution', sols.length === 1 && R.solutionCrossings(L, sols[0]) === 0);
}

/* ---- footprints: a brick covers its neighbours ---- */
{
  const L = lv(7);
  const st = R.newState(L);
  t('fat plug footprint in the middle covers three slots', R.footprint(L.plugsById.boxy, L.socketsById['A.3']).join() === '2,3,4');
  t('fat plug at an end covers two', R.footprint(L.plugsById.boxy, L.socketsById['A.1']).join() === '1,2');
  st.seat.boxy = 'A.3';
  t('a socket next to a seated brick is COVERED', R.canSeat(L, st, 'pipa', 'A.2').why === 'covered' && R.canSeat(L, st, 'pipa', 'A.4').why === 'covered');
  t('a socket beyond the brick is free', R.canSeat(L, st, 'pipa', 'A.5').ok);
  t('a second brick overlapping the first is refused', ['overlap', 'covered', 'taken'].includes(R.canSeat(L, st, 'gus', 'A.5').why));
  st.seat.boxy = null;
  const sols = R.solveAll(L);
  t('bricks belong at the ends: every solution puts a brick on slot 1 and the other on 6', sols.length > 0 && sols.every((m) => [m.boxy, m.gus].sort().join() === 'A.1,A.6'));
}

/* ---- dead sockets and the Power Cut ---- */
{
  const L = lv(8);
  const dead = { 'A.3': true };
  t('before the cut level 8 has solutions', R.solveAll(L).length > 0);
  const after = R.solveAll(L, { dead });
  t('after the cut it is still solvable and the dead socket is never used', after.length > 0 && after.every((m) => Object.values(m).every((s) => s !== 'A.3')));
  const st = R.newState(L);
  st.dead['A.3'] = true;
  t('seating into a dead socket reports dead', R.canSeat(L, st, 'pipa', 'A.3').why === 'dead');
  t('a brick may cover a dead socket for free', (() => { const s2 = R.newState(L); s2.dead['A.3'] = true; return R.canSeat(L, s2, 'boxy', 'A.2').ok && R.footprint(L.plugsById.boxy, L.socketsById['A.2']).includes(3); })());
}

/* ---- switches and power ---- */
{
  const L = lv(5);
  const st = R.newState(L);
  st.seat.a = 'A.1';
  t('plugged into an OFF strip = standby, not awake', R.power(L, st).a === 'standby');
  st.sw.A = true;
  t('flipping the switch wakes it', R.power(L, st).a === 'on');
  t('an unplugged device is off', R.power(L, st).b === 'off');
  t('not complete until everything is awake', !R.complete(L, st, 0));
}

/* ---- the tangle (level 9) and hints ---- */
{
  const L = lv(9);
  const st = R.newState(L);
  t('level 9 starts pre-seated', Object.values(st.seat).filter(Boolean).length === 5);
  t('the start is a tangle (crossings)', R.solutionCrossings(L, st.seat) >= 4);
  let steps = 0;
  for (; steps < 30 && !R.complete(L, st, 0); steps++) {
    const h = R.hint(L, st);
    if (!h) break;
    if (h.type === 'seat') st.seat[h.plug] = h.socket;
    else if (h.type === 'unseat') st.seat[h.plug] = null;
    else if (h.type === 'switch') st.sw[h.strip] = true;
  }
  t('following hints from the tangle reaches a tidy, powered room', R.complete(L, st, 0) && R.solutionCrossings(L, st.seat) === 0, 'steps ' + steps);
}

/* ---- luck score is honest ---- */
{
  const l3 = R.luck(lv(3), 800, 5),
    l7 = R.luck(lv(7), 800, 5),
    l10 = R.luck(lv(10), 800, 5);
  t('puzzle levels are not solved by luck (L7 < 0.2, L10 < 0.25)', l7 < 0.2 && l10 < 0.25, l7.toFixed(2) + ' ' + l10.toFixed(2));
  t('the teaching level is gentler than the boss', l3 > l10);
}

/* ---- kinematic strips (rails): level 11 ---- */
{
  const L = lv(11);
  const strip = L.rails[0];
  t('rail: the level has one sliding strip with 5 detents', L.rails.length === 1 && strip.rail.detents.length === 5);
  t('rail: sockets move with the strip', (() => { const x0 = L.sockets[0].x; R.setStripK(strip, 0.5); const x1 = L.sockets[0].x; R.setStripK(strip, strip.rail.detents[strip.rail.start]); return Math.abs(x1 - x0) > 40; })());
  const res = R.solveRail(L);
  t('rail: solvable, and only at the middle detent', res.goals.length > 0 && res.goals.every((g) => g.st.rail.R === 2), res.goals.map((g) => g.st.rail.R).join());
  t('rail: the start is not already a solution', !res.goals.some((g) => g.depth === 0));
  // a seated cable limits the slide: Gus (short cable) seated at the right end blocks sliding to the far left
  const st = R.newState(L);
  st.seat.gus = 'R.4';
  t('rail: a short seated cable stops the strip before the far end', !R.railSpanOK(L, st, strip, strip.rail.detents[4], 0) && R.railSpanOK(L, st, strip, strip.rail.detents[4], strip.rail.detents[3]));
  // a moving strip refuses plugs; a resting one takes them
  const st2 = R.newState(L);
  st2.flags.moving = { R: true };
  t('rail: a moving strip refuses a plug (reason: moving)', R.canSeat(L, st2, 'lux', 'R.2').why === 'moving');
  st2.flags.moving = { R: false };
  t('rail: a resting strip takes a plug that reaches', R.canSeat(L, st2, 'lux', 'R.2').ok);
  // reach is per detent: the same plug cannot reach the same socket from the wrong detent
  R.applyDetent(L, st2, 'R', 0);
  const farLeft = R.canSeat(L, st2, 'gus', 'R.1');
  R.applyDetent(L, st2, 'R', 4);
  t('rail: reach follows the strip (Gus cannot reach the far-left socket at detent 0)', !farLeft.ok && farLeft.why === 'reach');
  const h = R.hint(L, R.newState(L));
  t('rail: the hint is a legal first action', h && (h.type === 'seat' || h.type === 'slide'), JSON.stringify(h && h.type));
  // the plan: follow hints from the start until the room is complete
  const stp = R.newState(L);
  let steps = 0;
  for (; steps < 20 && !R.complete(L, stp, 0); steps++) {
    const a = R.hint(L, stp);
    if (!a) break;
    if (a.type === 'seat') stp.seat[a.plug] = a.socket;
    else if (a.type === 'unseat') stp.seat[a.plug] = null;
    else if (a.type === 'slide') R.applyDetent(L, stp, a.strip, a.to);
  }
  t('rail: following the hints completes the level', R.complete(L, stp, 0) && steps <= 8, 'steps ' + steps);
  R.syncRails(L, R.newState(L));
}

/* ---- every level is certified ---- */
for (const def of G.Levels) {
  const L = R.compile(def);
  const dead = {};
  if (def.script) for (const k of def.script.deadAfter) dead[k] = true;
  if (L.rails.length) t('level ' + def.id + ' is solvable', R.solveRail(L).goals.length > 0);
  else t('level ' + def.id + ' is solvable', R.solveAll(L, { dead }).length > 0);
  t('level ' + def.id + ' has a clean layout', R.checkLayout(L).length === 0, R.checkLayout(L).join('; '));
}

console.log((fail ? fail + ' FAILED, ' : 'all ') + pass + ' passed');
process.exit(fail ? 1 : 0);
