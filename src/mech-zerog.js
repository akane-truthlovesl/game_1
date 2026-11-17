/* Snug — mech-zerog.js : the station (Act 4). With no floor to hold it, a flicked plug drifts: its cable is a tether, so the rope's own
   length constraint brings the plug back when the cable is taut, and the world's low friction and damping (`fric`, `damp`) let it coast.
   What the station adds is the catch. A drifting plug that passes a free socket slowly enough is taken by the socket's magnet and
   docks; faster than that it flies past, and the tether turns it round. A plug let go over a socket is seated the usual way (the release
   rule); this file only catches the ones that are still moving. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const Rules = G.Rules,
    Room = G.Room,
    Fx = G.Fx;
  const A = () => G.Audio;
  const CATCH_SPEED = 150; // u/s: a drifting plug slower than this is caught by a socket it passes within CATCH_R
  const CATCH_R = 24; // u: the catch radius of a socket's magnet
  const MIN_DRIFT = 14; // u/s: below this a plug is simply resting; the release rule seats it, the catch does not

  // the cabin's inner walls: a drifting plug that reaches one rebounds off it (it does not leave the room)
  const WALLS = { x0: 30, x1: 330, y0: 60, y1: 600 };
  const REST = 0.55; // a rebound keeps this share of the speed
  Room.prototype.zeroGUpdate = function (dt) {
    for (const prt of this.plugList) {
      if (prt.state !== 'rest' || prt.grab || prt.seatSock) continue;
      // the rebound: the plug's Verlet velocity (x - px) is turned round at the wall it reached
      const rope = prt.rope,
        k = rope.n - 1;
      let x = rope.x[k],
        y = rope.y[k];
      const vx = x - rope.px[k],
        vy = y - rope.py[k];
      if (x < WALLS.x0) {
        rope.x[k] = WALLS.x0;
        rope.px[k] = WALLS.x0 - Math.abs(vx) * REST; // moving right again, a little slower
      } else if (x > WALLS.x1) {
        rope.x[k] = WALLS.x1;
        rope.px[k] = WALLS.x1 + Math.abs(vx) * REST;
      }
      if (y < WALLS.y0) {
        rope.y[k] = WALLS.y0;
        rope.py[k] = WALLS.y0 - Math.abs(vy) * REST;
      } else if (y > WALLS.y1) {
        rope.y[k] = WALLS.y1;
        rope.py[k] = WALLS.y1 + Math.abs(vy) * REST;
      }
      const sp = prt.rope.speed || 0;
      if (sp < MIN_DRIFT || sp > CATCH_SPEED) continue;
      for (const sock of this.L.sockets) {
        if (Math.hypot(sock.x - prt.x, sock.y - prt.y) > CATCH_R) continue;
        if (Object.values(this.st.seat).indexOf(sock.id) >= 0) continue; // the socket is taken
        if (!Rules.canSeat(this.L, this.st, prt.id, sock.id).ok) continue;
        this.seatInto(prt, sock, { fromSock: null, fromPos: null, power: 0.45, crisp: 0.9 });
        Fx.caption('caught', sock.x, sock.y - 30, '#dff4ff');
        A().sfx.tock && A().sfx.tock(0.6);
        return; // one catch a frame: the rest keep drifting
      }
    }
  };
})();
