/* Snug — mech-fan.js : the fan's catch (Act 5, Level 41 "Fan Mail"). The wind band (the rope's `wind`, in rope.js) pushes a plug that is
   let go inside it; the fence and its slot do the rest: a plug the gust carries onto a socket is caught there. A catch is the same
   seat as a hand's (Rules.canSeat decides, seatInto seats it); it only needs a plug that is free (not held) and within reach of a socket's
   mouth. A level turns the catch on with `wind: { ..., catch: true }`. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const Rules = G.Rules,
    Room = G.Room;
  const CATCH_R = 22; // u: a free plug this close to a socket's mouth is caught

  Room.prototype.fanCatch = function () {
    const L = this.L;
    for (const prt of this.plugList) {
      if (prt.state !== 'rest' || this.st.seat[prt.id] || prt.grab) continue;
      for (const sock of L.sockets) {
        if (Math.hypot(prt.x - sock.x, prt.y - sock.y) > CATCH_R) continue;
        if (!Rules.canSeat(L, this.st, prt.id, sock.id).ok) continue;
        this.seatInto(prt, sock, { power: 0.5, crisp: 0.5, fromSock: null, fromPos: null, popped: false, caught: true });
        if (this.def.secret && this.def.secret.on === 'caught' && !this.secretFound) {
          this.secretFound = true; // the gust, and nothing else, put it home: the golden tumbler
          this.later(0.9, () => this.onEvent('secret', this.def.secret));
        }
        return;
      }
    }
  };
})();
