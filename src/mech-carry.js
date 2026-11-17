/* Snug — mech-carry.js : carried strips (Level 21 "Snail Mail"; the train and the tin toys reuse it).
   A strip rides a creature: press the snail and trace a road with your thumb (a crayon line, a scratch, a tick every few units),
   let go, and it walks the road at its own pace, squelching. The sockets move with it, so a plug can be seated into a socket that is
   walking past; the plug rides and its cable pays out behind. A seated cable that would run out of length does not pop out: the
   snail simply STOPS and strains (the road turns red-dashed ahead of that point so you can see it coming), and walks on when you
   unplug, redraw or the geometry allows. A tap on the snail makes it hide in its shell for a moment (a pause). It stops to munch
   lettuce (`carrier.snacks`), will not cross water (`carrier.keepOut`), and leaves a silver trail that lights up when the room wakes.
   Rules.* owns legality (Rules.carryWalkOK, Rules.hintCarrier); this file owns the feel. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const U = G.U,
    Rules = G.Rules,
    Fx = G.Fx,
    Geom = G.Geom,
    Art = G.Art,
    Room = G.Room;
  const A = () => G.Audio;
  const H = () => G.Haptics;
  const sat = U.sat;
  const SEG = 7; // finger samples closer than this are dropped
  const MAXR = 0.985; // a seated cable this tight stops the carrier

  Room.prototype.carryInit = function () {
    this.carryRT = {};
    this.st.flags.carryMoving = {};
    for (const strip of this.L.carried) {
      if (strip.carrier.mode === 'pendulum') continue; // a pendulum swings on the room clock (mech-pendulum.js): it has no walker
      const C = strip.carrier;
      this.carryRT[strip.id] = {
        strip,
        C,
        road: [],
        cum: [0],
        len: 0,
        s: 0,
        state: 'idle', // idle | walking | strain | munch
        heading: C.heading !== undefined ? C.heading : -Math.PI / 2,
        walk: 0,
        hide: 0,
        hideT: 0,
        munch: 0,
        strain: 0,
        stall: -1,
        stallKey: '',
        stallT: 0,
        drawing: null,
        preview: null,
        trail: [{ x: strip.x, y: strip.y }],
        glow: 0,
        look: { x: 0, y: 0 },
        blink: 0,
        blinkT: 2 + Math.random() * 3,
        bob: 0,
        squelchT: 0.4,
        snacks: (C.snacks || []).map((sn) => ({ x: sn.x, y: sn.y, secs: sn.secs || 2.2, done: false, art: sn.art })),
        lastReach: 0,
      };
      this.stripRT[strip.id].carried = true;
      if (C.track && this.trackSetup) this.trackSetup(this.carryRT[strip.id]); // a train, not a snail (mech-track.js)
      if (C.mode === 'wind' && this.windSetup) this.windSetup(this.carryRT[strip.id]); // a wind-up toy (mech-wind.js)
    }
  };

  /* ---------------------------------------------------------------- geometry of a road */
  function pointAt(rt, s) {
    const P = rt.road,
      cum = rt.cum;
    if (P.length < 2) return { x: rt.strip.x, y: rt.strip.y, dx: 0, dy: 0 };
    s = Math.max(0, Math.min(rt.len, s));
    let i = 1;
    while (i < cum.length - 1 && cum[i] < s) i++;
    const a = P[i - 1],
      b = P[i],
      seg = cum[i] - cum[i - 1] || 1,
      u = (s - cum[i - 1]) / seg;
    return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, dx: (b.x - a.x) / seg, dy: (b.y - a.y) / seg };
  }
  function measure(pts) {
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    return cum;
  }
  // does the segment a->b touch a keep-out rectangle (water)?
  Room.prototype.carryBlocked = function (rt, a, b) {
    const ko = rt.C.keepOut || [];
    for (const r of ko) {
      const poly = Geom.rectPoly(r.x, r.y, r.w, r.h, r.rot || 0);
      const closed = poly.concat([poly[0]]);
      if (Geom.pointPolyDist(b.x, b.y, poly) <= 1) return true;
      if (Geom.polyCross([a, b], closed) > 0) return true;
    }
    return false;
  };

  /* ---------------------------------------------------------------- the walk */
  Room.prototype.carryPlace = function (rt, x, y) {
    const strip = rt.strip;
    Rules.setStripPos(strip, x, y);
    for (const prt of this.plugList) {
      if (!prt.seatSock) continue;
      const sk = this.L.socketsById[prt.seatSock];
      if (sk.strip !== strip) continue;
      // (a plug still sliding home reads the socket's live position every frame; one that has landed is moved with it)
      if (prt.pose) {
        prt.pose.x = sk.x;
        prt.pose.y = sk.y;
      }
      if (prt.state === 'seated') prt.rope.pin(sk.x, sk.y, sk.fx, sk.fy, false);
    }
  };
  // would every seated cable still reach with the strip at (x, y)? returns the worst ratio
  Room.prototype.carryRatioAt = function (rt, x, y) {
    const strip = rt.strip,
      hx = strip.x,
      hy = strip.y;
    Rules.setStripPos(strip, x, y);
    let worst = 0;
    for (const prt of this.plugList) {
      if (!prt.seatSock) continue;
      const sk = this.L.socketsById[prt.seatSock];
      if (sk.strip !== strip) continue;
      worst = Math.max(worst, Rules.reachRatio(this.L, prt.id, sk.id));
    }
    Rules.setStripPos(strip, hx, hy);
    return worst;
  };
  Room.prototype.carrySetRoad = function (rt, pts) {
    rt.road = pts;
    rt.cum = measure(pts);
    rt.len = rt.cum[rt.cum.length - 1];
    rt.s = 0;
    rt.state = rt.len > 1 ? 'walking' : 'idle';
    rt.corners = null;
    rt.cornerIdx = 0;
    rt.stallKey = '';
    rt.hideT = 0;
    rt.snacks.forEach((sn) => (sn.skip = false));
    this.cancelHint();
  };
  // where along the remaining road would a seated cable stop the carrier? (-1 = nowhere)
  Room.prototype.carryStall = function (rt, pts, from) {
    if (!pts || pts.length < 2) return -1;
    const L = this.L;
    const seated = L.plugs.filter((p) => this.st.seat[p.id] && L.socketsById[this.st.seat[p.id]].strip === rt.strip);
    if (!seated.length) return -1;
    const w = Rules.carryWalkOK(L, rt.strip, pts, this.st.seat, MAXR);
    return w.ok ? -1 : (from || 0) + w.at;
  };

  Room.prototype.carryUpdate = function (dt) {
    const L = this.L;
    const calm = this.phase === 'waking' || this.phase === 'settling' || this.phase === 'cut';
    for (const id in this.carryRT) {
      const rt = this.carryRT[id],
        strip = rt.strip,
        C = rt.C;
      if (rt.tr) {
        this.trackUpdate(rt, dt, calm);
        continue;
      }
      let moved = false;
      if (rt.wind) this.windUpdate(rt, dt);
      // life: blinking, eyes that follow the finger
      rt.blinkT -= dt;
      if (rt.blinkT <= 0) {
        rt.blink = 0.14;
        rt.blinkT = 2.5 + Math.random() * 3.5;
      }
      rt.blink = Math.max(0, rt.blink - dt);
      const held = this.carryFingerAt;
      if (held) {
        const dx = held.x - strip.x,
          dy = held.y - strip.y,
          d = Math.hypot(dx, dy) || 1;
        rt.look.x = U.damp(rt.look.x, dx / d, 0.15, dt);
        rt.look.y = U.damp(rt.look.y, dy / d, 0.15, dt);
      } else {
        rt.look.x = U.damp(rt.look.x, Math.cos(rt.heading), 0.4, dt);
        rt.look.y = U.damp(rt.look.y, Math.sin(rt.heading), 0.4, dt);
      }
      // withdrawn into the shell (a tap)
      if (rt.hideT > 0) rt.hideT -= dt;
      rt.hide = U.damp(rt.hide, rt.hideT > 0 ? 1 : 0, 0.12, dt);
      if (rt.munch > 0) rt.munch -= dt;
      if (calm) {
        rt.state = 'idle';
        rt.glow = U.damp(rt.glow, 1, 0.7, dt);
        if (!rt.teased && this.phase === 'settling' && C.teaser) {
          // the next level's sound, heard from far away
          rt.teased = true;
          this.later(2.4, () => A().sfx[C.teaser] && A().sfx[C.teaser]());
        }
      }
      if (rt.state === 'walking' && rt.hideT <= 0) {
        // a snack on the way: stop and chew
        for (const sn of rt.snacks) {
          if (sn.done || sn.skip) continue;
          if (Math.hypot(strip.x - sn.x, strip.y - sn.y) < 24) {
            sn.done = true;
            rt.state = 'munch';
            rt.munch = sn.secs;
            A().sfx.munch && A().sfx.munch();
            Fx.caption('nom', strip.x, strip.y - 54, '#e8ffd0');
            const di = (this.def.decor || []).findIndex((d) => d.art === 'lettuce' && Math.hypot(d.x - sn.x, d.y - sn.y) < 30);
            if (di >= 0) this.decorRT[di].bites = (this.decorRT[di].bites || 0) + 1;
            break;
          }
        }
      }
      if (rt.state === 'bump') {
        // a wind-up toy that has hit something: it stands a moment, then pivots to face the way the road goes on
        rt.bumpT -= dt;
        const q = pointAt(rt, Math.min(rt.len, rt.s + 3));
        if (q.dx || q.dy) rt.heading = U.lerpAng(rt.heading, Math.atan2(q.dy, q.dx), Math.min(1, dt * 11));
        if (rt.bumpT <= 0) rt.state = 'walking';
      } else if (rt.state === 'munch') {
        if (rt.munch <= 0) rt.state = 'walking';
      } else if (rt.state === 'walking' || rt.state === 'strain') {
        if (rt.hideT > 0 || rt.len < 1) {
          // paused
        } else {
          const ramp = rt.wind ? this.windRamp(rt) : 1;
          rt.ramp = ramp;
          const speed = C.speed * ramp * (1 - 0.35 * sat((rt.seatedWorst || 0) - 0.8) / 0.2);
          const ds = Math.max(0.2, speed * dt);
          const target = Math.min(rt.len, rt.s + ds);
          const p = pointAt(rt, target);
          const worst = this.carryRatioAt(rt, p.x, p.y);
          if (worst <= MAXR) {
            // a normal step
            const hdx = p.dx,
              hdy = p.dy;
            rt.s = target;
            this.carryPlace(rt, p.x, p.y);
            moved = true;
            if (hdx || hdy) rt.heading = U.lerpAng(rt.heading, Math.atan2(hdy, hdx), Math.min(1, dt * 5));
            if (rt.corners && rt.cornerIdx < rt.corners.length && rt.s >= rt.corners[rt.cornerIdx] - 0.5) {
              rt.cornerIdx++;
              if (rt.s < rt.len - 1) this.windBump(rt);
            }
            if (rt.state === 'strain') {
              rt.state = 'walking';
              A().sfx.squelch && A().sfx.squelch(0.7);
            }
            if (rt.s >= rt.len - 0.01) {
              rt.state = 'idle';
              rt.road = [];
              rt.cum = [0];
              rt.len = 0;
              rt.s = 0;
              A().sfx.chirp && A().sfx.chirp();
              Fx.sparkle(strip.x, strip.y, '#dff6ff', 6);
            }
          } else if (rt.state !== 'strain') {
            // the cable runs out: the snail halts and strains
            rt.state = 'strain';
            A().sfx.strain && A().sfx.strain();
            H().pulse('refuse');
            Fx.caption('uuugh', strip.x, strip.y - 54, '#ffd9c8');
          }
        }
      }
      const walking = moved;
      rt.walk = U.damp(rt.walk, walking ? 1 : 0, 0.12, dt);
      rt.strain = U.damp(rt.strain, rt.state === 'strain' ? 1 : 0, 0.1, dt);
      this.st.flags.carryMoving[strip.id] = rt.state === 'walking' || rt.state === 'strain' || rt.state === 'bump';
      if (moved) {
        rt.bob += dt;
        // the trail
        const last = rt.trail[rt.trail.length - 1];
        if (Math.hypot(strip.x - last.x, strip.y - last.y) > 6) {
          rt.trail.push({ x: strip.x, y: strip.y });
          if (rt.trail.length > 600) rt.trail.shift();
        }
        // squelch and a footstep of ripples
        rt.squelchT -= dt;
        if (rt.squelchT <= 0) {
          rt.squelchT = (C.stepT || 0.95) / Math.max(0.3, rt.ramp || 1);
          const snd = C.stepSound || 'squelch';
          A().at(this.pan(strip.x), () => A().sfx[snd] && A().sfx[snd](0.5));
        }
        // the live reach of every plug to every socket of this strip (so a plug is only accepted where it really reaches)
        Rules.refreshReach(L, strip);
        this.carryDirty = true;
      }
      // how hard are the cables pulling? (shown as the cables' strain, and the snail slows a little)
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
      // the stall marker on the road (recomputed when the seats or the road change)
      const key = Object.keys(this.st.seat)
        .map((k) => k + ':' + this.st.seat[k])
        .join(',') + '|' + rt.road.length + '|' + Math.round(rt.s / 12) + '|' + (rt.drawing ? rt.drawing.pts.length : 0);
      rt.stallT -= dt;
      if (key !== rt.stallKey && rt.stallT <= 0) {
        rt.stallKey = key;
        rt.stallT = 0.12;
        if (rt.drawing) rt.preview = rt.drawing.pts;
        const pts = rt.drawing ? rt.drawing.pts : rt.road.length ? [pointAt(rt, rt.s)].concat(rt.road.filter((q, i) => rt.cum[i] > rt.s)) : null;
        rt.stall = pts ? this.carryStall(rt, pts, rt.drawing ? 0 : rt.s) : -1;
        rt.stallRel = rt.stall < 0 ? -1 : rt.drawing ? rt.stall : rt.stall - rt.s;
      }
      // reflect the live position into the state the hint reads
      this.st.flags.carryS = this.st.flags.carryS || {};
      this.st.flags.carryS[strip.id] = rt.s;
    }
  };

  /* ---------------------------------------------------------------- input: press the snail and trace a road */
  Room.prototype.carrierAt = function (x, y) {
    if (!this.carryRT) return null;
    for (const id in this.carryRT) {
      const rt = this.carryRT[id],
        strip = rt.strip;
      if (rt.tr) continue; // a train is not drawn a road: it has points and a lever
      if (rt.wind) {
        // a wind-up toy's key sits behind it: a press there (or on the toy) is a grab
        const kp = this.windKeyPos(rt);
        if (Math.hypot(x - kp.x, y - kp.y) < 40) return rt;
      }
      if (Geom.pointPolyDist(x, y, Rules.stripPoly(strip)) < 20 || Math.hypot(x - strip.x, y - strip.y) < 70) return rt;
    }
    return null;
  };
  Room.prototype.beginDraw = function (ptrId, x, y) {
    const rt = this.carrierAt(x, y);
    if (!rt || rt.drawing) return false;
    if (rt.wind) return this.windBegin(rt, ptrId, x, y);
    rt.drawing = { id: ptrId, pts: [{ x: rt.strip.x, y: rt.strip.y }], len: 0, tick: 0, down: { x, y }, moved: 0, blockedAt: null };
    this.carryFingerAt = { x, y };
    this.cancelHint();
    this.idle = 0;
    A().sfx.tick();
    H().pulse('grab');
    return true;
  };
  Room.prototype.moveDraw = function (x, y) {
    const rt = this.carryDrawing();
    if (!rt) return;
    if (rt.wind) return this.windMove(rt, x, y);
    const d = rt.drawing;
    this.carryFingerAt = { x, y };
    d.moved = Math.max(d.moved, Math.hypot(x - d.down.x, y - d.down.y));
    const last = d.pts[d.pts.length - 1];
    const dd = Math.hypot(x - last.x, y - last.y);
    if (dd < SEG) return;
    const p = { x: x, y: y };
    if (this.carryBlocked(rt, last, p)) {
      // water: the crayon will not go there (a small refusal the first time)
      if (!d.blockedAt) {
        d.blockedAt = { x: last.x, y: last.y };
        A().at(this.pan(last.x), () => A().sfx.knock());
        H().pulse('refuse');
        Fx.caption('splash!', last.x, last.y - 20, '#bfe9ff');
      }
      return;
    }
    d.blockedAt = null;
    // keep the polyline smooth: no jump longer than 20 u
    const n = Math.max(1, Math.ceil(dd / 20));
    for (let i = 1; i <= n; i++) d.pts.push({ x: last.x + ((p.x - last.x) * i) / n, y: last.y + ((p.y - last.y) * i) / n });
    d.len += dd;
    d.tick += dd;
    if (d.tick > 16) {
      d.tick = 0;
      A().sfx.crayon && A().sfx.crayon(Math.min(1, dd / 24));
      H().pulse('poke', 0.35);
    }
  };
  Room.prototype.carryDrawing = function () {
    if (!this.carryRT) return null;
    for (const id in this.carryRT) if (this.carryRT[id].drawing) return this.carryRT[id];
    return null;
  };
  Room.prototype.endDraw = function () {
    const rt = this.carryDrawing();
    if (!rt) return;
    if (rt.wind) return this.windEnd(rt);
    const d = rt.drawing;
    rt.drawing = null;
    rt.preview = null;
    this.carryFingerAt = null;
    this.idle = 0;
    if (d.len < 14 && d.moved < 10) {
      // a tap: it pulls its head into its shell for a moment
      rt.hideT = 1.8;
      A().at(this.pan(rt.strip.x), () => A().sfx.pop && A().sfx.pop());
      Fx.caption('…', rt.strip.x, rt.strip.y - 54, '#eef4dc');
      return;
    }
    // a road that ends where it started is not a road
    this.carrySetRoad(rt, simplify(d.pts));
    A().sfx.chirp && A().sfx.chirp();
    H().pulse('seat', 0.5);
  };
  // thin out a finger polyline (keep the shape, drop the dust)
  function simplify(pts) {
    if (pts.length < 3) return pts;
    const out = [pts[0]];
    for (let i = 1; i < pts.length - 1; i++) {
      const a = out[out.length - 1],
        b = pts[i],
        c = pts[i + 1];
      const cross = Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) / (Math.hypot(c.x - a.x, c.y - a.y) || 1);
      if (cross > 0.8 || Math.hypot(b.x - a.x, b.y - a.y) > 30) out.push(b);
    }
    out.push(pts[pts.length - 1]);
    return out;
  }

  /* ---------------------------------------------------------------- drawing */
  // under the cables: the trail, the road ahead, the road being drawn
  Room.prototype.carryDrawUnder = function (ctx, t) {
    for (const id in this.carryRT) {
      const rt = this.carryRT[id];
      if (rt.tr) {
        this.trackDrawUnder(rt, ctx, t);
        continue;
      }
      if (rt.wind) {
        this.windDrawUnder(rt, ctx, t);
        continue;
      }
      Art.trail(ctx, rt.trail, rt.glow, t);
      if (rt.road.length > 1 && rt.state !== 'idle') {
        const ahead = [pointAt(rt, rt.s)].concat(rt.road.filter((q, i) => rt.cum[i] > rt.s));
        Art.crayonRoad(ctx, ahead, rt.stallRel === undefined ? -1 : rt.stallRel, t, { alpha: 0.8 });
      }
      if (rt.drawing) Art.crayonRoad(ctx, rt.drawing.pts, rt.stall, t);
    }
  };
  // the snail itself, under its strip (called in the strips loop)
  Room.prototype.carryDrawBody = function (ctx, strip, t) {
    const rt = this.carryRT && this.carryRT[strip.id];
    if (!rt) return;
    if (rt.tr) return this.trackDrawBody(ctx, strip, t);
    if (rt.wind) return this.windDrawBody(rt, ctx, strip, t);
    Art.snail(
      ctx,
      { x: strip.x, y: strip.y, heading: rt.heading, walk: rt.walk, hide: rt.hide, look: rt.look, blink: rt.blink, strain: rt.strain, munch: rt.munch, bob: rt.bob, happy: rt.glow },
      t
    );
  };
})();
