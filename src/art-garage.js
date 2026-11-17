/* Snug — art-garage.js : the party garage (world 'garage'): a concrete floor with oil stains and a woven teal rug with a
   cream-and-coral border and tassels. Registers into the surface/mat builders like the other worlds. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const U = G.U,
    Art = G.Art;
  const TAU = U.TAU;
  const rrect = Art.rrect,
    lin = Art.lin,
    rad = Art.rad;

  function buildConcrete(Wp, Hp, k) {
    const cv = document.createElement('canvas');
    cv.width = Wp;
    cv.height = Hp;
    const c = cv.getContext('2d');
    const rnd = U.rng(40417);
    c.fillStyle = lin(c, 0, 0, Wp, Hp, [0, '#9a9ca0', 0.5, '#85888d', 1, '#6c6f75']);
    c.fillRect(0, 0, Wp, Hp);
    for (let i = 0; i < 5200; i++) {
      c.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,' + (0.03 + rnd() * 0.07) + ')' : 'rgba(20,22,28,' + (0.04 + rnd() * 0.09) + ')';
      const s = (0.8 + rnd() * 2.2) * k;
      c.fillRect(rnd() * Wp, rnd() * Hp, s, s);
    }
    // expansion joints
    c.fillStyle = 'rgba(20,22,28,0.45)';
    c.fillRect(0, Hp * 0.34, Wp, 1.6 * k);
    c.fillRect(0, Hp * 0.71, Wp, 1.6 * k);
    c.fillRect(Wp * 0.5, 0, 1.6 * k, Hp);
    // cracks
    for (let i = 0; i < 5; i++) {
      let x = rnd() * Wp,
        y = rnd() * Hp;
      c.beginPath();
      c.moveTo(x, y);
      for (let j = 0; j < 14; j++) {
        x += (rnd() - 0.45) * 22 * k;
        y += (rnd() - 0.2) * 22 * k;
        c.lineTo(x, y);
      }
      c.strokeStyle = 'rgba(20,22,28,0.35)';
      c.lineWidth = 0.9 * k;
      c.stroke();
    }
    // oil stains and a dropped bolt or two
    for (let i = 0; i < 7; i++) {
      const x = rnd() * Wp,
        y = rnd() * Hp,
        r = (16 + rnd() * 52) * k;
      c.fillStyle = rad(c, x, y, 1, r, [0, 'rgba(14,12,10,0.34)', 1, 'rgba(14,12,10,0)']);
      c.fillRect(x - r, y - r, r * 2, r * 2);
    }
    c.fillStyle = lin(c, 0, 0, Wp, Hp, [0, 'rgba(255,236,200,0.14)', 0.55, 'rgba(255,236,200,0)', 1, 'rgba(0,0,0,0.3)']);
    c.fillRect(0, 0, Wp, Hp);
    c.fillStyle = rad(c, Wp / 2, Hp / 2, Math.min(Wp, Hp) * 0.35, Math.max(Wp, Hp) * 0.78, [0, 'rgba(0,0,0,0)', 1, 'rgba(0,0,0,0.42)']);
    c.fillRect(0, 0, Wp, Hp);
    return cv;
  }

  function buildRug(k, dawn) {
    const M = Art.MAT;
    const pad = 30;
    const cv = document.createElement('canvas');
    cv.width = Math.ceil((M.w + pad * 2) * k);
    cv.height = Math.ceil((M.h + pad * 2) * k);
    const c = cv.getContext('2d');
    c.scale(k, k);
    c.translate(pad - M.x, pad - M.y);
    const rnd = U.rng(3301 + Math.round(dawn * 10));
    // soft contact shadow on the concrete
    for (let i = 9; i >= 0; i--) {
      const t = i / 9;
      c.globalAlpha = 0.06 + (1 - t) * 0.05;
      c.fillStyle = '#0a0b0e';
      c.beginPath();
      rrect(c, M.x - 2 - t * 9 + 2, M.y - 2 - t * 9 + 5, M.w + 4 + t * 18, M.h + 4 + t * 18, 8 + t * 8);
      c.fill();
    }
    c.globalAlpha = 1;
    // tassels (fringe) at the top and bottom
    c.strokeStyle = '#d8cfb4';
    c.lineWidth = 1.5;
    for (let x = M.x + 6; x < M.x + M.w - 4; x += 5) {
      for (const y0 of [M.y, M.y + M.h]) {
        const dir = y0 === M.y ? -1 : 1;
        c.beginPath();
        c.moveTo(x, y0);
        c.quadraticCurveTo(x + (rnd() - 0.5) * 5, y0 + dir * 7, x + (rnd() - 0.5) * 7, y0 + dir * (11 + rnd() * 3));
        c.stroke();
      }
    }
    // the rug body
    c.beginPath();
    rrect(c, M.x, M.y, M.w, M.h, 6);
    c.fillStyle = lin(c, M.x, M.y, M.x + M.w, M.y + M.h, [0, '#2f6f78', 0.5, '#24585f', 1, '#1b4047']);
    c.fill();
    c.save();
    c.clip();
    // woven diagonal texture
    c.strokeStyle = 'rgba(255,255,255,0.05)';
    c.lineWidth = 1;
    for (let d = -M.h; d < M.w; d += 5) {
      c.beginPath();
      c.moveTo(M.x + d, M.y);
      c.lineTo(M.x + d + M.h, M.y + M.h);
      c.stroke();
    }
    c.strokeStyle = 'rgba(0,0,0,0.07)';
    for (let d = 0; d < M.w + M.h; d += 5) {
      c.beginPath();
      c.moveTo(M.x + d, M.y);
      c.lineTo(M.x + d - M.h, M.y + M.h);
      c.stroke();
    }
    for (let i = 0; i < 1800; i++) {
      c.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)';
      c.fillRect(M.x + rnd() * M.w, M.y + rnd() * M.h, 1, 1);
    }
    // borders: cream, coral, cream; a diamond medallion field in the middle
    const stripe = (inset, w, col) => {
      c.strokeStyle = col;
      c.lineWidth = w;
      c.beginPath();
      rrect(c, M.x + inset, M.y + inset, M.w - inset * 2, M.h - inset * 2, 3);
      c.stroke();
    };
    stripe(9, 3, '#e8dcc0');
    stripe(17, 5, '#e4685a');
    stripe(26, 2, '#e8dcc0');
    c.strokeStyle = 'rgba(232,220,192,0.16)';
    c.lineWidth = 1.4;
    for (let r = 0; r < 4; r++) {
      const cx = M.x + M.w / 2,
        cy = M.y + M.h / 2,
        s = 62 + r * 38;
      c.beginPath();
      c.moveTo(cx, cy - s * 1.4);
      c.lineTo(cx + s, cy);
      c.lineTo(cx, cy + s * 1.4);
      c.lineTo(cx - s, cy);
      c.closePath();
      c.stroke();
    }
    c.fillStyle = rad(c, M.x + 60, M.y + 40, 10, 380, [0, 'rgba(255,240,215,0.16)', 1, 'rgba(255,240,215,0)']);
    c.fillRect(M.x, M.y, M.w, M.h);
    c.restore();
    c.beginPath();
    rrect(c, M.x + 0.5, M.y + 0.5, M.w - 1, M.h - 1, 6);
    c.strokeStyle = 'rgba(255,255,255,0.18)';
    c.lineWidth = 1;
    c.stroke();
    return { cv, pad, k };
  }

  const _s = Art.buildSurface,
    _m = Art.buildMat;
  Art.buildSurface = function (Wp, Hp, k, world) {
    return world === 'garage' ? buildConcrete(Wp, Hp, k) : _s(Wp, Hp, k, world);
  };
  Art.buildMat = function (k, dawn, tint, world) {
    return world === 'garage' ? buildRug(k, dawn) : _m(k, dawn, tint, world);
  };
})();
