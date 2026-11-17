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
    dryer: { w: 70, h: 70, portDy: 35, name: 'Dryer' }, // Act 2: the first helper (dries a wet socket)
    toaster: { w: 74, h: 60, portDy: 30, name: 'Toasty' }, // Act 2: the kitchen cast
    kettle: { w: 62, h: 70, portDy: 35, name: 'Kettle' },
    speaker: { w: 58, h: 76, portDy: 38, name: 'Lefty' }, // Act 2: Lefty and Righty
    metronome: { w: 58, h: 92, portDy: 46, name: 'Tick' }, // Act 3, the studio: the one who counts everyone in
    anchor: { w: 2, h: 2, portDy: 0, name: 'cord' }, // invisible cable root (title screen)
  });

  Rules.KEYS = ['coral', 'amber', 'mint', 'sky', 'violet', 'rose', 'lime', 'teal']; // eight keys: a level of eight devices can key each socket to one device

  /* ---------------------------------------------------------------- compile */
  Rules.stripBounds = function (st) {
    // local x range of the strip body (sockets are centered at 0)
    const half = (st.n * st.pitch) / 2,
      pad = st.pad != null ? st.pad : CFG.slotPad;
    if (st.kind === 'grommet') return [-22, 22];
    return [-(half + pad), half + pad + (st.hasSwitch ? CFG.switchLen : 0)];
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
      lanes: !!def.lanes, // Act 4, Lanes (Level 38): a gate of another key is shut to this cable (Rules.laneBars)
    reels: !!def.reels, // Act 5, Rewind: a device's cable is on a reel, and its length on the bench is the player's
      reach: {},
      rails: [], // strips that slide on a rail (kinematic strips)
      carried: [], // strips that ride a carrier (a snail, a train, a tin toy): their position is a function of time
      fed: false, // some strip is fed by another strip's cord
      capped: false, // some strip has a breaker capacity
      timed: false, // some socket has a timer window
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
        seq: s.seq || null, // Act 3 (Levels 27, 29, 30): a sequencer strip: its sockets are the steps of a loop (see mech-seq.js)
        pad: s.pad, // an optional overhang for the body beyond the end sockets (default CFG.slotPad): eight pads must fit the mat
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
          frayed: !!sd.frayed, // copper showing: no power until a wrap of tape mends it
          timer: sd.timer || null, // { period, on, phase } seconds: the socket accepts a plug only inside its window
          doll: !!s.doll, // Act 5, Dollhouse: a socket of the big room, locked until the miniature board is solved
        };
        st.sockets.push(sock);
        L.sockets.push(sock);
        L.socketsById[sock.id] = sock;
      }
      st.carrier = s.carrier ? Object.assign({ speed: 14 }, s.carrier) : null; // a strip that rides a snail, a train or a toy (Act 3)
      if (st.carrier && st.carrier.mode === 'pendulum') st.carrier.dock = { x: st.carrier.pivot.x, y: st.carrier.pivot.y + st.carrier.len }; // at rest the bob hangs straight down
      if (st.carrier && st.carrier.track) {
        // a train: closed segments (polylines) with cumulative lengths; the junction picks the next one (see mech-track.js)
        const T = st.carrier.track;
        for (const id in T.segs) {
          const sg = T.segs[id];
          sg.cum = [0];
          for (let i = 1; i < sg.pts.length; i++) sg.cum.push(sg.cum[i - 1] + Math.hypot(sg.pts[i].x - sg.pts[i - 1].x, sg.pts[i].y - sg.pts[i - 1].y));
          sg.len = sg.cum[sg.cum.length - 1];
        }
      }
      if (st.carrier) L.carried.push(st);
      st.fedBy = s.fedBy || null; // a strip that is itself plugged in (a daisy chain): the id of the device whose plug feeds it
      st.cap = s.cap || 0; // breaker capacity in bolts (0 = unlimited)
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
      const shared = d.sharePlug ? L.plugsById[d.sharePlug] : null;
      const plug = shared || {
        id: d.id,
        device: null,
        devices: [],
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
        required: d.required !== false && !d.cord,
        via: [],
        cord: !!d.cord, // a strip's own power cord (never a character that wakes)
        mini: !!d.mini, // Act 5, Dollhouse: a device on the miniature board (its seats open the big room's locks)
        watts: d.watts || 0, // bolts drawn on a capped strip
        after: d.after || null, // Act 3 (Level 26): the id of the device this one follows: it wakes only if that one is awake to its LEFT on the same strip
        clash: d.clash || [], // ... and the ids it must not sit next to on a strip (feedback: both go silent)
        seq: d.seq || null, // on a sequencer strip: { step, voice, note }: the step it belongs on and the instrument it plays
      };
      // the hoops this device's cable must run through: explicit ids, or every hoop of the plug's own key (top to bottom)
      if (d.via) dev.via = d.via.map((id) => L.gatesById[id]).filter(Boolean);
      else if (plug.key !== 'any') dev.via = L.gates.filter((g) => g.key === plug.key).sort(L.lanes ? (a, b) => Math.hypot(a.x - port.x, a.y - port.y) - Math.hypot(b.x - port.x, b.y - port.y) : (a, b) => a.y - b.y); // a lane is run from the device's side
      // resting plug position: explicit or derived from direction/fraction of cable length
      if (shared) dev.rest = { x: shared.device.rest.x, y: shared.device.rest.y }; // a Y-plug rests in one place
      else if (d.rest) dev.rest = { x: d.rest.x, y: d.rest.y };
      else {
        const dir = ((d.dir === undefined ? 0 : d.dir) * Math.PI) / 180;
        const f = d.frac === undefined ? 0.72 : d.frac;
        dev.rest = { x: port.x + Math.sin(dir) * dev.len * f, y: port.y + Math.cos(dir) * dev.len * f };
      }
      if (!shared) plug.device = dev;
      plug.devices.push(dev);
      dev.twin = !!shared;
      L.devices.push(dev);
      L.devicesById[dev.id] = dev;
      if (!shared) {
        L.plugs.push(plug);
        L.plugsById[plug.id] = plug;
      }
    }
    L.fed = L.strips.some((s) => s.fedBy);
    L.chain = L.devices.some((d) => d.after || d.clash.length); // devices that listen to one another (the beat runs left to right along a strip)
    L.seqLevel = L.strips.some((s) => s.seq) && L.devices.some((d) => d.seq); // a sequencer strip: each device plays a note on its own step
    L.seqGroove = !!L.seqLevel && L.strips.some((s) => s.seq && s.seq.groove); // a groove (Level 29): a misplaced voice still plays, ragged; the room wakes only when the groove is tight
    L.bassLock = !!def.bass; // Level 28: a seated plug must be LOCKED (a twist of its collar) or the next thump pops it out (mech-bass.js)
    L.capped = L.strips.some((s) => s.cap);
    L.timed = L.sockets.some((s) => s.timer);
    // puddles: a wet socket is dried by the device whose tool lists it ({ tool: { dries: ['A.2'] } })
    L.wet = false;
    for (const d of L.devices) {
      const tool = d.def.tool;
      if (!tool || !tool.dries) continue;
      for (const sid of tool.dries) {
        const sk = L.socketsById[sid];
        if (!sk) continue;
        sk.wet = true;
        sk.wetBy = d.id;
        L.wet = true;
      }
    }
    if (def.blocks) Rules.compileBlocks(L);
    Rules.computeReach(L);
    if (L.rails.length) Rules.computeRailReach(L);
    if (L.carried.length) Rules.computeCarrierReach(L);
    if (L.blocks) Rules.computeBlockReach(L);
    return L;
  };

  // A cable threads a hoop by crossing its gap *transversally*: it must come from one side and leave on the other.
  // So each hoop contributes three waypoints along the gap's normal: in, the gap's middle, out (the side it enters
  // from is the side the previous waypoint is on). dev.via lists the hoops in order.
  const THREAD_D = 15;
  function viaStops(from, gates, skip) {
    const stops = [];
    let prev = from;
    for (const g of gates) {
      if (skip && skip(g)) continue;
      const nx = -Math.sin(g.rot),
        ny = Math.cos(g.rot);
      const side = (prev.x - g.x) * nx + (prev.y - g.y) * ny >= 0 ? 1 : -1;
      const a = { x: g.x + nx * side * THREAD_D, y: g.y + ny * side * THREAD_D };
      const b = { x: g.x - nx * side * THREAD_D, y: g.y - ny * side * THREAD_D };
      stops.push(a, g.mid, b);
      prev = b;
    }
    return stops;
  }
  function reachFor(L, dev, s) {
    const clr = CFG.cableR + 1;
    const rear = { x: s.x + s.fx * CFG.pinOut, y: s.y + s.fy * CFG.pinOut };
    // the route runs through every hoop of this device, in order, then to the socket
    let needed = 0,
      pts = [];
    let cur = dev.port;
    const stops = viaStops(dev.port, dev.via).concat([rear]);
    for (const w of stops) {
      const g = Geom.shortest(cur, w, L.obstacles, clr);
      needed += g.len;
      pts = pts.concat(pts.length ? g.pts.slice(1) : g.pts);
      cur = w;
    }
    needed += CFG.pinOut;
    pts.push({ x: s.x, y: s.y });
    // a cable threads a hoop only if, along its route, the point before the hoop and the point after it lie on opposite
    // sides of the hoop's line (it enters from one side and leaves on the other)
    let thread = true;
    for (let i = 0; i + 2 < stops.length; i += 3) {
      const g = dev.via[i / 3];
      const nx = -Math.sin(g.rot),
        ny = Math.cos(g.rot);
      const prev = i === 0 ? dev.port : stops[i - 1];
      const next = i + 3 < stops.length ? stops[i + 3] : stops[stops.length - 1];
      const a = (prev.x - g.x) * nx + (prev.y - g.y) * ny,
        b = (next.x - g.x) * nx + (next.y - g.y) * ny;
      if (a * b >= 0) thread = false;
    }
    return { needed, ratio: needed / dev.len, ok: needed / dev.len <= CFG.reachOK, pts, thread };
  }
  // a plug may carry several cables (a Y-plug): it reaches a socket only if every one of them does
  function reachEntry(L, p, s) {
    const all = {};
    let worst = null;
    for (const dev of p.devices) {
      const e = reachFor(L, dev, s);
      all[dev.id] = e;
      if (!worst || e.ratio > worst.ratio) worst = e;
    }
    let thread = true;
    for (const id in all) if (all[id].thread === false) thread = false;
    return { needed: worst.needed, ratio: worst.ratio, ok: worst.ratio <= CFG.reachOK, pts: all[p.device.id].pts, all, thread };
  }
  // the finger's route for a plug now at `from`: through the hoops it still needs, then to the socket's pre-slide point
  Rules.routeVia = function (L, from, plugId, sockId, pre, st) {
    const dev = L.plugsById[plugId].device;
    const clr = CFG.cableR + 4;
    const th = st && st.thread && st.thread[plugId];
    let pts = [{ x: from.x, y: from.y }];
    let cur = from;
    for (const w of viaStops(from, dev.via, (g) => th && th[g.id]).concat([pre])) {
      const g = Geom.shortest(cur, w, L.obstacles.concat(Rules.laneBars(L, L.plugsById[plugId].key)), clr);
      pts = pts.concat(g.pts.slice(1));
      cur = w;
    }
    return pts;
  };
  // Lanes (Act 4, Level 38): a gate of another key is shut to this cable: a bar across its gap that only the wrong cables meet. A cable
  // that is routed round a lane is still free to pass its own gates. Only a level with `lanes: true` has bars; every other level is unchanged.
  Rules.laneBars = function (L, key) {
    if (!L.lanes) return [];
    return L.gates.filter((g) => g.key !== 'any' && g.key !== key).map((g) => ({ shape: 'rrect', x: g.x, y: g.y, w: g.gap, h: 6, rot: g.rot, cr: 2, tall: true, lane: g.id }));
  };
  Rules.computeReach = function (L) {
    for (const p of L.plugs) {
      const r = (L.reach[p.id] = {});
      for (const s of L.sockets) r[s.id] = reachEntry(L, p, s);
    }
  };

  /* ---------------------------------------------------------------- carried strips (Act 3)
     A carried strip moves with a creature or a toy. Its sockets move with it, so reach is recomputed live (refreshReach) from
     where the strip is now; the static solver and the validator judge the arrangement with the strip at its `dock`
     (L.reachSolve). A seated cable that would run out of length stops a slow carrier (the snail strains) or pops the plug (a
     train): Rules.carryWalkOK checks a whole walk against the cables that are seated. */
  Rules.setStripPos = function (st, x, y) {
    st.x = x;
    st.y = y;
    const ca = Math.cos(st.angle),
      sa = Math.sin(st.angle);
    for (const sock of st.sockets) {
      const lx = (sock.slot - 1 - (st.n - 1) / 2) * st.pitch;
      sock.x = x + lx * ca;
      sock.y = y + lx * sa;
    }
  };
  // the reach ratio of a plug to a socket from where the socket is NOW (no caching)
  Rules.reachRatio = function (L, plugId, sockId) {
    return reachEntry(L, L.plugsById[plugId], L.socketsById[sockId]).ratio;
  };
  Rules.refreshReach = function (L, st) {
    for (const p of L.plugs) for (const s of st.sockets) L.reach[p.id][s.id] = reachEntry(L, p, s);
  };
  Rules.computeCarrierReach = function (L) {
    L.reachSolve = {};
    for (const p of L.plugs) L.reachSolve[p.id] = Object.assign({}, L.reach[p.id]);
    for (const st of L.carried) {
      const C = st.carrier,
        home = { x: st.x, y: st.y };
      if (!C.dock) continue;
      Rules.setStripPos(st, C.dock.x, C.dock.y);
      for (const p of L.plugs) for (const s of st.sockets) L.reachSolve[p.id][s.id] = reachEntry(L, p, s);
      Rules.setStripPos(st, home.x, home.y);
    }
  };
  /* ---------------------------------------------------------------- pendulum (Act 4, Level 37)
     A carried strip with carrier {mode:'pendulum', pivot, len, amp, period} hangs from a pivot and swings. Its position is a
     function of the room clock (the clock the timer windows read), so the bottom of each swing is when a timed socket opens,
     and its sockets go where the swing puts them. It has no road: the static solver judges it at its dock (the bottom), and
     verifyPendulum checks that every seated cable still reaches across the whole swing. */
  Rules.pendulumAt = function (C, clock) {
    const th = C.amp * Math.sin((2 * Math.PI * clock) / C.period);
    return { x: C.pivot.x + C.len * Math.sin(th), y: C.pivot.y + C.len * Math.cos(th), th };
  };
  Rules.pendulumMove = function (L, st, clock) {
    const p = Rules.pendulumAt(st.carrier, clock);
    Rules.setStripPos(st, p.x, p.y);
    st.carrier.th = p.th;
    Rules.refreshReach(L, st);
    return p;
  };
  Rules.verifyPendulum = function (L) {
    const strip = L.carried[0],
      C = strip.carrier;
    // the solver judges the dock (L.reachSolve, from the pivot), so the verdict does not depend on where the carriage is now
    const sols = Rules.solveAll(L, { cap: 3000 });
    if (!sols.length) return { ok: false, why: 'no arrangement is legal with the strip at its dock' };
    const best = sols[0];
    const plugs = L.plugs.filter((p) => p.device.required && best[p.id] && L.socketsById[best[p.id]].strip === strip);
    let worst = 0,
      at = 0;
    const here = { x: strip.x, y: strip.y }; // a live carriage goes back to where it is
    for (let i = 0; i <= 40; i++) {
      const clock = (i / 40) * C.period,
        p = Rules.pendulumAt(C, clock);
      Rules.setStripPos(strip, p.x, p.y);
      for (const q of plugs) {
        const r = reachEntry(L, q, L.socketsById[best[q.id]]).ratio;
        if (r > worst) (worst = r), (at = clock);
      }
    }
    Rules.setStripPos(strip, here.x, here.y);
    if (worst > CFG.reachDesign) return { ok: false, why: 'a cable is too short at the ends of the swing (' + (worst * 100).toFixed(0) + '% at ' + at.toFixed(2) + ' s)' };
    return { ok: true, why: '', worst };
  };
  // the places a snail may not walk (rivers): rectangles as obstacles for Geom.shortest
  Rules.carryKeepOut = function (L, st) {
    const C = st.carrier;
    if (!C._ko) C._ko = (C.keepOut || []).map((r) => ({ shape: 'rrect', x: r.x, y: r.y, w: r.w, h: r.h, rot: r.rot || 0, cr: 2, tall: true }));
    return C._ko;
  };
  // the geodesic road from a point to a point around the keep-out zones
  Rules.carryRoad = function (L, st, a, b) {
    const g = Geom.shortest(a, b, Rules.carryKeepOut(L, st), 6);
    return g.pts.map((q) => ({ x: q.x, y: q.y }));
  };
  // walk the strip along pts (a polyline); with `seat` as the seated plugs, does every cable stay within length (ratio <= max)?
  // returns { ok, at (arclength where it first fails), worst }
  Rules.carryWalkOK = function (L, st, pts, seat, max) {
    max = max || 0.985;
    const home = { x: st.x, y: st.y };
    let ok = true,
      at = -1,
      worst = 0,
      s = 0;
    const seated = L.plugs.filter((p) => seat[p.id] && L.socketsById[seat[p.id]].strip === st);
    const test = (x, y) => {
      Rules.setStripPos(st, x, y);
      for (const p of seated) {
        const r = reachEntry(L, p, L.socketsById[seat[p.id]]).ratio;
        if (r > worst) worst = r;
        if (r > max && ok) (ok = false), (at = s);
      }
    };
    let cum = 0;
    for (let i = 0; i + 1 < pts.length && ok; i++) {
      const a = pts[i],
        b = pts[i + 1],
        d = Math.hypot(b.x - a.x, b.y - a.y);
      const n = Math.max(1, Math.ceil(d / 6));
      for (let k = i === 0 ? 0 : 1; k <= n && ok; k++) {
        const u = k / n;
        s = cum + d * u; // arclength of this sample
        test(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u);
      }
      cum += d;
    }
    Rules.setStripPos(st, home.x, home.y);
    return { ok, at, worst };
  };
  // the hint for a carried strip: plug whatever can be plugged now and still walked to the dock; else walk the road to the dock
  Rules.hintCarrier = function (L, st) {
    const strip = L.carried[0];
    const C = strip.carrier;
    const sols = Rules.solveAll(L, { cap: 3000, dead: st.dead, mended: st.mended, dry: st.dry });
    if (!sols.length) return null;
    let best = sols[0],
      bs = Infinity;
    for (const m of sols) {
      let mism = 0;
      for (const p of L.plugs) if (m[p.id] !== undefined && st.seat[p.id] !== m[p.id]) mism++;
      const sc = mism * 10 + Rules.solutionCrossings(L, m) * 4;
      if (sc < bs) (bs = sc), (best = m);
    }
    const here = { x: strip.x, y: strip.y };
    const dock = C.dock || here;
    const road = Rules.carryRoad(L, strip, here, dock);
    // a wrong seat that is not where the plan wants it: take it out
    for (const p of L.plugs)
      if (st.seat[p.id] && best[p.id] && st.seat[p.id] !== best[p.id] && L.socketsById[st.seat[p.id]].strip === strip) return { type: 'unseat', plug: p.id, from: st.seat[p.id], target: best };
    const order = L.plugs.filter((p) => !st.seat[p.id] && best[p.id] && p.device.required);
    for (const p of order) {
      const sk = L.socketsById[best[p.id]];
      if (sk.strip !== strip) continue;
      if (!Rules.canSeat(L, st, p.id, sk.id).ok) continue;
      const w = Rules.carryWalkOK(L, strip, road, Object.assign({}, st.seat, { [p.id]: sk.id }));
      if (w.ok) return { type: 'seat', plug: p.id, socket: sk.id, target: best };
    }
    const moving = st.flags && st.flags.carryMoving && st.flags.carryMoving[strip.id];
    if (moving) return { type: 'wait', strip: strip.id, target: best };
    if (Math.hypot(here.x - dock.x, here.y - dock.y) > 12) {
      // walk as far as the seated cables allow along the road (the snail stalls if it cannot, which is fine: the hint waits for a better moment)
      const w = Rules.carryWalkOK(L, strip, road, st.seat);
      return { type: 'draw', strip: strip.id, pts: road, target: best, stalls: !w.ok };
    }
    return null;
  };
  /* ---- wind-up carriers (Level 24): a tin toy that carries the strip walks straight along its heading for as far as it has been
     wound (one click = one quarter-turn of its key = WIND_UNIT u) and TURNS at a wall or the edge of the mat (C.turn, default right),
     going on if it has wind left. Rules.windSim is the walk (the Room draws it as a ghost road while you wind); Rules.windSolve
     searches aim + wind sequences for a place where every cable reaches (the plan the hint and the validator use). */
  Rules.WIND_UNIT = 55;
  Rules.WIND_AIMS = 16;
  Rules.windBlocked = function (C, x, y) {
    const hx = C.hx || 34,
      hy = C.hy || 34;
    if (x - hx < 20 || x + hx > 340 || y - hy < 46 || y + hy > 614) return true; // the edge of the play mat
    for (const w of C.walls || []) if (x + hx > w.x - w.w / 2 && x - hx < w.x + w.w / 2 && y + hy > w.y - w.h / 2 && y - hy < w.y + w.h / 2) return true;
    return false;
  };
  Rules.windSim = function (strip, from, heading, clicks) {
    const C = strip.carrier,
      step = 4,
      total = clicks * Rules.WIND_UNIT;
    let x = from.x,
      y = from.y,
      h = heading,
      d = 0,
      turns = 0,
      lastPush = 0;
    const pts = [{ x, y }],
      bumps = [];
    let guard = 0;
    while (d < total - 1e-6 && turns < 8 && guard++ < 4000) {
      const nx = x + Math.cos(h) * step,
        ny = y + Math.sin(h) * step;
      if (Rules.windBlocked(C, nx, ny)) {
        h += ((C.turn === 'left' ? -1 : 1) * Math.PI) / 2;
        turns++;
        pts.push({ x, y }); // the corner
        bumps.push({ x, y, d });
        lastPush = d;
        continue;
      }
      x = nx;
      y = ny;
      d += step;
      if (d - lastPush >= 14) {
        pts.push({ x, y });
        lastPush = d;
      }
    }
    pts.push({ x, y });
    return { pts, end: { x, y, h }, len: d, bumps };
  };
  // is every required cable within reach with the strip centred at (x, y)?
  Rules.windAtDock = function (L, strip, x, y, max) {
    const home = { x: strip.x, y: strip.y };
    Rules.setStripPos(strip, x, y);
    let ok = true;
    const best = (Rules._windBest = Rules._windBest || {})[L.id] || (Rules._windBest[L.id] = Rules.solveAll(L, { cap: 3000 })[0]);
    for (const p of L.plugs) {
      if (!p.device.required || !best[p.id]) continue;
      if (L.socketsById[best[p.id]].strip !== strip) continue;
      if (Rules.reachRatio(L, p.id, best[p.id]) > (max || CFG.reachDesign)) ok = false;
    }
    Rules.setStripPos(strip, home.x, home.y);
    return ok;
  };
  // the goal of a wind-up walk: every cable reaches, and (if the level promises Tidy) the settled cables do not cross there
  // aim indices, the plain directions first (east, north, west, south), then the diagonals, then the rest
  function windAimOrder() {
    const n = Rules.WIND_AIMS,
      q = n / 4;
    const first = [2 * q, q, 0, 3 * q];
    const rest = [];
    for (let a = 0; a < n; a++) if (!first.includes(a)) rest.push(a);
    rest.sort((a, b) => (a % (q / 2) === 0 ? 0 : 1) - (b % (q / 2) === 0 ? 0 : 1));
    return first.concat(rest);
  }
  Rules.windGoal = function (L, strip, x, y) {
    if (!Rules.windAtDock(L, strip, x, y)) return false;
    if (!(L.def.tidy || (L.def.rules && L.def.rules.noCross))) return true;
    const home = { x: strip.x, y: strip.y };
    const best = Rules._windBest[L.id];
    Rules.setStripPos(strip, x, y);
    const prev = L._atDock;
    L._atDock = true; // judge the arrangement with the strip where it is
    const c = Rules.solutionCrossings(L, best);
    L._atDock = prev;
    Rules.setStripPos(strip, home.x, home.y);
    return c === 0;
  };
  // the shortest plan of (aim, clicks) walks from the strip's start to a place where every cable reaches (null if none within depth)
  Rules.windSolve = function (L, depth) {
    const strip = L.carried[0],
      C = strip.carrier;
    depth = depth || 4;
    const start = { x: strip.x, y: strip.y, h: C.heading !== undefined ? C.heading : -Math.PI / 2 };
    const key = (s) => Math.round(s.x / 10) + ',' + Math.round(s.y / 10) + ',' + (((Math.round((s.h / (2 * Math.PI)) * 16) % 16) + 16) % 16);
    const seen = new Set([key(start)]);
    let frontier = [{ s: start, plan: [] }];
    const maxClicks = C.maxClicks || 8;
    for (let d = 0; d < depth; d++) {
      const next = [];
      for (const f of frontier) {
        for (const a of windAimOrder()) {
          const aim = (a / Rules.WIND_AIMS) * 2 * Math.PI - Math.PI;
          for (let k = 1; k <= maxClicks; k++) {
            const w = Rules.windSim(strip, f.s, aim, k);
            if (w.len < 8) continue;
            const ns = { x: w.end.x, y: w.end.y, h: w.end.h };
            const plan = f.plan.concat([{ aim, clicks: k, from: { x: f.s.x, y: f.s.y }, to: { x: ns.x, y: ns.y }, pts: w.pts }]);
            if (Rules.windGoal(L, strip, ns.x, ns.y)) return plan;
            const kk = key(ns);
            if (seen.has(kk)) continue;
            seen.add(kk);
            next.push({ s: ns, plan });
          }
        }
      }
      frontier = next;
      if (!frontier.length) break;
    }
    return null;
  };
  Rules.hintWind = function (L, st) {
    const strip = L.carried[0],
      C = strip.carrier;
    const sols = Rules.solveAll(L, { cap: 3000 });
    if (!sols.length) return null;
    const best = sols[0];
    const need = L.plugs.filter((p) => p.device.required && !st.seat[p.id] && best[p.id]);
    // at a place where every cable reaches: plug them
    if (Rules.windGoal(L, strip, strip.x, strip.y)) {
      for (const p of need) if (Rules.canSeat(L, st, p.id, best[p.id]).ok) return { type: 'seat', plug: p.id, socket: best[p.id], target: best };
      return need.length ? { type: 'wait', strip: strip.id, target: best } : null;
    }
    if (st.flags && st.flags.carryMoving && st.flags.carryMoving[strip.id]) return { type: 'wait', strip: strip.id, target: best };
    // otherwise: the next aim and wind of the shortest plan from where the toy stands now
    const plan = Rules.windSolve(L, 4);
    if (!plan || !plan.length) return null;
    const home = { x: strip.x, y: strip.y };
    const first = plan[0];
    return { type: 'wind', aim: first.aim, clicks: first.clicks, pts: first.pts, from: { x: home.x, y: home.y }, target: best };
  };
  Rules.verifyWind = function (L) {
    const strip = L.carried[0];
    const sols = Rules.solveAll(L, { cap: 3000 });
    if (!sols.length) return { ok: false, why: 'no arrangement is legal with the strip at its dock' };
    if (Rules.windGoal(L, strip, strip.x, strip.y)) return { ok: false, why: 'the toy already stands where every cable reaches' };
    const plan = Rules.windSolve(L, 4);
    if (!plan) return { ok: false, why: 'no aim-and-wind sequence of up to four walks brings the toy to where every cable reaches' };
    return { ok: true, why: '', plan, walks: plan.length };
  };

  /* ---------------------------------------------------------------- pushable blocks (Act 3, Level 25 "Block Party")
     Alphabet blocks rest on a grid of whole cells (def.blockGrid, def.blocks) inside a toy box (def.blockTray: the only cells they
     may stand on; def.blockWalls adds furniture, in u). A block is a tall obstacle for every cable (its rectangle is in L.obstacles, so
     a cable's reach goes round it and a rope is pushed out of it), and a socket a block covers cannot take a plug. The Room slides a
     block with the finger and lets it rest on whole cells. The goal of the block puzzle is a set of cells that must be free
     (def.blockGoal.free: the outlets and the cell above each, where the plug comes in); Rules.blockSearch finds the fewest moves
     (one move = one block dragged to any cell it can slide to) with a breadth-first search over bitmasks. */
  Rules.BLOCK_CELL = 44;
  Rules.BLOCK_GAP = 4; // a block is drawn this much smaller than its cells: the crack between neighbours
  Rules.cellCentre = function (L, c, r, w, h) {
    const G0 = L.grid;
    return { x: G0.x0 + (c + (w || 1) / 2) * G0.cell, y: G0.y0 + (r + (h || 1) / 2) * G0.cell };
  };
  Rules.placeBlock = function (L, b, c, r) {
    b.c = c;
    b.r = r;
    const p = Rules.cellCentre(L, c, r, b.w, b.h);
    b.x = p.x;
    b.y = p.y;
    b.obs.x = p.x;
    b.obs.y = p.y;
  };
  Rules.compileBlocks = function (L) {
    const def = L.def,
      g = def.blockGrid || { x0: 26, y0: 62, cols: 7, rows: 12 };
    L.grid = { x0: g.x0, y0: g.y0, cols: g.cols, rows: g.rows, cell: Rules.BLOCK_CELL };
    L.blocks = [];
    L.blocksById = {};
    for (const d of def.blocks) {
      const b = { id: d.id, def: d, index: L.blocks.length, c: d.c, r: d.r, w: d.w || 1, h: d.h || 1, letter: d.letter || d.id, heavy: !!d.heavy, x: 0, y: 0, ww: 0, hh: 0, obs: null };
      b.ww = b.w * L.grid.cell - Rules.BLOCK_GAP;
      b.hh = b.h * L.grid.cell - Rules.BLOCK_GAP;
      b.obs = { shape: 'rrect', tall: true, x: 0, y: 0, w: b.ww, h: b.hh, rot: 0, cr: 6, block: b.id };
      L.obstacles.push(b.obs);
      L.blocks.push(b);
      L.blocksById[b.id] = b;
      Rules.placeBlock(L, b, b.c, b.r);
    }
    // the cells nothing may be dragged onto: everything outside the toy box, and the furniture the level lists (rects in u)
    const cols = L.grid.cols,
      rows = L.grid.rows,
      cell = L.grid.cell,
      T = def.blockTray;
    L.blockFixed = new Uint8Array(cols * rows);
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        if (T && (c < T.c0 || c > T.c1 || r < T.r0 || r > T.r1)) L.blockFixed[r * cols + c] = 1;
        const x0 = L.grid.x0 + c * cell + 2,
          y0 = L.grid.y0 + r * cell + 2;
        for (const w of def.blockWalls || []) if (x0 + cell - 4 > w.x - w.w / 2 && x0 < w.x + w.w / 2 && y0 + cell - 4 > w.y - w.h / 2 && y0 < w.y + w.h / 2) L.blockFixed[r * cols + c] = 1;
      }
  };
  Rules.blockLayout = function (L) {
    return L.blocks.map((b) => [b.c, b.r]);
  };
  Rules.setBlockLayout = function (L, lay) {
    L.blocks.forEach((b, i) => Rules.placeBlock(L, b, lay[i][0], lay[i][1]));
    Geom.invalidate(L.obstacles);
  };
  // run fn with the blocks at a layout, the exact reach recomputed for it, then put everything back
  Rules.atBlockLayout = function (L, lay, fn) {
    const home = Rules.blockLayout(L),
      reach = L.reach;
    Rules.setBlockLayout(L, lay);
    L.reach = {};
    Rules.computeReach(L);
    try {
      return fn();
    } finally {
      Rules.setBlockLayout(L, home);
      L.reach = reach;
    }
  };
  // the block lying over a socket (its centre is inside the block), or null
  Rules.blockCovers = function (L, sock) {
    for (const b of L.blocks) if (Math.abs(sock.x - b.x) < b.ww / 2 - 1 && Math.abs(sock.y - b.y) < b.hh / 2 - 1) return b;
    return null;
  };
  Rules.blockCoversAt = function (L, sock, lay) {
    for (let i = 0; i < L.blocks.length; i++) {
      const b = L.blocks[i],
        p = Rules.cellCentre(L, lay[i][0], lay[i][1], b.w, b.h);
      if (Math.abs(sock.x - p.x) < b.ww / 2 - 1 && Math.abs(sock.y - p.y) < b.hh / 2 - 1) return b;
    }
    return null;
  };
  // occupancy of the grid: 1 = fixed, 2.. = a block (index + 2); `skip` leaves one block out (the one being moved)
  Rules.blockOcc = function (L, lay, skip) {
    const cols = L.grid.cols,
      occ = L.blockFixed.slice();
    L.blocks.forEach((b, i) => {
      if (i === skip) return;
      for (let dy = 0; dy < b.h; dy++) for (let dx = 0; dx < b.w; dx++) occ[(lay[i][1] + dy) * cols + lay[i][0] + dx] = i + 2;
    });
    return occ;
  };
  Rules.blockFits = function (L, occ, b, c, r) {
    const cols = L.grid.cols;
    if (c < 0 || r < 0 || c + b.w > cols || r + b.h > L.grid.rows) return false;
    for (let dy = 0; dy < b.h; dy++) for (let dx = 0; dx < b.w; dx++) if (occ[(r + dy) * cols + c + dx]) return false;
    return true;
  };
  // the cells a block passes through sliding from its place to `to` (a shortest 4-connected way), as [[c, r], ...] from its start
  Rules.blockRoute = function (L, lay, i, to) {
    const b = L.blocks[i],
      cols = L.grid.cols,
      occ = Rules.blockOcc(L, lay, i);
    const from = lay[i],
      prev = new Map([[from[1] * cols + from[0], -1]]),
      q = [from];
    for (let h = 0; h < q.length; h++) {
      const [c, r] = q[h];
      if (c === to[0] && r === to[1]) break;
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nc = c + dc,
          nr = r + dr,
          k = nr * cols + nc;
        if (prev.has(k) || !Rules.blockFits(L, occ, b, nc, nr)) continue;
        prev.set(k, r * cols + c);
        q.push([nc, nr]);
      }
    }
    const end = to[1] * cols + to[0];
    if (!prev.has(end)) return null;
    const out = [];
    for (let k = end; k !== -1; k = prev.get(k)) out.push([k % cols, (k / cols) | 0]);
    return out.reverse();
  };
  // are the cells the level wants free (the outlets and the cell above each) free of blocks in this layout?
  Rules.blockGoalMet = function (L, lay) {
    const occ = Rules.blockOcc(L, lay),
      cols = L.grid.cols;
    for (const [c, r] of L.def.blockGoal.free) if (occ[r * cols + c] >= 2) return false;
    return true;
  };
  /* The search. The free cells of the box are numbered (at most 30), a layout is the set of cells under the 1x1 blocks (a bitmask: they
     are interchangeable) plus where each bigger block stands; a move slides one block to any cell it can reach through free cells. */
  Rules.blockSearch = function (L, from, opts) {
    opts = opts || {};
    const maxDepth = opts.depth || 12,
      cap = opts.cap || 1500000,
      cols = L.grid.cols,
      rows = L.grid.rows;
    const bit = new Int8Array(cols * rows).fill(-1),
      cellOf = [];
    for (let k = 0; k < cols * rows; k++) if (!L.blockFixed[k]) (bit[k] = cellOf.length), cellOf.push(k);
    const N = cellOf.length;
    if (N > 30) throw new Error('the box has more than 30 free cells');
    const adj = cellOf.map((k) => [k % cols > 0 ? k - 1 : -1, k % cols < cols - 1 ? k + 1 : -1, k >= cols ? k - cols : -1, k < cols * (rows - 1) ? k + cols : -1].map((j) => (j >= 0 ? bit[j] : -1)).filter((j) => j >= 0));
    const goalM = L.def.blockGoal.free.reduce((m, [c, r]) => (bit[r * cols + c] >= 0 ? m | (1 << bit[r * cols + c]) : m), 0);
    // blocks: the 1x1 ones are a mask; each bigger one has a list of legal positions with their footprint masks
    const singles = [],
      bigs = [];
    L.blocks.forEach((b, i) => (b.w === 1 && b.h === 1 ? singles : bigs).push(i));
    const BP = bigs.map((i) => {
      const b = L.blocks[i],
        pos = [],
        byCell = new Map();
      for (let r = 0; r + b.h <= rows; r++)
        for (let c = 0; c + b.w <= cols; c++) {
          let m = 0,
            ok = true;
          for (let dy = 0; dy < b.h && ok; dy++) for (let dx = 0; dx < b.w; dx++) {
            const k = bit[(r + dy) * cols + c + dx];
            if (k < 0) ok = false;
            else m |= 1 << k;
          }
          if (ok) {
            byCell.set(r * cols + c, pos.length);
            pos.push({ c, r, m });
          }
        }
      pos.forEach((p) => (p.nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dc, dr]) => byCell.get((p.r + dr) * cols + p.c + dc)).filter((j) => j !== undefined)));
      return { pos, byCell };
    });
    const startM = singles.reduce((m, i) => m | (1 << bit[from[i][1] * cols + from[i][0]]), 0),
      startB = bigs.map((i, k) => BP[k].byCell.get(from[i][1] * cols + from[i][0]));
    const SH = 1 << N;
    const key = (m, bs) => bs.reduce((a, p) => a * 64 + p, 0) * SH + m;
    const bigMask = (bs) => bs.reduce((m, p, k) => m | BP[k].pos[p].m, 0);
    const goal = (m, bs) => !((m | bigMask(bs)) & goalM);
    const par = new Map([[key(startM, startB), null]]);
    let frontier = [[startM, startB]],
      found = null;
    if (goal(startM, startB)) return { moves: [], layout: from.map((p) => p.slice()), explored: 1 };
    for (let d = 1; d <= maxDepth && !found && frontier.length; d++) {
      const next = [];
      for (const [m, bs] of frontier) {
        const bm = bigMask(bs),
          occ = m | bm,
          pk = key(m, bs);
        // a 1x1 block slides to any cell reachable through free cells
        for (let i = 0; i < N && !found; i++) {
          if (!(m & (1 << i))) continue;
          const q = [i];
          let seen = 1 << i;
          for (let h = 0; h < q.length && !found; h++)
            for (const j of adj[q[h]]) {
              if (seen & (1 << j) || occ & (1 << j)) continue;
              seen |= 1 << j;
              q.push(j);
              const nm = (m & ~(1 << i)) | (1 << j),
                k = key(nm, bs);
              if (par.has(k)) continue;
              par.set(k, [pk, 0, i, j]);
              next.push([nm, bs]);
              if (goal(nm, bs)) {
                found = [nm, bs];
                break;
              }
            }
        }
        // a bigger block slides to any position reachable through free positions
        for (let k = 0; k < bigs.length && !found; k++) {
          const others = m | bigMask(bs.filter((_, kk) => kk !== k));
          const q = [bs[k]],
            vis = new Set(q);
          for (let h = 0; h < q.length && !found; h++)
            for (const j of BP[k].pos[q[h]].nb) {
              if (vis.has(j) || BP[k].pos[j].m & others) continue;
              vis.add(j);
              q.push(j);
              const nbs = bs.slice();
              nbs[k] = j;
              const kk = key(m, nbs);
              if (par.has(kk)) continue;
              par.set(kk, [pk, 1, k, bs[k], j]);
              next.push([m, nbs]);
              if (goal(m, nbs)) {
                found = [m, nbs];
                break;
              }
            }
        }
        if (par.size > cap) return null;
      }
      frontier = next;
    }
    if (!found) return null;
    // walk back to the start, then replay on the concrete blocks (the 1x1 ones are told apart by the cell they stand on)
    const rev = [];
    for (let k = key(found[0], found[1]); par.get(k); k = par.get(k)[0]) rev.push(par.get(k));
    rev.reverse();
    const lay = from.map((p) => p.slice()),
      moves = [];
    for (const mv of rev) {
      if (mv[1] === 0) {
        const fc = cellOf[mv[2]],
          tc = cellOf[mv[3]];
        const i = singles.find((s) => lay[s][1] * cols + lay[s][0] === fc);
        const to = [tc % cols, (tc / cols) | 0];
        moves.push({ id: L.blocks[i].id, from: lay[i].slice(), to: to.slice() });
        lay[i] = to;
      } else {
        const i = bigs[mv[2]],
          pos = BP[mv[2]].pos[mv[4]];
        moves.push({ id: L.blocks[i].id, from: lay[i].slice(), to: [pos.c, pos.r] });
        lay[i] = [pos.c, pos.r];
      }
    }
    return { moves, layout: lay, explored: par.size };
  };
  // the fewest block moves from the blocks as they stand (or from `from`) to a layout that frees the cells the level wants
  Rules.blockSolve = function (L, opts) {
    opts = opts || {};
    return Rules.blockSearch(L, opts.from || Rules.blockLayout(L), opts);
  };
  // the exact reach with the blocks at the level's solved layout (def.blocksGoal) is what the static solver and the validator judge
  Rules.computeBlockReach = function (L) {
    const goal = L.def.blocksGoal;
    if (!goal) return;
    const home = Rules.blockLayout(L);
    Rules.setBlockLayout(L, goal);
    L.reachSolve = {};
    for (const p of L.plugs) {
      const r = (L.reachSolve[p.id] = {});
      for (const s of L.sockets) r[s.id] = reachEntry(L, p, s);
    }
    Rules.setBlockLayout(L, home);
  };
  // the next thing to do about the blocks (null when some arrangement already works with them where they are)
  Rules.hintBlocks = function (L, st) {
    if (Rules.solveAll(L, { cap: 1, live: true, dead: st.dead }).length) return null;
    const plan = Rules.blockSolve(L);
    if (!plan || !plan.moves.length) return null;
    const lay = Rules.blockLayout(L),
      m = plan.moves[0],
      i = L.blocks.findIndex((b) => b.id === m.id);
    const route = Rules.blockRoute(L, lay, i, m.to) || [m.from, m.to];
    return { type: 'block', id: m.id, from: m.from, to: m.to, route, plan: plan.moves };
  };
  // the validator's check of a block level: the solved layout is legal, meets the goal and holds up with the exact reach; the start is
  // not already solved; a plan exists (its length is the par for the blocks); every goal layout I sample keeps the cables in reach
  Rules.verifyBlocks = function (L) {
    const goal = L.def.blocksGoal;
    if (!goal) return { ok: false, why: 'the level names no blocksGoal layout' };
    const occ = L.blockFixed.slice(),
      cols = L.grid.cols;
    for (let i = 0; i < L.blocks.length; i++) {
      const b = L.blocks[i];
      if (!Rules.blockFits(L, occ, b, goal[i][0], goal[i][1])) return { ok: false, why: 'goal layout: block ' + b.id + ' does not fit at ' + goal[i] };
      for (let dy = 0; dy < b.h; dy++) for (let dx = 0; dx < b.w; dx++) occ[(goal[i][1] + dy) * cols + goal[i][0] + dx] = 2;
    }
    if (!Rules.blockGoalMet(L, goal)) return { ok: false, why: 'the blocksGoal layout does not free the cells the level wants free' };
    const sols = Rules.atBlockLayout(L, goal, () => Rules.solveAll(L, { cap: 50, live: true }));
    if (!sols.length) return { ok: false, why: 'no arrangement works at the blocksGoal layout (exact reach)' };
    if (Rules.solveAll(L, { cap: 1, live: true }).length) return { ok: false, why: 'the start layout is already solved' };
    const plan = Rules.blockSolve(L);
    if (!plan) return { ok: false, why: 'no sequence of block moves frees the outlets' };
    const exact = Rules.atBlockLayout(L, plan.layout, () => Rules.solveAll(L, { cap: 1, live: true }).length > 0);
    if (!exact) return { ok: false, why: 'the layout the search found fails the exact reach', plan };
    return { ok: true, why: '', plan, moves: plan.moves.length, solutions: sols.length, explored: plan.explored };
  };

  /* ---- trains: a track of closed segments, points that choose between two of them, a lever that holds the train at a station.
     The strip rides the train; a seated cable that would run out of length stalls it (like the snail); a dynamo strip is dead
     unless the train is rolling. The safe plan: points to the loop every cable can follow, stop at its station, plug, go. */
  Rules.trackSafe = function (L, st, strip, segId, seat) {
    const sg = strip.carrier.track.segs[segId];
    return Rules.carryWalkOK(L, strip, sg.pts, seat || st.seat, 0.985);
  };
  Rules.hintTrack = function (L, st) {
    const strip = L.carried[0];
    const T = strip.carrier.track;
    const sols = Rules.solveAll(L, { cap: 3000 });
    if (!sols.length) return null;
    const best = sols[0];
    const f = (st.flags && st.flags.track) || { points: T.points.to, lever: 'go', stopped: false, seg: T.start.seg };
    const need = L.plugs.filter((p) => p.device.required && !st.seat[p.id] && best[p.id]);
    const full = Object.assign({}, st.seat);
    for (const p of need) full[p.id] = best[p.id];
    // which of the two branches can the train safely take with every cable seated?
    const want = T.points.options.find((o) => Rules.trackSafe(L, st, strip, o, full).ok);
    if (!need.length) {
      // everything is plugged: let the train roll (the dynamo wakes the room), on the safe branch
      if (want && f.points !== want) return { type: 'points', to: want, target: best };
      if (f.lever === 'stop') return { type: 'lever', to: 'go', target: best };
      return { type: 'wait', strip: strip.id, target: best };
    }
    // plugs to go in: first make sure the train will come round on the safe branch, then hold it at the station
    if (want && f.points !== want) return { type: 'points', to: want, target: best };
    if (!f.stopped) return f.lever === 'go' ? { type: 'lever', to: 'stop', target: best } : { type: 'wait', strip: strip.id, target: best };
    for (const p of need) if (Rules.canSeat(L, st, p.id, best[p.id]).ok) return { type: 'seat', plug: p.id, socket: best[p.id], target: best };
    // standing in a station where nothing can be plugged (the wrong one): let the train go on to the right one
    return { type: 'lever', to: 'go', target: best };
  };
  Rules.verifyTrack = function (L) {
    const strip = L.carried[0];
    const T = strip.carrier.track;
    const sols = Rules.solveAll(L, { cap: 3000 });
    if (!sols.length) return { ok: false, why: 'no arrangement is legal with the strip at its dock' };
    const best = sols[0];
    const seat = {};
    for (const p of L.plugs) if (p.device.required && best[p.id] && L.socketsById[best[p.id]].strip === strip) seat[p.id] = best[p.id];
    const safe = T.points.options.filter((o) => Rules.trackSafe(L, { seat }, strip, o, seat).ok);
    const shared = Rules.trackSafe(L, { seat }, strip, T.shared, seat).ok;
    if (!shared) return { ok: false, why: 'the shared stretch leaves a cable\'s reach with every plug seated' };
    if (safe.length !== 1) return { ok: false, why: 'exactly one branch must be safe with every plug seated (found ' + safe.length + ')' };
    return { ok: true, why: '', safe: safe[0] };
  };
  // the plan check for the validator: walk the dock road, seating each plug at the moment it can be seated and still walk on
  Rules.verifyCarrier = function (L) {
    const strip = L.carried[0];
    const C = strip.carrier;
    const home = { x: strip.x, y: strip.y };
    const sols = Rules.solveAll(L, { cap: 3000 });
    if (!sols.length) return { ok: false, why: 'no arrangement is legal with the strip at its dock' };
    const best = sols[0];
    const road = Rules.carryRoad(L, strip, home, C.dock);
    const plugs = L.plugs.filter((p) => p.device.required && best[p.id] && L.socketsById[best[p.id]].strip === strip);
    // plug as late as possible: at the dock all cables must reach; walking with none seated is always fine
    const dockOK = plugs.every((p) => reachEntry(L, p, L.socketsById[best[p.id]]).ratio <= CFG.reachDesign);
    Rules.setStripPos(strip, C.dock.x, C.dock.y);
    const atDock = plugs.every((p) => reachEntry(L, p, L.socketsById[best[p.id]]).ratio <= CFG.reachDesign);
    Rules.setStripPos(strip, home.x, home.y);
    if (!atDock) return { ok: false, why: 'a cable does not reach its socket with the strip at the dock' };
    // the order in which the hint would plug them, and the earliest arclength each can be plugged without a stall later
    let len = 0;
    for (let i = 0; i + 1 < road.length; i++) len += Math.hypot(road[i + 1].x - road[i].x, road[i + 1].y - road[i].y);
    return { ok: true, why: '', roadLen: len, dockOK };
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
    const st = { seat: {}, sw: {}, dead: {}, flags: {}, rail: {}, thread: null, mended: {}, dry: {} };
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
    return { seat: Object.assign({}, st.seat), sw: Object.assign({}, st.sw), dead: Object.assign({}, st.dead), flags: Object.assign({}, st.flags), rail: Object.assign({}, st.rail), thread: st.thread, mended: Object.assign({}, st.mended), dry: Object.assign({}, st.dry || {}) };
  };

  Rules.fits = function (plug, sock) {
    return sock.key === 'any' || plug.key === 'any' || sock.key === plug.key;
  };
  // seconds until a timed socket's window opens (0 = open now). With no clock running (solver, validator, luck) windows are ignored.
  Rules.TIMER_GRACE = 0.8; // a plug released this close to a window opening simply waits for it (the 'hold to wait' assist)
  Rules.opensIn = function (st, sock) {
    const T = sock.timer;
    if (!T) return 0;
    if (!st || !st.flags || st.flags.clock === undefined) return 0;
    const ph = (((st.flags.clock - T.phase) % T.period) + T.period) % T.period;
    return ph < T.on ? 0 : T.period - ph;
  };
  Rules.isWet = function (st, sock) {
    return !!sock.wet && !(st && st.dry && st.dry[sock.id]);
  };
  Rules.isFrayed = function (st, sock) {
    return !!sock.frayed && !(st && st.mended && st.mended[sock.id]);
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
    if (st.flags && st.flags.dark && !(st.flags.seen && st.flags.seen[sock.id])) return { ok: false, why: 'unseen' };
    if (sock.doll && st.flags && st.flags.doll && !st.flags.doll.open) return { ok: false, why: 'locked' }; // Act 5, Dollhouse: the big room is locked until the miniature is solved
    if (st.flags && st.flags.prizes && st.flags.prizes.some((pz) => !pz.att && !pz.inTray && Math.abs(sock.x - pz.x) < pz.w / 2 + 4 && Math.abs(sock.y - pz.y) < pz.h / 2 + 4)) return { ok: false, why: 'covered' }; // Act 5, Crane Game: a prize sits on this socket // Act 5, Torchlight: a socket the light has not touched
    if (Rules.isDead(st, sock)) return { ok: false, why: 'dead' };
    if (Rules.isFrayed(st, sock)) return { ok: false, why: 'frayed' };
    if (Rules.isWet(st, sock)) return { ok: false, why: 'wet' };
    if (st.flags && st.flags.tripped && st.flags.tripped[sock.strip.id]) return { ok: false, why: 'tripped' };
    if (st.flags && st.flags.blocked && st.flags.blocked[sock.id]) return { ok: false, why: 'cat' };
    if (L.blocks && Rules.blockCovers(L, sock)) return { ok: false, why: 'block' };
    if (sock.timer) {
      const w = Rules.opensIn(st, sock);
      if (w > Rules.TIMER_GRACE) return { ok: false, why: 'closed', opensIn: w };
    }
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

  // a strip is live if its switch is on and it is either wall-fed or its own cord is seated in a live strip (recursion)
  // bolts drawn on a strip by whoever is plugged into it
  // watts drawn through a strip: its own plugs, plus every strip fed through a cord seated in it (a daisy chain draws through the first strip)
  Rules.loadOf = function (L, seat, strip, guard) {
    guard = guard || {};
    guard[strip.id] = true;
    let n = 0;
    for (const p of L.plugs) {
      const sid = seat[p.id];
      if (sid && L.socketsById[sid].strip === strip) for (const d of p.devices) n += d.watts;
    }
    if (L.fed)
      for (const s2 of L.strips) {
        if (!s2.fedBy || guard[s2.id]) continue;
        const cord = L.devicesById[s2.fedBy];
        const sid = cord && seat[cord.plug.id];
        if (sid && L.socketsById[sid].strip === strip) n += Rules.loadOf(L, seat, s2, guard);
      }
    return n;
  };
  Rules.load = function (L, st, strip) {
    return Rules.loadOf(L, st.seat, strip);
  };
  Rules.energized = function (L, st, strip, guard) {
    if (st.flags && st.flags.tripped && st.flags.tripped[strip.id]) return false; // the breaker is out
    // a dynamo wagon: the strip is powered by the wheels, so only while the train is rolling (or once the room has been won)
    if (strip.carrier && strip.carrier.dynamo && st.flags && !st.flags.latched && !(st.flags.carryMoving && st.flags.carryMoving[strip.id])) return false;
    if (strip.hasSwitch && !st.sw[strip.id]) return false;
    if (strip.fedBy) {
      guard = guard || {};
      if (guard[strip.id]) return false; // a strip plugged into itself feeds nothing
      guard[strip.id] = true;
      const cord = L.devicesById[strip.fedBy];
      const sid = cord && st.seat[cord.plug.id];
      if (!sid) return false;
      return Rules.energized(L, st, L.socketsById[sid].strip, guard);
    }
    return true;
  };
  // 'on' | 'standby' | 'off' per device id
  Rules.power = function (L, st, extra) {
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
    if (L.seqLevel && !L.seqGroove) {
      // a sequencer: an instrument only plays on the step it belongs to (anywhere else it sits out, and the loop buzzes at it)
      for (const d of L.devices) {
        if (out[d.id] !== 'on' || !d.seq) continue;
        const sk = L.socketsById[st.seat[d.plug.id]];
        if (sk.strip.seq && sk.slot !== d.seq.step) out[d.id] = 'standby';
      }
    }
    // a bass level: a plug only carries power once its collar is locked (the live room keeps st.flags.locked; the solver's states have none)
    if (L.bassLock && st.flags && st.flags.locked) {
      for (const d of L.devices) if (out[d.id] === 'on' && !st.flags.locked[d.plug.id]) out[d.id] = 'standby';
    }
    if (L.chain) {
      // listeners: awake only while the device they follow is awake to their left on the same strip; a clash silences both neighbours
      const info = Rules.chainState(L, st, out);
      for (const d of L.devices) if (out[d.id] === 'on' && !info.awake[d.id]) out[d.id] = 'standby';
      if (extra) extra.chain = info;
    }
    return out;
  };
  // the chain of listening: which devices are awake, which are silenced by a clash, and what each waiting device is waiting for
  Rules.chainState = function (L, st, base) {
    const sockOf = (d) => (st.seat[d.plug.id] ? L.socketsById[st.seat[d.plug.id]] : null);
    const clashed = {},
      other = {};
    for (const d of L.devices)
      for (const oid of d.clash) {
        const o = L.devicesById[oid],
          a = sockOf(d),
          b = o && sockOf(o);
        if (a && b && a.strip === b.strip && Math.abs(a.slot - b.slot) === 1 && base[d.id] === 'on' && base[o.id] === 'on') {
          clashed[d.id] = clashed[o.id] = true;
          other[d.id] = o.id;
          other[o.id] = d.id;
        }
      }
    const memo = {},
      why = {};
    const awake = (d, guard) => {
      if (memo[d.id] !== undefined) return memo[d.id];
      if (base[d.id] !== 'on') return (memo[d.id] = false);
      if (clashed[d.id]) {
        why[d.id] = { kind: 'clash', other: other[d.id] };
        return (memo[d.id] = false);
      }
      if (!d.after) return (memo[d.id] = true);
      if (guard[d.id]) return false;
      guard[d.id] = true;
      const lead = L.devicesById[d.after],
        sl = sockOf(lead),
        sd = sockOf(d);
      let ok = false;
      if (!sl) why[d.id] = { kind: 'after', leader: d.after, why: 'absent' };
      else if (!sd || sl.strip !== sd.strip) why[d.id] = { kind: 'after', leader: d.after, why: 'strip' };
      else if (sl.slot > sd.slot) why[d.id] = { kind: 'after', leader: d.after, why: 'right' };
      else if (!awake(lead, guard)) why[d.id] = { kind: 'after', leader: d.after, why: 'asleep' };
      else ok = true;
      return (memo[d.id] = ok);
    };
    const res = {};
    for (const d of L.devices) res[d.id] = awake(d, {});
    return { awake: res, clashed, why };
  };
  // sequencer: the devices seated on a step they do not belong to (the loop buzzes at them)
  Rules.seqWrong = function (L, st) {
    const out = [];
    for (const d of L.devices) {
      const sk = d.seq && st.seat[d.plug.id] ? L.socketsById[st.seat[d.plug.id]] : null;
      if (sk && sk.strip.seq && sk.slot !== d.seq.step) out.push({ dev: d, sock: sk });
    }
    return out;
  };
  Rules.seqOK = function (L, map) {
    for (const d of L.devices) {
      if (!d.seq || !map[d.plug.id]) continue;
      const sk = L.socketsById[map[d.plug.id]];
      if (sk.strip.seq && sk.slot !== d.seq.step) return false;
    }
    return true;
  };
  // the groove (Level 29): the share of voices sitting in their pocket; the groove is lit (and the room may wake) only when all of them do
  Rules.grooveScore = function (L, st) {
    let n = 0,
      ok = 0;
    for (const d of L.devices) {
      if (!d.seq) continue;
      n++;
      const sid = st.seat[d.plug.id],
        sk = sid ? L.socketsById[sid] : null;
      if (sk && sk.strip.seq && sk.slot === d.seq.step) ok++;
    }
    return n ? ok / n : 0;
  };
  Rules.grooveLit = function (L, st) {
    return Rules.grooveScore(L, st) >= 1;
  };
  // how many devices a device follows before the first one that follows nobody (0 for a leader)
  Rules.chainDepth = function (L, d) {
    let n = 0;
    for (let g = d; g && g.after && n < 8; g = L.devicesById[g.after]) n++;
    return n;
  };
  // structure only (the solver): every seated listener has its leader to its left on its strip, and no clashing pair is adjacent
  Rules.chainOK = function (L, map) {
    const sockOf = (d) => (map[d.plug.id] ? L.socketsById[map[d.plug.id]] : null);
    for (const d of L.devices) {
      const sd = sockOf(d);
      if (!sd) continue;
      if (d.after) {
        const sl = sockOf(L.devicesById[d.after]);
        if (!sl || sl.strip !== sd.strip || sl.slot >= sd.slot) return false;
      }
      for (const oid of d.clash) {
        const so = sockOf(L.devicesById[oid]);
        if (so && so.strip === sd.strip && Math.abs(so.slot - sd.slot) === 1) return false;
      }
    }
    return true;
  };
  Rules.complete = function (L, st, crossings) {
    const pw = Rules.power(L, st);
    for (const d of L.devices) if (d.required && pw[d.id] !== 'on') return false;
    if (L.seqGroove && !Rules.grooveLit(L, st)) return false; // the groove wakes the room only when every voice is in its pocket
    if (L.def.rules && L.def.rules.noCross && crossings > 0) return false;
    return true;
  };

  /* ---------------------------------------------------------------- solver */
  // all complete plug->socket assignments (capped); opts.dead overrides dead sockets
  Rules.solveAll = function (L, opts) {
    opts = opts || {};
    const cap = opts.cap || 5000;
    const dead = opts.dead || {};
    const mended = opts.mended || {};
    const wraps = L.def.tape ? L.def.tape.wraps - Object.keys(mended).length : 0;
    const plugs = L.plugs.filter((p) => p.device.required || !p.device.def.tool); // a temporary helper is not part of the final room
    const helpers = L.plugs.filter((p) => !p.device.required && p.device.def.tool);
    const cand = {};
    // blocks: the static solver judges the layout the level is solved at (def.blocksGoal); the live one (the hint) the blocks as they are
    const RT = opts.live ? L.reach : L.reachSolve || L.reach;
    const covered = (s) => L.blocks && (opts.live || L._coverNow || !L.def.blocksGoal ? !!Rules.blockCovers(L, s) : Rules.blockCoversAt(L, s, L.def.blocksGoal));
    for (const p of L.plugs)
      cand[p.id] = L.sockets.filter((s) => !s.dead && !dead[s.id] && Rules.fits(p, s) && RT[p.id][s.id].ok && RT[p.id][s.id].thread !== false && !covered(s));
    plugs.sort((a, b) => cand[a.id].length - cand[b.id].length);
    const sols = [];
    const cover = {};
    const map = {};
    (function rec(i) {
      if (sols.length >= cap) return;
      if (i === plugs.length) {
        if (L.capped) {
          for (const s of L.strips) if (s.cap && Rules.loadOf(L, map, s) > s.cap) return;
        }
        if (L.wet) {
          for (const k in map) {
            const sk = L.socketsById[map[k]];
            if (!sk.wet || (opts.dry && opts.dry[sk.id])) continue;
            const dryer = L.devicesById[sk.wetBy];
            const hp = dryer.plug;
            if (!dryer.required && dryer.def.tool) {
              // a temporary helper: it only needs SOME dry socket to run in while it works (it leaves afterwards)
              if (!cand[hp.id].some((c) => !c.wet)) return;
            } else {
              const ds = map[hp.id];
              if (!ds || L.socketsById[ds].wet) return;
            }
          }
        }
        if (L.def.tape) {
          let cost = 0;
          for (const k in map) {
            const sk = L.socketsById[map[k]];
            if (sk.frayed && !mended[sk.id]) cost++;
          }
          if (cost > wraps) return;
        }
        if (L.chain && !Rules.chainOK(L, map)) return;
        if (L.seqLevel && !Rules.seqOK(L, map)) return;
        if (L.fed) {
          const t = Rules.newState(L);
          for (const k in map) t.seat[k] = map[k];
          if (!Rules.complete(L, t, 0)) return;
        }
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
    if (L.blocks && L.def.blocksGoal && !L._atGoal) {
      // the cables settle with the blocks where the level is solved
      return Rules.atBlockLayout(L, L.def.blocksGoal, () => {
        L._atGoal = true;
        try {
          return Rules.solutionCrossings(L, map);
        } finally {
          L._atGoal = false;
        }
      });
    }
    if (L.carried.length && !L._atDock) {
      // a carried strip's arrangement is judged with the strip at its dock
      const homes = L.carried.map((st) => ({ st, x: st.x, y: st.y }));
      for (const h of homes) if (h.st.carrier.dock) Rules.setStripPos(h.st, h.st.carrier.dock.x, h.st.carrier.dock.y);
      L._atDock = true;
      const c = Rules.solutionCrossings(L, map);
      L._atDock = false;
      for (const h of homes) Rules.setStripPos(h.st, h.x, h.y);
      return c;
    }
    const lines = [];
    const useArcs = !L.obstacles.length && G.Rope && G.Rope.arcPoints;
    const sc = (L.def && L.def.settleCurl) || 1;
    for (const dev of L.devices) {
      const sid = map[dev.plug.id];
      if (!sid) continue;
      if (useArcs) {
        const sk = L.socketsById[sid];
        const n = Math.max(8, Math.min(64, Math.ceil(dev.len / (G.T ? G.T.segLen : 8)) + 1));
        const ox = new Float64Array(n),
          oy = new Float64Array(n);
        G.Rope.arcPoints(dev.port.x, dev.port.y, sk.x, sk.y, dev.len, n, sc, ox, oy);
        const pts = [];
        for (let i = 0; i < n; i += 2) pts.push({ x: ox[i], y: oy[i] });
        pts.push({ x: ox[n - 1], y: oy[n - 1] });
        lines.push(pts);
      } else lines.push(L.reach[dev.plug.id][sid].all[dev.id].pts);
    }
    let c = 0;
    for (let i = 0; i < lines.length; i++) for (let j = i + 1; j < lines.length; j++) c += Geom.polyCross(lines[i], lines[j]);
    return c;
  };

  // next best action from a given state: {type:'seat'|'unseat'|'switch', plug, socket, from, strip, target}
  // the light hint (Torchlight): a plug that waits for a socket the pool has not touched is led there, as a drawn path from the torch
  Rules.hintLight = function (L, st) {
    const from = (st.flags && st.flags.torchAt) || { x: 180, y: 300 };
    for (const p of L.plugs) {
      if (st.seat[p.id]) continue;
      for (const s of L.sockets) {
        if (!Rules.fits(p, s) || (st.flags.seen && st.flags.seen[s.id])) continue;
        return { type: 'draw', light: true, plug: p.id, socket: s.id, pts: [{ x: from.x, y: from.y }, { x: s.x, y: s.y }], target: { [p.id]: s.id } };
      }
    }
    return null;
  };
  // the crane's next move: carry a prize to the tray, or go and take the nearest one still on a socket; a tap when the head is over it
  Rules.hintCrane = function (L, st) {
    const c = st.flags.crane,
      tr = st.flags.tray;
    const head = { x: c.x, y: c.y };
    if (c.att) {
      if (inRectR(head, tr)) return { type: 'magnet', at: { x: head.x, y: head.y }, crane: true };
      return { type: 'draw', crane: true, pts: [head, { x: tr.x, y: tr.y }] };
    }
    const todo = (st.flags.prizes || []).filter((pz) => !pz.inTray);
    if (!todo.length) return null;
    todo.sort((a, b) => Math.hypot(a.x - head.x, a.y - head.y) - Math.hypot(b.x - head.x, b.y - head.y));
    const pz = todo[0];
    if (Math.hypot(pz.x - head.x, pz.y - head.y) > 34) return { type: 'draw', crane: true, pts: [head, { x: pz.x, y: pz.y }] };
    return { type: 'magnet', at: { x: head.x, y: head.y }, crane: true };
  };
  const inRectR = (p, r) => Math.abs(p.x - r.x) <= r.w / 2 && Math.abs(p.y - r.y) <= r.h / 2;
  // the dollhouse's hint: while the big room is locked, the next thing to do is a miniature plug's seat (the hint names its socket)
  Rules.hintDoll = function (L, st) {
    for (const p of L.plugs) {
      if (!p.device.mini || st.seat[p.id]) continue;
      const s = L.sockets.find((k) => !k.doll && Rules.fits(p, k) && !(st.seat && Object.values(st.seat).includes(k.id)));
      if (s) return { type: 'seat', plug: p.id, socket: s.id, target: { [p.id]: s.id } };
    }
    return null;
  };
  // a reel's drum (Rewind): a plug whose socket is farther than its cable is out on the bench is led to the drum, to let the cable out
  Rules.hintReel = function (L, st) {
    for (const p of L.plugs) {
      const d = p.device;
      if (!d.def.cable || !d.def.cable.reel || st.seat[p.id]) continue;
      const cur = st.flags.reel[d.id];
      if (cur === undefined) continue;
      for (const s of L.sockets) {
        if (!Rules.fits(p, s) || (s.doll && !(st.flags.doll && st.flags.doll.open))) continue;
        const dist = Math.hypot(d.port.x - s.x, d.port.y - s.y);
        if (dist <= cur * 0.9) continue;
        const want = Math.min(d.len, dist / 0.85);
        const K = 1.6;
        const handle = { x: d.port.x, y: d.port.y + 24 };
        return { type: 'draw', reel: true, pts: [handle, { x: handle.x, y: handle.y + (want - cur) / K }], target: { [p.id]: s.id } };
      }
    }
    return null;
  };
  Rules.hint = function (L, st) {
    if (st.flags && st.flags.reel && L.reels) {
      const hr = Rules.hintReel(L, st);
      if (hr) return hr;
    }
    if (st.flags && st.flags.doll && !st.flags.doll.open) {
      const hd = Rules.hintDoll(L, st);
      if (hd) return hd;
    }
    if (st.flags && st.flags.crane && !st.flags.dark) {
      const hc = Rules.hintCrane(L, st);
      if (hc) return hc;
    }
    if (st.flags && st.flags.dark) {
      const hl = Rules.hintLight(L, st);
      if (hl) return hl;
    }
    if (L.rails.length) return Rules.hintRail(L, st);
    // a pendulum has no road: its sockets are timed and live, so the general hint (with its waits) judges them
    if (L.carried.length && L.carried[0].carrier.mode !== 'pendulum') return L.carried[0].carrier.track ? Rules.hintTrack(L, st) : L.carried[0].carrier.mode === 'wind' ? Rules.hintWind(L, st) : Rules.hintCarrier(L, st);
    if (L.blocks) {
      // blocks first: if no arrangement works with the blocks where they are, the hint is the next block to move
      const hb = Rules.hintBlocks(L, st);
      if (hb) return hb;
    }
    const sols = Rules.solveAll(L, { cap: 3000, dead: st.dead, mended: st.mended, dry: st.dry, live: !!L.blocks });
    if (!sols.length) return null;
    const noCross = L.def.rules && L.def.rules.noCross;
    let best = null,
      bestScore = Infinity;
    for (const m of sols) {
      let mism = 0;
      for (const p of L.plugs) if (m[p.id] !== undefined && st.seat[p.id] !== m[p.id]) mism++;
      const cr = Rules.solutionCrossings(L, m); // tidy layouts are always preferred; they are a gate when noCross
      const score = mism * 10 + cr * (noCross ? 100 : 4);
      if (score < bestScore) {
        best = m;
        bestScore = score;
      }
    }
    // a bass level: a plug that sits where the room wants it must be locked before the next thump pops it out (lock first, then move on)
    if (L.bassLock && st.flags && st.flags.locked) {
      for (const p of L.plugs) if (st.seat[p.id] && best[p.id] === st.seat[p.id] && !st.flags.locked[p.id]) return { type: 'lock', plug: p.id, socket: st.seat[p.id], target: best };
    }
    // a temporary helper (a tool that need not stay): seat it where the room will soon want a plug, wait, then take it out
    const isHelper = (p) => !p.device.required && p.device.def.tool;
    for (const hp of L.plugs.filter(isHelper)) {
      const needed = L.sockets.filter((sk) => sk.wet && sk.wetBy === hp.device.id && !(st.dry && st.dry[sk.id]) && L.plugs.some((q) => best[q.id] === sk.id));
      if (needed.length) {
        if (!st.seat[hp.id]) {
          // the helper only works on a live strip, and must not trip the breaker while it does
          const free = L.sockets.filter((sk) => Rules.canSeat(L, st, hp.id, sk.id).ok && Rules.energized(L, st, sk.strip) && (!sk.strip.cap || Rules.loadOf(L, Object.assign({}, st.seat, { [hp.id]: sk.id }), sk.strip) <= sk.strip.cap));
          free.sort((a, b) => (L.plugs.some((q) => best[q.id] === b.id) ? 1 : 0) - (L.plugs.some((q) => best[q.id] === a.id) ? 1 : 0));
          if (free.length) return { type: 'seat', plug: hp.id, socket: free[0].id, target: best };
        } else return { type: 'wait', plug: hp.id, target: best };
      } else if (st.seat[hp.id]) return { type: 'unseat', plug: hp.id, from: st.seat[hp.id], target: best };
    }
    const rank = (p) => (p.device.cord ? 2 : 0);
    const hintOrder = L.plugs.filter((p) => !isHelper(p)).sort((a, b) => rank(a) - rank(b));
    for (const p of hintOrder) {
      if (st.seat[p.id]) continue;
      if (Rules.isWet(st, L.socketsById[best[p.id]])) return { type: 'wait', plug: p.id, socket: best[p.id], target: best }; // the dryer is on it
      if (L.timed && L.socketsById[best[p.id]].timer && Rules.opensIn(st, L.socketsById[best[p.id]]) > 0) return { type: 'seat', plug: p.id, socket: best[p.id], target: best, wait: Rules.opensIn(st, L.socketsById[best[p.id]]) };
      if (st.flags && st.flags.blocked && st.flags.blocked[best[p.id]]) {
        // Biscuit is on it: a sleepy cat is petted away, a playful one is led away with the light
        if (L.def.herd) return { type: 'lure', socket: best[p.id], from: st.flags.cat ? { x: st.flags.cat.x, y: st.flags.cat.y } : null, to: L.def.herd.lure, target: best };
        return { type: 'pet', socket: best[p.id], target: best };
      }
      if (Rules.isFrayed(st, L.socketsById[best[p.id]])) return { type: 'mend', socket: best[p.id], target: best };
      if (Rules.canSeat(L, st, p.id, best[p.id]).ok) return { type: 'seat', plug: p.id, socket: best[p.id], target: best };
    }
    for (const p of L.plugs) {
      if (isHelper(p)) continue;
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
      let wrapsLeft = L.def.tape ? L.def.tape.wraps : 0;
      let tripsLeft = 0; // like the rest of luck (no pull-outs): a random player who trips the breaker has failed
      for (;;) {
        const un = L.plugs.filter((p) => !st.seat[p.id] && (p.device.required || p.device.def.tool));
        const need = L.plugs.filter((p) => !st.seat[p.id] && p.device.required);
        if (!need.length) {
          const wakes = L.plugs.every((p) => !st.seat[p.id] || L.reach[p.id][st.seat[p.id]].thread !== false) && (!(L.fed || L.chain || L.seqLevel) || Rules.complete(L, st, 0));
          if (wakes && (!(L.def.rules && L.def.rules.noCross) || Rules.solutionCrossings(L, st.seat) === 0)) wins++;
          break;
        }
        const mov = [];
        if (L.wet) for (const sk of L.sockets) if (sk.wet) st.dry[sk.id] = !!st.seat[L.devicesById[sk.wetBy].plug.id] && !L.socketsById[st.seat[L.devicesById[sk.wetBy].plug.id]].wet;
        for (const p of un) {
          const lg0 = L.def.tape ? L.sockets.filter((sk) => { const tmp = Object.assign({}, st, { mended: Object.assign({}, st.mended, sk.frayed && wrapsLeft > 0 ? { [sk.id]: true } : {}) }); return Rules.canSeat(L, tmp, p.id, sk.id).ok; }) : Rules.legalSockets(L, st, p.id);
          const lg = lg0;
          if (lg.length) mov.push([p, lg]);
        }
        if (!mov.length) break;
        const pick = mov[(rnd() * mov.length) | 0];
        const s = pick[1][(rnd() * pick[1].length) | 0];
        if (L.def.tape && s.frayed && !st.mended[s.id]) {
          st.mended[s.id] = true;
          wrapsLeft--;
        }
        st.seat[pick[0].id] = s.id;
        // an overload trips the breaker: every plug on that strip pops out (the real consequence), and the player tries again
        if (L.capped && s.strip.cap && Rules.load(L, st, s.strip) > s.strip.cap) {
          for (const q of L.plugs) if (st.seat[q.id] && L.socketsById[st.seat[q.id]].strip === s.strip) st.seat[q.id] = null;
          tripsLeft--;
          if (tripsLeft < 0) break;
        }
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
      if (s.carrier && s.carrier.dock) {
        // ... and at the dock where the plan ends
        const home = { x: s.x, y: s.y };
        Rules.setStripPos(s, s.carrier.dock.x, s.carrier.dock.y);
        items.push({ n: 'strip ' + s.id + '@dock', poly: Rules.stripPoly(s), kind: 'strip' });
        Rules.setStripPos(s, home.x, home.y);
      }
    }
    for (const d of L.devices) items.push({ n: 'device ' + d.id, poly: Rules.devicePoly(d), kind: 'device' });
    for (const o of L.obstacles) if (!o.block) items.push({ n: 'obstacle ' + (o.id || o.art || '?'), poly: Rules.obstaclePoly(o), kind: 'obstacle' });
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
      if (d.len / Math.max(c, 1) > 7) issues.push('cable of ' + d.id + ' too slack at rest (a heap)');
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
        const r = (L.reachSolve || L.reach)[p.id][s.id].ratio;
        if (r > CFG.reachDesign && r < CFG.decoyDesign) out.push(p.id + '→' + s.id + ' ' + r.toFixed(3));
      }
    return out;
  };
})();
