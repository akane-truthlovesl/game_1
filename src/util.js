/* Snug — util.js : math, easing, springs, seeded rng, color helpers, tiny event bus.
   Runs in the browser and in Node (the validator / tests load it too). */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const U = (G.U = {});
  const TAU = (U.TAU = Math.PI * 2);

  U.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  U.sat = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.smoothstep = (a, b, x) => {
    const t = U.sat((x - a) / (b - a));
    return t * t * (3 - 2 * t);
  };
  U.angDiff = (a, b) => {
    let d = (b - a) % TAU;
    if (d > Math.PI) d -= TAU;
    else if (d < -Math.PI) d += TAU;
    return d;
  };
  U.lerpAng = (a, b, t) => a + U.angDiff(a, b) * t;
  // frame-rate independent exponential smoothing
  U.damp = (cur, target, tau, dt) => cur + (target - cur) * (1 - Math.exp(-dt / tau));
  U.hypot = Math.hypot;

  const ease = (U.ease = {
    linear: (t) => t,
    outQuad: (t) => 1 - (1 - t) * (1 - t),
    inQuad: (t) => t * t,
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    inCubic: (t) => t * t * t,
    inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    outBack: (t, c) => {
      c = c === undefined ? 1.70158 : c;
      const c3 = c + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
    },
    outElastic: (t, a, p) => {
      a = a === undefined ? 1 : a;
      p = p === undefined ? 0.4 : p;
      if (t <= 0) return 0;
      if (t >= 1) return 1;
      return a * Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * TAU) / p) + 1;
    },
  });
  U.easeClamp = (fn, t) => fn(U.sat(t));

  // mulberry32 seeded rng
  U.rng = (seed) => {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // ---- color helpers ('#rrggbb') ----
  const hexCache = {};
  U.rgb = (hex) => {
    let c = hexCache[hex];
    if (c) return c;
    const h = hex.charAt(0) === '#' ? hex.slice(1) : hex;
    c = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    hexCache[hex] = c;
    return c;
  };
  U.rgba = (hex, a) => {
    const c = U.rgb(hex);
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a === undefined ? 1 : a) + ')';
  };
  U.mix = (hexA, hexB, t) => {
    const a = U.rgb(hexA),
      b = U.rgb(hexB);
    const r = Math.round(a[0] + (b[0] - a[0]) * t),
      g = Math.round(a[1] + (b[1] - a[1]) * t),
      bl = Math.round(a[2] + (b[2] - a[2]) * t);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1);
  };
  // f in [-1,1]: negative darkens toward black, positive lightens toward white
  U.shade = (hex, f) => (f < 0 ? U.mix(hex, '#000000', -f) : U.mix(hex, '#ffffff', f));

  // simple critically-tunable spring (semi-implicit Euler)
  U.Spring = function (k, c, x0) {
    this.k = k;
    this.c = c;
    this.x = x0 || 0;
    this.v = 0;
    this.t = x0 || 0;
  };
  U.Spring.prototype.step = function (dt) {
    // sub-step for stability at large k
    const n = Math.max(1, Math.ceil((dt * Math.sqrt(this.k)) / 0.6));
    const h = dt / n;
    for (let i = 0; i < n; i++) {
      this.v += (-this.k * (this.x - this.t) - this.c * this.v) * h;
      this.x += this.v * h;
    }
    return this.x;
  };
  U.Spring.prototype.kick = function (v) {
    this.v += v;
  };

  // tiny event bus
  U.Bus = function () {
    this.m = {};
  };
  U.Bus.prototype.on = function (n, f) {
    (this.m[n] = this.m[n] || []).push(f);
    return this;
  };
  U.Bus.prototype.emit = function (n, a, b, c) {
    const l = this.m[n];
    if (l) for (let i = 0; i < l.length; i++) l[i](a, b, c);
  };

  U.now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  U.isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
})();
