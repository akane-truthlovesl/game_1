/* Snug — mech-sling.js : the stretch (Act 4, Level 33). A cable is a rubber band: pull a plug away from its device and the cable stores
   the pull, and let go and the plug is slung back through its device's port, with a speed that is the pull times a spring. The tether
   (the cable's length) and the cabin's walls take it from there, exactly as they take a drifting plug (mech-zerog.js). While a plug is
   held, its flight is run ahead on paper with the same step, damping, tether and walls, and the dotted arc you see is that flight: the
   preview and the launch are one integrator, so the arc is what the plug does, not a picture of it. Levels turn it on with `sling: true`. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const U = G.U,
    Room = G.Room;
  const A = () => G.Audio;
  const TAU = U.TAU;
  const STEP = 1 / 120; // the room's fixed physics step (room.js STEP): the launch and the preview use it too
  const SPRING = 3.0; // u/s of launch speed per u of pull: a cable pulled to its full length flings the plug at ~900 u/s
  const PREVIEW = 240; // steps (2 s) of the arc drawn while a plug is held
  const WALLS = { x0: 30, x1: 330, y0: 60, y1: 600 };
  const REST = 0.55;

  // the launch velocity (u/s) of a plug pulled away from its device: back toward the port, and through it
  Room.prototype.slingVelocity = function (prt) {
    const dev = prt.plug.device,
      port = dev.port,
      len = dev.len;
    const dx = port.x - prt.x,
      dy = port.y - prt.y,
      d = Math.hypot(dx, dy);
    if (d < 4) return { x: 0, y: 0, pull: 0 };
    const pull = Math.min(d, len),
      k = pull * SPRING;
    return { x: (dx / d) * k, y: (dy / d) * k, pull: pull / len };
  };

  // a copy of a plug's rope, for the preview: the same arrays and the same step, so the arc is the real flight, cable and all
  const cloneRope = (rope) => {
    const c = Object.create(Object.getPrototypeOf(rope));
    for (const k of Object.keys(rope)) {
      const v = rope[k];
      c[k] = ArrayBuffer.isView(v) ? v.slice() : Array.isArray(v) ? v.slice() : v;
    }
    c.twin = null;
    return c;
  };
  // the flight from a plug with launch velocity v: the rope's own steps (its tether, its damping, its cable), and the cabin's walls
  Room.prototype.slingPath = function (prt, v) {
    const c = cloneRope(prt.rope);
    c.mode = 0;
    const k = c.n - 1;
    c.px[k] = c.x[k] - v.x * STEP;
    c.py[k] = c.y[k] - v.y * STEP;
    const pts = [{ x: c.x[k], y: c.y[k] }];
    for (let i = 0; i < PREVIEW; i++) {
      c.step(STEP, this.L.obstacles);
      let x = c.x[k],
        y = c.y[k];
      const vx = x - c.px[k],
        vy = y - c.py[k];
      if (x < WALLS.x0) {
        c.x[k] = WALLS.x0;
        c.px[k] = WALLS.x0 - Math.abs(vx) * REST;
      } else if (x > WALLS.x1) {
        c.x[k] = WALLS.x1;
        c.px[k] = WALLS.x1 + Math.abs(vx) * REST;
      }
      if (y < WALLS.y0) {
        c.y[k] = WALLS.y0;
        c.py[k] = WALLS.y0 - Math.abs(vy) * REST;
      } else if (y > WALLS.y1) {
        c.y[k] = WALLS.y1;
        c.py[k] = WALLS.y1 + Math.abs(vy) * REST;
      }
      x = c.x[k];
      y = c.y[k];
      pts.push({ x, y });
    }
    return pts;
  };

  // the release of a pulled plug that no socket took: it is slung. The rope's last step is set to the launch, so the physics carries on
  Room.prototype.slingLaunch = function (prt) {
    const v = this.slingVelocity(prt);
    if (!v.pull) return;
    prt._slung = true; // a plug that was slung and then docks: Level 33's secret
    const rope = prt.rope,
      k = rope.n - 1;
    rope.px[k] = rope.x[k] - v.x * STEP;
    rope.py[k] = rope.y[k] - v.y * STEP;
    // the cable twangs: a pitch that rises with the pull (the rubber is tighter)
    A().pluck && A().pluck(52 + Math.round(v.pull * 14), 0.25 + 0.6 * v.pull, this.pan(prt.x));
    if (this.devRT[prt.plug.device.id]) this.devRT[prt.plug.device.id].hopS.kick(0.5 * v.pull);
  };

  // the arc: while a plug is held away from its port, its flight if let go now, dotted
  Room.prototype.slingDraw = function (ctx) {
    for (const prt of this.plugList) {
      if (prt.state !== 'held' || !prt.grab || prt.seatSock) continue;
      const v = this.slingVelocity(prt);
      if (!v.pull) continue;
      // the arc is recomputed about ten times a second (a steady hand keeps its arc; a sharp change of pull shows at once)
      const c = prt._sling;
      const still = c && this.t - c.t < 0.1 && Math.abs(c.v.x - v.x) < 14 && Math.abs(c.v.y - v.y) < 14;
      const pts = still ? c.pts : this.slingPath(prt, v);
      if (!still) prt._sling = { v, pts, t: this.t };
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 6; i < pts.length; i += 9) {
        const f = i / pts.length;
        ctx.globalAlpha = (0.55 - 0.4 * f) * (0.4 + 0.6 * v.pull);
        ctx.beginPath();
        ctx.arc(pts[i].x, pts[i].y, 2.4 - 1.4 * f, 0, TAU);
        ctx.fillStyle = '#ffe9b8';
        ctx.fill();
      }
      ctx.restore();
    }
  };
})();
