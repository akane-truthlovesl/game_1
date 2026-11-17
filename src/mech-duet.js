/* Snug — mech-duet.js : Duet With Yourself (Act 5, Level 48). Tap the record dot, then drag a plug: its path is recorded (up to eight seconds)
   and kept for this page (G.duetStore: never saved, like the ghosts). On the next attempt a ghost hand plays that plug's path back, after a
   short pause, while the thumb plays the other part. A plug the ghost seats and a plug the thumb seats within a second of each other are the
   duet: the golden wind-up. The ghost is a pointer id of its own (GHOST_PTR), so the room's rules see a hand on the plug, and nothing else. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const Room = G.Room;
  G.duetStore = G.duetStore || {};
  const GHOST_PTR = -7;
  const MAX_REC = 8; // s
  const SAMPLE = 0.05; // s between recorded points
  const PAUSE = 1.2; // s before the ghost starts, on each attempt
  const DOT = { x: 318, y: 92, r: 18 }; // the record dot, top right

  Room.prototype.duetInit = function () {
    const stored = G.duetStore[this.def.id] || null;
    this.duetRT = { armed: false, rec: null, recPlug: null, t0: 0, last: -1, store: stored, ghost: null, seatAt: {}, seatPrev: {} };
    if (stored) this.duetRT.ghost = { plug: stored.plug, path: stored.path, dur: stored.path[stored.path.length - 1].t, t: -PAUSE, active: false, done: false };
  };

  // the record dot: a tap arms it (the next plug dragged is recorded); a tap again disarms it
  Room.prototype.duetTap = function (x, y) {
    const D = this.duetRT;
    if (!D || this.phase !== 'playing' || Math.hypot(x - DOT.x, y - DOT.y) > DOT.r) return false;
    if (D.rec) return true;
    D.armed = !D.armed;
    G.Audio && G.Audio.sfx && G.Audio.sfx.tick && G.Audio.sfx.tick();
    return true;
  };

  Room.prototype.duetGrab = function (prt) {
    const D = this.duetRT;
    if (!D || prt.grab.id === GHOST_PTR) return;
    if (D.armed && !D.rec) {
      D.armed = false;
      D.rec = [];
      D.recPlug = prt.id;
      D.t0 = this.t;
      D.last = -1;
    }
  };
  Room.prototype.duetMove = function (prt, x, y) {
    const D = this.duetRT;
    if (!D || !D.rec || prt.id !== D.recPlug || prt.grab.id === GHOST_PTR) return;
    const t = this.t - D.t0;
    if (t > MAX_REC) return this.duetStopRec();
    if (t - D.last >= SAMPLE) {
      D.rec.push({ t, x, y });
      D.last = t;
    }
  };
  Room.prototype.duetRelease = function (prt) {
    const D = this.duetRT;
    if (!D || !D.rec || prt.id !== D.recPlug) return;
    this.duetStopRec();
  };
  Room.prototype.duetStopRec = function () {
    const D = this.duetRT;
    if (!D || !D.rec) return;
    if (D.rec.length >= 2) {
      G.duetStore[this.def.id] = { plug: D.recPlug, path: D.rec };
      G.Audio && G.Audio.sfx && G.Audio.sfx.chirp && G.Audio.sfx.chirp();
    }
    D.rec = null;
    D.recPlug = null;
  };

  // the ghost hand: after its pause it takes the recorded plug and plays its path, then lets go
  Room.prototype.duetUpdate = function (dt) {
    const D = this.duetRT;
    if (!D) return;
    for (const prt of this.plugList) {
      const seated = !!this.st.seat[prt.id];
      if (seated && !D.seatPrev[prt.id]) D.seatAt[prt.id] = this.t;
      D.seatPrev[prt.id] = seated;
    }
    const g = D.ghost;
    if (!g || g.done) return;
    g.t += dt;
    const prt = this.plugRT[g.plug];
    if (!prt) return;
    if (!g.active) {
      if (g.t < 0) return;
      if (!this.grabPlug(prt, GHOST_PTR, g.path[0].x, g.path[0].y)) return;
      g.active = true;
    }
    const s = Math.min(g.t, g.dur);
    let i = 0;
    while (i < g.path.length - 2 && g.path[i + 1].t < s) i++;
    const a = g.path[i],
      b = g.path[i + 1] || a,
      u = b.t > a.t ? (s - a.t) / (b.t - a.t) : 0;
    this.moveGrab(prt, a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u);
    if (g.t >= g.dur) {
      g.done = true;
      g.active = false;
      if (prt.grab && prt.grab.id === GHOST_PTR) this.releaseGrab(prt);
    }
  };

  // the duet: the ghost's seat and the thumb's seat, within a second of each other
  Room.prototype.duetWake = function () {
    const D = this.duetRT;
    if (!D || !this.def.secret || this.def.secret.on !== 'duet' || this.secretFound) return;
    const ghostPlug = D.ghost && D.ghost.plug;
    if (!ghostPlug || D.seatAt[ghostPlug] === undefined) return;
    const others = this.L.plugs.filter((p) => p.id !== ghostPlug).map((p) => D.seatAt[p.id]);
    if (!others.length || others.some((t) => t === undefined)) return;
    const near = others.every((t) => Math.abs(t - D.seatAt[ghostPlug]) < 1.0);
    if (near) {
      this.secretFound = true;
      this.later(0.9, () => this.onEvent('secret', this.def.secret));
    }
  };

  // the record dot, drawn over the bench: a red dot, lit while armed, and a bar that runs down while the path is recorded
  Room.prototype.duetDraw = function (ctx, t) {
    const D = this.duetRT;
    if (!D) return;
    ctx.save();
    const on = D.rec || (D.armed && Math.sin(t * 6) > -0.2);
    ctx.beginPath();
    ctx.arc(DOT.x, DOT.y, DOT.r, 0, Math.PI * 2);
    ctx.fillStyle = on ? '#e5483c' : 'rgba(120,70,60,0.8)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,230,220,0.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.font = '700 8px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff4ee';
    ctx.fillText(D.rec ? 'REC' : 'REC', DOT.x, DOT.y);
    if (D.rec) {
      const k = Math.min(1, (this.t - D.t0) / MAX_REC);
      ctx.fillStyle = 'rgba(229,72,60,0.8)';
      ctx.fillRect(DOT.x - 22, DOT.y + DOT.r + 6, 44 * (1 - k), 3);
    }
    ctx.restore();
  };
})();
