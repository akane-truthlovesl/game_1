/* Snug — mech-breaker.js : the breaker (Level 17, "Trip"). Every device draws watts (1-3 bolts); a strip has a capacity.
   Seat past it and the load meter crackles red for a beat (the telegraph: unplug in time and nothing happens), then the
   breaker trips: a clack, sparks, every plug pops out, the kettle's whistle is choked mid-note, and a moment later it
   resets itself. Funny, not punishing. Rules.* owns capacity (static packing); this file owns the drama. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const U = G.U,
    Rules = G.Rules,
    Fx = G.Fx,
    Room = G.Room;
  const A = () => G.Audio;
  const H = () => G.Haptics;

  Room.prototype.breakerInit = function () {
    this.loadRT = {};
    this.st.flags.tripped = {};
    for (const s of this.L.strips) if (s.cap) this.loadRT[s.id] = { strip: s, load: 0, warnT: -1, pulse: 0, shake: 0, resetT: -1, crackle: 0 };
  };

  // called after anything changes who is seated where
  Room.prototype.breakerCheck = function () {
    if (!this.loadRT) return;
    for (const id in this.loadRT) {
      const r = this.loadRT[id];
      r.load = Rules.load(this.L, this.st, r.strip);
      const over = r.load > r.strip.cap;
      if (over && r.warnT < 0 && !this.st.flags.tripped[id]) {
        // the telegraph: the meter goes red and crackles; there is time to pull a plug out
        r.warnT = 0;
        A().at(this.pan(r.strip.x), () => A().sfx.crackle());
        H().pulse('refuse');
        Fx.caption('too much!', r.strip.x, r.strip.y - 44, '#ffb0a0');
      } else if (!over && r.warnT >= 0) {
        r.warnT = -1;
        A().at(this.pan(r.strip.x), () => A().chime(7));
        Fx.caption('phew', r.strip.x, r.strip.y - 44, '#d7ffe0');
      }
    }
  };

  Room.prototype.breakerUpdate = function (dt) {
    for (const id in this.loadRT) {
      const r = this.loadRT[id];
      r.pulse = U.damp(r.pulse, r.warnT >= 0 ? 1 : r.load >= r.strip.cap ? 0.4 : 0, 0.15, dt);
      r.shake = Math.max(0, r.shake - dt * 3);
      this.stripRT[id].load = r.load;
      this.stripRT[id].loadPulse = r.pulse;
      this.stripRT[id].tripped = !!this.st.flags.tripped[id];
      if (r.warnT >= 0) {
        r.warnT += dt;
        r.crackle -= dt;
        if (r.crackle <= 0) {
          r.crackle = 0.11;
          Fx.sparks(r.strip.x + (Math.random() - 0.5) * 120, r.strip.y - 4, '#ffd9a0', 2, 0, -1, 2.4);
        }
        if (r.warnT >= 0.8 && this.phase === 'playing') this.tripStrip(r.strip);
      }
      if (r.resetT >= 0) {
        r.resetT -= dt;
        if (r.resetT <= 0) {
          r.resetT = -1;
          this.st.flags.tripped[id] = false;
          A().at(this.pan(r.strip.x), () => {
            A().sfx.click();
            A().chime(2);
          });
          this.stripRT[id].ledFlick = 1;
          Fx.caption('reset', r.strip.x, r.strip.y - 44, '#d7ffe0');
          this.refreshPower();
        }
      }
    }
  };

  Room.prototype.tripStrip = function (strip) {
    const r = this.loadRT[strip.id];
    r.warnT = -1;
    r.shake = 1;
    this.st.flags.tripped[strip.id] = true;
    this.flash = 0.8;
    A().at(this.pan(strip.x), () => {
      A().sfx.zap();
      A().sfx.thud(0.9);
      A().sfx.clack();
      A().sfx.choke(); // whatever was singing (the kettle) is cut off mid-note
    });
    H().pulse('cut');
    Fx.kick(0, 3);
    Fx.ring(strip.x, strip.y, 70, '#ffc79a', 0.5, 2.4);
    for (let i = 0; i < 6; i++) Fx.smoke(strip.x + (Math.random() - 0.5) * 100, strip.y);
    Fx.caption('clack!', strip.x, strip.y - 44, '#ffe0c0');
    // every plug on the strip pops out and flies home
    let k = 0;
    for (const prt of this.plugList) {
      if (!prt.seatSock) continue;
      const sk = this.L.socketsById[prt.seatSock];
      if (sk.strip !== strip) continue;
      const dev = prt.plug.device;
      this.hopTo(prt, dev.rest.x, dev.rest.y, 0.42, 0.06 * k++, () => {});
      A().sfx.pop();
    }
    this.undo.length = 0;
    this.updateCover();
    this.refreshPower();
    r.resetT = 1.5; // the breaker resets itself
  };
})();
