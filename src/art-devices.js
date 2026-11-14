/* Snug — art-devices.js : the cast (phones, tablet, laptop, console, lamp, radio), faces, and desk decor.
   Everything is drawn in stage units. Faces are procedural: eyes first, body second, light third. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const U = G.U,
    Art = G.Art,
    Rules = G.Rules;
  const TAU = U.TAU;
  const rrect = Art.rrect,
    lin = Art.lin,
    rad = Art.rad;
  const INK = '#171a26';

  /* ---------------------------------------------------------------- faces */
  // f: { eyeOpen, blink, lookX, lookY, brow, squint, smile, open, sweat, blush }
  Art.newFace = function () {
    return { eyeOpen: 0, blink: 0, lookX: 0, lookY: 0, brow: 0, squint: 0, smile: 0, open: 0, sweat: 0, blush: 0 };
  };
  Art.face = function (ctx, f, s, o, ink) {
    ink = ink || INK;
    const ex = o.eyeX * s,
      rw = o.eyeW * s,
      rh = o.eyeH * s;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const open = U.sat(f.eyeOpen * (1 - f.blink));
    for (const sx of [-1, 1]) {
      ctx.save();
      ctx.translate(sx * ex, 0);
      if (f.squint > 0.5) {
        ctx.beginPath();
        ctx.moveTo(-sx * rw * 0.95, -rh * 0.85);
        ctx.lineTo(sx * rw * 0.95, 0);
        ctx.lineTo(-sx * rw * 0.95, rh * 0.85);
        ctx.lineWidth = 1.9 * s;
        ctx.strokeStyle = ink;
        ctx.stroke();
      } else if (open < 0.14) {
        ctx.beginPath();
        if (f.smile > 0.55) ctx.arc(0, rh * 0.35, rw * 0.95, Math.PI * 1.12, Math.PI * 1.88);
        else ctx.arc(0, -rh * 0.25, rw * 0.9, Math.PI * 0.12, Math.PI * 0.88);
        ctx.lineWidth = 1.7 * s;
        ctx.strokeStyle = ink;
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.ellipse(0, 0, rw, rh * open, 0, 0, TAU);
        ctx.fillStyle = '#fbfbff';
        ctx.fill();
        const px = f.lookX * rw * 0.42,
          py = f.lookY * rh * 0.42 * open;
        ctx.beginPath();
        ctx.ellipse(px, py, rw * 0.58, rh * 0.66 * open, 0, 0, TAU);
        ctx.fillStyle = ink;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px - rw * 0.2, py - rh * 0.28 * open, rw * 0.2, 0, TAU);
        ctx.fillStyle = '#fff';
        ctx.fill();
      }
      // brows: positive = curious (inner ends raised); negative = pained (inner ends lowered)
      if (Math.abs(f.brow) > 0.05 && f.squint < 0.5 && open > 0.2) {
        ctx.beginPath();
        const by = -rh * open - 2.4 * s - Math.max(0, f.brow) * 0.9 * s;
        const inner = by - f.brow * 1.5 * s,
          outer = by + f.brow * 0.5 * s;
        ctx.moveTo(-rw, sx < 0 ? outer : inner);
        ctx.lineTo(rw, sx < 0 ? inner : outer);
        ctx.lineWidth = 1.4 * s;
        ctx.strokeStyle = ink;
        ctx.stroke();
      }
      // blush
      if (f.blush > 0.02) {
        ctx.beginPath();
        ctx.ellipse(sx * 1.5 * s, rh + 3.2 * s, 3.3 * s, 1.9 * s, 0, 0, TAU);
        ctx.fillStyle = 'rgba(255,120,130,' + 0.45 * f.blush + ')';
        ctx.fill();
      }
      ctx.restore();
    }
    // mouth
    const my = o.mouthY * s,
      mw = (o.mouthW || 4) * s;
    ctx.beginPath();
    if (f.open > 0.1) {
      ctx.ellipse(0, my, mw * 0.7, (1.5 + f.open * 3.2) * s, 0, 0, TAU);
      ctx.fillStyle = 'rgba(40,16,24,0.85)';
      ctx.fill();
    } else {
      ctx.moveTo(-mw, my);
      ctx.quadraticCurveTo(0, my + f.smile * mw * 1.15, mw, my);
      ctx.lineWidth = 1.6 * s;
      ctx.strokeStyle = ink;
      ctx.stroke();
    }
    // sweat drop
    if (f.sweat > 0.25) {
      const sx = ex + rw + 2.2 * s,
        sy = -rh * 0.9 + (1 - f.sweat) * 3 * s;
      ctx.beginPath();
      ctx.moveTo(sx, sy - 3.2 * s);
      ctx.quadraticCurveTo(sx + 2.4 * s, sy + 0.4 * s, sx, sy + 2.2 * s);
      ctx.quadraticCurveTo(sx - 2.4 * s, sy + 0.4 * s, sx, sy - 3.2 * s);
      ctx.fillStyle = 'rgba(150,215,255,' + Math.min(1, f.sweat) + ')';
      ctx.fill();
    }
    ctx.restore();
  };

  Art.battery = function (ctx, x, y, s, fill, charging, t, lowBlink) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.beginPath();
    rrect(ctx, -8, -4, 15, 8, 2.2);
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = lowBlink ? 'rgba(255,90,80,' + (0.45 + 0.4 * Math.sin(t * 5)) + ')' : 'rgba(255,255,255,0.9)';
    ctx.stroke();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fillRect(7.6, -1.6, 1.6, 3.2);
    if (fill > 0.01) {
      ctx.beginPath();
      rrect(ctx, -6.9, -2.9, 12.8 * fill, 5.8, 1.4);
      ctx.fillStyle = fill < 0.2 ? '#ff8a7a' : '#aaf0c0';
      ctx.fill();
    }
    if (charging) {
      ctx.beginPath();
      ctx.moveTo(0.8, -6.5);
      ctx.lineTo(-2.6, 0.6);
      ctx.lineTo(-0.2, 0.6);
      ctx.lineTo(-1.2, 6.5);
      ctx.lineTo(2.8, -1);
      ctx.lineTo(0.4, -1);
      ctx.closePath();
      ctx.fillStyle = '#fff3a6';
      ctx.fill();
    }
    ctx.restore();
  };

  /* ---------------------------------------------------------------- screen devices (phone, tablet) */
  const SPEC = {
    phone: { w: 50, h: 92, r: 9, ins: 3.6, faceY: -10, s: 1, eye: { eyeX: 8.6, eyeW: 4.1, eyeH: 6.2, mouthY: 10.5, mouthW: 4.6 }, battY: 29 },
    tablet: { w: 76, h: 104, r: 11, ins: 5, faceY: -8, s: 1.5, eye: { eyeX: 8.8, eyeW: 4.2, eyeH: 6.4, mouthY: 11, mouthW: 4.8 }, battY: 33 },
  };

  Art.deviceShadow = function (ctx, dev, rt) {
    const m = dev.meta;
    const hop = (rt && rt.hop) || 0;
    Art.shadow(ctx, dev.x, dev.y, m.w, m.h, dev.type === 'lamp' ? 20 : 11, dev.angle, 0.12 + hop * 1.4, 0.55);
  };

  function screenDevice(ctx, dev, rt, t, sp) {
    const col = Art.KEYCOL[dev.color] || Art.KEYCOL.mint;
    const w = sp.w,
      h = sp.h;
    // case
    ctx.beginPath();
    rrect(ctx, -w / 2, -h / 2, w, h, sp.r);
    ctx.fillStyle = lin(ctx, -w / 2, -h / 2, w / 2, h / 2, [0, U.shade(col, 0.28), 0.5, U.shade(col, -0.12), 1, U.shade(col, -0.38)]);
    ctx.fill();
    ctx.beginPath();
    rrect(ctx, -w / 2 + 0.6, -h / 2 + 0.6, w - 1.2, h - 1.2, sp.r - 0.6);
    ctx.strokeStyle = lin(ctx, -w / 2, -h / 2, w / 2, h / 2, [0, 'rgba(255,255,255,0.75)', 0.5, 'rgba(255,255,255,0.1)', 1, 'rgba(0,0,0,0.3)']);
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // screen
    const sw = w - sp.ins * 2,
      sh = h - sp.ins * 2,
      sr = Math.max(4, sp.r - sp.ins * 0.7);
    ctx.save();
    ctx.beginPath();
    rrect(ctx, -sw / 2, -sh / 2, sw, sh, sr);
    ctx.clip();
    ctx.fillStyle = '#0b0f1a';
    ctx.fillRect(-sw / 2, -sh / 2, sw, sh);
    const bloom = rt.bloom;
    if (rt.power === 'on' && bloom > 0.001) {
      // wallpaper reveals radially from the port
      ctx.save();
      if (bloom < 1) {
        ctx.beginPath();
        ctx.arc(0, h / 2, bloom * Math.hypot(w, h) * 1.05, 0, TAU);
        ctx.clip();
      }
      ctx.fillStyle = lin(ctx, -sw / 2, -sh / 2, sw / 2, sh / 2, [0, U.shade(col, 0.32), 0.55, U.shade(col, -0.05), 1, U.shade(col, -0.45)]);
      ctx.fillRect(-sw / 2, -sh / 2, sw, sh);
      ctx.fillStyle = rad(ctx, -sw * 0.2, -sh * 0.32, 2, sw, [0, 'rgba(255,255,255,0.32)', 1, 'rgba(255,255,255,0)']);
      ctx.fillRect(-sw / 2, -sh / 2, sw, sh);
      // a soft clock glow
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      ctx.fillRect(-sw * 0.3, -sh * 0.44, sw * 0.6, 3);
      ctx.restore();
    } else {
      // dark glass with a faint reflection
      ctx.fillStyle = lin(ctx, -sw / 2, -sh / 2, sw / 2, sh / 2, [0, 'rgba(255,255,255,0.08)', 0.4, 'rgba(255,255,255,0.01)', 1, 'rgba(255,255,255,0)']);
      ctx.fillRect(-sw / 2, -sh / 2, sw, sh);
    }
    ctx.restore();
    // camera dot
    ctx.beginPath();
    ctx.arc(0, -h / 2 + sp.ins + 3, 1.4, 0, TAU);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fill();
    // face
    ctx.save();
    ctx.translate(0, sp.faceY);
    const dim = rt.power === 'on' ? 1 : 0.55;
    ctx.globalAlpha = rt.power === 'on' ? Math.min(1, 0.25 + bloom * 1.2) : dim;
    Art.face(ctx, rt.face, sp.s, sp.eye, rt.power === 'on' ? INK : '#8e9bc4');
    ctx.restore();
    // battery area
    if (rt.power === 'on') {
      const pct = Math.round(12 + 88 * rt.batt);
      ctx.globalAlpha = Math.min(1, bloom * 1.5);
      Art.battery(ctx, 0, sp.battY * (sp.s > 1 ? 1.0 : 1.0), sp.s * 0.9, rt.batt, true, t, false);
      ctx.font = '800 ' + 8 * sp.s * 0.95 + 'px ' + Art.FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.fillText(pct + '%', 0, sp.battY - 11 * sp.s * 0.8);
      ctx.globalAlpha = 1;
    } else {
      // low-battery outline blinking, standby LED
      ctx.globalAlpha = 0.9;
      Art.battery(ctx, 0, sp.battY, sp.s * 0.9, 0.0, false, t, true);
      ctx.globalAlpha = 1;
      if (rt.power === 'standby') {
        ctx.beginPath();
        ctx.arc(w / 2 - sp.ins - 4, -h / 2 + sp.ins + 4, 2, 0, TAU);
        ctx.fillStyle = 'rgba(255,190,70,' + (0.55 + 0.45 * Math.sin(t * 4)) + ')';
        ctx.fill();
      }
    }
    // port notch
    ctx.beginPath();
    rrect(ctx, -4.5, h / 2 - 3.2, 9, 3.4, 1.4);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fill();
  }

  /* ---------------------------------------------------------------- laptop (open, top-down) */
  function laptop(ctx, dev, rt, t) {
    const col = Art.KEYCOL[dev.color] || Art.KEYCOL.sky;
    const w = 100,
      h = 86;
    // deck
    ctx.beginPath();
    rrect(ctx, -w / 2, 10, w, 33, 9);
    ctx.fillStyle = lin(ctx, 0, 10, 0, 43, [0, '#dcdde2', 0.6, '#b8bac2', 1, '#9a9ca6']);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 1;
    ctx.stroke();
    // keys
    ctx.fillStyle = 'rgba(40,44,56,0.5)';
    for (let r = 0; r < 3; r++) for (let c = 0; c < 13; c++) {
      ctx.beginPath();
      rrect(ctx, -45 + c * 7, 14 + r * 6.2, 5.4, 4.6, 1.2);
      ctx.fill();
    }
    ctx.beginPath();
    rrect(ctx, -11, 33, 22, 7, 2.5);
    ctx.fillStyle = 'rgba(40,44,56,0.2)';
    ctx.fill();
    // hinge
    ctx.fillStyle = 'rgba(30,32,40,0.55)';
    ctx.fillRect(-w / 2 + 3, 8.4, w - 6, 2.6);
    // screen lid
    ctx.beginPath();
    rrect(ctx, -w / 2, -43, w, 54, 8);
    ctx.fillStyle = lin(ctx, -w / 2, -43, w / 2, 11, [0, U.shade(col, 0.2), 1, U.shade(col, -0.4)]);
    ctx.fill();
    // screen
    const sw = w - 9,
      sh = 54 - 9;
    ctx.save();
    ctx.beginPath();
    rrect(ctx, -sw / 2, -43 + 4.5, sw, sh, 4);
    ctx.clip();
    ctx.fillStyle = '#0b0f1a';
    ctx.fillRect(-sw / 2, -39, sw, sh);
    if (rt.power === 'on' && rt.bloom > 0.001) {
      ctx.save();
      if (rt.bloom < 1) {
        ctx.beginPath();
        ctx.arc(0, 43, rt.bloom * 150, 0, TAU);
        ctx.clip();
      }
      ctx.fillStyle = lin(ctx, -sw / 2, -39, sw / 2, 6, [0, U.shade(col, 0.4), 0.6, U.shade(col, 0.0), 1, U.shade(col, -0.4)]);
      ctx.fillRect(-sw / 2, -39, sw, sh);
      ctx.fillStyle = rad(ctx, -sw * 0.25, -32, 2, sw * 0.8, [0, 'rgba(255,255,255,0.3)', 1, 'rgba(255,255,255,0)']);
      ctx.fillRect(-sw / 2, -39, sw, sh);
      // scanning light on boot
      if (rt.wake >= 0 && rt.wake < 0.9) {
        const sx = -sw / 2 + (sw * rt.wake) / 0.9;
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillRect(sx - 2, -39, 4, sh);
      }
      ctx.restore();
    } else {
      ctx.fillStyle = lin(ctx, -sw / 2, -39, sw / 2, 6, [0, 'rgba(255,255,255,0.08)', 0.5, 'rgba(255,255,255,0)', 1, 'rgba(255,255,255,0)']);
      ctx.fillRect(-sw / 2, -39, sw, sh);
    }
    ctx.restore();
    ctx.save();
    ctx.translate(0, -14);
    ctx.globalAlpha = rt.power === 'on' ? Math.min(1, 0.25 + rt.bloom * 1.2) : 0.55;
    Art.face(ctx, rt.face, 1.25, { eyeX: 11, eyeW: 4.2, eyeH: 6.2, mouthY: 10, mouthW: 4.6 }, rt.power === 'on' ? INK : '#8e9bc4');
    ctx.restore();
    if (rt.power !== 'on') {
      Art.battery(ctx, 0, 3.4, 0.8, 0, false, t, true);
      if (rt.power === 'standby') {
        ctx.beginPath();
        ctx.arc(w / 2 - 8, -43 + 8, 2, 0, TAU);
        ctx.fillStyle = 'rgba(255,190,70,' + (0.55 + 0.45 * Math.sin(t * 4)) + ')';
        ctx.fill();
      }
    }
  }

  /* ---------------------------------------------------------------- console (Gus) */
  function consoleDev(ctx, dev, rt, t) {
    const col = Art.KEYCOL[dev.color] || Art.KEYCOL.violet;
    const w = 84,
      h = 58;
    ctx.beginPath();
    rrect(ctx, -w / 2, -h / 2, w, h, 13);
    ctx.fillStyle = lin(ctx, -w / 2, -h / 2, w / 2, h / 2, [0, '#5b5f73', 0.5, '#3c4052', 1, '#262838']);
    ctx.fill();
    ctx.strokeStyle = lin(ctx, -w / 2, -h / 2, w / 2, h / 2, [0, 'rgba(255,255,255,0.5)', 0.5, 'rgba(255,255,255,0.06)', 1, 'rgba(0,0,0,0.4)']);
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // colored top accent stripe
    ctx.beginPath();
    rrect(ctx, -w / 2 + 6, -h / 2 + 6, w - 12, 6, 3);
    ctx.fillStyle = rt.power === 'on' ? col : U.shade(col, -0.5);
    ctx.fill();
    // disc slot and vents
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(-w / 2 + 14, -2, w - 28, 2.4);
    for (let i = 0; i < 5; i++) ctx.fillRect(w / 2 - 20 + i * 3.2, 9, 1.6, 12);
    // eyes (LED squares) and brow: Gus is grumpy
    const on = rt.power === 'on';
    ctx.save();
    ctx.translate(-8, 14);
    for (const sx of [-1, 1]) {
      ctx.save();
      ctx.translate(sx * 10, 0);
      const open = U.sat(rt.face.eyeOpen * (1 - rt.face.blink));
      ctx.beginPath();
      rrect(ctx, -4.4, -5.4 * Math.max(0.15, open), 8.8, 10.8 * Math.max(0.15, open), 2.6);
      ctx.fillStyle = on ? '#e9fff2' : 'rgba(130,150,190,0.45)';
      ctx.fill();
      if (on && open > 0.3) {
        ctx.beginPath();
        ctx.arc(rt.face.lookX * 1.6, rt.face.lookY * 1.4, 2.4, 0, TAU);
        ctx.fillStyle = INK;
        ctx.fill();
      }
      // heavy brow
      ctx.beginPath();
      ctx.moveTo(-5.5, -8 - (rt.face.squint > 0.5 ? -1 : 0));
      ctx.lineTo(5.5, -8 + sx * (on ? 1.6 : 0.4) + (rt.face.squint > 0.5 ? 1.5 : 0));
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = on ? 'rgba(255,255,255,0.7)' : 'rgba(130,150,190,0.4)';
      ctx.stroke();
      ctx.restore();
    }
    // mouth
    ctx.beginPath();
    ctx.moveTo(-5, 11);
    ctx.quadraticCurveTo(0, 11 + (on ? rt.face.smile * 3 - 1 : 0), 5, 11);
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = on ? 'rgba(255,255,255,0.7)' : 'rgba(130,150,190,0.4)';
    ctx.stroke();
    ctx.restore();
    // power LED
    ctx.beginPath();
    ctx.arc(w / 2 - 12, -h / 2 + 22, 2.4, 0, TAU);
    ctx.fillStyle = on ? '#8dffb0' : rt.power === 'standby' ? 'rgba(255,190,70,' + (0.55 + 0.45 * Math.sin(t * 4)) + ')' : 'rgba(255,90,80,0.55)';
    ctx.fill();
    if (on) {
      // boot chase LEDs
      const ph = Math.floor((rt.wake >= 0 ? rt.wake : 9) * 12) % 4;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(-w / 2 + 18 + i * 7, -h / 2 + 9, 1.4, 0, TAU);
        ctx.fillStyle = rt.wake >= 0 && rt.wake < 0.6 ? (i === ph ? '#fff' : 'rgba(255,255,255,0.3)') : 'rgba(255,255,255,0.8)';
        ctx.fill();
      }
    }
  }

  /* ---------------------------------------------------------------- lamp (Lumi) */
  function lamp(ctx, dev, rt, t, decorLit) {
    const lit = decorLit !== undefined ? decorLit : rt.power === 'on' ? Math.min(1, 0.3 + rt.bloom) : 0;
    const col = Art.KEYCOL[dev.color || 'amber'];
    const lx = (rt.face ? rt.face.lookX : 0) * 3,
      ly = (rt.face ? rt.face.lookY : 0) * 3;
    // base
    ctx.beginPath();
    ctx.arc(0, 28, 16.5, 0, TAU);
    ctx.fillStyle = lin(ctx, -14, 14, 14, 44, [0, '#4a4f61', 1, '#262a38']);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 28, 9, 0, TAU);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fill();
    // arm
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 26);
    ctx.quadraticCurveTo(-6 + lx * 0.5, 4, lx, -14 + ly);
    ctx.strokeStyle = '#1f2230';
    ctx.lineWidth = 6.4;
    ctx.stroke();
    ctx.strokeStyle = '#6a7188';
    ctx.lineWidth = 4.4;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // head (shade seen from above)
    ctx.save();
    ctx.translate(lx, -22 + ly);
    ctx.beginPath();
    ctx.arc(0, 0, 21.5, 0, TAU);
    ctx.fillStyle = lin(ctx, -18, -18, 18, 18, [0, U.shade(col, 0.1), 0.55, U.shade(col, -0.25), 1, U.shade(col, -0.5)]);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // inner opening with bulb
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, TAU);
    ctx.fillStyle = lit > 0.02 ? U.mix('#5a4a38', '#fff1c4', lit) : '#2b2623';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, 7.5, 0, TAU);
    ctx.fillStyle = lit > 0.02 ? U.mix('#9a7a48', '#ffffff', lit) : '#403832';
    ctx.fill();
    if (lit > 0.02) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rad(ctx, 0, 0, 2, 38, [0, 'rgba(255,225,160,' + 0.65 * lit + ')', 1, 'rgba(255,200,120,0)']);
      ctx.fillRect(-40, -40, 80, 80);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
    // a tiny personality: the arm "nods" when attentive via lx/ly above
  }

  /* ---------------------------------------------------------------- radio (Rex) */
  function radio(ctx, dev, rt, t) {
    const w = 92,
      h = 56;
    const on = rt.power === 'on';
    ctx.beginPath();
    rrect(ctx, -w / 2, -h / 2, w, h, 12);
    ctx.fillStyle = lin(ctx, -w / 2, -h / 2, w / 2, h / 2, [0, '#c98b4f', 0.5, '#a56a35', 1, '#7a4a22']);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,230,190,0.55)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // speaker grille
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      ctx.beginPath();
      ctx.arc(-w / 2 + 12 + c * 6.2, -6 + r * 6.2, 1.5, 0, TAU);
      ctx.fillStyle = 'rgba(40,22,10,0.55)';
      ctx.fill();
    }
    // dial window
    ctx.beginPath();
    rrect(ctx, 0, -h / 2 + 8, w / 2 - 8, 24, 6);
    ctx.fillStyle = on ? lin(ctx, 0, 0, w / 2, 0, [0, '#ffe7b0', 1, '#ffc772']) : '#2c2418';
    ctx.fill();
    ctx.strokeStyle = 'rgba(20,10,0,0.5)';
    ctx.stroke();
    ctx.fillStyle = 'rgba(60,30,10,0.7)';
    for (let i = 0; i < 9; i++) ctx.fillRect(5 + i * 3.4, -h / 2 + 12, 0.9, i % 2 ? 4 : 7);
    // needle
    ctx.beginPath();
    const nx = 8 + (on ? 12 + Math.sin(t * 1.3) * 3 : 4);
    ctx.moveTo(nx, -h / 2 + 10);
    ctx.lineTo(nx, -h / 2 + 30);
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = '#d6402f';
    ctx.stroke();
    // knobs as eyes
    for (const sx of [-1, 1]) {
      const kx = 12 + sx * 9,
        ky = 18;
      ctx.beginPath();
      ctx.arc(kx, ky, 6.2, 0, TAU);
      ctx.fillStyle = lin(ctx, kx - 5, ky - 5, kx + 5, ky + 5, [0, '#fff7e8', 1, '#c9b79a']);
      ctx.fill();
      ctx.strokeStyle = 'rgba(40,20,5,0.5)';
      ctx.stroke();
      if (on) {
        ctx.beginPath();
        ctx.arc(kx + rt.face.lookX * 1.8, ky + rt.face.lookY * 1.4, 2.6, 0, TAU);
        ctx.fillStyle = INK;
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(kx - 3, ky);
        ctx.lineTo(kx + 3, ky);
        ctx.strokeStyle = INK;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
    // antenna
    ctx.beginPath();
    ctx.moveTo(w / 2 - 14, -h / 2 + 2);
    ctx.lineTo(w / 2 - 2, -h / 2 - 20);
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = '#d9d9de';
    ctx.stroke();
  }

  /* ---------------------------------------------------------------- device entry point */
  Art.device = function (ctx, dev, rt, t) {
    const hop = rt.hop || 0;
    ctx.save();
    ctx.translate(dev.x + (rt.shx || 0), dev.y + (rt.shy || 0));
    ctx.rotate(dev.angle + (rt.wig || 0));
    ctx.scale(1 + hop, 1 + hop);
    // breathing
    const br = 1 + 0.004 * Math.sin(t * 1.6 + dev.x);
    ctx.scale(br, br);
    switch (dev.type) {
      case 'phone':
        screenDevice(ctx, dev, rt, t, SPEC.phone);
        break;
      case 'tablet':
        screenDevice(ctx, dev, rt, t, SPEC.tablet);
        break;
      case 'laptop':
        laptop(ctx, dev, rt, t);
        break;
      case 'console':
        consoleDev(ctx, dev, rt, t);
        break;
      case 'lamp':
        lamp(ctx, dev, rt, t);
        break;
      case 'radio':
        radio(ctx, dev, rt, t);
        break;
      default: {
        const f = Art.DEVICES && Art.DEVICES[dev.type];
        if (f) f(ctx, dev, rt, t);
      }
    }
    ctx.restore();
  };

  /* ---------------------------------------------------------------- decor and obstacles */
  // d: decor/obstacle def; rt: { lit, poke, found, t }
  function mug(ctx, d, rt, t) {
    const R = d.r || 30;
    ctx.save();
    // handle
    ctx.beginPath();
    rrect(ctx, R - 6, -9, 22, 18, 8);
    ctx.fillStyle = lin(ctx, 0, -9, 0, 9, [0, '#f6f0e4', 1, '#cfc6b3']);
    ctx.fill();
    ctx.beginPath();
    rrect(ctx, R + 2, -4.2, 11, 8.4, 4);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fill();
    // outer wall (tall: visible side on the lit edge)
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, TAU);
    ctx.fillStyle = lin(ctx, -R, -R, R, R, [0, '#fffaf0', 0.5, '#ece4d2', 1, '#c9bfa8']);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // rim
    ctx.beginPath();
    ctx.arc(0, 0, R - 4, 0, TAU);
    ctx.fillStyle = lin(ctx, -R, -R, R, R, [0, '#c9bfa8', 1, '#fffaf0']);
    ctx.fill();
    // coffee
    ctx.beginPath();
    ctx.arc(0, 0, R - 7.5, 0, TAU);
    ctx.fillStyle = rad(ctx, -4, -4, 2, R, [0, '#7a4a28', 0.7, '#4a2812', 1, '#2d1608']);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-R * 0.28, -R * 0.3, R * 0.3, R * 0.12, -0.7, 0, TAU);
    ctx.fillStyle = 'rgba(255,225,190,0.28)';
    ctx.fill();
    ctx.restore();
  }
  function plant(ctx, d, rt, t) {
    const sway = Math.sin(t * 1.2 + d.x) * 0.026 + (rt.poke || 0) * Math.sin(t * 28) * 0.07;
    ctx.save();
    // pot
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, TAU);
    ctx.fillStyle = lin(ctx, -22, -22, 22, 22, [0, '#d8895a', 0.55, '#b86a42', 1, '#8a4a2a']);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, TAU);
    ctx.fillStyle = '#3a2a1c';
    ctx.fill();
    // leaves
    const leaves = 9;
    for (let i = 0; i < leaves; i++) {
      const a = (i / leaves) * TAU + 0.3 + sway * (i % 2 ? 1 : -1.2);
      const len = 24 + (i % 3) * 5;
      ctx.save();
      ctx.rotate(a);
      ctx.translate(len * 0.42, 0);
      ctx.beginPath();
      ctx.ellipse(0, 0, len * 0.58, 7.2, 0, 0, TAU);
      ctx.fillStyle = lin(ctx, -10, -7, 10, 7, [0, '#8fd36a', 1, i % 2 ? '#3f9a52' : '#2f8447']);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-len * 0.5, 0);
      ctx.lineTo(len * 0.5, 0);
      ctx.strokeStyle = 'rgba(255,255,255,0.28)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.restore();
    }
    if (d.ladybird && (rt.found || rt.peek)) {
      ctx.save();
      ctx.translate(14, -10);
      ctx.beginPath();
      ctx.arc(0, 0, 3.2, 0, TAU);
      ctx.fillStyle = '#e64035';
      ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(0, -3, 1.5, 0, TAU);
      ctx.fill();
      ctx.fillRect(-0.4, -2.5, 0.8, 5.5);
      ctx.restore();
    }
    ctx.restore();
  }
  function notebook(ctx, d, rt, t) {
    ctx.save();
    ctx.rotate(d.rot === undefined ? 0.14 : d.rot);
    const w = 70,
      h = 94;
    ctx.beginPath();
    rrect(ctx, -w / 2, -h / 2, w, h, 6);
    ctx.fillStyle = lin(ctx, -w / 2, -h / 2, w / 2, h / 2, [0, '#58b8b0', 1, '#2f8a86']);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
    // spiral rings
    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      ctx.arc(-w / 2 + 2, -h / 2 + 10 + i * 9.4, 3, 0, TAU);
      ctx.fillStyle = '#e9eef0';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.stroke();
    }
    // label and elastic
    ctx.beginPath();
    rrect(ctx, -w / 2 + 14, -h / 2 + 12, w - 28, 22, 4);
    ctx.fillStyle = '#fbf6e8';
    ctx.fill();
    ctx.fillStyle = 'rgba(40,40,60,0.55)';
    ctx.fillRect(-w / 2 + 20, -h / 2 + 19, 26, 2);
    ctx.fillRect(-w / 2 + 20, -h / 2 + 25, 18, 2);
    ctx.fillStyle = 'rgba(20,30,40,0.4)';
    ctx.fillRect(w / 2 - 12, -h / 2, 3, h);
    // a doodle that animates when found
    if (rt.found) {
      ctx.strokeStyle = '#ff6f61';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      const k = (t * 1.5) % 1;
      ctx.moveTo(-10, 18);
      ctx.bezierCurveTo(-20 + k * 4, 6, 0, 0, 10, 12 + k * 3);
      ctx.stroke();
    }
    // pen
    ctx.rotate(-0.5);
    ctx.beginPath();
    rrect(ctx, 6, 8, 5, 40, 2.4);
    ctx.fillStyle = '#2b3350';
    ctx.fill();
    ctx.fillStyle = '#ffbe3d';
    ctx.fillRect(6, 8, 5, 5);
    ctx.restore();
  }
  function clock(ctx, d, rt, t) {
    const R = 22;
    ctx.save();
    const ring = (rt.poke || 0) * Math.sin(t * 40) * 0.12;
    ctx.rotate(ring);
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(sx * 13, -R + 2, 7.5, 0, TAU);
      ctx.fillStyle = lin(ctx, 0, -R - 5, 0, -R + 9, [0, '#f2d08a', 1, '#b58a3a']);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, TAU);
    ctx.fillStyle = lin(ctx, -R, -R, R, R, [0, '#ff8f7c', 1, '#c94a3c']);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, R - 4, 0, TAU);
    ctx.fillStyle = '#fffaf0';
    ctx.fill();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (R - 6), Math.sin(a) * (R - 6));
      ctx.lineTo(Math.cos(a) * (R - 8.4), Math.sin(a) * (R - 8.4));
      ctx.strokeStyle = 'rgba(30,30,40,0.7)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    const m = (t / 60) * TAU - Math.PI / 2,
      h = (t / 720) * TAU - Math.PI / 2 + 2.6;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#242836';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(h) * 8, Math.sin(h) * 8);
    ctx.stroke();
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(m) * 12.5, Math.sin(m) * 12.5);
    ctx.stroke();
    ctx.restore();
  }
  function stickies(ctx, d, rt, t) {
    const cols = ['#ffe36b', '#ff9fb2', '#8fe0ff'];
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.translate(i * 9 - 6, i * 5 - 4);
      ctx.rotate(-0.2 + i * 0.22 + (rt.poke || 0) * Math.sin(t * 24 + i) * 0.1);
      ctx.beginPath();
      rrect(ctx, -15, -15, 30, 30, 2);
      ctx.fillStyle = cols[i];
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.07)';
      ctx.fillRect(-15, 9, 30, 6);
      ctx.strokeStyle = 'rgba(40,40,60,0.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      if (i === 0) {
        ctx.arc(0, -2, 5, 0.2, Math.PI - 0.2);
        ctx.moveTo(-5, -7);
        ctx.lineTo(-5, -6);
        ctx.moveTo(5, -7);
        ctx.lineTo(5, -6);
      } else if (i === 1) {
        ctx.moveTo(-8, -4);
        ctx.lineTo(8, -4);
        ctx.moveTo(-8, 2);
        ctx.lineTo(4, 2);
      } else {
        ctx.moveTo(-6, 4);
        ctx.quadraticCurveTo(0, -10, 6, 4);
      }
      ctx.stroke();
      ctx.restore();
    }
  }
  function pencils(ctx, d, rt, t) {
    ctx.beginPath();
    ctx.arc(0, 0, 21, 0, TAU);
    ctx.fillStyle = lin(ctx, -18, -18, 18, 18, [0, '#6e7a96', 1, '#3b4560']);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.stroke();
    const cols = ['#ff6f61', '#ffbe3d', '#3fd6a6', '#4aa3ff', '#9b7bff', '#ffffff'];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + 0.4;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 9, Math.sin(a) * 9, 4.6, 0, TAU);
      ctx.fillStyle = cols[i];
      ctx.fill();
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 9, Math.sin(a) * 9, 1.6, 0, TAU);
      ctx.fillStyle = 'rgba(40,30,20,0.8)';
      ctx.fill();
    }
  }
  function washi(ctx, d, rt, t) {
    const cols = [['#ffb3c1', '#ffe0e6'], ['#8fe0c8', '#d6f7ee'], ['#ffd36b', '#fff0c2']];
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.rotate(-0.4 + i * 0.35);
      ctx.translate(0, i * 11 - 11);
      ctx.beginPath();
      rrect(ctx, -26, -4.5, 52, 9, 1);
      ctx.fillStyle = cols[i][0];
      ctx.globalAlpha = 0.92;
      ctx.fill();
      ctx.fillStyle = cols[i][1];
      for (let k = -24; k < 24; k += 8) ctx.fillRect(k, -4.5, 3.4, 9);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
  function books(ctx, d, rt, t) {
    // d.w x d.h centered; three stacked, slightly offset books seen from above
    const w = d.w,
      h = d.h;
    const covers = [['#d9604a', '#a8402f'], ['#4a86c8', '#2f5f96'], ['#59a86a', '#3c7d4c']];
    const offs = [[-3, 3, 0.012], [2, 1.5, -0.01], [0, -2, 0.006]];
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.translate(offs[i][0], offs[i][1]);
      ctx.rotate(offs[i][2]);
      const ww = w - i * 6,
        hh = h - i * 3;
      // page edge visible along the right and bottom
      ctx.beginPath();
      rrect(ctx, -ww / 2 + 2, -hh / 2 + 2, ww, hh, 7);
      ctx.fillStyle = '#f4ecd6';
      ctx.fill();
      ctx.beginPath();
      rrect(ctx, -ww / 2, -hh / 2, ww - 3, hh - 3, 7);
      ctx.fillStyle = lin(ctx, -ww / 2, -hh / 2, ww / 2, hh / 2, [0, covers[i][0], 1, covers[i][1]]);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
      // spine band and title blocks on the top book
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(-ww / 2 + 4, -hh / 2 + 2, 10, hh - 7);
      if (i === 2) {
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.fillRect(-ww / 2 + 24, -4, ww * 0.42, 3.2);
        ctx.fillRect(-ww / 2 + 24, 3, ww * 0.28, 2.4);
        // bookmark ribbon
        ctx.fillStyle = '#ffbe3d';
        ctx.fillRect(ww / 2 - 34, hh / 2 - 6, 5, 12);
      }
      ctx.restore();
    }
  }
  function cattail(ctx, d, rt, t) {
    // peeks in from the right edge; the tip swishes
    const sw = Math.sin(t * 1.5) * 10 + (rt.poke || 0) * Math.sin(t * 22) * 6;
    ctx.save();
    ctx.lineCap = 'round';
    const path = new Path2D();
    path.moveTo(26, 8);
    path.bezierCurveTo(-4, 10 + sw * 0.2, -26, -12 + sw * 0.6, -48 + sw * 0.4, -30 + sw);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 17;
    ctx.save();
    ctx.translate(3, 5);
    ctx.stroke(path);
    ctx.restore();
    ctx.strokeStyle = '#8c8f9c';
    ctx.lineWidth = 15;
    ctx.stroke(path);
    ctx.strokeStyle = '#a9acba';
    ctx.lineWidth = 9;
    ctx.save();
    ctx.translate(-1, -2);
    ctx.stroke(path);
    ctx.restore();
    // stripes
    ctx.setLineDash([3, 10]);
    ctx.strokeStyle = 'rgba(60,62,76,0.5)';
    ctx.lineWidth = 15;
    ctx.lineCap = 'butt';
    ctx.stroke(path);
    ctx.setLineDash([]);
    // tip
    ctx.beginPath();
    ctx.arc(-48 + sw * 0.4, -30 + sw, 7.5, 0, TAU);
    ctx.fillStyle = '#f0e8e0';
    ctx.fill();
    ctx.restore();
  }
  // tiny secrets (revealed on discovery)
  const SECRETS = {
    sock(ctx) {
      ctx.fillStyle = '#ff9fb2';
      ctx.beginPath();
      rrect(ctx, -4, -9, 8, 14, 3);
      ctx.fill();
      ctx.beginPath();
      rrect(ctx, -4, 3, 13, 7, 3.5);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(-4, -9, 8, 3);
    },
    button(ctx) {
      ctx.beginPath();
      ctx.arc(0, 0, 6.5, 0, TAU);
      ctx.fillStyle = lin(ctx, -6, -6, 6, 6, [0, '#ffe08a', 1, '#c9922e']);
      ctx.fill();
      ctx.fillStyle = 'rgba(80,50,10,0.7)';
      for (const p of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) {
        ctx.beginPath();
        ctx.arc(p[0], p[1], 1, 0, TAU);
        ctx.fill();
      }
    },
    goldplug(ctx) {
      ctx.beginPath();
      rrect(ctx, -7, -5, 14, 14, 3.5);
      ctx.fillStyle = lin(ctx, -7, -5, 7, 9, [0, '#ffe58a', 1, '#c9922e']);
      ctx.fill();
      ctx.fillStyle = '#f5e7b0';
      ctx.fillRect(-4.6, -11, 2.4, 7);
      ctx.fillRect(2.2, -11, 2.4, 7);
    },
    usb(ctx) {
      ctx.beginPath();
      rrect(ctx, -9, -4, 18, 9, 2);
      ctx.fillStyle = '#3b4560';
      ctx.fill();
      ctx.fillStyle = '#cfd3dd';
      ctx.fillRect(9, -2.6, 6, 5.2);
    },
    note(ctx) {
      ctx.beginPath();
      rrect(ctx, -9, -9, 18, 18, 1.5);
      ctx.fillStyle = '#9fe6c8';
      ctx.fill();
      ctx.strokeStyle = '#2a3a50';
      ctx.lineWidth = 1;
      ctx.strokeRect(-4, -4, 8, 6);
    },
    sticker(ctx) {
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, TAU);
      ctx.fillStyle = '#6ee7a0';
      ctx.fill();
      ctx.fillStyle = '#143';
      ctx.font = '800 6px ' + Art.FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ON', 0, 0.5);
    },
    ladybird(ctx) {
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, TAU);
      ctx.fillStyle = '#e64035';
      ctx.fill();
    },
    doodle(ctx) {},
    cattail(ctx) {},
  };
  Art.secret = function (ctx, art, x, y, a, t) {
    const f = SECRETS[art] || (Art.SECRETS2 && Art.SECRETS2[art]);
    if (!f) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = a;
    ctx.rotate(Math.sin(t * 3) * 0.1);
    // soft glow
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rad(ctx, 0, 0, 1, 16, [0, 'rgba(255,240,180,0.5)', 1, 'rgba(255,240,180,0)']);
    ctx.fillRect(-16, -16, 32, 32);
    ctx.globalCompositeOperation = 'source-over';
    f(ctx);
    ctx.restore();
  };

  const DECOR = { mug, plant, notebook, clock, stickies, pencils, washi, books, cattail };
  Art.decorShadow = function (ctx, d) {
    switch (d.art) {
      case 'mug':
        Art.shadow(ctx, d.x, d.y, (d.r || 30) * 2 + 12, (d.r || 30) * 2, d.r || 30, 0, 0.35, 0.5);
        break;
      case 'plant':
        Art.shadow(ctx, d.x, d.y, 56, 56, 28, 0, 0.35, 0.5);
        break;
      case 'notebook':
        Art.shadow(ctx, d.x, d.y, 70, 94, 6, d.rot === undefined ? 0.14 : d.rot, 0.12, 0.45);
        break;
      case 'clock':
        Art.shadow(ctx, d.x, d.y, 46, 46, 23, 0, 0.3, 0.5);
        break;
      case 'pencils':
        Art.shadow(ctx, d.x, d.y, 44, 44, 22, 0, 0.3, 0.5);
        break;
      case 'stickies':
        Art.shadow(ctx, d.x, d.y, 40, 38, 3, 0, 0.05, 0.3);
        break;
      case 'lamp':
        Art.shadow(ctx, d.x, d.y + 4, 44, 80, 20, 0, 0.3, 0.5);
        break;
      default: {
        const e = Art.DECOR2 && Art.DECOR2[d.art];
        if (e && e.shadow) e.shadow(ctx, d);
      }
    }
  };
  Art.decor = function (ctx, d, rt, t) {
    ctx.save();
    ctx.translate(d.x, d.y);
    const poke = rt.poke || 0;
    if (poke > 0 && d.art !== 'plant' && d.art !== 'clock' && d.art !== 'stickies') ctx.rotate(Math.sin(t * 36) * 0.05 * poke);
    if (d.art === 'lamp') {
      // Lumi as room decor: it lights when the room wakes (rt.lit 0..1)
      lamp(ctx, { color: 'amber' }, { face: { lookX: rt.lookX || 0, lookY: rt.lookY || 0 } }, t, rt.lit);
    } else {
      const f = DECOR[d.art] || (Art.DECOR2 && Art.DECOR2[d.art] && Art.DECOR2[d.art].draw);
      if (f) f(ctx, d, rt, t);
    }
    ctx.restore();
  };
})();
