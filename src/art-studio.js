/* Snug — art-studio.js : Act 3, the studio (world 'studio'): a dark plywood stage with gaffer tape and spike marks under a black rubber
   stage mat with a chalk border and one warm spot; Tick the metronome; the roadie's chalkboard (the signal chain: arrows for "listens
   to", a bolt for "clashes with"); the flight case's foam bed that holds the strip. Registers into the surface/mat builders, the
   device registry and the decor registry like the other worlds. */
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
  function buildStage(Wp, Hp, k) {
    const cv = document.createElement('canvas');
    cv.width = Wp;
    cv.height = Hp;
    const c = cv.getContext('2d');
    const rnd = U.rng(88121);
    c.fillStyle = lin(c, 0, 0, Wp, Hp, [0, '#3a352f', 0.5, '#2c2824', 1, '#201d1a']);
    c.fillRect(0, 0, Wp, Hp);
    // plywood boards, painted black long ago and scuffed
    const PW = 84 * k;
    for (let y = 0, row = 0; y < Hp; y += PW, row++) {
      c.fillStyle = 'rgba(' + (row % 2 ? '255,240,215' : '0,0,0') + ',' + (0.03 + rnd() * 0.035) + ')';
      c.fillRect(0, y, Wp, PW);
      c.fillStyle = 'rgba(0,0,0,0.55)';
      c.fillRect(0, y, Wp, 1.8 * k);
      let x = (row % 2 ? 0.3 : 0.7) * Wp * rnd();
      for (; x < Wp; x += (0.7 + rnd() * 0.6) * Wp * 0.55) {
        c.fillStyle = 'rgba(0,0,0,0.5)';
        c.fillRect(x, y, 1.8 * k, PW);
        c.fillStyle = 'rgba(160,140,110,0.5)';
        c.beginPath();
        c.arc(x + 7 * k, y + 8 * k, 1.5 * k, 0, TAU);
        c.arc(x + 7 * k, y + PW - 8 * k, 1.5 * k, 0, TAU);
        c.fill();
      }
      c.strokeStyle = 'rgba(255,240,215,0.05)';
      c.lineWidth = 0.9 * k;
      for (let g = 0; g < 6; g++) {
        const yy = y + (g + 0.5 + rnd() * 0.4) * (PW / 6);
        c.beginPath();
        c.moveTo(0, yy);
        for (let xx = 0; xx <= Wp; xx += 50 * k) c.lineTo(xx, yy + Math.sin(xx * 0.008 + g + row * 2) * 1.8 * k);
        c.stroke();
      }
    }
    for (let i = 0; i < 1800; i++) {
      c.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.12)';
      c.fillRect(rnd() * Wp, rnd() * Hp, 1.5 * k, 1.5 * k);
    }
    // gaffer tape: long strips along the edges and spike marks (a little coloured +) where things stand
    const tape = (x0, y0, x1, y1, col, wd) => {
      c.strokeStyle = col;
      c.lineWidth = wd * k;
      c.lineCap = 'butt';
      c.beginPath();
      c.moveTo(x0, y0);
      c.lineTo(x1, y1);
      c.stroke();
    };
    tape(Wp * 0.04, Hp * 0.88, Wp * 0.96, Hp * 0.86, 'rgba(230,214,150,0.55)', 9);
    tape(Wp * 0.06, Hp * 0.05, Wp * 0.4, Hp * 0.05, 'rgba(210,60,50,0.5)', 7);
    for (let i = 0; i < 9; i++) {
      const sx = rnd() * Wp,
        sy = rnd() * Hp;
      const col = ['rgba(210,60,50,0.6)', 'rgba(70,120,210,0.6)', 'rgba(230,214,150,0.65)', 'rgba(90,180,110,0.55)'][i % 4];
      tape(sx - 8 * k, sy, sx + 8 * k, sy, col, 3.4);
      tape(sx, sy - 8 * k, sx, sy + 8 * k, col, 3.4);
    }
    // the dark house: a vignette
    c.fillStyle = rad(c, Wp / 2, Hp * 0.46, Math.min(Wp, Hp) * 0.3, Math.max(Wp, Hp) * 0.8, [0, 'rgba(255,225,170,0.08)', 0.55, 'rgba(0,0,0,0.18)', 1, 'rgba(0,0,0,0.6)']);
    c.fillRect(0, 0, Wp, Hp);
    return cv;
  }
  // the mat: black stage rubber with a fine tread, a hand-chalked border, and a warm pool from the one lamp above
  function buildRubber(k, dawn) {
    const M = Art.MAT;
    const pad = 28;
    const cv = document.createElement('canvas');
    cv.width = Math.ceil((M.w + pad * 2) * k);
    cv.height = Math.ceil((M.h + pad * 2) * k);
    const c = cv.getContext('2d');
    c.scale(k, k);
    c.translate(pad - M.x, pad - M.y);
    const rnd = U.rng(9911 + Math.round(dawn * 10));
    for (let i = 8; i >= 0; i--) {
      const t = i / 8;
      c.globalAlpha = 0.07 + (1 - t) * 0.07;
      c.fillStyle = '#000';
      c.beginPath();
      rrect(c, M.x - 2 - t * 8 + 2, M.y - 2 - t * 8 + 4, M.w + 4 + t * 16, M.h + 4 + t * 16, M.r + t * 8);
      c.fill();
    }
    c.globalAlpha = 1;
    c.beginPath();
    rrect(c, M.x, M.y, M.w, M.h, M.r);
    c.fillStyle = lin(c, M.x, M.y, M.x + M.w, M.y + M.h, [0, '#2b2e38', 0.5, '#22252e', 1, '#1b1d25']);
    c.fill();
    c.save();
    c.clip();
    // the tread: tiny diamonds
    c.strokeStyle = 'rgba(255,255,255,0.035)';
    c.lineWidth = 1;
    for (let d = -M.h; d < M.w + M.h; d += 11) {
      c.beginPath();
      c.moveTo(M.x + d, M.y);
      c.lineTo(M.x + d + M.h, M.y + M.h);
      c.moveTo(M.x + d + M.h, M.y);
      c.lineTo(M.x + d, M.y + M.h);
      c.stroke();
    }
    for (let i = 0; i < 3600; i++) {
      c.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.18)';
      c.fillRect(M.x + rnd() * M.w, M.y + rnd() * M.h, 1.2, 1.2);
    }
    // chalk: a few hand-drawn marks and dust (the roadie's) and the pool of the stage lamp
    c.strokeStyle = 'rgba(240,240,230,0.1)';
    c.lineWidth = 2;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(M.x + 30, M.y + 150);
    c.quadraticCurveTo(M.x + 120, M.y + 130, M.x + 250, M.y + 160);
    c.stroke();
    c.fillStyle = rad(c, M.x + M.w / 2, M.y + 210, 20, 360, [0, 'rgba(255,214,150,0.2)', 0.6, 'rgba(255,214,150,0.07)', 1, 'rgba(255,214,150,0)']);
    c.fillRect(M.x, M.y, M.w, M.h);
    c.restore();
    // the chalk border, drawn by hand (a little uneven, a few gaps)
    c.strokeStyle = 'rgba(244,244,236,0.62)';
    c.lineWidth = 2.2;
    c.setLineDash([14, 4, 9, 6]);
    c.lineCap = 'round';
    c.beginPath();
    rrect(c, M.x + 9, M.y + 9, M.w - 18, M.h - 18, M.r - 8);
    c.stroke();
    c.setLineDash([]);
    c.beginPath();
    rrect(c, M.x + 0.5, M.y + 0.5, M.w - 1, M.h - 1, M.r);
    c.strokeStyle = 'rgba(255,255,255,0.1)';
    c.lineWidth = 1;
    c.stroke();
    return { cv, pad, k };
  }
  const _s = Art.buildSurface,
    _m = Art.buildMat;
  Art.buildSurface = function (Wp, Hp, k, world) {
    return world === 'studio' ? buildStage(Wp, Hp, k) : _s(Wp, Hp, k, world);
  };
  Art.buildMat = function (k, dawn, tint, world) {
    return world === 'studio' ? buildRubber(k, dawn) : _m(k, dawn, tint, world);
  };

  /* ---------------------------------------------------------------- Tick, the metronome */
  // rt.arm: the pendulum's angle (radians, the Room swings it in time with the beat while Tick is awake)
  Art.DEVICES = Art.DEVICES || {};
  Art.DEVICES.metronome = function (ctx, dev, rt, t) {
    const on = rt.power === 'on';
    const lx = (rt.face ? rt.face.lookX : 0) * 1.8,
      ly = (rt.face ? rt.face.lookY : 0) * 1.4;
    const swing = on ? rt.arm || 0 : 0.0;
    // the pendulum (behind the case), a sliding brass weight on it
    ctx.save();
    ctx.translate(0, -8);
    ctx.rotate(swing);
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.lineTo(0, -40);
    ctx.strokeStyle = '#b9bcc8';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 0.9;
    ctx.stroke();
    ctx.beginPath();
    rrect(ctx, -7.5, -34, 15, 11, 3);
    ctx.fillStyle = lin(ctx, -7, -34, 7, -23, [0, '#fff0a8', 0.5, '#d9b84e', 1, '#9a7020']);
    ctx.fill();
    ctx.strokeStyle = 'rgba(70,40,0,0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    // the wooden case, a tapered pyramid
    ctx.beginPath();
    ctx.moveTo(-29, 46);
    ctx.lineTo(29, 46);
    ctx.lineTo(14, -8);
    ctx.lineTo(-14, -8);
    ctx.closePath();
    ctx.fillStyle = lin(ctx, -29, -8, 29, 46, [0, '#d9a066', 0.5, '#b57a40', 1, '#7d4d24']);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,230,190,0.5)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // the front plate (cream) with a tempo scale up the middle
    ctx.beginPath();
    ctx.moveTo(-23, 41);
    ctx.lineTo(23, 41);
    ctx.lineTo(11, -2);
    ctx.lineTo(-11, -2);
    ctx.closePath();
    ctx.fillStyle = lin(ctx, 0, -2, 0, 41, [0, '#f2e3c0', 1, '#d8c496']);
    ctx.fill();
    ctx.strokeStyle = 'rgba(90,55,18,0.45)';
    ctx.stroke();
    ctx.strokeStyle = 'rgba(90,55,18,0.4)';
    ctx.lineWidth = 0.9;
    for (let i = 0; i < 6; i++) {
      const yy = 2 + i * 4.2;
      const hw = 3.2 + i * 0.5;
      ctx.beginPath();
      ctx.moveTo(-hw, yy);
      ctx.lineTo(hw, yy);
      ctx.stroke();
    }
    // the face: two round eyes and a mouth below the scale
    for (const sx of [-1, 1]) {
      const ex = sx * 9.5,
        ey = 21;
      ctx.beginPath();
      ctx.arc(ex, ey, 5.6, 0, TAU);
      ctx.fillStyle = '#fffaf0';
      ctx.fill();
      ctx.strokeStyle = 'rgba(60,36,12,0.55)';
      ctx.lineWidth = 1;
      ctx.stroke();
      if (on) {
        ctx.beginPath();
        ctx.arc(ex + lx, ey + ly, 2.7, 0, TAU);
        ctx.fillStyle = '#2a1a0a';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ex + lx + 0.9, ey + ly - 1, 0.9, 0, TAU);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(ex - 3.4, ey);
        ctx.lineTo(ex + 3.4, ey);
        ctx.strokeStyle = '#2a1a0a';
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
    }
    ctx.beginPath();
    if (on) ctx.arc(0, 29.5, 4.2, 0.15, Math.PI - 0.15);
    else {
      ctx.moveTo(-3.4, 32);
      ctx.lineTo(3.4, 32);
    }
    ctx.strokeStyle = '#7a3a22';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // the base
    ctx.beginPath();
    rrect(ctx, -31, 44, 62, 5, 2);
    ctx.fillStyle = '#5a3818';
    ctx.fill();
    // the pivot, brass
    ctx.beginPath();
    ctx.arc(0, -8, 3.4, 0, TAU);
    ctx.fillStyle = '#e6c25a';
    ctx.fill();
    ctx.strokeStyle = 'rgba(70,40,0,0.6)';
    ctx.lineWidth = 0.9;
    ctx.stroke();
  };

  // a golden guitar pick: the secret of Level 26 (smudge the chalkboard)
  Art.SECRETS2 = Art.SECRETS2 || {};
  Art.SECRETS2.goldpick = function (ctx) {
    ctx.rotate(0.35);
    ctx.beginPath();
    ctx.moveTo(0, 11);
    ctx.bezierCurveTo(-13, 3, -11, -10, 0, -10);
    ctx.bezierCurveTo(11, -10, 13, 3, 0, 11);
    ctx.closePath();
    ctx.fillStyle = lin(ctx, -10, -10, 10, 11, [0, '#fff0a8', 1, '#c9922e']);
    ctx.fill();
    ctx.strokeStyle = 'rgba(110,70,0,0.7)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = 'rgba(110,70,0,0.55)';
    ctx.font = '800 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', 0, -1);
  };
  // the golden drumstick (Level 29): a stick at an angle with a round wooden-bead tip, brass-gold, the stroke a dark bronze
  Art.SECRETS2.golddrumstick = function (ctx) {
    ctx.rotate(-0.7);
    ctx.beginPath();
    Art.rrect(ctx, -2.6, -4, 5.2, 25, 2.4);
    ctx.fillStyle = lin(ctx, -3, 0, 3, 0, [0, '#fff0a8', 1, '#c9922e']);
    ctx.fill();
    ctx.strokeStyle = 'rgba(110,70,0,0.7)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -8, 5.4, 0, Math.PI * 2);
    ctx.fillStyle = lin(ctx, -5, -13, 5, -3, [0, '#fff6c8', 1, '#c9922e']);
    ctx.fill();
    ctx.stroke();
  };

  // the golden plug (Level 28): a brass-gold plug head with two prongs, the secret for a seat made on the beat
  Art.SECRETS2.goldplug = function (ctx) {
    ctx.rotate(0.2);
    ctx.beginPath();
    Art.rrect(ctx, -9, -10, 18, 14, 3.5);
    ctx.fillStyle = lin(ctx, -9, -10, 9, 4, [0, '#fff6c8', 1, '#c9922e']);
    ctx.fill();
    ctx.strokeStyle = 'rgba(110,70,0,0.7)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#c9922e';
    ctx.fillRect(-5, 4, 2.6, 9);
    ctx.fillRect(2.4, 4, 2.6, 9);
  };

  // the speaker wall (Level 28): a wall of cabinets whose cones pump on every kick (rt.kick 0..1); its face blushes at the Wake (rt.blush 0..1)
  Art.DECOR2.speakerwall = {
    draw(ctx, d, rt, t) {
      const w = d.w || 270,
        h = d.h || 120,
        x0 = -w / 2,
        y0 = -h / 2,
        k = rt.kick || 0,
        bl = rt.blush || 0;
      // the cabinet and its warm piping
      ctx.beginPath();
      Art.rrect(ctx, x0, y0, w, h, 12);
      ctx.fillStyle = lin(ctx, 0, y0, 0, y0 + h, [0, '#3b3f4d', 1, '#1d2029']);
      ctx.fill();
      ctx.strokeStyle = 'rgba(' + (255 * (0.35 + 0.5 * bl)).toFixed(0) + ',' + (200 - 80 * bl).toFixed(0) + ',150,' + (0.3 + 0.4 * bl).toFixed(3) + ')';
      ctx.lineWidth = 3;
      ctx.stroke();
      // the grille: a cloth weave across the whole front
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      for (let x = x0 + 8; x < x0 + w - 4; x += 6) {
        ctx.beginPath();
        ctx.moveTo(x, y0 + 36);
        ctx.lineTo(x, y0 + h - 8);
        ctx.stroke();
      }
      // three woofers: the cones pump outward with the kick, the dust caps shine
      for (const fx of [-0.27, 0, 0.27]) {
        const cx = x0 + w / 2 + fx * w,
          cy = y0 + h * 0.6,
          R = h * 0.27,
          s = 1 + 0.07 * k;
        ctx.beginPath();
        ctx.arc(cx, cy, R * 1.12, 0, Math.PI * 2);
        ctx.fillStyle = '#14161d';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy, R * s, 0, Math.PI * 2);
        ctx.fillStyle = lin(ctx, cx - R, cy - R, cx + R, cy + R, [0, '#4a4f62', 1, '#232631']);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy, R * 0.34 * s, 0, Math.PI * 2);
        ctx.fillStyle = lin(ctx, cx - 4, cy - 4, cx + 4, cy + 4, [0, '#f0f3f8', 1, '#8d94a6']);
        ctx.fill();
      }
      // two tweeters at the top corners
      for (const fx of [-0.42, 0.42]) {
        ctx.beginPath();
        ctx.arc(x0 + w / 2 + fx * w, y0 + h * 0.2, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#0f1117';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      // the wall's face, on the panel between the tweeters: sleepy and flat, then a blushing smile at the Wake
      const fx0 = x0 + w / 2,
        fy = y0 + h * 0.2;
      ctx.fillStyle = 'rgba(255,120,140,' + (0.55 * bl).toFixed(3) + ')';
      for (const sx of [-22, 22]) {
        ctx.beginPath();
        ctx.ellipse(fx0 + sx, fy + 9, 5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = '#e8ecf4';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      for (const sx of [-10, 10]) {
        ctx.beginPath();
        ctx.moveTo(fx0 + sx - 3.5, fy - 1 - 2 * bl);
        ctx.quadraticCurveTo(fx0 + sx, fy - 4 - 2 * bl, fx0 + sx + 3.5, fy - 1 - 2 * bl);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(fx0 - 7, fy + 5);
      ctx.quadraticCurveTo(fx0, fy + 5 + 7 * bl, fx0 + 7, fy + 5);
      ctx.stroke();
    },
  };

  // the golden microphone (Level 30): a capsule of brass with a ring of light round it, the secret of the boss
  Art.SECRETS2.goldmic = function (ctx) {
    ctx.beginPath();
    ctx.ellipse(0, -5, 6.5, 9, 0, 0, Math.PI * 2);
    ctx.fillStyle = lin(ctx, -6, -14, 6, 4, [0, '#fff6c8', 1, '#c9922e']);
    ctx.fill();
    ctx.strokeStyle = 'rgba(110,70,0,0.7)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.lineTo(0, 13);
    ctx.strokeStyle = '#c9922e';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -5, 12, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,236,160,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  };

  // a stage spot on a bar (Level 30): a lamp can, and when it is lit (rt.lit 0..1) a cone of light falling onto the stage, flickering a little
  Art.DECOR2.spot = {
    draw(ctx, d, rt, t) {
      const L = rt.lit || 0;
      if (L > 0.01) {
        const flick = 0.92 + 0.08 * Math.sin(t * 9 + d.x);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.2 * L * flick;
        ctx.beginPath();
        ctx.moveTo(-7, 6);
        ctx.lineTo(7, 6);
        ctx.lineTo(74, 180);
        ctx.lineTo(-74, 180);
        ctx.closePath();
        ctx.fillStyle = lin(ctx, 0, 6, 0, 180, [0, 'rgba(255,240,200,0.9)', 1, 'rgba(255,240,200,0)']);
        ctx.fill();
        // the pool of light on the stage: a soft oval that falls off to its edge, not a flat disc
        ctx.globalAlpha = 0.5 * L * flick;
        ctx.translate(0, 180);
        ctx.scale(1, 0.28);
        ctx.beginPath();
        ctx.arc(0, 0, 80, 0, Math.PI * 2);
        ctx.fillStyle = Art.rad(ctx, 0, 0, 2, 80, [0, 'rgba(255,236,190,0.75)', 1, 'rgba(255,236,190,0)']);
        ctx.fill();
        ctx.restore();
      }
      ctx.beginPath();
      Art.rrect(ctx, -13, -8, 26, 17, 4);
      ctx.fillStyle = L > 0.5 ? '#fff1c8' : '#4a4d58';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    },
  };

  // a standing microphone at the front of the stage (Level 30): tap it three times for the golden one; its capsule shines once found
  Art.DECOR2.mic = {
    draw(ctx, d, rt, t) {
      ctx.beginPath();
      ctx.ellipse(0, 26, 14, 4, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#20232c';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, 24);
      ctx.lineTo(0, -6);
      ctx.strokeStyle = '#7a8194';
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, -14, 7.5, 11, 0, 0, Math.PI * 2);
      ctx.fillStyle = rt.found ? lin(ctx, -8, -24, 8, -4, [0, '#fff6c8', 1, '#c9922e']) : lin(ctx, -8, -24, 8, -4, [0, '#c9ced8', 1, '#5a6070']);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 0.8;
      for (let y = -20; y <= -8; y += 4) {
        ctx.beginPath();
        ctx.moveTo(-6, y);
        ctx.lineTo(6, y);
        ctx.stroke();
      }
    },
  };

  /* ---------------------------------------------------------------- the roadie's chalkboard */
  // d: { x, y, w, h, nodes: [{ id, x, y, label, color }] (x, y from the board's centre), edges: [{ a, b, kind: 'after' | 'clash' }], note }
  // rt.edgeOn[i]: the relation is satisfied now (an arrow glows warm; a bolt stays dim)
  const chalk = (ctx, col, w) => {
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };
  const wob = (ctx, x0, y0, x1, y1, seed, w) => {
    // a hand-drawn line: two passes with a little wobble
    for (let p = 0; p < 2; p++) {
      ctx.beginPath();
      ctx.moveTo(x0 + (p ? 0.6 : -0.4), y0 + (p ? -0.5 : 0.4));
      const mx = (x0 + x1) / 2 + Math.sin(seed * 3.1 + p) * 1.4,
        my = (y0 + y1) / 2 + Math.cos(seed * 2.3 + p) * 1.4;
      ctx.quadraticCurveTo(mx, my, x1 + (p ? -0.5 : 0.5), y1 + (p ? 0.4 : -0.3));
      ctx.lineWidth = w * (p ? 0.7 : 1);
      ctx.stroke();
    }
  };
  Art.DECOR2.chalkboard = {
    draw(ctx, d, rt, t) {
      const w = d.w || 280,
        h = d.h || 96,
        x0 = -w / 2,
        y0 = -h / 2;
      // the frame and the slate
      ctx.beginPath();
      rrect(ctx, x0 - 6, y0 - 6, w + 12, h + 12, 7);
      ctx.fillStyle = lin(ctx, 0, y0, 0, y0 + h, [0, '#8a5d34', 1, '#5e3c1c']);
      ctx.fill();
      ctx.strokeStyle = 'rgba(30,16,4,0.7)';
      ctx.lineWidth = 1.3;
      ctx.stroke();
      ctx.beginPath();
      rrect(ctx, x0, y0, w, h, 3);
      ctx.fillStyle = lin(ctx, x0, y0, x0 + w, y0 + h, [0, '#34403d', 1, '#232d2b']);
      ctx.fill();
      // old chalk dust
      ctx.save();
      ctx.clip();
      ctx.fillStyle = 'rgba(235,235,225,0.06)';
      for (let i = 0; i < 7; i++) ctx.fillRect(x0 + ((i * 53) % w) - 10, y0 + ((i * 29) % h) - 4, 70, 9);
      ctx.restore();
      // a wipe of the sleeve across it when the secret has been found (a thumb smudged the chalk)
      if (rt && rt.found) {
        ctx.save();
        ctx.beginPath();
        rrect(ctx, x0, y0, w, h, 3);
        ctx.clip();
        ctx.fillStyle = 'rgba(235,235,225,0.10)';
        ctx.beginPath();
        ctx.ellipse(x0 + w * 0.62, y0 + h * 0.5, w * 0.3, h * 0.28, -0.25, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
      // the chalk ledge
      ctx.beginPath();
      rrect(ctx, x0 + 18, y0 + h + 2, w - 36, 5, 2);
      ctx.fillStyle = '#6b4523';
      ctx.fill();
      ctx.fillStyle = '#f4f0e0';
      ctx.fillRect(x0 + w - 70, y0 + h - 3, 15, 4.4);
      ctx.fillStyle = '#e8c070';
      ctx.fillRect(x0 + w - 50, y0 + h - 3, 11, 4.4);
      const nodes = {};
      for (const n of d.nodes || []) nodes[n.id] = n;
      const edgeOn = (rt && rt.edgeOn) || [];
      (d.edges || []).forEach((e, i) => {
        const a = nodes[e.a],
          b = nodes[e.b];
        if (!a || !b) return;
        const dx = b.x - a.x,
          dy = b.y - a.y,
          n = Math.hypot(dx, dy) || 1,
          ux = dx / n,
          uy = dy / n;
        const sx = a.x + ux * 17,
          sy = a.y + uy * 17,
          ex = b.x - ux * 18,
          ey = b.y - uy * 18;
        const on = edgeOn[i];
        if (e.kind === 'after') {
          chalk(ctx, on ? '#ffe9a0' : 'rgba(244,244,236,0.88)', 2.2);
          wob(ctx, sx, sy, ex, ey, i + 1, 2.2);
          ctx.beginPath();
          ctx.moveTo(ex, ey);
          ctx.lineTo(ex - ux * 7 - uy * 4.4, ey - uy * 7 + ux * 4.4);
          ctx.moveTo(ex, ey);
          ctx.lineTo(ex - ux * 7 + uy * 4.4, ey - uy * 7 - ux * 4.4);
          ctx.stroke();
          if (on) {
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = rad(ctx, (sx + ex) / 2, (sy + ey) / 2, 1, 16, [0, 'rgba(255,225,140,0.35)', 1, 'rgba(255,225,140,0)']);
            ctx.fillRect((sx + ex) / 2 - 16, (sy + ey) / 2 - 16, 32, 32);
            ctx.globalCompositeOperation = 'source-over';
          }
        } else {
          // a clash: a chalk bolt between the two, red when they are neighbours
          const mx = (a.x + b.x) / 2,
            my = (a.y + b.y) / 2;
          chalk(ctx, on ? 'rgba(255,120,100,0.95)' : 'rgba(255,170,150,0.8)', 2.3);
          ctx.beginPath();
          ctx.moveTo(mx - 7, my - 11);
          ctx.lineTo(mx + 2, my - 2);
          ctx.lineTo(mx - 3, my + 1);
          ctx.lineTo(mx + 7, my + 12);
          ctx.stroke();
          chalk(ctx, 'rgba(255,170,150,0.55)', 1.4);
          wob(ctx, a.x + ux * 17, a.y + uy * 17, mx - ux * 9, my - uy * 9, i + 5, 1.4);
          wob(ctx, mx + ux * 9, my + uy * 9, b.x - ux * 18, b.y - uy * 18, i + 7, 1.4);
        }
      });
      for (const n of d.nodes || []) {
        // a chalk circle with a coloured dot (the colour of the device's cable) and its name
        chalk(ctx, 'rgba(244,244,236,0.9)', 1.8);
        for (let p = 0; p < 2; p++) {
          ctx.beginPath();
          ctx.ellipse(n.x + (p ? 0.5 : 0), n.y + (p ? -0.4 : 0), 19.6 - p * 0.4, 15.4 + p * 0.5, p * 0.2, 0.2 + p * 0.3, TAU + 0.1 + p * 0.3);
          ctx.lineWidth = p ? 1.2 : 1.9;
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(n.x, n.y - 3, 4.2, 0, TAU);
        ctx.fillStyle = Art.KEYCOL[n.color] || '#fff';
        ctx.fill();
        ctx.font = '700 8.2px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(248,248,240,0.92)';
        ctx.fillText(n.label, n.x, n.y + 7.2);
      }
      // the roadie's note: which way the beat goes
      if (d.note) {
        ctx.font = 'italic 700 10px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(248,240,200,0.78)';
        ctx.fillText(d.note, x0 + 10, y0 + 12);
      }
    },
    shadow: (ctx, d) => Art.shadow(ctx, d.x, d.y + 6, (d.w || 280) + 22, (d.h || 96) + 22, 8, 0, 0.4, 0.5),
  };

  /* ---------------------------------------------------------------- the flight case: a foam bed the strip lies in */
  Art.DECOR2.flightcase = {
    draw(ctx, d, rt, t) {
      const w = d.w || 308,
        h = d.h || 88,
        x0 = -w / 2,
        y0 = -h / 2;
      // the case: brushed aluminium trim with rivets
      ctx.beginPath();
      rrect(ctx, x0 - 8, y0 - 8, w + 16, h + 16, 9);
      ctx.fillStyle = lin(ctx, 0, y0 - 8, 0, y0 + h + 8, [0, '#b8bcc6', 0.5, '#8d919c', 1, '#6c707b']);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 1.3;
      ctx.stroke();
      ctx.fillStyle = 'rgba(40,42,50,0.7)';
      for (let i = 0; i < 12; i++) {
        const rx = x0 - 3 + (i / 11) * (w + 6);
        ctx.beginPath();
        ctx.arc(rx, y0 - 3.6, 1.3, 0, TAU);
        ctx.arc(rx, y0 + h + 3.6, 1.3, 0, TAU);
        ctx.fill();
      }
      // the foam: charcoal egg-crate
      ctx.beginPath();
      rrect(ctx, x0, y0, w, h, 4);
      ctx.fillStyle = '#23252c';
      ctx.fill();
      ctx.save();
      ctx.clip();
      for (let j = 0; j * 11 < h + 11; j++)
        for (let i = 0; i * 11 < w + 11; i++) {
          const cx = x0 + i * 11 + (j % 2 ? 5.5 : 0),
            cy = y0 + j * 11 + 5.5;
          ctx.beginPath();
          ctx.arc(cx, cy, 4.6, 0, TAU);
          ctx.fillStyle = 'rgba(70,74,86,0.55)';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(cx - 1, cy - 1, 2.2, 0, TAU);
          ctx.fillStyle = 'rgba(140,146,160,0.18)';
          ctx.fill();
        }
      // the cut-out the strip lies in
      const cw = d.cutW || w - 12,
        ch = d.cutH || 62;
      ctx.beginPath();
      rrect(ctx, -cw / 2, -ch / 2, cw, ch, 8);
      ctx.fillStyle = 'rgba(8,9,12,0.8)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(120,126,140,0.28)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
    },
    shadow: (ctx, d) => Art.shadow(ctx, d.x, d.y + 5, (d.w || 308) + 20, (d.h || 88) + 20, 9, 0, 0.4, 0.5),
  };

  /* ---------------------------------------------------------------- a chalk staff on the mat (Level 27): the tune appears on it as it plays */
  // d: { x, y (the staff's centre), w, steps: [x of each step, from the centre] }; rt.notes[k] = { midi, t, hold }
  const DIA = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
  const diatonic = (m) => 7 * Math.floor(m / 12) + DIA[m % 12];
  Art.DECOR2.staff = {
    draw(ctx, d, rt, t) {
      const w = d.w || 270,
        x0 = -w / 2,
        gap = 8,
        yb = 16; // the bottom line (E4)
      ctx.save();
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(240,240,230,0.2)';
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(x0, yb - i * gap);
        ctx.lineTo(x0 + w, yb - i * gap + (i % 2 ? 0.6 : -0.4));
        ctx.stroke();
      }
      // a treble clef, drawn by hand in chalk
      ctx.strokeStyle = 'rgba(240,240,230,0.3)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(x0 + 22, yb + 9);
      ctx.bezierCurveTo(x0 + 10, yb + 12, x0 + 8, yb + 2, x0 + 20, yb - 4);
      ctx.bezierCurveTo(x0 + 36, yb - 12, x0 + 28, yb - 36, x0 + 18, yb - 36);
      ctx.bezierCurveTo(x0 + 8, yb - 36, x0 + 14, yb - 12, x0 + 30, yb - 6);
      ctx.bezierCurveTo(x0 + 40, yb - 2, x0 + 36, yb + 8, x0 + 26, yb + 4);
      ctx.stroke();
      // the notes that have played: a head on the staff at the step's x and the note's pitch, which glows and fades
      const base = diatonic(64);
      (rt && rt.notes ? rt.notes : []).forEach((n, k) => {
        if (!n) return;
        const age = (rt.now || 0) - n.t;
        const a = age < n.hold ? 1 : Math.max(0, 1 - (age - n.hold) / 1.2);
        if (a <= 0.01) return;
        const p = diatonic(n.midi) - base,
          nx = (d.steps || [])[k] || 0,
          ny = yb - p * (gap / 2);
        const fresh = Math.max(0, 1 - age / 0.5);
        ctx.fillStyle = 'rgba(255,238,190,' + (0.85 * a).toFixed(3) + ')';
        ctx.strokeStyle = 'rgba(255,238,190,' + (0.9 * a).toFixed(3) + ')';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(nx, ny, 5.6, 4.1, -0.35, 0, TAU);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(nx + 5, ny - 1);
        ctx.lineTo(nx + 5, ny - 25);
        ctx.stroke();
        if (p < 0 || p > 8) {
          ctx.beginPath();
          ctx.moveTo(nx - 9, yb - Math.round(p / 2) * gap);
          ctx.lineTo(nx + 9, yb - Math.round(p / 2) * gap);
          ctx.stroke();
        }
        if (fresh > 0.02) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = rad(ctx, nx, ny, 1, 20, [0, 'rgba(255,230,150,' + (0.5 * fresh).toFixed(3) + ')', 1, 'rgba(255,230,150,0)']);
          ctx.fillRect(nx - 20, ny - 20, 40, 40);
          ctx.globalCompositeOperation = 'source-over';
        }
      });
      ctx.restore();
    },
    shadow: () => {},
  };
})();
