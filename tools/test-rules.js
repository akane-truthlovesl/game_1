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
S('levels/world3.js');
S('levels/world4.js');
S('levels/world5.js');
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
  // a seated cable limits the slide: Dot (short cable) seated at the left end blocks sliding to the far right
  const st = R.newState(L);
  st.seat.dot = 'R.1';
  t('rail: a short seated cable stops the strip before the far end', !R.railSpanOK(L, st, strip, strip.rail.detents[0], 1) && R.railSpanOK(L, st, strip, strip.rail.detents[0], strip.rail.detents[1]));
  // a moving strip refuses plugs; a resting one takes them
  const st2 = R.newState(L);
  st2.flags.moving = { R: true };
  t('rail: a moving strip refuses a plug (reason: moving)', R.canSeat(L, st2, 'dot', 'R.1').why === 'moving');
  st2.flags.moving = { R: false };
  t('rail: a resting strip takes a plug that reaches', R.canSeat(L, st2, 'dot', 'R.1').ok);
  // reach is per detent: the same plug cannot reach the same socket from the wrong detent
  R.applyDetent(L, st2, 'R', 4);
  const farRight = R.canSeat(L, st2, 'dot', 'R.1');
  R.applyDetent(L, st2, 'R', 0);
  t('rail: reach follows the strip (Dot cannot reach the far-right strip at detent 4)', !farRight.ok && farRight.why === 'reach');
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

/* ---- timer sockets (Level 18) ---- */
{
  const L = lv(18);
  const A1 = L.socketsById['A.1'], A3 = L.socketsById['A.3'];
  const st = R.newState(L);
  t('timer: with no clock running, windows are ignored (solver/validator/luck see an ordinary room)', R.opensIn(st, A1) === 0 && R.canSeat(L, st, 'kettle', 'A.1').ok);
  st.flags.clock = 0.5; // A.1 (phase 0, on 1.9, period 4.8) is open; A.3 (phase 2.4) opens in 1.9 s
  t('timer: an open window accepts a plug', R.opensIn(st, A1) === 0 && R.canSeat(L, st, 'kettle', 'A.1').ok);
  t('timer: a window that opens later than the grace refuses (why: closed, with opensIn)', (() => { const c = R.canSeat(L, st, 'kettle', 'A.3'); return !c.ok && c.why === 'closed' && Math.abs(c.opensIn - 1.9) < 1e-6; })());
  st.flags.clock = 2.4 - 0.5; // 0.5 s before A.3 opens: inside the 0.8 s grace
  t('timer: a window within the grace accepts the plug (it waits for the opening)', R.canSeat(L, st, 'kettle', 'A.3').ok && Math.abs(R.opensIn(st, A3) - 0.5) < 1e-6);
  st.flags.clock = 2.4 + 5; // windows repeat every 4.8 s
  t('timer: windows repeat (clock 7.4 = 2.6 into the cycle: A.3 is open)', R.opensIn(st, A3) === 0);
  t('timer: the solver finds every tidy assignment regardless of windows', R.solveAll(L, {}).length === 24);
  const hint = R.hint(L, Object.assign(R.newState(L), { flags: Object.assign({}, st.flags, { clock: 3.3 }) }));
  t('timer: the hint is a seat that carries a wait when its window is closed', hint && hint.type === 'seat' && (hint.wait === undefined || hint.wait > 0));
}

