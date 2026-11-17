/* Snug — mech-pendulum.js : the pendulum (Act 4, Level 37 "Swing & Plug"). A carriage hangs from a high pivot on a rope and swings
   across the hall; its sockets ride the swing. Its position is a function of the room clock (Rules.pendulumAt), the same clock the
   timer windows read, so the window is the bottom of each arc: a timed socket opens twice a period, as the carriage passes beneath
   the pivot in each direction. Releasing high on an arc misses (the socket is out of reach) and the plug falls. Each top of the arc
   the carriage whistles and its pivot creaks, on a pitch from the swing's period. Seating every plug inside one period is the golden
   pendulum. Rules.* knows the motion (pendulumAt, pendulumMove) and the cables (verifyPendulum); this file keeps the sound and the
   secret. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const U = G.U,
    Rules = G.Rules,
    Fx = G.Fx,
    Room = G.Room;
  const A = () => G.Audio;

  Room.prototype.pendulumInit = function () {
    this.pendRT = this.L.carried
      .filter((s) => s.carrier.mode === 'pendulum')
      .map((st) => ({
        st,
        C: st.carrier,
        lastTh: 0,
        dir: 0,
        waving: false, // the wake's high-five: the next top of the arc
        cyc0: null, // the swing (period) in which the first plug of the golden run was seated
        prev: 0, // plugs seated on this carriage last frame
        // the creak's pitch is the swing's period as a note: 4 s is C3, 2 s is C4, and so on
        creak: Math.round(60 + 12 * Math.log2(2 / st.carrier.period)),
      }));
  };

  // the carriage moves with the clock; its sockets follow; a top of the arc is a turn of the swing
  Room.prototype.pendulumUpdate = function (dt) {
    const clock = this.timerClock(),
      L = this.L;
    for (const r of this.pendRT) {
      const st = r.st,
        p = Rules.pendulumMove(L, st, clock);
      r.clock = clock;
      const dth = p.th - r.lastTh;
      r.lastTh = p.th;
      const dir = dth > 1e-6 ? 1 : dth < -1e-6 ? -1 : 0;
      if (dir && r.dir && dir !== r.dir) this.pendulumTurn(r);
      if (dir) r.dir = dir;
      // the golden run: every plug seated on this carriage inside one period of its swing
      const here = L.plugs.filter((q) => this.st.seat[q.id] && L.socketsById[this.st.seat[q.id]].strip === st).length;
      const cyc = Math.floor((clock + 0.4) / st.carrier.period);
      if (here === 0) r.cyc0 = null;
      else if (here > r.prev && r.cyc0 === null) r.cyc0 = cyc;
      if (here === L.plugs.length && r.cyc0 === cyc && !this.secretFound && this.def.secret) {
        this.secretFound = true;
        this.later(0.9, () => this.onEvent('secret', this.def.secret));
      }
      r.prev = here;
    }
  };

  // the top of an arc: Choo's whistle, the pivot's creak, and (after the wake) the high-five
  Room.prototype.pendulumTurn = function (r) {
    const st = r.st,
      pan = this.pan(st.x);
    A().inst && A().inst('celesta', 88, 0.2, pan, 0);
    A().inst && A().inst('wood', r.creak, 0.3, pan, 0.02);
    if (r.waving) {
      r.waving = false;
      Fx.starburst(st.x, st.y - 10, 10);
      A().chime && A().chime(5, 0, pan);
      Fx.caption('high five!', st.x, st.y - 34, '#fff0c8');
    }
  };

  // the wake: the carriage and the device it has been waiting for high-five at the next top of the arc
  Room.prototype.pendulumWake = function () {
    for (const r of this.pendRT) r.waving = true;
  };

  // the hanger: a beam, a brass hook at the pivot, and a rope from the pivot to the carriage's top (drawn under the devices)
  Room.prototype.pendulumDraw = function (ctx) {
    for (const r of this.pendRT) {
      const C = r.C,
        st = r.st,
        px = C.pivot.x,
        py = C.pivot.y;
      ctx.save();
      // the beam the pivot hangs from
      ctx.fillStyle = '#5a4634';
      ctx.fillRect(px - 70, py - 12, 140, 7);
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(px - 70, py - 5, 140, 3);
      // the rope: a slight sag as it goes, so it reads as cord, not a stick
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.quadraticCurveTo((px + st.x) / 2 + (st.x - px) * 0.04, (py + st.y) / 2, st.x, st.y - 6);
      ctx.strokeStyle = '#6b5a48';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.stroke();
      // the brass hook at the pivot
      ctx.beginPath();
      ctx.arc(px, py + 4, 6, 0, U.TAU);
      ctx.strokeStyle = '#c9922e';
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.restore();
    }
  };
})();
