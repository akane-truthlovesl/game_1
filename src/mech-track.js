/* Snug — mech-track.js : the toy train (Level 23 "All Aboard"). A carried strip that rides a wagon along a wooden track.
   The track is a few closed segments; where the shared stretch ends the POINTS choose which of two loops comes next (tap them:
   ka-chak, the lamp flips); the signal LEVER holds the train at the next station (tap: clunk, the train brakes into the station and waits;
   tap again and it rolls on). A seated cable that would run out of length stalls the train, exactly like the snail ("uuugh"), and
   every stretch of track a cable cannot follow is drawn RED with an X, recomputed whenever a plug goes in or out: the points' lamp is
   green when the branch they are set to is safe, red when it is not. The strip is a dynamo: it is powered by the wheels, so the
   room only wakes while the train is rolling; once it has woken, the train takes a victory lap.
   Rules.* owns legality (Rules.trackSafe, Rules.hintTrack); this file owns the feel. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const U = G.U,
    Rules = G.Rules,
    Fx = G.Fx,
    Art = G.Art,
    Room = G.Room;
  const A = () => G.Audio;
  const H = () => G.Haptics;
  const sat = U.sat;
  const MAXR = 0.985;
  const ENGINE_AHEAD = 124; // the engine runs this far ahead of the wagon, along the track
  const CHUG = 26; // one chuff per this much track
const CHARGE_S = 9; // seconds of rolling at full speed, with every cable plugged, to charge the dynamo

  /* ---------------------------------------------------------------- the track as a network */
  function segPoint(sg, s) {
    s = Math.max(0, Math.min(sg.len, s));
    let i = 1;
    while (i < sg.cum.length - 1 && sg.cum[i] < s) i++;
    const a = sg.pts[i - 1],
      b = sg.pts[i],
      seg = sg.cum[i] - sg.cum[i - 1] || 1,
      u = (s - sg.cum[i - 1]) / seg;
    return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, dx: (b.x - a.x) / seg, dy: (b.y - a.y) / seg };
  }
  function nextSeg(tr, id) {
    return id === tr.T.points.at ? tr.pointsTo : tr.T.next[id];
  }
  // advance along the network by ds (crossing segment ends through the points): { seg, s, x, y, dx, dy }
  function advance(tr, seg, s, ds) {
    const T = tr.T;
    let guard = 0;
    s += ds;
    while (guard++ < 6 && s > T.segs[seg].len) {
      s -= T.segs[seg].len;
      seg = nextSeg(tr, seg);
    }
    const p = segPoint(T.segs[seg], s);
    return { seg, s, x: p.x, y: p.y, dx: p.dx, dy: p.dy };
  }
  Room.prototype.trackSetup = function (rt) {
    const C = rt.C,
      T = C.track;
    const tr = (rt.tr = {
      T,
      seg: T.start.seg,
      s: T.start.s || 0,
      v: 0,
      state: 'run', // run | stopped | strain
      pointsTo: T.points.to,
      lever: 'go',
      stopped: false,
      leave: null, // the station it has just left (so it does not stop for it again while the lever is still down)
      fail: {},
      key: '',
      chugD: 0,
      chugK: 0,
      dyn: 0,
      spin: 0,
      engine: { x: 0, y: 0, heading: 0 },
      wasMoving: false,
      charge: 0, // the dynamo's charge: it only builds while the train rolls with every cable plugged in
      lamp: 0,
      leverA: 0,
      pointsA: T.points.to === T.points.options[0] ? 0 : 1,
      victory: false,
      steamT: 0,
      whistleCd: 0,
      cache: {},
    });
    const p = segPoint(T.segs[tr.seg], tr.s);
    this.carryPlace(rt, p.x, p.y);
    rt.heading = Math.atan2(p.dy, p.dx);
    for (const id in T.segs) tr.cache[id] = buildBed(T.segs[id]);
    this.trackEngine(rt);
  };
  // the engine runs ahead of the wagon along the route
  Room.prototype.trackEngine = function (rt) {
    const tr = rt.tr;
    const e = advance(tr, tr.seg, tr.s, ENGINE_AHEAD);
    tr.engine.x = e.x;
    tr.engine.y = e.y;
    tr.engine.heading = U.lerpAng(tr.engine.heading, Math.atan2(e.dy, e.dx), 0.5);
  };
  // the distance to the next station along the route (null if none within two segments)
  function distToStation(tr) {
    const T = tr.T;
    let seg = tr.seg,
      base = -tr.s;
    for (let hop = 0; hop < 3; hop++) {
      for (const st of T.stations) {
        if (st.seg !== seg) continue;
        const d = base + st.s;
        if (d >= -0.5 && !(tr.leave && tr.leave.id === st.id && d < 20)) return { d: Math.max(0, d), st };
      }
      base += T.segs[seg].len;
      seg = nextSeg(tr, seg);
    }
    return null;
  }

  /* ---------------------------------------------------------------- input: the points, the lever, the engine */
  Room.prototype.trackAt = function (x, y) {
    if (!this.carryRT) return false;
    for (const id in this.carryRT) {
      const rt = this.carryRT[id],
        tr = rt.tr;
      if (!tr) continue;
      const T = tr.T;
      if (Math.hypot(x - T.points.x, y - T.points.y) < 30) {
        this.trackFlipPoints(rt);
        return true;
      }
      if (Math.hypot(x - T.lever.x, y - T.lever.y) < 34) {
        this.trackToggleLever(rt);
        return true;
      }
      if (Math.hypot(x - tr.engine.x, y - tr.engine.y) < 34) {
        this.trackWhistle(rt);
        return true;
      }
    }
    return false;
  };
  Room.prototype.trackFlipPoints = function (rt) {
    const tr = rt.tr,
      O = tr.T.points.options;
    tr.pointsTo = O[(O.indexOf(tr.pointsTo) + 1) % O.length];
    A().at(this.pan(tr.T.points.x), () => A().sfx.points && A().sfx.points());
    H().pulse('seat', 0.6);
    Fx.caption('ka-chak', tr.T.points.x, tr.T.points.y - 30, '#fff0c8');
    this.idle = 0;
    this.cancelHint();
  };
  Room.prototype.trackToggleLever = function (rt) {
    const tr = rt.tr;
    if (tr.victory) return; // the show is over: the signalman has it
    tr.lever = tr.lever === 'go' ? 'stop' : 'go';
    if (tr.lever === 'go' && tr.stopped) {
      tr.leave = tr.stoppedAt || null;
      tr.stopped = false;
      this.later(0.25, () => this.trackWhistle(rt, true)); // pulling out of the station: a toot
    }
    A().at(this.pan(tr.T.lever.x), () => A().sfx.lever && A().sfx.lever(tr.lever === 'stop'));
    H().pulse('seat', 0.8);
    Fx.caption(tr.lever === 'stop' ? 'stop' : 'go', tr.T.lever.x, tr.T.lever.y - 34, tr.lever === 'stop' ? '#ffb8a8' : '#c8ffd0');
    this.idle = 0;
    this.cancelHint();
  };
  Room.prototype.trackWhistle = function (rt, auto) {
    const tr = rt.tr;
    // the secret: toot the engine four times (it is proud of its whistle)
    const sec = this.def.secret;
    if (!auto && sec && sec.on === 'toots' && !tr.victory) {
      rt.toots = (rt.toots || 0) + 1;
      if (rt.toots >= (sec.taps || 4) && !this.secretFound) {
        this.secretFound = true;
        this.onEvent('secret', sec);
        A().chime(9);
        Fx.sparkle(sec.x, sec.y, '#ffe9bd', 14);
        Fx.starburst(sec.x, sec.y, 10);
      }
    }
    if (tr.whistleCd > 0) return;
    tr.whistleCd = 1.6;
    A().at(this.pan(tr.engine.x), () => A().sfx.whistle && A().sfx.whistle());
    H().pulse('poke');
    for (let i = 0; i < 4; i++) Fx.steam(tr.engine.x + Math.cos(tr.engine.heading) * 8, tr.engine.y + Math.sin(tr.engine.heading) * 8);
    Fx.caption('toot!', tr.engine.x, tr.engine.y - 30, '#ffffff');
    this.idle = 0;
  };

  // is a train still rolling to its final stop? (the Wake waits for it before it judges Tidy)
  Room.prototype.carryHold = function () {
    if (!this.carryRT) return false;
    for (const id in this.carryRT) {
      const tr = this.carryRT[id].tr;
      if (tr && tr.victory && !tr.stopped) return true;
    }
    return false;
  };

  /* ---------------------------------------------------------------- the train, per frame */
  Room.prototype.trackUpdate = function (rt, dt, calm) {
    const tr = rt.tr,
      T = tr.T,
      L = this.L,
      strip = rt.strip;
    tr.whistleCd = Math.max(0, tr.whistleCd - dt);
    if (calm && !tr.victory) {
      // the room is awake: a toot, and the train pulls into the next station and stands there (its cables settle: Tidy is judged then)
      tr.victory = true;
      tr.lever = 'stop';
      tr.stopped = false;
      tr.leave = null;
      this.later(0.4, () => this.trackWhistle(rt));
      tr.charge = 1;
      // the signalman nods: the points set themselves to a loop the cables can follow
      if (tr.fail[tr.pointsTo] >= 0) {
        const ok = T.points.options.find((o) => tr.fail[o] < 0);
        if (ok) {
          tr.pointsTo = ok;
          A().sfx.points && A().sfx.points();
        }
      }
      if (rt.C.teaser) this.later(6.2, () => A().sfx[rt.C.teaser] && A().sfx[rt.C.teaser]());
    }
    // ---- the speed the train wants
    const vmax = rt.C.speed;
    let target = vmax;
    let dest = null;
    if (tr.lever === 'stop') {
      dest = distToStation(tr);
      if (dest) target = Math.min(vmax, 5 + vmax * sat(dest.d / 95));
    }
    if (tr.stopped) target = 0;
    // a cable that has run out of length holds the train
    const rate = target < tr.v ? 120 : 70;
    tr.v += U.clamp(target - tr.v, -rate * dt, rate * dt);
    let ds = tr.v * dt;
    if (dest && dest.d < ds + 0.8 && tr.lever === 'stop') {
      // arrive: snap onto the station and wait for the lever
      ds = dest.d;
      tr.v = 0;
    }
    let moved = false;
    if (ds > 0.0001) {
      const np = advance(tr, tr.seg, tr.s, ds);
      const worst = this.carryRatioAt(rt, np.x, np.y);
      if (worst <= MAXR) {
        tr.seg = np.seg;
        tr.s = np.s;
        this.carryPlace(rt, np.x, np.y);
        rt.heading = U.lerpAng(rt.heading, Math.atan2(np.dy, np.dx), Math.min(1, dt * 6));
        moved = true;
        if (tr.state === 'strain') {
          tr.state = 'run';
          A().sfx.chug && A().sfx.chug(0);
        }
        tr.chugD += ds;
        if (tr.chugD >= CHUG) {
          tr.chugD -= CHUG;
          tr.chugK = (tr.chugK + 1) % 4;
          A().at(this.pan(strip.x), () => A().sfx.chug && A().sfx.chug(tr.chugK, tr.v / vmax));
          Fx.steam(tr.engine.x - Math.cos(tr.engine.heading) * 4, tr.engine.y - Math.sin(tr.engine.heading) * 4 - 6);
        }
      } else if (tr.state !== 'strain') {
        tr.state = 'strain';
        tr.v = 0;
        A().sfx.strain && A().sfx.strain();
        H().pulse('refuse');
        Fx.caption('uuugh', strip.x, strip.y - 54, '#ffd9c8');
      } else tr.v = 0;
    }
    if (dest && tr.lever === 'stop' && tr.v < 0.3 && dest.d < 1.6 && !tr.stopped) {
      tr.stopped = true;
      tr.stoppedAt = dest.st;
      A().sfx.brake && A().sfx.brake();
      H().pulse('seat', 0.5);
      Fx.caption('station', strip.x, strip.y - 60, '#fff0c8');
    }
    // the dynamo: the strip is powered only once the wheels have charged it, and they charge it only while the train rolls with
    // every cable plugged in (so it takes a clean run on a loop the cables can follow; a plug pulled out drains it)
    const moving = tr.v > 3 && tr.state !== 'strain';
    const allIn = L.plugs.every((p) => !p.device.required || (this.st.seat[p.id] && L.socketsById[this.st.seat[p.id]].strip === strip));
    if (!tr.victory) {
      if (allIn && moving) tr.charge = Math.min(1, tr.charge + (tr.v / vmax) * dt / CHARGE_S);
      else if (!allIn) tr.charge = Math.max(0, tr.charge - dt / 3);
      else tr.charge = Math.max(0, tr.charge - dt / 40);
    }
    const powered = tr.charge >= 0.999;
    this.st.flags.carryMoving[strip.id] = powered;
    if (powered !== tr.wasMoving) {
      tr.wasMoving = powered;
      this.refreshPower('dynamo');
    }
    tr.dyn = U.damp(tr.dyn, moving ? 1 : 0, 0.12, dt);
    tr.spin += tr.v * dt * 0.05;
    tr.lamp = U.damp(tr.lamp, 1, 0.2, dt);
    tr.pointsA = U.damp(tr.pointsA, tr.pointsTo === T.points.options[0] ? 0 : 1, 0.07, dt);
    tr.leverA = U.damp(tr.leverA, tr.lever === 'stop' ? 1 : 0, 0.07, dt);
    this.trackEngine(rt);
    // the trail of the engine's smoke when it rolls
    tr.steamT -= dt;
    if (moving && tr.steamT <= 0) {
      tr.steamT = 0.3;
      Fx.steam(tr.engine.x - Math.cos(tr.engine.heading) * 10, tr.engine.y - Math.sin(tr.engine.heading) * 10 - 8);
    }
    // the live reach of every plug to every socket of this strip, so a plug is accepted only where it really reaches
    if (moved || this.carryDirty) {
      Rules.refreshReach(L, strip);
      this.carryDirty = false;
    }
    let worstSeated = 0;
    for (const prt of this.plugList) {
      if (!prt.seatSock) continue;
      const sk = L.socketsById[prt.seatSock];
      if (sk.strip !== strip) continue;
      const r = L.reach[prt.id][sk.id].ratio;
      worstSeated = Math.max(worstSeated, r);
      prt.railStrain = sat((r - 0.78) / 0.22);
    }
    rt.seatedWorst = worstSeated;
    // which stretches of track can the seated cables follow? (red where they cannot) recomputed when the seats change
    const key = Object.keys(this.st.seat)
      .map((k) => k + ':' + this.st.seat[k])
      .join(',');
    if (key !== tr.key) {
      tr.key = key;
      for (const id in T.segs) {
        const w = Rules.carryWalkOK(L, strip, T.segs[id].pts, this.st.seat, MAXR);
        tr.fail[id] = w.ok ? -1 : w.at;
      }
    }
    // what the hint reads
    this.st.flags.track = { points: tr.pointsTo, lever: tr.lever, stopped: tr.stopped, seg: tr.seg, moving, charge: tr.charge };
  };

  /* ---------------------------------------------------------------- drawing */
  // a bed of sleepers with two rails, cached as paths
  function buildBed(sg) {
    const pts = sg.pts,
      n = pts.length;
    const sleepers = new Path2D(),
      railA = new Path2D(),
      railB = new Path2D(),
      bed = new Path2D();
    const off = (i, k) => {
      const a = pts[Math.max(0, i - 1)],
        b = pts[Math.min(n - 1, i + 1)];
      let dx = b.x - a.x,
        dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 1;
      dx /= d;
      dy /= d;
      return { x: pts[i].x - dy * k, y: pts[i].y + dx * k };
    };
    bed.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < n; i++) bed.lineTo(pts[i].x, pts[i].y);
    let first = true;
    for (let i = 0; i < n; i++) {
      const a = off(i, 6.2),
        b = off(i, -6.2);
      if (first) {
        railA.moveTo(a.x, a.y);
        railB.moveTo(b.x, b.y);
        first = false;
      } else {
        railA.lineTo(a.x, a.y);
        railB.lineTo(b.x, b.y);
      }
    }
    let acc = 0,
      next = 5;
    for (let i = 1; i < n; i++) {
      const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      while (acc + d >= next) {
        const u = (next - acc) / d;
        const x = pts[i - 1].x + (pts[i].x - pts[i - 1].x) * u,
          y = pts[i - 1].y + (pts[i].y - pts[i - 1].y) * u;
        const nx = -(pts[i].y - pts[i - 1].y) / d,
          ny = (pts[i].x - pts[i - 1].x) / d;
        sleepers.moveTo(x - nx * 11, y - ny * 11);
        sleepers.lineTo(x + nx * 11, y + ny * 11);
        next += 11;
      }
      acc += d;
    }
    return { bed, sleepers, railA, railB };
  }
  // under the cables: the track, the red stretches, the points and the lever
  Room.prototype.trackDrawUnder = function (rt, ctx, t) {
    const tr = rt.tr,
      T = tr.T;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const id in T.segs) {
      const c = tr.cache[id];
      ctx.strokeStyle = 'rgba(40,24,6,0.16)';
      ctx.lineWidth = 24;
      ctx.save();
      ctx.translate(1.5, 3);
      ctx.stroke(c.bed);
      ctx.restore();
      ctx.strokeStyle = '#b98a52';
      ctx.lineWidth = 20;
      ctx.stroke(c.bed);
      ctx.strokeStyle = 'rgba(255,236,196,0.2)';
      ctx.lineWidth = 15;
      ctx.stroke(c.bed);
      ctx.lineCap = 'butt';
      ctx.strokeStyle = '#7b5632';
      ctx.lineWidth = 4;
      ctx.stroke(c.sleepers);
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#4a4f5c';
      ctx.lineWidth = 3.4;
      ctx.stroke(c.railA);
      ctx.stroke(c.railB);
      ctx.strokeStyle = '#cfd6e4';
      ctx.lineWidth = 1.6;
      ctx.stroke(c.railA);
      ctx.stroke(c.railB);
    }
    // the stretches a seated cable cannot follow: red, dashed, with an X where the train would stop
    for (const id in T.segs) {
      const f = tr.fail[id];
      if (f === undefined || f < 0) continue;
      const sg = T.segs[id];
      const P = [];
      const p0 = segPoint(sg, f);
      P.push(p0);
      for (let i = 0; i < sg.pts.length; i++) if (sg.cum[i] > f) P.push(sg.pts[i]);
      ctx.beginPath();
      ctx.moveTo(P[0].x, P[0].y);
      for (let i = 1; i < P.length; i++) ctx.lineTo(P[i].x, P[i].y);
      ctx.setLineDash([9, 8]);
      ctx.strokeStyle = 'rgba(255,90,70,0.95)';
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = '#ff5a46';
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      ctx.moveTo(p0.x - 7, p0.y - 7);
      ctx.lineTo(p0.x + 7, p0.y + 7);
      ctx.moveTo(p0.x + 7, p0.y - 7);
      ctx.lineTo(p0.x - 7, p0.y + 7);
      ctx.stroke();
    }
    ctx.restore();
    // the points (a brass lever and a lamp) and the signal lever
    const safe = tr.fail[tr.pointsTo] === undefined || tr.fail[tr.pointsTo] < 0;
    Art.trackPoints(ctx, T.points.x, T.points.y, tr.pointsA, safe, t);
    Art.signalLever(ctx, T.lever.x, T.lever.y, tr.leverA, tr.stopped, t);
  };
  // the engine, its coupling and the wagon under the strip
  Room.prototype.trackDrawBody = function (ctx, strip, t) {
    const rt = this.carryRT && this.carryRT[strip.id];
    if (!rt || !rt.tr) return;
    const tr = rt.tr;
    Art.trainCoupling(ctx, strip, tr.engine);
    Art.flatbed(ctx, strip, { dyn: tr.dyn, spin: tr.spin, charge: tr.charge, strain: tr.state === 'strain' ? 1 : 0 }, t);
    Art.engine(ctx, tr.engine, { v: tr.v / rt.C.speed, strain: tr.state === 'strain' ? 1 : 0, t, stopped: tr.stopped, happy: tr.victory }, t);
  };
})();