/* ---- the boss (Level 20): a daisy chain draws through the first strip ---- */
{
  const L = lv(20);
  const st = R.newState(L);
  const seat = (m) => Object.keys(m).forEach((k) => (st.seat[k] = m[k]));
  seat({ kettle: 'A.2', toasty: 'B.3', static: 'B.2', lux: 'B.1' });
  t('chain: before the cord is plugged in, strip B draws nothing through A', R.load(L, st, L.stripsById.A) === 3 && R.load(L, st, L.stripsById.B) === 5);
  seat({ cordB: 'A.3' });
  t('chain: once fed, B draws through A (3 + 5 = 8, exactly the cap)', R.load(L, st, L.stripsById.A) === 8 && R.load(L, st, L.stripsById.B) === 5);
  seat({ dryer: 'A.1' });
  t('chain: a helper on A pushes the whole chain over the cap (10 > 8)', R.load(L, st, L.stripsById.A) === 10 && R.load(L, st, L.stripsById.A) > L.stripsById.A.cap);
  const sols = R.solveAll(L, {});
  t('boss: exactly one arrangement is legal (keys and reach force it)', sols.length === 1 && sols[0].cordB === 'A.3' && sols[0].kettle === 'A.2' && sols[0].dot === 'W.1');
  const h0 = R.hint(L, R.newState(L));
  t('boss: the plan starts with the helper on a live strip, not with the wet socket', h0 && h0.type === 'seat' && h0.plug === 'dryer' && L.socketsById[h0.socket].strip.id === 'A');
  const h1 = R.hint(L, Object.assign(R.newState(L), { seat: { dryer: 'A.1' }, dry: { 'W.1': true } }));
  t('boss: once the puddle is dry the helper leaves', h1 && h1.type === 'unseat' && h1.plug === 'dryer');
}

/* ---- carried strips (Level 21, the snail) ---- */
{
  const L = lv(21);
  const strip = L.carried[0];
  const home = { x: strip.x, y: strip.y };
  t('carry: the strip starts where the snail does and its dock is a legal arrangement', R.solveAll(L, {}).length === 1);
  const road = R.carryRoad(L, strip, home, strip.carrier.dock);
  const ko = R.carryKeepOut(L, strip)[0];
  t('carry: the geodesic road never enters the river', road.every((q) => !(q.x > ko.x - ko.w / 2 && q.x < ko.x + ko.w / 2 && q.y > ko.y - ko.h / 2 && q.y < ko.y + ko.h / 2)));
  t('carry: with nothing plugged in, any road is fine', R.carryWalkOK(L, strip, road, {}).ok);
  t('carry: the lamp plugged in, the road to the dock is walkable', R.carryWalkOK(L, strip, road, { lux: 'S.1' }).ok);
  const past = road.concat([{ x: 262, y: 250 }]);
  const w = R.carryWalkOK(L, strip, past, { lux: 'S.1' });
  t('carry: with the lamp plugged in, a road past the dock stalls beyond the deck (the cable is the tether)', !w.ok && w.at > road.reduce((n, q, i) => (i ? n + Math.hypot(q.x - road[i - 1].x, q.y - road[i - 1].y) : 0), 0) && w.at < 260, JSON.stringify(w));
  const st = R.newState(L);
  const h0 = R.hint(L, st);
  t('carry: the first hint plugs the lamp (it is next to the snail and survives the walk)', h0 && h0.type === 'seat' && h0.plug === 'lux');
  st.seat.lux = 'S.1';
  const h1 = R.hint(L, st);
  t('carry: then it draws the road to the dock', h1 && h1.type === 'draw' && h1.pts.length >= 2);
  t('carry: the strip is back where it started after every check (checks never move it)', strip.x === home.x && strip.y === home.y);
}

/* ---- Biscuit as a mechanic (Level 22) ---- */
{
  const L = lv(22);
  const st = R.newState(L);
  st.flags.blocked = { 'A.2': true };
  st.flags.cat = { x: 180, y: 402, state: 'sit' };
  t('herd: a socket the cat sits on refuses a plug (why: cat)', R.canSeat(L, st, 'static', 'A.2').why === 'cat');
  t('herd: a different socket does not care that she is on A.2', R.canSeat(L, st, 'lux', 'A.1').ok);
  st.seat.lux = 'A.1';
  st.seat.dot = 'A.3';
  const h = R.hint(L, st);
  t('herd: when the plan needs the socket she sits on, the hint is to lure her (to the far corner, from where she is)', h && h.type === 'lure' && h.socket === 'A.2' && h.to.x === L.def.herd.lure.x && h.from.x === 180);
  st.flags.blocked = {};
  const h2 = R.hint(L, st);
  t('herd: once she has left the socket the hint is simply to plug in', h2 && h2.type === 'seat' && h2.plug === 'static');
}

