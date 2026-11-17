/* Snug — mech-ghost.js : Ghost Cables (Act 5, Level 44). The last complete run of a level leaves its cables behind, for the next attempt:
   each cable's shape at the wake is kept (G.ghostStore, in this page only: it is never saved, and a reload forgets it). On the next attempt the
   ghost cables are drawn cold, and a live cable that follows its ghost (most of its points within reach of the ghost's route) glows warm.
   A plug that seats while its cable is warm is counted: the secret is every plug seated warm. A level turns it on with `ghost: true`. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const U = G.U,
    Room = G.Room;
  G.ghostStore = G.ghostStore || {};
  const STEP = 4; // rope nodes sampled per point of a ghost
  const NEAR = 12; // u: a point this close to the ghost's route is following it
  const WARM = 0.6; // the share of a cable's points that must follow the ghost to glow warm

  const sample = (rope) => {
    const out = [];
    for (let i = 0; i < rope.n; i += STEP) out.push({ x: rope.x[i], y: rope.y[i] });
    out.push({ x: rope.x[rope.n - 1], y: rope.y[rope.n - 1] });
    return out;
  };
  const nearest = (p, poly) => {
    let best = 1e9;
    for (const q of poly) {
      const d = Math.hypot(p.x - q.x, p.y - q.y);
      if (d < best) best = d;
    }
    return best;
  };
  // how closely a live cable follows a ghost: the share of its points within NEAR of the ghost's route
  Room.prototype.ghostMatch = function (prt, ghost) {
    const live = sample(prt.rope);
    let n = 0;
    for (const p of live) if (nearest(p, ghost) < NEAR) n++;
    return n / live.length;
  };

  Room.prototype.ghostInit = function () {
    this.ghostRT = { prev: G.ghostStore[this.def.id] || null, warm: {}, seatedPrev: {}, route: {} };
  };

  Room.prototype.ghostUpdate = function () {
    const R = this.ghostRT;
    if (!R) return;
    for (const prt of this.plugList) {
      const seated = !!this.st.seat[prt.id];
      if (seated && !R.seatedPrev[prt.id]) {
        // the moment of seating: was this cable on its ghost's route? and this run's route is kept, for the next run
        const g = R.prev && R.prev[prt.id];
        R.match = R.match || {};
        R.match[prt.id] = g ? this.ghostMatch(prt, g) : -1; // the share that followed the ghost at the seat (kept for the probes)
        R.warm[prt.id] = !!g && R.match[prt.id] >= WARM;
        R.route[prt.id] = sample(prt.rope);
      }
      R.seatedPrev[prt.id] = seated;
    }
  };

  // at the wake, the cables of this run become the next run's ghosts; a run whose every plug seated warm earns the secret
  Room.prototype.ghostWake = function () {
    const R = this.ghostRT;
    if (!R) return;
    // the next run's ghosts are the routes this run's cables took when they seated (where they settled afterwards is not the route)
    const snap = {};
    for (const prt of this.plugList) snap[prt.id] = R.route[prt.id] || sample(prt.rope);
    G.ghostStore[this.def.id] = snap;
    if (this.def.secret && this.def.secret.on === 'warm' && !this.secretFound && this.L.plugs.every((p) => R.warm[p.id])) {
      this.secretFound = true;
      this.later(0.9, () => this.onEvent('secret', this.def.secret));
    }
  };

  // the ghost cables: cold where the last run went, and warm where this cable is following it
  Room.prototype.ghostDraw = function (ctx) {
    const R = this.ghostRT;
    if (!R || !R.prev) return;
    ctx.save();
    for (const prt of this.plugList) {
      const g = R.prev[prt.id];
      if (!g || g.length < 2) continue;
      const seated = !!this.st.seat[prt.id];
      const m = seated ? 1 : this.ghostMatch(prt, g);
      ctx.beginPath();
      ctx.moveTo(g[0].x, g[0].y);
      for (let i = 1; i < g.length; i++) ctx.lineTo(g[i].x, g[i].y);
      ctx.strokeStyle = m >= WARM ? 'rgba(255,200,120,0.55)' : 'rgba(150,200,255,0.28)';
      ctx.lineWidth = m >= WARM ? 3 : 2;
      ctx.setLineDash([3, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  };
})();
