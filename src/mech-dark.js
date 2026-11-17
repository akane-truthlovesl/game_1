/* Snug — mech-dark.js : Midnight Snack (Level 19). A dark kitchen: the plug in your hand is a lantern, live sockets HUM (louder
   and higher as you near the one your plug fits, panned toward it), and Biscuit is asleep on her cushion: fast hands make noise,
   noise fills her alertness, and a cat who wakes sits on a free socket until you pet her. Never a failure, always a story. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const U = G.U,
    T = G.T,
    Rules = G.Rules,
    Fx = G.Fx,
    Art = G.Art,
    Room = G.Room;
  const A = () => G.Audio;
  const H = () => G.Haptics;
  const sat = U.sat;

  Room.prototype.darkInit = function () {
    const d = this.def.dark;
    this.dark = { lit: 0, pingT: 0, hum: 0 };
    this.st.flags.blocked = this.st.flags.blocked || {};
    const c = d.cat;
    this.sleeper = c ? { x: c.x, y: c.y, hx: c.x, hy: c.y, al: 0, state: 'asleep', t: 0, sock: null, walk: 0, breath: 0, petT: 0, wakeAt: 0 } : null;
  };

  // is the cat sitting on this socket?
  Room.prototype.catBlocks = function (sockId) {
    return !!(this.st.flags.blocked && this.st.flags.blocked[sockId]);
  };

  Room.prototype.darkUpdate = function (dt) {
    const L = this.L;
    const held = this.plugList.find((p) => p.state === 'held');
    /* ---- the radar: live sockets hum for the plug in hand ---- */
    let gain = 0,
      pitch = 220,
      pan = 0;
    if (held) {
      let best = null,
        bd = 1e9;
      for (const sk of L.sockets) {
        if (!Rules.canSeat(L, this.st, held.id, sk.id).ok) continue;
        const dd = Math.hypot(held.x - sk.x, held.y - sk.y);
        if (dd < bd) (bd = dd), (best = sk);
      }
      if (best) {
        const k = sat(1 - bd / 200);
        gain = 0.085 * Math.pow(k, 1.5);
        pitch = 220 + 240 * k;
        pan = U.clamp((best.x - held.x) / 120, -1, 1) * 0.8;
        // a sonar ping on the socket itself, quicker as you close in
        this.dark.pingT -= dt;
        if (this.dark.pingT <= 0 && k > 0.12) {
          this.dark.pingT = 0.35 + 0.9 * (1 - k);
          Fx.ring(best.x, best.y, 30 + 16 * k, '#9fe6ff', 0.5, 1.5);
        }
      }
    }
    A().hum(gain, pan, pitch);
    // the lantern warms up as soon as a plug is carried
    this.dark.lit = U.damp(this.dark.lit, held ? 1 : 0, 0.12, dt);

    /* ---- Biscuit ---- */
    const c = this.sleeper;
    if (!c) return;
    c.t += dt;
    c.breath = Math.sin(this.t * 1.7) * 0.5 + 0.5;
    // noise: fast hands (and hard landings) wake a sleeper; quiet hands let her rest
    let noise = 0;
    if (held) {
      // sound carries: the same hurry is half as loud from the far side of the room
      const prox = 0.45 + 0.55 * sat(1 - Math.hypot(held.x - c.x, held.y - c.y) / 300);
      noise = sat((held.vAvg - 300) / 560) * prox;
    }
    if (c.state === 'asleep') {
      c.al = U.clamp(c.al + noise * dt * 1.5 - dt * 0.2, 0, 1);
      if (c.al > 0.45 && !c.twitched) {
        c.twitched = true;
        Fx.caption('z?', c.x, c.y - 26, '#cfe3ff');
      }
      if (c.al < 0.25) c.twitched = false;
      if (c.al >= 1) this.catWake();
    } else if (c.state === 'waking') {
      if (c.t > 1.0) this.catWalk();
    } else if (c.state === 'walking') {
      c.walk = sat(c.walk + dt / 1.1);
      const e = U.ease.inOutCubic(c.walk);
      c.x = U.lerp(c.hx, c.tx, e);
      c.y = U.lerp(c.hy, c.ty, e);
      if (c.walk >= 1) {
        c.state = 'sitting';
        c.t = 0;
        this.st.flags.blocked[c.sock.id] = true;
        A().sfx.cat();
        Fx.caption('mrrp', c.x, c.y - 28, '#fff7dc');
        this.updateCover();
      }
    } else if (c.state === 'petted') {
      if (c.t > 1.4) {
        // back to the cushion
        c.state = 'returning';
        c.walk = 0;
        c.tx = c.hx;
        c.ty = c.hy;
        c.fx = c.x;
        c.fy = c.y;
      }
    } else if (c.state === 'returning') {
      c.walk = sat(c.walk + dt / 1.2);
      const e = U.ease.inOutCubic(c.walk);
      c.x = U.lerp(c.fx, c.tx, e);
      c.y = U.lerp(c.fy, c.ty, e);
      if (c.walk >= 1) {
        c.state = 'asleep';
        c.al = 0;
        c.t = 0;
        A().sfx.purr(1.2);
      }
    }
  };

  Room.prototype.catWake = function () {
    const c = this.sleeper;
    c.state = 'waking';
    c.t = 0;
    A().sfx.cat();
    H().pulse('poke');
    Fx.caption('mrrp?', c.x, c.y - 28, '#fff7dc');
  };
  // she pads over to a free socket and sits on it
  Room.prototype.catWalk = function () {
    const c = this.sleeper,
      L = this.L;
    const free = L.sockets.filter((sk) => !sk.dead && !Object.values(this.st.seat).includes(sk.id));
    free.sort((a, b) => Math.hypot(a.x - c.x, a.y - c.y) - Math.hypot(b.x - c.x, b.y - c.y));
    const sk = free[0];
    if (!sk) {
      c.state = 'asleep';
      c.al = 0;
      return;
    }
    c.sock = sk;
    c.tx = sk.x + 4;
    c.ty = sk.y + 6;
    c.walk = 0;
    c.state = 'walking';
  };
  // a tap on the cat: she purrs, lets go of the socket and goes back to sleep
  Room.prototype.petCat = function (x, y) {
    const c = this.sleeper;
    if (!c || c.state !== 'sitting') return false;
    if (Math.hypot(x - c.x, y - c.y) > 38) return false;
    c.state = 'petted';
    c.t = 0;
    if (c.sock) delete this.st.flags.blocked[c.sock.id];
    A().sfx.purr(1.6);
    H().pulse('poke');
    Fx.sparkle(c.x, c.y, '#ffe9bd', 8);
    Fx.caption('purr', c.x, c.y - 28, '#fff7dc');
    this.updateCover();
    return true;
  };
})();
