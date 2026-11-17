/* Snug — mech-brownout.js : Brownout (Act 5, Level 49). The lights go out part way through a solve: the first seat is the last light the room
   gives for a while. For a few seconds the bench is black, except a lantern under each plug in a hand and a small LED on each seated socket.
   Nothing about the plugs changes: seating works in the dark, and the sockets and devices are where they were, remembered from the light.
   The lights come back on their own. A level that finishes while the lights are out earns the golden secret. A level turns it on with
   `brownout: { after, secs }` (after = seats that bring the dark, secs = how long it lasts). Memory, not ear: this is not the lantern of
   Midnight Snack (Level 19), which hums; here nothing sounds the way, and the solve is remembered. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const U = G.U,
    Fx = G.Fx,
    Room = G.Room;
  const A = () => G.Audio;
  const MAT = { x0: 18, x1: 342, y0: 44, y1: 616 };

  Room.prototype.brownoutInit = function () {
    const d = this.def.brownout;
    this.brownRT = { after: d.after || 1, secs: d.secs || 6, t: 0, dark: false, done: false, fade: 0 };
  };

  Room.prototype.brownoutUpdate = function (dt) {
    const B = this.brownRT;
    if (!B) return;
    const seats = Object.values(this.st.seat).filter(Boolean).length;
    if (!B.done && seats >= B.after && this.phase === 'playing') {
      B.done = true;
      B.dark = true;
      B.t = 0;
      A().sfx.powerdown && A().sfx.powerdown();
      Fx.caption('lights out', 180, 96, '#c8d4ff');
    }
    if (B.dark) {
      B.t += dt;
      B.fade = Math.min(1, B.t / 0.5);
      if (B.t >= B.secs) {
        B.dark = false;
        B.fade = 0;
        A().chime && A().chime(5, 0, 0);
        Fx.caption('the lights are back', 180, 96, '#fff0c8');
      }
      // a solve that completes in the dark is the secret
      const total = this.L.plugs.length;
      if (seats === total && this.def.secret && this.def.secret.on === 'dark' && !this.secretFound) {
        this.secretFound = true;
        this.later(0.9, () => this.onEvent('secret', this.def.secret));
      }
    }
  };

  // the dark: black over the bench, a lantern pool under each plug in a hand, and a small LED on each seated socket
  Room.prototype.brownoutDraw = function (ctx) {
    const B = this.brownRT;
    if (!B || !B.dark) return;
    ctx.save();
    ctx.globalAlpha = 0.93 * B.fade;
    ctx.fillStyle = '#05060a';
    ctx.fillRect(MAT.x0 - 10, MAT.y0 - 10, MAT.x1 - MAT.x0 + 20, MAT.y1 - MAT.y0 + 20);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'lighter';
    for (const prt of this.plugList) {
      if (prt.state !== 'held') continue;
      const g = ctx.createRadialGradient(prt.x, prt.y, 0, prt.x, prt.y, 70);
      g.addColorStop(0, 'rgba(255,220,150,0.55)');
      g.addColorStop(1, 'rgba(255,220,150,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(prt.x, prt.y, 70, 0, U.TAU);
      ctx.fill();
    }
    for (const s of this.L.sockets) {
      if (!this.st.seat || !Object.values(this.st.seat).includes(s.id)) continue;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 4, 0, U.TAU);
      ctx.fillStyle = 'rgba(190,255,200,0.9)';
      ctx.fill();
    }
    ctx.restore();
  };
})();
