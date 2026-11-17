/* Snug — mech-doll.js : the dollhouse (Act 5, Level 46). A miniature board sits in a corner of the bench, under a glass frame. Its devices are
   `mini`. The big room's sockets are `doll`: they are locked (Rules.canSeat: `locked`) until every miniature plug is seated, and then the
   locks open for good. A level turns it on with `doll: true`. The rules know the lock; this file owns the open flag, the caption, and the
   frame's light: the frame glows when the miniature is whole. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const Fx = G.Fx,
    Room = G.Room;
  const A = () => G.Audio;

  Room.prototype.dollInit = function () {
    this.dollRT = { open: false, minis: this.L.plugs.filter((p) => p.device.mini).map((p) => p.id), flash: 0 };
    this.st.flags.doll = { open: false };
  };

  // the lock opens when every miniature plug is home, and stays open
  Room.prototype.dollUpdate = function (dt) {
    const D = this.dollRT;
    if (!D || D.open) return;
    if (D.minis.length && D.minis.every((id) => this.st.seat[id])) {
      D.open = true;
      D.flash = 1;
      this.st.flags.doll.open = true;
      A().chime && A().chime(6, 0, 0);
      Fx.caption('the house is open', 180, 300, '#ffe9a8');
    }
  };
})();