/* ---- the toy train (Level 23) ---- */
{
  const L = lv(23);
  const strip = L.carried[0];
  const T = strip.carrier.track;
  const seat = { dot: 'S.1', static: 'S.2', lux: 'S.3' };
  t('track: with every cable plugged the shared stretch is walkable', R.trackSafe(L, { seat }, strip, 'shared', seat).ok);
  t('track: ... and so is the small loop', R.trackSafe(L, { seat }, strip, 'small', seat).ok);
  const big = R.trackSafe(L, { seat }, strip, 'big', seat);
  t('track: ... but the big loop leaves a cable\'s reach early (the red track)', !big.ok && big.at < 80, JSON.stringify(big));
  t('track: with nothing plugged in every loop is fine', ['shared', 'small', 'big'].every((id) => R.trackSafe(L, { seat: {} }, strip, id, {}).ok));
  const v = R.verifyTrack(L);
  t('track: exactly one branch is safe with everything plugged (the small loop)', v.ok && v.safe === 'small', JSON.stringify(v));
  const st = R.newState(L);
  st.flags.track = { points: 'big', lever: 'go', stopped: false, seg: 'shared' };
  const h0 = R.hint(L, st);
  t('track: the first hint sets the points to the safe loop', h0 && h0.type === 'points' && h0.to === 'small');
  st.flags.track.points = 'small';
  const h1 = R.hint(L, st);
  t('track: then it puts the lever to STOP so the train waits at the station', h1 && h1.type === 'lever' && h1.to === 'stop');
  st.flags.track.lever = 'stop';
  st.flags.track.stopped = true;
  const h2 = R.hint(L, st);
  t('track: standing at the station it plugs the cables in', h2 && h2.type === 'seat');
  st.seat = Object.assign({}, seat);
  const h3 = R.hint(L, st);
  t('track: with everything plugged it lets the train go (the dynamo needs it rolling)', h3 && h3.type === 'lever' && h3.to === 'go');
  t('track: a dynamo strip is dead while the train has not charged it, and a latched room stays awake',
    !R.energized(L, { seat, flags: { carryMoving: { S: false } }, sw: {}, dead: {} }, strip) && R.energized(L, { seat, flags: { latched: true }, sw: {}, dead: {} }, strip));
}

