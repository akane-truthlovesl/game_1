/* Snug — game.js : orchestration. View fitting, input and hit-testing, level lifecycle, the swap transition,
   lighting composition, the title scene (the first plug-in IS the menu) and the toy room. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const U = G.U,
    T = G.T,
    Rules = G.Rules,
    Art = G.Art,
    Fx = G.Fx;
  const TAU = U.TAU,
    sat = U.sat;
  const A = () => G.Audio;
  const H = () => G.Haptics;
  const UI = () => G.UI;

  const TITLE_DEF = {
    id: 0,
    title: true,
    name: 'snug',
    dawn: 0.15,
    strips: [{ id: 'G', kind: 'grommet', x: 180, y: 520, slots: 1, pitch: 40, angle: 0, sockets: [{ key: 'any' }] }],
    devices: [{ id: 'cord', type: 'anchor', x: 180, y: -8, color: 'mint', cable: { len: 590, curl: 1 }, plug: { key: 'any' }, rest: { x: 178, y: 430 }, required: false }],
    decor: [],
  };
  const TOY_DEF = {
    id: 900,
    toy: true,
    name: 'Fidget',
    dawn: 0.55,
    cls: 'toy',
    par: 99,
    strips: [{ id: 'A', x: 180, y: 490, slots: 6, pitch: 40, angle: 0, sockets: [0, 1, 2, 3, 4, 5].map(() => ({ key: 'any' })) }],
    devices: [
      { id: 'a', type: 'phone', x: 80, y: 140, color: 'coral', cable: { len: 400, curl: 1 }, plug: { key: 'any' }, dir: 10, frac: 0.5 },
      { id: 'b', type: 'phone', x: 180, y: 140, color: 'sky', cable: { len: 400, curl: -1 }, plug: { key: 'any' }, dir: 0, frac: 0.5 },
      { id: 'c', type: 'phone', x: 280, y: 140, color: 'mint', cable: { len: 400, curl: 1 }, plug: { key: 'any' }, dir: -10, frac: 0.5 },
    ],
    decor: [{ art: 'mug', x: 300, y: 330, steam: true }, { art: 'plant', x: 56, y: 560 }],
  };
  G.TITLE_DEF = TITLE_DEF;

  const Game = (G.Game = {
    canvas: null,
    ctx: null,
    view: { W: 360, H: 640, dpr: 1, scale: 1, ox: 0, oy: 0, k: 1 },
    room: null,
    out: null,
    swap: null,
    wood: null,
    lm: null,
    ptrs: {},
    time: 0,
    last: 0,
    mode: 'boot',
    levelId: 0,
    frameTimes: [],
    perfLevel: 0,
    perfT: 0,
    started: false,
  });

  /* ---------------------------------------------------------------- init & resize */
  Game.init = function (canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.lm = new Art.LightMap();
    const opt = (e, f) => canvas.addEventListener(e, f, { passive: false });
    opt('pointerdown', (e) => this.onDown(e));
    opt('pointermove', (e) => this.onMove(e));
    opt('pointerup', (e) => this.onUp(e));
    opt('pointercancel', (e) => this.onUp(e));
    opt('contextmenu', (e) => e.preventDefault());
    // iOS Safari ignores user-scalable=no; stop pinch/double-tap zoom from fighting the thumb
    for (const g of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(g, (e) => e.preventDefault(), { passive: false });
    let lastTouch = 0;
    document.addEventListener('touchend', (e) => { const n = Date.now(); if (n - lastTouch < 300) e.preventDefault(); lastTouch = n; }, { passive: false });
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 120));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        for (const id in this.ptrs) this.releasePointer(+id);
        if (G.Audio.impl) G.Audio.impl.ctx.suspend();
      } else G.Audio.resume();
    });
    this.safe = document.createElement('div');
    this.safe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px) 0';
    document.body.appendChild(this.safe);
    this.resize();
  };

  Game.resize = function () {
    const V = this.view;
    const W = window.innerWidth,
      H = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (this.perfLevel >= 4) dpr = Math.min(dpr, 1.4);
    V.W = W;
    V.H = H;
    V.dpr = dpr;
    const cs = getComputedStyle(this.safe);
    const sat_ = parseFloat(cs.paddingTop) || 0,
      sab = parseFloat(cs.paddingBottom) || 0;
    const top = 58 + sat_,
      bottom = 96 + sab;
    const areaH = Math.max(200, H - top - bottom);
    V.scale = Math.min(W / 360, areaH / 640);
    V.ox = (W - 360 * V.scale) / 2;
    V.oy = top + (areaH - 640 * V.scale) / 2;
    V.k = V.scale * dpr;
    this.canvas.width = Math.round(W * dpr);
    this.canvas.height = Math.round(H * dpr);
    this.canvas.style.width = W + 'px';
    this.canvas.style.height = H + 'px';
    this.surfaces = {};
    this.wood = this.surfaceFor(undefined);
    this.lm.resize(this.canvas.width, this.canvas.height, this.perfLevel >= 1 ? 0.33 : 0.5);
    for (const r of [this.room, this.out]) if (r) this.buildMat(r);
    if (UI()) UI().layout(V);
  };
  // the surface under a room (desk wood, workbench...) is built once per world and size
  Game.surfaceFor = function (world) {
    const key = world || 'desk';
    if (!this.surfaces) this.surfaces = {};
    if (!this.surfaces[key]) this.surfaces[key] = Art.buildSurface(this.canvas.width, this.canvas.height, this.view.k, world);
    return this.surfaces[key];
  };
  Game.buildMat = function (room) {
    const k = this.view.k;
    if (room.mat && Math.abs(room.mat.k - k) < 0.01) return;
    room.mat = Art.buildMat(k, room.dawn, undefined, room.def.world);
    this.surfaceFor(room.def.world); // build the surface ahead of the swap so the slide stays smooth
  };

  /* ---------------------------------------------------------------- levels */
  Game.makeRoom = function (def) {
    const room = new G.Room(def, {
      onEvent: (name, a) => Game.onRoomEvent(room, name, a),
    });
    this.buildMat(room);
    return room;
  };

  Game.enter = function (room, opts) {
    opts = opts || {};
    if (this.room && !opts.instant) {
      this.out = this.room;
      this.swap = { t: 0, dur: 0.54 };
      A().sfx.whoosh();
      room.offX = 400;
    } else {
      this.out = null;
      this.swap = null;
    }
    this.room = room;
    Fx.reset();
    for (const id in this.ptrs) delete this.ptrs[id];
    // each act has its own root note: a small step up, "a different room"
    A().setRoot(({ 1: 0, 2: 1, 3: 3, 4: 5, 5: 7 })[room.def.act || 1] || 0);
    // the room hums a little before it wakes
    A().pad.clear();
    A().ambient.setAwake(room.awakeFrac);
    room.later(0.05, () => A().sfx.thud(0.3));
  };

  Game.startTitle = function () {
    this.mode = 'title';
    this.levelId = 0;
    const room = this.makeRoom(TITLE_DEF);
    room.titleLit = 0;
    room.titleTarget = 0;
    this.enter(room, { instant: !this.room });
    if (UI()) UI().showTitle(true);
  };
  Game.startLevel = function (id, opts) {
    const def = G.Levels.find((l) => l.id === id);
    if (!def) {
      this.startTitle();
      return;
    }
    this.mode = 'level';
    this.levelId = id;
    const room = this.makeRoom(def);
    this.enter(room, opts);
    G.Save.data.current = id;
    if (UI()) UI().onLevel(def, G.Levels.length);
  };
  Game.startToy = function () {
    this.mode = 'toy';
    this.levelId = 900;
    const room = this.makeRoom(TOY_DEF);
    this.enter(room);
    if (UI()) UI().onToy();
  };
  Game.restart = function () {
    if (this.mode === 'title') return this.startTitle();
    if (this.mode === 'toy') return this.startToy();
    const def = G.Levels.find((l) => l.id === this.levelId);
    if (!def) return;
    const room = this.makeRoom(def);
    this.enter(room);
    if (UI()) UI().onLevel(def, G.Levels.length);
  };
  Game.next = function () {
    if (this.mode !== 'level') return;
    const n = this.levelId + 1;
    // the last level of an act ends with a small celebration sheet before the next act begins
    const act = (G.Acts || []).find((a) => a.to === this.levelId);
    if (act && UI() && !this.skipActEnd) UI().showActEnd(act);
    else if (G.Levels.find((l) => l.id === n)) this.startLevel(n);
    else if (UI()) UI().showActEnd(act);
  };
  Game.undo = function () {
    const room = this.room;
    if (!room || room.locked || room.phase !== 'playing') return;
    const e = room.undo.pop();
    if (!e) return;
    const prt = room.plugRT[e.plug];
    if (!prt || !(prt.state === 'seated' || prt.state === 'rest')) return;
    room.cancelHint();
    if (prt.seatSock) {
      const sock = room.L.socketsById[prt.seatSock];
      room.st.seat[prt.id] = null;
      prt.seatSock = null;
      prt.x = sock.x;
      prt.y = sock.y;
      prt.noseDisp = Math.atan2(-sock.fy, -sock.fx);
      prt.ins = 0;
      A().sfx.pop();
      room.updateCover();
      room.refreshPower();
    }
    const back = e.fromSock && Rules.canSeat(room.L, room.st, prt.id, e.fromSock).ok ? room.L.socketsById[e.fromSock] : null;
    prt.rope.release();
    if (back) {
      prt.rope.mode = 2;
      prt.rope.pin(prt.x, prt.y, back.fx, back.fy);
      room.seatInto(prt, back, { fromSock: null, fromPos: null });
    } else {
      const to = e.fromPos || prt.plug.device.rest;
      room.hopTo(prt, to.x, to.y, 0.34, 0);
    }
  };
  Game.hint = function () {
    const room = this.room;
    if (!room || room.phase !== 'playing') return;
    room.idle = 0;
    room.showHint();
  };

  Game.onRoomEvent = function (room, name, a) {
    if (room !== this.room) return;
    const ui = UI();
    if (name === 'power' && ui) ui.setPips(room.requiredOn(), room.requiredCount());
    else if (name === 'wake' && ui) ui.setPips(room.requiredOn(), room.requiredCount());
    else if (name === 'sleep' && ui) ui.setPips(room.requiredOn(), room.requiredCount());
    else if (name === 'seat') {
      if (room.title) this.titleSeated(room);
    } else if (name === 'win') {
      if (ui) ui.onWin();
    } else if (name === 'stars') {
      G.Save.complete(this.levelId, a);
      if (ui) ui.showStars(a);
    } else if (name === 'settle') {
      if (ui) ui.showNext();
    } else if (name === 'secret') {
      G.Save.secret(this.levelId);
      if (ui) ui.toast('Secret found!');
    }
  };

  Game.titleSeated = function (room) {
    room.titleTarget = 1;
    room.titleSeated = true;
    room.titleT0 = this.time;
    A().win(3);
    H().pulse('win');
    Fx.breathe();
    room.later(1.0, () => {
      if (UI() && this.room === room) UI().showMenu();
    });
  };

  /* ---------------------------------------------------------------- input */
  Game.toStage = function (e) {
    const r = this.canvas.getBoundingClientRect();
    const V = this.view;
    return { x: (e.clientX - r.left - V.ox) / V.scale, y: (e.clientY - r.top - V.oy) / V.scale };
  };
  Game.plugAt = function (room, x, y) {
    let best = null,
      bs = 1;
    const hr = Math.max(T.hitR, 22 / this.view.scale);
    for (const prt of room.plugList) {
      if (!(prt.state === 'rest' || prt.state === 'seated')) continue;
      if (prt.grab) continue;
      let score;
      if (prt.fat) {
        const a = prt.nose + Math.PI / 2;
        const c = Math.cos(a),
          s = Math.sin(a);
        const dx = x - prt.x,
          dy = y - prt.y;
        const lx = dx * c + dy * s,
          ly = -dx * s + dy * c;
        score = Math.max(Math.abs(lx) / (48 + 5), Math.abs(ly) / (16 + hr * 0.45));
      } else score = Math.hypot(x - prt.x, y - prt.y) / hr;
      if (score < bs) {
        bs = score;
        best = prt;
        best.hitScore = score;
      }
    }
    return best;
  };
  Game.onDown = function (e) {
    e.preventDefault();
    G.Audio.unlock();
    G.Audio.resume();
    const room = this.room;
    if (!room || this.swap || room.locked) return;
    if (!room.canInteract()) return;
    if (G.UI && G.UI.blocking()) return;
    try {
      this.canvas.setPointerCapture(e.pointerId);
    } catch (err) {}
    const p = this.toStage(e);
    p.x = U.clamp(p.x, -10, 370);
    p.y = U.clamp(p.y, -10, 650);
    const ptr = { id: e.pointerId, kind: 'none', x: p.x, y: p.y, ts: e.timeStamp };
    this.ptrs[e.pointerId] = ptr;
    const sw = room.switchAt(p.x, p.y);
    const prt = this.plugAt(room, p.x, p.y);
    // a switch under the thumb wins over a plug that is merely near (a brick's overhang must not steal the tap)
    if (sw && !(prt && prt.hitScore < 0.5)) {
      room.flipSwitch(sw);
      return;
    }
    if (prt && room.grabPlug(prt, e.pointerId, p.x, p.y)) {
      ptr.kind = 'plug';
      ptr.prt = prt;
      return;
    }
    // a sliding strip: grab its body and drag it along the rail
    const rs = room.stripAt && room.stripAt(p.x, p.y);
    if (rs && room.grabStrip(rs, e.pointerId, p.x, p.y)) {
      ptr.kind = 'strip';
      ptr.strip = rs;
      return;
    }
    // nudge a cable by its body (and pluck it: every cable is a string)
    let bestRope = null,
      bestPrt = null,
      bi = -1,
      bd = 16;
    for (const q of room.plugList) {
      const n = q.rope.nearest(p.x, p.y, true);
      if (n.d < bd && n.i > 0) {
        bd = n.d;
        bi = n.i;
        bestRope = q.rope;
        bestPrt = q;
      }
    }
    if (bestRope && room.phase !== 'cut') {
      ptr.kind = 'nudge';
      ptr.rope = bestRope;
      ptr.prt = bestPrt;
      ptr.i = bi;
      bestRope.nudge(bi, p.x, p.y);
      H().pulse('poke');
      room.pluckRope(bestPrt, bi / (bestRope.n - 1), 3.2);
      room.idle = 0;
      room.cancelHint();
      return;
    }
    if (room.pokeAt(p.x, p.y)) {
      room.idle = 0;
      return;
    }
    Fx.ring(p.x, p.y, 14, '#ffffff', 0.28, 1.4);
    room.idle = 0;
    room.cancelHint();
  };
  Game.onMove = function (e) {
    const ptr = this.ptrs[e.pointerId];
    if (!ptr) return;
    e.preventDefault();
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    const last = evs.length ? evs[evs.length - 1] : e;
    const p = this.toStage(last);
    p.x = U.clamp(p.x, -10, 370);
    p.y = U.clamp(p.y, -10, 650);
    if (ptr.kind === 'none' && this.room && this.room.canInteract()) {
      // a finger sweeping across the cables strums them (a harp)
      let ax = ptr.x,
        ay = ptr.y,
        t0 = ptr.ts;
      for (const ev of evs) {
        const q = this.toStage(ev);
        const dt = Math.max(0.008, (ev.timeStamp - t0) / 1000);
        const sp = Math.hypot(q.x - ax, q.y - ay) / dt;
        if (Math.hypot(q.x - ax, q.y - ay) > 1.5) this.room.strum(ax, ay, q.x, q.y, sp);
        ax = q.x;
        ay = q.y;
        t0 = ev.timeStamp;
      }
      ptr.ts = t0;
    }
    ptr.x = p.x;
    ptr.y = p.y;
    if (ptr.kind === 'plug') this.room.moveGrab(ptr.prt, p.x, p.y);
    else if (ptr.kind === 'strip') this.room.moveStripGrab(ptr.strip, p.x, p.y);
    else if (ptr.kind === 'nudge') ptr.rope.nudge(ptr.i, p.x, p.y);
  };
  Game.onUp = function (e) {
    this.releasePointer(e.pointerId);
    try {
      this.canvas.releasePointerCapture(e.pointerId);
    } catch (err) {}
  };
  Game.releasePointer = function (id) {
    const ptr = this.ptrs[id];
    if (!ptr) return;
    delete this.ptrs[id];
    if (ptr.kind === 'plug') this.room.releaseGrab(ptr.prt);
    else if (ptr.kind === 'strip') this.room.releaseStrip(ptr.strip);
    else if (ptr.kind === 'nudge') {
      ptr.rope.endNudge();
      if (this.room && ptr.prt) this.room.pluckRope(ptr.prt, ptr.i / (ptr.rope.n - 1), 2.0);
    }
  };

  /* ---------------------------------------------------------------- frame */
  Game.frame = function (ts) {
    const real = Math.min(0.05, (ts - this.last) / 1000 || 0.016);
    this.last = ts;
    this.watchPerf(real);
    const scaled = real * G.timeScale;
    let sim = scaled;
    if (Fx.stopT > 0) {
      Fx.stopT -= real;
      sim = 0;
    }
    this.time += real;
    const t0 = performance.now();
    this.update(scaled, sim, real);
    const t1 = performance.now();
    this.draw(real);
    const t2 = performance.now();
    // main-thread cost (raster happens off-thread); rolling averages for the debug overlay and tests
    this.cpuUpdate = (this.cpuUpdate || 0) * 0.95 + (t1 - t0) * 0.05;
    this.cpuDraw = (this.cpuDraw || 0) * 0.95 + (t2 - t1) * 0.05;
  };

  Game.update = function (dt, simDt, real) {
    Fx.update(real);
    if (this.swap) {
      const s = this.swap;
      s.t += real;
      const p = U.ease.inOutCubic(Math.min(1, s.t / s.dur));
      if (this.out) this.out.offX = -p * 400;
      this.room.offX = (1 - p) * 400;
      if (this.out) this.out.update(dt, simDt);
      if (s.t >= s.dur) {
        this.swap = null;
        this.out = null;
        this.room.offX = 0;
      }
    }
    const room = this.room;
    if (room) {
      room.update(dt, simDt);
      if (room.title) {
        room.titleLit = U.damp(room.titleLit, room.titleTarget || 0, 0.5, dt);
        // the title cable breathes: a faint, slow rustle so the plug never sits dead
        room.idleKick = (room.idleKick || 0) - dt;
        if (room.idleKick <= 0 && !room.titleSeated) {
          room.idleKick = 1.4 + Math.random();
          const prt = room.plugList[0];
          if (prt && prt.state === 'rest') {
            const r = prt.rope;
            const i = r.n - 1 - ((Math.random() * 6) | 0);
            r.x[i] += (Math.random() - 0.5) * 1.6;
            r.y[i] += (Math.random() - 0.5) * 1.6;
          }
        }
        if (room.idle > 3 && !room.hint && !room.titleSeated) room.showHint();
      }
      if (UI()) UI().tick(room, real);
    }
  };

  Game.watchPerf = function (real) {
    this.frameTimes.push(real);
    this.perfT += real;
    if (this.frameTimes.length > 120) this.frameTimes.shift();
    this.fps = 1 / (this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length);
    if (this.perfT > 2 && this.frameTimes.length >= 90 && !document.hidden) {
      this.perfT = 0;
      const s = this.frameTimes.slice().sort((a, b) => a - b);
      const p90 = s[Math.floor(s.length * 0.9)] * 1000;
      if (p90 > 21 && this.perfLevel < 5) {
        this.perfLevel++;
        Fx.scale = this.perfLevel >= 3 ? 0.5 : 1;
        if (this.perfLevel === 1 || this.perfLevel === 4) this.resize();
        this.frameTimes.length = 0;
      }
    }
  };

  /* ---------------------------------------------------------------- draw */
  Game.applyStage = function (ctx) {
    const V = this.view,
      z = Fx.zoom.x,
      sh = Fx.shake;
    const a = V.dpr * V.scale * z;
    const tx = V.dpr * (V.ox + V.scale * (180 - 180 * z) + sh.x.x * V.scale);
    const ty = V.dpr * (V.oy + V.scale * (320 - 320 * z) + sh.y.x * V.scale);
    ctx.setTransform(a, 0, 0, a, tx, ty);
  };
  Game.px = function (x, y) {
    const V = this.view,
      z = Fx.zoom.x,
      sh = Fx.shake;
    return {
      x: (V.ox + V.scale * (180 + z * (x - 180)) + sh.x.x * V.scale) * V.dpr,
      y: (V.oy + V.scale * (320 + z * (y - 320)) + sh.y.x * V.scale) * V.dpr,
    };
  };

  Game.draw = function (real) {
    const ctx = this.ctx,
      V = this.view;
    const cw = this.canvas.width,
      ch = this.canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    const rooms = [];
    if (this.out) rooms.push(this.out);
    if (this.room) rooms.push(this.room);
    // the surface slides with its room: the outgoing world full-bleed, the incoming one sweeping in over it
    ctx.drawImage(this.surfaceFor(rooms.length ? rooms[0].def.world : undefined), 0, 0, cw, ch);
    if (rooms.length > 1 && (rooms[1].def.world || 'desk') !== (rooms[0].def.world || 'desk')) ctx.drawImage(this.surfaceFor(rooms[1].def.world), rooms[1].offX * V.scale * V.dpr, 0, cw, ch);
    for (const r of rooms) {
      if (!r.mat) this.buildMat(r);
      this.applyStage(ctx);
      r.draw(ctx);
      if (r.title) this.drawTitle(ctx, r);
    }
    // fx in stage space, over the objects
    this.applyStage(ctx);
    Fx.draw(ctx, this.room ? this.room.offX : 0);
    if (this.room) this.room.drawHint(ctx);

    /* ---- the light map ---- */
    if (this.room) {
      const lights = [];
      let amb;
      const k = V.dpr * V.scale * Fx.zoom.x * this.lm.f;
      const f = this.lm.f;
      for (const r of rooms)
        for (const L of r.lights()) {
          const p = this.px(L.x, L.y);
          lights.push({ x: p.x * f, y: p.y * f, r: L.r * k, i: L.i, col: L.col });
        }
      if (this.swap && this.out) {
        const p = U.ease.inOutCubic(Math.min(1, this.swap.t / this.swap.dur));
        amb = U.lerp(this.out.ambientAlpha(), this.room.ambientAlpha(), p);
      } else amb = this.room.ambientAlpha();
      const dawn = this.room.dawn;
      const ac = U.rgb(U.mix('#141a34', '#2c2336', dawn));
      this.lm.render(lights, 'rgba(' + ac[0] + ',' + ac[1] + ',' + ac[2] + ',' + amb.toFixed(3) + ')');
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.drawImage(this.lm.cv, 0, 0, cw, ch);
      // warm additive glow over the lit pools
      ctx.globalCompositeOperation = 'lighter';
      for (const L of lights) {
        const x = L.x / f,
          y = L.y / f,
          r = (L.r / f) * 0.95;
        const c = U.rgb(L.col);
        const g = ctx.createRadialGradient(x, y, r * 0.05, x, y, r);
        g.addColorStop(0, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + 0.2 * L.i + ')');
        g.addColorStop(1, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
      ctx.globalCompositeOperation = 'source-over';
      if (this.room.flash > 0.01) {
        ctx.fillStyle = 'rgba(255,248,230,' + 0.85 * this.room.flash + ')';
        ctx.fillRect(0, 0, cw, ch);
      }
    }
    if (G.debug) this.drawDebug(ctx);
  };

  const LETTERS = ['M 52 14 C 44 2 10 0 10 22 C 10 40 52 36 52 58 C 52 82 14 80 4 64', 'M 8 80 L 8 0 M 8 28 C 10 6 52 4 52 36 L 52 80', 'M 8 0 L 8 44 C 8 80 52 80 52 44 M 52 0 L 52 80', 'M 56 38 A 26 26 0 1 0 4 38 A 26 26 0 1 0 56 38 M 56 12 L 56 80 C 56 108 12 110 4 90'];
  let letterPaths = null;
  // "snug", written by a cable: it sleeps (cool, faint) until the first plug-in lights it
  Game.drawTitleLetters = function (ctx, room) {
    if (!letterPaths) letterPaths = LETTERS.map((d) => new Path2D(d));
    const lit = room.titleLit || 0;
    const base = U.mix('#aeb6d0', '#fff0cc', lit);
    ctx.save();
    ctx.translate(40, 116);
    ctx.scale(0.92, 0.92);
    ctx.globalAlpha = 0.55 + 0.45 * lit;
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.translate(i * 82, 0);
      if (lit > 0.5) ctx.translate(0, -1.8 * Math.sin((this.time * 5) - i * 0.9) * Math.max(0, 1 - (this.time - (room.titleT0 || 0)) / 1.6));
      Art.cableStroke(ctx, letterPaths[i], base, 13, { glow: lit });
      ctx.restore();
    }
    ctx.restore();
  };
  Game.drawTitle = function (ctx, room) {
    const lit = room.titleLit || 0;
    ctx.save();
    ctx.translate(room.offX, 0);
    ctx.font = '800 15px ' + Art.FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,240,215,' + 0.8 * lit + ')';
    ctx.fillText('wake the room', 180, 262);
    ctx.restore();
  };

  Game.drawDebug = function (ctx) {
    const room = this.room;
    if (!room) return;
    this.applyStage(ctx);
    ctx.save();
    ctx.translate(room.offX, 0);
    ctx.lineWidth = 0.8;
    for (const prt of room.plugList) {
      const r = prt.rope;
      ctx.strokeStyle = 'rgba(0,255,160,0.8)';
      ctx.beginPath();
      for (let i = 0; i < r.n; i++) (i ? ctx.lineTo : ctx.moveTo).call(ctx, r.x[i], r.y[i]);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,0,0.9)';
      for (let i = 0; i < r.n; i++) ctx.fillRect(r.x[i] - 0.8, r.y[i] - 0.8, 1.6, 1.6);
      ctx.strokeStyle = 'rgba(255,100,100,0.5)';
      ctx.beginPath();
      ctx.arc(prt.x, prt.y, T.hitR, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(100,180,255,0.5)';
      ctx.beginPath();
      ctx.arc(prt.x, prt.y, T.engageR, 0, TAU);
      ctx.stroke();
    }
    for (const o of room.L.obstacles) {
      ctx.strokeStyle = 'rgba(255,0,200,0.6)';
      ctx.strokeRect(o.x - (o.w || o.r * 2) / 2, o.y - (o.h || o.r * 2) / 2, o.w || o.r * 2, o.h || o.r * 2);
    }
    ctx.restore();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(6, 70, 150, 34);
    ctx.fillStyle = '#9fffcf';
    ctx.font = '12px monospace';
    ctx.fillText('fps ' + (this.fps || 0).toFixed(0) + '  perf ' + this.perfLevel, 12, 84);
    ctx.fillText('js upd ' + (this.cpuUpdate || 0).toFixed(1) + ' draw ' + (this.cpuDraw || 0).toFixed(1) + ' ms', 12, 98);
  };
})();
