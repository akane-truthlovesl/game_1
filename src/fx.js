/* Snug — fx.js : particles, rings, captions, camera-shake spring, hit-stop clock. Pooled; no per-frame allocation in hot loops. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const U = G.U;
  const MAX = 240;

  // particle kinds
  const SPARK = 0,
    DUST = 1,
    ZZZ = 2,
    STEAM = 3,
    SMOKE = 4,
    STAR = 5,
    CONF = 6;

  const P = {
    n: 0,
    x: new Float32Array(MAX),
    y: new Float32Array(MAX),
    vx: new Float32Array(MAX),
    vy: new Float32Array(MAX),
    life: new Float32Array(MAX),
    max: new Float32Array(MAX),
    size: new Float32Array(MAX),
    kind: new Uint8Array(MAX),
    col: new Array(MAX),
    rot: new Float32Array(MAX),
  };

  const Fx = (G.Fx = {
    reduce: false,
    rings: [],
    captions: [],
    shake: { x: new U.Spring(1400, 36, 0), y: new U.Spring(1400, 36, 0) },
    stopT: 0,
    zoom: new U.Spring(60, 9, 1),
    cap: MAX,
    scale: 1, // degrade ladder multiplier for spawn counts

    reset() {
      P.n = 0;
      Fx.rings.length = 0;
      Fx.captions.length = 0;
      Fx.stopT = 0;
    },
    hitstop(sec) {
      if (Fx.reduce) return;
      Fx.stopT = Math.max(Fx.stopT, sec);
    },
    kick(ax, ay) {
      const k = Fx.reduce ? 0.25 : 1;
      Fx.shake.x.kick(ax * 40 * k);
      Fx.shake.y.kick(ay * 40 * k);
    },
    breathe() {
      if (Fx.reduce) return;
      Fx.zoom.t = 1.03;
      setTimeout(() => (Fx.zoom.t = 1), 450);
    },

    spawn(kind, x, y, vx, vy, life, size, col) {
      if (P.n >= Fx.cap) return;
      const i = P.n++;
      P.kind[i] = kind;
      P.x[i] = x;
      P.y[i] = y;
      P.vx[i] = vx;
      P.vy[i] = vy;
      P.life[i] = P.max[i] = life;
      P.size[i] = size;
      P.col[i] = col;
      P.rot[i] = Math.random() * 6.28;
    },
    sparks(x, y, col, n, dirx, diry, spread) {
      n = Math.round((n === undefined ? 8 : n) * Fx.scale * (Fx.reduce ? 0.4 : 1));
      for (let i = 0; i < n; i++) {
        let a = Math.random() * U.TAU,
          sp = 80 + Math.random() * 140;
        if (dirx !== undefined) {
          a = Math.atan2(diry, dirx) + (Math.random() - 0.5) * (spread || 2.2);
          sp = 90 + Math.random() * 150;
        }
        Fx.spawn(SPARK, x, y, Math.cos(a) * sp, Math.sin(a) * sp, 0.28 + Math.random() * 0.14, 1.8 + Math.random() * 1.4, col);
      }
    },
    sparkle(x, y, col, n) {
      n = Math.round((n || 10) * Fx.scale * (Fx.reduce ? 0.4 : 1));
      for (let i = 0; i < n; i++) {
        const a = Math.random() * U.TAU,
          r = 6 + Math.random() * 22;
        Fx.spawn(STAR, x + Math.cos(a) * r, y + Math.sin(a) * r, (Math.random() - 0.5) * 20, -20 - Math.random() * 40, 0.6 + Math.random() * 0.3, 2 + Math.random() * 2.5, col);
      }
    },
    confetti(x, y, col, vx, vy) {
      if (Fx.reduce && Math.random() < 0.6) return;
      Fx.spawn(CONF, x, y, vx + (Math.random() - 0.5) * 30, vy + (Math.random() - 0.5) * 30 - 20, 0.9, 2 + Math.random() * 2, col);
    },
    dust(x, y) {
      Fx.spawn(DUST, x, y, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, 6 + Math.random() * 5, 0.8 + Math.random() * 1.1, '#ffe9bf');
    },
    zzz(x, y) {
      Fx.spawn(ZZZ, x, y, 6 + Math.random() * 4, -14 - Math.random() * 6, 2.2, 6 + Math.random() * 2, '#9fb4e8');
    },
    steam(x, y) {
      Fx.spawn(STEAM, x + (Math.random() - 0.5) * 6, y, (Math.random() - 0.5) * 4, -10 - Math.random() * 5, 1.7, 5 + Math.random() * 3, '#ffffff');
    },
    smoke(x, y) {
      Fx.spawn(SMOKE, x + (Math.random() - 0.5) * 4, y, (Math.random() - 0.5) * 6, -12 - Math.random() * 8, 1.6, 4 + Math.random() * 3, '#3a3a40');
    },
    starburst(x, y, n) {
      n = Math.round((n || 14) * Fx.scale * (Fx.reduce ? 0.4 : 1));
      for (let i = 0; i < n; i++) {
        const a = (i / n) * U.TAU + Math.random() * 0.4,
          sp = 60 + Math.random() * 90;
        Fx.spawn(SPARK, x, y, Math.cos(a) * sp, Math.sin(a) * sp, 0.5, 2 + Math.random() * 1.5, '#ffd36b');
      }
    },
    ring(x, y, r, col, life, w) {
      Fx.rings.push({ x, y, r, col, t: 0, life: life || 0.32, w: w || 2 });
    },
    caption(text, x, y, col) {
      Fx.captions.push({ text, x, y, t: 0, life: 0.9, col: col || '#ffffff' });
    },

    update(dt) {
      // camera springs always run on real time
      Fx.shake.x.step(dt);
      Fx.shake.y.step(dt);
      Fx.zoom.step(dt);
      const n = P.n;
      let w = 0;
      for (let i = 0; i < n; i++) {
        const life = P.life[i] - dt;
        if (life <= 0) continue;
        const k = P.kind[i];
        P.life[w] = life;
        P.kind[w] = k;
        P.max[w] = P.max[i];
        P.size[w] = P.size[i];
        P.col[w] = P.col[i];
        P.rot[w] = P.rot[i] + dt * (k === CONF ? 9 : 0);
        let vx = P.vx[i],
          vy = P.vy[i];
        if (k === SPARK) {
          const d = Math.exp(-4 * dt);
          vx *= d;
          vy *= d;
        } else if (k === CONF) {
          const d = Math.exp(-2.5 * dt);
          vx *= d;
          vy = vy * d + 40 * dt;
        } else if (k === DUST) {
          vx += (Math.random() - 0.5) * 18 * dt;
          vy += (Math.random() - 0.5) * 18 * dt;
        } else if (k === ZZZ || k === STEAM || k === SMOKE) {
          vx += Math.sin((P.max[i] - life) * 3 + P.rot[i]) * 9 * dt;
        }
        P.vx[w] = vx;
        P.vy[w] = vy;
        P.x[w] = P.x[i] + vx * dt;
        P.y[w] = P.y[i] + vy * dt;
        w++;
      }
      P.n = w;
      for (let i = Fx.rings.length - 1; i >= 0; i--) {
        const r = Fx.rings[i];
        r.t += dt;
        if (r.t >= r.life) Fx.rings.splice(i, 1);
      }
      for (let i = Fx.captions.length - 1; i >= 0; i--) {
        const c = Fx.captions[i];
        c.t += dt;
        if (c.t >= c.life) Fx.captions.splice(i, 1);
      }
    },

    // draw in stage space (caller has applied the stage transform)
    draw(ctx, ox) {
      ox = ox || 0;
      const n = P.n;
      ctx.save();
      ctx.lineCap = 'round';
      for (let i = 0; i < n; i++) {
        const k = P.kind[i];
        const t = P.life[i] / P.max[i]; // 1 → 0
        const x = P.x[i] + ox,
          y = P.y[i];
        if (k === SPARK || k === STAR) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = Math.min(1, t * 1.6);
          const s = P.size[i] * (k === STAR ? 0.6 + 0.4 * t : 0.5 + 0.5 * t);
          ctx.fillStyle = P.col[i];
          ctx.beginPath();
          ctx.arc(x, y, s, 0, U.TAU);
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.globalAlpha *= 0.8;
          ctx.beginPath();
          ctx.arc(x, y, s * 0.45, 0, U.TAU);
          ctx.fill();
        } else if (k === DUST) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 0.5 * Math.sin(Math.PI * (1 - t)) * 0.9;
          ctx.fillStyle = P.col[i];
          ctx.beginPath();
          ctx.arc(x, y, P.size[i], 0, U.TAU);
          ctx.fill();
        } else if (k === CONF) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = Math.min(1, t * 1.5);
          ctx.fillStyle = P.col[i];
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(P.rot[i]);
          ctx.fillRect(-P.size[i], -P.size[i] * 0.4, P.size[i] * 2, P.size[i] * 0.8);
          ctx.restore();
        } else if (k === ZZZ) {
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = Math.sin(Math.PI * (1 - t)) * 0.8;
          ctx.fillStyle = P.col[i];
          ctx.font = '700 ' + P.size[i] * (1.3 - 0.3 * t) + 'px ui-rounded, "SF Pro Rounded", Nunito, "Trebuchet MS", system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('z', x, y);
        } else {
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 0.28 * Math.sin(Math.PI * (1 - t));
          ctx.fillStyle = P.col[i];
          ctx.beginPath();
          ctx.arc(x, y, P.size[i] * (1 + (1 - t) * 1.6), 0, U.TAU);
          ctx.fill();
        }
      }
      ctx.restore();
      // rings
      ctx.save();
      for (const r of Fx.rings) {
        const t = r.t / r.life;
        ctx.globalAlpha = 0.3 * (1 - t);
        ctx.strokeStyle = r.col;
        ctx.lineWidth = r.w * (1 - 0.75 * t);
        ctx.beginPath();
        ctx.arc(r.x + ox, r.y, r.r * U.ease.outCubic(t), 0, U.TAU);
        ctx.stroke();
      }
      // captions (sticker text)
      for (const c of Fx.captions) {
        const t = c.t / c.life;
        const a = t < 0.15 ? t / 0.15 : t > 0.7 ? (1 - t) / 0.3 : 1;
        const rise = U.ease.outCubic(t) * 14;
        const sc = 0.8 + 0.2 * U.ease.outBack(Math.min(1, t * 4));
        ctx.save();
        ctx.translate(c.x + ox, c.y - rise);
        ctx.scale(sc, sc);
        ctx.globalAlpha = a;
        ctx.font = '800 13px ui-rounded, "SF Pro Rounded", Nunito, "Trebuchet MS", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(20,24,40,0.75)';
        ctx.strokeText(c.text, 0, 0);
        ctx.fillStyle = c.col;
        ctx.fillText(c.text, 0, 0);
        ctx.restore();
      }
      ctx.restore();
    },
  });
  Fx.KIND = { SPARK, DUST, ZZZ, STEAM, SMOKE, STAR, CONF };
})();