/* ---- the wind-up toy (Level 24) ---- */
{
  const L = lv(24);
  const strip = L.carried[0];
  const C = strip.carrier;
  const home = { x: strip.x, y: strip.y };
  const U = R.WIND_UNIT;
  const free = R.windSim(strip, { x: 110, y: 250 }, 0, 2);
  t('wind: with room ahead the toy walks straight for clicks x the wind unit and keeps its heading',
    Math.abs(free.len - 2 * U) < 4.01 && Math.abs(free.end.y - 250) < 1e-6 && Math.abs(free.end.x - (110 + free.len)) < 1e-6 && Math.abs(free.end.h) < 1e-9 && free.bumps.length === 0, JSON.stringify(free.end));
  const bump = R.windSim(strip, home, -Math.PI / 2, 8);
  t('wind: into a wall it turns right (clockwise) and goes on with the wind it has left', Math.abs(bump.len - 8 * U) < 5 && bump.end.h > -Math.PI / 2 + 1.5 && bump.pts.length > 6, JSON.stringify([bump.len, bump.end]));
  t('wind: every turn is reported as a bump at the corner it happened at', bump.bumps.length >= 1 && bump.bumps.every((b) => b.d >= 0 && b.d <= bump.len + 1e-6) && bump.bumps.length === Math.round((bump.end.h - -Math.PI / 2) / (Math.PI / 2)), JSON.stringify(bump.bumps));
  // whatever the aim and the wind, the toy never leaves the mat and never enters a wall
  let leaked = 0, inside = 0, walks = 0;
  for (let a = 0; a < R.WIND_AIMS; a++) {
    const aim = (a / R.WIND_AIMS) * 2 * Math.PI - Math.PI;
    for (let k = 1; k <= C.maxClicks; k++) {
      const w = R.windSim(strip, home, aim, k);
      walks++;
      for (const q of w.pts) {
        if (q.x - C.hx < 20 - 1e-6 || q.x + C.hx > 340 + 1e-6 || q.y - C.hy < 46 - 1e-6 || q.y + C.hy > 614 + 1e-6) leaked++;
        for (const b of C.walls) if (q.x + C.hx > b.x - b.w / 2 + 1e-6 && q.x - C.hx < b.x + b.w / 2 - 1e-6 && q.y + C.hy > b.y - b.h / 2 + 1e-6 && q.y - C.hy < b.y + b.h / 2 - 1e-6) inside++;
      }
    }
  }
  t('wind: ' + walks + ' aim-and-wind walks from the start never leave the mat', leaked === 0, leaked + ' points outside');
  t('wind: ... and never enter a block or a device', inside === 0, inside + ' points inside');
  t('wind: at the start no cable reaches (the toy has to be carried to the dock)', !R.windAtDock(L, strip, home.x, home.y));
  const v = R.verifyWind(L);
  t('wind: verifyWind finds a plan of up to four walks', v.ok && v.plan.length >= 2 && v.plan.length <= 4, JSON.stringify(v.why));
  if (v.ok) {
    let chain = true, from = home;
    for (const stp of v.plan) {
      const w = R.windSim(strip, from, stp.aim, stp.clicks);
      if (Math.hypot(w.end.x - stp.to.x, w.end.y - stp.to.y) > 1e-6 || Math.hypot(stp.from.x - from.x, stp.from.y - from.y) > 1e-6) chain = false;
      from = w.end;
    }
    t('wind: the plan is a chain: each walk starts where the last one ended and ends where it says', chain);
    t('wind: ... and its last stop is a place where every cable reaches (and the cables settle without crossing)', R.windGoal(L, strip, from.x, from.y));
    t('wind: the plan does not park the toy on the dock by luck on the first walk', !R.windGoal(L, strip, v.plan[0].to.x, v.plan[0].to.y) || v.plan.length === 1);
  }
  // the hint walks through the plan, then plugs
  const st = R.newState(L);
  const h0 = R.hint(L, st);
  t('wind: the first hint is an aim and a wind from where the toy stands', h0 && h0.type === 'wind' && h0.clicks >= 1 && h0.clicks <= C.maxClicks && Math.hypot(h0.from.x - home.x, h0.from.y - home.y) < 1e-6, JSON.stringify(h0 && [h0.type, h0.clicks]));
  st.flags.carryMoving = { S: true };
  const hw = R.hint(L, st);
  t('wind: while the toy is marching the hint is to wait', hw && hw.type === 'wait');
  st.flags.carryMoving = {};
  if (v.ok) {
    const goal = v.plan[v.plan.length - 1].to;
    R.setStripPos(strip, goal.x, goal.y);
    R.refreshReach(L, strip); // (the room does this every frame the strip moves)
    const hs = R.hint(L, st);
    t('wind: where every cable reaches the hint is to plug them in', hs && hs.type === 'seat' && !!L.plugsById[hs.plug], JSON.stringify(hs && hs.type));
    R.setStripPos(strip, home.x, home.y);
    R.refreshReach(L, strip);
  }
}

