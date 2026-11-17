/* Snug — mech-bass.js : "Bass Drop" (Level 28).
   The speaker wall kicks on every beat of a slow groove. A kick shakes every seated plug that is not LOCKED in, and a loose one pops out
   with a "pop!" and hops home (never a failure: it just goes home; a plug in your fingers is never taken). A quarter-turn twist of the
   thumb round a seated plug's brass collar LOCKS it (the device wakes); a locked plug only shivers at a kick and refuses a pull, and a
   twist back unlocks it. A freshly seated plug has a grace period, and its collar says "twist it". The loose collar flares red just
   before a kick (the telegraph). Hold a plug through a thump and seat it ON the beat: a gold plug. Rules.* knows only st.flags.locked
   and the hint action `lock`; this file owns the clock, the pops, the collars, the wall and the sound. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const U = G.U,
    Fx = G.Fx,
    Art = G.Art,
    Room = G.Room;
  const A = () => G.Audio;
  const H = () => G.Haptics;
  const TAU = U.TAU;
  const LOOKAHEAD = 0.14;
  const TWIST = 1.25; // radians of collar travel that make a twist (about 72 degrees)
  const RING = 46; // a finger within this distance of a plug's centre is on its collar; further out it is a pull
  const BEAT_WIN = 0.14; // seconds either side of a kick that count as "on the beat"

  Room.prototype.bassInit = function () {
    const cfg = this.def.bass || {};
    const flags = this.st.flags;
    flags.locked = flags.locked || {};
    this.bassRT = {
      dur: 60 / (cfg.bpm || 92),
      grace: cfg.grace || 1.0,
      startAt: cfg.startAt || 1.8,
      started: false,
      nextT: 0,
      ev: [],
      kick: 0,
      kickT: -9,
      aLast: undefined,
      aRun: -9,
      audio: false,
      seatedAt: {},
      collar: {},
      wall: (this.def.decor || []).findIndex((d) => d.art === 'speakerwall'),
      stopAt: 0,
      popped: 0,
    };
    for (const p of this.L.plugs) this.bassRT.collar[p.id] = { lock: 0, ang: 0, flash: 0 };
  };
  // the clock the kicks keep: the audio clock once audio runs (a lookahead on it never glitches), else the room's own
  Room.prototype.bassClock = function () {
    const B = this.bassRT,
      a = A().now ? A().now() : undefined;
    if (typeof a === 'number') {
      if (B.aLast !== undefined && a > B.aLast) B.aRun = this.t;
      B.aLast = a;
    }
    const audio = typeof a === 'number' && this.t - B.aRun < 0.3;
    if (audio !== B.audio && B.started) B.nextT = (audio ? a : this.t) + 0.1;
    B.audio = audio;
    return audio ? a : this.t;
  };

  /* ---------------------------------------------------------------- the clock, the kicks and the pops */
  Room.prototype.bassUpdate = function (dt) {
    const B = this.bassRT,
      L = this.L,
      locked = this.st.flags.locked;
    const T = this.bassClock();
    for (const p of L.plugs) {
      const seated = !!this.st.seat[p.id];
      if (seated && B.seatedAt[p.id] === undefined) {
        B.seatedAt[p.id] = this.t;
        const prt = this.plugRT[p.id];
        if (!locked[p.id] && this.phase === 'playing') Fx.caption('twist it', prt.x, prt.y - 30, '#ffe9bd');
      }
      if (!seated) {
        delete B.seatedAt[p.id];
        if (locked[p.id]) locked[p.id] = false; // out of its socket, a plug is loose again
      }
      const c = B.collar[p.id],
        prt = this.plugRT[p.id];
      c.lock = U.damp(c.lock, locked[p.id] ? 1 : 0, 0.06, dt);
      c.flash = Math.max(0, c.flash - dt * 3);
      if (!prt.grab) c.ang = U.damp(c.ang, 0, 0.12, dt); // the collar springs back when no one is twisting it
    }
    B.kick = Math.max(0, B.kick - dt * 3.2);
    if (B.wall >= 0) this.decorRT[B.wall].kick = B.kick;
    if (B.stopAt && this.t > B.stopAt) return; // the bass has dropped out: the room breathes
    if (!B.started) {
      if (this.phase === 'playing' && this.t > B.startAt) {
        B.started = true;
        B.nextT = T + 0.4;
      }
      return;
    }
    while (B.nextT < T + LOOKAHEAD) {
      const when = Math.max(0, B.nextT - T);
      if (B.stopAt) A().inst('bass', 41, 0.6, 0, when); // after the wake: a soft low note instead of the kick
      else A().inst('kick', 36, 1, 0, when);
      B.ev.push({ t: B.nextT, soft: !!B.stopAt });
      B.nextT += B.dur;
    }
    for (let i = 0; i < B.ev.length; ) {
      if (B.ev[i].t > T) {
        i++;
        continue;
      }
      const e = B.ev.splice(i, 1)[0];
      this.bassKick(e.soft);
    }
  };
  // a kick lands: the wall pumps, a ripple runs out over the floor, every seated cable shivers; a plug that is not locked in pops out
  Room.prototype.bassKick = function (soft) {
    const B = this.bassRT,
      L = this.L,
      locked = this.st.flags.locked;
    B.kick = soft ? 0.35 : 1;
    B.kickT = this.t;
    const wd = B.wall >= 0 ? this.def.decor[B.wall] : { x: 180, y: 112 };
    Fx.ring(wd.x, wd.y + 60, soft ? 150 : 280, soft ? '#ffe9bd' : '#ffd9a0', soft ? 0.3 : 0.6, soft ? 1.4 : 2.6);
    if (!soft) {
      Fx.kick(0, 0.7);
      H().pulse('poke', 0.45);
    }
    for (const d of L.devices) this.devRT[d.id].hopS.kick(soft ? 0.12 : 0.35);
    for (const prt of this.plugList) {
      if (prt.grab && !prt.seatSock) prt.grab.heldKick = this.t; // held in the fingers through a thump: a candidate for the secret
      if (!prt.seatSock || prt.grab) continue; // a plug in your fingers is never taken, nor shaken under them
      if (soft) {
        this.pluckRope(prt, 0.5, 0.6);
        continue;
      }
      if (locked[prt.id]) {
        // locked in: it only shivers, and its collar flashes
        prt.wobV = 3;
        B.collar[prt.id].flash = 1;
        this.pluckRope(prt, 0.5, 2.4);
        continue;
      }
      const since = B.seatedAt[prt.id] !== undefined ? this.t - B.seatedAt[prt.id] : 0;
      if (since < B.grace) {
        // too soon after seating: it rattles, and the grace period lets you twist it
        prt.wobV = 3;
        this.pluckRope(prt, 0.5, 1.2);
        continue;
      }
      this.bassPop(prt);
    }
  };
  // the pop: the plug is thrown out of its socket and hops home to its device (hopTo clears the seat)
  Room.prototype.bassPop = function (prt) {
    const sock = this.L.socketsById[prt.seatSock];
    this.bassRT.popped++;
    A().at(this.pan(sock.x), () => A().sfx.pop());
    H().pulse('pop');
    Fx.sparks(sock.x, sock.y, Art.KEYCOL[prt.plug.key] || '#fff4d0', 5, sock.fx, sock.fy, 2.6);
    Fx.caption('pop!', sock.x, sock.y - 34, '#ffd9c8');
    const to = prt.plug.device.rest;
    this.hopTo(prt, to.x, to.y, 0.5, 0);
    this.updateCover();
    this.refreshPower();
  };

  /* ---------------------------------------------------------------- the twist */
  // a grip on a seated plug on a lock level. Inside the collar the finger twists it (a quarter turn locks or unlocks it); outside,
  // an unlocked plug is pulled the ordinary way, and a locked one refuses. Returns true when the collar governs this grip.
  Room.prototype.bassGrip = function (prt, g) {
    const B = this.bassRT,
      locked = this.st.flags.locked,
      c = B.collar[prt.id];
    const dx = g.fx - prt.x,
      dy = g.fy - prt.y,
      r = Math.hypot(dx, dy);
    if (r > RING) {
      if (!locked[prt.id]) return false;
      if (!g.refused) {
        g.refused = true;
        prt.wobV = 4;
        A().sfx.tick && A().sfx.tick();
        H().pulse('refuse');
        Fx.caption('twist it', prt.x, prt.y - 30, '#ffe0c0');
      }
      return true;
    }
    const a = Math.atan2(dy, dx);
    if (!g.twist) g.twist = { a: Math.atan2(g.sy - prt.y, g.sx - prt.x), acc: 0 };
    let da = a - g.twist.a;
    while (da > Math.PI) da -= TAU;
    while (da < -Math.PI) da += TAU;
    g.twist.a = a;
    if (r > 8) g.twist.acc += da; // the very middle of the collar does not turn it
    c.ang = g.twist.acc;
    if (!g.twisted && Math.abs(g.twist.acc) >= TWIST) {
      g.twisted = true;
      this.bassToggleLock(prt);
    }
    return true;
  };
  Room.prototype.bassToggleLock = function (prt) {
    const locked = this.st.flags.locked,
      c = this.bassRT.collar[prt.id];
    locked[prt.id] = !locked[prt.id];
    c.flash = 1;
    A().at(this.pan(prt.x), () => A().sfx.lockClick());
    H().pulse('seat', locked[prt.id] ? 0.9 : 0.5);
    Fx.sparkle(prt.x, prt.y, locked[prt.id] ? '#ffe9bd' : '#c9d0e0', locked[prt.id] ? 9 : 4);
    Fx.caption(locked[prt.id] ? 'click' : 'loose', prt.x, prt.y - 30, locked[prt.id] ? '#fff4c8' : '#dfe6f5');
    prt.wobV = 2.6;
    this.refreshPower();
  };
  // the lock hint: the hand walks a quarter turn round the collar (about 110 degrees, from the notch)
  Room.prototype.bassLockPoly = function (act) {
    const prt = this.plugRT[act.plug],
      pts = [];
    for (let i = 0; i <= 14; i++) {
      const a = -Math.PI / 2 + (i / 14) * 1.9;
      pts.push({ x: prt.x + Math.cos(a) * 24, y: prt.y + Math.sin(a) * 24 });
    }
    return pts;
  };

  // the secret: a plug held through a thump and seated ON the beat (within the window either side of a kick)
  Room.prototype.bassSecretCheck = function () {
    const B = this.bassRT,
      sec = this.def.secret;
    if (!B || !sec || this.secretFound || !B.started) return;
    const ph = (this.t - B.kickT) % B.dur;
    if (!(ph < BEAT_WIN || ph > B.dur - BEAT_WIN)) return;
    this.secretFound = true;
    this.onEvent('secret', sec);
    A().chime(9);
    Fx.sparkle(sec.x, sec.y, '#ffe9bd', 14);
    Fx.starburst(sec.x, sec.y, 10);
  };

  // the Wake: the speaker wall blushes and a gentle chord comes up; the bass drops out and the room breathes; a teaser later
  Room.prototype.bassWake = function () {
    const B = this.bassRT;
    B.stopAt = this.t + 4;
    if (B.wall >= 0) this.decorRT[B.wall].blush = 1;
    [4, 6, 8].forEach((n, i) => this.later(0.14 * i, () => A().chime(n)));
    if (this.def.teaser) this.later(5.4, () => A().sfx[this.def.teaser] && A().sfx[this.def.teaser]());
  };

  /* ---------------------------------------------------------------- drawing */
  // over the plugs: each seated plug's brass collar. Open and dull when loose (red just before a kick), closed and gold when locked
  Room.prototype.bassDrawCollars = function (ctx, t) {
    const B = this.bassRT,
      locked = this.st.flags.locked;
    const clock = B.audio ? B.aLast : this.t;
    for (const prt of this.plugList) {
      if (!prt.seatSock || prt.state === 'seating') continue;
      const c = B.collar[prt.id],
        lk = c.lock;
      // how close the next kick is (0 = now, 1 = a whole beat away) for a loose plug: its collar flares red as it nears
      const toKick = B.started ? Math.max(0, (B.nextT - (clock || 0)) / B.dur) : 1;
      const warn = !locked[prt.id] && B.started ? Math.max(0, 1 - toKick / 0.3) : 0;
      ctx.save();
      ctx.translate(prt.x, prt.y);
      ctx.rotate(c.ang || 0);
      ctx.lineCap = 'round';
      const R = 19;
      // the ring: brass, a gap that closes as it locks
      const gap = (1 - lk) * 1.1;
      ctx.beginPath();
      ctx.arc(0, 0, R, gap / 2 - Math.PI / 2, TAU - gap / 2 - Math.PI / 2);
      ctx.strokeStyle = lk > 0.5 ? '#f2c94c' : warn > 0.05 ? U.mix('#8a8f9c', '#ff5a44', warn) : '#8a8f9c';
      ctx.lineWidth = 3.4 + 1.6 * warn; // the warning is a swelling ring as well as a red one (not colour alone)
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.25 + 0.4 * lk).toFixed(3) + ')';
      ctx.lineWidth = 1;
      ctx.stroke();
      // the notch: where the twist is felt
      ctx.beginPath();
      ctx.arc(0, -R, 2.2, 0, TAU);
      ctx.fillStyle = lk > 0.5 ? '#fff0a8' : '#c9ced8';
      ctx.fill();
      if (c.flash > 0.02) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = 'rgba(255,236,160,' + (0.8 * c.flash).toFixed(3) + ')';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, R + 4 + 8 * (1 - c.flash), 0, TAU);
        ctx.stroke();
      }
      ctx.restore();
    }
  };
})();
