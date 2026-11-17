/* Snug — mech-blocks.js : pushable alphabet blocks (Level 25 "Block Party").
   Wooden blocks sit on a grid of whole cells (Rules.compileBlocks). Press one and it lifts and follows your finger with weight (a spring
   with a speed limit and an acceleration limit: a heavy toy, not a cursor); it cannot pass another block, a piece of furniture or the
   edge of the grid, so it stops and slides along whatever it meets; let go and it settles onto the nearest free cell with a little
   overshoot and a wooden thunk. A block is a tall obstacle for every cable (its rectangle lives in L.obstacles and is moved with the
   block, so ropes are pushed out of it live) and a socket under a block cannot take a plug until the block moves: lifting a block off a
   socket is the "ta-da". Every block is a marimba bar: it sounds its note when it hits something, so the wall can be played.
   Rules.* owns the cells, the reach and the search; this file owns the hand, the weight and the sound. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const U = G.U,
    Rules = G.Rules,
    Fx = G.Fx,
    Art = G.Art,
    Room = G.Room;
  const A = () => G.Audio;
  const H = () => G.Haptics;
  const sat = U.sat;
  // how a block feels (units: u, seconds)
  const FEEL = {
    follow: 17, // spring toward the finger (1/s)
    followHeavy: 11,
    vmax: 560, // fastest a block travels
    vmaxHeavy: 400,
    amax: 4400, // how quickly it can speed up or turn: this is the inertia
    amaxHeavy: 2600,
    hitMin: 90, // slower than this and a bump is silent
    snapK: 560, // settling spring
    snapC: 40,
  };
  // the marimba bars: a block plays the note of its letter (pentatonic-ish steps of the chime ladder)
  const NOTE = { S: 0, N: 2, U: 3, G: 5, A: 7, B: 4, C: 6, D: 1 };

  Room.prototype.blocksInit = function () {
    const L = this.L;
    const cell = L.grid.cell;
    this.blockRT = L.blocks.map((b, i) => ({
      b,
      i,
      x: b.x,
      y: b.y,
      vx: 0,
      vy: 0,
      held: false,
      ptr: null,
      ox: 0,
      oy: 0,
      tx: b.x,
      ty: b.y,
      lift: 0,
      sq: 0,
      sqx: 1,
      sqy: 0,
      tilt: 0,
      dest: null,
      grab: [b.c, b.r],
      cd: 0,
      shakeAt: -9,
      flash: 0,
      lookx: 0,
      looky: 1,
      blink: 0,
      blinkT: 1 + Math.random() * 3,
      mood: 0,
      moved: 0,
      gold: 0,
    }));
    this.blockScrape = 0;
    // furniture and walls: the cells nothing can be dragged onto, as rectangles
    this.blockWallRects = [];
    for (let r = 0; r < L.grid.rows; r++)
      for (let c = 0; c < L.grid.cols; c++)
        if (L.blockFixed[r * L.grid.cols + c]) this.blockWallRects.push({ x0: L.grid.x0 + c * cell, y0: L.grid.y0 + r * cell, x1: L.grid.x0 + (c + 1) * cell, y1: L.grid.y0 + (r + 1) * cell });
    let order = 0.05;
    for (const b of L.blocks) this.appearAt['b:' + b.id] = order += 0.05;
    this.blockSpelled = false;
    this.blockWas = L.sockets.filter((s) => Rules.blockCovers(L, s)).map((s) => s.id);
  };

  /* ---------------------------------------------------------------- input */
  Room.prototype.blockAt = function (x, y) {
    if (!this.blockRT || this.phase !== 'playing') return -1;
    let best = -1,
      by = -1e9;
    for (const rt of this.blockRT) {
      const hw = rt.b.ww / 2 + 3,
        hh = rt.b.hh / 2 + 3;
      if (Math.abs(x - rt.x) <= hw && Math.abs(y - rt.y) <= hh && rt.y > by) {
        best = rt.i;
        by = rt.y;
      }
    }
    return best;
  };
  Room.prototype.beginBlock = function (i, ptrId, x, y) {
    const rt = this.blockRT[i];
    if (!rt || rt.held) return false;
    rt.held = true;
    rt.ptr = ptrId;
    rt.dest = null;
    rt.ox = rt.x - x;
    rt.oy = rt.y - y;
    rt.tx = rt.x;
    rt.ty = rt.y;
    rt.grab = [rt.b.c, rt.b.r];
    rt.moved = 0;
    rt.mood = 0.6;
    this.cancelHint();
    this.idle = 0;
    A().sfx.blockLift && A().sfx.blockLift(rt.b.heavy ? 1 : 0.6);
    A().marimba && A().marimba(NOTE[rt.b.letter] || 0, 0.25, this.pan(rt.x));
    H().pulse('grab');
    return true;
  };
  Room.prototype.moveBlock = function (i, x, y) {
    const rt = this.blockRT[i];
    if (!rt || !rt.held) return;
    rt.tx = x + rt.ox;
    rt.ty = y + rt.oy;
    rt.lookx = U.damp(rt.lookx, Math.sign(rt.tx - rt.x) * Math.min(1, Math.abs(rt.tx - rt.x) / 30), 0.1, 0.016);
    rt.looky = U.damp(rt.looky, Math.sign(rt.ty - rt.y) * Math.min(1, Math.abs(rt.ty - rt.y) / 30), 0.1, 0.016);
    this.idle = 0;
  };
  Room.prototype.endBlock = function (i) {
    const rt = this.blockRT[i];
    if (!rt || !rt.held) return;
    rt.held = false;
    rt.ptr = null;
    rt.mood = 0;
    const lay = this.blockCommitted();
    const L = this.L,
      b = rt.b,
      cell = L.grid.cell;
    const occ = Rules.blockOcc(L, lay, i);
    for (const w of this.blockSeatedRects()) {
      const c = Math.floor(((w.x0 + w.x1) / 2 - L.grid.x0) / cell),
        r = Math.floor(((w.y0 + w.y1) / 2 - L.grid.y0) / cell);
      if (c >= 0 && r >= 0 && c < L.grid.cols && r < L.grid.rows) occ[r * L.grid.cols + c] = 1;
    }
    // the nearest cell this block can stand on (its footprint free), searched around where it was let go
    const c0 = Math.round((rt.x - L.grid.x0) / cell - b.w / 2),
      r0 = Math.round((rt.y - L.grid.y0) / cell - b.h / 2);
    let best = null,
      bd = 1e9;
    for (let dr = -2; dr <= 2; dr++)
      for (let dc = -2; dc <= 2; dc++) {
        const c = c0 + dc,
          r = r0 + dr;
        if (!Rules.blockFits(L, occ, b, c, r)) continue;
        const p = Rules.cellCentre(L, c, r, b.w, b.h);
        const d = Math.hypot(p.x - rt.x, p.y - rt.y);
        if (d < bd) {
          bd = d;
          best = [c, r];
        }
      }
    rt.dest = best || rt.grab.slice();
    this.idle = 0;
  };
  // the cell each block is committed to (a settling block counts at its destination)
  Room.prototype.blockCommitted = function () {
    return this.blockRT.map((rt) => (rt.dest ? rt.dest.slice() : [rt.b.c, rt.b.r]));
  };

  /* ---------------------------------------------------------------- physics */
  // a socket with a plug in it is solid (the plug stands up out of it): nothing is slid or dropped there
  Room.prototype.blockSeatedRects = function () {
    const L = this.L,
      out = [];
    for (const k in this.st.seat) {
      const id = this.st.seat[k];
      if (!id) continue;
      const s = L.socketsById[id];
      out.push({ x0: s.x - 20, x1: s.x + 20, y0: s.y - 20, y1: s.y + 20 });
    }
    return out;
  };
  // does block rt overlap anything solid at its current position? returns the rectangle it hits (or null)
  Room.prototype.blockOverlap = function (rt) {
    const hw = rt.b.ww / 2,
      hh = rt.b.hh / 2,
      x0 = rt.x - hw,
      x1 = rt.x + hw,
      y0 = rt.y - hh,
      y1 = rt.y + hh,
      E = 0.01;
    const G0 = this.L.grid;
    // the edge of the grid
    if (x0 < G0.x0 + 2) return { x0: -1e3, x1: G0.x0 + 2, y0: -1e3, y1: 1e3, edge: true };
    if (x1 > G0.x0 + G0.cols * G0.cell - 2) return { x0: G0.x0 + G0.cols * G0.cell - 2, x1: 1e3, y0: -1e3, y1: 1e3, edge: true };
    if (y0 < G0.y0 + 2) return { x0: -1e3, x1: 1e3, y0: -1e3, y1: G0.y0 + 2, edge: true };
    if (y1 > G0.y0 + G0.rows * G0.cell - 2) return { x0: -1e3, x1: 1e3, y0: G0.y0 + G0.rows * G0.cell - 2, y1: 1e3, edge: true };
    for (const w of this.blockWallRects) if (x1 > w.x0 + E && x0 < w.x1 - E && y1 > w.y0 + E && y0 < w.y1 - E) return w;
    for (const w of this.blockSeatedRects()) if (x1 > w.x0 + E && x0 < w.x1 - E && y1 > w.y0 + E && y0 < w.y1 - E) return w;
    for (const o of this.blockRT) {
      if (o === rt) continue;
      const ox0 = o.x - o.b.ww / 2,
        ox1 = o.x + o.b.ww / 2,
        oy0 = o.y - o.b.hh / 2,
        oy1 = o.y + o.b.hh / 2;
      if (x1 > ox0 + E && x0 < ox1 - E && y1 > oy0 + E && y0 < oy1 - E) return { x0: ox0, x1: ox1, y0: oy0, y1: oy1, block: o };
    }
    return null;
  };
  // move a block by (dx, dy), one axis at a time in short steps, stopping against what it meets (so it slides along walls)
  Room.prototype.blockMove = function (rt, dx, dy) {
    const hit = { speed: 0, other: null, edge: false };
    const hw = rt.b.ww / 2,
      hh = rt.b.hh / 2;
    for (let axis = 0; axis < 2; axis++) {
      const d = axis ? dy : dx;
      if (!d) continue;
      const steps = Math.max(1, Math.ceil(Math.abs(d) / 5));
      for (let s = 0; s < steps; s++) {
        if (axis) rt.y += d / steps;
        else rt.x += d / steps;
        const c = this.blockOverlap(rt);
        if (!c) continue;
        if (axis) {
          rt.y = d > 0 ? c.y0 - hh : c.y1 + hh;
          hit.speed = Math.max(hit.speed, Math.abs(rt.vy));
          rt.vy = 0;
        } else {
          rt.x = d > 0 ? c.x0 - hw : c.x1 + hw;
          hit.speed = Math.max(hit.speed, Math.abs(rt.vx));
          rt.vx = 0;
        }
        hit.other = c.block || hit.other;
        hit.edge = hit.edge || !!c.edge;
        hit.axis = axis;
        hit.dir = d > 0 ? 1 : -1;
        break;
      }
    }
    return hit;
  };
  // a block met something: the marimba note of its letter, a haptic, a squash, and the thing it hit shivers
  Room.prototype.blockBump = function (rt, hit) {
    if (rt.cd > 0 || hit.speed < FEEL.hitMin) return;
    rt.cd = 0.09;
    const p = sat(hit.speed / 520);
    rt.sq = Math.max(rt.sq, 0.35 + 0.65 * p);
    rt.sqx = hit.axis === 0 ? 1 : 0;
    rt.sqy = hit.axis === 1 ? 1 : 0;
    rt.flash = 1;
    rt.mood = 1;
    const pan = this.pan(rt.x);
    A().marimba && A().marimba(NOTE[rt.b.letter] || 0, 0.35 + 0.65 * p, pan);
    if (hit.other) {
      const o = hit.other;
      o.shakeAt = this.t;
      o.sq = Math.max(o.sq, 0.25 * p);
      A().marimba && A().marimba(NOTE[o.b.letter] || 0, 0.2 + 0.5 * p, this.pan(o.x));
    } else A().sfx.woodThunk && A().sfx.woodThunk(0.3 + 0.7 * p, pan);
    H().pulse('poke', 0.3 + 0.5 * p);
    if (p > 0.55) {
      const cx = rt.x + (hit.axis === 0 ? hit.dir * rt.b.ww / 2 : 0),
        cy = rt.y + (hit.axis === 1 ? hit.dir * rt.b.hh / 2 : 0);
      Fx.sparkle && Fx.sparkle(cx, cy, '#f3d9a4', 3 + Math.round(4 * p));
    }
  };

  Room.prototype.blocksUpdate = function (dt) {
    const L = this.L;
    let loudest = 0;
    for (const rt of this.blockRT) {
      const b = rt.b,
        heavy = b.heavy;
      rt.cd = Math.max(0, rt.cd - dt);
      if (rt.fly) {
        // the Wake: this block hops out of the box to its place in the row (a parabola, a half spin), and lands with its note
        const f = rt.fly;
        f.t += dt;
        const u = U.clamp((f.t - f.delay) / f.dur, 0, 1),
          e = u * u * (3 - 2 * u);
        if (f.t >= f.delay) {
          rt.x = f.x0 + (f.x1 - f.x0) * e;
          rt.y = f.y0 + (f.y1 - f.y0) * e - Math.sin(Math.PI * u) * 74;
          rt.lift = Math.sin(Math.PI * u);
          rt.tilt = Math.sin(u * Math.PI) * 0.4 * f.spin;
          rt.mood = 0.7;
          if (u >= 1) {
            rt.fly = null;
            rt.finale = true;
            rt.lift = 0;
            rt.tilt = 0;
            rt.sq = 0.8;
            rt.sqx = 0;
            rt.sqy = 1;
            rt.gold = 1;
            A().marimba && A().marimba(f.note, 0.8, this.pan(rt.x));
            A().sfx.woodThunk && A().sfx.woodThunk(0.5, this.pan(rt.x), 0.8);
            Fx.sparkle && Fx.sparkle(rt.x, rt.y, '#ffe9bd', 7);
            H().pulse('seat', 0.5);
          }
        }
      } else if (rt.held) {
        // follow the finger with weight: a spring with a speed limit and a limit on how fast the velocity may change
        const K = heavy ? FEEL.followHeavy : FEEL.follow,
          VM = heavy ? FEEL.vmaxHeavy : FEEL.vmax,
          AM = heavy ? FEEL.amaxHeavy : FEEL.amax;
        const ex = rt.tx - rt.x,
          ey = rt.ty - rt.y,
          dist = Math.hypot(ex, ey);
        const want = Math.min(VM, dist * K);
        const wx = dist > 0.01 ? (ex / dist) * want : 0,
          wy = dist > 0.01 ? (ey / dist) * want : 0;
        let dvx = wx - rt.vx,
          dvy = wy - rt.vy;
        const dv = Math.hypot(dvx, dvy),
          mdv = AM * dt;
        if (dv > mdv) {
          dvx *= mdv / dv;
          dvy *= mdv / dv;
        }
        rt.vx += dvx;
        rt.vy += dvy;
        const hit = this.blockMove(rt, rt.vx * dt, rt.vy * dt);
        if (hit.speed > 0) this.blockBump(rt, hit);
        rt.moved += Math.hypot(rt.vx, rt.vy) * dt;
        loudest = Math.max(loudest, sat(Math.hypot(rt.vx, rt.vy) / 380));
        rt.lift = U.damp(rt.lift, 1, 0.07, dt);
        rt.tilt = U.damp(rt.tilt, U.clamp(rt.vx / 900, -0.07, 0.07), 0.08, dt);
      } else if (rt.dest) {
        // settle onto the cell: a spring with a little overshoot
        const p = Rules.cellCentre(L, rt.dest[0], rt.dest[1], b.w, b.h);
        const ax = FEEL.snapK * (p.x - rt.x) - FEEL.snapC * rt.vx,
          ay = FEEL.snapK * (p.y - rt.y) - FEEL.snapC * rt.vy;
        rt.vx += ax * dt;
        rt.vy += ay * dt;
        rt.x += rt.vx * dt;
        rt.y += rt.vy * dt;
        rt.lift = U.damp(rt.lift, 0, 0.06, dt);
        rt.tilt = U.damp(rt.tilt, 0, 0.08, dt);
        if (Math.hypot(p.x - rt.x, p.y - rt.y) < 0.5 && Math.hypot(rt.vx, rt.vy) < 10) this.blockSettled(rt, p);
      } else {
        rt.lift = U.damp(rt.lift, 0, 0.06, dt);
        rt.tilt = U.damp(rt.tilt, 0, 0.08, dt);
      }
      // the rectangle ropes are pushed out of follows the block (not the ones hopping about in the finale)
      if (!rt.fly && !rt.finale) {
        b.obs.x = rt.x;
        b.obs.y = rt.y;
      }
      rt.sq = Math.max(0, rt.sq - dt * 3.2);
      rt.flash = Math.max(0, rt.flash - dt * 4);
      rt.mood = Math.max(0, rt.mood - dt * (rt.held ? 0.2 : 1.2));
      if (!this.secretFound && !rt.finale) rt.gold = Math.max(0, rt.gold - dt * 0.12);
      // blinking (Blocky has a face)
      rt.blinkT -= dt;
      if (rt.blinkT <= 0) {
        rt.blink = 0.14;
        rt.blinkT = 2 + Math.random() * 3.5;
      }
      rt.blink = Math.max(0, rt.blink - dt);
      if (!rt.held) {
        rt.lookx = U.damp(rt.lookx, 0, 0.5, dt);
        rt.looky = U.damp(rt.looky, 0.4, 0.5, dt);
      }
    }
    if (this.towerCat) this.towerCat.t += dt;
    // the scrape of wood on felt, as loud as the fastest block is moving
    this.blockScrape = U.damp(this.blockScrape, loudest, 0.06, dt);
    A().sfx.blockScrape && A().sfx.blockScrape(this.blockScrape);
  };

  // a block has come to rest on a cell: commit it, refresh the cables' reach, and see what it uncovered
  Room.prototype.blockSettled = function (rt, p) {
    const L = this.L,
      b = rt.b,
      from = rt.grab,
      to = rt.dest;
    rt.x = p.x;
    rt.y = p.y;
    rt.vx = 0;
    rt.vy = 0;
    rt.dest = null;
    rt.sq = Math.max(rt.sq, 0.5);
    rt.sqx = 0;
    rt.sqy = 1;
    Rules.placeBlock(L, b, to[0], to[1]);
    Geom().invalidate(L.obstacles);
    this.blocksRefresh();
    const pw = sat(rt.moved / 160);
    A().sfx.woodThunk && A().sfx.woodThunk(0.5 + 0.5 * (b.heavy ? 1 : 0.4), this.pan(rt.x), 0.4 + 0.5 * pw);
    H().pulse('seat', 0.45 + 0.3 * pw);
    if (from[0] !== to[0] || from[1] !== to[1]) {
      this.pushUndo({ block: b.id, from: from.slice(), to: to.slice() });
      this.blockMoves = (this.blockMoves || 0) + 1;
    }
    // a seated cable that can no longer reach round this block: the block goes back (a cable is a tether)
    if (this.blockTetherBroken()) {
      const back = from.slice();
      this.undo.pop();
      Fx.caption('the cable!', rt.x, rt.y - 34, '#ffd9c8');
      A().sfx.strain && A().sfx.strain();
      H().pulse('refuse');
      const occ = Rules.blockOcc(L, this.blockCommitted(), rt.i);
      rt.grab = to.slice();
      rt.dest = Rules.blockFits(L, occ, b, back[0], back[1]) ? back : to.slice();
      return;
    }
    this.blockReveal();
    this.blockSpellCheck();
  };
  const Geom = () => G.Geom;
  // refresh every cable's exact reach for the blocks where they are (once a block has settled)
  Room.prototype.blocksRefresh = function () {
    const L = this.L;
    L.reach = {};
    Rules.computeReach(L);
    this.updateCover && this.updateCover();
  };
  // would a plugged-in cable no longer reach its socket round the blocks as they stand?
  Room.prototype.blockTetherBroken = function () {
    const L = this.L;
    for (const p of L.plugs) {
      const sid = this.st.seat[p.id];
      if (sid && L.reach[p.id][sid].ratio > 0.995) return true;
    }
    return false;
  };
  // a socket that was under a block and is not any more: ta-da
  Room.prototype.blockReveal = function () {
    const L = this.L;
    const now = L.sockets.filter((s) => Rules.blockCovers(L, s)).map((s) => s.id);
    for (const id of this.blockWas) {
      if (now.includes(id)) continue;
      const s = L.socketsById[id];
      A().chime(4, 0.02, this.pan(s.x));
      A().chime(7, 0.12, this.pan(s.x));
      Fx.starburst && Fx.starburst(s.x, s.y, 8);
      Fx.caption('ta-da!', s.x, s.y - 30, '#fff4c8');
      H().pulse('seat', 0.8);
    }
    this.blockWas = now;
  };
  // S, N, U, G in a row, in order, side by side: the secret (a golden letter) — spelled anywhere, even for a moment
  Room.prototype.blockSpellCheck = function () {
    const sec = this.def.secret;
    if (!sec || sec.on !== 'spelled' || this.secretFound) return;
    const word = sec.word || 'SNUG',
      L = this.L;
    const at = {};
    for (const b of L.blocks) if (b.w === 1 && b.h === 1) at[b.c + ',' + b.r] = b.letter;
    for (const b of L.blocks) {
      if (b.letter !== word[0] || b.w !== 1 || b.h !== 1) continue;
      let ok = true;
      for (let k = 1; k < word.length; k++) if (at[b.c + k + ',' + b.r] !== word[k]) ok = false;
      if (!ok) continue;
      this.secretFound = true;
      this.onEvent('secret', sec);
      A().chime(9);
      for (let k = 0; k < word.length; k++) {
        const rt = this.blockRT.find((q) => q.b.c === b.c + k && q.b.r === b.r);
        if (rt) rt.gold = 1;
      }
      Fx.sparkle(sec.x, sec.y, '#ffe9bd', 14);
      Fx.starburst(sec.x, sec.y, 10);
      return;
    }
  };
  // undo of a block move: the block goes back where it was, if it can
  Room.prototype.undoBlock = function (e) {
    const rt = this.blockRT.find((q) => q.b.id === e.block);
    if (!rt || rt.held || rt.dest) return false;
    const L = this.L,
      occ = Rules.blockOcc(L, this.blockCommitted(), rt.i);
    if (!Rules.blockFits(L, occ, rt.b, e.from[0], e.from[1])) return false;
    rt.grab = [rt.b.c, rt.b.r];
    rt.dest = e.from.slice();
    rt.moved = 160;
    this.cancelHint();
    return true;
  };
  // the hint hand takes hold of the block and carries it along its route
  Room.prototype.blockHintPath = function (act) {
    const L = this.L,
      b = L.blocksById[act.id];
    return act.route.map((q) => Rules.cellCentre(L, q[0], q[1], b.w, b.h));
  };

  /* ---------------------------------------------------------------- the Wake: the toys spell the name of the game */
  // S, N, U, G hop out of the box into the sunbeam and stand in a row, each landing on its marimba note; Blocky beams; Biscuit takes the
  // warm patch beside them; far away a needle comes down on a record (the next room)
  Room.prototype.blocksWake = function () {
    const F = this.def.finale;
    for (const rt of this.blockRT) rt.mood = 1;
    if (!F) return;
    const word = F.word || 'SNUG',
      row = F.row;
    [...word].forEach((ch, k) => {
      const rt = this.blockRT.find((q) => q.b.letter === ch && q.b.w === 1 && q.b.h === 1);
      if (!rt) return;
      rt.held = false;
      rt.dest = null;
      const x1 = row.x + (k - (word.length - 1) / 2) * row.pitch;
      rt.fly = { t: 0, delay: 0.5 + k * 0.17, dur: 0.62, x0: rt.x, y0: rt.y, x1, y1: row.y, spin: k % 2 ? 1 : -1, note: NOTE[ch] === undefined ? k * 2 : NOTE[ch] };
      this.later(0.5 + k * 0.17, () => A().sfx.blockLift && A().sfx.blockLift());
    });
    if (F.cat) {
      this.later(1.5, () => {
        this.towerCat = { x: F.cat.x, y: F.cat.y, t: 0 };
        A().sfx.chirrup && A().sfx.chirrup();
        Fx.sparkle && Fx.sparkle(F.cat.x, F.cat.y, '#fff1c8', 6);
      });
    }
    if (this.def.teaser) this.later(4.3, () => A().sfx[this.def.teaser] && A().sfx[this.def.teaser]());
  };

  /* ---------------------------------------------------------------- drawing */
  Room.prototype.blocksDrawShadows = function (ctx, t) {
    for (const rt of this.blockRT) {
      const p = this.ap('b:' + rt.b.id);
      if (p < 0.01) continue;
      ctx.save();
      ctx.globalAlpha = p;
      Art.blockShadow(ctx, rt, t);
      ctx.restore();
    }
  };
  // the hint shows where the block should stand: a dashed outline on its destination cell
  Room.prototype.blocksDrawHint = function (ctx, t) {
    const h = this.hint;
    if (!h || h.act.type !== 'block') return;
    const L = this.L,
      b = L.blocksById[h.act.id],
      p = Rules.cellCentre(L, h.act.to[0], h.act.to[1], b.w, b.h);
    ctx.save();
    ctx.setLineDash([7, 6]);
    ctx.lineDashOffset = -t * 14;
    ctx.strokeStyle = 'rgba(255,244,200,' + (0.55 + 0.25 * Math.sin(t * 5)).toFixed(3) + ')';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    Art.rrect(ctx, p.x - b.ww / 2, p.y - b.hh / 2, b.ww, b.hh, 7);
    ctx.stroke();
    ctx.restore();
  };
  Room.prototype.blocksDraw = function (ctx, t) {
    this.blocksDrawHint(ctx, t);
    // lower on the screen is nearer: draw from the top down; a held block is on top of everything
    const order = this.blockRT.slice().sort((a, b) => (a.held ? 1 : 0) - (b.held ? 1 : 0) || a.y - b.y);
    for (const rt of order) {
      const p = this.ap('b:' + rt.b.id);
      if (p < 0.01) continue;
      ctx.save();
      const e = U.ease.outBack(p, 1.4);
      const s = 0.55 + 0.45 * e;
      ctx.translate(rt.x, rt.y - (1 - e) * 24);
      ctx.scale(s, s);
      ctx.translate(-rt.x, -rt.y);
      ctx.globalAlpha = Math.min(1, p * 1.8);
      Art.block(ctx, rt, t, this.t);
      ctx.restore();
    }
    if (this.towerCat) {
      const c = this.towerCat;
      const e = U.ease.outBack(U.clamp(c.t / 0.45, 0, 1), 1.6);
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.scale(0.4 + 0.6 * e, 0.4 + 0.6 * e);
      ctx.translate(-c.x, -c.y);
      ctx.globalAlpha = Math.min(1, c.t * 3);
      Art.catWalker(ctx, { x: c.x, y: c.y, heading: -0.3, pose: 'nap' }, t);
      ctx.restore();
    }
  };
})();
