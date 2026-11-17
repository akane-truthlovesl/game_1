/* Snug — mech-orbital.js : Orbital Repair (Act 4, Level 35), the set piece. Eight devices wake in a cascade (the chain of Level 26: each
   listens to the one it follows), and the planet rises behind the porthole as the ring lights up. The secret is a cascade that never went
   dark: no device was ever put back on standby once it was awake. Rules.* does the chain; this file does the rise and the bookkeeping. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const U = G.U,
    Room = G.Room;

  Room.prototype.orbitalInit = function () {
    this.orbitRT = { earth: (this.def.decor || []).findIndex((d) => d.art === 'earthwin'), wasOn: {}, broken: false };
  };
  // the planet's rise follows the share of the ring that is awake; a standby after a device was awake breaks the cascade
  Room.prototype.orbitalUpdate = function (dt) {
    const O = this.orbitRT,
      n = this.L.devices.length;
    let on = 0;
    for (const d of this.L.devices) {
      const st = this.devRT[d.id].p;
      if (st === 'on') {
        on++;
        O.wasOn[d.id] = true;
      } else if (O.wasOn[d.id] && this.phase === 'playing') O.broken = true;
    }
    if (O.earth >= 0) this.decorRT[O.earth].lit = U.damp(this.decorRT[O.earth].lit || 0, this.completed ? 1 : on / n, 0.05, dt);
  };
  // the Wake: the secret, if the cascade never went dark
  Room.prototype.orbitalWakeCheck = function () {
    if (!this.orbitRT || !this.def.secret || this.secretFound || this.orbitRT.broken) return;
    this.secretFound = true;
    this.later(1.2, () => this.onEvent('secret', this.def.secret));
  };
})();
