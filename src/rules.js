/* Snug — rules.js : the formal model. Compatibility, reach, footprints, power, solver, hints, luck score,
   layout checks. One module shared by the game, hints, validator and bot. Runs in Node and the browser.
   Rendering and physics never decide legality; they only report geometry to this module. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const Geom = G.Geom,
    U = G.U;
  const Rules = (G.Rules = {});

  const CFG = (Rules.CFG = {
    seg: 8, // matches T.segLen default; the exit pin is one segment long
    pinOut: 8,
    cableR: 2.6,
    reachOK: 1.0, // needed/len <= this is reachable
    reachDesign: 0.94, // intended solutions should use <= this much of the cable
    decoyDesign: 1.1, // plausible decoys should need >= this much
    slotPad: 14, // strip body overhang beyond the end sockets
    switchLen: 66, // extra strip length for a switch block
    stripH: 56,
    postR: 5, // radius of a hoop's post
    railTaut: 0.985, // a strip stops sliding before a seated cable would use more than this much of its length
    stage: { w: 360, h: 640 },
    safe: { x0: 10, x1: 350, y0: 36, y1: 606 },
  });

  /* device dimensions for layout checks and drawing; (w,h) top-down body, portDy = port distance from center along local +y */
  const DEV = (Rules.DEV = {
    phone: { w: 50, h: 92, portDy: 46, name: 'Pip' },
    tablet: { w: 76, h: 104, portDy: 52, name: 'Big Sleepy' },
    laptop: { w: 100, h: 86, portDy: 43, name: 'Boxy' },
    console: { w: 84, h: 58, portDy: 29, name: 'Gus' },
    lamp: { w: 46, h: 92, portDy: 46, name: 'Lumi' },
    radio: { w: 92, h: 56, portDy: 28, name: 'Rex' },
    drill: { w: 64, h: 86, portDy: 43, name: 'Spike' }, // Act 2: the impatient power drill
    anchor: { w: 2, h: 2, portDy: 0, name: 'cord' }, // invisible cable root (title screen)
  });

  Rules.KEYS = ['coral', 'amber', 'mint', 'sky', 'violet'];

  /* ---------------------------------------------------------------- compile */
  Rules.stripBounds = function (st) {
    // local x range of the strip body (sockets are centered at 0)
    const half = (st.n * st.pitch) / 2;
    if (st.kind === 'grommet') return [-22, 22];
    return [-(half + CFG.slotPad), half + CFG.slotPad + (st.hasSwitch ? CFG.switchLen : 0)];
  };

  // local x of a strip's switch (the block sits past the last socket, clear of a brick's overhang)
  Rules.switchX = function (st) {
    return (st.n * st.pitch) / 2 + 52;
  };

  Rules.compile = function (def) {
    const L = {
      def,
      id: def.id,
      name: def.name,
      strips: [],
      stripsById: {},
      sockets: [],
      socketsById: {},
      devices: [],
      devicesById: {},
      plugs: [],
      plugsById: {},
      obstacles: [],
      reach: {},
      rails: [], // strips that slide on a rail (kinematic strips)
    };
    for (const o of def.obstacles || []) {
      const ob = Object.assign({ shape: 'circle', tall: true }, o);
      if (ob.shape === 'rrect') {
        ob.rot = ob.rot || 0;
        if (ob.cr === undefined) ob.cr = 8;
      }
      L.obstacles.push(ob);
    }
    // hoops: two posts and the gap between them. A cable that runs THROUGH the gap threads the gate.
    L.gates = [];
    L.gatesById = {};
    for (const g of def.gates || []) {
      const rot = g.rot || 0,
        half = (g.gap || 38) / 2;
      const cx = Math.cos(rot),
        sy = Math.sin(rot);
      const gate = { id: g.id, def: g, x: g.x, y: g.y, rot, gap: half * 2, key: g.key || 'any', a: { x: g.x - cx * half, y: g.y - sy * half }, b: { x: g.x + cx * half, y: g.y + sy * half }, mid: { x: g.x, y: g.y } };
      L.gates.push(gate);
      L.gatesById[gate.id] = gate;
      for (const e of [gate.a, gate.b]) L.obstacles.push({ shape: 'circle', tall: true, x: e.x, y: e.y, r: CFG.postR, gate: gate.id, art: 'post' });
    }
    for (const s of def.strips) {
      const n = s.slots || 1,
        pitch = s.pitch || 40,
        a = s.angle || 0;
      const ca = Math.cos(a),
        sa = Math.sin(a);
      const st = {
        id: s.id,
        def: s,
        x: s.x,
        y: s.y,
        angle: a,
        n,
        pitch,
        kind: s.kind || 'strip',
        hasSwitch: !!s.switch,
        sockets: [],
        fx: sa,
        fy: -ca,
      };
      for (let i = 0; i < n; i++) {
        const lx = (i - (n - 1) / 2) * pitch;
        const sd = (s.sockets && s.sockets[i]) || {};
        const sock = {
          id: s.id + '.' + (i + 1),
          strip: st,
          slot: i + 1,
          x: s.x + lx * ca,
          y: s.y + lx * sa,
          fx: sa,
          fy: -ca,
          key: sd.key || 'any',
          dead: !!sd.dead,
        };
        st.sockets.push(sock);
        L.sockets.push(sock);
        L.socketsById[sock.id] = sock;
      }
      if (s.rail) {
        const r = s.rail;
        const ddx = r.x1 - r.x0,
          ddy = r.y1 - r.y0,
          rl = Math.hypot(ddx, ddy);
        st.rail = { x0: r.x0, y0: r.y0, x1: r.x1, y1: r.y1, len: rl, detents: (r.detents || [0, 1]).slice(), start: r.start || 0 };
        L.rails.push(st);
      }
      L.strips.push(st);
      L.stripsById[st.id] = st;
      if (st.rail) Rules.setStripK(st, st.rail.detents[st.rail.start]);
    }
    for (const d of def.devices) {
      const meta = DEV[d.type];
      if (!meta) throw new Error('unknown device type ' + d.type);
      const a = d.angle || 0;
      const port = { x: d.x - Math.sin(a) * meta.portDy, y: d.y + Math.cos(a) * meta.portDy };
      const plug = {
        id: d.id,
        device: null,
        key: (d.plug && d.plug.key) || 'any',
        size: (d.plug && d.plug.size) || 'slim',
      };
      const dev = {
        id: d.id,
        def: d,
        type: d.type,
        meta,
        x: d.x,
        y: d.y,
        angle: a,
        port,
        len: d.cable.len,
        curl: d.cable.curl || 1,
        plug,
        color: d.color || 'mint',
        required: d.required !== false,
        via: [],
      };
      // the hoops this device's cable must run through: explicit ids, or every hoop of the plug's own key (top to bottom)
      if (d.via) dev.via = d.via.map((id) => L.gatesById[id]).filter(Boolean);
      else if (plug.key !== 'any') dev.via = L.gates.filter((g) => g.key === plug.key).sort((a, b) => a.y - b.y);
      // resting plug position: explicit or derived from direction/fraction of cable length
      if (d.rest) dev.rest = { x: d.rest.x, y: d.rest.y };
      else {
        const dir = ((d.dir === undefined ? 0 : d.dir) * Math.PI) / 180;
        const f = d.frac === undefined ? 0.72 : d.frac;
        dev.rest = { x: port.x + Math.sin(dir) * dev.len * f, y: port.y + Math.cos(dir) * dev.len * f };
      }
      plug.device = dev;
      L.devices.push(dev);
      L.devicesById[dev.id] = dev;
      L.plugs.push(plug);
      L.plugsById[plug.id] = plug;
    }
    Rules.computeReach(L);
    if (L.rails.length) Rules.computeRailReach(L);
    return L;
  };

  function reachEntry(L, p, s) {
    const dev = p.device,
      clr = CFG.cableR + 1;
    const rear = { x: s.x + s.fx * CFG.pinOut, y: s.y + s.fy * CFG.pinOut };
    // the route runs through every hoop of this device, in order, then to the socket
    let needed = 0,
      pts = [];
    let cur = dev.port;
    const stops = dev.via.map((g) => g.mid).concat([rear]);
    for (const w of stops) {
      const g = Geom.shortest(cur, w, L.obstacles, clr);
      needed += g.len;
      pts = pts.concat(pts.length ? g.pts.slice(1) : g.pts);
      cur = w;
    }
    needed += CFG.pinOut;
    pts.push({ x: s.x, y: s.y });
    return { needed, ratio: needed / dev.len, ok: needed / dev.len <= CFG.reachOK, pts };
  }
  // the finger's route for a plug now at `from`: through its hoops, then to the socket's pre-slide point
  Rules.routeVia = function (L, from, plugId, sockId, pre) {
    const dev = L.plugsById[plugId].device;
    const clr = CFG.cableR + 4;
    let pts = [{ x: from.x, y: from.y }];
    let cur = from;
    for (const w of dev.via.map((g) => g.mid).concat([pre])) {
      const g = Geom.shortest(cur, w, L.obstacles, clr);
      pts = pts.concat(g.pts.slice(1));
      cur = w;
    }
    return pts;
  };
  Rules.computeReach = function (L) {
    for (const p of L.plugs) {
      const r = (L.reach[p.id] = {});
      for (const s of L.sockets) r[s.id] = reachEntry(L, p, s);
    }
  };

  /* ---------------------------------------------------------------- kinematic strips (rails)
     A strip with `rail: {x0,y0,x1,y1,detents:[0..1], start}` slides along the segment; it only *rests* at detents.
     Sockets move with it (positions are mutated in place), so reach is precomputed per detent (reachAt) and, for the
     slide limits, per 41 samples along the rail (railSamples). Rules.applyDetent keeps L.reach in sync with a state. */
  Rules.setStripK = function (st, k) {
    const r = st.rail;
    k = k < 0 ? 0 : k > 1 ? 1 : k;
    st.k = k;
    st.x = r.x0 + (r.x1 - r.x0) * k;
    st.y = r.y0 + (r.y1 - r.y0) * k;
    const ca = Math.cos(st.angle),
      sa = Math.sin(st.angle);
    for (const sock of st.sockets) {
      const lx = (sock.slot - 1 - (st.n - 1) / 2) * st.pitch;
      sock.x = st.x + lx * ca;
      sock.y = st.y + lx * sa;
    }
  };
  Rules.computeRailReach = function (L) {
    L.reachAt = {};
    L.railSamples = {};
    const K = 41;
    for (const st of L.rails) {
      const per = [];
      for (const k of st.rail.detents) {
        Rules.setStripK(st, k);
        const m = {};
        for (const p of L.plugs) {
          m[p.id] = {};
          for (const s of st.sockets) m[p.id][s.id] = reachEntry(L, p, s);
        }
        per.push(m);
      }
      L.reachAt[st.id] = per;
      const need = {};
      for (let i = 0; i < K; i++) {
        Rules.setStripK(st, i / (K - 1));
        for (const p of L.plugs)
          for (const s of st.sockets) {
            const key = p.id + '|' + s.id;
            (need[key] = need[key] || new Float32Array(K))[i] = reachEntry(L, p, s).ratio;
          }
      }
      L.railSamples[st.id] = { K, need };
      Rules.setStripK(st, st.rail.detents[st.rail.start]);
      for (const p of L.plugs) for (const s of st.sockets) L.reach[p.id][s.id] = per[st.rail.start][p.id][s.id];
    }
  };
  // cable use (needed / length) of a plug at a socket of a rail strip, with the strip at fraction k (interpolated)
  Rules.railRatio = function (L, st, plugId, sockId, k) {
    const sm = L.railSamples[st.id];
    const arr = sm.need[plugId + '|' + sockId];
    const f = Math.max(0, Math.min(1, k)) * (sm.K - 1);
    const i = Math.min(sm.K - 2, Math.floor(f));
    return arr[i] + (arr[i + 1] - arr[i]) * (f - i);
  };
  // is the stretch of rail from k0 to k1 within every seated cable's length? (k0 is assumed to be where the strip is now,
  // so it only gets a loose check; k1 is checked exactly (interpolated) and so is every sample strictly between them)
  Rules.railSpanOK = function (L, stS, strip, k0, k1) {
    const sm = L.railSamples[strip.id];
    const lo = Math.max(0, Math.min(1, Math.min(k0, k1))) * (sm.K - 1),
      hi = Math.max(0, Math.min(1, Math.max(k0, k1))) * (sm.K - 1);
    const at = (arr, f) => {
      const i = Math.min(sm.K - 2, Math.floor(f));
      return arr[i] + (arr[i + 1] - arr[i]) * (f - i);
    };
    const fFrom = Math.max(0, Math.min(1, k0)) * (sm.K - 1),
      fTo = Math.max(0, Math.min(1, k1)) * (sm.K - 1);
    for (const p of L.plugs) {
      const sid = stS.seat[p.id];
      if (!sid) continue;
      const sock = L.socketsById[sid];
      if (sock.strip !== strip) continue;
      const arr = sm.need[p.id + '|' + sid];
      if (at(arr, fFrom) > CFG.railTaut + 0.02) return false;
      if (at(arr, fTo) > CFG.railTaut) return false;
      for (let i = Math.ceil(lo); i <= Math.floor(hi); i++) if (arr[i] > CFG.railTaut) return false;
    }
    return true;
  };
  Rules.applyDetent = function (L, st, stripId, d) {
    const strip = L.stripsById[stripId];
    Rules.setStripK(strip, strip.rail.detents[d]);
    st.rail[stripId] = d;
    const per = L.reachAt[stripId][d];
    for (const p of L.plugs) for (const sk of strip.sockets) L.reach[p.id][sk.id] = per[p.id][sk.id];
  };
  Rules.syncRails = function (L, st) {
    for (const r of L.rails) Rules.applyDetent(L, st, r.id, st.rail[r.id]);
  };
  Rules.nearestDetent = function (strip, k) {
    let bi = 0,
      bd = 1e9;
    strip.rail.detents.forEach((d, i) => {
      const dd = Math.abs(d - k);
      if (dd < bd) (bd = dd), (bi = i);
    });
    return bi;
  };

  /* ---------------------------------------------------------------- state */
  Rules.newState = function (L, opts) {
    const st = { seat: {}, sw: {}, dead: {}, flags: {}, rail: {}, thread: null };
    for (const p of L.plugs) st.seat[p.id] = null;
    for (const s of L.strips) if (s.hasSwitch) st.sw[s.id] = !!s.def.switch.on;
    for (const s of L.rails) st.rail[s.id] = s.rail.start;
    const start = L.def.start;
    if (start && !(opts && opts.blank)) {
      for (const k in start.seat || {}) st.seat[k] = start.seat[k];
      for (const k in start.sw || {}) st.sw[k] = start.sw[k];
    }
    return st;
  };
  Rules.cloneState = function (st) {
    return { seat: Object.assign({}, st.seat), sw: Object.assign({}, st.sw), dead: Object.assign({}, st.dead), flags: Object.assign({}, st.flags), rail: Object.assign({}, st.rail), thread: st.thread };
  };

  Rules.fits = function (plug, sock) {
    return sock.key === 'any' || plug.key === 'any' || sock.key === plug.key;
  };
  Rules.isDead = function (st, sock) {
    return sock.dead || !!(st && st.dead && st.dead[sock.id]);
  };
  Rules.footprint = function (plug, sock) {
    const n = sock.strip.n,
      s = sock.slot;
    if (plug.size === 'fat') {
      const r = [];
      for (let k = s - 1; k <= s + 1; k++) if (k >= 1 && k <= n) r.push(k);
      return r;
    }
    return [s];
  };
  // map "stripId.slot" -> plugId for every slot covered by seated plugs (optionally ignoring one plug)
  Rules.cover = function (L, st, ignore) {
    const cover = {};
    for (const p of L.plugs) {
      if (p.id === ignore) continue;
      const sid = st.seat[p.id];
      if (!sid) continue;
      const sock = L.socketsById[sid];
      for (const k of Rules.footprint(p, sock)) cover[sock.strip.id + '.' + k] = p.id;
    }
    return cover;
  };

  // why: 'dead' | 'key' | 'reach' | 'covered' | 'overlap' | 'taken'
  Rules.canSeat = function (L, st, plugId, sockId) {
    const plug = L.plugsById[plugId],
      sock = L.socketsById[sockId];
    if (Rules.isDead(st, sock)) return { ok: false, why: 'dead' };
    if (!Rules.fits(plug, sock)) return { ok: false, why: 'key' };
    if (sock.strip.rail && st.flags && st.flags.moving && st.flags.moving[sock.strip.id]) return { ok: false, why: 'moving' };
    if (!L.reach[plugId][sockId].ok) return { ok: false, why: 'reach' };
    const cover = Rules.cover(L, st, plugId);
    const own = cover[sock.strip.id + '.' + sock.slot];
    if (own) {
      // is it seated there, or covered by a brick's overhang?
      const holder = Object.keys(st.seat).find((k) => k !== plugId && st.seat[k] === sockId);
      return { ok: false, why: holder ? 'taken' : 'covered', by: own, slots: [sock.slot] };
    }
    const bad = [];
    for (const k of Rules.footprint(plug, sock)) if (cover[sock.strip.id + '.' + k]) bad.push(k);
    if (bad.length) return { ok: false, why: 'overlap', slots: bad };
    return { ok: true };
  };
  Rules.legalSockets = function (L, st, plugId) {
    const out = [];
    for (const s of L.sockets) if (Rules.canSeat(L, st, plugId, s.id).ok) out.push(s);
    return out;
  };

  Rules.energized = function (L, st, strip) {
    if (strip.hasSwitch && !st.sw[strip.id]) return false;
    return true; // Act 1: every strip is wall-fed. (Recursive form arrives with daisy chains.)
  };
  // 'on' | 'standby' | 'off' per device id
  Rules.power = function (L, st) {
    const out = {};
    for (const d of L.devices) {
      const sid = st.seat[d.plug.id];
      if (!sid) {
        out[d.id] = 'off';
        continue;
      }
      const sock = L.socketsById[sid];
      let on = Rules.energized(L, st, sock.strip);
      // a hoop-bound cable only carries power once it really runs through its hoops (st.thread is set by the live room)
      if (on && d.via.length && st.thread) {
        const th = st.thread[d.plug.id];
        if (!th || !d.via.every((g) => th[g.id])) on = false;
      }
      out[d.id] = on ? 'on' : 'standby';
    }
    return out;
  };
  Rules.complete = function (L, st, crossings) {
    const pw = Rules.power(L, st);
    for (const d of L.devices) if (d.required && pw[d.id] !== 'on') return false;
    if (L.def.rules && L.def.rules.noCross && crossings > 0) return false;
    return true;
  };

  /* ---------------------------------------------------------------- solver */
  // all complete plug->socket assignments (capped); opts.dead overrides dead sockets
  Rules.solveAll = function (L, opts) {
    opts = opts || {};
    const cap = opts.cap || 5000;
    const dead = opts.dead || {};
    const plugs = L.plugs.slice();
    const cand = {};
    for (const p of plugs)
      cand[p.id] = L.sockets.filter((s) => !s.dead && !dead[s.id] && Rules.fits(p, s) && L.reach[p.id][s.id].ok);
    plugs.sort((a, b) => cand[a.id].length - cand[b.id].length);
    const sols = [];
    const cover = {};
    const map = {};
    (function rec(i) {
      if (sols.length >= cap) return;
      if (i === plugs.length) {
        sols.push(Object.assign({}, map));
        return;
      }
      const p = plugs[i];
      for (const s of cand[p.id]) {
        const fp = Rules.footprint(p, s);
        let ok = true;
        for (const k of fp) if (cover[s.strip.id + '.' + k]) { ok = false; break; }
        if (!ok) continue;
        for (const k of fp) cover[s.strip.id + '.' + k] = p.id;
        map[p.id] = s.id;
        rec(i + 1);
        for (const k of fp) delete cover[s.strip.id + '.' + k];
        delete map[p.id];
      }
    })(0);
    return sols;
  };

  // crossings in a complete assignment, judged the way the player sees them: seated cables settle into arcs
  // (settleCurl); with obstacles in the way the taut geodesic polylines are the honest model instead
  Rules.solutionCrossings = function (L, map) {
    const lines = [];
    const useArcs = !L.obstacles.length && G.Rope && G.Rope.arcPoints;
    const sc = (L.def && L.def.settleCurl) || 1;
    for (const p of L.plugs) {
      if (!map[p.id]) continue;
      if (useArcs) {
        const dev = p.device,
          sk = L.socketsById[map[p.id]];
        const n = Math.max(8, Math.min(64, Math.ceil(dev.len / (G.T ? G.T.segLen : 8)) + 1));
        const ox = new Float64Array(n),
          oy = new Float64Array(n);
        G.Rope.arcPoints(dev.port.x, dev.port.y, sk.x, sk.y, dev.len, n, sc, ox, oy);
        const pts = [];
        for (let i = 0; i < n; i += 2) pts.push({ x: ox[i], y: oy[i] });
        pts.push({ x: ox[n - 1], y: oy[n - 1] });
        lines.push(pts);
      } else lines.push(L.reach[p.id][map[p.id]].pts);
    }
    let c = 0;
    for (let i = 0; i < lines.length; i++) for (let j = i + 1; j < lines.length; j++) c += Geom.polyCross(lines[i], lines[j]);
    return c;
  };

  // next best action from a given state: {type:'seat'|'unseat'|'switch', plug, socket, from, strip, target}
  Rules.hint = function (L, st) {
    if (L.rails.length) return Rules.hintRail(L, st);
    const sols = Rules.solveAll(L, { cap: 3000, dead: st.dead });
    if (!sols.length) return null;
    const noCross = L.def.rules && L.def.rules.noCross;
    let best = null,
      bestScore = Infinity;
    for (const m of sols) {
      let mism = 0;
      for (const p of L.plugs) if (st.seat[p.id] !== m[p.id]) mism++;
      const cr = Rules.solutionCrossings(L, m); // tidy layouts are always preferred; they are a gate when noCross
      const score = mism * 10 + cr * (noCross ? 100 : 4);
      if (score < bestScore) {
        best = m;
        bestScore = score;
      }
    }
    for (const p of L.plugs) {
      if (!st.seat[p.id] && Rules.canSeat(L, st, p.id, best[p.id]).ok) return { type: 'seat', plug: p.id, socket: best[p.id], target: best };
    }
    for (const p of L.plugs) {
      if (st.seat[p.id] && st.seat[p.id] !== best[p.id]) return { type: 'unseat', plug: p.id, from: st.seat[p.id], target: best };
    }
    for (const s of L.strips) {
      if (s.hasSwitch && !st.sw[s.id]) {
        const anyPlugged = L.plugs.some((p) => st.seat[p.id] && L.socketsById[st.seat[p.id]].strip === s);
        if (anyPlugged) return { type: 'switch', strip: s.id, target: best };
      }
    }
    return null;
  };

  /* A random-but-legal player: how often does luck alone solve the level? (no pull-outs) */
  Rules.luck = function (L, trials, seed) {
    const rnd = U.rng(seed || 4242);
    let wins = 0;
    for (let t = 0; t < trials; t++) {
      const st = Rules.newState(L, { blank: true });
      if (L.def.script && L.def.script.deadAfter) for (const k of L.def.script.deadAfter) st.dead[k] = true;
      for (;;) {
        const un = L.plugs.filter((p) => !st.seat[p.id]);
        if (!un.length) {
          if (!(L.def.rules && L.def.rules.noCross) || Rules.solutionCrossings(L, st.seat) === 0) wins++;
          break;
        }
        const mov = [];
        for (const p of un) {
          const lg = Rules.legalSockets(L, st, p.id);
          if (lg.length) mov.push([p, lg]);
        }
        if (!mov.length) break;
        const pick = mov[(rnd() * mov.length) | 0];
        const s = pick[1][(rnd() * pick[1].length) | 0];
        st.seat[pick[0].id] = s.id;
      }
    }
    return wins / trials;
  };

  /* ---------------------------------------------------------------- rail levels: state-space search
     State = who is seated where + the detent of every rail strip. Moves: seat, unseat, slide one detent
     (allowed only if every seated cable on that strip stays within its length along the whole stretch). */
  Rules.railKey = function (L, st) {
    return L.plugs.map((p) => st.seat[p.id] || '-').join(',') + '|' + L.rails.map((r) => st.rail[r.id]).join(',');
  };
  Rules.railMoves = function (L, st) {
    const out = [];
    for (const p of L.plugs) {
      if (st.seat[p.id]) out.push({ type: 'unseat', plug: p.id, from: st.seat[p.id] });
      else for (const sk of L.sockets) if (Rules.canSeat(L, st, p.id, sk.id).ok) out.push({ type: 'seat', plug: p.id, socket: sk.id });
    }
    for (const r of L.rails) {
      const d = st.rail[r.id],
        ks = r.rail.detents;
      for (const nd of [d - 1, d + 1]) if (nd >= 0 && nd < ks.length && Rules.railSpanOK(L, st, r, ks[d], ks[nd])) out.push({ type: 'slide', strip: r.id, to: nd });
    }
    return out;
  };
  Rules.applyMove = function (L, st, m) {
    const n = Rules.cloneState(st);
    if (m.type === 'seat') n.seat[m.plug] = m.socket;
    else if (m.type === 'unseat') n.seat[m.plug] = null;
    else if (m.type === 'slide') n.rail[m.strip] = m.to;
    return n;
  };
  // BFS over the whole state space from st0. Returns every goal state with its action path (shortest first).
  Rules.solveRail = function (L, st0, opts) {
    opts = opts || {};
    const cap = opts.cap || 80000;
    st0 = st0 || Rules.newState(L);
    const start = Rules.cloneState(st0);
    const seen = new Map();
    const k0 = Rules.railKey(L, start);
    seen.set(k0, { par: null, act: null, st: start, depth: 0 });
    const q = [start],
      goals = [];
    let deadEnds = 0;
    for (let qi = 0; qi < q.length && q.length < cap; qi++) {
      const s = q[qi];
      Rules.syncRails(L, s);
      const me = seen.get(Rules.railKey(L, s));
      if (Rules.complete(L, s, 0)) {
        goals.push({ st: s, key: Rules.railKey(L, s), depth: me.depth });
        continue;
      }
      const moves = Rules.railMoves(L, s);
      if (!moves.length) deadEnds++;
      for (const m of moves) {
        const n = Rules.applyMove(L, s, m);
        const k = Rules.railKey(L, n);
        if (!seen.has(k)) {
          seen.set(k, { par: me, act: m, st: n, depth: me.depth + 1, key: k });
          q.push(n);
        }
      }
    }
    Rules.syncRails(L, st0);
    return { states: q.length, goals, seen, deadEnds, start: k0 };
  };
  Rules.railPath = function (res, goal) {
    const acts = [];
    let node = res.seen.get(goal.key);
    while (node && node.par) {
      acts.push(node.act);
      node = node.par;
    }
    return acts.reverse();
  };
  // crossings of the final arrangement, judged on settled arcs at that arrangement's detents
  Rules.railGoalCrossings = function (L, goalSt) {
    Rules.syncRails(L, goalSt);
    return Rules.solutionCrossings(L, goalSt.seat);
  };
  Rules.hintRail = function (L, st) {
    const res = Rules.solveRail(L, st, { cap: 60000 });
    if (!res.goals.length) {
      Rules.syncRails(L, st);
      return null;
    }
    let best = null,
      bs = Infinity;
    for (const g of res.goals) {
      const cr = Rules.railGoalCrossings(L, g.st);
      const score = g.depth + cr * ((L.def.rules && L.def.rules.noCross) ? 100 : 4);
      if (score < bs) (bs = score), (best = g);
    }
    Rules.syncRails(L, st);
    const path = Rules.railPath(res, best);
    if (!path.length) return null;
    const a = Object.assign({}, path[0]);
    if (a.type === 'slide') {
      // one smooth slide to wherever the plan next does something else
      for (let i = 1; i < path.length && path[i].type === 'slide' && path[i].strip === a.strip; i++) a.to = path[i].to;
    }
    a.target = best.st.seat;
    a.plan = path;
    return a;
  };
  // a random legal player (seat / unseat / slide) with a move budget
  Rules.luckRail = function (L, trials, seed, budget) {
    const rnd = U.rng(seed || 4242);
    budget = budget || 60;
    let wins = 0;
    for (let t = 0; t < trials; t++) {
      let st = Rules.newState(L, { blank: true });
      for (let i = 0; i < budget; i++) {
        Rules.syncRails(L, st);
        if (Rules.complete(L, st, 0)) {
          wins++;
          break;
        }
        const mv = Rules.railMoves(L, st);
        if (!mv.length) break;
        st = Rules.applyMove(L, st, mv[(rnd() * mv.length) | 0]);
      }
    }
    Rules.syncRails(L, Rules.newState(L));
    return wins / trials;
  };

  /* ---------------------------------------------------------------- layout checks */
  Rules.devicePoly = function (d) {
    return Geom.rectPoly(d.x, d.y, d.meta.w, d.meta.h, d.angle);
  };
  Rules.stripPoly = function (st) {
    const b = Rules.stripBounds(st);
    const cx = (b[0] + b[1]) / 2,
      w = b[1] - b[0];
    const ca = Math.cos(st.angle),
      sa = Math.sin(st.angle);
    return Geom.rectPoly(st.x + cx * ca, st.y + cx * sa, w, st.kind === 'grommet' ? 44 : CFG.stripH, st.angle);
  };
  Rules.obstaclePoly = function (o) {
    return Geom.inflatedPolygon(o, 0);
  };

  Rules.checkLayout = function (L) {
    const issues = [];
    const items = [];
    for (const s of L.strips) {
      if (s.rail) {
        // a rail strip sweeps: check it at every detent and at 11 points along its rail
        const ks = s.rail.detents.concat(Array.from({ length: 11 }, (_, i) => i / 10));
        for (const k of ks) {
          Rules.setStripK(s, k);
          items.push({ n: 'strip ' + s.id + '@' + k.toFixed(2), poly: Rules.stripPoly(s), kind: 'strip' });
        }
        Rules.setStripK(s, s.rail.detents[s.rail.start]);
      } else items.push({ n: 'strip ' + s.id, poly: Rules.stripPoly(s), kind: 'strip' });
    }
    for (const d of L.devices) items.push({ n: 'device ' + d.id, poly: Rules.devicePoly(d), kind: 'device' });
    for (const o of L.obstacles) items.push({ n: 'obstacle ' + (o.id || o.art || '?'), poly: Rules.obstaclePoly(o), kind: 'obstacle' });
    for (let i = 0; i < items.length; i++)
      for (let j = i + 1; j < items.length; j++) {
        if (items[i].kind === 'strip' && items[j].kind === 'strip' && items[i].n.split('@')[0] === items[j].n.split('@')[0]) continue;
        if (Geom.polyOverlap(items[i].poly, items[j].poly, 4)) issues.push('overlap: ' + items[i].n + ' ~ ' + items[j].n);
      }
    const S = CFG.safe;
    for (const it of items)
      for (const p of it.poly)
        if (p.x < S.x0 || p.x > S.x1 || p.y < S.y0 || p.y > S.y1) {
          issues.push('out of safe area: ' + it.n);
          break;
        }
    for (const d of L.devices) {
      for (const it of items) {
        const dist = Geom.pointPolyDist(d.rest.x, d.rest.y, it.poly);
        if (dist < 15) issues.push('rest plug of ' + d.id + ' too close to ' + it.n);
      }
      if (d.rest.x < 20 || d.rest.x > 340 || d.rest.y < 40 || d.rest.y > 600) issues.push('rest plug of ' + d.id + ' near the edge');
      const c = Math.hypot(d.rest.x - d.port.x, d.rest.y - d.port.y);
      if (c > d.len * 0.97) issues.push('rest plug of ' + d.id + ' too far for its cable');
      if (d.len / Math.max(c, 1) > 2.3) issues.push('cable of ' + d.id + ' too slack at rest (loops)');
    }
    for (const s of L.strips) if (s.n > 1 && s.pitch < 38) issues.push('pitch too small on ' + s.id);
    return issues;
  };

  // reach ratios that fall in the ambiguous band (reads as "barely too short" or "barely reaches")
  Rules.ambiguousReach = function (L) {
    const out = [];
    for (const p of L.plugs)
      for (const s of L.sockets) {
        if (s.dead || !Rules.fits(p, s)) continue;
        if (s.strip.rail) {
          // a rail strip: every detent is its own reach table
          L.reachAt[s.strip.id].forEach((per, d) => {
            const r = per[p.id][s.id].ratio;
            if (r > CFG.reachDesign && r < CFG.decoyDesign) out.push(p.id + '→' + s.id + '@' + d + ' ' + r.toFixed(3));
          });
          continue;
        }
        const r = L.reach[p.id][s.id].ratio;
        if (r > CFG.reachDesign && r < CFG.decoyDesign) out.push(p.id + '→' + s.id + ' ' + r.toFixed(3));
      }
    return out;
  };
})();
