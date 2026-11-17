/* Snug — mech-timer.js : timer sockets (Level 18, "Egg Timer"). A timed socket is open only inside a repeating window; a ring around
   it fills with light toward the next opening and glows while it is open. The window gates INSERTION, not power: a plug seated in
   a window stays seated after it shuts, so this is rhythm, not a reflex test. A plug released up to Rules.TIMER_GRACE seconds before
   an opening simply waits in front of the socket and seats the instant it opens. Tapping the egg timer restarts the beat.
   Rules.* only knows opensIn(); this file keeps the room's clock (st.flags.clock). */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const U = G.U,
    Rules = G.Rules,
    Fx = G.Fx,
    Room = G.Room;
  const A = () => G.Audio;

  Room.prototype.timerInit = function () {
    this.timerRT = {};
    this.clockOff = 0;
    this.beatIx = -1;
    this.beat = (this.def && this.def.beat) || 1.2;
    let n = 0;
    for (const sk of this.L.sockets) if (sk.timer) this.timerRT[sk.id] = { sock: sk, idx: n++, open: false, openT: 0, flash: 0 };
  };

  Room.prototype.timerClock = function () {
    return this.t - this.clockOff;
  };

  Room.prototype.timerUpdate = function (dt) {
    const clock = this.timerClock();
    this.st.flags.clock = clock;
    const occ = {};
    for (const k in this.st.seat) if (this.st.seat[k]) occ[this.st.seat[k]] = true;
    const quiet = this.phase === 'waking' || this.phase === 'settling' || this.phase === 'cut';
    // the room's metronome: one soft tock per beat, the downbeat louder; it stops when the room is full
    const bi = Math.floor(clock / this.beat);
    if (bi !== this.beatIx) {
      this.beatIx = bi;
      if (!quiet && !this.L.plugs.every((p) => this.st.seat[p.id])) A().sfx.tock2(bi % 4 === 0 ? 0.9 : 0.5);
    }
    for (const id in this.timerRT) {
      const r = this.timerRT[id],
        sk = r.sock;
      const rt = this.stripRT[sk.strip.id];
      rt.timer = rt.timer || {};
      if (occ[id]) {
        rt.timer[id] = null; // a taken socket drops its ring: its work is done
        r.open = false;
        continue;
      }
      const wait = Rules.opensIn(this.st, sk);
      const open = wait === 0;
      if (open && !r.open) {
        // the window opens: this socket's note (a music box that thins out as sockets fill) and a ring of light
        r.openT = 0;
        r.flash = 1;
        if (!quiet) A().chime(1 + r.idx * 2, 0, this.pan(sk.x));
        Fx.ring(sk.x, sk.y, 26, '#bff5c8', 0.35, 2);
      }
      r.open = open;
      if (open) r.openT += dt;
      r.flash = Math.max(0, r.flash - dt * 2.4);
      const T = sk.timer;
      const ph = (((this.st.flags.clock || 0) - T.phase) % T.period + T.period) % T.period; // where the window is in its period
      rt.timer[id] = { open: open ? 1 : 0, frac: open ? 1 - r.openT / T.on : 1 - wait / (T.period - T.on), flash: r.flash, ph };
    }
  };

  // the egg timer's dial: tap it and the beat starts over (sockets 1 and 4 open first), a ding, a ring of light
  Room.prototype.timerReset = function () {
    this.clockOff = this.t;
    this.beatIx = -1;
    this.st.flags.clock = 0;
    for (const id in this.timerRT) {
      this.timerRT[id].flash = 1;
      this.timerRT[id].open = false;
    }
    for (const q of this.plugList) if (q.state === 'seating' && q.anim && q.anim.t < 0) q.anim.t = -Rules.opensIn(this.st, q.anim.sock);
    A().chime(7, 0, 0);
    Fx.caption('ding!', 180, this.L.strips[0].y - 54, '#d7ffe0');
  };
})();
