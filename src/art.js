/* Snug — art.js : procedural drawing. Warm tactile miniature seen from above; light from the upper left.
   Everything draws in STAGE units (360x640 u); the caller has already applied the stage transform.
   Part 1: helpers, surfaces, shadows, strips/sockets, plugs, cables, light map, hint hand. (Devices & decor: art-devices.js) */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const U = G.U,
    T = G.T,
    Rules = G.Rules;
  const Art = (G.Art = {});
  const TAU = U.TAU;

  const FONT = 'ui-rounded, "SF Pro Rounded", "Nunito", "Trebuchet MS", system-ui, -apple-system, sans-serif';
  Art.FONT = FONT;

  Art.KEYCOL = {
    coral: '#FF6F61',
    amber: '#FFBE3D',
    mint: '#3FD6A6',
    sky: '#4AA3FF',
    violet: '#9B7BFF',
    rose: '#FF8FB3',
    lime: '#B6E35A',
    teal: '#2EC4B6',
    any: '#E9E4D8',
  };
  Art.CREAM = '#EFE8D8';
  Art.GRAPHITE = '#3b4150';

  /* ---------------------------------------------------------------- tiny path helpers */
  function rrect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  Art.rrect = rrect;
  function fillRR(ctx, x, y, w, h, r, fill) {
    ctx.beginPath();
    rrect(ctx, x, y, w, h, r);
    ctx.fillStyle = fill;
    ctx.fill();
  }
  Art.fillRR = fillRR;
  function lin(ctx, x0, y0, x1, y1, stops) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    for (let i = 0; i < stops.length; i += 2) g.addColorStop(stops[i], stops[i + 1]);
    return g;
  }
  Art.lin = lin;
  function rad(ctx, x, y, r0, r1, stops) {
    const g = ctx.createRadialGradient(x, y, r0, x, y, r1);
    for (let i = 0; i < stops.length; i += 2) g.addColorStop(stops[i], stops[i + 1]);
    return g;
  }
  Art.rad = rad;

  // key glyphs (second channel for color-blind players)
  Art.glyph = function (ctx, key, x, y, s, fill, stroke) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    switch (key) {
      case 'coral':
        ctx.arc(0, 0, s * 0.95, 0, TAU);
        break;
      case 'amber':
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.95, s * 0.7);
        ctx.lineTo(-s * 0.95, s * 0.7);
        ctx.closePath();
        break;
      case 'mint':
        rrect(ctx, -s * 0.8, -s * 0.8, s * 1.6, s * 1.6, s * 0.2);
        break;
      case 'sky':
        ctx.moveTo(0, -s * 1.1);
        ctx.lineTo(s * 0.9, 0);
        ctx.lineTo(0, s * 1.1);
        ctx.lineTo(-s * 0.9, 0);
        ctx.closePath();
        break;
      case 'violet':
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * TAU + Math.PI / 6;
          ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * s, Math.sin(a) * s);
        }
        ctx.closePath();
        break;
      default:
        ctx.arc(0, 0, s * 0.5, 0, TAU);
    }
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  };

  // pattern fills for the color-blind "patterns" mode (kept subtle)
  Art.patternMode = false;

  /* ---------------------------------------------------------------- soft cached shadows */
  const shadowCache = {};
  Art.shadowSprite = function (w, h, r, blur) {
    const key = [Math.round(w), Math.round(h), Math.round(r), Math.round(blur * 2)].join(',');
    let s = shadowCache[key];
    if (s) return s;
    const K = 2;
    const pad = blur * 2.2;
    const cv = document.createElement('canvas');
    cv.width = Math.ceil((w + pad * 2) * K);
    cv.height = Math.ceil((h + pad * 2) * K);
    const c = cv.getContext('2d');
    c.scale(K, K);
    const layers = 9;
    for (let i = layers; i >= 0; i--) {
      const t = i / layers; // 1 = widest
      const infl = t * blur * 1.6 - blur * 0.15;
      c.globalAlpha = 0.07 + (1 - t) * 0.05;
      c.fillStyle = '#000';
      c.beginPath();
      rrect(c, pad - infl, pad - infl, w + infl * 2, h + infl * 2, Math.max(1, r + infl));
      c.fill();
    }
    s = { cv, w: cv.width / K, h: cv.height / K, pad };
    shadowCache[key] = s;
    return s;
  };
  // draw a soft shadow for a rounded rect centered at (cx,cy)
  Art.shadow = function (ctx, cx, cy, w, h, r, rot, lift, alpha) {
    const blur = 3 + lift * 7;
    const sp = Art.shadowSprite(w, h, r, blur);
    const ox = 2 + lift * 7,
      oy = 3.2 + lift * 11;
    ctx.save();
    ctx.translate(cx + ox, cy + oy);
    if (rot) ctx.rotate(rot);
    ctx.globalAlpha = alpha === undefined ? 0.5 : alpha;
    ctx.drawImage(sp.cv, -sp.w / 2, -sp.h / 2, sp.w, sp.h);
    ctx.restore();
  };

  /* ---------------------------------------------------------------- surfaces */
  // full-bleed wood; built once per size (pixel space)
  Art.buildSurface = function (Wp, Hp, k) {
    const cv = document.createElement('canvas');
    cv.width = Wp;
    cv.height = Hp;
    const c = cv.getContext('2d');
    const rnd = U.rng(20261114);
    const plankH = 118 * k;
    let y = -((rnd() * 0.6) * plankH);
    let pi = 0;
    while (y < Hp) {
      const h = plankH * (0.9 + rnd() * 0.25);
      const base = U.mix('#b8855b', '#9d6c45', rnd());
      c.fillStyle = lin(c, 0, y, 0, y + h, [0, U.shade(base, 0.07), 0.5, base, 1, U.shade(base, -0.08)]);
      c.fillRect(0, y, Wp, h + 1);
      // grain
      const lines = 20 + ((rnd() * 8) | 0);
      for (let i = 0; i < lines; i++) {
        const gy = y + rnd() * h;
        const amp = (1.5 + rnd() * 5) * k,
          fq = 0.002 + rnd() * 0.004,
          ph = rnd() * 6;
        c.beginPath();
        for (let x = -10; x <= Wp + 10; x += 22 * k) {
          const yy = gy + Math.sin(x * fq / k + ph) * amp + Math.sin(x * fq * 2.3 / k + ph * 2) * amp * 0.35;
          x === -10 ? c.moveTo(x, yy) : c.lineTo(x, yy);
        }
        c.strokeStyle = rnd() < 0.62 ? 'rgba(70,38,16,' + (0.04 + rnd() * 0.07) + ')' : 'rgba(255,232,190,' + (0.04 + rnd() * 0.06) + ')';
        c.lineWidth = (0.5 + rnd() * 1.3) * k;
        c.stroke();
      }
      // knots
      if (rnd() < 0.55) {
        const kx = rnd() * Wp,
          ky = y + h * (0.25 + rnd() * 0.5);
        for (let r = 1; r <= 5; r++) {
          c.beginPath();
          c.ellipse(kx, ky, (6 + r * 5) * k, (3 + r * 2.2) * k, 0, 0, TAU);
          c.strokeStyle = 'rgba(60,30,12,' + (0.12 - r * 0.018) + ')';
          c.lineWidth = 1.2 * k;
          c.stroke();
        }
      }
      // seam
      c.fillStyle = 'rgba(38,20,8,0.55)';
      c.fillRect(0, y + h - 0.8 * k, Wp, 1.6 * k);
      c.fillStyle = 'rgba(255,232,196,0.16)';
      c.fillRect(0, y + h + 0.8 * k, Wp, 1.1 * k);
      y += h;
      pi++;
    }
    // key light from the upper left, vignette
    c.fillStyle = lin(c, 0, 0, Wp, Hp, [0, 'rgba(255,238,205,0.16)', 0.55, 'rgba(255,238,205,0)', 1, 'rgba(0,0,0,0.22)']);
    c.fillRect(0, 0, Wp, Hp);
    c.fillStyle = rad(c, Wp / 2, Hp / 2, Math.min(Wp, Hp) * 0.35, Math.max(Wp, Hp) * 0.78, [0, 'rgba(0,0,0,0)', 1, 'rgba(0,0,0,0.42)']);
    c.fillRect(0, 0, Wp, Hp);
    return cv;
  };

  // the felt desk mat, one per level (stage-sized sprite)
  Art.MAT = { x: 18, y: 44, w: 324, h: 572, r: 30 };
  Art.buildMat = function (k, dawn, tint) {
    const M = Art.MAT;
    const pad = 26;
    const cv = document.createElement('canvas');
    cv.width = Math.ceil((M.w + pad * 2) * k);
    cv.height = Math.ceil((M.h + pad * 2) * k);
    const c = cv.getContext('2d');
    c.scale(k, k);
    c.translate(pad - M.x, pad - M.y);
    const rnd = U.rng(77 + Math.round(dawn * 10));
    const base = U.mix('#3a4258', tint || '#6d5d6b', 0.12 + dawn * 0.5);
    // soft contact shadow of the mat on the wood
    for (let i = 9; i >= 0; i--) {
      const t = i / 9;
      c.globalAlpha = 0.05 + (1 - t) * 0.04;
      c.fillStyle = '#1a0d04';
      c.beginPath();
      rrect(c, M.x - 3 - t * 10 + 3, M.y - 3 - t * 10 + 6, M.w + 6 + t * 20, M.h + 6 + t * 20, M.r + t * 10);
      c.fill();
    }
    c.globalAlpha = 1;
    // body
    c.beginPath();
    rrect(c, M.x, M.y, M.w, M.h, M.r);
    c.fillStyle = lin(c, M.x, M.y, M.x + M.w, M.y + M.h, [0, U.shade(base, 0.1), 0.5, base, 1, U.shade(base, -0.14)]);
    c.fill();
    c.save();
    c.clip();
    // felt speckle
    for (let i = 0; i < 2600; i++) {
      const x = M.x + rnd() * M.w,
        y = M.y + rnd() * M.h;
      c.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,' + (0.03 + rnd() * 0.06) + ')' : 'rgba(0,0,0,' + (0.04 + rnd() * 0.07) + ')';
      c.fillRect(x, y, 0.9, 0.9);
    }
    // long soft fibers
    for (let i = 0; i < 260; i++) {
      const x = M.x + rnd() * M.w,
        y = M.y + rnd() * M.h,
        a = rnd() * TAU,
        l = 2 + rnd() * 4;
      c.strokeStyle = 'rgba(255,255,255,' + (0.025 + rnd() * 0.035) + ')';
      c.lineWidth = 0.5;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
      c.stroke();
    }
    // top-left sheen
    c.fillStyle = rad(c, M.x + 60, M.y + 40, 10, 380, [0, 'rgba(255,240,215,0.14)', 1, 'rgba(255,240,215,0)']);
    c.fillRect(M.x, M.y, M.w, M.h);
    c.restore();
    // edge bevel + stitching
    c.beginPath();
    rrect(c, M.x + 0.5, M.y + 0.5, M.w - 1, M.h - 1, M.r);
    c.strokeStyle = lin(c, M.x, M.y, M.x, M.y + M.h, [0, 'rgba(255,255,255,0.22)', 0.5, 'rgba(255,255,255,0.05)', 1, 'rgba(0,0,0,0.25)']);
    c.lineWidth = 1.2;
    c.stroke();
    c.beginPath();
    rrect(c, M.x + 8, M.y + 8, M.w - 16, M.h - 16, M.r - 8);
    c.setLineDash([5, 4]);
    c.strokeStyle = 'rgba(255,238,215,0.2)';
    c.lineWidth = 1.2;
    c.stroke();
    c.setLineDash([]);
    return { cv, pad, k };
  };

  /* ---------------------------------------------------------------- strips and sockets */
  const sockW = 22,
    sockH = 30;
  Art.socketAt = function (st, i) {
    return (i - (st.n - 1) / 2) * st.pitch;
  };

  function drawSocket(ctx, lx, sock, rt, hasKeys, t) {
    const key = sock.key;
    const glow = (rt.glow && rt.glow[sock.id]) || 0;
    const cover = (rt.cover && rt.cover[sock.id]) || 0;
    const flash = (rt.flash && rt.flash[sock.id]) || 0;
    const fp = (rt.fpFlash && rt.fpFlash[sock.id]) || 0;
    const dead = rt.dead && rt.dead[sock.id];
    ctx.save();
    ctx.translate(lx, 0);
    // bezel ring
    const keyed = key !== 'any';
    const ringCol = keyed ? Art.KEYCOL[key] : null;
    if (keyed) {
      ctx.beginPath();
      rrect(ctx, -sockW / 2 - 3.2, -sockH / 2 - 3.2, sockW + 6.4, sockH + 6.4, 9);
      ctx.fillStyle = U.rgba(ringCol, 0.9);
      ctx.fill();
    } else if (hasKeys) {
      // the joker: a rainbow ring
      const n = 5,
        cols = ['coral', 'amber', 'mint', 'sky', 'violet'];
      ctx.beginPath();
      rrect(ctx, -sockW / 2 - 3.2, -sockH / 2 - 3.2, sockW + 6.4, sockH + 6.4, 9);
      const gr = lin(ctx, -14, -18, 14, 18, [0, Art.KEYCOL.coral, 0.25, Art.KEYCOL.amber, 0.5, Art.KEYCOL.mint, 0.75, Art.KEYCOL.sky, 1, Art.KEYCOL.violet]);
      ctx.fillStyle = gr;
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.globalAlpha = 1;
    } else {
      ctx.beginPath();
      rrect(ctx, -sockW / 2 - 2.4, -sockH / 2 - 2.4, sockW + 4.8, sockH + 4.8, 8);
      ctx.fillStyle = 'rgba(120,108,90,0.28)';
      ctx.fill();
    }
    // recess
    ctx.beginPath();
    rrect(ctx, -sockW / 2, -sockH / 2, sockW, sockH, 6);
    ctx.fillStyle = lin(ctx, 0, -sockH / 2, 0, sockH / 2, [0, '#16130f', 0.6, '#26211c', 1, '#352e27']);
    ctx.fill();
    // lower lip highlight
    ctx.beginPath();
    ctx.moveTo(-sockW / 2 + 5, sockH / 2 - 0.6);
    ctx.lineTo(sockW / 2 - 5, sockH / 2 - 0.6);
    ctx.strokeStyle = 'rgba(255,245,225,0.28)';
    ctx.lineWidth = 1;
    ctx.stroke();
    // contacts
    ctx.fillStyle = 'rgba(210,200,185,0.55)';
    ctx.fillRect(-5.5, -8, 3, 9);
    ctx.fillRect(2.5, -8, 3, 9);
    ctx.fillStyle = 'rgba(210,200,185,0.35)';
    ctx.beginPath();
    ctx.arc(0, 8.5, 1.6, 0, TAU);
    ctx.fill();
    // idle breathing rim (only when something could use it)
    if (!dead && rt.breathe) {
      const b = 0.5 + 0.5 * Math.sin(t * 2.2 + sock.slot);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.06 + 0.06 * b;
      ctx.beginPath();
      rrect(ctx, -sockW / 2 - 1, -sockH / 2 - 1, sockW + 2, sockH + 2, 7);
      ctx.strokeStyle = ringCol || '#ffe8b8';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
    // glyph below the socket (stays visible with a plug seated)
    if (keyed) Art.glyph(ctx, key, 0, sockH / 2 + 8.5, 4.2, 'rgba(255,255,255,0.88)', 'rgba(0,0,0,0.25)');
    // dead: soot and cracks
    if (dead) {
      ctx.fillStyle = rad(ctx, 0, 0, 2, 22, [0, 'rgba(12,8,6,0.88)', 0.6, 'rgba(40,28,20,0.5)', 1, 'rgba(40,28,20,0)']);
      ctx.fillRect(-24, -26, 48, 52);
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-9, -12);
      ctx.lineTo(-4, -4);
      ctx.lineTo(-8, 3);
      ctx.moveTo(8, -10);
      ctx.lineTo(4, -1);
      ctx.lineTo(9, 7);
      ctx.stroke();
      // a faint ember that cools
      const em = rt.ember && rt.ember[sock.id] ? rt.ember[sock.id] : 0;
      if (em > 0) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = rad(ctx, 0, 0, 1, 14, [0, 'rgba(255,150,60,' + 0.7 * em + ')', 1, 'rgba(255,90,30,0)']);
        ctx.fillRect(-16, -16, 32, 32);
        ctx.globalCompositeOperation = 'source-over';
      }
    }
    // frayed: copper strands and a flickering blue spark; mended: a silver band of tape
    const fray = rt.fray && rt.fray[sock.id];
    if (fray) {
      if (!fray.mended) {
        ctx.strokeStyle = '#d98a4c';
        ctx.lineWidth = 1.6;
        ctx.lineCap = 'round';
        for (const sx of [-1, 1])
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(sx * 9, -10 + i * 3.4);
            ctx.quadraticCurveTo(sx * (15 + i * 2), -14 + i * 4 + Math.sin(t * 5 + i) * 1.2, sx * (18 + i * 2.4), -8 + i * 6);
            ctx.stroke();
          }
        if (Math.sin(t * 31 + sock.slot * 7) > 0.35) {
          ctx.strokeStyle = 'rgba(190,225,255,0.95)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          let x = -12,
            y = -2;
          ctx.moveTo(x, y);
          for (let k = 0; k < 5; k++) {
            x += 5;
            y = -2 + Math.sin(t * 90 + k * 2.3 + sock.slot) * 5;
            ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(20,14,10,0.35)';
        ctx.beginPath();
        ctx.arc(0, 0, 13, 0, TAU);
        ctx.fill();
      }
      // tape winding on (fray.prog 0..1) or already on (mended)
      const pr = fray.mended ? 1 : fray.prog;
      if (pr > 0.02) {
        const bh = 8 + 30 * pr;
        ctx.beginPath();
        rrect(ctx, -17, sockH / 2 + 3 - bh, 34, bh, 4);
        ctx.fillStyle = lin(ctx, 0, -bh, 0, bh, [0, '#f1f4f8', 0.5, '#bcc4d0', 1, '#8d97a6']);
        ctx.fill();
        ctx.strokeStyle = 'rgba(40,50,66,0.45)';
        ctx.lineWidth = 0.9;
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1;
        for (let k = 0; k < bh; k += 5) {
          ctx.beginPath();
          ctx.moveTo(-15, sockH / 2 + 3 - bh + k);
          ctx.lineTo(15, sockH / 2 + 3 - bh + k + 3);
          ctx.stroke();
        }
      }
    }
    // covered by a brick's overhang
    if (cover > 0) {
      ctx.fillStyle = 'rgba(10,8,6,' + 0.5 * cover + ')';
      ctx.beginPath();
      rrect(ctx, -sockW / 2 - 3, -sockH / 2 - 3, sockW + 6, sockH + 6, 8);
      ctx.fill();
    }
    // footprint flash (the reason for a refusal, drawn on the strip)
    if (fp > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(255,170,60,' + 0.55 * fp + ')';
      ctx.beginPath();
      rrect(ctx, -sockW / 2 - 4, -sockH / 2 - 4, sockW + 8, sockH + 8, 9);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
    // hover glow (a compatible plug is close)
    if (glow > 0.01) {
      ctx.globalCompositeOperation = 'lighter';
      const col = ringCol || '#ffe6b0';
      ctx.fillStyle = rad(ctx, 0, 0, 2, 30, [0, U.rgba(col, 0.55 * glow), 1, U.rgba(col, 0)]);
      ctx.fillRect(-32, -34, 64, 68);
      ctx.strokeStyle = U.rgba('#ffffff', 0.7 * glow);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      rrect(ctx, -sockW / 2 - 1.5, -sockH / 2 - 1.5, sockW + 3, sockH + 3, 7);
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    }
    // a timed socket wears a ring that fills toward its next opening and glows while it is open
    const tm = rt.timer && rt.timer[sock.id];
    if (tm && sock.timer && sock.timer.hatch) {
      // a docking hatch (Act 4): the notch is the window, and it turns round the ring toward the keyhole at the top; the hatch is open while it covers the keyhole
      const R = 25,
        TM = sock.timer,
        span = TAU * TM.on / TM.period,
        th = -Math.PI / 2 - (TAU * tm.ph) / TM.period;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 0, R, 0, TAU);
      ctx.strokeStyle = 'rgba(18,24,38,0.9)';
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, R + 2.5, 0, TAU);
      ctx.strokeStyle = 'rgba(200,212,230,0.45)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, R, th, th + span);
      ctx.strokeStyle = tm.open ? 'rgba(150,255,190,0.95)' : 'rgba(120,180,255,0.6)';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, -R, 3.2, 0, TAU);
      ctx.fillStyle = tm.open ? '#c8ffd9' : '#2c3650';
      ctx.fill();
      if (tm.open) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = rad(ctx, 0, 0, 2, 34, [0, 'rgba(150,255,190,0.3)', 1, 'rgba(150,255,190,0)']);
        ctx.fillRect(-36, -36, 72, 72);
        ctx.globalCompositeOperation = 'source-over';
      }
    } else if (tm) {
      const R = 25;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 0, R, 0, TAU);
      ctx.strokeStyle = 'rgba(255,255,255,0.14)';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, R, -Math.PI / 2, -Math.PI / 2 + TAU * Math.max(0.02, Math.min(1, tm.frac)));
      ctx.strokeStyle = tm.open ? 'rgba(150,255,185,0.95)' : 'rgba(255,214,120,0.8)';
      ctx.lineWidth = tm.open ? 3.6 : 3;
      ctx.stroke();
      if (tm.open || tm.flash > 0.02) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = rad(ctx, 0, 0, 2, 34, [0, 'rgba(150,255,185,' + (0.3 * (tm.open ? 1 : 0) + 0.35 * tm.flash) + ')', 1, 'rgba(150,255,185,0)']);
        ctx.fillRect(-36, -36, 72, 72);
        ctx.globalCompositeOperation = 'source-over';
      }
    }
    // refusal flash on the socket itself
    if (flash > 0.01) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(255,90,70,' + 0.5 * flash + ')';
      ctx.beginPath();
      rrect(ctx, -sockW / 2 - 1, -sockH / 2 - 1, sockW + 2, sockH + 2, 7);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }

  // power-strip cable that runs off the stage (decor)
  function stripCable(ctx, st, x0, x1) {
    const left = st.x < 180;
    const lx = left ? x0 : x1;
    ctx.save();
    ctx.translate(st.x, st.y);
    ctx.rotate(st.angle);
    const dir = left ? -1 : 1;
    ctx.beginPath();
    ctx.moveTo(lx, 0);
    ctx.bezierCurveTo(lx + dir * 40, 0, lx + dir * 40, 24, lx + dir * 120, 26);
    ctx.lineCap = 'round';
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
  }

  Art.stripBody = function (ctx, st, rt, t, hasKeys) {
    const b = Rules.stripBounds(st);
    const x0 = b[0],
      x1 = b[1];
    const h = st.kind === 'grommet' ? 44 : 56;
    const sq = rt.sq || 0;
    ctx.save();
    ctx.translate(st.x, st.y);
    ctx.rotate(st.angle);
    // the squash: compress along the insertion direction a hair
    ctx.translate(0, sq * 2.4);
    ctx.scale(1 + sq * 0.5, 1 - sq * 0.7);
    if (st.kind === 'grommet') {
      // a brass desk grommet set into the mat
      const R = 24;
      ctx.beginPath();
      ctx.arc(0, 0, R + 1.5, 0, TAU);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, R, 0, TAU);
      ctx.fillStyle = lin(ctx, -R, -R, R, R, [0, '#e8cf8a', 0.5, '#b98f48', 1, '#7e5d2b']);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, R - 4.5, 0, TAU);
      ctx.fillStyle = lin(ctx, -R, -R, R, R, [0, '#6b4e24', 1, '#caa55e']);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, R - 6.5, 0, TAU);
      ctx.fillStyle = '#efe7d3';
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.translate(st.x, st.y);
      ctx.rotate(st.angle);
      ctx.translate(0, sq * 2.4);
      drawSocket(ctx, 0, st.sockets[0], rt, hasKeys, t);
      ctx.restore();
      return;
    }
    // body
    ctx.beginPath();
    rrect(ctx, x0, -h / 2, x1 - x0, h, 17);
    ctx.fillStyle = lin(ctx, x0, -h / 2, x1, h / 2, [0, '#f4eddd', 0.5, '#e2dac6', 1, '#c9bfa8']);
    ctx.fill();
    // top face panel
    ctx.beginPath();
    rrect(ctx, x0 + 3, -h / 2 + 3, x1 - x0 - 6, h - 6, 14);
    ctx.fillStyle = lin(ctx, 0, -h / 2, 0, h / 2, [0, 'rgba(255,255,255,0.45)', 0.5, 'rgba(255,255,255,0.08)', 1, 'rgba(0,0,0,0.1)']);
    ctx.fill();
    // bevel rim
    ctx.beginPath();
    rrect(ctx, x0 + 0.6, -h / 2 + 0.6, x1 - x0 - 1.2, h - 1.2, 16.5);
    ctx.strokeStyle = lin(ctx, x0, -h / 2, x1, h / 2, [0, 'rgba(255,255,255,0.85)', 0.5, 'rgba(255,255,255,0.15)', 1, 'rgba(60,45,25,0.35)']);
    ctx.lineWidth = 1.3;
    ctx.stroke();
    // LED
    const energized = rt.energized !== false;
    const ledCol = energized ? '#6ee7a0' : '#c9a24a';
    ctx.beginPath();
    ctx.arc(x0 + 11, 0, 3.2, 0, TAU);
    ctx.fillStyle = 'rgba(40,30,20,0.4)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x0 + 11, 0, 2.5 + (rt.ledFlick || 0) * 0.5, 0, TAU);
    ctx.fillStyle = energized ? ledCol : 'rgba(120,108,80,0.8)';
    ctx.fill();
    if (energized) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rad(ctx, x0 + 11, 0, 1, 11, [0, 'rgba(110,231,160,0.5)', 1, 'rgba(110,231,160,0)']);
      ctx.fillRect(x0, -12, 24, 24);
      ctx.globalCompositeOperation = 'source-over';
    }
    // sockets
    for (let i = 0; i < st.n; i++) drawSocket(ctx, Art.socketAt(st, i), st.sockets[i], rt, hasKeys, t);
    // a fed strip shows its power as a row of LEDs: dark until its cord is plugged into a live strip, then a wave runs through
    if (st.fedBy) {
      for (let i = 0; i < st.n; i++) {
        const lit = energized ? (rt.wave === undefined ? 1 : Math.max(0, Math.min(1, rt.wave * 1.8 - i * 0.28))) : 0;
        const lx = Art.socketAt(st, i);
        ctx.beginPath();
        ctx.arc(lx, -h / 2 + 8.5, 2.4, 0, TAU);
        ctx.fillStyle = lit > 0.02 ? '#7ff0a8' : 'rgba(60,50,40,0.45)';
        ctx.fill();
        if (lit > 0.02) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = rad(ctx, lx, -h / 2 + 8.5, 1, 11 + 5 * (1 - lit), [0, 'rgba(120,255,170,' + 0.8 * lit + ')', 1, 'rgba(120,255,170,0)']);
          ctx.fillRect(lx - 16, -h / 2 - 8, 32, 32);
          ctx.globalCompositeOperation = 'source-over';
        }
      }
    }
    // switch
    if (st.hasSwitch) {
      const xs = Rules.switchX(st);
      const on = rt.sw === undefined ? 0 : rt.sw;
      ctx.beginPath();
      rrect(ctx, xs - 19, -23, 38, 46, 10);
      ctx.fillStyle = lin(ctx, 0, -23, 0, 23, [0, '#a99f8a', 1, '#cdc4ae']);
      ctx.fill();
      ctx.beginPath();
      rrect(ctx, xs - 19, -23, 38, 46, 10);
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();
      // rocker: two halves, the lit half moves with the switch
      const tilt = (on - 0.5) * 2; // -1 off .. +1 on
      ctx.save();
      ctx.translate(xs, 0);
      ctx.beginPath();
      rrect(ctx, -14, -18.5, 28, 37, 7);
      ctx.fillStyle = lin(ctx, 0, -18, 0, 18, tilt > 0 ? [0, '#8ff0ad', 0.5, '#5ccf84', 1, '#3b8f5a'] : [0, '#5d5b55', 0.5, '#7b7870', 1, '#a19d92']);
      ctx.fill();
      // shading to suggest a tilted rocker
      ctx.fillStyle = lin(ctx, 0, -18, 0, 18, [0, 'rgba(255,255,255,' + (0.28 - tilt * 0.2) + ')', 0.5, 'rgba(255,255,255,0)', 1, 'rgba(0,0,0,' + (0.25 + tilt * 0.15) + ')']);
      ctx.beginPath();
      rrect(ctx, -14, -18.5, 28, 37, 7);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.fillRect(-1, -9 - tilt * 2, 2, 8);
      ctx.beginPath();
      ctx.arc(0, 8 + tilt * 1.5, 3, 0, TAU);
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.stroke();
      ctx.restore();
      if (rt.swHint > 0.01) {
        ctx.globalCompositeOperation = 'lighter';
        const p = 0.5 + 0.5 * Math.sin(t * 6);
        ctx.strokeStyle = 'rgba(255,240,180,' + (0.4 + 0.4 * p) * rt.swHint + ')';
        ctx.lineWidth = 3;
        ctx.beginPath();
        rrect(ctx, xs - 23, -27, 46, 54, 13);
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
      }
    }
    if (st.rail && Art.railGrip) Art.railGrip(ctx, st, rt, t, x0, x1, h);
    // a capped strip wears a load meter: one segment per bolt it can carry
    if (st.cap) {
      const n = st.cap,
        load = rt.load || 0,
        pulse = rt.loadPulse || 0;
      const sw = 11,
        gap = 3,
        total = n * sw + (n - 1) * gap;
      const flick = pulse > 0.5 ? 0.5 + 0.5 * Math.sin(t * 28) : 1;
      for (let i = 0; i < n; i++) {
        const x = -total / 2 + i * (sw + gap);
        const on = i < load;
        const over = load > n && on;
        ctx.beginPath();
        rrect(ctx, x, -h / 2 - 10, sw, 5, 2);
        ctx.fillStyle = rt.tripped ? 'rgba(40,30,30,0.5)' : on ? (load >= n ? '#ff6a4d' : load >= n - 1 ? '#ffc94d' : '#6ee7a0') : 'rgba(60,52,44,0.38)';
        ctx.globalAlpha = on ? flick : 1;
        ctx.fill();
        ctx.globalAlpha = 1;
        if (on && !rt.tripped) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = rad(ctx, x + sw / 2, -h / 2 - 7.5, 1, 11, [0, 'rgba(255,200,120,' + 0.35 * flick + ')', 1, 'rgba(255,200,120,0)']);
          ctx.fillRect(x - 6, -h / 2 - 18, sw + 12, 22);
          ctx.globalCompositeOperation = 'source-over';
        }
      }
    }
    ctx.restore();
  };

  Art.stripUnder = function (ctx, st, rt, t) {
    if (st.rail && Art.railUnder) return Art.railUnder(ctx, st, rt, t);
    if (st.carrier && st.carrier.mode !== 'pendulum' && Art.carriedUnder) return Art.carriedUnder(ctx, st, rt, t); // a pendulum hangs from its pivot (mech-pendulum.js): no cord
    const b = Rules.stripBounds(st);
    const cx = (b[0] + b[1]) / 2,
      w = b[1] - b[0];
    const ca = Math.cos(st.angle),
      sa = Math.sin(st.angle);
    if (st.kind === 'grommet') {
      Art.shadow(ctx, st.x, st.y, 46, 46, 23, 0, 0.1, 0.4);
      return;
    }
    if (!st.fedBy && !(st.carrier && st.carrier.mode === 'pendulum')) stripCable(ctx, st, b[0] + 6, b[1] - 6 - (st.hasSwitch ? 0 : 0)); // a pendulum hangs from its pivot: no mains lead
    Art.shadow(ctx, st.x + cx * ca, st.y + cx * sa, w, 56, 17, st.angle, 0.12, 0.5);
  };

  /* ---------------------------------------------------------------- plugs */
  // p: { x, y, nose (world angle of the nose), lift, scale, fat, key, color, ins (0..1 inserted), glow, wob, rest }
  Art.plugShadow = function (ctx, p) {
    const lift = p.lift || 0;
    const w = p.fat ? 96 : 20,
      h = p.fat ? 34 : 26;
    Art.shadow(ctx, p.x, p.y, w * (p.scale || 1), h * (p.scale || 1), p.fat ? 8 : 6, p.nose + Math.PI / 2, lift * 0.9 + 0.02, 0.4 + lift * 0.12);
  };
  Art.plug = function (ctx, p, t) {
    const keyed = p.key !== 'any';
    const col = keyed ? Art.KEYCOL[p.key] : p.fat ? '#3a3f52' : Art.CREAM;
    const sc = p.scale || 1;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.nose + Math.PI / 2 + (p.wob || 0) + (p.lean || 0));
    ctx.scale(sc, sc);
    const fat = p.fat;
    const bw = fat ? 96 : 20,
      bh = fat ? 32 : 24;
    // prongs
    const ins = p.ins || 0;
    const pl = (fat ? 11 : 9) * (1 - ins);
    if (pl > 0.3) {
      const px = fat ? 14 : 5;
      for (const sx of [-1, 1]) {
        ctx.beginPath();
        rrect(ctx, sx * px - 1.9, -bh / 2 - pl, 3.8, pl + 2, 1.5);
        ctx.fillStyle = lin(ctx, sx * px - 2, 0, sx * px + 2, 0, [0, '#f3f1ea', 0.5, '#bdb9ae', 1, '#8a867c']);
        ctx.fill();
      }
    }
    // collar (strain relief)
    ctx.beginPath();
    rrect(ctx, -(fat ? 9 : 5.5), bh / 2 - 2, fat ? 18 : 11, 8, 3);
    ctx.fillStyle = U.shade(col, -0.45);
    ctx.fill();
    // body
    ctx.beginPath();
    rrect(ctx, -bw / 2, -bh / 2, bw, bh, fat ? 9 : 6.5);
    ctx.fillStyle = lin(ctx, -bw / 2, -bh / 2, bw / 2, bh / 2, [0, U.shade(col, 0.2), 0.55, col, 1, U.shade(col, -0.22)]);
    ctx.fill();
    if (p.keyB) {
      // a Y-plug: the right half takes the second cable's colour
      const colB = Art.KEYCOL[p.keyB] || '#ddd';
      ctx.save();
      ctx.beginPath();
      rrect(ctx, -bw / 2, -bh / 2, bw, bh, fat ? 9 : 6.5);
      ctx.clip();
      ctx.beginPath();
      ctx.rect(0, -bh / 2 - 2, bw / 2 + 2, bh + 4);
      ctx.fillStyle = lin(ctx, -bw / 2, -bh / 2, bw / 2, bh / 2, [0, U.shade(colB, 0.2), 0.55, colB, 1, U.shade(colB, -0.22)]);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(-0.6, -bh / 2, 1.2, bh);
      ctx.restore();
    }
    // rim light (upper-left) and under-edge
    ctx.beginPath();
    rrect(ctx, -bw / 2 + 0.7, -bh / 2 + 0.7, bw - 1.4, bh - 1.4, fat ? 8.5 : 6);
    ctx.strokeStyle = lin(ctx, -bw / 2, -bh / 2, bw / 2, bh / 2, [0, 'rgba(255,255,255,0.7)', 0.5, 'rgba(255,255,255,0.08)', 1, 'rgba(0,0,0,0.3)']);
    ctx.lineWidth = 1.2;
    ctx.stroke();
    if (Art.patternMode && keyed) {
      ctx.save();
      ctx.beginPath();
      rrect(ctx, -bw / 2, -bh / 2, bw, bh, fat ? 9 : 6.5);
      ctx.clip();
      Art.keyPattern(ctx, p.key, bw, bh);
      ctx.restore();
    }
    // grip ridges
    ctx.fillStyle = 'rgba(0,0,0,0.13)';
    if (fat) {
      for (let i = -3; i <= 3; i++) ctx.fillRect(i * 9 - 1, -bh / 2 + 5, 2, bh - 10);
    } else {
      ctx.fillRect(-6.5, -1, 13, 1.4);
      ctx.fillRect(-6.5, 3, 13, 1.4);
      ctx.fillRect(-6.5, 7, 13, 1.4);
    }
    // glyph
    if (keyed) Art.glyph(ctx, p.key, 0, fat ? 0 : -4, fat ? 4.6 : 3.4, 'rgba(255,255,255,0.9)', 'rgba(0,0,0,0.25)');
    else if (fat) {
      // power brick LED
      ctx.beginPath();
      ctx.arc(-34, 0, 2.2, 0, TAU);
      ctx.fillStyle = p.ledOn ? '#7ee8a0' : 'rgba(60,70,60,0.6)';
      ctx.fill();
    }
    if (fat && keyed) {
      ctx.beginPath();
      ctx.arc(-38, 0, 2, 0, TAU);
      ctx.fillStyle = p.ledOn ? '#7ee8a0' : 'rgba(40,50,40,0.5)';
      ctx.fill();
    }
    // seated glow at the rim
    if (p.rim > 0.01) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = U.rgba(keyed ? col : '#ffe8b8', 0.55 * p.rim);
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      rrect(ctx, -bw / 2 - 1, -bh / 2 - 1, bw + 2, bh + 2, fat ? 10 : 7.5);
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  };

  /* ---------------------------------------------------------------- cable */
  // earned cosmetic skins (see meta.js): they change the weave and the pluck, never the colour code
  Art.skin = 'braid';
  Art.SKINW = { ribbon: 1.3, rope: 1.1, beads: 1.12, neon: 0.95, crayon: 1.15 };
  // a little loop of cable for the settings sheet: draws `skin` in `col` into the box w x h at the origin
  Art.cableSample = function (ctx, w, h, skin, col) {
    const n = 22,
      x = new Float64Array(n),
      y = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      x[i] = 8 + u * (w - 16);
      y[i] = h / 2 + Math.sin(u * Math.PI * 2.2 + 0.4) * (h * 0.26);
    }
    const prev = Art.skin;
    Art.skin = skin;
    Art.cable(ctx, { n, x, y, len: w, vib: 0 }, col, { cheap: false });
    Art.skin = prev;
  };
  Art.cable = function (ctx, rope, col, o) {
    o = o || {};
    const n = rope.n;
    let x = rope.x,
      y = rope.y;
    if (rope.vib) {
      // a plucked cable: displace the drawn nodes along their normals (the physics is untouched)
      const vx = new Float64Array(n),
        vy = new Float64Array(n);
      for (let i = 0; i < n; i++) {
        const a = Math.max(0, i - 1),
          b = Math.min(n - 1, i + 1);
        let tx = rope.x[b] - rope.x[a],
          ty = rope.y[b] - rope.y[a];
        const tl = Math.hypot(tx, ty) || 1;
        tx /= tl;
        ty /= tl;
        const d = rope.vibDisp(i / (n - 1));
        vx[i] = rope.x[i] - ty * d;
        vy[i] = rope.y[i] + tx * d;
      }
      x = vx;
      y = vy;
    }
    const keyed = o.key !== undefined && o.key !== 'any';
    const base = col;
    const sk = Art.skin || 'braid';
    const r = T.cableR * (o.thin ? 0.85 : 1) * (1 - 0.06 * (o.strain || 0)) * (Art.SKINW[sk] || 1);
    const path = new Path2D();
    path.moveTo(x[0], y[0]);
    for (let i = 1; i < n - 1; i++) path.quadraticCurveTo(x[i], y[i], (x[i] + x[i + 1]) / 2, (y[i] + y[i + 1]) / 2);
    path.lineTo(x[n - 1], y[n - 1]);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const a = o.alpha === undefined ? 1 : o.alpha;
    ctx.globalAlpha = a;
    // contact shadow (two cheap strokes read as a soft blur)
    const lift = o.lift || 0;
    ctx.save();
    ctx.translate(2.2 + lift * 4, 3.4 + lift * 6);
    ctx.strokeStyle = 'rgba(8,4,0,0.16)';
    ctx.lineWidth = r * 2 + 3.4;
    ctx.stroke(path);
    ctx.strokeStyle = 'rgba(8,4,0,0.2)';
    ctx.lineWidth = r * 2 + 0.8;
    ctx.stroke(path);
    ctx.restore();
    // underside, body
    ctx.strokeStyle = U.shade(base, sk === 'neon' ? -0.72 : -0.32);
    ctx.lineWidth = r * 2 + 0.6;
    ctx.stroke(path);
    ctx.strokeStyle = sk === 'neon' ? U.shade(base, -0.5) : sk === 'licorice' ? U.shade(base, -0.12) : base;
    ctx.lineWidth = r * 1.75;
    ctx.stroke(path);
    // texture: each skin has its own weave. Butt-capped dashes read as bands across the cable and travel with the material.
    ctx.lineCap = 'butt';
    if (sk === 'rope') {
      // a chunky twist: bold bands, a lighter band between
      ctx.setLineDash([3.6, 3]);
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = r * 1.75;
      ctx.stroke(path);
      if (!o.cheap) {
        ctx.lineDashOffset = -3.3;
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.stroke(path);
      }
    } else if (sk === 'licorice') {
      // candy stripes on a glossy tube
      ctx.setLineDash([6.5, 6.5]);
      ctx.strokeStyle = 'rgba(255,255,255,0.46)';
      ctx.lineWidth = r * 1.75;
      ctx.stroke(path);
    } else if (sk === 'ribbon') {
      // satin: a soft lighter band down the middle, a darker hem on each side
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = r * 1.1;
      ctx.stroke(path);
    } else if (sk === 'neon') {
      // a dark tube with a hot core and a halo
      ctx.lineCap = 'round';
      ctx.strokeStyle = U.mix(base, '#ffffff', 0.5);
      ctx.lineWidth = r * 0.85;
      ctx.stroke(path);
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = U.rgba(base, 0.2);
      ctx.lineWidth = r * 3.2;
      ctx.stroke(path);
      ctx.globalCompositeOperation = 'source-over';
    } else if (sk === 'beads') {
      // a bead chain: dark rims, bright faces
      ctx.lineCap = 'round';
      ctx.setLineDash([0.1, 4.3]);
      ctx.strokeStyle = U.shade(base, -0.42);
      ctx.lineWidth = r * 2.05;
      ctx.stroke(path);
      ctx.strokeStyle = U.mix(base, '#ffffff', 0.18);
      ctx.lineWidth = r * 1.55;
      ctx.stroke(path);
    } else if (sk === 'crayon') {
      // a crayon cable (Act 3's reward): a matte waxy body with short scribbled marks, a lighter stroke and a darker one, no gloss
      ctx.lineCap = 'round';
      ctx.setLineDash([2.4, 1.4, 0.9, 2.8]);
      ctx.strokeStyle = U.mix(base, '#ffffff', 0.24);
      ctx.lineWidth = r * 1.3;
      ctx.stroke(path);
      if (!o.cheap) {
        ctx.lineDashOffset = -2.6;
        ctx.strokeStyle = U.shade(base, -0.22);
        ctx.lineWidth = r * 1.05;
        ctx.stroke(path);
      }
    } else {
      // braid (the default): fine ribbing
      ctx.setLineDash([1.5, 2.6]);
      ctx.lineDashOffset = 0;
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = r * 1.75;
      ctx.stroke(path);
      if (!o.cheap) {
        ctx.lineDashOffset = -2.05;
        ctx.strokeStyle = 'rgba(255,255,255,0.10)';
        ctx.stroke(path);
      }
    }
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;
    ctx.lineCap = 'round';
    // highlight toward the light (a glossier skin wears a broader sheen)
    ctx.save();
    ctx.translate(-0.7, -0.9);
    ctx.strokeStyle = 'rgba(255,255,255,' + (0.3 + 0.35 * (o.strain || 0) + (sk === 'licorice' ? 0.2 : 0)) + ')';
    ctx.lineWidth = r * (sk === 'licorice' ? 0.7 : sk === 'ribbon' ? 0.85 : sk === 'neon' ? 0.2 : sk === 'beads' ? 0.35 : sk === 'crayon' ? 0.22 : 0.5);
    ctx.stroke(path);
    ctx.restore();
    // power pulse
    if (o.pulse !== undefined && o.pulse >= 0) {
      const L = rope.len;
      const pl = 46;
      const start = Math.max(0, L - o.pulse - pl / 2);
      ctx.globalCompositeOperation = 'lighter';
      ctx.setLineDash([pl, 9999]);
      ctx.lineDashOffset = -start;
      ctx.lineCap = 'round';
      ctx.strokeStyle = U.rgba(keyed ? Art.KEYCOL[o.key] : '#fff4d0', 0.55);
      ctx.lineWidth = r * 3.2;
      ctx.stroke(path);
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = r * 1.2;
      ctx.stroke(path);
      ctx.setLineDash([]);
      ctx.globalCompositeOperation = 'source-over';
    }
    // a steady glow when the cable is carrying power
    if (o.live > 0.01) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = U.rgba(keyed ? Art.KEYCOL[o.key] : '#ffe9bd', 0.16 * o.live);
      ctx.lineWidth = r * 2.4;
      ctx.stroke(path);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  };

  // a decorative path drawn in the same cable language (ribbing, highlight, glow); used by the title lettering
  Art.cableStroke = function (ctx, path, base, w, o) {
    o = o || {};
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.save();
    ctx.translate(3, 5);
    ctx.strokeStyle = 'rgba(8,4,0,0.22)';
    ctx.lineWidth = w + 3;
    ctx.stroke(path);
    ctx.restore();
    ctx.strokeStyle = U.shade(base, -0.35);
    ctx.lineWidth = w + 1.2;
    ctx.stroke(path);
    ctx.strokeStyle = base;
    ctx.lineWidth = w * 0.88;
    ctx.stroke(path);
    ctx.lineCap = 'butt';
    ctx.setLineDash([2.4, 4]);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = w * 0.88;
    ctx.stroke(path);
    ctx.setLineDash([]);
    ctx.lineCap = 'round';
    ctx.save();
    ctx.translate(-1.2, -1.6);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = w * 0.26;
    ctx.stroke(path);
    ctx.restore();
    if (o.glow > 0.01) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.shadowColor = 'rgba(255,214,140,' + 0.9 * o.glow + ')';
      ctx.shadowBlur = 26 * o.glow;
      ctx.strokeStyle = 'rgba(255,236,190,' + 0.4 * o.glow + ')';
      ctx.lineWidth = w * 0.9;
      ctx.stroke(path);
    }
    ctx.restore();
  };

  // color-blind patterns (a third channel besides color and glyph): drawn inside the current clip
  Art.keyPattern = function (ctx, key, w, h) {
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    if (key === 'coral') for (let i = -h; i < w; i += 5) { ctx.moveTo(-w / 2 + i, h / 2); ctx.lineTo(-w / 2 + i + h, -h / 2); }
    else if (key === 'amber') {
      for (let x = -w / 2 + 3; x < w / 2; x += 6) for (let y = -h / 2 + 3; y < h / 2; y += 6) { ctx.moveTo(x + 1.2, y); ctx.arc(x, y, 1.2, 0, TAU); }
      ctx.fill();
    } else if (key === 'mint') {
      for (let x = -w / 2; x < w / 2; x += 6) { ctx.moveTo(x, -h / 2); ctx.lineTo(x, h / 2); }
      for (let y = -h / 2; y < h / 2; y += 6) { ctx.moveTo(-w / 2, y); ctx.lineTo(w / 2, y); }
    } else if (key === 'sky') {
      for (let y = -h / 2 + 3; y < h / 2; y += 6) { ctx.moveTo(-w / 2, y); for (let x = -w / 2; x < w / 2; x += 6) ctx.quadraticCurveTo(x + 1.5, y - 2.2, x + 3, y), ctx.quadraticCurveTo(x + 4.5, y + 2.2, x + 6, y); }
    } else if (key === 'violet') {
      for (let x = -w / 2; x < w / 2; x += 6) for (let y = -h / 2; y < h / 2; y += 6) if (((x + y) / 6) % 2 === 0) ctx.rect(x, y, 3, 3);
      ctx.fill();
    }
    ctx.stroke();
    ctx.restore();
  };

  /* ---------------------------------------------------------------- light map (screen space, half-res) */
  Art.LightMap = function () {
    this.cv = document.createElement('canvas');
    this.c = this.cv.getContext('2d');
    this.w = 0;
    this.h = 0;
    this.f = 0.5;
  };
  Art.LightMap.prototype.resize = function (Wp, Hp, f) {
    this.f = f || 0.5;
    const w = Math.max(2, Math.ceil(Wp * this.f)),
      h = Math.max(2, Math.ceil(Hp * this.f));
    if (w !== this.w || h !== this.h) {
      this.w = this.cv.width = w;
      this.h = this.cv.height = h;
    }
  };
  // lights: [{x,y,r,i,col}] in lightmap pixel space; ambient: css color string with alpha
  Art.LightMap.prototype.render = function (lights, ambient) {
    const c = this.c;
    c.globalCompositeOperation = 'source-over';
    c.clearRect(0, 0, this.w, this.h);
    c.fillStyle = ambient;
    c.fillRect(0, 0, this.w, this.h);
    c.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < lights.length; i++) {
      const L = lights[i];
      if (L.i <= 0.01) continue;
      const g = c.createRadialGradient(L.x, L.y, L.r * 0.08, L.x, L.y, L.r);
      g.addColorStop(0, 'rgba(0,0,0,' + Math.min(1, L.i) + ')');
      g.addColorStop(0.5, 'rgba(0,0,0,' + Math.min(1, L.i) * 0.55 + ')');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.fillRect(L.x - L.r, L.y - L.r, L.r * 2, L.r * 2);
    }
    c.globalCompositeOperation = 'source-over';
  };

  /* ---------------------------------------------------------------- hint hand */
  Art.hand = function (ctx, x, y, press, alpha) {
    ctx.save();
    ctx.globalAlpha = 0.85 * alpha;
    // shadow
    ctx.beginPath();
    ctx.arc(x + 3, y + 5, 15, 0, TAU);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fill();
    // fingertip
    ctx.beginPath();
    ctx.arc(x, y, 15 - press * 1.5, 0, TAU);
    ctx.fillStyle = lin(ctx, x - 14, y - 14, x + 14, y + 14, [0, 'rgba(255,255,255,0.95)', 1, 'rgba(235,225,215,0.9)']);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 6.5 + press * 2, 0, TAU);
    ctx.fillStyle = 'rgba(255,200,180,0.55)';
    ctx.fill();
    // tap ring
    if (press > 0.01) {
      ctx.beginPath();
      ctx.arc(x, y, 15 + press * 14, 0, TAU);
      ctx.strokeStyle = 'rgba(255,255,255,' + 0.6 * (1 - press) + ')';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  };

  // a short word on a sticky-label (used for tiny captions and titles inside the room)
  Art.text = function (ctx, str, x, y, size, col, weight, align) {
    ctx.font = (weight || 800) + ' ' + size + 'px ' + FONT;
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = col;
    ctx.fillText(str, x, y);
  };
})();
