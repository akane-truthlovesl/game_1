/* Snug — mech-mirror.js : Mirror, Mirror (Act 5, Level 45). A glass seam runs down the middle of the bench. Each device on one side has a
   reflection on the other, and the two are a pair: when a plug is grabbed, its reflection is grabbed by the same finger, at the mirror of the
   finger's place, and moves and lets go with it. One drag can seat two plugs. The pair's sockets are mirror images too, but each socket is
   keyed to its own plug, so the answer is one. A plug that is dragged across the seam itself makes a crack: a golden secret is for a run
   with no crack at all. A level turns it on with `mirror: { axis, pairs: [[a, b], ...] }`. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const Room = G.Room;
  const CRACK_R = 8; // u: a plug this close to the seam cracks the glass

  Room.prototype.mirrorInit = function () {
    const d = this.def.mirror;
    this.mirrorRT = { axis: d.axis, partner: {}, busy: false, crack: false };
    for (const [a, b] of d.pairs) {
      this.mirrorRT.partner[a] = b;
      this.mirrorRT.partner[b] = a;
    }
  };

  Room.prototype.mirrorOf = function (x) {
    return 2 * this.mirrorRT.axis - x;
  };

  // a grab on one of a pair: its reflection is grabbed by the same pointer, at the mirror of where the finger is
  Room.prototype.mirrorGrab = function (prt) {
    const M = this.mirrorRT;
    if (!M || M.busy || !prt.grab) return;
    const q = this.plugRT[M.partner[prt.id]];
    if (!q || q.grab) return;
    M.busy = true;
    this.grabPlug(q, prt.grab.id, this.mirrorOf(prt.grab.fx), prt.grab.fy);
    M.busy = false;
  };

  // the reflection follows the mirror of the finger; a finger across the seam cracks it
  Room.prototype.mirrorMove = function (prt, x, y) {
    const M = this.mirrorRT;
    if (!M || M.busy || !prt.grab) return;
    if (Math.abs(x - M.axis) < CRACK_R) M.crack = true;
    const q = this.plugRT[M.partner[prt.id]];
    if (q && q.grab) {
      q.grab.fx = this.mirrorOf(x);
      q.grab.fy = y;
    }
  };

  // a release lets go of the pair together
  Room.prototype.mirrorRelease = function (prt) {
    const M = this.mirrorRT;
    if (!M || M.busy) return;
    const q = this.plugRT[M.partner[prt.id]];
    if (!q || !q.grab) return;
    M.busy = true;
    this.releaseGrab(q);
    M.busy = false;
  };
})();
