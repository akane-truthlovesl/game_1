/* Snug — mech-cat.js : Biscuit as a mechanic (Level 22 "Laser Pointer").
   Biscuit sits on the socket you need. You cannot lift her; you can make her WANT something else: press anywhere on the floor and a
   spot of sunlight (a hand mirror) appears under your thumb. She watches it, stalks it when it creeps, runs when it runs, and
   pounces when it stops (a butt wiggle first: the telegraph), pinning it under her paws; she sits on it for a few seconds, gets
   bored and pads home to the warm patch, where she sits on the nearest free socket again. The spot stays where you leave it for
   a while (a propped mirror), so a lure can be left behind while you plug with the other thumb. Never a failure, never rude.
   Rules.* only knows `st.flags.blocked[socket]` (the socket she sits on) and the hint action `lure`; this file owns her. */
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
  const WALK = 66,
    STALK = 60,
    RUN = 150;

  Room.prototype.herdInit = function () {
    const d = this.def.herd;
    this.st.flags.blocked = this.st.flags.blocked || {};
    const sock = d.cat.on ? this.L.socketsById[d.cat.on] : null;
    this.cat = {
      x: sock ? sock.x : d.cat.x,
      y: sock ? sock.y + 2 : d.cat.y,
      heading: -Math.PI / 2,
      state: 'sit', // sit | watch | stalk | run | pounce | leap | caught | home | nap
      t: 0,
      sock: sock ? sock.id : null,
      gait: 0,
      tail: 0,
      crouch: 0,
      stretch: 0,
      wiggle: 0,
      air: 0,
      eyes: 0.4,
      ears: 0,
      look: { x: 0, y: -1 },
      vx: 0,
      vy: 0,
      bored: 0,
      guard: 0,
      purr: 0,
      stepT: 0,
      leap: null,
      target: null,
    };
    if (sock) this.st.flags.blocked[sock.id] = true;
    this.spot = { x: 0, y: 0, lx: 0, ly: 0, on: false, held: false, hold: 0, vis: 0, speed: 0, still: 0, caught: 0, ptr: null, seen: 0 };
    this.updateCover();
  };

  /* ---------------------------------------------------------------- input: a spot of light under the thumb */
  Room.prototype.beginSpot = function (ptrId, x, y) {
    if (!this.spot || this.phase !== 'playing') return false;
    const sp = this.spot;
    if (sp.held) return false;
    sp.on = true;
    sp.held = true;
    sp.ptr = ptrId;
    sp.x = sp.lx = x;
    sp.y = sp.ly = y;
    sp.hold = 9;
    sp.still = 0;
    sp.vis = Math.max(sp.vis, 0.2);
    this.cancelHint();
    this.idle = 0;
    A().sfx.tick();
    H().pulse('grab');
    return true;
  };
  Room.prototype.moveSpot = function (x, y) {
    const sp = this.spot;
    if (!sp || !sp.held) return;
    sp.x = x;
    sp.y = y;
  };
  Room.prototype.endSpot = function () {
    const sp = this.spot;
    if (!sp) return;
    sp.held = false;
    sp.ptr = null;
    sp.hold = 9; // the mirror is propped: the spot stays where it was left
    this.idle = 0;
  };
  // a tap on Biscuit herself: she purrs, and stays exactly where she is
  Room.prototype.catPoke = function (x, y) {
    const c = this.cat;
    if (!c || Math.hypot(x - c.x, y - c.y) > 40) return false;
    c.purr = 2.4;
    A().sfx.purr(1.4);
    H().pulse('poke');
    Fx.caption('purr', c.x, c.y - 34, '#fff7dc');
    return true;
  };

  /* ---------------------------------------------------------------- her day */
  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
  // free sockets, nearest to a point first
  Room.prototype.catFreeSocket = function (from) {
    let best = null,
      bd = 1e9;
    for (const sk of this.L.sockets) {
      if (sk.dead || this.st.flags.blocked[sk.id]) continue;
      if (Object.values(this.st.seat).includes(sk.id)) continue;
      const d = Math.hypot(sk.x - from.x, sk.y - from.y);
      if (d < bd) (bd = d), (best = sk);
    }
    return best;
  };
  Room.prototype.catSetState = function (c, st) {
    if (c.state === st) return;
    // she gets up: the socket is free the moment she does
    if (c.sock && st !== 'sit' && st !== 'nap') {
      delete this.st.flags.blocked[c.sock];
      c.sock = null;
      this.updateCover();
    }
    c.state = st;
    c.t = 0;
  };
  Room.prototype.catSteer = function (c, tx, ty, speed, dt) {
    const dx = tx - c.x,
      dy = ty - c.y,
      d = Math.hypot(dx, dy);
    if (d < 1.5) {
      c.vx *= 0.8;
      c.vy *= 0.8;
      return d;
    }
    const ang = Math.atan2(dy, dx);
    c.heading = U.lerpAng(c.heading, ang, 1 - Math.exp(-dt * 7));
    // accelerate toward the heading, slow down as she arrives
    const want = Math.min(speed, d * 3.2);
    const ax = Math.cos(c.heading) * want,
      ay = Math.sin(c.heading) * want;
    const k = 1 - Math.exp(-dt * 6);
    c.vx += (ax - c.vx) * k;
    c.vy += (ay - c.vy) * k;
    c.x += c.vx * dt;
    c.y += c.vy * dt;
    c.gait += Math.hypot(c.vx, c.vy) * dt * 0.28;
    return d;
  };

  Room.prototype.herdUpdate = function (dt) {
    const c = this.cat,
      sp = this.spot,
      d = this.def.herd;
    if (!c) return;
    const calm = this.phase === 'waking' || this.phase === 'settling' || this.phase === 'cut';
    c.t += dt;
    c.tail += dt * (c.state === 'run' || c.state === 'pounce' ? 9 : c.state === 'sit' ? 2.2 : 5);
    c.purr = Math.max(0, c.purr - dt);
    // ---- the spot: it follows the thumb, stays where it was left, then fades
    if (sp.held) sp.hold = 9;
    else if (sp.on) {
      sp.hold -= dt;
      if (sp.hold <= 0) sp.on = false;
    }
    sp.vis = U.damp(sp.vis, sp.on ? (sp.hold < 1.2 && !sp.held ? sp.hold / 1.2 : 1) : 0, 0.15, dt);
    const sv = Math.hypot(sp.x - sp.lx, sp.y - sp.ly) / Math.max(dt, 1e-3);
    sp.speed = U.damp(sp.speed, sv, 0.12, dt);
    sp.still = sp.speed < 10 ? sp.still + dt : 0;
    sp.lx = sp.x;
    sp.ly = sp.y;
    sp.caught = Math.max(0, sp.caught - dt);
    if (sp.on) {
      const dx = sp.x - c.x,
        dy = sp.y - c.y,
        n = Math.hypot(dx, dy) || 1;
      c.look.x = U.damp(c.look.x, dx / n, 0.1, dt);
      c.look.y = U.damp(c.look.y, dy / n, 0.1, dt);
    }
    c.ears = U.damp(c.ears, sp.on && sp.vis > 0.3 ? 1 : 0, 0.1, dt);
    c.eyes = U.damp(c.eyes, c.state === 'sit' && !sp.on ? (c.t > 1.2 || c.purr > 0 ? 1 : 0.4) : c.purr > 0 ? 1 : 0, 0.2, dt);
    c.crouch = U.damp(c.crouch, c.state === 'pounce' || c.state === 'stalk' ? (c.state === 'pounce' ? 1 : 0.5) : 0, 0.08, dt);
    c.stretch = U.damp(c.stretch, c.state === 'leap' ? 1 : c.state === 'run' ? 0.6 : 0, 0.06, dt);
    c.wiggle = c.state === 'pounce' ? Math.sin(c.t * 40) * 0.12 * sat(c.t / 0.2) : 0;
    c.air = c.state === 'leap' ? Math.sin(Math.PI * sat(c.t / c.leap.dur)) : 0;

    if (calm) {
      // the room is awake: she pads to the warm patch and curls up
      const home = { x: d.beam.x, y: d.beam.y };
      if (c.state !== 'nap') {
        if (c.state !== 'home') this.catSetState(c, 'home');
        const left = this.catSteer(c, home.x, home.y, WALK, dt);
        if (left < 4) {
          this.catSetState(c, 'nap');
          c.heading = -0.6;
          A().sfx.purr(2.4);
          if (d.teaser && !c.teased) {
            // the next level's sound, from far away
            c.teased = true;
            this.later(2.6, () => A().sfx[d.teaser] && A().sfx[d.teaser]());
          }
        }
      }
      return;
    }

    switch (c.state) {
      case 'sit': {
        c.vx *= 0.85;
        c.vy *= 0.85;
        if (sp.on && sp.vis > 0.35 && dist(sp, c) > 20) this.catSetState(c, 'watch');
        break;
      }
      case 'watch': {
        // she turns to the light; if it moves she gets up
        c.heading = U.lerpAng(c.heading, Math.atan2(sp.y - c.y, sp.x - c.x), 1 - Math.exp(-dt * 5));
        if (!sp.on || sp.vis < 0.2) {
          c.bored += dt;
          if (c.bored > 1.2) this.catSetState(c, c.sock ? 'sit' : 'home');
        } else {
          c.bored = 0;
          if (c.t > 0.5 && (sp.speed > 14 || dist(sp, c) > 70)) this.catSetState(c, 'stalk');
        }
        break;
      }
      case 'stalk':
      case 'run': {
        if (!sp.on || sp.vis < 0.15) {
          c.bored += dt;
          if (c.bored > (d.boredT || 2.4)) this.catSetState(c, 'home');
          this.catSteer(c, c.x, c.y, 0, dt);
          break;
        }
        c.bored = 0;
        const dd = dist(sp, c);
        const run = sp.speed > 75 || dd > 150;
        if (run && c.state !== 'run') this.catSetState(c, 'run');
        else if (!run && c.state === 'run' && dd < 90) this.catSetState(c, 'stalk');
        // she aims a little short of the light so she looks like she is hunting it, not sitting on it
        const k = Math.min(1, 34 / (dd || 1));
        this.catSteer(c, sp.x + (c.x - sp.x) * k, sp.y + (c.y - sp.y) * k, c.state === 'run' ? RUN : STALK, dt);
        if (dd < 48 && sp.still > 0.28) this.catSetState(c, 'pounce');
        else if (dd < 22) this.catSetState(c, 'pounce');
        break;
      }
      case 'pounce': {
        c.vx *= 0.8;
        c.vy *= 0.8;
        c.heading = U.lerpAng(c.heading, Math.atan2(sp.y - c.y, sp.x - c.x), 1 - Math.exp(-dt * 10));
        if (c.t < 0.02) A().at(this.pan(c.x), () => A().sfx.chirrup && A().sfx.chirrup());
        if (c.t > 0.6) {
          // the leap: to where the light is NOW (it may have moved: she skids past)
          const dx = sp.x - c.x,
            dy = sp.y - c.y,
            n = Math.hypot(dx, dy) || 1;
          const over = sp.on ? 1.06 : 1;
          c.leap = { fx: c.x, fy: c.y, tx: c.x + dx * over, ty: c.y + dy * over, dur: 0.3 + Math.min(0.12, n / 900) };
          this.catSetState(c, 'leap');
        }
        break;
      }
      case 'leap': {
        const L2 = c.leap,
          k = sat(c.t / L2.dur),
          e = U.ease.outQuad(k);
        c.x = U.lerp(L2.fx, L2.tx, e);
        c.y = U.lerp(L2.fy, L2.ty, e);
        if (k >= 1) {
          c.vx = ((L2.tx - L2.fx) / L2.dur) * 0.25;
          c.vy = ((L2.ty - L2.fy) / L2.dur) * 0.25;
          A().sfx.thud && A().sfx.thud(0.25);
          H().pulse('poke', 0.5);
          Fx.kick(0, 0.5);
          Fx.sparkle(c.x, c.y, '#fff6d8', 6);
          if (sp.on && dist(sp, c) < 26) {
            sp.caught = 1.2;
            c.guard = d.guardT || 4.5;
            Fx.caption('got it!', c.x, c.y - 30, '#fff7dc');
            c.catches = (c.catches || 0) + 1;
            const sec = this.def.secret;
            if (sec && sec.on === 'catches' && c.catches >= (sec.taps || 2) && !this.secretFound) {
              // the secret: she has caught the light twice
              this.secretFound = true;
              this.onEvent('secret', sec);
              A().chime(9);
              Fx.sparkle(sec.x, sec.y, '#ffe9bd', 14);
              Fx.starburst(sec.x, sec.y, 10);
            }
            this.catSetState(c, 'caught');
          } else {
            Fx.caption('mrrp!', c.x, c.y - 30, '#fff7dc');
            this.catSetState(c, 'watch'); // missed: she looks up, and skids a little
          }
        }
        break;
      }
      case 'caught': {
        c.vx *= 0.8;
        c.vy *= 0.8;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.guard -= dt;
        // the light slips away from under her paws when the thumb moves
        if (sp.on && sp.speed > 40 && dist(sp, c) > 20) {
          this.catSetState(c, 'stalk');
          break;
        }
        if (c.guard <= 0) {
          sp.on = false;
          this.catSetState(c, 'home');
        }
        break;
      }
      case 'home': {
        // bored: she pads back to the warm patch and takes the nearest free socket
        if (sp.on && sp.vis > 0.6 && sp.speed > 14) {
          this.catSetState(c, 'watch');
          break;
        }
        let tgt = c.target;
        if (!tgt || (tgt.sock && (this.st.flags.blocked[tgt.sock] || Object.values(this.st.seat).includes(tgt.sock)))) {
          const sk = this.catFreeSocket({ x: c.x, y: c.y });
          // the socket nearest to the warm patch if she is already near it, otherwise the nearest to her
          tgt = sk ? { x: sk.x, y: sk.y + 2, sock: sk.id } : { x: d.beam.x, y: d.beam.y };
          c.target = tgt;
        }
        const left = this.catSteer(c, tgt.x, tgt.y, WALK, dt);
        if (left < 5) {
          c.heading = U.lerpAng(c.heading, -Math.PI / 2, 0.6);
          if (tgt.sock) {
            c.sock = tgt.sock;
            this.st.flags.blocked[tgt.sock] = true;
            this.updateCover();
          }
          c.target = null;
          this.catSetState(c, 'sit');
          A().at(this.pan(c.x), () => A().sfx.cat && A().sfx.cat());
        }
        break;
      }
      case 'nap':
        break;
    }
    // paw patter: a soft tap panned with her, in step with the gait
    if (c.state === 'stalk' || c.state === 'run' || c.state === 'home') {
      c.stepT -= dt;
      if (c.stepT <= 0) {
        c.stepT = c.state === 'run' ? 0.11 : 0.24;
        A().at(this.pan(c.x), () => A().sfx.paw && A().sfx.paw(c.state === 'run' ? 0.8 : 0.5));
      }
    }
    // the state the hint reads
    this.st.flags.cat = { x: c.x, y: c.y, state: c.state };
  };

  // her pose for the painter
  Room.prototype.catView = function () {
    const c = this.cat;
    const pose = c.state === 'home' ? 'stalk' : c.state === 'leap' ? 'pounce' : c.state === 'watch' ? 'sit' : c.state;
    return { x: c.x, y: c.y, heading: c.heading, pose, gait: c.gait, tail: c.tail, crouch: c.crouch, stretch: c.stretch, wiggle: c.wiggle, air: c.air, eyes: c.eyes, ears: c.ears, look: c.look, purr: c.purr };
  };
})();
