/* Snug — mech-tape.js : the roll of tape (Level 14, "Tape It"). Frayed sockets carry no power; a roll of tape has only
   so many wraps. Drag the roll's tongue to a frayed socket and scribble around it (or just hold the tongue there):
   tape winds on with a rip-tick at every quarter, and the socket is mended. Rules.* decides what a mended socket allows;
   this file owns the hands-on ritual. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const U = G.U,
    Rules = G.Rules,
    Fx = G.Fx,
    Room = G.Room;
  const A = () => G.Audio;
  const H = () => G.Haptics;
  const TAU = U.TAU;
  const NEED = 1.7 * TAU * 26; // about two turns around a socket (tangential distance): a scribble in either direction counts

  Room.prototype.tapeInit = function () {
    const d = this.def.tape;
    this.tape = { x: d.x, y: d.y, total: d.wraps, left: d.wraps, held: false, id: null, fx: d.x, fy: d.y, lock: null, lastA: undefined, tang: 0, holdT: 0, tipX: d.x + 22, tipY: d.y, tipVX: 0, tipVY: 0, hint: 0, jig: 0, lastSpeed: 0, ticked: 0 };
    for (const s of this.L.strips)
      for (const sk of s.sockets) if (sk.frayed) this.stripRT[s.id].fray[sk.id] = { prog: 0, mended: false, t: Math.random() * 6, ticked: 0 };
    this.st.mended = this.st.mended || {};
  };

  Room.prototype.tapeAt = function (x, y) {
    const T = this.tape;
    if (!T || T.left <= 0) return null;
    const r = Math.hypot(x - T.x, y - T.y);
    return r < 31 ? T : null;
  };
  Room.prototype.grabTape = function (ptrId, x, y) {
    const T = this.tape;
    if (!T || T.held || T.left <= 0) return false;
    T.held = true;
    T.id = ptrId;
    T.fx = x;
    T.fy = y;
    T.lock = null;
    T.lastA = undefined;
    T.tang = 0;
    T.holdT = 0;
    T.ticked = 0;
    this.cancelHint();
    this.idle = 0;
    A().sfx.tick();
    A().sfx.rip(0.1);
    H().pulse('grab');
    return true;
  };
  Room.prototype.moveTape = function (x, y) {
    const T = this.tape;
    if (!T || !T.held) return;
    T.fx = x;
    T.fy = y;
  };
  Room.prototype.releaseTape = function () {
    const T = this.tape;
    if (!T) return;
    T.held = false;
    T.id = null;
    T.lock = null;
    T.lastA = undefined;
    T.tang = 0;
    T.holdT = 0;
    this.idle = 0;
  };

  Room.prototype.mendSocket = function (sk) {
    const T = this.tape,
      f = this.stripRT[sk.strip.id].fray[sk.id];
    f.mended = true;
    f.prog = 1;
    this.st.mended[sk.id] = true;
    T.left--;
    T.jig = 1;
    T.lock = null;
    T.tang = 0;
    T.holdT = 0;
    T.lastA = undefined;
    A().at(this.pan(sk.x), () => {
      A().sfx.mend();
      A().chime(4);
    });
    H().pulse('mend');
    Fx.sparkle(sk.x, sk.y, '#dfe6f0', 10);
    Fx.ring(sk.x, sk.y, 34, '#cfd8e6', 0.45, 2);
    Fx.kick(0, 0.5);
    this.stripRT[sk.strip.id].squash.x = G.T.squash * 0.6;
    this.updateCover();
    this.onEvent('mend', sk);
  };

  Room.prototype.tapeUpdate = function (dt) {
    const T = this.tape;
    if (!T) return;
    T.jig = Math.max(0, T.jig - dt * 2.4);
    // the unmended sockets spit blue sparks now and then
    for (const s of this.L.strips)
      for (const sk of s.sockets) {
        const f = this.stripRT[s.id].fray[sk.id];
        if (!f) continue;
        f.t += dt;
        if (!f.mended && Math.random() < dt * 0.9 && this.phase === 'playing') Fx.sparks(sk.x, sk.y - 4, '#bfe0ff', 3, 0, -1, 2.2);
        if (!f.mended && !(T.held && T.lock === sk)) f.prog = Math.max(0, f.prog - dt * 0.9); // half-wound tape peels back
      }
    // the tongue's tip: a loose spring toward the finger (or home)
    const tx = T.held ? T.fx : T.x + 24,
      ty = T.held ? T.fy : T.y + 2;
    T.tipVX += ((tx - T.tipX) * 180 - T.tipVX * 16) * dt;
    T.tipVY += ((ty - T.tipY) * 180 - T.tipVY * 16) * dt;
    T.tipX += T.tipVX * dt;
    T.tipY += T.tipVY * dt;
    T.hint = U.damp(T.hint, T.hint > 0.05 ? 0 : 0, 0.8, dt);
    if (!T.held) return;
    // lock onto the nearest unmended frayed socket under the finger, and keep it while the scribble stays near it
    // (neighbouring sockets are only 40 u apart, so a circle around one passes close to the next)
    let best = null,
      bd = 48;
    if (T.lock) {
      const f0 = this.stripRT[T.lock.strip.id].fray[T.lock.id];
      if (f0 && !f0.mended && Math.hypot(T.fx - T.lock.x, T.fy - T.lock.y) < 62) {
        best = T.lock;
        bd = -1;
      }
    }
    if (bd >= 0)
    for (const s of this.L.strips)
      for (const sk of s.sockets) {
        const f = this.stripRT[s.id].fray[sk.id];
        if (!f || f.mended) continue;
        const d = Math.hypot(T.fx - sk.x, T.fy - sk.y);
        if (d < bd) (bd = d), (best = sk);
      }
    if (best !== T.lock) {
      T.lock = best;
      T.lastA = undefined;
      T.tang = 0;
      T.holdT = 0;
      T.ticked = 0;
      if (best) {
        A().sfx.magnet();
        H().pulse('magnet');
      }
    }
    if (!T.lock) return;
    const sk = T.lock,
      f = this.stripRT[sk.strip.id].fray[sk.id];
    const dx = T.fx - sk.x,
      dy = T.fy - sk.y,
      r = Math.hypot(dx, dy);
    const a = Math.atan2(dy, dx);
    let moved = 0;
    if (T.lastA !== undefined && r > 8 && r < 60) {
      let da = a - T.lastA;
      while (da > Math.PI) da -= TAU;
      while (da < -Math.PI) da += TAU;
      moved = Math.abs(da) * r; // tangential distance this frame: a scribble in either direction counts
      T.tang += moved;
    }
    T.lastA = a;
    // the gentle alternative: hold the tongue on the socket
    if (r < 18 && moved < 0.6) T.holdT += dt;
    else T.holdT = Math.max(0, T.holdT - dt * 1.5);
    const p = Math.max(Math.min(1, T.tang / NEED), Math.min(1, T.holdT / 1.5));
    f.prog = Math.max(f.prog, U.damp(f.prog, p, 0.035, dt));
    if (moved > 0.8) A().sfx.rip(f.prog);
    // a rip-tick at each quarter
    const q = Math.floor(f.prog * 4);
    if (q > T.ticked && q < 4) {
      T.ticked = q;
      A().at(this.pan(sk.x), () => A().sfx.rip(0.5 + q * 0.15));
      H().pulse('tick', 1.2);
      Fx.sparkle(sk.x, sk.y, '#dfe6f0', 3);
    }
    if (f.prog >= 0.995) this.mendSocket(sk);
  };

  // the hand shows the ritual: to the socket, then two small circles
  Room.prototype.tapeHintPoly = function (sk) {
    const T = this.tape;
    const pts = [{ x: T.x, y: T.y }, { x: (T.x + sk.x) / 2, y: (T.y + sk.y) / 2 - 10 }, { x: sk.x + 24, y: sk.y }];
    for (let i = 1; i <= 36; i++) {
      const a = (i / 18) * TAU;
      pts.push({ x: sk.x + Math.cos(a) * 24, y: sk.y + Math.sin(a) * 24 });
    }
    return pts;
  };
})();
