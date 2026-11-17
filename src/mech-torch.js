/* Snug — mech-torch.js : Torchlight (Act 5, Level 42). The room is black. A torch's pool of light is the only way to see: press anywhere
   and the pool goes under your thumb (a press on a plug still grabs the plug). A socket the light has touched is remembered (a ghost ring),
   and only a remembered socket will take a plug: a plug let go over a socket it has not seen falls, softly, with "not yet". The memory is
   the room's (st.flags.seen): it lasts the attempt, not the save. A level turns it on with `torch: { x, y, r }`. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const U = G.U,
    Fx = G.Fx,
    Room = G.Room;
  const A = () => G.Audio;
  const H = () => G.Haptics;
  const MAT = { x0: 18, x1: 342, y0: 44, y1: 616 };

  Room.prototype.torchInit = function () {
    const d = this.def.torch;
    this.torchRT = { x: d.x, y: d.y, r: d.r || 58, held: false, ptr: null, flick: 0 };
    this.st.flags.dark = true;
    this.st.flags.seen = {};
    this.torchSeeAll(); // the pool under the torch at the start shows what it touches
  };

  // every socket the pool has touched is seen, for good (until the attempt is reset)
  Room.prototype.torchSeeAll = function () {
    const T = this.torchRT;
    this.st.flags.torchAt = { x: T.x, y: T.y };
    for (const s of this.L.sockets) {
      if (!this.st.flags.seen[s.id] && Math.hypot(s.x - T.x, s.y - T.y) < T.r) {
        this.st.flags.seen[s.id] = true;
        A().sfx.tick && A().sfx.tick();
        Fx.sparkle(s.x, s.y, '#ffe7a8', 6);
      }
    }
  };

  Room.prototype.beginTorch = function (ptrId, x, y) {
    const T = this.torchRT;
    if (!T || this.phase !== 'playing' || T.held) return false;
    T.held = true;
    T.ptr = ptrId;
    T.x = x;
    T.y = y;
    this.cancelHint();
    this.idle = 0;
    H().pulse('grab');
    this.torchSeeAll();
    return true;
  };
  Room.prototype.moveTorch = function (x, y) {
    const T = this.torchRT;
    if (!T || !T.held) return;
    T.x = U.clamp(x, MAT.x0, MAT.x1);
    T.y = U.clamp(y, MAT.y0, MAT.y1);
    this.torchSeeAll();
  };
  Room.prototype.endTorch = function () {
    const T = this.torchRT;
    if (!T) return;
    T.held = false;
    T.ptr = null;
    this.idle = 0;
  };

  // the dark: a pool of light under the torch, black everywhere else; the sockets it has seen show as ghost rings
  Room.prototype.torchDraw = function (ctx, t) {
    const T = this.torchRT;
    if (!T) return;
    ctx.save();
    const R = T.r + 40;
    const g = ctx.createRadialGradient(T.x, T.y, 0, T.x, T.y, R);
    g.addColorStop(0, 'rgba(8,6,12,0)');
    g.addColorStop(T.r / R, 'rgba(8,6,12,0.18)');
    g.addColorStop(0.8, 'rgba(8,6,12,0.82)');
    g.addColorStop(1, 'rgba(8,6,12,0.95)');
    ctx.fillStyle = g;
    ctx.fillRect(MAT.x0 - 10, MAT.y0 - 10, MAT.x1 - MAT.x0 + 20, MAT.y1 - MAT.y0 + 20);
    // the torch's own warm light, and its lens
    const warm = ctx.createRadialGradient(T.x, T.y, 0, T.x, T.y, T.r);
    warm.addColorStop(0, 'rgba(255,214,140,0.16)');
    warm.addColorStop(1, 'rgba(255,214,140,0)');
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = warm;
    ctx.beginPath();
    ctx.arc(T.x, T.y, T.r, 0, U.TAU);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.beginPath();
    ctx.arc(T.x, T.y, 5 + (T.held ? 1.5 : 0) + 0.8 * Math.sin(t * 3), 0, U.TAU);
    ctx.fillStyle = '#fff0c4';
    ctx.fill();
    // a ghost ring on every socket the light has touched
    for (const s of this.L.sockets) {
      if (!this.st.flags.seen[s.id]) continue;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 12, 0, U.TAU);
      ctx.strokeStyle = 'rgba(255,230,170,0.42)';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
    ctx.restore();
  };
})();