/* ---- pushable blocks (Level 25) ---- */
{
  const L = lv(25);
  const start = R.blockLayout(L);
  t('blocks: ten blocks in a box of 21 free cells (everything else is fixed)', L.blocks.length === 10 && L.blockFixed.reduce((n, v) => n + (v ? 0 : 1), 0) === 21);
  t('blocks: no two blocks share a cell and none is outside the box', (() => { const occ = R.blockOcc(L, start); const seen = new Set(); let ok = true; L.blocks.forEach((b, i) => { for (let dy = 0; dy < b.h; dy++) for (let dx = 0; dx < b.w; dx++) { const k = (start[i][1] + dy) * L.grid.cols + start[i][0] + dx; if (L.blockFixed[k] || seen.has(k)) ok = false; seen.add(k); } }); return ok && occ.length > 0; })());
  const st = R.newState(L);
  t('blocks: Blocky covers two outlets (they refuse a plug: why block)', R.canSeat(L, st, 'dot', 'S.1').why === 'block' && R.canSeat(L, st, 'static', 'S.2').why === 'block');
  t('blocks: the third outlet is in the open but a block stands over the way in (nothing reaches yet)', !R.canSeat(L, st, 'lux', 'S.3').ok || !R.blockGoalMet(L, start));
  const plan = R.blockSolve(L);
  t('blocks: the shortest way to free the outlets is seven moves', plan && plan.moves.length === 7, JSON.stringify(plan && plan.moves.length));
  if (plan) {
    // replay it on the concrete blocks: every move must be one the block can slide
    const lay = start.map((p) => p.slice());
    let legal = true;
    for (const m of plan.moves) {
      const i = L.blocks.findIndex((b) => b.id === m.id);
      if (lay[i][0] !== m.from[0] || lay[i][1] !== m.from[1] || !R.blockRoute(L, lay, i, m.to)) legal = false;
      lay[i] = m.to.slice();
    }
    t('blocks: every move of the plan is a legal slide from where the block stands', legal);
    t('blocks: the plan frees the six cells (the outlets and the cell above each)', R.blockGoalMet(L, lay));
    t('blocks: ... and with the blocks there every cable reaches (exact geodesics)', R.atBlockLayout(L, lay, () => R.solveAll(L, { cap: 1, live: true }).length > 0));
  }
  t('blocks: nothing is free at the start, so the hint is a block', (() => { const h = R.hint(L, st); return h && h.type === 'block' && h.route.length >= 2 && !!L.blocksById[h.id]; })());
  t('blocks: verifyBlocks passes', R.verifyBlocks(L).ok, R.verifyBlocks(L).why);
  // a block cannot slide through another block, and a bigger block needs room: Blocky has nowhere to go at the start
  t('blocks: a block cannot be slid onto a cell another block stands on', R.blockRoute(L, start, L.blocks.findIndex((b) => b.id === 'N'), [3, 7]) === null);
  t('blocks: Blocky is boxed in at the start (no route to the left wing)', R.blockRoute(L, start, 0, [0, 8]) === null);
  // after the plan the hint is to plug
  if (plan) {
    R.setBlockLayout(L, plan.layout);
    L.reach = {};
    R.computeReach(L);
    const h2 = R.hint(L, R.newState(L));
    t('blocks: with the way clear the hint is to plug a cable in', h2 && h2.type === 'seat', JSON.stringify(h2 && h2.type));
    R.setBlockLayout(L, start);
    L.reach = {};
    R.computeReach(L);
  }
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

/* ---- the groove (Level 29): the room wakes only when every voice is in its pocket; a misplaced voice still plays ---- */
{
  const L = lv(29);
  const st = R.newState(L);
  const sockOf = (slot) => L.strips[0].sockets.find((s) => s.slot === slot);
  const all = {};
  for (const d of L.devices) all[d.plug.id] = sockOf(d.seq.step).id;
  for (const k in all) st.seat[k] = all[k];
  t('groove: every voice in its pocket is lit', R.grooveLit(L, st) === true && R.grooveScore(L, st) === 1);
  t('groove: and the room is complete', R.complete(L, st, 0) === true);
  const bell = L.devices.find((d) => d.id === 'bell');
  st.seat[bell.plug.id] = sockOf(7).id; // the bell on the silent pad: the left-to-right trap
  t('groove: a voice on the wrong pad is not lit', R.grooveLit(L, st) === false && R.grooveScore(L, st) < 1);
  t('groove: and the room does not wake', R.complete(L, st, 0) === false);
  t('groove: but the misplaced voice still plays (power on, not standby)', R.power(L, st)[bell.id] === 'on');
  t('groove: the silent pad is empty in the solution', !Object.values(all).includes(sockOf(7).id));
  t('groove: the solver accepts only the pockets', R.solveAll(L, {}).length === 1);
}

/* ---- the bass lock (Level 28): a seated plug carries power only when its collar is locked; the solver's states have no lock flags ---- */
{
  const L = lv(28);
  const sock = (slot) => L.strips[0].sockets.find((s) => s.slot === slot).id;
  const dev = L.devices[0];
  const st = R.newState(L);
  st.seat[dev.plug.id] = sock(1);
  st.flags.locked = {};
  t('bass: a seated plug that is not locked stands by', R.power(L, st)[dev.id] === 'standby');
  t('bass: and the room is not complete', R.complete(L, st, 0) === false);
  st.flags.locked[dev.plug.id] = true;
  t('bass: locked, it carries power', R.power(L, st)[dev.id] === 'on');
  const bare = R.newState(L);
  bare.seat[dev.plug.id] = sock(1);
  t('bass: a state without lock flags (the solver) powers the plug', R.power(L, bare)[dev.id] === 'on');
  t('bass: every arrangement is legal (the lock is a gesture)', R.solveAll(L, {}).length === 24);
  const h = R.hint(L, Object.assign(R.newState(L), { seat: Object.assign({}, st.seat, { [dev.plug.id]: sock(1) }), flags: { locked: {} } }));
  t('bass: a plug in its place and not locked gets the lock hint', h && h.type === 'lock' && h.plug === dev.plug.id, h && h.type);
}

/* ---- the pendulum (Level 37): the carriage is a function of the clock; its windows open at the bottom; the cables reach across the swing ---- */
{
  const L = lv(37);
  const strip = L.carried[0],
    C = strip.carrier;
  const p0 = R.pendulumAt(C, 0),
    pq = R.pendulumAt(C, C.period / 4);
  t('pendulum: at clock 0 the carriage hangs at the bottom of its arc, its dock', Math.hypot(p0.x - C.dock.x, p0.y - C.dock.y) < 1e-9 && Math.abs(p0.th) < 1e-12);
  t('pendulum: a quarter period on, the carriage is at the top of its arc (the angle is the amplitude)', Math.abs(pq.th - C.amp) < 1e-9);
  t('pendulum: the sweep is the length of the rope times the sine of the amplitude', Math.abs(pq.x - C.pivot.x - C.len * Math.sin(C.amp)) < 1e-9);
  t('pendulum: the windows repeat every half period, so they open at each bottom', strip.sockets.every((s) => s.timer && Math.abs(s.timer.period - C.period / 2) < 1e-9));
  const v = R.verifyPendulum(L);
  t('pendulum: every seated cable reaches across the whole swing (the validator\'s sweep)', v.ok, v.why);
  R.pendulumMove(L, strip, C.period / 4);
  t('pendulum: its sockets go with it, and keep their pitch', Math.abs(strip.sockets[1].x - strip.sockets[0].x - strip.pitch) < 1e-9);
  R.pendulumMove(L, strip, 0);
  t('pendulum: back at the bottom, the sockets are where the dock puts them', Math.abs(strip.sockets[0].x - (C.dock.x - strip.pitch)) < 1e-9);
}

console.log((fail ? fail + ' FAILED, ' : 'all ') + pass + ' passed');
process.exit(fail ? 1 : 0);
