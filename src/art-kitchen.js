/* Snug — art-kitchen.js : the kitchen (world 'tile'): terracotta floor tiles with cream grout, a red-and-cream checked tea
   towel for the mat, the first kitchen cast (Dryer) and the puddle that sits on a wet socket. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const U = G.U,
    Art = G.Art;
  const TAU = U.TAU;
  const rrect = Art.rrect,
    lin = Art.lin,
    rad = Art.rad;
  const INK = '#171a26';

  function buildTiles(Wp, Hp, k) {
    const cv = document.createElement('canvas');
    cv.width = Wp;
    cv.height = Hp;
    const c = cv.getContext('2d');
    const rnd = U.rng(70123);
    const T = 78 * k;
    c.fillStyle = '#d9cdb4'; // grout
    c.fillRect(0, 0, Wp, Hp);
    for (let y = -T * 0.4; y < Hp; y += T)
      for (let x = -T * 0.3; x < Wp; x += T) {
        const base = U.mix('#c2623f', '#a94e30', rnd());
        c.fillStyle = lin(c, x, y, x + T, y + T, [0, U.shade(base, 0.1), 0.5, base, 1, U.shade(base, -0.12)]);
        c.fillRect(x + 2 * k, y + 2 * k, T - 4 * k, T - 4 * k);
        // tile speckle and a chipped corner now and then
        for (let i = 0; i < 40; i++) {
          c.fillStyle = rnd() < 0.5 ? 'rgba(255,230,200,0.10)' : 'rgba(60,20,10,0.12)';
          c.fillRect(x + 4 * k + rnd() * (T - 10 * k), y + 4 * k + rnd() * (T - 10 * k), (1 + rnd() * 2) * k, (1 + rnd() * 2) * k);
        }
        if (rnd() < 0.18) {
          c.fillStyle = 'rgba(217,205,180,0.8)';
          c.beginPath();
          c.moveTo(x + T - 2 * k, y + T - 2 * k);
          c.lineTo(x + T - 12 * k, y + T - 2 * k);
          c.lineTo(x + T - 2 * k, y + T - 12 * k);
          c.fill();
        }
        // a soft highlight on the upper-left edge of every tile
        c.strokeStyle = 'rgba(255,235,210,0.22)';
        c.lineWidth = 1.2 * k;
        c.beginPath();
        c.moveTo(x + 2 * k, y + T - 3 * k);
        c.lineTo(x + 2 * k, y + 2 * k);
        c.lineTo(x + T - 3 * k, y + 2 * k);
        c.stroke();
      }
    c.fillStyle = lin(c, 0, 0, Wp, Hp, [0, 'rgba(255,214,150,0.2)', 0.55, 'rgba(255,214,150,0)', 1, 'rgba(0,0,0,0.28)']);
    c.fillRect(0, 0, Wp, Hp);
    c.fillStyle = rad(c, Wp / 2, Hp / 2, Math.min(Wp, Hp) * 0.35, Math.max(Wp, Hp) * 0.78, [0, 'rgba(0,0,0,0)', 1, 'rgba(0,0,0,0.38)']);
    c.fillRect(0, 0, Wp, Hp);
    return cv;
  }

  function buildTowel(k, dawn) {
    const M = Art.MAT;
    const pad = 26;
    const cv = document.createElement('canvas');
    cv.width = Math.ceil((M.w + pad * 2) * k);
    cv.height = Math.ceil((M.h + pad * 2) * k);
    const c = cv.getContext('2d');
    c.scale(k, k);
    c.translate(pad - M.x, pad - M.y);
    const rnd = U.rng(81 + Math.round(dawn * 10));
    for (let i = 9; i >= 0; i--) {
      const t = i / 9;
      c.globalAlpha = 0.06 + (1 - t) * 0.05;
      c.fillStyle = '#1a0a04';
      c.beginPath();
      rrect(c, M.x - 3 - t * 9 + 2, M.y - 3 - t * 9 + 5, M.w + 6 + t * 18, M.h + 6 + t * 18, 12 + t * 8);
      c.fill();
    }
    c.globalAlpha = 1;
    c.beginPath();
    rrect(c, M.x, M.y, M.w, M.h, 10);
    c.fillStyle = '#f3ead6';
    c.fill();
    c.save();
    c.clip();
    // gingham: translucent red bands both ways make the darker crossings
    const S = 22;
    c.fillStyle = 'rgba(206,64,52,0.5)';
    for (let x = M.x; x < M.x + M.w; x += S * 2) c.fillRect(x, M.y, S, M.h);
    for (let y = M.y; y < M.y + M.h; y += S * 2) c.fillRect(M.x, y, M.w, S);
    // woven thread texture
    c.strokeStyle = 'rgba(255,255,255,0.12)';
    c.lineWidth = 0.8;
    for (let y = M.y; y < M.y + M.h; y += 3) {
      c.beginPath();
      c.moveTo(M.x, y);
      c.lineTo(M.x + M.w, y);
      c.stroke();
    }
    c.strokeStyle = 'rgba(80,30,20,0.06)';
    for (let x = M.x; x < M.x + M.w; x += 3) {
      c.beginPath();
      c.moveTo(x, M.y);
      c.lineTo(x, M.y + M.h);
      c.stroke();
    }
    for (let i = 0; i < 1400; i++) {
      c.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.1)' : 'rgba(60,20,10,0.06)';
      c.fillRect(M.x + rnd() * M.w, M.y + rnd() * M.h, 1, 1);
    }
    // hem stripes top and bottom
    for (const y0 of [M.y + 8, M.y + M.h - 14]) {
      c.fillStyle = 'rgba(206,64,52,0.75)';
      c.fillRect(M.x, y0, M.w, 3);
      c.fillRect(M.x, y0 + 6, M.w, 1.6);
    }
    c.fillStyle = rad(c, M.x + 60, M.y + 40, 10, 380, [0, 'rgba(255,238,205,0.2)', 1, 'rgba(255,238,205,0)']);
    c.fillRect(M.x, M.y, M.w, M.h);
    c.restore();
    c.beginPath();
    rrect(c, M.x + 0.5, M.y + 0.5, M.w - 1, M.h - 1, 10);
    c.strokeStyle = 'rgba(255,255,255,0.35)';
    c.lineWidth = 1;
    c.stroke();
    return { cv, pad, k };
  }
  const _s = Art.buildSurface,
    _m = Art.buildMat;
  Art.buildSurface = function (Wp, Hp, k, world) {
    return world === 'tile' || world === 'night' ? buildTiles(Wp, Hp, k) : _s(Wp, Hp, k, world);
  };
  Art.buildMat = function (k, dawn, tint, world) {
    return world === 'tile' || world === 'night' ? buildTowel(k, dawn) : _m(k, dawn, tint, world);
  };

  /* ---------------------------------------------------------------- the puddle */
  // r: { w (wetness 0..1), sock, shine }
  Art.puddle = function (ctx, r, t) {
    if (r.shine < 0.02 && r.w < 0.02) return;
    const w = Math.max(0, r.w);
    const sk = r.sock;
    const R = 50 * (0.25 + 0.75 * Math.sqrt(w));
    ctx.save();
    ctx.translate(sk.x + 6, sk.y + 8);
    ctx.globalAlpha = Math.min(1, r.shine);
    // irregular blob
    ctx.beginPath();
    const N = 22;
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * TAU;
      const rr = R * (1 + 0.14 * Math.sin(a * 3 + 1.3) + 0.08 * Math.sin(a * 5 + 0.4) + 0.025 * Math.sin(t * 2 + a * 4));
      const x = Math.cos(a) * rr * 1.25,
        y = Math.sin(a) * rr * 0.8;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = rad(ctx, -R * 0.25, -R * 0.25, 2, R * 1.5, [0, 'rgba(214,240,255,0.78)', 0.6, 'rgba(120,180,222,0.62)', 1, 'rgba(70,120,170,0.55)']);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    // a sky-and-window reflection
    ctx.beginPath();
    ctx.ellipse(-R * 0.28, -R * 0.2, R * 0.42, R * 0.2, -0.3, 0, TAU);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fill();
    // ripples
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    for (let k = 0; k < 2; k++) {
      const ph = (t * 0.55 + k * 0.5) % 1;
      ctx.beginPath();
      ctx.ellipse(R * 0.1, R * 0.1, (4 + ph * R * 0.8) * 1.25, (4 + ph * R * 0.8) * 0.8, 0, 0, TAU);
      ctx.globalAlpha = Math.min(1, r.shine) * (1 - ph) * 0.8;
      ctx.stroke();
    }
    ctx.restore();
  };

  /* ---------------------------------------------------------------- Dryer (the hair dryer) */
  function dryer(ctx, dev, rt, t) {
    const on = rt.power === 'on';
    const col = Art.KEYCOL[dev.color || 'violet'];
    const wk = rt.wake >= 0 ? rt.wake : 9;
    const run = on ? 1 : 0;
    if (dev.def.flip) ctx.scale(-1, 1);
    ctx.translate(Math.sin(t * 110) * 0.5 * run, Math.cos(t * 97) * 0.5 * run);
    // handle
    ctx.beginPath();
    rrect(ctx, -9, -4, 18, 40, 8);
    ctx.fillStyle = lin(ctx, -9, 0, 9, 0, [0, U.shade(col, -0.15), 0.5, col, 1, U.shade(col, -0.4)]);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (let i = 0; i < 4; i++) ctx.fillRect(-6, 8 + i * 6, 12, 1.4);
    // cord boot
    ctx.beginPath();
    rrect(ctx, -5, 30, 10, 7, 3);
    ctx.fillStyle = '#12151c';
    ctx.fill();
    // the barrel (nozzle on the left)
    ctx.beginPath();
    rrect(ctx, -35, -26, 68, 28, 13);
    ctx.fillStyle = lin(ctx, -35, -26, 33, 2, [0, U.shade(col, 0.22), 0.5, col, 1, U.shade(col, -0.35)]);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // the nozzle (a darker cone) and its grille
    ctx.beginPath();
    rrect(ctx, -41, -23, 11, 22, 5);
    ctx.fillStyle = lin(ctx, -41, 0, -30, 0, [0, '#2a2e3b', 1, '#555c70']);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    for (let i = 0; i < 4; i++) ctx.fillRect(-39, -20 + i * 5, 8, 1.2);
    // switch and LED
    ctx.beginPath();
    rrect(ctx, 14, -22, 12, 5, 2.5);
    ctx.fillStyle = 'rgba(15,20,32,0.5)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(on ? 23 : 17, -19.5, 2, 0, TAU);
    ctx.fillStyle = '#f1f4f8';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(26, -9, 2, 0, TAU);
    ctx.fillStyle = on ? '#8dffb0' : rt.power === 'standby' ? 'rgba(255,190,70,' + (0.55 + 0.45 * Math.sin(t * 4)) + ')' : 'rgba(255,90,80,0.55)';
    ctx.fill();
    // the face on the barrel
    ctx.save();
    ctx.translate(-3, -13);
    if (dev.def.flip) ctx.scale(-1, 1);
    Art.face(ctx, rt.face, 0.9, { eyeX: 8, eyeW: 3.8, eyeH: 5.2, mouthY: 8.2, mouthW: 4 }, INK);
    ctx.restore();
    // warm wind streaks off the nozzle while it is awake
    if (on) {
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 4; i++) {
        const ph = (t * 2.4 + i * 0.27) % 1;
        ctx.strokeStyle = 'rgba(255,225,190,' + 0.5 * (1 - ph) + ')';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-46 - ph * 22, -18 + i * 4.4);
        ctx.lineTo(-58 - ph * 30, -18 + i * 4.4 + Math.sin(ph * 6 + i) * 1.4);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
    }
  }
  Art.DEVICES = Art.DEVICES || {};
  Art.DEVICES.dryer = dryer;

  /* ---------------------------------------------------------------- bolts: how much a device draws */
  Art.deviceBolts = function (ctx, d, rt, t, a) {
    const n = d.watts;
    if (!n || a < 0.05) return;
    const on = rt.power === 'on';
    ctx.save();
    ctx.globalAlpha = Math.min(1, a);
    const x0 = d.x + d.meta.w / 2 + 7,
      y0 = d.y - d.meta.h / 2 + 4;
    for (let i = 0; i < n; i++) {
      const x = Math.min(x0, 352) - (x0 > 352 ? 0 : 0),
        y = y0 + i * 13;
      ctx.save();
      ctx.translate(Math.min(x, d.x + d.meta.w / 2 + 7), y);
      ctx.beginPath();
      ctx.moveTo(1.6, -5.5);
      ctx.lineTo(-3, 0.6);
      ctx.lineTo(-0.2, 0.6);
      ctx.lineTo(-1.6, 5.6);
      ctx.lineTo(3.2, -1);
      ctx.lineTo(0.4, -1);
      ctx.closePath();
      ctx.fillStyle = on ? '#ffe36b' : '#d9c46a';
      ctx.strokeStyle = 'rgba(70,50,0,0.6)';
      ctx.lineWidth = 0.9;
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  };

  /* ---------------------------------------------------------------- Toasty (the toaster) */
  function toaster(ctx, dev, rt, t) {
    const on = rt.power === 'on';
    const col = Art.KEYCOL[dev.color || 'mint'];
    const wk = rt.wake >= 0 ? rt.wake : 9;
    // the toast pops up when it wakes, and again, smaller
    const pop = on ? Math.max(0, Math.exp(-wk * 3.2) * Math.sin(wk * 14) * 0 + (wk < 0.35 ? Math.sin((wk / 0.35) * Math.PI) : 0)) * 15 : 0;
    ctx.beginPath();
    rrect(ctx, -37, -30, 74, 60, 14);
    ctx.fillStyle = lin(ctx, -37, -30, 37, 30, [0, '#e9ecf2', 0.5, '#c4cad6', 1, '#8a93a6']);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // coloured band
    ctx.beginPath();
    rrect(ctx, -37, 18, 74, 12, 8);
    ctx.fillStyle = lin(ctx, -37, 0, 37, 0, [0, U.shade(col, 0.1), 1, U.shade(col, -0.25)]);
    ctx.fill();
    // two toast slots, with the toast rising out of them
    for (const sx of [-1, 1]) {
      const x = sx * 15;
      ctx.beginPath();
      rrect(ctx, x - 11, -23, 22, 9, 3);
      ctx.fillStyle = '#20232d';
      ctx.fill();
      ctx.save();
      ctx.beginPath();
      rrect(ctx, x - 11, -23, 22, 9, 3);
      ctx.clip();
      if (on || rt.power === 'standby') {
        ctx.beginPath();
        rrect(ctx, x - 9.5, -30 - pop, 19, 14 + pop, 5);
        ctx.fillStyle = lin(ctx, x - 9, -30, x + 9, -14, [0, '#f3d49a', 1, '#c88f4a']);
        ctx.fill();
      }
      ctx.restore();
      if (pop > 1) {
        ctx.beginPath();
        rrect(ctx, x - 9.5, -33 - pop, 19, 14, 5);
        ctx.fillStyle = lin(ctx, x - 9, -33 - pop, x + 9, -19 - pop, [0, '#f6dca6', 1, '#cf9650']);
        ctx.fill();
        ctx.strokeStyle = 'rgba(120,70,20,0.5)';
        ctx.lineWidth = 0.9;
        ctx.stroke();
      }
    }
    // lever and glowing coil hint
    ctx.beginPath();
    rrect(ctx, 33, -8 + (on ? 6 : 0), 6, 14, 3);
    ctx.fillStyle = '#4b5164';
    ctx.fill();
    // face
    ctx.save();
    ctx.translate(0, 3);
    Art.face(ctx, rt.face, 0.95, { eyeX: 9, eyeW: 4, eyeH: 5.4, mouthY: 8.4, mouthW: 4.2 }, INK);
    ctx.restore();
    ctx.beginPath();
    ctx.arc(-29, 24, 2, 0, TAU);
    ctx.fillStyle = on ? '#8dffb0' : rt.power === 'standby' ? 'rgba(255,190,70,' + (0.55 + 0.45 * Math.sin(t * 4)) + ')' : 'rgba(255,90,80,0.55)';
    ctx.fill();
  }
  Art.DEVICES.toaster = toaster;

  /* ---------------------------------------------------------------- Kettle */
  function kettle(ctx, dev, rt, t) {
    const on = rt.power === 'on';
    const col = Art.KEYCOL[dev.color || 'coral'];
    ctx.beginPath();
    ctx.arc(0, 4, 29, 0, TAU);
    ctx.fillStyle = lin(ctx, -29, -25, 29, 33, [0, U.shade(col, 0.25), 0.5, col, 1, U.shade(col, -0.35)]);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1.3;
    ctx.stroke();
    // lid and knob
    ctx.beginPath();
    ctx.arc(0, 4, 18, 0, TAU);
    ctx.fillStyle = lin(ctx, -18, -14, 18, 22, [0, '#f3f5f9', 1, '#aab3c2']);
    ctx.fill();
    ctx.strokeStyle = 'rgba(40,50,70,0.35)';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -1, 4.2, 0, TAU);
    ctx.fillStyle = '#2f3544';
    ctx.fill();
    // spout (up) and handle (down)
    ctx.beginPath();
    ctx.moveTo(-8, -22);
    ctx.lineTo(0, -37);
    ctx.lineTo(8, -22);
    ctx.closePath();
    ctx.fillStyle = lin(ctx, 0, -36, 0, -20, [0, '#d8dde8', 1, '#8d97aa']);
    ctx.fill();
    ctx.beginPath();
    rrect(ctx, -12, 26, 24, 9, 4.5);
    ctx.fillStyle = '#272b38';
    ctx.fill();
    // face on the lid
    ctx.save();
    ctx.translate(0, 6);
    Art.face(ctx, rt.face, 0.85, { eyeX: 8, eyeW: 3.6, eyeH: 5, mouthY: 8, mouthW: 4 }, INK);
    ctx.restore();
    ctx.beginPath();
    ctx.arc(18, 24, 2, 0, TAU);
    ctx.fillStyle = on ? '#8dffb0' : rt.power === 'standby' ? 'rgba(255,190,70,' + (0.55 + 0.45 * Math.sin(t * 4)) + ')' : 'rgba(255,90,80,0.55)';
    ctx.fill();
  }
  Art.DEVICES.kettle = kettle;

  /* ---------------------------------------------------------------- Tick, the egg timer (decor; it ticks with the room) */
  function eggTimer(ctx, d, rt, t) {
    const R = 21;
    const sec = Math.floor(t);
    ctx.save();
    ctx.rotate(Math.sin(t * 40) * 0.07 * (rt.poke || 0));
    ctx.beginPath();
    ctx.ellipse(0, 0, R * 0.92, R * 1.1, 0, 0, TAU);
    ctx.fillStyle = lin(ctx, -R, -R, R, R, [0, '#ffffff', 0.55, '#ece7da', 1, '#c4bca6']);
    ctx.fill();
    ctx.strokeStyle = 'rgba(80,60,40,0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
    // red dial with a pointer that jumps each second
    ctx.beginPath();
    ctx.arc(0, 1, 11.5, 0, TAU);
    ctx.fillStyle = '#d9402f';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      ctx.fillRect(Math.cos(a) * 8.4 - 0.6, Math.sin(a) * 8.4 + 1 - 0.6, 1.2, 1.2);
    }
    ctx.save();
    ctx.translate(0, 1);
    ctx.rotate(((sec % 12) / 12) * TAU - Math.PI / 2);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, -0.8, 9, 1.6);
    ctx.restore();
    // a face
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(-4.4, -12, 1.2, 0, TAU);
    ctx.arc(4.4, -12, 1.2, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  Art.DECOR2.eggtimer = { draw: eggTimer, shadow: (ctx, d) => Art.shadow(ctx, d.x, d.y + 2, 40, 48, 20, 0, 0.25, 0.5) };

  /* ---------------------------------------------------------------- Biscuit: asleep, stirring, walking, sitting */
  Art.cat2 = function (ctx, c, t) {
    const sleeping = c.state === 'asleep' || c.state === 'waking';
    const sit = c.state === 'sitting' || c.state === 'petted';
    ctx.save();
    ctx.translate(c.x, c.y);
    const breath = 1 + 0.035 * Math.sin(t * 1.7);
    // soft shadow
    ctx.beginPath();
    ctx.ellipse(2, 4, 24, 17, 0, 0, TAU);
    ctx.fillStyle = 'rgba(10,6,4,0.3)';
    ctx.fill();
    const fur = '#9aa0b4',
      furDark = '#6f7690',
      cream = '#d6d9e6';
    if (sleeping) {
      // curled into a circle: body, tucked head, tail around
      ctx.scale(breath, breath);
      ctx.beginPath();
      ctx.ellipse(0, 0, 24, 18, -0.2, 0, TAU);
      ctx.fillStyle = lin(ctx, -22, -16, 22, 16, [0, '#b9bfd0', 1, furDark]);
      ctx.fill();
      ctx.strokeStyle = 'rgba(40,46,70,0.5)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      // stripes
      ctx.strokeStyle = 'rgba(40,46,70,0.42)';
      ctx.lineWidth = 1.6;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 7 - 2, -13);
        ctx.quadraticCurveTo(i * 7 + 2, 0, i * 7 - 2, 13);
        ctx.stroke();
      }
      // tail wrapping the front
      ctx.beginPath();
      ctx.arc(-4, 6, 19, 0.2, 2.6);
      ctx.strokeStyle = fur;
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.stroke();
      // head
      ctx.beginPath();
      ctx.arc(11, -2, 10, 0, TAU);
      ctx.fillStyle = lin(ctx, 3, -10, 19, 6, [0, '#c4c9d8', 1, fur]);
      ctx.fill();
      ctx.strokeStyle = 'rgba(40,46,70,0.5)';
      ctx.lineWidth = 1.1;
      ctx.stroke();
      // ears (one twitches when she is stirring)
      const tw = c.al > 0.45 ? Math.sin(t * 14) * 0.22 * Math.min(1, (c.al - 0.4) * 3) : 0;
      for (const [ex, ey, rot] of [[6, -10, -0.4 + tw], [16, -9, 0.4]]) {
        ctx.save();
        ctx.translate(ex, ey);
        ctx.rotate(rot);
        ctx.beginPath();
        ctx.moveTo(-4, 2);
        ctx.lineTo(0, -8);
        ctx.lineTo(4, 2);
        ctx.closePath();
        ctx.fillStyle = fur;
        ctx.fill();
        ctx.fillStyle = '#e9a7b6';
        ctx.beginPath();
        ctx.moveTo(-2, 1);
        ctx.lineTo(0, -5);
        ctx.lineTo(2, 1);
        ctx.fill();
        ctx.restore();
      }
      // closed eyes (one opens a crack when she is nearly awake)
      ctx.strokeStyle = '#3a2412';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(8, -3, 2.4, 0.2, Math.PI - 0.2);
      ctx.stroke();
      if (c.al > 0.75 || c.state === 'waking') {
        ctx.beginPath();
        ctx.ellipse(15, -3, 2.2, 1.4, 0, 0, TAU);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(15.6, -3, 0.9, 0, TAU);
        ctx.fillStyle = '#2a1a0a';
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(15, -3, 2.4, 0.2, Math.PI - 0.2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(11.5, 1.6, 1.1, 0, TAU);
      ctx.fillStyle = '#d97a7a';
      ctx.fill();
    } else {
      // a sitting loaf, seen from above: body, tucked paws, tail, head
      ctx.rotate(sit ? 0 : Math.sin(t * 8) * 0.06);
      ctx.beginPath();
      ctx.ellipse(0, 4, 17, 21, 0, 0, TAU);
      ctx.fillStyle = lin(ctx, -16, -16, 16, 22, [0, '#b9bfd0', 1, furDark]);
      ctx.fill();
      ctx.strokeStyle = 'rgba(40,46,70,0.5)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, 12, 11, 8, 0, 0, TAU);
      ctx.fillStyle = cream;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(10, 18);
      ctx.quadraticCurveTo(26, 14 + Math.sin(t * 2) * 3, 20, 2);
      ctx.strokeStyle = fur;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, -12, 11, 0, TAU);
      ctx.fillStyle = lin(ctx, -10, -22, 10, -2, [0, '#c4c9d8', 1, fur]);
      ctx.fill();
      ctx.strokeStyle = 'rgba(40,46,70,0.5)';
      ctx.stroke();
      for (const sx of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(sx * 10, -17);
        ctx.lineTo(sx * 7, -29);
        ctx.lineTo(sx * 2, -21);
        ctx.closePath();
        ctx.fillStyle = fur;
        ctx.fill();
        ctx.fillStyle = '#3a2412';
        ctx.beginPath();
        ctx.ellipse(sx * 4.6, -13, 1.6, c.state === 'petted' ? 0.6 : 2.6, 0, 0, TAU);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(0, -9, 1.2, 0, TAU);
      ctx.fillStyle = '#d97a7a';
      ctx.fill();
      if (c.state === 'petted') {
        ctx.strokeStyle = 'rgba(255,150,170,0.9)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(-9, -5, 3, 0, Math.PI);
        ctx.arc(9, -5, 3, 0, Math.PI);
        ctx.stroke();
      }
    }
    ctx.restore();
  };
  // the cushion she sleeps on, and the fridge whose light clicks on
  Art.DECOR2.cushion = {
    draw(ctx, d, rt, t) {
      ctx.beginPath();
      rrect(ctx, -34, -28, 68, 56, 22);
      ctx.fillStyle = lin(ctx, -34, -28, 34, 28, [0, '#7d8fd0', 1, '#4c5aa0']);
      ctx.fill();
      ctx.strokeStyle = 'rgba(220,230,255,0.35)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, TAU);
      ctx.fillStyle = 'rgba(30,36,70,0.7)';
      ctx.fill();
    },
    shadow: (ctx, d) => Art.shadow(ctx, d.x, d.y + 3, 72, 60, 22, 0, 0.2, 0.5),
  };
  Art.DECOR2.fridge = {
    draw(ctx, d, rt, t) {
      const on = (rt.poke || 0) > 0.05 || (rt.lit || 0) > 0.3;
      // a little under-counter fridge, seen from the front: freezer door on top, big door below, two handles, a magnet and a note
      ctx.beginPath();
      rrect(ctx, -33, -27, 66, 54, 9);
      ctx.fillStyle = lin(ctx, -33, -27, 33, 27, [0, '#eef3fa', 0.6, '#cfd8e6', 1, '#9fabc0']);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = 'rgba(70,84,110,0.55)';
      ctx.fillRect(-31, -10, 62, 2); // the seam between the doors
      ctx.beginPath();
      rrect(ctx, 22, -22, 3.4, 9, 1.7);
      rrect(ctx, 22, -4, 3.4, 18, 1.7);
      ctx.fillStyle = '#7c879a';
      ctx.fill();
      ctx.fillStyle = '#e4685a'; // a magnet holding a note
      ctx.beginPath();
      ctx.arc(-18, 4, 2.4, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#fff6d8';
      ctx.fillRect(-24, 6, 12, 9);
      ctx.fillStyle = 'rgba(60,50,40,0.45)';
      ctx.fillRect(-22, 9, 8, 1);
      ctx.fillRect(-22, 12, 6, 1);
      // its light: faint always (the hum of a sleeping kitchen), a cold wash when the door is poked
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rad(ctx, 0, 6, 2, 64, [0, 'rgba(190,225,255,' + (on ? 0.55 : 0.12) + ')', 1, 'rgba(190,225,255,0)']);
      ctx.fillRect(-66, -60, 132, 132);
      ctx.globalCompositeOperation = 'source-over';
    },
    shadow: (ctx, d) => Art.shadow(ctx, d.x, d.y + 2, 70, 56, 9, 0, 0.3, 0.5),
  };

  /* ---------------------------------------------------------------- breakfast: a fruit bowl (tap it: the secret) */
  Art.DECOR2.fruitbowl = {
    draw(ctx, d, rt, t) {
      const R = 27;
      ctx.beginPath();
      ctx.arc(0, 0, R, 0, TAU);
      ctx.fillStyle = lin(ctx, -R, -R, R, R, [0, '#fbf3df', 1, '#d6c9a6']);
      ctx.fill();
      ctx.strokeStyle = 'rgba(120,96,60,0.5)';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, R - 5, 0, TAU);
      ctx.fillStyle = lin(ctx, 0, -R, 0, R, [0, '#b9a984', 1, '#8f7f5c']);
      ctx.fill();
      const fruits = [[-9, -6, 9.5, '#f08a24', '#ffc070'], [8, -8, 8.5, '#d8412f', '#ff8a70'], [1, 8, 9, '#f4d44a', '#fff2a0'], [-12, 7, 6.5, '#7bbf4a', '#c4ee90']];
      for (const [x, y, r, c0, c1] of fruits) {
        const sw = Math.sin(t * 2 + x) * 0.3 * (rt.poke || 0);
        ctx.beginPath();
        ctx.arc(x + sw, y, r, 0, TAU);
        ctx.fillStyle = rad(ctx, x - r * 0.3, y - r * 0.3, 1, r * 1.3, [0, c1, 1, c0]);
        ctx.fill();
        ctx.strokeStyle = 'rgba(60,30,10,0.35)';
        ctx.lineWidth = 0.9;
        ctx.stroke();
      }
      ctx.fillStyle = '#5da03a';
      ctx.beginPath();
      ctx.ellipse(10, -14, 3.4, 1.8, -0.6, 0, TAU);
      ctx.fill();
    },
    shadow: (ctx, d) => Art.shadow(ctx, d.x, d.y + 3, 58, 56, 28, 0, 0.22, 0.5),
  };
  Art.SECRETS2 = Art.SECRETS2 || {};
  // the spoon that went missing at breakfast
  Art.SECRETS2.goldspoon = function (ctx) {
    ctx.rotate(-0.7);
    ctx.beginPath();
    rrect(ctx, -3, -1.4, 17, 2.8, 1.4);
    ctx.fillStyle = lin(ctx, 0, -2, 0, 2, [0, '#ffe58a', 1, '#c9922e']);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-8, 0, 5.4, 3.8, 0, 0, TAU);
    ctx.fillStyle = lin(ctx, -13, -4, -3, 4, [0, '#fff0b0', 1, '#c9922e']);
    ctx.fill();
    ctx.strokeStyle = 'rgba(100,60,0,0.6)';
    ctx.lineWidth = 0.9;
    ctx.stroke();
  };
})();
