/* Snug — mech-gates.js : hoops (Level 12 "Fairy Lights"). Two posts and a gap; a cable that runs THROUGH the gap threads
   the gate, lights its glass bulb (a glass note) and — if it is the right colour — lets its device wake.
   Rules.* owns reach and power (through-the-hoop routes); this file watches the live cables and owns the feel. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const U = G.U,
    Rules = G.Rules,
    Fx = G.Fx,
    Geom = G.Geom,
    Art = G.Art,
    Room = G.Room;
  const A = () => G.Audio;
  const H = () => G.Haptics;

  // the obstacles a cable meets: the level's own, and (on a lanes level) the bars of every gate that is another cable's lane
  Room.prototype.obsFor = function (prt) {
    if (!this.L.lanes) return this.L.obstacles;
    if (!prt._obs) prt._obs = this.L.obstacles.concat(Rules.laneBars(this.L, prt.plug.key));
    return prt._obs;
  };
  Room.prototype.gateInit = function () {
    this.gateRT = {};
    this.st.thread = {};
    this.thrCnt = {};
    this.gateT = 0;
    this.threadedCount = 0;
    for (const g of this.L.gates) this.gateRT[g.id] = { lit: 0, target: 0, pop: 0, nudge: 0, who: 0, hint: 0 };
    for (const p of this.L.plugs) this.st.thread[p.id] = {};
    // a level may start with some cables already through their hoops
    this.gateUpdate(1, true);
  };

  // odd number of crossings of the gap segment = the cable runs through it
  function through(pts, a, b) {
    let c = 0;
    for (let i = 0; i < pts.length - 1; i++) if (Geom.segInter(pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y, a.x, a.y, b.x, b.y)) c++;
    return c % 2 === 1;
  }

  Room.prototype.gateUpdate = function (dt, instant) {
    const L = this.L;
    this.gateT -= dt;
    if (this.gateT <= 0) {
      this.gateT = 0.05;
      let changed = false;
      for (const prt of this.plugList) {
        const via = prt.plug.device.via;
        if (!via.length) continue;
        const r = prt.rope,
          pts = [];
        for (let i = 0; i < r.n; i += 2) pts.push({ x: r.x[i], y: r.y[i] });
        pts.push({ x: r.x[r.n - 1], y: r.y[r.n - 1] });
        for (const g of via) {
          const cur = !!this.st.thread[prt.id][g.id];
          let now = through(pts, g.a, g.b);
          // a lanes clip snaps: a seated cable that has run through it stays latched, even as the slack of the cable settles (Level 38)
          if (this.def.lanes && cur && !now && this.st.seat[prt.id]) now = true;
          const key = prt.id + '|' + g.id;
          // debounce: a reading must hold for two checks (100 ms) before the gate flips
          if (now === cur) this.thrCnt[key] = 0;
          else {
            this.thrCnt[key] = (this.thrCnt[key] || 0) + 1;
            if (instant || this.thrCnt[key] >= 2) {
              this.thrCnt[key] = 0;
              this.st.thread[prt.id][g.id] = now;
              changed = true;
              if (!instant) this.onThread(prt, g, now);
            }
          }
        }
      }
      if (changed) {
        // gates stay lit while any cable of their colour runs through them
        this.threadedCount = 0;
        for (const g of L.gates) {
          let on = false;
          for (const p of L.plugs) if (p.device.via.includes(g) && this.st.thread[p.id][g.id]) on = true;
          this.gateRT[g.id].target = on ? 1 : 0;
          if (on) this.threadedCount++;
        }
        this.refreshPower();
      }
    }
    for (const g of L.gates) {
      const gr = this.gateRT[g.id];
      gr.lit = U.damp(gr.lit, gr.target, gr.target > gr.lit ? 0.08 : 0.2, dt);
      gr.pop = Math.max(0, gr.pop - dt * 2.4);
      gr.hint = U.damp(gr.hint, 0, 0.5, dt);
    }
  };

  Room.prototype.onThread = function (prt, g, on) {
    const gr = this.gateRT[g.id];
    if (on) {
      // every time a cable threads a clip is counted: a lane's golden clip needs each one threaded once, never twice (Level 38)
      this.threadOns = this.threadOns || {};
      const k = prt.id + '|' + g.id;
      this.threadOns[k] = (this.threadOns[k] || 0) + 1;
    }
    const pan = this.pan(g.x);
    if (on) {
      gr.pop = 1;
      // the n-th lit hoop rings the n-th glass note of a rising scale
      const n = Math.min(11, Math.max(0, this.threadedCount));
      A().at(pan, () => A().glass(n));
      H().pulse('thread');
      const col = Art.KEYCOL[g.key] || '#fff2c4';
      Fx.sparkle(g.x, g.y, col, 9);
      Fx.ring(g.x, g.y, 26, col, 0.4, 2);
    } else {
      A().at(pan, () => A().sfx.powerdown());
    }
    this.onEvent('thread', { plug: prt.id, gate: g.id, on });
  };

  // the light rivers (Level 40): once the hall wakes, a light runs down each laid cable, from its device to its socket, over and over
  Room.prototype.riverDraw = function (ctx, t) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const head = (t * 0.35) % 1; // one pulse of light travels each cable, device to socket, every few seconds
    for (const prt of this.plugList) {
      const r = prt.rope,
        n = r.n;
      for (let i = 0; i < n; i += 3) {
        const f = i / n,
          pulse = Math.max(0, 1 - Math.abs(f - head) * 5);
        ctx.globalAlpha = 0.12 + 0.6 * pulse;
        ctx.beginPath();
        ctx.arc(r.x[i], r.y[i], 2.6, 0, Math.PI * 2);
        ctx.fillStyle = '#bff3ff';
        ctx.fill();
      }
    }
    ctx.restore();
  };

  // Lanes (Level 38): the golden clip when every cable ran each of its clips once, and touched none twice
  Room.prototype.lanesWakeCheck = function () {
    if (!this.def.secret || this.secretFound) return;
    const need = [];
    for (const p of this.L.plugs) for (const g of p.device.via) need.push(p.id + '|' + g.id);
    if (!need.length || !need.every((k) => ((this.threadOns || {})[k] || 0) === 1)) return;
    this.secretFound = true;
    this.later(0.9, () => this.onEvent('secret', this.def.secret));
  };

  // a hoop gently funnels a carried plug toward its gap while the cable has not yet been run through it:
  // threading a needle with a thumb should be a pleasure, not a precision test
  Room.prototype.gateFunnel = function (prt, tx, ty) {
    const via = prt.plug.device.via;
    if (!via.length || !this.st.thread) return [tx, ty];
    const th = this.st.thread[prt.id];
    for (const g of via) {
      if (th[g.id]) continue;
      const ax = Math.cos(g.rot),
        ay = Math.sin(g.rot),
        nx = -ay,
        ny = ax;
      const dx = tx - g.x,
        dy = ty - g.y;
      const dn = dx * nx + dy * ny, // distance along the crossing direction
        dl = dx * ax + dy * ay; // sideways offset from the gap's middle
      if (Math.abs(dn) >= 46 || Math.abs(dl) >= 52) continue;
      // inside the corridor in front of (and just behind) the gap, ease the sideways error toward zero
      const w = 0.78 * U.smoothstep(46, 8, Math.abs(dn)) * U.smoothstep(52, 30, Math.abs(dl));
      const dl2 = dl * (1 - w);
      prt.funnel = g.id;
      this.gateRT[g.id].hint = Math.max(this.gateRT[g.id].hint, 0.3 * w);
      return [g.x + nx * dn + ax * dl2, g.y + ny * dn + ay * dl2];
    }
    return [tx, ty];
  };

  // a seated cable whose device is not waking: say why (once per plug) by blinking the hoops it still needs
  Room.prototype.gateNeeds = function (prt) {
    const via = prt.plug.device.via;
    for (const g of via) if (!this.st.thread[prt.id][g.id]) this.gateRT[g.id].hint = 1;
  };
})();
