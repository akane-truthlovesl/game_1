/* Snug — mech-wet.js : a socket in a puddle (Level 16, "Puddle"). A wet socket refuses plugs with a splash and a zzt;
   wake the hair dryer and its warm wind dries the puddle (about 3 s, visibly), and then the socket is safe. The first time
   one device changes the room for another. Rules.* only says "wet until dry"; this file owns the drying, the wind, the sounds. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const U = G.U,
    Rules = G.Rules,
    Fx = G.Fx,
    Room = G.Room;
  const A = () => G.Audio;
  const H = () => G.Haptics;
  const DRY_SECS = 3.4;

  Room.prototype.wetInit = function () {
    this.wetRT = {};
    this.st.dry = this.st.dry || {};
    for (const sk of this.L.sockets)
      if (sk.wet) {
        const by = this.L.devicesById[sk.wetBy];
        this.wetRT[sk.id] = { w: 1, sock: sk, by, shine: 0, drip: 0, wind: 0, windT: 0 };
      }
  };

  Room.prototype.wetUpdate = function (dt) {
    let wind = 0;
    for (const id in this.wetRT) {
      const r = this.wetRT[id],
        sk = r.sock;
      r.shine = U.damp(r.shine, r.w > 0.04 ? 1 : 0, 0.3, dt);
      if (this.st.dry[id]) {
        r.w = U.damp(r.w, 0, 0.1, dt);
        continue;
      }
      const dr = r.by ? this.devRT[r.by.id] : null;
      const blowing = dr && dr.p === 'on';
      r.wind = U.damp(r.wind, blowing ? 1 : 0, 0.25, dt);
      if (blowing) {
        wind = Math.max(wind, r.wind);
        r.w -= dt / DRY_SECS;
        // warm wind: streaks of air from the dryer's nozzle toward the puddle, and steam off the water
        r.windT -= dt;
        if (r.windT <= 0) {
          r.windT = 0.05;
          const dx = sk.x - r.by.x,
            dy = sk.y - r.by.y,
            d = Math.hypot(dx, dy) || 1;
          const t0 = Math.random();
          Fx.spawn(Fx.KIND.DUST, r.by.x + (dx / d) * (28 + t0 * 30) + (Math.random() - 0.5) * 10, r.by.y + (dy / d) * (28 + t0 * 30) + (Math.random() - 0.5) * 10, (dx / d) * 150, (dy / d) * 150, 0.5, 1.4, '#ffffff');
          if (Math.random() < 0.5) Fx.steam(sk.x + (Math.random() - 0.5) * 50, sk.y + (Math.random() - 0.5) * 20);
        }
        if (r.w <= 0.04) {
          r.w = 0;
          this.st.dry[id] = true;
          A().at(this.pan(sk.x), () => {
            A().sfx.cling();
            A().chime(6);
          });
          H().pulse('mend');
          Fx.sparkle(sk.x, sk.y, '#bfe9ff', 12);
          Fx.ring(sk.x, sk.y, 52, '#d8f2ff', 0.55, 2.2);
          Fx.caption('dry!', sk.x, sk.y - 30, '#e8f7ff');
          this.updateCover();
          this.onEvent('dry', sk);
        }
      } else if (r.w < 1) r.w = Math.min(1, r.w + dt * 0.05); // a puddle slowly creeps back if the wind stops
    }
    A().wind(wind);
  };

  // the hint for "wait": the dryer is working on it
  Room.prototype.wetWaiting = function () {
    for (const id in this.wetRT) if (!this.st.dry[id]) return true;
    return false;
  };
})();
