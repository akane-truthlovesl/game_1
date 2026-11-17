/* Snug — mech-rail.js : kinematic strips (Level 11 and the boss).
   A strip with a `rail` slides along its track under your thumb like a heavy drawer on good runners:
     held   → a damped spring toward your finger (a little lag = weight)
     flicked→ rolling friction; detents catch it when it slows (a ratchet tick at each one it passes)
     ends   → brass stops (a ting and a small bounce)
     cables → a seated cable that would run out of length stops the strip (a rubber-band bonk, the device squints)
   Seated plugs ride along (their roots move, the cables trail). Rules.* owns legality; this file owns the feel. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const U = G.U,
    T = G.T,
    Rules = G.Rules,
    Fx = G.Fx,
    Geom = G.Geom,
    Room = G.Room;
  const A = () => G.Audio;
  const H = () => G.Haptics;
  const sat = U.sat;

  Room.prototype.railInit = function () {
    this.railRT = {};
    this.st.flags.moving = {};
    for (const strip of this.L.rails) {
      const R = strip.rail;
      const s = strip.k * R.len;
      this.railRT[strip.id] = { strip, s, v: 0, held: false, grab: null, settled: true, di: Rules.nearestDetent(strip, strip.k), bonkCd: 0, tickCd: 0 };
      const srt = this.stripRT[strip.id];
      srt.k = strip.k;
      srt.moving = false;
      srt.railHint = 0;
    }
  };

  /* ---------------------------------------------------------------- input */
  // a strip body under the finger (plugs and switches are tested first by the caller)
  Room.prototype.stripAt = function (x, y) {
    if (!this.railRT) return null;
    for (const id in this.railRT) {
      const strip = this.railRT[id].strip;
      if (Geom.pointPolyDist(x, y, Rules.stripPoly(strip)) < 3) return strip;
    }
    return null;
  };
  // the ridged end caps are the strip's handles: a touch there wins over a seated plug that is merely near
  Room.prototype.gripAt = function (x, y) {
    if (!this.railRT) return null;
    for (const id in this.railRT) {
      const strip = this.railRT[id].strip;
      const ca = Math.cos(strip.angle),
        sa = Math.sin(strip.angle);
      const dx = x - strip.x,
        dy = y - strip.y;
      const lx = dx * ca + dy * sa,
        ly = -dx * sa + dy * ca;
      const half = (strip.n * strip.pitch) / 2;
      if (Math.abs(ly) <= 27 && Math.abs(lx) >= half + 1 && Math.abs(lx) <= half + 17) return strip;
    }
    return null;
  };
  Room.prototype.grabStrip = function (strip, ptrId, x, y) {
    const r = this.railRT[strip.id];
    if (!r || r.grab) return false;
    const R = strip.rail;
    const ux = (R.x1 - R.x0) / R.len,
      uy = (R.y1 - R.y0) / R.len;
    const proj = (x - R.x0) * ux + (y - R.y0) * uy;
    r.grab = { id: ptrId, off: r.s - proj, fx: x, fy: y, t: 0 };
    r.held = true;
    r.settled = false;
    this.st.flags.moving[strip.id] = true;
    this.cancelHint();
    this.idle = 0;
    A().sfx.tick();
    H().pulse('grab');
    return true;
  };
  Room.prototype.moveStripGrab = function (strip, x, y) {
    const r = this.railRT[strip.id];
    if (!r || !r.grab) return;
    r.grab.fx = x;
    r.grab.fy = y;
  };
  Room.prototype.releaseStrip = function (strip) {
    const r = this.railRT[strip.id];
    if (!r) return;
    r.held = false;
    r.grab = null;
    this.idle = 0;
  };

  /* ---------------------------------------------------------------- the plug that is pulling hardest at a position */
  Room.prototype.railBlocker = function (strip, k) {
    let best = null,
      br = 0;
    for (const prt of this.plugList) {
      if (!prt.seatSock) continue;
      const sk = this.L.socketsById[prt.seatSock];
      if (sk.strip !== strip) continue;
      const ratio = Rules.railRatio(this.L, strip, prt.id, sk.id, k);
      if (ratio > br) (br = ratio), (best = prt);
    }
    return best;
  };

  // move the sockets and everything seated in them to fraction k (no settling yet)
  Room.prototype.railPlace = function (strip, k, settled) {
    Rules.setStripK(strip, k);
    for (const prt of this.plugList) {
      if (!prt.seatSock) continue;
      const sk = this.L.socketsById[prt.seatSock];
      if (sk.strip !== strip) continue;
      prt.pose.x = sk.x;
      prt.pose.y = sk.y;
      if (prt.state === 'seated') prt.rope.pin(sk.x, sk.y, sk.fx, sk.fy, !!settled);
    }
  };

  /* ---------------------------------------------------------------- per-frame physics */
  Room.prototype.railUpdate = function (dt) {
    if (!this.railRT || dt <= 0) return;
    const L = this.L;
    let anyMoving = false;
    let vMax = 0;
    for (const id in this.railRT) {
      const r = this.railRT[id],
        strip = r.strip,
        R = strip.rail,
        Ls = R.len;
      const srt = this.stripRT[id];
      const ux = (R.x1 - R.x0) / Ls,
        uy = (R.y1 - R.y0) / Ls;
      const dpos = R.detents.map((k) => k * Ls);
      // the nearest detent the strip may actually rest at (a seated cable forbids the ones it cannot follow to)
      const nearest = (s) => {
        let bi = -1,
          bd = 1e9;
        dpos.forEach((p, i) => {
          const d = Math.abs(p - s);
          if (d < bd && Rules.railSpanOK(L, this.st, strip, s / Ls, p / Ls)) (bd = d), (bi = i);
        });
        return bi < 0 ? r.di : bi;
      };
      r.bonkCd = Math.max(0, r.bonkCd - dt);
      r.tickCd = Math.max(0, r.tickCd - dt);
      const pan = this.pan(strip.x);
      let target = null;
      /* ---- forces ---- */
      if (r.held) {
        const g = r.grab;
        g.t += dt;
        const proj = (g.fx - R.x0) * ux + (g.fy - R.y0) * uy;
        target = U.clamp(proj + g.off, 0, Ls);
        r.v += (T.railK * (target - r.s) - T.railC * r.v) * dt;
      } else if (!r.settled) {
        const spd = Math.abs(r.v);
        if (spd > 0) r.v -= Math.sign(r.v) * Math.min(spd, (T.railFric + T.railDrag * spd) * dt);
        // the detent catches the strip once it has slowed enough: a damped spring toward the nearest legal detent.
        // The pull saturates (a detent's well is ~7u wide), so a far detent is approached smoothly, never with a kick.
        const w = U.smoothstep(T.railSnapV, 0.6 * T.railSnapV, Math.abs(r.v));
        const di = nearest(r.s);
        const e = U.clamp(dpos[di] - r.s, -7, 7);
        r.v += w * (T.railSnapK * e - T.railSnapC * r.v) * dt;
      }
      r.v = U.clamp(r.v, -900, 900);
      const oldS = r.s;
      let ns = r.s + r.v * dt;
      /* ---- end stops ---- */
      if (ns < 0 || ns > Ls) {
        const hit = Math.abs(r.v);
        ns = ns < 0 ? 0 : Ls;
        r.v = !r.held && hit > 30 ? -Math.sign(r.v) * Math.min(220, hit * T.railBounce) : 0; // a held strip just stops: no jitter against the thumb
        if (hit > 40 && r.bonkCd <= 0) {
          r.bonkCd = 0.18;
          A().sfx.endstop(sat(hit / 500), pan);
          H().pulse('seat', 0.7);
          Fx.kick((ns === 0 ? -1 : 1) * ux * 0.9, uy * 0.9);
          srt.squash.x = T.squash * 0.9;
        }
      }
      /* ---- a seated cable that would run out of length stops the strip ---- */
      const k0 = oldS / Ls,
        k1 = ns / Ls;
      let blockedBy = null;
      if (Math.abs(k1 - k0) > 1e-6 && !Rules.railSpanOK(L, this.st, strip, k0, k1)) {
        let lo = k0,
          hi = k1;
        for (let i = 0; i < 9; i++) {
          const mid = (lo + hi) / 2;
          if (Rules.railSpanOK(L, this.st, strip, k0, mid)) lo = mid;
          else hi = mid;
        }
        ns = lo * Ls;
        blockedBy = this.railBlocker(strip, hi);
        const vi = Math.abs(r.v);
        r.v = !r.held && vi > 25 ? -Math.sign(r.v) * Math.min(120, vi * T.railBounce * 0.6) : 0; // a taut cable is a soft wall: a small recoil only when flicked into it
        if (vi > 60 && r.bonkCd <= 0) {
          r.bonkCd = 0.25;
          A().sfx.twang();
          H().pulse('refuse', 0.8);
          srt.squash.x = T.squash * 0.6;
        }
      }
      // a thumb pulling against a taut cable: the device strains, the cable creaks
      if (r.held && target !== null && Math.abs(target - ns) > 1.5 && !blockedBy && !Rules.railSpanOK(L, this.st, strip, ns / Ls, target / Ls)) blockedBy = this.railBlocker(strip, target / Ls);
      if (blockedBy) {
        blockedBy.railStrain = Math.min(1, Math.max(blockedBy.railStrain || 0, 0.7 + 0.3 * sat(Math.abs((target === null ? ns : target) - ns) / 14)));
        blockedBy.dev.wince = Math.max(blockedBy.dev.wince, 0.16);
      }
      r.s = ns;
      const moved = Math.abs(ns - oldS) > 1e-5;
      if (moved) {
        this.railPlace(strip, ns / Ls, false);
        srt.k = strip.k;
        // a tick for every detent passed
        for (let i = 0; i < dpos.length; i++) {
          if ((oldS - dpos[i]) * (ns - dpos[i]) < 0 && Math.abs(r.v) > 20 && r.tickCd <= 0) {
            r.tickCd = 0.03;
            A().sfx.detent(sat(Math.abs(r.v) / 420), pan);
            H().pulse('tick');
          }
        }
      }
      /* ---- settle into a detent ---- */
      if (!r.held && !r.settled) {
        const di = nearest(r.s);
        if (Math.abs(r.v) < 4 && Math.abs(dpos[di] - r.s) < 0.45) {
          r.s = dpos[di];
          r.v = 0;
          r.settled = true;
          r.di = di;
          Rules.applyDetent(L, this.st, id, di);
          this.st.flags.moving[id] = false;
          this.railPlace(strip, strip.k, true);
          srt.k = strip.k;
          const heavy = r.lastSpeed ? sat(r.lastSpeed / 350) : 0.5;
          A().sfx.clunk(0.55 + 0.4 * heavy, this.world.mat, pan);
          H().pulse('seat', 0.55 + 0.4 * heavy);
          Fx.kick(0, 0.4);
          srt.squash.x = T.squash * 0.7;
          srt.ledFlick = 1;
          this.updateCover();
          this.onEvent('rail', di);
        }
      }
      const spd = Math.abs(r.v);
      if (spd > 6) r.lastSpeed = spd;
      vMax = Math.max(vMax, spd);
      srt.moving = r.held || !r.settled;
      anyMoving = anyMoving || srt.moving;
      this.st.flags.moving[id] = srt.moving;
      // the grips pulse when the player seems unsure what the strip is for
      const unsure = !r.held && ((this.def.id === 11 && this.t < 3.4 && this.phase !== 'waking') || (this.idle > 8 && this.phase === 'playing' && !L.plugs.every((p) => this.st.seat[p.id])));
      srt.railHint = U.damp(srt.railHint || 0, unsure ? 1 : 0, 0.3, dt);
    }
    for (const prt of this.plugList) prt.railStrain = U.damp(prt.railStrain || 0, 0, 0.12, dt);
    A().rail(sat(vMax / 420));
  };
})();
