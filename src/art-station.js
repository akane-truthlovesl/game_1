/* Snug — art-station.js : Act 4, the station (world 'station'). The space beyond the hull is a deep blue dark with stars and a faint
   haze; the play area is a pale cabin panel (brushed metal under a grid of seams, a steel rim, rivets) with no floor to speak of, because
   there is no floor in zero-g. A porthole shows the planet (blue, a band of cloud); a golden tumbler is the level's secret. Registers into
   the surface / mat builders and the decor registry the way the other worlds do. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const U = G.U,
    Art = G.Art;
  const TAU = U.TAU;
  const rrect = Art.rrect,
    lin = Art.lin,
    rad = Art.rad;

  // the space beyond the hull: a deep blue dark, stars, a faint haze
  function buildSpace(Wp, Hp, k) {
    const cv = document.createElement('canvas');
    cv.width = Wp;
    cv.height = Hp;
    const c = cv.getContext('2d');
    const rnd = U.rng(55317);
    c.fillStyle = lin(c, 0, 0, 0, Hp, [0, '#0c1428', 0.6, '#070b18', 1, '#03050c']);
    c.fillRect(0, 0, Wp, Hp);
    c.globalAlpha = 0.14;
    c.fillStyle = rad(c, Wp * 0.72, Hp * 0.28, 8, Wp * 0.8, [0, '#7288d8', 1, 'rgba(114,136,216,0)']);
    c.fillRect(0, 0, Wp, Hp);
    c.globalAlpha = 1;
    for (let i = 0; i < 170; i++) {
      const x = rnd() * Wp,
        y = rnd() * Hp,
        r = (0.35 + rnd() * 1.0) * k;
      c.globalAlpha = 0.2 + rnd() * 0.65;
      c.fillStyle = rnd() < 0.15 ? '#ffe9c4' : '#ffffff';
      c.beginPath();
      c.arc(x, y, r, 0, TAU);
      c.fill();
    }
    c.globalAlpha = 1;
    return cv; // a surface is a bare canvas (the mat is the one that carries its pad)
  }

  // the cabin panel: the play area. Brushed pale metal, a grid of seams, a steel rim and rivets along it
  function buildPanel(k, dawn) {
    const M = Art.MAT;
    const pad = 28;
    const cv = document.createElement('canvas');
    cv.width = Math.ceil((M.w + pad * 2) * k);
    cv.height = Math.ceil((M.h + pad * 2) * k);
    const c = cv.getContext('2d');
    c.scale(k, k);
    c.translate(pad - M.x, pad - M.y);
    const rnd = U.rng(7741 + Math.round(dawn * 10));
    c.beginPath();
    rrect(c, M.x, M.y, M.w, M.h, M.r);
    c.fillStyle = lin(c, 0, M.y, 0, M.y + M.h, [0, '#e4eaf2', 0.5, '#d2dbe6', 1, '#b4c0d0']);
    c.fill();
    c.save();
    c.clip();
    // a faint grid of seams, and a brushed sheen across the top
    c.strokeStyle = 'rgba(70,92,124,0.14)';
    c.lineWidth = 1;
    for (let x = M.x + 36; x < M.x + M.w; x += 36) {
      c.beginPath();
      c.moveTo(x, M.y);
      c.lineTo(x, M.y + M.h);
      c.stroke();
    }
    for (let y = M.y + 36; y < M.y + M.h; y += 36) {
      c.beginPath();
      c.moveTo(M.x, y);
      c.lineTo(M.x + M.w, y);
      c.stroke();
    }
    c.fillStyle = rad(c, M.x + M.w * 0.4, M.y + 40, 10, 240, [0, 'rgba(255,255,255,0.45)', 1, 'rgba(255,255,255,0)']);
    c.fillRect(M.x, M.y, M.w, M.h);
    c.restore();
    // rivets along the rim, a little uneven
    c.fillStyle = 'rgba(60,78,104,0.5)';
    for (let i = 0; i < 64; i++) {
      const u = i / 64,
        a = u * TAU,
        cx = M.x + M.w / 2 + Math.cos(a) * (M.w / 2 - 11),
        cy = M.y + M.h / 2 + Math.sin(a) * (M.h / 2 - 11);
      c.beginPath();
      c.arc(cx + (rnd() - 0.5) * 0.6, cy, 1.5, 0, TAU);
      c.fill();
    }
    // the steel rim
    c.beginPath();
    rrect(c, M.x + 5, M.y + 5, M.w - 10, M.h - 10, M.r - 4);
    c.strokeStyle = 'rgba(92,112,140,0.55)';
    c.lineWidth = 3;
    c.stroke();
    c.beginPath();
    rrect(c, M.x + 0.5, M.y + 0.5, M.w - 1, M.h - 1, M.r);
    c.strokeStyle = 'rgba(255,255,255,0.35)';
    c.lineWidth = 1;
    c.stroke();
    return { cv, pad, k };
  }

  const _s = Art.buildSurface,
    _m = Art.buildMat;
  Art.buildSurface = function (Wp, Hp, k, world) {
    return world === 'station' ? buildSpace(Wp, Hp, k) : _s(Wp, Hp, k, world);
  };
  Art.buildMat = function (k, dawn, tint, world) {
    return world === 'station' ? buildPanel(k, dawn) : _m(k, dawn, tint, world);
  };

  /* ---------------------------------------------------------------- decor */
  // a porthole: a brass ring round a window, the planet inside (a blue sphere with a band of cloud), a glint on the glass
  Art.DECOR2.window = {
    draw(ctx, d, rt, t) {
      const R = d.r || 44;
      ctx.beginPath();
      ctx.arc(0, 0, R + 7, 0, TAU);
      ctx.fillStyle = lin(ctx, 0, -R, 0, R, [0, '#e8d7a4', 1, '#9c7d3c']);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, R, 0, TAU);
      ctx.fillStyle = '#05070f';
      ctx.fill();
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, R - 2, 0, TAU);
      ctx.clip();
      // the planet, turning slowly: a blue sphere, a band of cloud that drifts across it
      const turn = (t * 0.05) % 1;
      ctx.fillStyle = rad(ctx, -R * 0.3, -R * 0.35, 4, R * 1.5, [0, '#8fd0ff', 0.5, '#2c6fd6', 1, '#0a2456']);
      ctx.fillRect(-R, -R, R * 2, R * 2);
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.ellipse(-R * 0.6 + turn * R * 1.2, R * 0.15, R * 0.55, R * 0.12, -0.2, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
      // the glass catches the light
      ctx.beginPath();
      ctx.arc(0, 0, R - 2, Math.PI * 1.1, Math.PI * 1.45);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 3;
      ctx.stroke();
      // four bolts on the ring
      ctx.fillStyle = '#6b5428';
      for (let i = 0; i < 4; i++) {
        const a = Math.PI / 4 + (i * Math.PI) / 2;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * (R + 3.5), Math.sin(a) * (R + 3.5), 1.6, 0, TAU);
        ctx.fill();
      }
    },
  };

  // the golden hatch (Level 32): a brass ring with a gold notch, the secret for docking every hatch with no plug turned away
  Art.SECRETS2.goldhatch = function (ctx) {
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.strokeStyle = lin(ctx, -11, -11, 11, 11, [0, '#fff6c8', 1, '#c9922e']);
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 11, -Math.PI / 2 - 0.5, -Math.PI / 2 + 0.5);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -11, 2.4, 0, Math.PI * 2);
    ctx.fillStyle = '#c8ffd9';
    ctx.fill();
  };

  // a paperclip (Magnet Moon's decoy): a steel wire bent into its loops, with a glint; `stuck` draws it a little warmer, as a thing that is holding
  Art.paperclip = function (ctx, x, y, stuck, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(0.35 + (stuck ? Math.sin(t * 9) * 0.02 : 0));
    ctx.beginPath();
    ctx.moveTo(-9, 11);
    ctx.lineTo(-9, -8);
    ctx.arc(-4, -8, 5, Math.PI, 0, false);
    ctx.lineTo(1, 6);
    ctx.arc(-2, 6, 3, 0, Math.PI, false);
    ctx.strokeStyle = stuck ? '#e6ecf6' : '#aeb7c6';
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-8, -6);
    ctx.lineTo(-8, 9);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 0.7;
    ctx.stroke();
    ctx.restore();
  };

  // the golden clip (Magnet Moon's secret): a paperclip in brass, every clip peeled off at least once
  Art.SECRETS2.goldclip = function (ctx) {
    ctx.save();
    ctx.rotate(0.35);
    ctx.beginPath();
    ctx.moveTo(-9, 11);
    ctx.lineTo(-9, -8);
    ctx.arc(-4, -8, 5, Math.PI, 0, false);
    ctx.lineTo(1, 6);
    ctx.arc(-2, 6, 3, 0, Math.PI, false);
    ctx.strokeStyle = lin(ctx, -9, -13, 9, 11, [0, '#fff6c8', 1, '#c9922e']);
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();
  };

  // a rack's channel wall (Lanes, Level 38): a dark bay side with a silver edge; each lane runs between two of these
  Art.DECOR2.rackwall = {
    draw(ctx, d) {
      const w = d.w || 6,
        h = d.h || 120;
      ctx.beginPath();
      ctx.rect(-w / 2, -h / 2, w, h);
      ctx.fillStyle = lin(ctx, -w / 2, 0, w / 2, 0, [0, '#4a5163', 1, '#262a36']);
      ctx.fill();
      ctx.strokeStyle = 'rgba(200,212,230,0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();
    },
  };

  // the switchboard (Patch Panel, Level 39): a walnut board with a brass rim, a lamp on one side, and brass numerals over the jacks
  Art.DECOR2.jackboard = {
    draw(ctx, d) {
      const w = d.w || 300,
        h = d.h || 100,
        x0 = -w / 2,
        y0 = -h / 2;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x0, y0, w, h, 14) : ctx.rect(x0, y0, w, h);
      ctx.fillStyle = lin(ctx, 0, y0, 0, y0 + h, [0, '#6b4a2e', 1, '#3e2a18']);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = lin(ctx, x0, 0, x0 + w, 0, [0, '#c9922e', 0.5, '#fff0b8', 1, '#a8741e']);
      ctx.stroke();
      // one lamp, lit from the top-left: a warm pool on the board
      ctx.fillStyle = rad(ctx, x0 + w * 0.12, y0 + h * 0.1, 1, w * 0.5, [0, 'rgba(255,214,140,0.28)', 1, 'rgba(255,214,140,0)']);
      ctx.fillRect(x0, y0, w, h);
      // brass numerals in the slots, one per jack
      ctx.fillStyle = '#e8c27a';
      ctx.font = '600 11px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = 0; i < 4; i++) ctx.fillText(String(i + 1), (i - 1.5) * 56, y0 + 16);
    },
  };

  // a box fan (Fan Mail, Level 41): a grille face and four blades that turn with the clock
  Art.DECOR2.boxfan = {
    draw(ctx, d, rt, t) {
      const R = d.r || 30;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(-R, -R, 2 * R, 2 * R, 10) : ctx.rect(-R, -R, 2 * R, 2 * R);
      ctx.fillStyle = lin(ctx, 0, -R, 0, R, [0, '#dfe3ea', 1, '#9aa3b2']);
      ctx.fill();
      ctx.strokeStyle = '#5b6372';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.save();
      ctx.rotate((t || 0) * 9);
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.ellipse(0, -R * 0.42, R * 0.13, R * 0.4, 0, 0, TAU);
        ctx.fillStyle = 'rgba(70,78,92,0.82)';
        ctx.fill();
      }
      ctx.restore();
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.14, 0, TAU);
      ctx.fillStyle = '#5b6372';
      ctx.fill();
    },
  };

  // the dollhouse (Level 46): a wooden frame with a little pitched roof, a window of warm light, and a cornice; the miniature board sits in it
  Art.DECOR2.dollhouse = {
    draw(ctx, d) {
      const w = d.w || 200,
        h = d.h || 130,
        x0 = -w / 2,
        y0 = -h / 2;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x0, y0, w, h, 10) : ctx.rect(x0, y0, w, h);
      ctx.fillStyle = lin(ctx, 0, y0, 0, y0 + h, [0, '#9b6e44', 1, '#5e3f24']);
      ctx.fill();
      ctx.strokeStyle = '#d9b374';
      ctx.lineWidth = 2;
      ctx.stroke();
      // the roof
      ctx.beginPath();
      ctx.moveTo(x0 - 8, y0 + 2);
      ctx.lineTo(0, y0 - 26);
      ctx.lineTo(-x0 + 8, y0 + 2);
      ctx.closePath();
      ctx.fillStyle = '#7d3f34';
      ctx.fill();
      // the room inside: a pale floor, warm at the back
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x0 + 8, y0 + 8, w - 16, h - 16, 6) : ctx.rect(x0 + 8, y0 + 8, w - 16, h - 16);
      ctx.fillStyle = lin(ctx, 0, y0, 0, y0 + h, [0, '#f1e2c0', 1, '#d8c094']);
      ctx.fill();
      ctx.fillStyle = 'rgba(90,60,30,0.6)';
      ctx.font = '600 9px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('the little house', 0, y0 + h - 14);
    },
  };

  // the window grid of the skyline (the same grid the draw uses): each window's place on the stage, in order, and its index
  Art.skylineWins = function (d) {
    const w = d.w || 320,
      h = d.h || 240,
      x0 = d.x - w / 2,
      y0 = d.y - h / 2;
    const heights = [0.5, 0.8, 0.6, 0.95, 0.7, 0.55, 0.85, 0.65, 0.9, 0.5];
    const bw = w / heights.length;
    const out = [];
    let win = 0;
    heights.forEach((k, i) => {
      const bx = x0 + i * bw,
        bh = h * k;
      for (let r = 0; r < 6; r++)
        for (let c = 0; c < 2; c++) {
          const wy = y0 + h - bh + 8 + r * 14;
          if (wy > y0 + h - 6) continue;
          out.push({ x: bx + 7 + c * (bw / 2 - 2) + 2.5, y: wy + 3, index: win });
          win++;
        }
    });
    return out;
  };
  // the skyline (Blackout, Level 50): a night city of towers, and one lit window for every room the player has solved (read from the save,
  // read-only: the finale shows the house's progress, it does not change it)
  Art.DECOR2.skyline = {
    draw(ctx, d, rt, t) {
      const w = d.w || 320,
        h = d.h || 240,
        x0 = -w / 2,
        y0 = -h / 2;
      const solved = (G.Save && G.Save.data && G.Save.data.stars && Object.keys(G.Save.data.stars).length) || 0;
      ctx.beginPath();
      ctx.rect(x0, y0, w, h);
      ctx.fillStyle = lin(ctx, 0, y0, 0, y0 + h, [0, '#1b2140', 1, '#0c0f1e']);
      ctx.fill();
      // the towers: a row of blocks of different heights along the foot of the panel
      const heights = [0.5, 0.8, 0.6, 0.95, 0.7, 0.55, 0.85, 0.65, 0.9, 0.5];
      const bw = w / heights.length;
      let win = 0;
      heights.forEach((k, i) => {
        const bx = x0 + i * bw,
          bh = h * k;
        ctx.fillStyle = '#080a14';
        ctx.fillRect(bx + 2, y0 + h - bh, bw - 4, bh);
        for (let r = 0; r < 6; r++)
          for (let c = 0; c < 2; c++) {
            const wx = bx + 7 + c * (bw / 2 - 2),
              wy = y0 + h - bh + 8 + r * 14;
            if (wy > y0 + h - 6) continue;
            const lit = win < solved;
            win++;
            ctx.fillStyle = lit ? 'rgba(255,214,130,0.95)' : 'rgba(60,66,100,0.6)';
            ctx.fillRect(wx, wy, 5, 6);
          }
      });
      ctx.fillStyle = 'rgba(230,236,255,0.7)';
      ctx.font = '600 9px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(solved + (solved === 1 ? ' room lit' : ' rooms lit'), 0, y0 + 12);
    },
  };

  // the golden pendulum (Swing & Plug): a gilt hook over a bar, the secret for seating every plug in one swing
  Art.SECRETS2.goldpendulum = function (ctx) {
    ctx.beginPath();
    ctx.arc(0, -6, 9, 0, TAU);
    ctx.strokeStyle = lin(ctx, -9, -15, 9, 3, [0, '#fff6c8', 1, '#c9922e']);
    ctx.lineWidth = 2.6;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-12, 12);
    ctx.lineTo(12, 12);
    ctx.strokeStyle = lin(ctx, -12, 12, 12, 12, [0, '#c9922e', 1, '#fff6c8']);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  // the Earth in the porthole (Orbital Repair): the planet rises up behind the glass as the station wakes (rt.lit 0..1)
  Art.DECOR2.earthwin = {
    draw(ctx, d, rt, t) {
      const R = d.r || 56,
        lit = rt.lit || 0;
      ctx.beginPath();
      ctx.arc(0, 0, R + 8, 0, TAU);
      ctx.fillStyle = lin(ctx, 0, -R, 0, R, [0, '#e8d7a4', 1, '#9c7d3c']);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, R, 0, TAU);
      ctx.fillStyle = '#04060c';
      ctx.fill();
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, R - 2, 0, TAU);
      ctx.clip();
      // the planet, lower in the glass while it is still rising, and turning a little as it comes up
      ctx.translate(0, (1 - lit) * R * 1.6);
      ctx.fillStyle = rad(ctx, -R * 0.35, -R * 0.4, 6, R * 2.2, [0, '#bfe6ff', 0.35, '#2f7bd8', 1, '#0b2a63']);
      ctx.fillRect(-R, -R, R * 2, R * 2 + R * 1.6);
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      for (let i = 0; i < 4; i++) {
        const a = t * 0.05 + i * 1.7;
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * R * 0.35, -R * 0.5 + i * R * 0.35, R * 0.4, R * 0.09, a * 0.2, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.restore();
      ctx.beginPath();
      ctx.arc(0, 0, R - 2, Math.PI * 1.1, Math.PI * 1.45);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 3;
      ctx.stroke();
    },
  };

  // the golden crescent (Orbital Repair's secret): a gold moon-edge, for a cascade that never went dark
  Art.SECRETS2.goldcrescent = function (ctx) {
    ctx.beginPath();
    ctx.arc(0, 0, 11, Math.PI * 0.6, Math.PI * 1.6);
    ctx.arc(4, 0, 9, Math.PI * 1.55, Math.PI * 0.45, true);
    ctx.closePath();
    ctx.fillStyle = lin(ctx, -11, -11, 11, 11, [0, '#fff6c8', 1, '#c9922e']);
    ctx.fill();
    ctx.strokeStyle = 'rgba(110,70,0,0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  /* ---------------------------------------------------------------- the golden tumbler (a secret) */
  Art.SECRETS2.goldtumbler = function (ctx) {
    ctx.beginPath();
    ctx.moveTo(-8, -11);
    ctx.lineTo(8, -11);
    ctx.lineTo(6, 9);
    ctx.quadraticCurveTo(0, 12, -6, 9);
    ctx.closePath();
    ctx.fillStyle = lin(ctx, -8, -11, 8, 9, [0, '#fff6c8', 1, '#c9922e']);
    ctx.fill();
    ctx.strokeStyle = 'rgba(110,70,0,0.7)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(1, -11);
    ctx.lineTo(4, -17);
    ctx.lineTo(7, -17);
    ctx.strokeStyle = '#c9922e';
    ctx.lineWidth = 1.6;
    ctx.stroke();
  };
})();
