/* Snug — art-toyroom.js : Act 3, the toy room (world 'toy'): pale pine floorboards under a soft green felt play mat, the snail that
   carries a strip on its shell, its silver trail, the painted river with a plank bridge, a lettuce leaf. Registers into the
   surface/mat builders and the decor registry like the other worlds. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const U = G.U,
    Art = G.Art;
  const TAU = U.TAU;
  const rrect = Art.rrect,
    lin = Art.lin,
    rad = Art.rad;

  /* ---------------------------------------------------------------- surfaces */
  function buildPlanks(Wp, Hp, k) {
    const cv = document.createElement('canvas');
    cv.width = Wp;
    cv.height = Hp;
    const c = cv.getContext('2d');
    const rnd = U.rng(51703);
    c.fillStyle = lin(c, 0, 0, Wp, Hp, [0, '#d9c29b', 0.5, '#cdb48a', 1, '#b79e74']);
    c.fillRect(0, 0, Wp, Hp);
    const PW = 58 * k; // plank width
    for (let y = 0, row = 0; y < Hp; y += PW, row++) {
      c.fillStyle = 'rgba(' + (row % 2 ? '255,246,224' : '90,60,28') + ',' + (0.05 + rnd() * 0.05) + ')';
      c.fillRect(0, y, Wp, PW);
      // the gap between boards
      c.fillStyle = 'rgba(60,38,16,0.5)';
      c.fillRect(0, y, Wp, 1.6 * k);
      // butt joints, staggered
      let x = (row % 2 ? 0.37 : 0.82) * Wp * rnd();
      for (; x < Wp; x += (0.55 + rnd() * 0.6) * Wp * 0.5) {
        c.fillStyle = 'rgba(60,38,16,0.45)';
        c.fillRect(x, y, 1.6 * k, PW);
      }
      // grain
      c.strokeStyle = 'rgba(110,76,40,0.16)';
      c.lineWidth = 0.9 * k;
      for (let g = 0; g < 7; g++) {
        const yy = y + (g + 0.5 + rnd() * 0.4) * (PW / 7);
        c.beginPath();
        c.moveTo(0, yy);
        for (let xx = 0; xx <= Wp; xx += 40 * k) c.lineTo(xx, yy + Math.sin(xx * 0.01 + g + row) * 1.6 * k);
        c.stroke();
      }
      // a knot
      if (rnd() < 0.45) {
        const kx = rnd() * Wp,
          ky = y + PW * (0.3 + rnd() * 0.4);
        c.fillStyle = rad(c, kx, ky, 1, 7 * k, [0, 'rgba(90,56,24,0.55)', 1, 'rgba(90,56,24,0)']);
        c.fillRect(kx - 8 * k, ky - 8 * k, 16 * k, 16 * k);
        c.strokeStyle = 'rgba(90,56,24,0.35)';
        c.beginPath();
        c.ellipse(kx, ky, 4.5 * k, 2.6 * k, 0, 0, TAU);
        c.stroke();
      }
    }
    // a little scattered grit and a warm window light from the top-left, a vignette
    for (let i = 0; i < 2600; i++) {
      c.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(40,24,8,0.06)';
      c.fillRect(rnd() * Wp, rnd() * Hp, 1.4 * k, 1.4 * k);
    }
    c.fillStyle = lin(c, 0, 0, Wp, Hp, [0, 'rgba(255,240,210,0.16)', 0.55, 'rgba(255,240,210,0)', 1, 'rgba(0,0,0,0.26)']);
    c.fillRect(0, 0, Wp, Hp);
    c.fillStyle = rad(c, Wp / 2, Hp / 2, Math.min(Wp, Hp) * 0.35, Math.max(Wp, Hp) * 0.78, [0, 'rgba(0,0,0,0)', 1, 'rgba(0,0,0,0.36)']);
    c.fillRect(0, 0, Wp, Hp);
    return cv;
  }

  // the play mat: soft felt, a stitched border, printed road dashes
  function buildFelt(k, dawn) {
    const M = Art.MAT;
    const pad = 28;
    const cv = document.createElement('canvas');
    cv.width = Math.ceil((M.w + pad * 2) * k);
    cv.height = Math.ceil((M.h + pad * 2) * k);
    const c = cv.getContext('2d');
    c.scale(k, k);
    c.translate(pad - M.x, pad - M.y);
    const rnd = U.rng(7201 + Math.round(dawn * 10));
    for (let i = 8; i >= 0; i--) {
      const t = i / 8;
      c.globalAlpha = 0.06 + (1 - t) * 0.05;
      c.fillStyle = '#1a1208';
      c.beginPath();
      rrect(c, M.x - 2 - t * 8 + 2, M.y - 2 - t * 8 + 4, M.w + 4 + t * 16, M.h + 4 + t * 16, M.r + t * 8);
      c.fill();
    }
    c.globalAlpha = 1;
    c.beginPath();
    rrect(c, M.x, M.y, M.w, M.h, M.r);
    c.fillStyle = lin(c, M.x, M.y, M.x + M.w, M.y + M.h, [0, '#8fbf86', 0.5, '#7fb177', 1, '#6aa064']);
    c.fill();
    c.save();
    c.clip();
    // felt fibres
    for (let i = 0; i < 5200; i++) {
      c.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.07)' : 'rgba(20,50,20,0.1)';
      c.fillRect(M.x + rnd() * M.w, M.y + rnd() * M.h, 1.2, 1.2);
    }
    // printed road: two soft cream ribbons with a dashed centre line, looping around the board
    c.strokeStyle = 'rgba(250,240,208,0.11)';
    c.lineWidth = 26;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    const road = (pts) => {
      c.beginPath();
      c.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) c.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + (pts[i + 1] || pts[i])[0]) / 2, (pts[i][1] + (pts[i + 1] || pts[i])[1]) / 2);
      c.stroke();
    };
    road([[M.x + 40, M.y + 120], [M.x + 280, M.y + 160], [M.x + 150, M.y + 300], [M.x + 290, M.y + 440], [M.x + 60, M.y + 520]]);
    c.setLineDash([9, 10]);
    c.strokeStyle = 'rgba(255,252,236,0.16)';
    c.lineWidth = 2;
    road([[M.x + 40, M.y + 120], [M.x + 280, M.y + 160], [M.x + 150, M.y + 300], [M.x + 290, M.y + 440], [M.x + 60, M.y + 520]]);
    c.setLineDash([]);
    c.fillStyle = rad(c, M.x + 50, M.y + 40, 10, 380, [0, 'rgba(255,248,224,0.18)', 1, 'rgba(255,248,224,0)']);
    c.fillRect(M.x, M.y, M.w, M.h);
    c.restore();
    // stitched border
    c.strokeStyle = 'rgba(250,240,208,0.8)';
    c.lineWidth = 1.8;
    c.setLineDash([6, 5]);
    c.beginPath();
    rrect(c, M.x + 9, M.y + 9, M.w - 18, M.h - 18, M.r - 8);
    c.stroke();
    c.setLineDash([]);
    c.beginPath();
    rrect(c, M.x + 0.5, M.y + 0.5, M.w - 1, M.h - 1, M.r);
    c.strokeStyle = 'rgba(255,255,255,0.2)';
    c.lineWidth = 1;
    c.stroke();
    return { cv, pad, k };
  }
  const _s = Art.buildSurface,
    _m = Art.buildMat;
  Art.buildSurface = function (Wp, Hp, k, world) {
    return world === 'toy' ? buildPlanks(Wp, Hp, k) : _s(Wp, Hp, k, world);
  };
  Art.buildMat = function (k, dawn, tint, world) {
    return world === 'toy' ? buildFelt(k, dawn) : _m(k, dawn, tint, world);
  };

  /* ---------------------------------------------------------------- the carried strip's wall cord (it stretches from the wall to the moving strip) */
  Art.carriedUnder = function (ctx, st, rt, t) {
    const C = st.carrier;
    const b = G.Rules.stripBounds(st);
    const from = C.cord || { x: 372, y: st.y + 150 };
    const ca = Math.cos(st.angle),
      sa = Math.sin(st.angle);
    const ex = st.x + (from.x > st.x ? b[1] - 6 : b[0] + 6) * ca,
      ey = st.y + (from.x > st.x ? b[1] - 6 : b[0] + 6) * sa;
    const mx = (from.x + ex) / 2,
      my = (from.y + ey) / 2 + 26 + Math.min(34, Math.hypot(from.x - ex, from.y - ey) * 0.1); // a little sag
    ctx.save();
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.quadraticCurveTo(mx, my, from.x, from.y);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.strokeStyle = '#d9d2c0';
    ctx.lineWidth = 5.4;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();
    const cx = (b[0] + b[1]) / 2,
      w = b[1] - b[0];
    Art.shadow(ctx, st.x + cx * ca, st.y + cx * sa, w + 30, 76, 24, st.angle, 0.14, 0.5);
  };

  /* ---------------------------------------------------------------- the snail: a body under the strip (its shell) and a trail */
  // c: { x, y, heading, walk (0..1 how much it is going), hide (0..1 withdrawn), look {x,y}, blink, strain, munch, bob }
  Art.snail = function (ctx, c, t) {
    const hide = c.hide || 0;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.heading || 0);
    const bob = Math.sin((c.bob || 0) * 5) * 1.2 * (c.walk || 0);
    const squash = 1 + 0.035 * Math.sin((c.bob || 0) * 5 + 1) * (c.walk || 0);
    // the foot: a long soft capsule along the heading, head to the right (heading 0 = east)
    const bodyG = lin(ctx, 0, -26, 0, 26, [0, '#c5d3a3', 0.55, '#a9bd82', 1, '#8aa064']);
    const len = 62 - 12 * hide,
      wid = 24;
    ctx.save();
    ctx.scale(squash, 2 - squash);
    ctx.beginPath();
    ctx.moveTo(-len - 26, 4);
    ctx.bezierCurveTo(-len - 6, -wid * 0.9, -len * 0.4, -wid, 8, -wid * 0.8);
    ctx.bezierCurveTo(len * 0.7, -wid * 0.7, len + 8, -wid * 0.35, len + 20, 2);
    ctx.bezierCurveTo(len + 12, wid * 0.72, len * 0.4, wid, -len * 0.3, wid * 0.92);
    ctx.bezierCurveTo(-len * 0.8, wid * 0.88, -len - 12, wid * 0.55, -len - 26, 4);
    ctx.closePath();
    ctx.fillStyle = bodyG;
    ctx.fill();
    ctx.strokeStyle = 'rgba(60,76,36,0.5)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // glisten
    ctx.beginPath();
    ctx.ellipse(len * 0.35, -wid * 0.45, len * 0.42, 3.2, -0.04, 0, TAU);
    ctx.fillStyle = 'rgba(255,255,255,0.32)';
    ctx.fill();
    ctx.restore();
    // the eye stalks (they retract when it hides) and the face
    const hx = len + 6 + bob * 0.2,
      look = c.look || { x: 0, y: 0 };
    const sl = 22 * (1 - hide);
    for (const sy of [-1, 1]) {
      if (sl < 2) break;
      const ex = hx + 6 + look.x * 3,
        ey = sy * (8 + sl * 0.2) + look.y * 3 - sy * 2 * 0;
      ctx.beginPath();
      ctx.moveTo(hx - 4, sy * 6);
      ctx.quadraticCurveTo(hx + sl * 0.5, sy * (sl * 0.5), ex + sl * 0.15, sy * (8 + sl * 0.65));
      ctx.strokeStyle = '#9db27a';
      ctx.lineWidth = 5.2;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(ex + sl * 0.15, sy * (8 + sl * 0.65), 5.8, 0, TAU);
      ctx.fillStyle = '#fbfbf2';
      ctx.fill();
      ctx.strokeStyle = 'rgba(60,76,36,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
      const bl = c.blink > 0 ? 0.25 : 1;
      if (c.happy > 0.5) {
        // eyes shut in a smile (the room is awake)
        ctx.beginPath();
        ctx.arc(ex + sl * 0.15, sy * (8 + sl * 0.65) + 1, 3, 1.15 * Math.PI, 1.85 * Math.PI);
        ctx.strokeStyle = '#2e3a22';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.ellipse(ex + sl * 0.15 + look.x * 1.6, sy * (8 + sl * 0.65) + look.y * 1.6, 2.5, 2.9 * bl, 0, 0, TAU);
        ctx.fillStyle = '#2e3a22';
        ctx.fill();
      }
    }
    // a small smile, a squint when it strains
    ctx.strokeStyle = 'rgba(52,66,32,0.85)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    if (c.strain > 0.3) {
      ctx.moveTo(hx + 4, 3);
      ctx.lineTo(hx + 12, 3);
    } else if (c.munch > 0) {
      ctx.arc(hx + 8, 3, 3 + Math.abs(Math.sin(t * 14)) * 2, 0, TAU);
    } else if (c.happy > 0.5) {
      ctx.arc(hx + 8, -1, 7, 0.15 * Math.PI, 0.85 * Math.PI);
    } else {
      ctx.arc(hx + 7, 0, 5, 0.25 * Math.PI, 0.8 * Math.PI);
    }
    ctx.stroke();
    if (c.happy > 0.5) {
      ctx.fillStyle = 'rgba(255,140,150,0.45)';
      for (const sy of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(hx + 2, sy * 11, 4, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
    // the shell, round and spiralled, under the strip (the strip is what sits on it)
    ctx.save();
    ctx.translate(c.x, c.y - 2 + bob);
    ctx.rotate((c.heading || 0) * 0.2);
    const sw = 84,
      sh = 40;
    ctx.beginPath();
    ctx.ellipse(0, 0, sw, sh, 0, 0, TAU);
    ctx.fillStyle = lin(ctx, 0, -sh, 0, sh, [0, '#e7a56a', 0.5, '#cf7f45', 1, '#a95b2e']);
    ctx.fill();
    ctx.strokeStyle = 'rgba(100,50,20,0.55)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(120,60,24,0.5)';
    ctx.lineWidth = 2;
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      ctx.ellipse(-8 + i * 2, 0, sw * (1 - i * 0.2), sh * (1 - i * 0.2), 0, 0, TAU);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.ellipse(-sw * 0.3, -sh * 0.45, sw * 0.4, 5, -0.2, 0, TAU);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fill();
    ctx.restore();
  };

  // the silver trail: a ribbon that the snail leaves; it glows when the room wakes
  Art.trail = function (ctx, pts, glow, t) {
    if (pts.length < 2) return;
    const path = new Path2D();
    path.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) path.quadraticCurveTo(pts[i].x, pts[i].y, (pts[i].x + pts[i + 1].x) / 2, (pts[i].y + pts[i + 1].y) / 2);
    path.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(40,60,40,0.12)';
    ctx.lineWidth = 11;
    ctx.stroke(path);
    ctx.strokeStyle = 'rgba(232,240,248,' + (0.34 + 0.2 * glow) + ')';
    ctx.lineWidth = 7;
    ctx.stroke(path);
    ctx.strokeStyle = 'rgba(255,255,255,' + (0.5 + 0.3 * glow) + ')';
    ctx.lineWidth = 2.2;
    ctx.stroke(path);
    if (glow > 0.02) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.setLineDash([2, 16]);
      ctx.lineDashOffset = -t * 30;
      ctx.strokeStyle = 'rgba(255,248,200,' + 0.9 * glow + ')';
      ctx.lineWidth = 4;
      ctx.stroke(path);
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(190,230,255,' + 0.2 * glow + ')';
      ctx.lineWidth = 14;
      ctx.stroke(path);
    }
    ctx.restore();
  };

  // the road being drawn (crayon), dashed red past the point where a seated cable would stop the snail
  Art.crayonRoad = function (ctx, pts, stallAt, t, o) {
    if (pts.length < 2) return;
    o = o || {};
    let s = 0;
    const solid = [pts[0]],
      rest = [];
    let stalled = false;
    for (let i = 1; i < pts.length; i++) {
      s += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      if (!stalled && stallAt >= 0 && s > stallAt) {
        stalled = true;
        rest.push(pts[i - 1]);
      }
      (stalled ? rest : solid).push(pts[i]);
    }
    const draw = (P, col, w, dash) => {
      if (P.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(P[0].x, P[0].y);
      for (let i = 1; i < P.length - 1; i++) ctx.quadraticCurveTo(P[i].x, P[i].y, (P[i].x + P[i + 1].x) / 2, (P[i].y + P[i + 1].y) / 2);
      ctx.lineTo(P[P.length - 1].x, P[P.length - 1].y);
      ctx.setLineDash(dash || []);
      ctx.strokeStyle = col;
      ctx.lineWidth = w;
      ctx.stroke();
      ctx.setLineDash([]);
    };
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = o.alpha === undefined ? 1 : o.alpha;
    draw(solid, 'rgba(70,40,10,0.18)', 9);
    draw(solid, '#ffb347', 5.4);
    draw(solid, 'rgba(255,236,160,0.75)', 1.8, [1, 7]);
    if (rest.length > 1) {
      draw(rest, 'rgba(70,40,10,0.14)', 9, [10, 9]);
      draw(rest, '#ff6a5a', 4.4, [10, 9]);
      const e = rest[0];
      ctx.strokeStyle = '#ff6a5a';
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      ctx.moveTo(e.x - 6, e.y - 6);
      ctx.lineTo(e.x + 6, e.y + 6);
      ctx.moveTo(e.x + 6, e.y - 6);
      ctx.lineTo(e.x - 6, e.y + 6);
      ctx.stroke();
    }
    ctx.restore();
  };

  /* ---------------------------------------------------------------- decor: the painted river, a plank bridge, a lettuce leaf */
  Art.DECOR2.river = {
    draw(ctx, d, rt, t) {
      const w = d.w || 80,
        h = d.h || 200;
      ctx.beginPath();
      rrect(ctx, -w / 2, -h / 2, w, h, Math.min(16, w / 2));
      ctx.fillStyle = lin(ctx, 0, -h / 2, 0, h / 2, [0, '#8fcdea', 0.5, '#6bb6dd', 1, '#58a2cc']);
      ctx.fill();
      ctx.save();
      ctx.clip();
      // ripples
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1.6;
      for (let y = -h / 2 + 10; y < h / 2; y += 17) {
        ctx.beginPath();
        for (let x = -w / 2; x <= w / 2; x += 6) {
          const yy = y + Math.sin(x * 0.28 + t * 1.4 + y * 0.2) * 2.2;
          if (x === -w / 2) ctx.moveTo(x, yy);
          else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,0.65)';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      rrect(ctx, -w / 2 + 1, -h / 2 + 1, w - 2, h - 2, Math.min(16, w / 2));
      ctx.stroke();
    },
    shadow: () => {},
  };
  Art.DECOR2.plank = {
    draw(ctx, d, rt, t) {
      const w = d.w || 74,
        h = d.h || 40;
      for (let i = 0; i < 5; i++) {
        const x = -w / 2 + (i + 0.5) * (w / 5);
        ctx.beginPath();
        rrect(ctx, x - w / 10 + 0.8, -h / 2, w / 5 - 1.6, h, 3);
        ctx.fillStyle = lin(ctx, 0, -h / 2, 0, h / 2, [0, i % 2 ? '#d9a867' : '#cc9857', 1, '#a9753e']);
        ctx.fill();
        ctx.strokeStyle = 'rgba(80,46,16,0.45)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = 'rgba(70,40,14,0.55)';
        ctx.beginPath();
        ctx.arc(x, -h / 2 + 5, 1.2, 0, TAU);
        ctx.arc(x, h / 2 - 5, 1.2, 0, TAU);
        ctx.fill();
      }
    },
    shadow: (ctx, d) => Art.shadow(ctx, d.x, d.y + 2, (d.w || 74) + 6, (d.h || 40) + 4, 6, 0, 0.18, 0.5),
  };
  Art.SECRETS2 = Art.SECRETS2 || {};
  Art.SECRETS2.goldyarn = function (ctx) {
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, TAU);
    ctx.fillStyle = lin(ctx, -8, -8, 8, 8, [0, '#fff0a8', 1, '#c9922e']);
    ctx.fill();
    ctx.strokeStyle = 'rgba(110,70,0,0.65)';
    ctx.lineWidth = 1;
    ctx.stroke();
    for (const a of [0.4, 1.3, 2.3]) {
      ctx.beginPath();
      ctx.arc(0, 0, 6, a, a + 1.5);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(6, 5);
    ctx.quadraticCurveTo(14, 8, 12, 14);
    ctx.stroke();
  };
  Art.SECRETS2.goldwhistle = function (ctx) {
    ctx.rotate(-0.5);
    ctx.beginPath();
    rrect(ctx, -9, -4, 16, 8, 3.5);
    ctx.fillStyle = lin(ctx, 0, -4, 0, 4, [0, '#fff0a8', 1, '#c9922e']);
    ctx.fill();
    ctx.strokeStyle = 'rgba(110,70,0,0.65)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(8, 0, 4.6, 0, TAU);
    ctx.fillStyle = lin(ctx, 4, -5, 12, 5, [0, '#fff0a8', 1, '#c9922e']);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-9, 0, 2, 0, TAU);
    ctx.stroke();
  };
  Art.SECRETS2.goldkey = function (ctx) {
    ctx.rotate(0.5);
    for (const sy of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(-8, sy * 4.4, 3.4, 5.2, 0, 0, TAU);
      ctx.fillStyle = lin(ctx, -11, sy * 4 - 5, -5, sy * 4 + 5, [0, '#fff0a8', 1, '#c9922e']);
      ctx.fill();
      ctx.strokeStyle = 'rgba(110,70,0,0.65)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(10, 0);
    ctx.strokeStyle = '#c9922e';
    ctx.lineWidth = 3;
    ctx.stroke();
  };
  Art.SECRETS2.goldleaf = function (ctx) {
    ctx.rotate(-0.4);
    ctx.beginPath();
    ctx.moveTo(-9, 2);
    ctx.bezierCurveTo(-8, -9, 4, -11, 10, -3);
    ctx.bezierCurveTo(8, 7, -2, 9, -9, 2);
    ctx.closePath();
    ctx.fillStyle = lin(ctx, -9, -8, 10, 8, [0, '#fff0a8', 1, '#c9922e']);
    ctx.fill();
    ctx.strokeStyle = 'rgba(110,70,0,0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-8, 2);
    ctx.quadraticCurveTo(0, -1, 9, -3);
    ctx.stroke();
  };
  // a patch of window light on the floor: four skewed panes, warm, and a little alive (dust turning in it)
  Art.DECOR2.sunpatch = {
    draw(ctx, d, rt, t) {
      const w = d.w || 220,
        h = d.h || 150;
      const sk = d.skew === undefined ? 36 : d.skew;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 2; i++)
        for (let j = 0; j < 2; j++) {
          const x0 = -w / 2 + i * (w / 2) + 3,
            x1 = x0 + w / 2 - 6,
            y0 = -h / 2 + j * (h / 2) + 3,
            y1 = y0 + h / 2 - 6;
          const g = ctx.createLinearGradient(x0, y0, x1, y1);
          g.addColorStop(0, 'rgba(255,228,160,0.34)');
          g.addColorStop(1, 'rgba(255,228,160,0.14)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(x0 + sk * (1 - j) * 0.5, y0);
          ctx.lineTo(x1 + sk * (1 - j) * 0.5, y0);
          ctx.lineTo(x1 + sk * (1 - j) * 0.5 - sk * 0.25, y1);
          ctx.lineTo(x0 + sk * (1 - j) * 0.5 - sk * 0.25, y1);
          ctx.closePath();
          ctx.fill();
        }
      ctx.restore();
    },
    shadow: () => {},
  };
  // a ball of red yarn with a loose end (the cat's, naturally)
  Art.DECOR2.yarn = {
    draw(ctx, d, rt, t) {
      const R = 17;
      ctx.rotate((rt.poke || 0) * Math.sin(t * 30) * 0.2);
      ctx.beginPath();
      ctx.arc(0, 0, R, 0, TAU);
      ctx.fillStyle = rad(ctx, -5, -6, 2, R * 1.3, [0, '#ff9a8a', 1, '#c93f3a']);
      ctx.fill();
      ctx.strokeStyle = 'rgba(110,20,20,0.55)';
      ctx.lineWidth = 1.1;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.ellipse(0, 0, R * (0.95 - i * 0.08), R * (0.3 + i * 0.1), i * 0.6, 0, TAU);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(R * 0.8, R * 0.6);
      ctx.bezierCurveTo(R * 1.8, R * 1.2, R * 2.4, R * 0.2, R * 3.1, R * 1.1);
      ctx.strokeStyle = '#c93f3a';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.stroke();
    },
    shadow: (ctx, d) => Art.shadow(ctx, d.x, d.y + 3, 42, 36, 16, 0, 0.2, 0.5),
  };
  Art.DECOR2.lettuce = {
    draw(ctx, d, rt, t) {
      const bites = Math.min(3, rt.bites || 0);
      ctx.beginPath();
      for (let i = 0; i <= 28; i++) {
        const a = (i / 28) * TAU;
        const r = 20 + Math.sin(a * 5 + 0.6) * 3.4 + Math.sin(a * 9) * 1.4 - (a > 0.2 && a < 0.2 + bites * 0.55 ? 8 : 0);
        const x = Math.cos(a) * r * 1.1,
          y = Math.sin(a) * r * 0.9;
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = rad(ctx, -5, -6, 2, 26, [0, '#d4efa0', 1, '#78b04a']);
      ctx.fill();
      ctx.strokeStyle = 'rgba(40,90,20,0.5)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(240,255,210,0.7)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-14, 5);
      ctx.quadraticCurveTo(0, -2, 15, -8);
      for (const q of [[-4, 4, -10, 14], [2, -1, -2, -13], [8, -4, 14, 4]]) {
        ctx.moveTo(q[0], q[1]);
        ctx.lineTo(q[2], q[3]);
      }
      ctx.stroke();
    },
    shadow: (ctx, d) => Art.shadow(ctx, d.x, d.y + 2, 44, 38, 16, 0, 0.18, 0.5),
  };

  /* ---------------------------------------------------------------- Biscuit, seen from above, in motion (Level 22 on) */
  // c: { x, y, heading, pose: 'sit'|'watch'|'stalk'|'run'|'pounce'|'caught'|'nap', gait, tail, crouch (0..1), stretch (0..1), wiggle,
  //      eyes (0 open .. 1 closed), ears (0..1 pricked), look {x,y} (unit vector toward the light), purr }
  Art.catWalker = function (ctx, c, t) {
    const fur = '#9aa0b4',
      dark = '#6f7690',
      light = '#d6d9e6',
      pink = '#e9a7b6';
    const pose = c.pose;
    const moving = pose === 'stalk' || pose === 'run';
    const crouch = c.crouch || 0,
      stretch = c.stretch || 0;
    ctx.save();
    ctx.translate(c.x, c.y);
    // a soft shadow under her (bigger when she is in the air)
    Art.shadow(ctx, 0, 6, 62 + 18 * stretch, 36, 18, c.heading || 0, 0.16 + 0.08 * (c.air || 0), 0.5);
    ctx.rotate(c.heading || 0);
    const gait = c.gait || 0;
    const sc = 1 + 0.2 * (c.air || 0);
    ctx.scale(sc, sc);
    if (pose === 'nap') {
      // curled up: a round body, the tail around, the head tucked, breathing
      const br = 1 + 0.03 * Math.sin(t * 1.7);
      ctx.scale(br, br);
      ctx.beginPath();
      ctx.ellipse(0, 0, 26, 22, 0, 0, TAU);
      ctx.fillStyle = lin(ctx, -22, -18, 22, 18, [0, '#b9bfd0', 1, dark]);
      ctx.fill();
      ctx.strokeStyle = 'rgba(40,46,70,0.5)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(40,46,70,0.42)';
      ctx.lineWidth = 1.7;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 8 - 2, -15);
        ctx.quadraticCurveTo(i * 8 + 2, 0, i * 8 - 2, 15);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(2, 5, 21, 0.3, 3.0);
      ctx.strokeStyle = fur;
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(20, -2, 10.5, 0, TAU);
      ctx.fillStyle = lin(ctx, 12, -12, 28, 8, [0, '#c4c9d8', 1, fur]);
      ctx.fill();
      ctx.strokeStyle = 'rgba(40,46,70,0.5)';
      ctx.lineWidth = 1.1;
      ctx.stroke();
      for (const sy of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(17, sy * 8);
        ctx.lineTo(22, sy * 15);
        ctx.lineTo(25, sy * 7);
        ctx.closePath();
        ctx.fillStyle = fur;
        ctx.fill();
      }
      ctx.strokeStyle = '#3a2412';
      ctx.lineWidth = 1.3;
      for (const sy of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(25, sy * 4, 2.2, -0.3, Math.PI * 0.8 - 0.3);
        ctx.stroke();
      }
      ctx.restore();
      return;
    }
    // ---- the four paws (they swing with the gait)
    const swing = moving ? (pose === 'run' ? 9 : 5) : 0;
    const bl = 21 - 5 * crouch + 8 * stretch; // body half-length
    const paws = [
      [bl * 0.6, -11, 0],
      [bl * 0.6, 11, Math.PI],
      [-bl * 0.55, -11, Math.PI],
      [-bl * 0.55, 11, 0],
    ];
    for (const [px, py, ph] of paws) {
      let ox = swing * Math.sin(gait + ph);
      if (pose === 'pounce' || pose === 'caught') ox = px > 0 ? 9 + 4 * stretch : -2;
      ctx.beginPath();
      ctx.ellipse(px + ox, py, 6.2, 4.4, 0, 0, TAU);
      ctx.fillStyle = light;
      ctx.fill();
      ctx.strokeStyle = 'rgba(40,46,70,0.4)';
      ctx.lineWidth = 0.9;
      ctx.stroke();
    }
    // ---- the tail: a wave that speeds up when she is excited, or a hook when she sits
    const tailLive = pose === 'sit' || pose === 'watch' ? 0.5 : 1;
    ctx.beginPath();
    const tx = -bl - 2;
    ctx.moveTo(tx, 0);
    const w = Math.sin((c.tail || 0) * 2) * (6 + 6 * (pose === 'run' ? 1 : 0.4)) * tailLive;
    if (pose === 'sit' || pose === 'watch' || pose === 'caught') ctx.bezierCurveTo(tx - 12, 8 + w * 0.5, tx - 24, 10 + w, tx - 30, 2 + w);
    else ctx.bezierCurveTo(tx - 14, w * 0.3, tx - 26, w, tx - 40 - 8 * stretch, w * 0.4);
    ctx.strokeStyle = dark;
    ctx.lineWidth = 8.4;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.strokeStyle = fur;
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.strokeStyle = light;
    ctx.lineWidth = 2.6;
    ctx.stroke();
    // ---- the body (shorter and rounder when she crouches, longer when she stretches), a butt wiggle before a pounce
    ctx.save();
    ctx.rotate(c.wiggle || 0);
    ctx.beginPath();
    ctx.ellipse(0, 0, bl + 8, 12.5 + 3 * crouch, 0, 0, TAU);
    ctx.fillStyle = lin(ctx, 0, -14, 0, 14, [0, '#b3b9cb', 0.6, fur, 1, dark]);
    ctx.fill();
    ctx.strokeStyle = 'rgba(40,46,70,0.5)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(40,46,70,0.42)';
    ctx.lineWidth = 1.8;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 9 - 3, -11);
      ctx.quadraticCurveTo(i * 9, 0, i * 9 - 3, 11);
      ctx.stroke();
    }
    ctx.restore();
    // ---- the head, turned toward the light
    const lk = c.look || { x: 1, y: 0 };
    const ca = Math.cos(c.heading || 0),
      sa = Math.sin(c.heading || 0);
    let lx = lk.x * ca + lk.y * sa,
      ly = -lk.x * sa + lk.y * ca; // the light in her own frame
    const la = Math.max(-0.9, Math.min(0.9, Math.atan2(ly, lx)));
    ctx.save();
    ctx.translate(bl + 12, 0);
    ctx.rotate(pose === 'caught' ? 0 : la * 0.8);
    for (const sy of [-1, 1]) {
      const ear = 1 + 0.25 * (c.ears || 0);
      ctx.beginPath();
      ctx.moveTo(-2, sy * 6);
      ctx.lineTo(-7 * ear, sy * 13.5 * ear);
      ctx.lineTo(4, sy * 10);
      ctx.closePath();
      ctx.fillStyle = fur;
      ctx.fill();
      ctx.strokeStyle = 'rgba(40,46,70,0.45)';
      ctx.lineWidth = 0.9;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-1, sy * 7.2);
      ctx.lineTo(-5 * ear, sy * 11.5 * ear);
      ctx.lineTo(2.6, sy * 9.6);
      ctx.closePath();
      ctx.fillStyle = pink;
      ctx.fill();
    }
    ctx.beginPath();
    ctx.ellipse(0, 0, 11.5, 10.5, 0, 0, TAU);
    ctx.fillStyle = lin(ctx, -8, -10, 12, 10, [0, '#c4c9d8', 1, fur]);
    ctx.fill();
    ctx.strokeStyle = 'rgba(40,46,70,0.5)';
    ctx.lineWidth = 1.1;
    ctx.stroke();
    // eyes (wide when she is hunting, shut when she purrs) with the pupil following the light
    for (const sy of [-1, 1]) {
      const ec = c.eyes || 0;
      if (ec > 0.6) {
        ctx.beginPath();
        ctx.arc(3.5, sy * 4.4, 2.3, -0.4, Math.PI * 0.75);
        ctx.strokeStyle = '#3a2412';
        ctx.lineWidth = 1.3;
        ctx.stroke();
      } else {
        const big = pose === 'stalk' || pose === 'pounce' || pose === 'run' ? 1.25 : 1;
        ctx.beginPath();
        ctx.ellipse(3.6, sy * 4.4, 2.9 * big, 2.5 * big * (1 - ec), 0, 0, TAU);
        ctx.fillStyle = '#e8e2a2';
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(4.4 + lx * 0.7, sy * 4.4 + ly * 0.8, 1.2 * big, 2 * big * (1 - ec), 0, 0, TAU);
        ctx.fillStyle = '#20180c';
        ctx.fill();
      }
    }
    ctx.beginPath();
    ctx.arc(10, 0, 1.5, 0, TAU);
    ctx.fillStyle = pink;
    ctx.fill();
    ctx.strokeStyle = 'rgba(50,40,40,0.5)';
    ctx.lineWidth = 0.9;
    for (const sy of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(8, sy * 2);
      ctx.lineTo(15, sy * 6.5);
      ctx.moveTo(8, sy * 3);
      ctx.lineTo(15, sy * 3.2);
      ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
  };

  // the hand mirror's spot of sunlight: a small hot dot with a halo and a few sparkles
  Art.lightSpot = function (ctx, sp, t) {
    if (sp.vis < 0.02) return;
    ctx.save();
    ctx.translate(sp.x, sp.y);
    ctx.globalCompositeOperation = 'lighter';
    const r = 17 + 2.2 * Math.sin(t * 9) * (sp.caught > 0 ? 0 : 1);
    ctx.fillStyle = rad(ctx, 0, 0, 1, r * 2.6, [0, 'rgba(255,250,214,' + 0.55 * sp.vis + ')', 0.4, 'rgba(255,232,150,' + 0.22 * sp.vis + ')', 1, 'rgba(255,220,120,0)']);
    ctx.fillRect(-r * 2.6, -r * 2.6, r * 5.2, r * 5.2);
    ctx.fillStyle = rad(ctx, 0, 0, 0.5, r, [0, 'rgba(255,255,255,' + 0.95 * sp.vis + ')', 1, 'rgba(255,244,190,' + 0.35 * sp.vis + ')']);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  };

  /* ---------------------------------------------------------------- the toy train (Level 23) */
  // the points: a brass base, a little lever that swings to the branch the train will take, a lamp (green: that branch is safe)
  Art.trackPoints = function (ctx, x, y, a, safe, t) {
    ctx.save();
    ctx.translate(x, y);
    Art.shadow(ctx, 1, 4, 40, 38, 18, 0, 0.2, 0.5);
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, TAU);
    ctx.fillStyle = lin(ctx, -12, -12, 12, 12, [0, '#f3d98c', 0.5, '#c9a24a', 1, '#8a6a22']);
    ctx.fill();
    ctx.strokeStyle = 'rgba(70,46,8,0.6)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    // the throw: from pointing at the first branch (a = 0) to the second (a = 1)
    const ang = U.lerp(-2.45, -0.7, a);
    ctx.save();
    ctx.rotate(ang);
    ctx.beginPath();
    rrect(ctx, 0, -2.6, 20, 5.2, 2.6);
    ctx.fillStyle = '#7a1d1d';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(21, 0, 5, 0, TAU);
    ctx.fillStyle = lin(ctx, 17, -5, 25, 5, [0, '#ff8a7a', 1, '#c4332a']);
    ctx.fill();
    ctx.strokeStyle = 'rgba(70,10,10,0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    ctx.beginPath();
    ctx.arc(0, 0, 4.2, 0, TAU);
    ctx.fillStyle = '#3a2a10';
    ctx.fill();
    // the lamp
    const col = safe ? '#7dff9a' : '#ff6a5a';
    ctx.beginPath();
    ctx.arc(0, 24, 4.4, 0, TAU);
    ctx.fillStyle = col;
    ctx.fill();
    ctx.strokeStyle = 'rgba(40,30,10,0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rad(ctx, 0, 24, 1, 16, [0, safe ? 'rgba(125,255,154,0.55)' : 'rgba(255,106,90,0.55)', 1, 'rgba(0,0,0,0)']);
    ctx.fillRect(-16, 8, 32, 32);
    ctx.restore();
  };
  // the signal lever: a brass slot, a red knob that slides down to STOP, a lamp that is red when the train waits at a station
  Art.signalLever = function (ctx, x, y, a, stopped, t) {
    ctx.save();
    ctx.translate(x, y);
    Art.shadow(ctx, 2, 5, 36, 70, 12, 0, 0.2, 0.5);
    ctx.beginPath();
    rrect(ctx, -11, -30, 22, 60, 9);
    ctx.fillStyle = lin(ctx, -11, -30, 11, 30, [0, '#f0d58a', 0.5, '#c9a24a', 1, '#8a6a22']);
    ctx.fill();
    ctx.strokeStyle = 'rgba(70,46,8,0.6)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.beginPath();
    rrect(ctx, -3, -22, 6, 44, 3);
    ctx.fillStyle = '#2c1f08';
    ctx.fill();
    const ky = U.lerp(-20, 20, a);
    ctx.beginPath();
    ctx.arc(0, ky, 9.5, 0, TAU);
    ctx.fillStyle = rad(ctx, -3, ky - 3, 1, 12, [0, '#ff9484', 1, '#c4332a']);
    ctx.fill();
    ctx.strokeStyle = 'rgba(70,10,10,0.65)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // the lamp above: green for go, red for stop (a steady red once it is standing in the station)
    const stop = a > 0.5;
    ctx.beginPath();
    ctx.arc(0, -42, 6, 0, TAU);
    ctx.fillStyle = stop ? (stopped ? '#ff5a46' : '#ffb04a') : '#7dff9a';
    ctx.fill();
    ctx.strokeStyle = 'rgba(40,30,10,0.6)';
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rad(ctx, 0, -42, 1, 20, [0, stop ? 'rgba(255,120,90,0.55)' : 'rgba(125,255,154,0.55)', 1, 'rgba(0,0,0,0)']);
    ctx.fillRect(-20, -62, 40, 40);
    ctx.restore();
  };
  // a coupling rod between the engine and the wagon
  Art.trainCoupling = function (ctx, strip, e) {
    const bx = e.x - Math.cos(e.heading) * 26,
      by = e.y - Math.sin(e.heading) * 26;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(strip.x + 1, strip.y + 3);
    ctx.lineTo(bx + 1, by + 3);
    ctx.stroke();
    ctx.strokeStyle = '#3c414d';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(strip.x, strip.y);
    ctx.lineTo(bx, by);
    ctx.stroke();
    ctx.strokeStyle = '#a9b1c2';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
  };
  // the flatbed wagon under the strip, with a dynamo flywheel at one end that spins (and glows) while the wheels turn
  Art.flatbed = function (ctx, strip, o, t) {
    ctx.save();
    ctx.translate(strip.x, strip.y);
    Art.shadow(ctx, 3, 6, 190, 86, 22, 0, 0.18, 0.5);
    const sh = o.strain ? Math.sin(t * 60) * 0.7 : 0;
    ctx.translate(sh, 0);
    for (const sx of [-1, 1])
      for (const sy of [-1, 1]) {
        ctx.beginPath();
        rrect(ctx, sx * 62 - 9, sy * 28 - (sy > 0 ? 3 : 5), 18, 8, 3);
        ctx.fillStyle = '#2c2f38';
        ctx.fill();
      }
    ctx.beginPath();
    rrect(ctx, -84, -30, 168, 60, 12);
    ctx.fillStyle = lin(ctx, 0, -30, 0, 30, [0, '#d9ad6c', 0.5, '#c99a5e', 1, '#a9773e']);
    ctx.fill();
    ctx.strokeStyle = 'rgba(80,46,16,0.6)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(80,46,16,0.3)';
    ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(-82, i * 11.5);
      ctx.lineTo(82, i * 11.5);
      ctx.stroke();
    }
    // the dynamo: a flywheel on the left end, glowing when it turns
    const fx = -92;
    ctx.beginPath();
    ctx.arc(fx, 0, 13, 0, TAU);
    ctx.fillStyle = lin(ctx, fx - 12, -12, fx + 12, 12, [0, '#cfd6e4', 1, '#6c7384']);
    ctx.fill();
    ctx.strokeStyle = 'rgba(30,34,44,0.7)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.save();
    ctx.translate(fx, 0);
    ctx.rotate(o.spin || 0);
    ctx.strokeStyle = '#3a4050';
    ctx.lineWidth = 2.4;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos((i * TAU) / 4) * 10.5, Math.sin((i * TAU) / 4) * 10.5);
      ctx.stroke();
    }
    ctx.restore();
    ctx.beginPath();
    ctx.arc(fx, 0, 3.4, 0, TAU);
    ctx.fillStyle = '#e9c86a';
    ctx.fill();
    // the charge: a ring that fills as the wheels charge the dynamo (green when it is full)
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(fx, 0, 17, 0, TAU);
    ctx.strokeStyle = 'rgba(40,30,10,0.35)';
    ctx.lineWidth = 3.4;
    ctx.stroke();
    if (o.charge > 0.01) {
      ctx.beginPath();
      ctx.arc(fx, 0, 17, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, o.charge));
      ctx.strokeStyle = o.charge >= 0.999 ? '#7dff9a' : '#ffd24a';
      ctx.lineWidth = 3.4;
      ctx.stroke();
    }
    if (o.dyn > 0.02) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rad(ctx, fx, 0, 2, 30, [0, 'rgba(255,236,150,' + 0.6 * o.dyn + ')', 1, 'rgba(255,236,150,0)']);
      ctx.fillRect(fx - 32, -32, 64, 64);
    }
    ctx.restore();
  };
  // Choo: a little steam engine seen from above, with a face on its boiler
  Art.engine = function (ctx, e, o, t) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(e.heading);
    Art.shadow(ctx, 2, 5, 76, 44, 18, 0, 0.2, 0.5);
    for (const sx of [-1, 1])
      for (const sy of [-1, 1]) {
        ctx.beginPath();
        rrect(ctx, sx * 13 - 6, sy * 17 - 3, 12, 6, 2.5);
        ctx.fillStyle = '#2c2f38';
        ctx.fill();
      }
    // the cab
    ctx.beginPath();
    rrect(ctx, -34, -15, 24, 30, 6);
    ctx.fillStyle = lin(ctx, -34, -15, -10, 15, [0, '#9a2e28', 1, '#6e1e1a']);
    ctx.fill();
    ctx.strokeStyle = 'rgba(40,10,8,0.6)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.beginPath();
    rrect(ctx, -31, -12, 18, 24, 4);
    ctx.fillStyle = '#f3e8cc';
    ctx.fill();
    // the boiler
    ctx.beginPath();
    rrect(ctx, -10, -13.5, 42, 27, 13.5);
    ctx.fillStyle = lin(ctx, 0, -14, 0, 14, [0, '#ff7a6a', 0.45, '#d9453a', 1, '#8e2a22']);
    ctx.fill();
    ctx.strokeStyle = 'rgba(60,12,8,0.6)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.strokeStyle = '#e6c25a';
    ctx.lineWidth = 2.2;
    for (const bx of [4, 16]) {
      ctx.beginPath();
      ctx.moveTo(bx, -12.6);
      ctx.lineTo(bx, 12.6);
      ctx.stroke();
    }
    // the chimney and the dome
    ctx.beginPath();
    ctx.arc(22, 0, 5.6, 0, TAU);
    ctx.fillStyle = '#2c2f38';
    ctx.fill();
    ctx.strokeStyle = '#8a92a4';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(4, 0, 4, 0, TAU);
    ctx.fillStyle = lin(ctx, 0, -4, 8, 4, [0, '#fff0a8', 1, '#c9922e']);
    ctx.fill();
    // the face on the front: eyes, a smile (a flat mouth when the cable holds it back, shut eyes when it is happy)
    const fxp = 29;
    for (const sy of [-1, 1]) {
      if (o.happy) {
        ctx.beginPath();
        ctx.arc(fxp, sy * 5.4, 2.6, 1.15 * Math.PI, 1.85 * Math.PI);
        ctx.strokeStyle = '#2a1a10';
        ctx.lineWidth = 1.4;
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.ellipse(fxp - 0.5, sy * 5.4, 2.6, o.strain ? 1.3 : 3, 0, 0, TAU);
        ctx.fillStyle = '#fbfbf0';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(fxp + 0.6, sy * 5.4, 1.2, 0, TAU);
        ctx.fillStyle = '#20180c';
        ctx.fill();
      }
    }
    ctx.strokeStyle = '#2a1a10';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    if (o.strain) {
      ctx.moveTo(fxp + 1, -3);
      ctx.lineTo(fxp + 1, 3);
    } else ctx.arc(fxp - 4, 0, 4.2, -0.9, 0.9);
    ctx.stroke();
    // the headlamp
    ctx.beginPath();
    ctx.arc(33.5, 0, 2.4, 0, TAU);
    ctx.fillStyle = o.v > 0.05 ? '#fff6b0' : '#d9d4a0';
    ctx.fill();
    ctx.restore();
  };
  // a station house seen from above: two roof planes, a ridge, a chimney, a bit of platform
  Art.DECOR2.station = {
    draw(ctx, d, rt, t) {
      const w = d.w || 70,
        h = d.h || 46;
      ctx.beginPath();
      rrect(ctx, -w / 2 - 6, h / 2 - 8, w + 12, 14, 4);
      ctx.fillStyle = '#d9cdb0';
      ctx.fill();
      ctx.strokeStyle = 'rgba(90,70,40,0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      rrect(ctx, -w / 2, -h / 2, w, h / 2 + 2, 4);
      ctx.fillStyle = lin(ctx, 0, -h / 2, 0, 0, [0, '#c8584a', 1, '#a9443a']);
      ctx.fill();
      ctx.beginPath();
      rrect(ctx, -w / 2, -2, w, h / 2 + 2, 4);
      ctx.fillStyle = lin(ctx, 0, 0, 0, h / 2, [0, '#8e3a30', 1, '#74302a']);
      ctx.fill();
      ctx.strokeStyle = 'rgba(50,16,12,0.5)';
      ctx.lineWidth = 1;
      for (let x = -w / 2 + 6; x < w / 2; x += 8) {
        ctx.beginPath();
        ctx.moveTo(x, -h / 2 + 3);
        ctx.lineTo(x, -4);
        ctx.moveTo(x, 3);
        ctx.lineTo(x, h / 2 - 3);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.rect(-w / 2, -3, w, 3);
      ctx.fillStyle = '#e8d8b8';
      ctx.fill();
      ctx.beginPath();
      rrect(ctx, w / 4, -h / 2 + 4, 9, 9, 2);
      ctx.fillStyle = '#6a4a3a';
      ctx.fill();
      // the station's name board
      ctx.beginPath();
      rrect(ctx, -14, h / 2 - 4, 28, 8, 2);
      ctx.fillStyle = '#fbf3e0';
      ctx.fill();
      ctx.fillStyle = '#6a4a3a';
      ctx.fillRect(-9, h / 2 - 1, 18, 2);
    },
    shadow: (ctx, d) => Art.shadow(ctx, d.x, d.y + 3, (d.w || 70) + 10, (d.h || 46) + 8, 8, 0, 0.2, 0.5),
  };

  /* ---------------------------------------------------------------- the tin drummer (Level 24): a wind-up toy with the strip on its back */
  // The strip is wider than the toy, so the toy is drawn AROUND it: a red tin drum under the strip (its rim and cords show above and
  // below), the drummer's head and sticks peeking over whichever edge of the strip he faces, tin boots at the other edge, and the
  // brass key on a stalk out of the side. c: { x, y, hw, hh (the strip's half extents), heading, walk (0..1), bob, clicks (0..8 wound),
  // key (key angle), side, strain, happy, aiming, hold, bump (0..1), snap (0..1) }
  const tinRed = (ctx, y0, y1) => lin(ctx, 0, y0, 0, y1, [0, '#ff8c78', 0.5, '#d9453a', 1, '#8e2a22']);
  Art.tinToy = function (ctx, c, t) {
    const walk = c.walk || 0,
      hd = c.heading || 0,
      HW = c.hw || 74,
      HH = c.hh || 28,
      bump = c.bump || 0;
    // how far from the strip's centre to its edge, in a direction (the strip is a rectangle)
    const edge = (a) => {
      const ca = Math.abs(Math.cos(a)),
        sa = Math.abs(Math.sin(a));
      return Math.min(ca > 1e-4 ? HW / ca : 1e9, sa > 1e-4 ? HH / sa : 1e9);
    };
    const sw = Math.sin((c.bob || 0) * 9) * walk;
    ctx.save();
    ctx.translate(c.x, c.y);
    Art.shadow(ctx, 3, 8, 126, 84, 26, 0, 0.2, 0.5);
    // ---- the drum under the strip
    const R = 44;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, TAU);
    ctx.fillStyle = tinRed(ctx, -R, R);
    ctx.fill();
    ctx.strokeStyle = 'rgba(60,12,8,0.7)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    // the tension cords: white zigzag triangles round the rim
    ctx.fillStyle = '#f6efe0';
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * TAU,
        a2 = ((i + 0.5) / 24) * TAU;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 40.5, Math.sin(a) * 40.5);
      ctx.lineTo(Math.cos(a2) * 34.5, Math.sin(a2) * 34.5);
      ctx.lineTo(Math.cos(a + (TAU / 24)) * 40.5, Math.sin(a + TAU / 24) * 40.5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 33, 0, TAU);
    ctx.fillStyle = '#f2e6c8';
    ctx.fill();
    ctx.strokeStyle = '#c9a24a';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, R - 0.8, 0, TAU);
    ctx.strokeStyle = '#d9b84e';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    // ---- the boots, at the edge he is walking away from
    const ra = hd + Math.PI,
      re = edge(ra);
    for (const sy of [-1, 1]) {
      const lat = sy * 13,
        lon = re - 1 - sy * sw * 5 + bump * 3;
      const bx = Math.cos(ra) * lon - Math.sin(ra) * lat,
        by = Math.sin(ra) * lon + Math.cos(ra) * lat;
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(hd);
      ctx.beginPath();
      ctx.ellipse(0, 0, 11, 7.5, 0, 0, TAU);
      ctx.fillStyle = '#34363f';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(2.5, 0, 6, 4.4, 0, 0, TAU);
      ctx.fillStyle = '#9aa2b6';
      ctx.fill();
      ctx.restore();
    }
    // ---- the head and the drumsticks, over the edge he faces (tucked a little under the strip)
    const fe = edge(hd),
      back = bump * 7,
      hx = Math.cos(hd) * (fe + 5 - back),
      hy = Math.sin(hd) * (fe + 5 - back);
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(hd);
    const nod = Math.sin((c.bob || 0) * 9 + 1) * walk * 0.9 + bump * 2;
    // sticks: held by red tin mittens beside the head, pointing in at each other, beating in time
    for (const sy of [-1, 1]) {
      const swing = (walk > 0.05 ? sy * sw * 0.6 : sy * 0.08) + (c.hold ? sy * 0.2 : 0);
      ctx.save();
      ctx.translate(-1, sy * 20);
      ctx.rotate(-sy * 0.5 + swing);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(21, 0);
      ctx.strokeStyle = '#f3e8cc';
      ctx.lineWidth = 3.8;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(22, 0, 4.6, 0, TAU);
      ctx.fillStyle = '#f7eed6';
      ctx.fill();
      ctx.strokeStyle = 'rgba(70,50,20,0.5)';
      ctx.lineWidth = 0.9;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 6.2, 0, TAU);
      ctx.fillStyle = tinRed(ctx, -6, 6);
      ctx.fill();
      ctx.strokeStyle = 'rgba(60,12,8,0.65)';
      ctx.lineWidth = 1.1;
      ctx.stroke();
      ctx.restore();
    }
    // the head: a tin face under a red cap with a white pompom
    ctx.translate(nod, 0);
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, TAU);
    ctx.fillStyle = lin(ctx, -12, -14, 14, 14, [0, '#ffe2c4', 1, '#e8b890']);
    ctx.fill();
    ctx.strokeStyle = 'rgba(90,50,30,0.55)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 16, Math.PI * 0.52, Math.PI * 1.48);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fillStyle = '#b13226';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-8, 0, 5, 0, TAU);
    ctx.fillStyle = '#fbfbf2';
    ctx.fill();
    ctx.strokeStyle = 'rgba(60,40,30,0.4)';
    ctx.lineWidth = 0.9;
    ctx.stroke();
    for (const sy of [-1, 1]) {
      if (c.happy > 0.5) {
        ctx.beginPath();
        ctx.arc(6, sy * 5.8, 2.7, 1.15 * Math.PI, 1.85 * Math.PI);
        ctx.strokeStyle = '#2a1a10';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.ellipse(6, sy * 5.8, 2.1, c.strain > 0.4 || bump > 0.3 ? 1.2 : 2.9, 0, 0, TAU);
        ctx.fillStyle = '#20180c';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(6.7, sy * 5.8 - 0.8, 0.8, 0, TAU);
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(7, sy * 10.4, 2.5, 0, TAU);
      ctx.fillStyle = 'rgba(255,120,120,0.45)';
      ctx.fill();
    }
    ctx.strokeStyle = '#7a2a2a';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (c.strain > 0.4 || bump > 0.3) {
      ctx.moveTo(2.4, -3.2);
      ctx.lineTo(2.4, 3.2);
    } else if (c.happy > 0.5) {
      ctx.moveTo(5.4, -4.6);
      ctx.quadraticCurveTo(-1.8, 0, 5.4, 4.6);
    } else if (c.hold) ctx.arc(2.4, 0, 2.3, 0, TAU);
    else {
      ctx.moveTo(4.4, -3.2);
      ctx.quadraticCurveTo(0.6, 0, 4.4, 3.2);
    }
    ctx.stroke();
    ctx.restore();
    // ---- the key, on a stalk out of the drum's side (left of the heading when side is 1), and the ring of notches that fill as it is wound
    const side = c.side || 1,
      ang = hd - (Math.PI / 2) * side,
      kx = Math.cos(ang) * 90,
      ky = Math.sin(ang) * 90;
    ctx.beginPath();
    ctx.moveTo(Math.cos(ang) * 36, Math.sin(ang) * 36);
    ctx.lineTo(kx, ky);
    ctx.strokeStyle = '#8a6a22';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.save();
    ctx.translate(kx, ky);
    ctx.rotate(c.key || 0);
    for (const sy of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(sy * 12, 0, 13, 6, 0, 0, TAU);
      ctx.fillStyle = lin(ctx, sy * 12 - 12, -6, sy * 12 + 12, 6, [0, '#fff0a8', 0.5, '#e6c25a', 1, '#a9801f']);
      ctx.fill();
      ctx.strokeStyle = 'rgba(80,50,6,0.7)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 4.6, 0, TAU);
    ctx.fillStyle = '#c9a24a';
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.translate(kx, ky);
    for (let i = 0; i < 8; i++) {
      const a = -Math.PI / 2 + (i / 8) * TAU;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 25, Math.sin(a) * 25, 2.8, 0, TAU);
      ctx.fillStyle = i < (c.clicks || 0) ? '#ffd24a' : 'rgba(40,30,10,0.35)';
      ctx.fill();
      if (i < (c.clicks || 0)) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = rad(ctx, Math.cos(a) * 25, Math.sin(a) * 25, 1, 9, [0, 'rgba(255,210,74,0.7)', 1, 'rgba(255,210,74,0)']);
        ctx.fillRect(Math.cos(a) * 25 - 9, Math.sin(a) * 25 - 9, 18, 18);
        ctx.globalCompositeOperation = 'source-over';
      }
    }
    ctx.restore();
    ctx.restore();
  };

  // the aim dial: sixteen notches round the toy while it is being aimed; the one it will walk along is lit (and flashes as it clicks over)
  Art.windDial = function (ctx, x, y, aim, alpha, snap, t) {
    const R = 104;
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = Math.min(1, alpha);
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, TAU);
    ctx.strokeStyle = 'rgba(255,248,226,0.22)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([2, 7]);
    ctx.stroke();
    ctx.setLineDash([]);
    const n = 16;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI + (i / n) * TAU;
      const on = Math.abs(((a - aim + 3 * Math.PI) % TAU) - Math.PI) < 1e-3;
      const major = i % 4 === 0;
      const r0 = R - (on ? 7 : major ? 5 : 3),
        r1 = R + (on ? 9 + 3 * (snap || 0) : major ? 6 : 3);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
      ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx.strokeStyle = on ? '#ffd24a' : 'rgba(255,248,226,0.5)';
      ctx.lineWidth = on ? 3.4 : major ? 2.2 : 1.4;
      ctx.lineCap = 'round';
      ctx.stroke();
      if (on) {
        ctx.save();
        ctx.translate(Math.cos(a) * (R + 16), Math.sin(a) * (R + 16));
        ctx.rotate(a);
        ctx.beginPath();
        ctx.moveTo(5, 0);
        ctx.lineTo(-3, -5);
        ctx.lineTo(-3, 5);
        ctx.closePath();
        ctx.fillStyle = '#ffd24a';
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();
  };

  // tin soldiers marching round the rug: pure decoration (they do not care about you)
  Art.DECOR2.tinsoldier = {
    draw(ctx, d, rt, t) {
      const L = d.loop || { x: 0, y: 0, w: 120, h: 80 };
      const per = 2 * (L.w + L.h);
      const n = d.count || 3;
      for (let k = 0; k < n; k++) {
        let u = (((t * (d.speed || 16) + (d.phase || 0) - k * 30) % per) + per) % per;
        let x, y, hd;
        if (u < L.w) (x = -L.w / 2 + u), (y = -L.h / 2), (hd = 0);
        else if (u < L.w + L.h) (x = L.w / 2), (y = -L.h / 2 + (u - L.w)), (hd = Math.PI / 2);
        else if (u < 2 * L.w + L.h) (x = L.w / 2 - (u - L.w - L.h)), (y = L.h / 2), (hd = Math.PI);
        else (x = -L.w / 2), (y = L.h / 2 - (u - 2 * L.w - L.h)), (hd = -Math.PI / 2);
        x += L.x - d.x;
        y += L.y - d.y;
        const step = Math.sin(t * 7 + k * 1.7);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(hd);
        Art.shadow(ctx, 1.5, 3, 30, 26, 9, 0, 0.18, 0.5);
        // boots
        for (const sy of [-1, 1]) {
          ctx.beginPath();
          ctx.ellipse(6 + sy * step * 3.2, sy * 4, 4.4, 2.8, 0, 0, TAU);
          ctx.fillStyle = '#23252e';
          ctx.fill();
        }
        // shoulders: a red tunic across the heading, a white cross-belt, brass buttons
        ctx.beginPath();
        rrect(ctx, -5.5, -11, 11, 22, 5);
        ctx.fillStyle = lin(ctx, -6, -11, 6, 11, [0, '#ee6455', 1, '#9a2c24']);
        ctx.fill();
        ctx.strokeStyle = 'rgba(40,10,8,0.65)';
        ctx.lineWidth = 0.9;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-4, -9);
        ctx.lineTo(4, 9);
        ctx.moveTo(4, -9);
        ctx.lineTo(-4, 9);
        ctx.strokeStyle = 'rgba(250,244,228,0.9)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // the musket over the right shoulder
        ctx.beginPath();
        ctx.moveTo(-9, 9);
        ctx.lineTo(13, 6);
        ctx.strokeStyle = '#6a4a2a';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(13.5, 6, 1, 0, TAU);
        ctx.fillStyle = '#c9ccd6';
        ctx.fill();
        // the shako seen from above: a black disc with a chin strap at the front and a white plume streaming back
        ctx.beginPath();
        ctx.arc(1.5, 0, 5.2, 0, TAU);
        ctx.fillStyle = '#272a34';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(1.5, 0, 5.2, -0.9, 0.9);
        ctx.strokeStyle = '#d9b84e';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(1, 0);
        ctx.lineTo(-6, 0);
        ctx.strokeStyle = '#f8f4e8';
        ctx.lineWidth = 2.6;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();
      }
    },
    shadow: () => {},
  };
  // a wall of toy blocks (the thing a wind-up toy bumps into): w x h, with letters (d.text, else the alphabet), a wobble when it is hit
  Art.DECOR2.blockwall = {
    draw(ctx, d, rt, t) {
      const w = d.w || 120,
        h = d.h || 44;
      const cols = ['#e4685a', '#f2c14e', '#5aa9e6', '#6cc184', '#b27ce6'];
      const bs = h;
      const n = Math.max(1, Math.round(w / bs));
      const bw = w / n;
      const since = rt && rt.shakeAt !== undefined ? t - rt.shakeAt : 9;
      const k = Math.max(0, 1 - since / 0.55);
      ctx.save();
      if (k > 0) ctx.translate(Math.sin(since * 46) * 2.2 * k, 0);
      for (let i = 0; i < n; i++) {
        const x = -w / 2 + i * bw;
        const col = cols[(i + (d.seed || 0)) % 5];
        ctx.beginPath();
        rrect(ctx, x + 1.2, -h / 2 + 1.2, bw - 2.4, h - 2.4, 5);
        ctx.fillStyle = lin(ctx, x, -h / 2, x + bw, h / 2, [0, U.shade(col, 0.2), 1, col]);
        ctx.fill();
        ctx.strokeStyle = 'rgba(60,40,20,0.45)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        // a bevelled top face
        ctx.beginPath();
        rrect(ctx, x + 4.5, -h / 2 + 4.5, bw - 9, h - 9, 3);
        ctx.strokeStyle = 'rgba(255,255,255,0.28)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.font = '800 ' + Math.round(h * 0.52) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const ch = d.text ? d.text[i % d.text.length] : 'SNUGABCDEFG'[((i + (d.seed || 0) * 3) % 11 + 11) % 11];
        ctx.fillText(ch, x + bw / 2, 1);
      }
      ctx.restore();
    },
    shadow: (ctx, d) => Art.shadow(ctx, d.x, d.y + 3, (d.w || 120) + 8, (d.h || 44) + 6, 6, 0, 0.22, 0.5),
  };

  /* ---------------------------------------------------------------- the alphabet blocks (Level 25 "Block Party") */
  // rt: the block's runtime { x, y, b: { ww, hh, letter, heavy, def }, lift 0..1, sq, sqx, sqy, tilt, flash, shakeAt, lookx, looky, blink, mood, gold }
  const BLOCKCOL = ['#e4685a', '#f2c14e', '#5aa9e6', '#6cc184', '#b27ce6', '#f4e6c4'];
  const blockColour = (b) => BLOCKCOL[b.def.color !== undefined ? b.def.color : b.index % 5];
  // the low golden sun: a soft contact shadow and a long fading one thrown to the lower right
  Art.blockShadow = function (ctx, rt) {
    const b = rt.b,
      w = b.ww,
      h = b.hh,
      lift = rt.lift || 0;
    Art.shadow(ctx, rt.x, rt.y, w + 2, h + 2, 7, 0, 0.3 + 0.7 * lift, 0.55);
    const len = 30 + 18 * lift + (b.heavy ? 14 : 0),
      dx = len * 0.62,
      dy = len * 0.78;
    const x0 = rt.x - w / 2,
      x1 = rt.x + w / 2,
      y0 = rt.y - h / 2 + 8,
      y1 = rt.y + h / 2;
    ctx.save();
    const g = ctx.createLinearGradient(rt.x, rt.y, rt.x + dx, rt.y + dy);
    g.addColorStop(0, 'rgba(70,40,12,0.2)');
    g.addColorStop(1, 'rgba(70,40,12,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x0 + 3, y1 - 2);
    ctx.lineTo(x0 + dx, y1 + dy);
    ctx.lineTo(x1 + dx, y1 + dy);
    ctx.lineTo(x1 + dx, y0 + dy);
    ctx.lineTo(x1 - 2, y0 + 2);
    ctx.lineTo(x1 - 2, y1 - 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };
  Art.block = function (ctx, rt, t, now) {
    const b = rt.b,
      w = b.ww,
      h = b.hh,
      lift = rt.lift || 0;
    const col = blockColour(b);
    const since = now - (rt.shakeAt === undefined ? -9 : rt.shakeAt);
    const shake = since < 0.55 ? Math.sin(since * 46) * 2.2 * (1 - since / 0.55) : 0;
    ctx.save();
    ctx.translate(rt.x + shake, rt.y - lift * 5);
    ctx.rotate(rt.tilt || 0);
    const sc = 1 + 0.05 * lift;
    // a squash against whatever it hit: shorter along the impact, a touch wider across
    const sq = rt.sq || 0;
    ctx.scale(sc * (1 - 0.11 * sq * (rt.sqx || 0) + 0.06 * sq * (rt.sqy || 0)), sc * (1 - 0.11 * sq * (rt.sqy || 0) + 0.06 * sq * (rt.sqx || 0)));
    const dep = 5 + 3 * lift; // the side of the block that shows below the top face
    // the side face
    ctx.beginPath();
    rrect(ctx, -w / 2, -h / 2 + dep, w, h, 7);
    ctx.fillStyle = U.shade(col, -0.38);
    ctx.fill();
    ctx.strokeStyle = 'rgba(40,22,6,0.55)';
    ctx.lineWidth = 1.3;
    ctx.stroke();
    // the top face
    ctx.beginPath();
    rrect(ctx, -w / 2, -h / 2, w, h, 7);
    ctx.fillStyle = lin(ctx, -w / 2, -h / 2, w / 2, h / 2, [0, U.shade(col, 0.28), 0.55, col, 1, U.shade(col, -0.1)]);
    ctx.fill();
    ctx.strokeStyle = U.shade(col, -0.5);
    ctx.lineWidth = 1.3;
    ctx.stroke();
    // the bevel and a little wood grain
    ctx.beginPath();
    rrect(ctx, -w / 2 + 3.2, -h / 2 + 3.2, w - 6.4, h - 6.4, 4.5);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(70,40,10,0.09)';
    ctx.lineWidth = 0.9;
    for (let k = -2; k <= 2; k++) {
      ctx.beginPath();
      ctx.moveTo(-w / 2 + 5, k * (h / 6) + 2);
      ctx.quadraticCurveTo(0, k * (h / 6) - 2 + (k % 2) * 3, w / 2 - 5, k * (h / 6) + 1);
      ctx.stroke();
    }
    if (b.def.face || b.heavy) {
      // Blocky: big eyes that follow the drag, a mouth that goes round when it bumps something
      const bl = rt.blink > 0;
      const lx = (rt.lookx || 0) * 3.6,
        ly = (rt.looky || 0) * 3;
      const ex = w * 0.2,
        ey = -h * 0.08;
      for (const sx of [-1, 1]) {
        if (bl) {
          ctx.beginPath();
          ctx.moveTo(sx * ex - 8, ey);
          ctx.lineTo(sx * ex + 8, ey);
          ctx.strokeStyle = '#3a2410';
          ctx.lineWidth = 2.4;
          ctx.lineCap = 'round';
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.ellipse(sx * ex, ey, 9.5, 11 + (rt.mood > 0.5 ? 2 : 0), 0, 0, TAU);
          ctx.fillStyle = '#fffaf0';
          ctx.fill();
          ctx.strokeStyle = 'rgba(60,36,12,0.55)';
          ctx.lineWidth = 1.3;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(sx * ex + lx, ey + ly, 4.6, 0, TAU);
          ctx.fillStyle = '#2a1a0a';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(sx * ex + lx + 1.4, ey + ly - 1.6, 1.4, 0, TAU);
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.fill();
        }
        // brows
        ctx.beginPath();
        ctx.moveTo(sx * ex - 8, ey - 16 + (rt.mood > 0.5 ? -2 : 0));
        ctx.quadraticCurveTo(sx * ex, ey - 21 - (rt.mood > 0.5 ? 2 : 0), sx * ex + 8, ey - 16 + (rt.mood > 0.5 ? -2 : 0));
        ctx.strokeStyle = 'rgba(80,50,20,0.7)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.strokeStyle = '#7a3a22';
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const my = h * 0.24;
      if (rt.mood > 0.5) ctx.ellipse(0, my + 2, 5, 6, 0, 0, TAU);
      else if (lift > 0.5) ctx.ellipse(0, my + 1, 4, 3.6, 0, 0, TAU);
      else {
        ctx.moveTo(-9, my - 1);
        ctx.quadraticCurveTo(0, my + 8, 9, my - 1);
      }
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = '800 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.letter, w / 2 - 14, h / 2 - 13);
    } else {
      // the letter, painted on
      ctx.font = '800 ' + Math.round(h * 0.58) + 'px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const gold = rt.gold || 0;
      ctx.lineJoin = 'round';
      ctx.lineWidth = 3;
      ctx.strokeStyle = gold > 0.02 ? 'rgba(120,70,0,0.8)' : U.shade(col, -0.45);
      ctx.strokeText(b.letter, 0, 1.5);
      ctx.fillStyle = gold > 0.02 ? U.mix('#fff6e8', '#ffd24a', Math.min(1, gold * 1.5)) : 'rgba(255,252,242,0.95)';
      ctx.fillText(b.letter, 0, 1.5);
    }
    // the flash of a knock
    if (rt.flash > 0.01) {
      ctx.beginPath();
      rrect(ctx, -w / 2, -h / 2, w, h, 7);
      ctx.fillStyle = 'rgba(255,255,240,' + (0.32 * rt.flash).toFixed(3) + ')';
      ctx.fill();
    }
    if (rt.gold > 0.02) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.beginPath();
      rrect(ctx, -w / 2, -h / 2, w, h, 7);
      ctx.fillStyle = 'rgba(255,210,74,' + (0.22 * Math.min(1, rt.gold * 2)).toFixed(3) + ')';
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  };

  // a golden alphabet block: the secret of Level 25 (spell SNUG)
  Art.SECRETS2.goldblock = function (ctx) {
    ctx.rotate(-0.2);
    ctx.beginPath();
    rrect(ctx, -9, -8, 18, 18, 3.5);
    ctx.fillStyle = U.shade('#9a6a14', -0.2);
    ctx.fill();
    ctx.beginPath();
    rrect(ctx, -9, -10, 18, 18, 3.5);
    ctx.fillStyle = lin(ctx, -9, -10, 9, 8, [0, '#fff0a8', 1, '#c9922e']);
    ctx.fill();
    ctx.strokeStyle = 'rgba(110,70,0,0.7)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#7a4a00';
    ctx.font = '800 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', 0, -0.5);
  };

  // the toy box: a low wooden crate on the felt, its floor the pale boards the blocks slide on (a faint grid: they rest on whole cells),
  // a painted name on the front. d: { x, y, w, h (the floor), text }
  Art.DECOR2.toybox = {
    draw(ctx, d, rt, t) {
      const w = d.w || 308,
        h = d.h || 132,
        x0 = -w / 2,
        y0 = -h / 2,
        R = 8;
      // the floor
      ctx.beginPath();
      rrect(ctx, x0, y0, w, h, 3);
      ctx.fillStyle = lin(ctx, 0, y0, 0, y0 + h, [0, '#d9b57e', 1, '#ecd0a0']);
      ctx.fill();
      ctx.save();
      ctx.clip();
      // boards, one row of cells each, with a little grain
      for (let k = 0; k < 3; k++) {
        const by = y0 + k * (h / 3);
        ctx.fillStyle = k % 2 ? 'rgba(255,255,255,0.06)' : 'rgba(80,45,10,0.05)';
        ctx.fillRect(x0, by, w, h / 3);
        ctx.strokeStyle = 'rgba(90,55,18,0.28)';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(x0, by);
        ctx.lineTo(x0 + w, by);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(90,55,18,0.1)';
        ctx.lineWidth = 0.9;
        for (let g = 0; g < 4; g++) {
          const gy = by + 8 + g * 9;
          ctx.beginPath();
          ctx.moveTo(x0 + ((g * 61 + k * 37) % 90), gy);
          ctx.quadraticCurveTo(x0 + w * 0.5, gy + (g % 2 ? 2.5 : -2.5), x0 + w - ((g * 47 + k * 29) % 90), gy + 1);
          ctx.stroke();
        }
      }
      // the cells the blocks rest on: a very faint grid
      ctx.strokeStyle = 'rgba(90,55,18,0.1)';
      ctx.setLineDash([3, 5]);
      for (let c = 1; c < 7; c++) {
        ctx.beginPath();
        ctx.moveTo(x0 + c * 44 + 0, y0);
        ctx.lineTo(x0 + c * 44 + 0, y0 + h);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      // the north rim leans a shadow over the floor
      ctx.fillStyle = lin(ctx, 0, y0, 0, y0 + 16, [0, 'rgba(60,32,8,0.38)', 1, 'rgba(60,32,8,0)']);
      ctx.fillRect(x0, y0, w, 16);
      ctx.fillStyle = lin(ctx, x0, 0, x0 + 14, 0, [0, 'rgba(60,32,8,0.26)', 1, 'rgba(60,32,8,0)']);
      ctx.fillRect(x0, y0, 14, h);
      ctx.restore();
      // the rim: north, west, east (their tops), and the south with its painted front
      const wood = (x, y, ww, hh, dark) => {
        ctx.beginPath();
        rrect(ctx, x, y, ww, hh, 3);
        ctx.fillStyle = lin(ctx, x, y, x, y + hh, dark ? [0, '#9a6532', 1, '#7a4a20'] : [0, '#d09a5c', 0.5, '#b87f45', 1, '#a06a36']);
        ctx.fill();
        ctx.strokeStyle = 'rgba(50,26,6,0.6)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      };
      wood(x0 - R, y0 - R, w + 2 * R, R + 1);
      wood(x0 - R, y0 - R, R + 1, h + 2 * R);
      wood(x0 + w - 1, y0 - R, R + 1, h + 2 * R);
      wood(x0 - R, y0 + h - 1, w + 2 * R, R + 1);
      // the front face of the south board, with the box's name
      wood(x0 - R, y0 + h + R - 2, w + 2 * R, 18, true);
      if (d.text) {
        ctx.font = '800 13px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(255,238,200,0.92)';
        ctx.fillText(d.text.split('').join(' '), 0, y0 + h + R + 7);
      }
      // brass corner brackets and nails
      ctx.fillStyle = lin(ctx, 0, 0, 12, 12, [0, '#f2d88a', 1, '#a9801f']);
      for (const [cx, cy, sx, sy] of [[x0 - R, y0 - R, 1, 1], [x0 + w + R, y0 - R, -1, 1], [x0 - R, y0 + h + R, 1, -1], [x0 + w + R, y0 + h + R, -1, -1]]) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + sx * 13, cy);
        ctx.lineTo(cx, cy + sy * 13);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(80,50,6,0.6)';
        ctx.lineWidth = 0.9;
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(70,40,12,0.55)';
      for (let i = 0; i < 7; i++) {
        ctx.beginPath();
        ctx.arc(x0 + 22 + i * 44, y0 - R + 4.5, 1.2, 0, TAU);
        ctx.fill();
      }
    },
    shadow: (ctx, d) => Art.shadow(ctx, d.x, d.y + 8, (d.w || 308) + 24, (d.h || 132) + 36, 8, 0, 0.45, 0.5),
  };
})();
