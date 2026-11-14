/* Snug — art-workshop.js : Act 2's look. The garage bench (a cool blue-grey enamel top + a brushed-steel work mat),
   the rail under a sliding strip, and the first workshop cast and decor (Spike the drill, a vice, a tape measure,
   a screw jar). Registers into the registries in art.js / art-devices.js, so those files stay Act-agnostic. */
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

  /* ---------------------------------------------------------------- the bench (background) and the steel mat */
  function buildBench(Wp, Hp, k) {
    const cv = document.createElement('canvas');
    cv.width = Wp;
    cv.height = Hp;
    const c = cv.getContext('2d');
    const rnd = U.rng(20261115);
    // enamelled bench top, a cool blue-grey
    c.fillStyle = lin(c, 0, 0, Wp, Hp, [0, '#5d6a78', 0.5, '#4b5663', 1, '#3a4450']);
    c.fillRect(0, 0, Wp, Hp);
    // plank seams (the bench is made of boards)
    const plankH = 150 * k;
    for (let y = -rnd() * plankH * 0.5; y < Hp; y += plankH * (0.92 + rnd() * 0.16)) {
      c.fillStyle = 'rgba(14,20,28,0.55)';
      c.fillRect(0, y, Wp, 1.6 * k);
      c.fillStyle = 'rgba(190,210,230,0.12)';
      c.fillRect(0, y + 1.6 * k, Wp, 1.1 * k);
    }
    // scuffs and scratches
    for (let i = 0; i < 260; i++) {
      const x = rnd() * Wp,
        y = rnd() * Hp,
        a = (rnd() - 0.5) * 0.8,
        l = (8 + rnd() * 46) * k;
      c.strokeStyle = rnd() < 0.5 ? 'rgba(210,225,240,' + (0.04 + rnd() * 0.08) + ')' : 'rgba(10,16,24,' + (0.06 + rnd() * 0.1) + ')';
      c.lineWidth = (0.5 + rnd() * 0.9) * k;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
      c.stroke();
    }
    // oil and paint stains
    for (let i = 0; i < 9; i++) {
      const x = rnd() * Wp,
        y = rnd() * Hp,
        r = (14 + rnd() * 46) * k;
      const col = rnd() < 0.6 ? '12,10,8' : rnd() < 0.5 ? '200,90,60' : '230,190,80';
      c.fillStyle = rad(c, x, y, 1, r, [0, 'rgba(' + col + ',' + (rnd() < 0.6 ? 0.22 : 0.12) + ')', 1, 'rgba(' + col + ',0)']);
      c.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // old screw holes
    for (let i = 0; i < 16; i++) {
      const x = rnd() * Wp,
        y = rnd() * Hp,
        r = (2.2 + rnd() * 1.6) * k;
      c.beginPath();
      c.arc(x, y, r, 0, TAU);
      c.fillStyle = 'rgba(8,12,18,0.7)';
      c.fill();
      c.beginPath();
      c.arc(x + r * 0.2, y + r * 0.25, r * 0.9, 0.3, Math.PI * 0.9);
      c.strokeStyle = 'rgba(210,225,240,0.25)';
      c.lineWidth = 0.8 * k;
      c.stroke();
    }
    // key light from the upper left, vignette
    c.fillStyle = lin(c, 0, 0, Wp, Hp, [0, 'rgba(255,236,200,0.16)', 0.55, 'rgba(255,236,200,0)', 1, 'rgba(0,0,0,0.26)']);
    c.fillRect(0, 0, Wp, Hp);
    c.fillStyle = rad(c, Wp / 2, Hp / 2, Math.min(Wp, Hp) * 0.35, Math.max(Wp, Hp) * 0.78, [0, 'rgba(0,0,0,0)', 1, 'rgba(0,0,0,0.42)']);
    c.fillRect(0, 0, Wp, Hp);
    return cv;
  }
  function buildSteelMat(k, dawn) {
    const M = Art.MAT;
    const pad = 26;
    const cv = document.createElement('canvas');
    cv.width = Math.ceil((M.w + pad * 2) * k);
    cv.height = Math.ceil((M.h + pad * 2) * k);
    const c = cv.getContext('2d');
    c.scale(k, k);
    c.translate(pad - M.x, pad - M.y);
    const rnd = U.rng(913 + Math.round(dawn * 10));
    for (let i = 9; i >= 0; i--) {
      const t = i / 9;
      c.globalAlpha = 0.06 + (1 - t) * 0.05;
      c.fillStyle = '#05080c';
      c.beginPath();
      rrect(c, M.x - 3 - t * 10 + 3, M.y - 3 - t * 10 + 6, M.w + 6 + t * 20, M.h + 6 + t * 20, M.r + t * 10);
      c.fill();
    }
    c.globalAlpha = 1;
    c.beginPath();
    rrect(c, M.x, M.y, M.w, M.h, M.r);
    c.fillStyle = lin(c, M.x, M.y, M.x + M.w, M.y + M.h, [0, '#9aa6b4', 0.45, '#76828f', 1, '#566170']);
    c.fill();
    c.save();
    c.clip();
    // brushed grain: long, fine, horizontal strokes
    for (let i = 0; i < 1400; i++) {
      const x = M.x + rnd() * M.w,
        y = M.y + rnd() * M.h,
        l = 16 + rnd() * 120;
      c.strokeStyle = rnd() < 0.5 ? 'rgba(255,255,255,' + (0.03 + rnd() * 0.07) + ')' : 'rgba(10,16,26,' + (0.04 + rnd() * 0.07) + ')';
      c.lineWidth = 0.4 + rnd() * 0.6;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + l, y + (rnd() - 0.5) * 0.8);
      c.stroke();
    }
    // a soft anisotropic highlight band (steel catches light in a stripe) and the top-left sheen
    c.fillStyle = lin(c, M.x, M.y, M.x + M.w, M.y + M.h * 0.6, [0, 'rgba(255,255,255,0.0)', 0.3, 'rgba(255,255,255,0.12)', 0.45, 'rgba(255,255,255,0)', 1, 'rgba(255,255,255,0)']);
    c.fillRect(M.x, M.y, M.w, M.h);
    c.fillStyle = rad(c, M.x + 70, M.y + 50, 10, 360, [0, 'rgba(255,244,222,0.16)', 1, 'rgba(255,244,222,0)']);
    c.fillRect(M.x, M.y, M.w, M.h);
    // small scuffs
    for (let i = 0; i < 90; i++) {
      const x = M.x + rnd() * M.w,
        y = M.y + rnd() * M.h,
        a = rnd() * TAU,
        l = 3 + rnd() * 10;
      c.strokeStyle = 'rgba(30,40,56,' + (0.06 + rnd() * 0.08) + ')';
      c.lineWidth = 0.6;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
      c.stroke();
    }
    c.restore();
    // bevel
    c.beginPath();
    rrect(c, M.x + 0.5, M.y + 0.5, M.w - 1, M.h - 1, M.r);
    c.strokeStyle = lin(c, M.x, M.y, M.x, M.y + M.h, [0, 'rgba(255,255,255,0.5)', 0.5, 'rgba(255,255,255,0.1)', 1, 'rgba(0,0,0,0.4)']);
    c.lineWidth = 1.6;
    c.stroke();
    // slotted screws round the edge
    const screw = (x, y) => {
      c.beginPath();
      c.arc(x, y, 4.2, 0, TAU);
      c.fillStyle = lin(c, x - 4, y - 4, x + 4, y + 4, [0, '#e9eef5', 1, '#79838f']);
      c.fill();
      c.strokeStyle = 'rgba(20,28,40,0.55)';
      c.lineWidth = 0.8;
      c.stroke();
      const a = rnd() * Math.PI;
      c.beginPath();
      c.moveTo(x - Math.cos(a) * 3, y - Math.sin(a) * 3);
      c.lineTo(x + Math.cos(a) * 3, y + Math.sin(a) * 3);
      c.strokeStyle = 'rgba(20,28,40,0.8)';
      c.lineWidth = 1.2;
      c.stroke();
    };
    const sx0 = M.x + 14,
      sx1 = M.x + M.w - 14,
      sy0 = M.y + 14,
      sy1 = M.y + M.h - 14;
    for (const [x, y] of [[sx0, sy0], [sx1, sy0], [sx0, sy1], [sx1, sy1], [sx0, M.y + M.h / 2], [sx1, M.y + M.h / 2]]) screw(x, y);
    return { cv, pad, k };
  }
  const _surface = Art.buildSurface,
    _mat = Art.buildMat;
  Art.buildSurface = function (Wp, Hp, k, world) {
    return world === 'steel' ? buildBench(Wp, Hp, k) : _surface(Wp, Hp, k);
  };
  Art.buildMat = function (k, dawn, tint, world) {
    return world === 'steel' ? buildSteelMat(k, dawn) : _mat(k, dawn, tint);
  };

  /* ---------------------------------------------------------------- the rail (under a sliding strip) */
  const STEEL = [0, '#eef2f7', 0.5, '#aab4c1', 1, '#6b7683'];
  const BRASS = [0, '#f2d58c', 0.5, '#c79a45', 1, '#8a6528'];
  // rails run along the strip's travel; the active detent glows; the cord follows the strip to a fixed wall plate
  Art.railUnder = function (ctx, st, rt, t) {
    const r = st.rail;
    const ang = Math.atan2(r.y1 - r.y0, r.x1 - r.x0);
    const mx = (r.x0 + r.x1) / 2,
      my = (r.y0 + r.y1) / 2;
    const half = (st.n * st.pitch) / 2 + 14 + 10;
    const W = r.len + half * 2;
    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate(ang);
    for (const side of [-1, 1]) {
      const y = side * 39;
      // soft shadow, bar, highlight
      ctx.fillStyle = 'rgba(5,10,16,0.28)';
      ctx.beginPath();
      rrect(ctx, -W / 2 + 1.5, y - 3 + 2.4, W, 7, 3.5);
      ctx.fill();
      ctx.beginPath();
      rrect(ctx, -W / 2, y - 3.5, W, 7, 3.5);
      ctx.fillStyle = lin(ctx, 0, y - 3.5, 0, y + 3.5, STEEL);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fillRect(-W / 2 + 4, y - 2.2, W - 8, 1);
      // brass end stops
      for (const ex of [-1, 1]) {
        ctx.beginPath();
        rrect(ctx, ex * (W / 2) - (ex < 0 ? 0 : 9), y - 6, 9, 12, 3);
        ctx.fillStyle = lin(ctx, 0, y - 6, 0, y + 6, BRASS);
        ctx.fill();
        ctx.strokeStyle = 'rgba(60,40,10,0.5)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }
    // detent notches on the near rail; the one under the strip glows brass
    const active = rt ? rt.k : st.k;
    r.detents.forEach((d, i) => {
      const x = (d - 0.5) * r.len;
      const near = Math.abs(d - active) < 0.02;
      ctx.beginPath();
      ctx.moveTo(x - 4.5, 36);
      ctx.lineTo(x + 4.5, 36);
      ctx.lineTo(x, 41.5);
      ctx.closePath();
      ctx.fillStyle = near ? '#ffd877' : 'rgba(30,40,52,0.7)';
      ctx.fill();
      if (near) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = rad(ctx, x, 39, 1, 14, [0, 'rgba(255,214,120,0.55)', 1, 'rgba(255,214,120,0)']);
        ctx.fillRect(x - 14, 25, 28, 28);
        ctx.globalCompositeOperation = 'source-over';
      }
    });
    ctx.restore();
    // the cord: from the strip's underside to a wall plate that never moves
    const ax = (st.def.cordAnchor && st.def.cordAnchor.x) || 180,
      ay = (st.def.cordAnchor && st.def.cordAnchor.y) || 668;
    const sx = st.x,
      sy = st.y + 30;
    const sag = 22 + Math.abs(sx - ax) * 0.1;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.bezierCurveTo(sx, sy + sag, ax, ay - sag * 1.4, ax, ay);
    ctx.strokeStyle = 'rgba(0,0,0,0.22)';
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.strokeStyle = '#d9d2c0';
    ctx.lineWidth = 5.4;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();
    Art.shadow(ctx, st.x, st.y, st.n * st.pitch + 28, 56, 17, st.angle, 0.12 + (rt && rt.moving ? 0.1 : 0), 0.5);
  };
  // ridged steel grips and chevrons on the strip's ends: "this one slides"
  Art.railGrip = function (ctx, st, rt, t, x0, x1, h) {
    const hint = rt.railHint || 0;
    for (const side of [-1, 1]) {
      const ex = side < 0 ? x0 : x1;
      const gw = 15;
      const gx = side < 0 ? ex + 2 : ex - gw - 2;
      ctx.beginPath();
      rrect(ctx, gx, -h / 2 + 5, gw, h - 10, 8);
      ctx.fillStyle = lin(ctx, gx, 0, gx + gw, 0, [0, '#cfd7e2', 0.5, '#8d99a8', 1, '#5f6a78']);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 0.9;
      ctx.stroke();
      // ridges
      ctx.fillStyle = 'rgba(20,30,44,0.35)';
      for (let i = -3; i <= 3; i++) ctx.fillRect(gx + 3, i * 6 - 0.7, gw - 6, 1.4);
      // chevron
      const ax = gx + gw / 2;
      ctx.beginPath();
      ctx.moveTo(ax + side * 2.6, -5.5);
      ctx.lineTo(ax - side * 2.6, 0);
      ctx.lineTo(ax + side * 2.6, 5.5);
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const pulse = hint > 0.01 ? 0.5 + 0.5 * Math.sin(t * 7) : 0;
      ctx.strokeStyle = hint > 0.01 ? 'rgba(255,225,140,' + (0.5 + 0.5 * pulse) + ')' : 'rgba(255,255,255,0.55)';
      ctx.stroke();
    }
    // the pointer notch that lines up with the rail's detents
    ctx.beginPath();
    ctx.moveTo(-5, h / 2 - 7);
    ctx.lineTo(5, h / 2 - 7);
    ctx.lineTo(0, h / 2 - 1.5);
    ctx.closePath();
    ctx.fillStyle = 'rgba(40,52,68,0.55)';
    ctx.fill();
    if (hint > 0.01) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(255,230,160,' + 0.55 * hint * (0.5 + 0.5 * Math.sin(t * 7)) + ')';
      ctx.lineWidth = 3;
      ctx.beginPath();
      rrect(ctx, x0 - 3, -h / 2 - 3, x1 - x0 + 6, h + 6, 20);
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    }
  };

  /* ---------------------------------------------------------------- Spike the drill */
  function drill(ctx, dev, rt, t) {
    const on = rt.power === 'on';
    const col = Art.KEYCOL[dev.color || 'sky'];
    const wk = rt.wake >= 0 ? rt.wake : 9;
    const spin = on && wk < 1.1 ? Math.sin((Math.PI * Math.min(1, wk)) / 1.1) : 0;
    ctx.translate(Math.sin(t * 93) * spin * 0.7, Math.cos(t * 87) * spin * 0.7);
    // grip
    ctx.beginPath();
    rrect(ctx, -13, 12, 26, 31, 8);
    ctx.fillStyle = lin(ctx, -13, 12, 13, 43, [0, '#3a3f4c', 1, '#1b1e27']);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    for (let i = 0; i < 5; i++) ctx.fillRect(-9, 18 + i * 5, 18, 1.4);
    // cord boot
    ctx.beginPath();
    rrect(ctx, -5.5, 38, 11, 7, 3);
    ctx.fillStyle = '#10131a';
    ctx.fill();
    // housing
    ctx.beginPath();
    rrect(ctx, -27, -27, 54, 46, 14);
    ctx.fillStyle = lin(ctx, -27, -27, 27, 19, [0, U.shade(col, 0.2), 0.5, col, 1, U.shade(col, -0.38)]);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // side vents
    ctx.fillStyle = 'rgba(10,20,34,0.4)';
    for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) ctx.fillRect(sx * 21.5 - 1.1, -8 + i * 6, 2.2, 3.6);
    // forward / reverse slider
    ctx.beginPath();
    rrect(ctx, 12, -23, 11, 5, 2.5);
    ctx.fillStyle = 'rgba(15,25,40,0.55)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(on ? 20.5 : 14.5, -20.5, 2, 0, TAU);
    ctx.fillStyle = '#f1f4f8';
    ctx.fill();
    // clutch ring and chuck (knurling slides when it spins)
    ctx.beginPath();
    rrect(ctx, -13, -29, 26, 6, 3);
    ctx.fillStyle = lin(ctx, -13, 0, 13, 0, [0, '#59606e', 0.5, '#9aa3b2', 1, '#4a505c']);
    ctx.fill();
    ctx.beginPath();
    rrect(ctx, -9.5, -45, 19, 18, 4);
    ctx.fillStyle = lin(ctx, -9.5, 0, 9.5, 0, [0, '#cdd4de', 0.45, '#8e99a8', 1, '#5b6574']);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    rrect(ctx, -9.5, -45, 19, 18, 4);
    ctx.clip();
    const sp = spin > 0.05 ? (t * 70) % 3.6 : 0;
    ctx.fillStyle = 'rgba(20,28,40,' + (spin > 0.05 ? 0.2 : 0.34) + ')';
    for (let i = -1; i < 7; i++) ctx.fillRect(-9, -45 + i * 3.6 + sp, 18, 1.2);
    if (spin > 0.2) {
      ctx.fillStyle = 'rgba(255,255,255,' + 0.22 * spin + ')';
      ctx.fillRect(-9.5, -45, 19, 18);
    }
    ctx.restore();
    // the work light under the chuck
    ctx.beginPath();
    ctx.arc(-17, -22, 2.3, 0, TAU);
    ctx.fillStyle = on ? '#fff7cf' : 'rgba(30,40,56,0.6)';
    ctx.fill();
    if (on) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rad(ctx, -17, -22, 1, 15, [0, 'rgba(255,244,190,0.55)', 1, 'rgba(255,244,190,0)']);
      ctx.fillRect(-32, -37, 30, 30);
      ctx.globalCompositeOperation = 'source-over';
    }
    // power LED
    ctx.beginPath();
    ctx.arc(19, 8, 2.1, 0, TAU);
    ctx.fillStyle = on ? '#8dffb0' : rt.power === 'standby' ? 'rgba(255,190,70,' + (0.55 + 0.45 * Math.sin(t * 4)) + ')' : 'rgba(255,90,80,0.55)';
    ctx.fill();
    // the face
    ctx.save();
    ctx.translate(0, -5);
    Art.face(ctx, rt.face, 1, { eyeX: 9.2, eyeW: 4.2, eyeH: 6, mouthY: 9.5, mouthW: 4.8 }, INK);
    ctx.restore();
  }
  Art.DEVICES = Art.DEVICES || {};
  Art.DEVICES.drill = drill;

  /* ---------------------------------------------------------------- decor: vice, tape measure, screw jar */
  function vice(ctx, d, rt, t) {
    ctx.beginPath();
    rrect(ctx, -27, -17, 54, 44, 6);
    ctx.fillStyle = lin(ctx, -27, -17, 27, 27, [0, '#6a7790', 0.5, '#46526a', 1, '#2c3548']);
    ctx.fill();
    ctx.strokeStyle = 'rgba(210,225,245,0.45)';
    ctx.lineWidth = 1.1;
    ctx.stroke();
    // fixed jaw, moving jaw
    ctx.beginPath();
    rrect(ctx, -23, -15, 46, 12, 2.5);
    ctx.fillStyle = lin(ctx, 0, -15, 0, -3, [0, '#a9b6cb', 1, '#6e7b92']);
    ctx.fill();
    const open = 5 + (rt.poke || 0) * 4;
    ctx.beginPath();
    rrect(ctx, -19, -3 + open, 38, 10, 2.5);
    ctx.fillStyle = lin(ctx, 0, -3, 0, 7, [0, '#9aa8bf', 1, '#5f6c84']);
    ctx.fill();
    // screw and T-handle
    ctx.fillStyle = lin(ctx, -2, 0, 2, 0, [0, '#e4eaf3', 1, '#7c889b']);
    ctx.fillRect(-2.2, 7 + open, 4.4, 17);
    ctx.beginPath();
    rrect(ctx, -15, 22, 30, 5.2, 2.6);
    ctx.fillStyle = lin(ctx, 0, 22, 0, 27, [0, '#d5dce8', 1, '#6e7a8e']);
    ctx.fill();
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(sx * 15, 24.6, 3.4, 0, TAU);
      ctx.fillStyle = '#2d3445';
      ctx.fill();
    }
    // bolts
    ctx.fillStyle = 'rgba(10,16,26,0.6)';
    for (const [bx, by] of [[-22, -12], [22, -12]]) {
      ctx.beginPath();
      ctx.arc(bx, by, 1.6, 0, TAU);
      ctx.fill();
    }
  }
  function tapeMeasure(ctx, d, rt, t) {
    // the secret: the tape zips out with a ratchet when found
    if (rt.found) {
      const ext = 74;
      ctx.beginPath();
      rrect(ctx, 10, -6, ext, 12, 1.5);
      ctx.fillStyle = '#f4d24a';
      ctx.fill();
      ctx.strokeStyle = 'rgba(80,60,0,0.5)';
      ctx.lineWidth = 0.9;
      ctx.stroke();
      ctx.fillStyle = 'rgba(20,16,0,0.8)';
      for (let i = 0; i < 18; i++) ctx.fillRect(14 + i * 4, -6, 0.9, i % 4 === 0 ? 7 : 4);
      ctx.beginPath();
      rrect(ctx, 10 + ext - 2, -8, 3.4, 16, 1.2);
      ctx.fillStyle = '#9aa3b2';
      ctx.fill();
    }
    ctx.beginPath();
    rrect(ctx, -19, -19, 38, 38, 12);
    ctx.fillStyle = lin(ctx, -19, -19, 19, 19, [0, '#ffe46b', 0.55, '#f1bf1f', 1, '#c79200']);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-1, 0, 11, 0, TAU);
    ctx.fillStyle = 'rgba(20,18,10,0.82)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-1, 0, 6, 0, TAU);
    ctx.fillStyle = '#d8dde6';
    ctx.fill();
    ctx.beginPath();
    rrect(ctx, 6, -15, 9, 6, 3);
    ctx.fillStyle = '#d33d2f';
    ctx.fill();
  }
  function screwJar(ctx, d, rt, t) {
    const R = 22;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, TAU);
    ctx.fillStyle = lin(ctx, -R, -R, R, R, [0, 'rgba(235,246,255,0.95)', 1, 'rgba(160,185,210,0.9)']);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, R - 4, 0, TAU);
    ctx.fillStyle = 'rgba(70,80,96,0.35)';
    ctx.fill();
    const rnd = U.rng(7);
    for (let i = 0; i < 26; i++) {
      const a = rnd() * TAU,
        r = Math.sqrt(rnd()) * (R - 7),
        x = Math.cos(a) * r,
        y = Math.sin(a) * r,
        ra = rnd() * TAU;
      ctx.strokeStyle = rnd() < 0.5 ? '#d6c48a' : '#b9c0cc';
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x - Math.cos(ra) * 3.5, y - Math.sin(ra) * 3.5);
      ctx.lineTo(x + Math.cos(ra) * 3.5, y + Math.sin(ra) * 3.5);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(-7, -8, 7, 3.6, 5.3);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  Art.DECOR2 = Art.DECOR2 || {};
  Art.DECOR2.vice = { draw: vice, shadow: (ctx, d) => Art.shadow(ctx, d.x, d.y + 3, 56, 48, 6, 0, 0.3, 0.55) };
  Art.DECOR2.tapemeasure = { draw: tapeMeasure, shadow: (ctx, d) => Art.shadow(ctx, d.x, d.y, 40, 40, 12, 0, 0.18, 0.5) };
  Art.DECOR2.screwjar = { draw: screwJar, shadow: (ctx, d) => Art.shadow(ctx, d.x, d.y, 46, 46, 23, 0, 0.3, 0.5) };

  Art.SECRETS2 = Art.SECRETS2 || {};
  // a carpenter's pencil (flat, red)
  Art.SECRETS2.pencil = function (ctx) {
    ctx.rotate(-0.5);
    ctx.beginPath();
    rrect(ctx, -12, -3.2, 20, 6.4, 1.4);
    ctx.fillStyle = '#e04a32';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(8, -3.2);
    ctx.lineTo(14, 0);
    ctx.lineTo(8, 3.2);
    ctx.closePath();
    ctx.fillStyle = '#e8c597';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(12, -0.9);
    ctx.lineTo(14, 0);
    ctx.lineTo(12, 0.9);
    ctx.closePath();
    ctx.fillStyle = '#2a2a2a';
    ctx.fill();
  };

  /* ---------------------------------------------------------------- the pegboard (world 'peg') */
  function buildPegboardMat(k, dawn) {
    const M = Art.MAT;
    const pad = 26;
    const cv = document.createElement('canvas');
    cv.width = Math.ceil((M.w + pad * 2) * k);
    cv.height = Math.ceil((M.h + pad * 2) * k);
    const c = cv.getContext('2d');
    c.scale(k, k);
    c.translate(pad - M.x, pad - M.y);
    const rnd = U.rng(5521 + Math.round(dawn * 10));
    for (let i = 9; i >= 0; i--) {
      const t = i / 9;
      c.globalAlpha = 0.07 + (1 - t) * 0.05;
      c.fillStyle = '#1a0f05';
      c.beginPath();
      rrect(c, M.x - 3 - t * 10 + 3, M.y - 3 - t * 10 + 6, M.w + 6 + t * 20, M.h + 6 + t * 20, M.r + t * 10);
      c.fill();
    }
    c.globalAlpha = 1;
    c.beginPath();
    rrect(c, M.x, M.y, M.w, M.h, 14);
    c.fillStyle = lin(c, M.x, M.y, M.x + M.w, M.y + M.h, [0, '#dcc08e', 0.5, '#c9a972', 1, '#a88955']);
    c.fill();
    c.save();
    c.clip();
    // hardboard speckle
    for (let i = 0; i < 2400; i++) {
      const x = M.x + rnd() * M.w,
        y = M.y + rnd() * M.h;
      c.fillStyle = rnd() < 0.5 ? 'rgba(255,240,205,' + (0.04 + rnd() * 0.08) + ')' : 'rgba(80,50,20,' + (0.05 + rnd() * 0.08) + ')';
      c.fillRect(x, y, 1, 1);
    }
    // the perforations: a grid of holes, each with a dark well and a lit lip
    const pitch = 14;
    for (let y = M.y + 9; y < M.y + M.h - 4; y += pitch)
      for (let x = M.x + 9; x < M.x + M.w - 4; x += pitch) {
        c.beginPath();
        c.arc(x, y, 2.5, 0, TAU);
        c.fillStyle = 'rgba(42,28,14,0.78)';
        c.fill();
        c.beginPath();
        c.arc(x + 0.5, y + 0.7, 2.5, 0.1, Math.PI * 0.95);
        c.strokeStyle = 'rgba(255,238,200,0.5)';
        c.lineWidth = 0.8;
        c.stroke();
      }
    // golden-hour light from the upper left and a soft vignette
    c.fillStyle = rad(c, M.x + 40, M.y + 20, 10, 420, [0, 'rgba(255,214,140,0.28)', 1, 'rgba(255,214,140,0)']);
    c.fillRect(M.x, M.y, M.w, M.h);
    c.restore();
    c.beginPath();
    rrect(c, M.x + 0.5, M.y + 0.5, M.w - 1, M.h - 1, 14);
    c.strokeStyle = lin(c, M.x, M.y, M.x, M.y + M.h, [0, 'rgba(255,255,255,0.45)', 0.5, 'rgba(255,255,255,0.1)', 1, 'rgba(60,30,10,0.45)']);
    c.lineWidth = 1.6;
    c.stroke();
    // screws holding the board to the wall
    for (const [x, y] of [[M.x + 12, M.y + 12], [M.x + M.w - 12, M.y + 12], [M.x + 12, M.y + M.h - 12], [M.x + M.w - 12, M.y + M.h - 12]]) {
      c.beginPath();
      c.arc(x, y, 4, 0, TAU);
      c.fillStyle = lin(c, x - 4, y - 4, x + 4, y + 4, [0, '#f1e6cf', 1, '#8d7b5c']);
      c.fill();
      c.strokeStyle = 'rgba(40,25,10,0.6)';
      c.lineWidth = 0.8;
      c.stroke();
    }
    return { cv, pad, k };
  }
  function buildWall(Wp, Hp, k) {
    const cv = document.createElement('canvas');
    cv.width = Wp;
    cv.height = Hp;
    const c = cv.getContext('2d');
    const rnd = U.rng(88123);
    // a painted workshop wall, a warm grey-green
    c.fillStyle = lin(c, 0, 0, Wp, Hp, [0, '#7e8a78', 0.5, '#6a7664', 1, '#525d4f']);
    c.fillRect(0, 0, Wp, Hp);
    for (let i = 0; i < 900; i++) {
      c.fillStyle = rnd() < 0.5 ? 'rgba(255,245,215,' + (0.02 + rnd() * 0.04) + ')' : 'rgba(10,18,8,' + (0.03 + rnd() * 0.05) + ')';
      c.fillRect(rnd() * Wp, rnd() * Hp, (1 + rnd() * 3) * k, (1 + rnd() * 3) * k);
    }
    c.fillStyle = lin(c, 0, 0, Wp, Hp, [0, 'rgba(255,214,140,0.22)', 0.55, 'rgba(255,214,140,0)', 1, 'rgba(0,0,0,0.28)']);
    c.fillRect(0, 0, Wp, Hp);
    c.fillStyle = rad(c, Wp / 2, Hp / 2, Math.min(Wp, Hp) * 0.35, Math.max(Wp, Hp) * 0.78, [0, 'rgba(0,0,0,0)', 1, 'rgba(0,0,0,0.4)']);
    c.fillRect(0, 0, Wp, Hp);
    return cv;
  }
  const _surface2 = Art.buildSurface,
    _mat2 = Art.buildMat;
  Art.buildSurface = function (Wp, Hp, k, world) {
    return world === 'peg' ? buildWall(Wp, Hp, k) : _surface2(Wp, Hp, k, world);
  };
  Art.buildMat = function (k, dawn, tint, world) {
    return world === 'peg' ? buildPegboardMat(k, dawn) : _mat2(k, dawn, tint, world);
  };

  /* ---------------------------------------------------------------- hoops: two posts and a glass bulb on each */
  // gr: { lit 0..1, pop, hint }
  Art.gate = function (ctx, g, gr, t) {
    const col = Art.KEYCOL[g.key] || '#ffe9b8';
    const lit = gr.lit,
      pop = gr.pop;
    const ang = g.rot;
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.rotate(ang);
    const h = g.gap / 2;
    // the thread between the posts: a faint dotted guide that becomes a bright filament when a cable runs through
    ctx.lineCap = 'round';
    ctx.setLineDash(lit > 0.1 ? [] : [2.4, 4.2]);
    ctx.beginPath();
    ctx.moveTo(-h, 0);
    ctx.lineTo(h, 0);
    ctx.strokeStyle = lit > 0.1 ? U.rgba(col, 0.35 + 0.4 * lit) : 'rgba(255,255,255,' + (0.22 + 0.2 * gr.hint) + ')';
    ctx.lineWidth = lit > 0.1 ? 1.4 : 1.1;
    ctx.stroke();
    ctx.setLineDash([]);
    // the hint ring: this hoop is still needed
    if (gr.hint > 0.02) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = U.rgba(col, 0.55 * gr.hint * (0.5 + 0.5 * Math.sin(t * 9)));
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, h + 9, 0, TAU);
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    }
    for (const sx of [-1, 1]) {
      const x = sx * h;
      // soft shadow
      ctx.beginPath();
      ctx.arc(x + 1.6, 2.4, 6.4, 0, TAU);
      ctx.fillStyle = 'rgba(30,16,4,0.3)';
      ctx.fill();
      // brass collar
      ctx.beginPath();
      ctx.arc(x, 0, 5.6, 0, TAU);
      ctx.fillStyle = lin(ctx, x - 5, -5, x + 5, 5, BRASS);
      ctx.fill();
      ctx.strokeStyle = 'rgba(60,40,10,0.55)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      // the glass bulb: smoky when asleep, glowing when threaded
      const R = 7.4 * (1 + 0.22 * pop);
      ctx.beginPath();
      ctx.arc(x, 0, R, 0, TAU);
      ctx.fillStyle = lin(ctx, x - R, -R, x + R, R, [0, U.mix('#d9e4f0', col, 0.35 + 0.65 * lit), 1, U.mix('#6d7a8c', U.shade(col, -0.2), 0.2 + 0.8 * lit)]);
      ctx.globalAlpha = 0.5 + 0.5 * lit;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.55 + 0.3 * lit) + ')';
      ctx.lineWidth = 1.1;
      ctx.stroke();
      // the filament, and a highlight
      ctx.beginPath();
      ctx.moveTo(x - 2.6, 1.2);
      ctx.quadraticCurveTo(x, -3.4, x + 2.6, 1.2);
      ctx.strokeStyle = lit > 0.1 ? 'rgba(255,255,255,' + 0.9 * lit + ')' : 'rgba(60,70,90,0.5)';
      ctx.lineWidth = 1.1;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x - R * 0.35, -R * 0.4, R * 0.22, 0, TAU);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.fill();
      if (lit > 0.03) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = rad(ctx, x, 0, 1, 24, [0, U.rgba(col, 0.55 * lit), 1, U.rgba(col, 0)]);
        ctx.fillRect(x - 24, -24, 48, 48);
        ctx.globalCompositeOperation = 'source-over';
      }
    }
    ctx.restore();
  };

  /* ---------------------------------------------------------------- painted tool outlines on the pegboard */
  const OUTLINES = {
    hammer(ctx) {
      ctx.beginPath();
      rrect(ctx, -3, -26, 6, 52, 2);
      rrect(ctx, -14, -34, 28, 12, 3);
    },
    wrench(ctx) {
      ctx.beginPath();
      rrect(ctx, -3.5, -14, 7, 42, 3);
      ctx.moveTo(-10, -14);
      ctx.arc(0, -22, 11, Math.PI * 0.9, Math.PI * 2.1, false);
      ctx.closePath();
    },
    saw(ctx) {
      ctx.beginPath();
      ctx.moveTo(-22, 8);
      ctx.lineTo(26, -8);
      ctx.lineTo(26, 6);
      ctx.lineTo(-22, 22);
      ctx.closePath();
      rrect(ctx, -34, 4, 14, 22, 5);
    },
    pliers(ctx) {
      ctx.beginPath();
      ctx.moveTo(-3, -30);
      ctx.lineTo(-9, 4);
      ctx.lineTo(-6, 30);
      ctx.moveTo(3, -30);
      ctx.lineTo(9, 4);
      ctx.lineTo(6, 30);
      ctx.moveTo(-9, 4);
      ctx.lineTo(9, 4);
    },
  };
  Art.DECOR2.outline = {
    draw(ctx, d, rt, t) {
      const f = OUTLINES[d.kind] || OUTLINES.hammer;
      ctx.rotate(d.rot || 0);
      const lit = rt.lit || 0;
      f(ctx);
      ctx.fillStyle = 'rgba(244,226,186,' + (0.22 + 0.5 * lit) + ')';
      ctx.fill();
      ctx.strokeStyle = lit > 0.05 ? 'rgba(255,208,110,' + (0.5 + 0.45 * lit) + ')' : 'rgba(86,58,30,0.5)';
      ctx.lineWidth = 2.2;
      ctx.lineJoin = 'round';
      ctx.stroke();
      if (lit > 0.05) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.shadowColor = 'rgba(255,200,100,' + 0.8 * lit + ')';
        ctx.shadowBlur = 10 * lit;
        ctx.strokeStyle = 'rgba(255,220,140,' + 0.6 * lit + ')';
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalCompositeOperation = 'source-over';
      }
    },
    shadow() {},
  };
})();
