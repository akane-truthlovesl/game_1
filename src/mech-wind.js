/* Snug — mech-wind.js : the wind-up toy (Level 24 "Wind-Up Parade"). The strip rides a tin drummer. You do not draw its road: you
   AIM it (press the toy and drag toward where it should face; a tap turns it a quarter) and you WIND it: press its brass key and
   circle your thumb around it, one click (a ratchet, a haptic tick, a rising note) per quarter-turn, up to eight. A ghost road shows
   where the toy WILL walk (straight, a quarter-turn at every wall or the edge of the mat, on while there is wind left); let go of the
   key and it marches off, drumming. It is the same walker as the snail (tether, strain, plugs that ride): only the way the road is
   made is new. Rules.windSim is the walk; Rules.windSolve the plan the hint uses. */
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
  const wrap = (a) => {
    while (a > Math.PI) a -= 2 * Math.PI;
    while (a < -Math.PI) a += 2 * Math.PI;
    return a;
  };
  // the aim is a dial with sixteen detents (the same sixteen headings the solver plans with): the thumb must be well on its way to the
  // next notch before the toy lets go of the one it has
  const STEP = (2 * Math.PI) / Rules.WIND_AIMS;
  const snapAim = (a) => wrap(Math.round((a + Math.PI) / STEP) * STEP - Math.PI);
  const angAbs = (a, b) => Math.abs(wrap(a - b));

  Room.prototype.windSetup = function (rt) {
    const C = rt.C;
    rt.wind = { clicks: 0, aim: snapAim(rt.heading), key: 0, mode: null, a0: 0, acc: 0, ghost: null, ghostStall: -1, tapT: 0, maxClicks: C.maxClicks || 8, press: null, snap: 0, dial: 0, wob: 0 };
    rt.trailOff = true;
  };
  // where the key is: sticking out of the toy's left or right side, on whichever side stays on the mat (it keeps its side unless it would
  // have to leave the mat), so a thumb can always reach it
  const KEYR = 90;
  Room.prototype.windKeyAt = function (rt, side) {
    const s = rt.strip,
      h = rt.heading;
    return { x: s.x + Math.sin(h) * KEYR * side, y: s.y - Math.cos(h) * KEYR * side };
  };
  const onMat = (p) => p.x > 34 && p.x < 326 && p.y > 70 && p.y < 592;
  Room.prototype.windKeyPos = function (rt) {
    const w = rt.wind;
    let side = w.keySide || 1;
    if (!onMat(this.windKeyAt(rt, side)) && onMat(this.windKeyAt(rt, -side))) side = -side;
    w.keySide = side;
    return this.windKeyAt(rt, side);
  };
  Room.prototype.windGhost = function (rt) {
    const w = rt.wind;
    const sim = Rules.windSim(rt.strip, { x: rt.strip.x, y: rt.strip.y }, w.aim, Math.max(1, w.clicks));
    w.ghost = sim;
    // a ghost road past where a seated cable would stop the toy
    let stall = -1;
    const seated = this.L.plugs.some((p) => this.st.seat[p.id] && this.L.socketsById[this.st.seat[p.id]].strip === rt.strip);
    if (seated) {
      const r = Rules.carryWalkOK(this.L, rt.strip, sim.pts, this.st.seat, 0.985);
      stall = r.ok ? -1 : r.at;
    }
    w.ghostStall = stall;
  };

  /* ---------------------------------------------------------------- input */
  Room.prototype.windBegin = function (rt, ptrId, x, y) {
    const w = rt.wind,
      kp = this.windKeyPos(rt);
    rt.drawing = { id: ptrId, wind: true, pts: [], len: 0 };
    w.press = { x, y, t: 0, moved: 0 };
    this.carryFingerAt = { x, y };
    if (Math.hypot(x - kp.x, y - kp.y) < 34 && rt.state === 'idle') {
      // the key: circle it to wind
      w.mode = 'key';
      w.a0 = Math.atan2(y - kp.y, x - kp.x);
      w.acc = w.clicks * (Math.PI / 2);
      A().sfx.tick();
    } else {
      w.mode = 'aim';
    }
    H().pulse('grab');
    this.cancelHint();
    this.idle = 0;
    this.windGhost(rt);
    return true;
  };
  Room.prototype.windMove = function (rt, x, y) {
    const w = rt.wind,
      s = rt.strip;
    this.carryFingerAt = { x, y };
    w.press.moved = Math.max(w.press.moved, Math.hypot(x - w.press.x, y - w.press.y));
    if (w.mode === 'key') {
      const kp = this.windKeyPos(rt);
      const a = Math.atan2(y - kp.y, x - kp.x);
      const da = wrap(a - w.a0);
      w.a0 = a;
      // only a real circle around the key counts (the thumb must be off its centre)
      if (Math.hypot(x - kp.x, y - kp.y) > 10) w.acc = Math.max(0, w.acc + da);
      const want = Math.min(w.maxClicks, Math.floor(w.acc / (Math.PI / 2) + 0.12));
      while (w.clicks < want) {
        w.clicks++;
        const sec = this.def.secret;
        if (sec && sec.on === 'wound' && w.clicks >= (sec.taps || 8) && !this.secretFound) {
          // the secret: wound all the way, once
          this.secretFound = true;
          this.onEvent('secret', sec);
          A().chime(9);
          Fx.sparkle(sec.x, sec.y, '#ffe9bd', 14);
          Fx.starburst(sec.x, sec.y, 10);
        }
        A().sfx.ratchet && A().sfx.ratchet(w.clicks);
        H().pulse('poke', 0.55);
        Fx.caption(String(w.clicks), kp.x, kp.y - 26, '#fff0c8');
      }
      while (w.clicks > want) {
        w.clicks--;
        A().sfx.ratchet && A().sfx.ratchet(w.clicks, true);
        H().pulse('poke', 0.3);
      }
      w.key = w.acc;
    } else {
      const dx = x - s.x,
        dy = y - s.y;
      if (Math.hypot(dx, dy) > 30) {
        const raw = Math.atan2(dy, dx);
        if (angAbs(raw, w.aim) > STEP * 0.62) {
          w.aim = snapAim(raw);
          w.snap = 1;
          A().sfx.detent && A().sfx.detent(0.45);
          H().pulse('poke', 0.25);
        }
      }
    }
    this.windGhost(rt);
  };
  Room.prototype.windEnd = function (rt) {
    const w = rt.wind;
    const d = rt.drawing;
    rt.drawing = null;
    this.carryFingerAt = null;
    this.idle = 0;
    if (!d) return;
    if (w.mode === 'key') {
      if (w.clicks >= 1) {
        const sim = Rules.windSim(rt.strip, { x: rt.strip.x, y: rt.strip.y }, w.aim, w.clicks);
        rt.heading = w.aim;
        w.lastClicks = w.clicks;
        this.carrySetRoad(rt, sim.pts);
        rt.corners = sim.bumps.map((b) => b.d); // where along the road it will bonk into something and turn
        rt.cornerIdx = 0;
        w.endAim = wrap(sim.end.h);
        A().sfx.chirp && A().sfx.chirp();
        H().pulse('seat', 0.6);
        w.clicks = 0;
        w.acc = 0;
        w.key = 0;
        w.ghost = null;
      } else if (w.press.moved < 10) {
        // a tap on the key with nothing wound: it wobbles
        A().sfx.tick();
      }
    } else if (w.press.moved < 12) {
      // a tap on the toy turns it a quarter, clockwise
      w.aim = wrap(w.aim + Math.PI / 2);
      w.snap = 1;
      A().sfx.ratchet && A().sfx.ratchet(1);
      H().pulse('poke', 0.4);
    }
    w.mode = null;
    if (w.clicks === 0) w.ghost = null;
    else this.windGhost(rt);
  };

  /* ---------------------------------------------------------------- per frame (called from carryUpdate for wind toys) */
  Room.prototype.windUpdate = function (rt, dt) {
    const w = rt.wind;
    // it turns to face the aim (while it is standing still); on the road the aim follows where it faces, and when the road ends it is
    // exactly the heading the walk was planned to end with
    if (rt.state === 'idle' || rt.state === 'strain') {
      if (w.endAim !== undefined) {
        w.aim = w.endAim;
        w.endAim = undefined;
      }
      rt.heading = U.lerpAng(rt.heading, w.aim, Math.min(1, dt * 9));
    }
    w.snap = Math.max(0, w.snap - dt * 4);
    w.dial = U.damp(w.dial, rt.drawing ? (w.mode === 'aim' ? 1 : 0.45) : 0, 0.1, dt);
    // the key unwinds as it walks (the wound clicks are spent along the road)
    if (rt.state === 'walking' && rt.len > 0) w.key = Math.max(0, (1 - rt.s / rt.len) * (w.lastClicks || 1) * (Math.PI / 2));
    w.tapT += dt;
  };

  // a wound-up toy runs down: the last stretch of the road is walked slower and slower (the steps stretch out, tak... tak.... tak)
  Room.prototype.windRamp = function (rt) {
    const k = Math.max(0, Math.min(1, (rt.len - rt.s) / 30));
    return 0.34 + 0.66 * (k * k * (3 - 2 * k));
  };
  // it walks into a block, a friend or the edge of the mat: a bonk, a recoil, a pivot to the right, and the thing it hit wobbles
  const BONKS = ['bonk!', 'clack!', 'tink!', 'oof!'];
  Room.prototype.windBump = function (rt) {
    const s = rt.strip,
      h = rt.heading;
    rt.state = 'bump';
    rt.bumpT = 0.5;
    rt.bumpAt = this.t;
    rt.bonks = (rt.bonks || 0) + 1;
    const fx = s.x + Math.cos(h) * (Math.abs(Math.cos(h)) > 0.7 ? 80 : 40),
      fy = s.y + Math.sin(h) * (Math.abs(Math.cos(h)) > 0.7 ? 80 : 44);
    A().at(this.pan(s.x), () => A().sfx.tinBonk && A().sfx.tinBonk());
    H().pulse('seat', 0.55);
    Fx.sparkle(fx, fy, '#ffe9a0', 6);
    Fx.caption(BONKS[rt.bonks % BONKS.length], fx, fy - 16, '#fff4c8');
    // the blocks nearest the contact shake
    (this.def.decor || []).forEach((d, i) => {
      if (d.art !== 'blockwall') return;
      const nx = Math.max(d.x - d.w / 2, Math.min(d.x + d.w / 2, fx)),
        ny = Math.max(d.y - d.h / 2, Math.min(d.y + d.h / 2, fy));
      if (Math.hypot(nx - fx, ny - fy) < 22) this.decorRT[i].shakeAt = this.t;
    });
  };

  // the hint hand's script for one wind step (a 3.2 s loop): press the toy and drag out along the aim, let go, press the key, circle it
  Room.prototype.windHintSeq = function (act) {
    const rt = this.carryRT[this.L.carried[0].id],
      s = rt.strip;
    const from = { x: s.x, y: s.y },
      d = { x: Math.cos(act.aim), y: Math.sin(act.aim) };
    // where the key will be once the toy has turned to the aim
    const kp = this.windKeyPos({ strip: s, heading: act.aim, wind: { keySide: rt.wind.keySide } });
    const a0 = Math.atan2(from.y - kp.y, from.x - kp.x) + Math.PI,
      sweep = act.clicks * (Math.PI / 2) + 0.35;
    const circ = (u) => ({ x: kp.x + Math.cos(a0 + sweep * u) * 22, y: kp.y + Math.sin(a0 + sweep * u) * 22 });
    const ease = U.ease.inOutCubic;
    return [
      { t0: 0, t1: 0.35, at: (u) => ({ x: from.x, y: from.y, a: u, press: 0 }) },
      { t0: 0.35, t1: 0.55, at: (u) => ({ x: from.x, y: from.y, a: 1, press: u }) },
      { t0: 0.55, t1: 1.25, at: (u) => ({ x: from.x + d.x * 70 * ease(u), y: from.y + d.y * 70 * ease(u), a: 1, press: 1 }) },
      { t0: 1.25, t1: 1.45, at: (u) => ({ x: from.x + d.x * 70, y: from.y + d.y * 70, a: 1 - u, press: 1 - u }) },
      { t0: 1.45, t1: 1.65, at: (u) => ({ x: circ(0).x, y: circ(0).y, a: u, press: 0 }) },
      { t0: 1.65, t1: 1.8, at: (u) => ({ x: circ(0).x, y: circ(0).y, a: 1, press: u }) },
      { t0: 1.8, t1: 2.9, at: (u) => ({ x: circ(ease(u)).x, y: circ(ease(u)).y, a: 1, press: 1 }) },
      { t0: 2.9, t1: 3.1, at: (u) => ({ x: circ(1).x, y: circ(1).y, a: 1 - u, press: 1 - u }) },
    ];
  };

  /* ---------------------------------------------------------------- drawing (called from carryDrawUnder / carryDrawBody) */
  Room.prototype.windDrawUnder = function (rt, ctx, t) {
    const w = rt.wind;
    const hint = this.hint && this.hint.act.type === 'wind' ? this.hint.act : null;
    if (hint) {
      // the hint shows where the walk goes (a dashed crayon road), the notch to aim at, and how far to wind
      Art.windDial(ctx, rt.strip.x, rt.strip.y, hint.aim, 0.85, 0, t);
      Art.crayonRoad(ctx, hint.pts, -1, t, { alpha: 0.55 });
      const kp = this.windKeyPos({ strip: rt.strip, heading: hint.aim, wind: { keySide: w.keySide } });
      ctx.save();
      ctx.font = '800 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(40,30,10,0.55)';
      const lab = 'wind x' + hint.clicks,
        vx = kp.x - rt.strip.x,
        vy = kp.y - rt.strip.y,
        vn = Math.hypot(vx, vy) || 1,
        lx = kp.x + (vx / vn) * 38,
        ly = kp.y + (vy / vn) * 38;
      ctx.strokeText(lab, lx, ly);
      ctx.fillStyle = '#ffe9a0';
      ctx.fillText(lab, lx, ly);
      ctx.restore();
      // once the hand has dragged the aim out, the toy turns to face it (so the key is where the hand goes next)
      if (this.hint.t % 3.2 > 1.25 && !rt.drawing && angAbs(w.aim, hint.aim) > 1e-6 && rt.state === 'idle') {
        w.aim = hint.aim;
        w.snap = 1;
        A().sfx.detent && A().sfx.detent(0.4);
      }
    }
    if (w.dial > 0.02) Art.windDial(ctx, rt.strip.x, rt.strip.y, w.aim, w.dial, w.snap, t);
    if (w.ghost && (w.clicks > 0 || rt.drawing)) Art.crayonRoad(ctx, w.ghost.pts, w.ghostStall, t, { alpha: 0.85 });
    if (rt.road.length > 1 && rt.state !== 'idle') {
      // the road it is walking: the part still to come
      const ahead = [{ x: rt.strip.x, y: rt.strip.y }].concat(rt.road.filter((q, i) => rt.cum[i] > rt.s));
      Art.crayonRoad(ctx, ahead, rt.stallRel === undefined ? -1 : rt.stallRel, t, { alpha: 0.6 });
    }
  };
  Room.prototype.windDrawBody = function (rt, ctx, strip, t) {
    const w = rt.wind;
    this.windKeyPos(rt);
    const b = Rules.stripBounds(strip);
    const bump = rt.state === 'bump' ? Math.max(0, 1 - (this.t - rt.bumpAt) / 0.5) : 0;
    Art.tinToy(ctx, { x: strip.x, y: strip.y, hw: (b[1] - b[0]) / 2, hh: 28, heading: rt.heading, walk: rt.walk, bob: rt.bob, clicks: w.clicks, key: w.key, side: w.keySide || 1, strain: rt.strain, happy: rt.glow, aiming: w.mode === 'aim', hold: w.mode === 'key', bump, snap: w.snap }, t);
  };
})();
