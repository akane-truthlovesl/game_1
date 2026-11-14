/* Snug — finale.js : the Act 1 stinger (Level 10). A mystery shape under a cloth; after the Wake the cloth lifts and
   Rex the radio plays a smoky riff; then Biscuit the cat hops onto the desk, curls on the warmest device, purrs,
   and casually unplugs one cable. A cliffhanger for Act 2. Purely presentational; never blocks the Next button. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const U = G.U,
    Art = G.Art,
    Fx = G.Fx;
  const TAU = U.TAU;
  const A = () => G.Audio;
  const H = () => G.Haptics;

  /* ---------------------------------------------------------------- the cat (top-down, curled) */
  Art.cat = function (ctx, x, y, o) {
    // o: { sc, rot, breath, tail, ears, curl (0 stretched .. 1 curled), eyes (0 open..1 closed), paw {x,y,a} }
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(o.rot || 0);
    const sc = (o.sc || 1) * (1 + 0.012 * Math.sin((o.breath || 0) * 3.2));
    ctx.scale(sc, sc);
    const fur = '#9aa0b4',
      dark = '#6f7690',
      light = '#d6d9e6';
    // tail curling around the body
    const curl = o.curl === undefined ? 1 : o.curl;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const tw = Math.sin((o.tail || 0) * 2) * 3;
    ctx.moveTo(10, 18);
    ctx.bezierCurveTo(34 + tw, 22, 38 + tw, -12 * curl, 12, -26 * curl - 4);
    ctx.strokeStyle = dark;
    ctx.lineWidth = 9;
    ctx.stroke();
    ctx.strokeStyle = fur;
    ctx.lineWidth = 6.4;
    ctx.stroke();
    ctx.strokeStyle = light;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(30 + tw * 0.6, 4);
    ctx.bezierCurveTo(34 + tw, -4, 30 + tw, -12 * curl, 20, -20 * curl);
    ctx.stroke();
    // body
    ctx.beginPath();
    ctx.ellipse(0, 4, 24, 20, 0, 0, TAU);
    ctx.fillStyle = fur;
    ctx.fill();
    // stripes
    ctx.strokeStyle = dark;
    ctx.lineWidth = 2.4;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 8 - 2, -10);
      ctx.quadraticCurveTo(i * 8 + 2, 0, i * 8 - 2, 11);
      ctx.stroke();
    }
    // light belly sheen
    ctx.beginPath();
    ctx.ellipse(-6, -2, 11, 7, -0.4, 0, TAU);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fill();
    // head
    ctx.save();
    ctx.translate(-18, -8);
    ctx.rotate(-0.3);
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(sx * 4, -8);
      ctx.lineTo(sx * 12, -19 - (o.ears || 0) * 3);
      ctx.lineTo(sx * 13, -4);
      ctx.closePath();
      ctx.fillStyle = fur;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(sx * 6.5, -8);
      ctx.lineTo(sx * 11, -15);
      ctx.lineTo(sx * 11.5, -6);
      ctx.closePath();
      ctx.fillStyle = '#e9a7b6';
      ctx.fill();
    }
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 13, 0, 0, TAU);
    ctx.fillStyle = fur;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, 4, 8, 5.5, 0, 0, TAU);
    ctx.fillStyle = light;
    ctx.fill();
    // eyes (closed contentedly)
    ctx.strokeStyle = '#2a2d3e';
    ctx.lineWidth = 1.7;
    const eo = o.eyes === undefined ? 1 : o.eyes;
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      if (eo > 0.6) ctx.arc(sx * 5.6, -1.2, 3, Math.PI * 0.15, Math.PI * 0.85);
      else {
        ctx.ellipse(sx * 5.6, -1.2, 2.2, 3, 0, 0, TAU);
        ctx.fillStyle = '#2a2d3e';
        ctx.fill();
      }
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(-1.6, 3.2);
    ctx.lineTo(1.6, 3.2);
    ctx.lineTo(0, 5);
    ctx.closePath();
    ctx.fillStyle = '#e48a9e';
    ctx.fill();
    ctx.restore();
    // paw
    if (o.paw) {
      ctx.save();
      ctx.translate(o.paw.x, o.paw.y);
      ctx.rotate(o.paw.a || 0);
      ctx.beginPath();
      ctx.ellipse(0, 0, 7.5, 9, 0, 0, TAU);
      ctx.fillStyle = fur;
      ctx.fill();
      ctx.strokeStyle = dark;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = '#e9a7b6';
      ctx.beginPath();
      ctx.arc(0, 2, 3.4, 0, TAU);
      ctx.fill();
      for (const p of [[-4.6, -3.4], [0, -5.2], [4.6, -3.4]]) {
        ctx.beginPath();
        ctx.arc(p[0], p[1], 1.7, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  };

  // a draped sheet over a mystery shape
  Art.cloth = function (ctx, x, y, w, h, o) {
    o = o || {};
    ctx.save();
    ctx.translate(x + (o.dx || 0), y + (o.dy || 0));
    ctx.rotate(o.rot || 0);
    const s = o.sc || 1;
    ctx.scale(s, s);
    ctx.globalAlpha = o.alpha === undefined ? 1 : o.alpha;
    const wob = Math.sin((o.t || 0) * 1.4) * 0.8;
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 6, -h / 2);
    ctx.bezierCurveTo(-w * 0.2, -h / 2 - 8 - wob, w * 0.2, -h / 2 - 6 + wob, w / 2 - 8, -h / 2 + 2);
    ctx.bezierCurveTo(w / 2 + 6, -h * 0.1, w / 2 + 4, h * 0.3, w / 2 - 6, h / 2);
    ctx.bezierCurveTo(w * 0.1, h / 2 + 7, -w * 0.2, h / 2 + 3, -w / 2 + 4, h / 2 - 1);
    ctx.bezierCurveTo(-w / 2 - 6, h * 0.2, -w / 2 - 5, -h * 0.2, -w / 2 + 6, -h / 2);
    ctx.closePath();
    ctx.fillStyle = Art.lin(ctx, -w / 2, -h / 2, w / 2, h / 2, [0, '#fbf6ea', 0.5, '#ece3d0', 1, '#cdc2ab']);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1;
    ctx.stroke();
    // folds
    ctx.strokeStyle = 'rgba(90,70,40,0.2)';
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(-w / 2 + 10 + i * (w / 5.4), -h / 2 + 4);
      ctx.quadraticCurveTo(-w / 2 + 14 + i * (w / 5.4) + (i % 2 ? 6 : -6), 0, -w / 2 + 10 + i * (w / 5.4) + 3, h / 2 - 4);
      ctx.stroke();
    }
    // a question-mark shaped lump for curiosity
    ctx.beginPath();
    ctx.ellipse(-w * 0.12, -h * 0.02, w * 0.3, h * 0.2, 0.1, 0, TAU);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fill();
    ctx.restore();
  };

  /* ---------------------------------------------------------------- the Level 10 stinger */
  function RexFinale(room) {
    this.room = room;
    this.t = 0;
    this.x = 190;
    this.y = 556;
    this.revealed = false;
    this.revealT = -1;
    this.poke = 0;
    this.cat = { vis: false, x: 410, y: 170, rot: 0, sc: 1, t: 0, breath: 0, tail: 0, curl: 0.3, eyes: 0, pose: 'hidden', paw: null, ears: 0 };
    this.rt = { p: 'off', power: 'off', bloom: 0, wake: -1, batt: 0, face: Art.newFace(), hop: 0, shx: 0, shy: 0, wig: 0 };
    this.dev = { x: this.x, y: this.y, angle: 0, type: 'radio', color: 'amber', meta: { w: 92, h: 56 } };
  }
  G.RexFinale = RexFinale;

  RexFinale.prototype.hit = function (x, y) {
    return !this.revealed && Math.abs(x - this.x) < 56 && Math.abs(y - this.y) < 38;
  };
  RexFinale.prototype.nudge = function () {
    this.poke = 1;
    Fx.caption('?', this.x, this.y - 36, '#fff7dc');
    A().sfx.bip(1);
    H().pulse('poke');
  };

  RexFinale.prototype.reveal = function () {
    if (this.revealed) return;
    const room = this.room;
    this.revealed = true;
    this.revealT = 0;
    A().sfx.whoosh();
    room.later(0.5, () => {
      this.rt.p = 'on';
      this.rt.bloom = 1;
      this.rt.wake = 0;
      this.rt.face.eyeOpen = 1;
      this.rt.face.smile = 0.6;
      A().sfx.riff && A().sfx.riff();
      Fx.sparkle(this.x, this.y, '#ffd9a0', 14);
      Fx.caption('♪', this.x + 30, this.y - 34, '#ffe9bd');
      Fx.caption('♪', this.x - 34, this.y - 26, '#ffe9bd');
    });
    // Biscuit arrives
    room.later(3.2, () => this.catHop());
  };

  RexFinale.prototype.catHop = function () {
    const c = this.cat;
    c.vis = true;
    c.pose = 'hop';
    c.t = 0;
    c.from = { x: 410, y: 170 };
    c.to = { x: 66, y: 142 };
    c.dur = 0.95;
    c.landed = false;
  };

  RexFinale.prototype.update = function (dt) {
    this.t += dt;
    if (this.revealT >= 0) this.revealT += dt;
    this.poke = Math.max(0, this.poke - dt * 2);
    const rt = this.rt;
    rt.bloom = U.damp(rt.bloom, rt.p === 'on' ? 1 : 0, 0.1, dt);
    rt.power = rt.bloom > 0.02 ? 'on' : 'off';
    if (rt.wake >= 0) rt.wake += dt;
    rt.face.lookX = Math.sin(this.t * 0.8) * 0.8;
    rt.face.eyeOpen = U.damp(rt.face.eyeOpen, rt.p === 'on' ? 1 : 0, 0.08, dt);
    const c = this.cat;
    if (!c.vis) return;
    c.t += dt;
    c.breath += dt;
    c.tail += dt;
    const room = this.room;
    if (c.pose === 'hop') {
      const k = Math.min(1, c.t / c.dur);
      const e = U.ease.outQuad(k);
      c.x = U.lerp(c.from.x, c.to.x, e);
      c.y = U.lerp(c.from.y, c.to.y, e) - Math.sin(Math.PI * k) * 56;
      c.sc = 1 + 0.22 * Math.sin(Math.PI * k);
      c.rot = (1 - k) * 0.8 - 0.3;
      c.curl = 0.1;
      if (k >= 1 && !c.landed) {
        c.landed = true;
        c.pose = 'curl';
        c.t = 0;
        c.sc = 1;
        A().sfx.thud(1);
        H().pulse('seatFat');
        Fx.kick(0, 1.4);
        Fx.sparkle(c.x, c.y, '#fff6d8', 8);
        const boxy = room.devRT.boxy;
        if (boxy) {
          boxy.hopS.kick(2.4);
          boxy.wince = 0.4;
        }
        Fx.caption('mrrp', c.x + 26, c.y - 30, '#fff7dc');
        A().sfx.cat();
      }
    } else if (c.pose === 'curl') {
      c.curl = U.damp(c.curl, 1, 0.3, dt);
      c.eyes = U.damp(c.eyes, 1, 0.3, dt);
      c.rot = U.damp(c.rot, 0.15, 0.4, dt);
      if (c.t > 0.5 && !c.purred) {
        c.purred = true;
        A().sfx.purr(2.4);
        if (H().enabled && navigator.vibrate) navigator.vibrate([28, 24, 28, 24, 28, 24, 28, 24, 28, 24, 28]);
      }
      if (c.t > 3.3 && !c.pawed) {
        c.pawed = true;
        this.cheeky();
      }
    } else if (c.pose === 'paw') {
      const k = Math.min(1, c.t / 1.6);
      c.paw = { x: U.lerp(-6, -34, Math.sin(Math.PI * Math.min(1, k * 1.2))), y: U.lerp(14, 44, Math.sin(Math.PI * Math.min(1, k * 1.2))), a: 0.4 };
      if (k >= 1) {
        c.paw = null;
        c.pose = 'curl';
        c.t = 0;
        c.pawed = true;
      }
    }
  };

  // the cliffhanger: one cable is quietly unplugged
  RexFinale.prototype.cheeky = function () {
    const room = this.room;
    const c = this.cat;
    c.pose = 'paw';
    c.t = 0;
    room.later(0.5, () => {
      const prts = room.plugList.filter((p) => p.state === 'seated');
      const prt = prts.find((p) => p.id === 'pipa') || prts[0];
      if (!prt || room.phase === 'dead') return;
      const dev = prt.plug.device;
      room.hopTo(prt, dev.rest.x, dev.rest.y, 0.5, 0, () => {});
      room.updateCover();
      room.refreshPower();
      A().sfx.pop();
      Fx.caption('!', prt.x, prt.y - 24, '#ffe9bd');
      H().pulse('pop');
      room.later(0.9, () => Fx.caption('mrrp.', c.x + 30, c.y - 34, '#fff7dc'));
    });
  };

  RexFinale.prototype.drawUnder = function (ctx, t) {
    // Rex (visible once revealed or as a lump under the cloth)
    const rt = this.rt;
    ctx.save();
    Art.shadow(ctx, this.x, this.y, 92, 56, 12, 0, 0.15, 0.5);
    ctx.restore();
    if (this.revealed || this.revealT >= 0) {
      ctx.save();
      ctx.translate(this.x, this.y);
      if (rt.wake >= 0 && rt.wake < 0.5) ctx.scale(1 + 0.06 * Math.sin(Math.PI * (rt.wake / 0.5)), 1 + 0.06 * Math.sin(Math.PI * (rt.wake / 0.5)));
      Art.device(ctx, Object.assign({}, this.dev, { x: 0, y: 0 }), Object.assign(rt, { hop: 0 }), t);
      ctx.restore();
    }
  };
  RexFinale.prototype.drawCloth = function (ctx, t) {
    if (this.revealT > 1.0) return;
    const k = this.revealT < 0 ? 0 : U.ease.inCubic(Math.min(1, this.revealT / 0.9));
    Art.cloth(ctx, this.x, this.y, 112, 74, {
      t,
      dx: k * 160,
      dy: -k * 90 + Math.sin(t * 9) * this.poke * 2,
      rot: k * 0.9 + Math.sin(t * 30) * this.poke * 0.04,
      sc: 1 + k * 0.3,
      alpha: 1 - k,
    });
  };
  RexFinale.prototype.drawCat = function (ctx, t) {
    const c = this.cat;
    if (!c.vis) return;
    ctx.save();
    Art.shadow(ctx, c.x, c.y + 6, 54, 44, 22, 0, c.pose === 'hop' ? 0.9 : 0.1, 0.4);
    ctx.restore();
    Art.cat(ctx, c.x, c.y, c);
  };

  Art.finale = RexFinale;
})();
