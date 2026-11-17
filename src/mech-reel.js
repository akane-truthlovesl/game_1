/* Snug — mech-reel.js : the cable reel (Act 5, Level 47 "Rewind"). A device with `cable: { start, len, reel: true }` has its cable wound on a
   reel: its length on the table starts at `start`, and the reel is a brass drum under the device's port. Drag the drum down and the cable is
   let out (up to `len`, the most it will reach); drag it up and the cable is wound back in (down to a short minimum): the plug is drawn to the
   device along its own route, as a tape is wound back. Rules.* keeps the full reach (`len` is the most the cable can be); the reel is the
   player's choice of how much of it there is on the bench. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const U = G.U,
    Room = G.Room;
  const REEL_R = 16; // u: the drum's grab radius
  const MIN_LEN = 110; // u: the shortest a cable can be wound back to
  const K = 1.6; // u of cable per u of drag

  Room.prototype.reelInit = function () {
    this.reelRT = { grab: null, devs: {} };
    for (const prt of this.plugList) {
      const d = prt.plug.device;
      if (!d.def.cable || !d.def.cable.reel) continue;
      const rt = { dev: d, handle: { x: d.port.x, y: d.port.y + 24 }, max: d.def.cable.len, min: MIN_LEN, rope: prt.rope };
      this.reelRT.devs[d.id] = rt;
    }
    this.st.flags.reel = {};
  };

  // the drum under a reel device's port, if a press lands on it
  Room.prototype.reelAt = function (x, y) {
    const R = this.reelRT;
    if (!R || R.grab) return null;
    for (const id in R.devs) {
      const d = R.devs[id];
      if (Math.hypot(x - d.handle.x, y - d.handle.y) < REEL_R + 6) return d;
    }
    return null;
  };
  Room.prototype.grabReel = function (ptrId, x, y) {
    const d = this.reelAt(x, y);
    if (!d) return false;
    this.reelRT.grab = { d, ptr: ptrId, y0: y, len0: d.rope.len };
    this.cancelHint();
    this.idle = 0;
    return true;
  };
  Room.prototype.moveReel = function (x, y) {
    const g = this.reelRT && this.reelRT.grab;
    if (!g) return;
    const want = U.clamp(g.len0 + (y - g.y0) * K, g.d.min, g.d.max);
    // the rope's segments are its length on the table: a shorter rope is pulled in by its own constraints
    const rope = g.d.rope;
    rope.len = want;
    rope.seg = want / (rope.n - 1);
    this.st.flags.reel[g.d.dev.id] = want;
    if (want <= g.d.min + 0.5) this.reelWoundBack = true;
  };
  Room.prototype.endReel = function () {
    if (this.reelRT) this.reelRT.grab = null;
  };
  // the reel's state, for the rules and the hints: the length on the table, per device
  Room.prototype.reelSync = function () {
    const R = this.reelRT;
    if (!R) return;
    for (const id in R.devs) this.st.flags.reel[id] = R.devs[id].rope.len;
  };
})();
