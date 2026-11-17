/* Snug — room.js : one level instance. Owns the cables, plug state machine, magnet, seating, power pulses,
   wake performances, the Power Cut script, crossings, win sequence, undo and hints.
   Rules decide legality (G.Rules); rope.js owns the physics; art*.js owns drawing. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const U = G.U,
    T = G.T,
    Rules = G.Rules,
    Art = G.Art,
    Fx = G.Fx,
    Geom = G.Geom;
  const TAU = U.TAU,
    sat = U.sat;
  const A = () => G.Audio;
  const H = () => G.Haptics;
  const STEP = 1 / 120;
  // material worlds: how the surface sounds (thunk timbre) and how far a loose cable slides (friction scale)
  const WORLDS = {
    desk: { mat: 'desk', fric: 1 },
    steel: { mat: 'steel', fric: 0.72 },
    tile: { mat: 'tile', fric: 0.88 },
    night: { mat: 'night', fric: 1 },
    peg: { mat: 'desk', fric: 0.95 },
    garage: { mat: 'tile', fric: 0.9 },
    toy: { mat: 'desk', fric: 0.95 }, // Act 3: pine floorboards under a felt play mat
    studio: { mat: 'night', fric: 0.9 }, // Act 3, the studio: a dark stage, black rubber
    lab: { mat: 'desk', fric: 0.2 }, // Act 5, the Lab: a smooth bench, so a gust can move a plug without fighting the wood
    wall: { mat: 'steel', fric: 0.6, grav: 900 }, // Act 4, Hang Time: the wall, where gravity is back and a plug hangs from its cable
    station: { mat: 'steel', fric: 0.05, damp: 0.22, zeroG: true }, // Act 4, the station: no floor to hold a cable; a flicked plug drifts on until its tether or a socket stops it
  };
  // pentatonic degrees (semitones) for plucked cables
  const PLUCK_LADDER = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26];

  function Room(def, opts) {
    opts = opts || {};
    this.def = def;
    this.L = Rules.compile(def);
    this.st = Rules.newState(this.L);
    this.title = !!def.title;
    this.toy = !!def.toy;
    this.world = WORLDS[def.world] || WORLDS.desk;
    this.t = 0;
    this.offX = 0;
    this.acc = 0;
    this.phase = 'arriving'; // arriving | playing | cut | waking | settling
    this.queue = [];
    this.hasKeys = !def.plainSockets && (this.L.plugs.some((p) => p.key !== 'any') || this.L.sockets.some((s) => s.key !== 'any'));
    this.dawn = def.dawn === undefined ? 0.5 : def.dawn;
    this.devRT = {};
    this.plugRT = {};
    this.plugList = [];
    this.stripRT = {};
    this.decorRT = [];
    this.appearAt = {};
    this.pulses = [];
    this.awakeCount = 0;
    this.awakeFrac = 0;
    this.awakeShown = 0;
    this.seatCount = 0;
    this.undo = [];
    this.stars = null;
    this.blackout = 0;
    this.blackoutT = 0;
    this.flash = 0;
    this.crossRaw = [];
    this.crossHits = [];
    this.crossT = 0;
    this.crossHinted = false;
    this.winStable = 0;
    this.hint = null;
    this.idle = 0;
    this.hintGlow = 0;
    this.autoHintDone = false;
    this.scriptFired = false;
    this.locked = false;
    this.decorLit = 0;
    this.decorLitT = 0;
    this.completed = false;
    this.dustT = 0;
    this.mat = null;
    this.rustleV = 0;
    this.nudges = {};
    this.titleLit = 0;
    this.onEvent = opts.onEvent || function () {};
    this.finale = def.finale === 'rex' && G.RexFinale ? new G.RexFinale(this) : def.finale === 'sunrise' && G.SunriseFinale ? new G.SunriseFinale(this) : null;
    this.build();
  }
  G.Room = Room;

  /* ---------------------------------------------------------------- construction */
  Room.prototype.build = function () {
    const L = this.L,
      def = this.def;
    let order = 0;
    const stagger = 0.06;
    for (const s of L.strips) {
      const sw = this.st.sw[s.id] ? 1 : 0;
      const rt = {
        squash: new U.Spring(520, 21, 0),
        sw,
        swS: new U.Spring(520, 30, sw),
        glow: {},
        fray: {},
        cover: {},
        flash: {},
        fpFlash: {},
        dead: {},
        ember: {},
        energized: Rules.energized(L, this.st, s),
        ledFlick: 0,
        swHint: 0,
        breathe: true,
      };
      for (const k of s.sockets) if (k.dead) rt.dead[k.id] = true;
      this.stripRT[s.id] = rt;
      this.appearAt['s:' + s.id] = 0.04 + order++ * stagger;
    }
    for (const d of L.devices) {
      this.devRT[d.id] = {
        dev: d,
        p: 'off',
        power: 'off',
        bloom: 0,
        wake: -1,
        batt: 0,
        battT: 0,
        face: Art.newFace(),
        hopS: new U.Spring(420, 15, 0),
        hop: 0,
        shx: 0,
        shy: 0,
        wig: 0,
        blinkT: 1 + Math.random() * 3,
        blinkP: -1,
        wince: 0,
        delight: 0,
        poke: 0,
        zzzT: Math.random() * 2.5,
        padId: -1,
        lit: 0,
        pending: false,
        attn: 0,
        glanceT: 2 + Math.random() * 4,
        glanceX: 0,
        glanceY: 0,
      };
      this.appearAt['d:' + d.id] = 0.04 + order++ * stagger;
    }
    (def.obstacles || []).forEach((o, i) => (this.appearAt['o:' + i] = 0.04 + order++ * stagger));
    (def.decor || []).forEach((d, i) => {
      this.decorRT.push({ poke: 0, found: false, lit: 0, steamT: Math.random(), peek: 0, hidden: !!d.showAfterScript, appear: 0, lookX: 0, lookY: 0 });
      this.appearAt['c:' + i] = 0.04 + order++ * stagger;
    });
    // plugs (ropes settle on the desk, deterministic)
    for (const p of L.plugs) {
      const dev = p.device;
      const rope = new G.Rope({ len: (dev.def.cable && dev.def.cable.start) || dev.len, rootX: dev.port.x, rootY: dev.port.y, plugX: dev.rest.x, plugY: dev.rest.y, curl: dev.curl, settleCurl: def.settleCurl || 1, fat: p.size === 'fat', fricK: this.world.fric, dampK: this.world.damp, gravK: this.world.grav, wind: def.wind || null, noRelax: dev.via.length > 0 });
      rope.settle(100, L.obstacles);
      if (p.devices.length > 1) {
        // a Y-plug: a second cable from the other device ends at the same plug
        const d2 = p.devices[1];
        rope.twin = new G.Rope({ len: d2.len, rootX: d2.port.x, rootY: d2.port.y, plugX: d2.rest.x, plugY: d2.rest.y, curl: d2.curl, settleCurl: def.settleCurl || 1, fat: p.size === 'fat', fricK: this.world.fric, dampK: this.world.damp, gravK: this.world.grav, wind: def.wind || null, noRelax: d2.via.length > 0 });
        rope.twin.settle(100, L.obstacles);
      }
      const prt = {
        id: p.id,
        plug: p,
        dev: this.devRT[dev.id],
        rope,
        state: 'rest',
        seatSock: null,
        lift: 0,
        scale: 1,
        sq: new U.Spring(620, 17, 1),
        x: rope.plugX(),
        y: rope.plugY(),
        nose: 0,
        noseDisp: rope.plugAngle,
        hover: null,
        hoverW: 0,
        hoverNose: 0,
        anim: null,
        grab: null,
        rim: 0,
        wob: 0,
        wobV: 0,
        ins: 0,
        fat: p.size === 'fat',
        pose: null,
        liveT: 0,
        taut: false,
        twanged: false,
        vAvg: 0,
        lean: 0,
        px: rope.plugX(),
        py: rope.plugY(),
        tockCd: 0,
        strumCd: 0,
      };
      this.plugRT[p.id] = prt;
      this.plugList.push(prt);
    }
    for (const prt of this.plugList) {
      const sid = this.st.seat[prt.id];
      if (sid) this.placeSeated(prt, L.socketsById[sid], true);
    }
    if (this.L.bassLock) this.bassInit(); // before the first power sync: a lock level starts with every plug unlocked
    this.syncPowerInstant();
    this.updateCover();
    if (this.L.rails.length) this.railInit();
    if (this.L.gates.length) this.gateInit();
    if (this.def.tape) this.tapeInit();
    if (this.L.wet) this.wetInit();
    if (this.L.capped) this.breakerInit();
    if (this.L.timed) this.timerInit();
    if (this.L.carried.some((s) => s.carrier.mode !== 'pendulum')) this.carryInit();
    if (this.def.herd) this.herdInit();
    if (this.def.blocks) this.blocksInit();
    if (this.L.chain) this.chainInit();
    if (this.L.seqLevel) this.seqInit();
    if (this.def.dark) this.darkInit();
    if (this.def.decoys) this.magnetInit(); // Act 4, Magnet Moon: paperclips that hold a plug without powering it
    if (this.def.orbital) this.orbitalInit(); // Act 4, Orbital Repair: a cascade that rises with the planet
    if (this.L.carried.some((s) => s.carrier.mode === 'pendulum')) this.pendulumInit(); // Act 4, Swing & Plug: a carriage on a pivot
    if (this.def.torch) this.torchInit(); // Act 5, Torchlight: a black room, lit by a torch's pool
    if (this.def.crane) this.craneInit(); // Act 5, Crane Game: a magnet head over the bench, lifting prizes off the sockets
    if (this.def.doll) this.dollInit(); // Act 5, Dollhouse: the big room is locked until the miniature board is solved
    if (this.def.ghost) this.ghostInit(); // Act 5, Ghost Cables: the last run's cables are the ghosts of this one
    if (this.def.mirror) this.mirrorInit(); // Act 5, Mirror, Mirror: each plug has a reflection across the seam
    if (this.def.brownout) this.brownoutInit(); // Act 5, Brownout: the lights go out part way through the solve
    if (this.def.reels) this.reelInit(); // Act 5, Rewind: a cable on a reel, wound in or let out
    if (this.def.skyline) this.skyRT = null; // Act 5, Blackout: the credits cable starts at the wake
    if (this.def.duet) this.duetInit(); // Act 5, Duet With Yourself: a recorded path, played back by a ghost hand
  };

  Room.prototype.later = function (sec, fn) {
    this.queue.push({ t: this.t + sec, fn });
  };

  /* ---------------------------------------------------------------- stereo, strings */
  Room.prototype.pan = function (x) {
    return U.clamp((x - 180) / 180, -1, 1) * 0.65;
  };
  // each cable is a string: shorter = higher, always on the pentatonic ladder
  // long cables are low, short ones high; ties break left to right, so a left-to-right sweep climbs a scale
  Room.prototype.noteOf = function (prt) {
    if (prt.noteIdx === undefined) {
      const order = this.plugList.slice().sort((a, b) => b.rope.len - a.rope.len || a.rope.rootX - b.rope.rootX);
      order.forEach((q, r) => (q.noteIdx = U.clamp(Math.round(2 + r * 1.8), 0, PLUCK_LADDER.length - 1)));
    }
    return 60 + PLUCK_LADDER[prt.noteIdx];
  };
  Room.prototype.pluckRope = function (prt, s, amp, rope) {
    if (this.phase === 'cut' || this.title) return;
    rope = rope || prt.rope;
    rope.pluck(s, amp);
    const i = Math.max(0, Math.min(rope.n - 1, Math.round(s * (rope.n - 1))));
    A().pluck(this.noteOf(prt) + (rope === prt.rope ? 0 : 5), U.clamp(amp / 4.5, 0.2, 1), this.pan(rope.x[i]));
    H().pulse('pluck');
    prt.dev.attn = Math.max(prt.dev.attn, 0.5);
    this.idle = 0;
  };
  // sweep a finger segment across the cables: a harp
  Room.prototype.strum = function (ax, ay, bx, by, speed) {
    if (this.phase === 'cut' || this.title) return false;
    const o = { x: 0, y: 0 };
    let any = false;
    for (const prt of this.plugList) {
      if (prt.strumCd > 0 || prt.state === 'held' || prt.state === 'hop' || prt.state === 'seating') continue;
      for (const r of prt.rope.twin ? [prt.rope, prt.rope.twin] : [prt.rope]) {
        let hit = false;
        for (let i = 0; i < r.n - 1; i++) {
          if (Geom.segInter(ax, ay, bx, by, r.x[i], r.y[i], r.x[i + 1], r.y[i + 1], o)) {
            prt.strumCd = 0.16;
            this.pluckRope(prt, (i + 0.5) / (r.n - 1), U.clamp(1.6 + speed / 260, 1.6, 6), r);
            any = hit = true;
            break;
          }
        }
        if (hit) break;
      }
    }
    return any;
  };

  /* ---------------------------------------------------------------- the Y-plug: two cables, one plug */
  // the twin cable follows the primary's controls (held / pinned / tweened) exactly
  Room.prototype.syncTwin = function (prt) {
    const a = prt.rope,
      b = a.twin;
    b.mode = a.mode;
    b.tx = a.tx;
    b.ty = a.ty;
    b.tau = a.tau;
    b.vmax = a.vmax;
    b.pinX = a.pinX;
    b.pinY = a.pinY;
    b.exitX = a.exitX;
    b.exitY = a.exitY;
    if (a.relaxOn !== b.relaxOn) b.relaxHold = a.relaxHold;
    b.relaxOn = a.relaxOn;
    if (a.idealDirty) b.idealDirty = true;
    if (a.mode === 2) {
      b.x[b.n - 1] = a.x[a.n - 1];
      b.y[b.n - 1] = a.y[a.n - 1];
    }
  };
  // both cables end at ONE plug: after each step the tip is pushed into the overlap of both reach discs, and both tips are the same point
  Room.prototype.coupleTwin = function (prt) {
    const a = prt.rope,
      b = a.twin;
    if (a.mode === 2) {
      b.x[b.n - 1] = a.x[a.n - 1];
      b.y[b.n - 1] = a.y[a.n - 1];
      return;
    }
    let x = a.x[a.n - 1],
      y = a.y[a.n - 1];
    for (let k = 0; k < 4; k++) {
      for (const r of [a, b]) {
        const dx = x - r.rootX,
          dy = y - r.rootY,
          d = Math.hypot(dx, dy),
          lim = r.len * 0.995;
        if (d > lim) {
          x = r.rootX + (dx / d) * lim;
          y = r.rootY + (dy / d) * lim;
        }
      }
    }
    a.x[a.n - 1] = b.x[b.n - 1] = x;
    a.y[a.n - 1] = b.y[b.n - 1] = y;
    const st = Math.max(a.strain, b.strain);
    a.strain = b.strain = st;
    a.speed = Math.max(a.speed, b.speed);
    b.plugAngle = a.plugAngle;
  };

  /* ---------------------------------------------------------------- placing and power */
  Room.prototype.placeSeated = function (prt, sock, instant) {
    const rope = prt.rope,
      dev = prt.plug.device;
    prt.seatSock = sock.id;
    prt.state = 'seated';
    this.st.seat[prt.id] = sock.id;
    prt.pose = { x: sock.x, y: sock.y, nose: Math.atan2(-sock.fy, -sock.fx) };
    prt.ins = 1;
    prt.lift = 0;
    prt.scale = 1;
    prt.sq.x = prt.sq.t = 1;
    prt.x = sock.x;
    prt.y = sock.y;
    prt.noseDisp = prt.pose.nose;
    if (instant) {
      rope.build(dev.port.x, dev.port.y, sock.x + sock.fx * rope.seg * 4, sock.y + sock.fy * rope.seg * 4);
      rope.pin(sock.x, sock.y, sock.fx, sock.fy, true);
      rope.settle(160, this.L.obstacles);
      if (rope.twin) {
        const t2 = rope.twin,
          d2 = prt.plug.devices[1];
        t2.build(d2.port.x, d2.port.y, sock.x + sock.fx * t2.seg * 4, sock.y + sock.fy * t2.seg * 4);
        t2.pin(sock.x, sock.y, sock.fx, sock.fy, true);
        t2.settle(160, this.L.obstacles);
      }
    } else rope.pin(sock.x, sock.y, sock.fx, sock.fy, true);
  };

  Room.prototype.syncPowerInstant = function () {
    const pw = Rules.power(this.L, this.st);
    for (const d of this.L.devices) {
      const rt = this.devRT[d.id];
      if (pw[d.id] === 'on') {
        rt.p = 'on';
        rt.bloom = 1;
        rt.batt = rt.battT = 1;
        rt.wake = 5;
        rt.face.eyeOpen = 1;
        rt.face.smile = 0.35;
        this.awakeCount++;
      } else if (pw[d.id] === 'standby') rt.p = 'standby';
    }
    this.awakeFrac = this.requiredOn() / Math.max(1, this.requiredCount());
  };
  Room.prototype.requiredCount = function () {
    return this.L.devices.filter((d) => d.required).length;
  };
  Room.prototype.requiredOn = function () {
    let n = 0;
    for (const d of this.L.devices) if (d.required && this.devRT[d.id].p === 'on') n++;
    return n;
  };

  Room.prototype.refreshPower = function (cause) {
    const L = this.L,
      chainInfo = {},
      pw = Rules.power(L, this.st, chainInfo);
    for (const s of L.strips) {
      const srt = this.stripRT[s.id];
      const e = Rules.energized(L, this.st, s);
      // a fed strip coming alive: a wave of light runs through its LEDs, one by one
      if (e && !srt.energized && s.fedBy && this.t > 0.6) {
        srt.wave = 0;
        A().at(this.pan(s.x), () => A().sfx.ledrun(s.n));
        Fx.ring(s.x, s.y, 70, '#9ff0b8', 0.6, 2.2);
        H().pulse('tick');
      }
      srt.energized = e;
    }
    const ons = [];
    let standby = 0;
    for (const d of L.devices) if (this.devRT[d.id].p === 'standby') standby++;
    for (const d of L.devices) {
      if (d.cord) continue; // a strip's own cord is not a character: it never wakes
      const rt = this.devRT[d.id],
        np = pw[d.id];
      const isOn = rt.p === 'on' || rt.p === 'waking';
      if (np === 'on') {
        if (!isOn) ons.push(d);
      } else if (np === 'standby') {
        if (isOn) this.sleep(rt);
        if (rt.p !== 'standby') {
          rt.p = 'standby';
          A().sfx.bip(standby++);
        }
      } else if (isOn || rt.p === 'standby') {
        if (isOn) this.sleep(rt);
        rt.p = 'off';
      }
    }
    if (this.chainRT) {
      // a chain wakes in order: the leader first, then the ones who listen to it, each with a relay click as the beat reaches it
      ons.sort((a, b) => Rules.chainDepth(L, a) - Rules.chainDepth(L, b) || a.x - b.x);
      ons.forEach((d) => {
        const depth = Rules.chainDepth(L, d),
          delay = 0.3 * depth;
        this.startPulse(d, delay);
        if (depth > 0) this.later(delay + 0.1, () => A().sfx.relay(this.pan(d.x)));
      });
      this.chainApply(chainInfo.chain, pw);
    } else {
      ons.sort((a, b) => a.x - b.x);
      ons.forEach((d, i) => this.startPulse(d, (cause && cause.switch) || ons.length > 1 ? 0.13 * i : 0));
    }
    this.onEvent('power');
    if (this.loadRT) this.breakerCheck();
  };

  Room.prototype.startPulse = function (d, delay) {
    const rt = this.devRT[d.id],
      prt = this.plugRT[d.plug.id];
    rt.p = 'waking';
    rt.pending = true;
    this.pulses = this.pulses.filter((p) => p.rt !== rt);
    this.pulses.push({ rt, prt, rope: d.twin && prt.rope.twin ? prt.rope.twin : prt.rope, s: -delay * T.pulseSpeed, started: false });
  };

  Room.prototype.wake = function (rt) {
    if (rt.p === 'on') return;
    const L = this.L;
    rt.p = 'on';
    rt.pending = false;
    rt.wake = 0;
    rt.bloom = Math.max(rt.bloom, 0.001);
    rt.battT = 1;
    rt.batt = 0;
    rt.hopS.kick(1.9);
    rt.face.eyeOpen = 0.05;
    rt.face.blink = 0;
    const n = this.awakeCount;
    this.awakeCount++;
    const wpan = this.pan(rt.dev.x);
    A().chime(n, 0, wpan);
    A().voice(rt.dev.type, n, wpan);
    rt.padId = A().pad.add(n);
    Fx.sparkle(rt.dev.x, rt.dev.y, rt.dev.type === 'lamp' ? '#ffe9b0' : Art.KEYCOL[rt.dev.color] || '#fff', 12);
    Fx.ring(rt.dev.x, rt.dev.y, 46, '#fff6d8', 0.5, 2);
    this.awakeFrac = this.requiredOn() / Math.max(1, this.requiredCount());
    A().ambient.setAwake(this.awakeFrac);
    const names = rt.dev.type === 'drill' ? ['vrrm!', 'bzzzt!'] : ['ahh', 'ooh', '!', 'yay'];
    Fx.caption(names[(Math.random() * names.length) | 0], rt.dev.x, rt.dev.y - rt.dev.meta.h / 2 - 8, '#fff7dc');
    if (rt.dev.type === 'speaker') {
      // the cone thumps: two slow bass rings spread across the mat (a left and a right one cross in the middle)
      Fx.ring(rt.dev.x, rt.dev.y + 12, 150, '#ffe0a8', 0.95, 2.4);
      this.later(0.16, () => Fx.ring(rt.dev.x, rt.dev.y + 12, 110, '#ffd09a', 0.8, 2));
      Fx.kick(rt.dev.x < 180 ? 1.2 : -1.2, 0.8);
    }
    if (rt.dev.type === 'drill') {
      // Spike spins up and flings a puff of sawdust off the chuck
      for (let i = 0; i < 18; i++) Fx.spawn(Fx.KIND.DUST, rt.dev.x + (Math.random() - 0.5) * 14, rt.dev.y - 44, (Math.random() - 0.5) * 80, -18 - Math.random() * 46, 0.9, 2 + Math.random() * 1.8, '#e7c58f');
      Fx.kick(0, -1.1);
    }
    this.onEvent('wake', rt);
  };
  Room.prototype.sleep = function (rt) {
    const was = rt.p === 'on';
    rt.pending = false;
    this.pulses = this.pulses.filter((p) => p.rt !== rt);
    rt.p = 'off';
    if (was) {
      this.awakeCount = Math.max(0, this.awakeCount - 1);
      A().sfx.powerdown();
    }
    if (rt.padId >= 0) {
      A().pad.remove(rt.padId);
      rt.padId = -1;
    }
    rt.wince = 0.4;
    this.awakeFrac = this.requiredOn() / Math.max(1, this.requiredCount());
    A().ambient.setAwake(this.awakeFrac);
    this.onEvent('sleep', rt);
  };

  /* ---------------------------------------------------------------- covered sockets, hover geometry */
  Room.prototype.updateCover = function () {
    const cover = Rules.cover(this.L, this.st);
    for (const s of this.L.sockets) {
      const holder = cover[s.strip.id + '.' + s.slot];
      const own = this.st.seat[holder] === s.id;
      this.stripRT[s.strip.id].cover[s.id] = holder && !own ? 1 : 0;
    }
  };

  Room.prototype.findCandidate = function (prt, strictEngage) {
    const L = this.L;
    let best = null,
      bd = 1e9;
    // judge by where the player is AIMING (finger + offset), not by where a heavy plug has caught up to
    const ax = prt.state === 'held' && prt.aimX !== undefined ? prt.aimX : prt.x;
    const ay = prt.state === 'held' && prt.aimY !== undefined ? prt.aimY : prt.y;
    let closedD = 1e9; // distance to the nearest timed socket that is not open yet
    for (const s of L.sockets) {
      const d = Math.hypot(ax - s.x, ay - s.y);
      const R = !strictEngage && prt.hover === s.id ? T.releaseR : T.engageR;
      if (d > R) continue;
      const c = Rules.canSeat(L, this.st, prt.id, s.id);
      if (!c.ok) {
        if (c.why === 'closed' && d < closedD) closedD = d;
        continue;
      }
      if (d < bd) {
        bd = d;
        best = s;
      }
    }
    // you get the socket you aim at: a closed window nearer than any open one says "not yet" instead of seating next door
    if (closedD < bd) return null;
    return best ? { sock: best, d: bd } : null;
  };
  Room.prototype.nearestInvalid = function (prt) {
    const L = this.L;
    let best = null,
      bd = 1e9;
    for (const s of L.sockets) {
      const d = Math.hypot(prt.x - s.x, prt.y - s.y);
      if (d > T.refuseR) continue;
      const c = Rules.canSeat(L, this.st, prt.id, s.id);
      if (c.ok || c.why === 'reach' || c.why === 'moving') continue;
      if (d < bd) {
        bd = d;
        best = { sock: s, why: c.why, info: c };
      }
    }
    return best;
  };

  /* ---------------------------------------------------------------- input verbs */
  Room.prototype.canInteract = function () {
    return !this.locked && (this.phase === 'playing' || this.phase === 'settling' || this.phase === 'arriving');
  };

  Room.prototype.grabPlug = function (prt, ptr, x, y) {
    if (!(prt.state === 'rest' || prt.state === 'seated' || prt.state === 'held')) return false;
    if (prt.grab) return false;
    this.cancelHint();
    this.idle = 0;
    prt.grab = { id: ptr, sx: x, sy: y, fx: x, fy: y, t: 0, detent: !!prt.seatSock, fromSock: prt.seatSock, fromPos: { x: prt.x, y: prt.y }, popped: false };
    if (!prt.seatSock) this.startHeld(prt);
    else prt.state = 'seated';
    prt.dev.attn = 1;
    A().sfx.tick();
    H().pulse('grab');
    Fx.spawn(Fx.KIND.DUST, prt.x, prt.y, 0, 0, 0.4, 2.2, '#ffffff');
    if (this.mirrorRT) this.mirrorGrab(prt); // Act 5, Mirror, Mirror: the reflection comes with it
    if (this.duetRT) this.duetGrab(prt); // Act 5, Duet: a plug dragged after the record dot is armed is recorded
    return true;
  };
  Room.prototype.startHeld = function (prt) {
    prt.state = 'held';
    prt.twanged = false;
    prt.rope.mode = 1;
    prt.rope.hold(prt.x, prt.y, prt.fat ? T.tauFat : T.tauSlim, prt.fat ? T.vmaxFat : T.vmaxSlim);
  };
  Room.prototype.moveGrab = function (prt, x, y) {
    if (!prt.grab) return;
    if (this.duetRT) this.duetMove(prt, x, y); // Act 5, Duet: a recorded drag keeps its path
    if (this.mirrorRT) this.mirrorMove(prt, x, y); // the reflection follows the mirror of the finger
    if (prt.stuckTo && this.magnetMoveGrab(prt, prt.grab, x, y)) return; // a paperclip holds the plug until a firm pull peels it off
    prt.grab.fx = x;
    prt.grab.fy = y;
  };
  Room.prototype.releaseGrab = function (prt) {
    const g = prt.grab;
    if (!g) return;
    if (this.mirrorRT) this.mirrorRelease(prt); // the reflection lets go with it
    if (this.duetRT) this.duetRelease(prt); // Act 5, Duet: the recording of this plug ends with its drag
    prt.grab = null;
    prt.dev.attn = 0;
    if (g.detent && !g.popped) {
      // a tap on a seated plug: a tiny acknowledging wobble, nothing else
      prt.wobV = 2.5;
      return;
    }
    const cand = this.findCandidate(prt, true);
    if (cand) {
      // how it lands: a gentle placement is a soft tk, a fling is a THUNK; a well-centred aim is crisper
      g.power = U.clamp(0.3 + 0.7 * sat((prt.vAvg || 0) / 650), 0.3, 1);
      g.crisp = 1 - sat(cand.d / T.engageR);
      if (g.heldKick !== undefined && this.bassRT) this.bassSecretCheck(); // held through a thump, seated on the beat: the secret
      return this.seatInto(prt, cand.sock, g);
    }
    const near = this.nearestInvalid(prt);
    if (near) return this.refuse(prt, near, g);
    const clip = this.magnetNear(prt, g);
    if (clip) return this.magnetStick(prt, clip); // a paperclip is metal: the plug sticks to it, and powers nothing
    this.dropPlug(prt, g);
    if (this.def.sling) this.slingLaunch(prt); // a stretched cable slings the plug it was holding
  };

  Room.prototype.pushUndo = function (e) {
    this.undo.push(e);
    if (this.undo.length > 60) this.undo.shift();
  };

  Room.prototype.dropPlug = function (prt, g) {
    prt.state = 'rest';
    prt.rope.release();
    prt.hover = null;
    if (g.fromSock) {
      this.pushUndo({ plug: prt.id, fromSock: g.fromSock, fromPos: g.fromPos, toSock: null, toPos: { x: prt.x, y: prt.y } });
    }
    A().sfx.thud(0.2);
  };

  Room.prototype.unseatNow = function (prt, g) {
    const sock = this.L.socketsById[prt.seatSock];
    const from = prt.seatSock;
    this.st.seat[prt.id] = null;
    prt.seatSock = null;
    prt.ins = 0;
    prt.state = 'held';
    prt.rope.mode = 1;
    prt.x += sock.fx * 5;
    prt.y += sock.fy * 5;
    prt.rope.x[prt.rope.n - 1] = prt.x;
    prt.rope.y[prt.rope.n - 1] = prt.y;
    prt.rope.hold(prt.x, prt.y, prt.fat ? T.tauFat : T.tauSlim, prt.fat ? T.vmaxFat : T.vmaxSlim);
    prt.noseDisp = Math.atan2(-sock.fy, -sock.fx);
    if (g) g.popped = true;
    A().at(this.pan(sock.x), () => A().sfx.pop());
    H().pulse('pop');
    Fx.sparks(sock.x, sock.y, Art.KEYCOL[prt.plug.key] || '#fff4d0', 4, sock.fx, sock.fy, 2.4);
    this.stripRT[sock.strip.id].squash.x = -T.squash * 0.7;
    this.stripRT[sock.strip.id].ledFlick = 1;
    this.updateCover();
    this.refreshPower();
    return from;
  };

  Room.prototype.seatInto = function (prt, sock, g) {
    if (prt._slung && this.def.secret && this.def.secret.on === 'sling' && !this.secretFound) {
      this.secretFound = true; // a slung plug has docked: the golden squeak
      this.onEvent('secret', this.def.secret);
    }
    prt.state = 'seating';
    prt.hover = null;
    prt.seatSock = sock.id;
    this.st.seat[prt.id] = sock.id;
    prt.anim = { type: 'seat', t: 0, dur: T.seatMs / 1000, sock, from: { x: prt.x, y: prt.y, nose: prt.noseDisp, scale: prt.scale, lift: prt.lift }, g, contact: false };
    if (sock.timer) prt.anim.t = -Rules.opensIn(this.st, sock); // the window is about to open: the plug waits for it
    prt.rope.pin(prt.x, prt.y, sock.fx, sock.fy);
    this.updateCover();
  };

  Room.prototype.onContact = function (prt) {
    const sock = this.L.socketsById[prt.seatSock];
    const fat = prt.fat;
    const srt = this.stripRT[sock.strip.id];
    const g = prt.anim && prt.anim.g;
    if (this.timerRT && this.timerRT[sock.id]) {
      // "on the tick": the contact lands in the first 0.9 s of an open window (a plug released up to 0.8 s early gets there too)
      const tm = sock.timer;
      const onTick = (((this.timerClock() - tm.phase) % tm.period) + tm.period) % tm.period < 0.9;
      prt.tickSeat = onTick;
      if (onTick) {
        A().chime(1 + this.timerRT[sock.id].idx * 2, 0.03, this.pan(sock.x)); // you played this socket's note
        Fx.sparkle(sock.x, sock.y, '#d7ffe0', 8);
        Fx.caption('on the tick', sock.x, sock.y - 30, '#d7ffe0');
        if (!this.phraseDone && this.L.plugs.every((q) => this.st.seat[q.id] && this.plugRT[q.id].tickSeat)) {
          this.phraseDone = true; // every plug went home on its own beat: the room rings a rising phrase
          this.L.plugs.forEach((q, i) => setTimeout(() => A().chime(2 + i * 2, 0, this.pan(this.L.socketsById[this.st.seat[q.id]].x)), 220 + i * 140));
          Fx.caption('in tune', 180, this.L.strips[0].y - 54, '#fff1b8');
        }
      }
    }
    const power = g && g.power !== undefined ? g.power : 0.75;
    const crisp = g && g.crisp !== undefined ? g.crisp : 0.5;
    const k = 0.55 + 0.45 * power;
    A().sfx.thunk(fat ? 1 : 0, { power, crisp, mat: this.world.mat, pan: this.pan(sock.x) });
    H().pulse(fat ? 'seatFat' : 'seat', 0.6 + 0.6 * power);
    Fx.hitstop((fat ? T.hitstopFat : T.hitstopSlim) * (0.45 + 0.55 * power));
    const amp = (fat ? T.shakeFat : T.shakeSlim) * k;
    Fx.kick(-sock.fx * amp * 1.4, -sock.fy * amp * 1.4);
    const col = prt.plug.key === 'any' ? '#fff0c8' : Art.KEYCOL[prt.plug.key];
    Fx.ring(sock.x, sock.y, T.rippleR * (fat ? 1.7 : 1) * (0.8 + 0.3 * power), col, 0.34, 2.2);
    Fx.sparks(sock.x, sock.y, col, Math.round((T.sparkN + (fat ? 4 : 0)) * (0.5 + 0.5 * power)), sock.fx, sock.fy, 2.6);
    srt.squash.x = T.squash * (fat ? 1.7 : 1) * k;
    srt.ledFlick = 1;
    prt.rim = 1;
    prt.sq.x = 1 - 0.06 * k;
    prt.sq.t = 1;
    prt.wobV = (fat ? 3 : 4) * k;
    // the neighbours shiver, fading with distance along the strip
    for (const q of this.plugList) {
      if (q === prt || !q.seatSock) continue;
      const qs = this.L.socketsById[q.seatSock];
      if (qs.strip !== sock.strip) continue;
      const dd = Math.abs(qs.slot - sock.slot);
      q.wobV += (fat ? 3 : 4) * k * 0.7 / (1 + dd * 1.2);
      const qr = q.rope;
      for (let i = qr.n - 5; i < qr.n - 1; i++) {
        qr.x[i] += (Math.random() - 0.5) * 0.9 / (1 + dd);
        qr.y[i] += (Math.random() - 0.5) * 0.9 / (1 + dd);
      }
    }
    this.seatCount++;
    if (g && g.fromSock !== sock.id) this.pushUndo({ plug: prt.id, fromSock: g.fromSock, fromPos: g.fromPos, toSock: sock.id });
    this.updateCover();
    // hard refresh so the cable carries power after the thunk
    this.refreshPower();
    // the wobble travels down the cable
    const r = prt.rope;
    for (let i = r.n - 6; i < r.n - 1; i++) {
      r.x[i] += (Math.random() - 0.5) * 1.4;
      r.y[i] += (Math.random() - 0.5) * 1.4;
    }
    this.checkScript();
    this.idle = 0;
    // seated but not through its hoops: say so, once, and blink the hoops it still needs
    if (this.gateRT && prt.plug.device.via.length && !prt.plug.device.via.every((g) => this.st.thread[prt.id][g.id])) {
      this.gateNeeds(prt);
      if (!prt.thruSaid) {
        prt.thruSaid = true;
        Fx.caption('through!', prt.dev.dev.x, prt.dev.dev.y - prt.dev.dev.meta.h / 2 - 8, '#ffe9b8');
      }
    }
    this.onEvent('seat', prt);
  };

  Room.prototype.refuse = function (prt, near, g) {
    const s = near.sock;
    this.refuseCount = (this.refuseCount || 0) + 1; // every turned-away plug is counted (Act 5: a secret for finding the board without one)
    if (near.why === 'locked') Fx.caption('locked', s.x, s.y - 30, '#ffd0c0'); // Act 5, Dollhouse: a locked socket says so
    if (near.why === 'closed') this.hatchBounced = true; // a hatch turned away a plug: the docking secret needs none
    prt.state = 'refused';
    prt.hover = null;
    const dx = prt.x - s.x,
      dy = prt.y - s.y;
    let d = Math.hypot(dx, dy);
    let ax = dx / (d || 1),
      ay = dy / (d || 1);
    if (d < 4) {
      ax = s.fx;
      ay = s.fy;
    }
    prt.anim = { type: 'refuse', t: 0, dur: T.refuseMs / 1000, from: { x: prt.x, y: prt.y, scale: prt.scale, lift: prt.lift, nose: prt.noseDisp }, ax, ay, sock: s, why: near.why, info: near.info, knocked: false, g };
    prt.rope.pin(prt.x, prt.y, 0, -1);
    prt.rope.mode = 2;
    prt.rope.exitX = -Math.cos(prt.noseDisp);
    prt.rope.exitY = -Math.sin(prt.noseDisp);
  };
  Room.prototype.onRefuseKnock = function (prt) {
    const a = prt.anim,
      s = a.sock;
    const srt = this.stripRT[s.strip.id];
    if (a.why === 'cat') {
      A().at(this.pan(s.x), () => A().sfx.cat());
      Fx.caption('(cat)', s.x, s.y - 26, '#fff7dc');
    } else if (a.why === 'closed') {
      // not yet: a soft tick and a ring that shows when it will open (no zap, no punishment)
      A().at(this.pan(s.x), () => A().sfx.tick());
      Fx.caption('not yet', s.x, s.y - 26, '#d7ffe0');
      const tr = this.timerRT && this.timerRT[s.id];
      if (tr) tr.flash = 1;
    } else if (a.why === 'tripped') {
      A().at(this.pan(s.x), () => A().sfx.knock());
      Fx.caption('resetting…', s.x, s.y - 26, '#ffe0c0');
    } else if (a.why === 'wet') {
      // water and electricity: a splash, a zzt, and a look at whoever could dry it
      A().at(this.pan(s.x), () => {
        A().sfx.splash();
        A().sfx.zap();
      });
      Fx.sparks(s.x, s.y, '#bfe9ff', 8, s.fx, s.fy, 2.8);
      Fx.caption('zzt!', s.x, s.y - 26, '#bfe9ff');
      const wr = this.wetRT && this.wetRT[s.id];
      if (wr && wr.by) this.devRT[wr.by.id].delight = 0.5;
    } else if (a.why === 'frayed') {
      // copper and a blue spark: and a nudge toward the roll of tape
      A().at(this.pan(s.x), () => A().sfx.zap());
      Fx.sparks(s.x, s.y, '#bfe0ff', 6, s.fx, s.fy, 2.6);
      Fx.caption('zzt', s.x, s.y - 26, '#bfe0ff');
      if (this.tape) this.tape.hint = 1;
    } else if (a.why === 'dead') {
      A().at(this.pan(s.x), () => A().sfx.zap());
      Fx.sparks(s.x, s.y, '#bfe0ff', 5, s.fx, s.fy, 2.6);
      Fx.smoke(s.x, s.y);
      srt.ember[s.id] = 0.6;
      Fx.caption('zzt', s.x, s.y - 26, '#bfe0ff');
    } else A().at(this.pan(s.x), () => A().sfx.knock());
    H().pulse('refuse');
    srt.flash[s.id] = 1;
    if (a.why === 'overlap' || a.why === 'covered' || a.why === 'taken') {
      // draw the reason: the brick's footprint lights up over the covered sockets
      const fp = a.info && a.info.slots ? a.info.slots : [];
      for (const k of fp) {
        const sock = s.strip.sockets[k - 1];
        if (sock) srt.fpFlash[sock.id] = 1;
      }
      if (prt.fat) {
        for (const k of Rules.footprint(prt.plug, s)) srt.fpFlash[s.strip.sockets[k - 1].id] = 1;
      }
    }
    prt.dev.wince = 0.45;
    prt.dev.face.squint = 1;
    Fx.kick(0.6 * a.ax, 0.6 * a.ay);
    this.stripRT[s.strip.id].squash.x = T.squash * 0.4;
  };

  // generic kinematic hop (undo, the Power Cut): from the current pose to (x, y) with an arc
  Room.prototype.hopTo = function (prt, x, y, dur, delay, after) {
    prt.state = 'hop';
    prt.hover = null;
    if (prt.seatSock) {
      this.st.seat[prt.id] = null;
      prt.seatSock = null;
    }
    prt.anim = { type: 'hop', t: -(delay || 0), dur: dur || 0.34, from: { x: prt.x, y: prt.y, nose: prt.noseDisp, scale: prt.scale, lift: prt.lift }, to: { x, y }, after, spin: (Math.random() - 0.5) * 0.9 };
    prt.rope.mode = 2;
    prt.rope.pinX = prt.x;
    prt.rope.pinY = prt.y;
    prt.rope.exitX = -Math.cos(prt.noseDisp);
    prt.rope.exitY = -Math.sin(prt.noseDisp);
    prt.ins = 0;
    this.updateCover();
  };

  Room.prototype.flipSwitch = function (strip) {
    const rt = this.stripRT[strip.id];
    this.st.sw[strip.id] = !this.st.sw[strip.id];
    const on = this.st.sw[strip.id];
    rt.swS.t = on ? 1 : 0;
    rt.swHint = 0;
    A().sfx.click();
    H().pulse('switch');
    Fx.kick(0, 0.5);
    this.idle = 0;
    this.cancelHint();
    const b = Rules.stripBounds(strip);
    const xs = Rules.switchX(strip);
    const ca = Math.cos(strip.angle),
      sa = Math.sin(strip.angle);
    Fx.sparks(strip.x + xs * ca, strip.y + xs * sa, on ? '#9ff0b8' : '#ffb27a', 6, 0, -1, 3);
    this.refreshPower({ switch: strip });
  };

  Room.prototype.switchAt = function (x, y) {
    for (const s of this.L.strips) {
      if (!s.hasSwitch) continue;
      const xs = Rules.switchX(s);
      const ca = Math.cos(s.angle),
        sa = Math.sin(s.angle);
      const cx = s.x + xs * ca,
        cy = s.y + xs * sa;
      if (Math.hypot(x - cx, y - cy) < 30) return s;
    }
    return null;
  };

  /* ---------------------------------------------------------------- the Power Cut (Level 8) */
  Room.prototype.checkScript = function () {
    const sc = this.def.script;
    if (!sc || this.scriptFired || sc.type !== 'burnout') return;
    let n = 0;
    for (const id in this.st.seat) {
      const sid = this.st.seat[id];
      if (sid && sid.indexOf(sc.strip + '.') === 0) n++;
    }
    if (n >= sc.at) {
      this.scriptFired = true;
      this.later(0.34, () => this.burnout());
      this.locked = true;
      this.phase = 'cut';
      const srt = this.stripRT[sc.strip];
      srt.ledFlick = 1;
      srt.redLed = 1;
      A().sfx.twang();
      Fx.kick(0.4, 0.4);
    }
  };
  Room.prototype.burnout = function () {
    const sc = this.def.script;
    const srt = this.stripRT[sc.strip];
    this.flash = 1;
    this.blackout = 1;
    this.blackoutT = 1.15;
    A().sfx.zap();
    A().sfx.thud(1);
    H().pulse('cut');
    Fx.kick(0, 4.2);
    for (const id of sc.deadAfter) {
      this.st.dead[id] = true;
      srt.dead[id] = true;
      srt.ember[id] = 1;
      const s = this.L.socketsById[id];
      for (let i = 0; i < 8; i++) Fx.smoke(s.x, s.y);
      Fx.sparks(s.x, s.y, '#ffd9a0', 14, s.fx, s.fy, 3.4);
      Fx.ring(s.x, s.y, 54, '#ffd9a0', 0.5, 2.5);
    }
    // everything pops out and the devices drop to standby glimmers
    let k = 0;
    for (const prt of this.plugList) {
      if (prt.seatSock) {
        const dev = prt.plug.device;
        this.hopTo(prt, dev.rest.x, dev.rest.y, 0.42, 0.05 * k++, () => {});
        A().sfx.pop();
      }
    }
    for (const d of this.L.devices) {
      const rt = this.devRT[d.id];
      if (rt.p === 'on' || rt.p === 'waking') this.sleep(rt);
      rt.p = 'off';
    }
    A().pad.clear();
    this.awakeCount = 0;
    this.awakeFrac = 0;
    A().ambient.setAwake(0);
    this.updateCover();
    this.refreshPower();
    this.later(1.35, () => {
      // the lights come back, a half-step low, and a cat's tail swishes in
      A().chime(0);
      this.decorRT.forEach((r, i) => {
        if (r.hidden) {
          r.hidden = false;
          r.appear = 0;
        }
      });
      this.onEvent('cutEnd');
    });
    this.later(2.1, () => {
      this.locked = false;
      this.phase = 'playing';
      this.undo.length = 0;
      this.seatCount = 0;
    });
  };

  /* ---------------------------------------------------------------- crossings */
  Room.prototype.updateCross = function () {
    const lines = [],
      owner = [];
    for (const p of this.plugList)
      for (const r of p.rope.twin ? [p.rope, p.rope.twin] : [p.rope]) {
        const out = [];
        for (let i = 0; i < r.n; i += 2) out.push({ x: r.x[i], y: r.y[i] });
        out.push({ x: r.x[r.n - 1], y: r.y[r.n - 1] });
        lines.push(out);
        owner.push(p.id);
      }
    const hits = [];
    for (let i = 0; i < lines.length; i++)
      for (let j = i + 1; j < lines.length; j++) if (owner[i] !== owner[j]) Geom.polyCross(lines[i], lines[j], hits);
    const stable = [];
    for (const h of hits) if (this.crossRaw.some((p) => Math.hypot(p.x - h.x, p.y - h.y) < 14)) stable.push(h);
    this.crossRaw = hits;
    this.crossHits = stable;
  };

  /* ---------------------------------------------------------------- win sequence */
  Room.prototype.checkWin = function (dt) {
    if (this.phase !== 'playing' || this.title || this.toy) return;
    if (this.pulses.length) {
      this.winStable = 0;
      return;
    }
    const noCross = this.def.rules && this.def.rules.noCross;
    if (Rules.complete(this.L, this.st, noCross ? this.crossHits.length : 0)) {
      this.winStable += dt;
      if (this.winStable > 0.18) this.startWake();
    } else this.winStable = 0;
  };

  Room.prototype.startWake = function () {
    this.phase = 'waking';
    this.completed = true;
    if (this.pendRT) this.pendulumWake(); // the high-five at the top of the next swing
    if (this.def.lanes) this.lanesWakeCheck(); // Act 4, Lanes: the golden clip, if every clip was threaded once
    if (this.def.rivers) this.riversOn = true; // Act 4, The Server Hall: the light rivers run along the laid cables
    this.st.flags.latched = true; // a dynamo strip stays powered once the room has been won (the train takes its victory lap)
    const L = this.L,
      def = this.def;
    const tidy = this.crossHits.length === 0;
    const clean = this.seatCount <= (def.par || L.plugs.length);
    this.stars = { lit: true, tidy, clean };
    if (this.ghostRT) this.ghostWake(); // Act 5, Ghost Cables: this run's cables are the next run's ghosts
    if (this.duetRT) this.duetWake(); // Act 5, Duet: the ghost's seat and the thumb's seat, within a second
    if (this.def.skyline) this.skylineWake(); // Act 5, Blackout: the house sings, and the credits cable runs through the lit windows
    if (def.secret && def.secret.on === 'crackless' && this.mirrorRT && !this.mirrorRT.crack && !this.secretFound) {
      // Act 5, Mirror, Mirror: every pair seated, and the glass never cracked: the golden crescent
      this.secretFound = true;
      this.later(0.9, () => this.onEvent('secret', def.secret));
    }
    if (def.secret && def.secret.on === 'rewound' && this.reelWoundBack && !this.secretFound) {
      // Act 5, Rewind: a cable wound all the way back to its drum before the wake: the golden hook
      this.secretFound = true;
      this.later(0.9, () => this.onEvent('secret', def.secret));
    }
    if (def.secret && def.secret.on === 'unbroken' && this.craneRT && !this.craneRT.drops && !this.secretFound) {
      // Act 5, Crane Game: every prize lifted and laid in the tray, with no drop outside it: the golden hook
      this.secretFound = true;
      this.later(0.9, () => this.onEvent('secret', def.secret));
    }
    if (def.secret && def.secret.on === 'nofail' && !this.refuseCount && !this.secretFound) {
      // Act 5, Torchlight: every socket found by the light, and no plug turned away: the golden tumbler
      this.secretFound = true;
      this.later(0.9, () => this.onEvent('secret', def.secret));
    }
    if (def.secret && def.secret.on === 'tidy' && tidy && !this.secretFound) {
      // Act 4, Patch Panel: every cord patched with no cord crossing another: the golden jack
      this.secretFound = true;
      this.later(0.9, () => this.onEvent('secret', def.secret));
    }
    if (def.secret && def.secret.on === 'docking' && !this.hatchBounced && !this.secretFound) {
      this.secretFound = true; // all the hatches docked in their windows: no plug was turned away
      this.later(0.9, () => this.onEvent('secret', def.secret));
    }
    this.cancelHint();
    if (this.blockRT) this.blocksWake();
    if (this.seqRT) this.seqWake();
    if (this.bassRT) this.bassWake();
    if (this.def.boss) this.bossWake();
    if (this.magnetRT) this.magnetWakeCheck();
    if (this.orbitRT) this.orbitalWakeCheck();
    const T0 = this.chainRT ? this.chainWake() : 0; // Tick counts the band in: one, two, three, four
    A().ambient.duck(-3, 1.4);
    const devs = L.devices.slice().sort((a, b) => a.x - b.x);
    const n = devs.length;
    devs.forEach((d, i) => {
      this.later(T0 + 0.18 + i * 0.14, () => {
        const rt = this.devRT[d.id];
        rt.delight = 1;
        rt.hopS.kick(2.2);
        A().chime(Math.min(i + 3, 11));
        Fx.sparkle(d.x, d.y, '#fff6d8', 8);
      });
    });
    if (this.gateRT)
      L.gates
        .slice()
        .sort((a, b) => a.x - b.x)
        .forEach((g, i) =>
          this.later(0.1 + i * 0.12, () => {
            this.gateRT[g.id].pop = 1;
            this.gateRT[g.id].target = 1;
            A().at(this.pan(g.x), () => A().glass(i + 2));
          })
        );
    const tEnd = T0 + 0.18 + n * 0.14 + 0.12;
    this.later(tEnd, () => {
      A().win(n);
      H().pulse('win');
      Fx.breathe();
      Fx.kick(0, 0.8);
      this.decorLitT = 1;
      for (const prt of this.plugList) {
        const r = prt.rope;
        for (let i = 4; i < r.n - 2; i += 4) Fx.confetti(r.x[i], r.y[i], '#ffd36b', (Math.random() - 0.5) * 40, -20 - Math.random() * 30);
      }
      this.onEvent('wake-bloom');
    });
    let waited = 0;
    const judge = () => {
      // a train is still pulling into its station: its cables only settle once it stands (never judge a moving strip)
      if (this.carryHold && this.carryHold() && waited < 16) {
        waited += 0.25;
        this.later(0.25, judge);
        return;
      }
      // the seated cables have glided into their arcs by now: judge Tidy on what the player can see
      this.updateCross();
      this.updateCross();
      this.stars.tidy = this.crossHits.length === 0;
      this.onEvent('stars', this.stars);
    };
    this.later(tEnd + 0.55, judge);
    this.later(tEnd + 1.15, () => {
      this.phase = 'settling';
      this.onEvent('settle');
      if (this.finale) this.finale.reveal();
    });
    this.onEvent('win');
  };

  /* ---------------------------------------------------------------- hints */
  Room.prototype.cancelHint = function () {
    this.hint = null;
  };
  Room.prototype.showHint = function (kind) {
    const act = Rules.hint(this.L, this.st);
    if (!act) return false;
    const L = this.L;
    let path = null,
      tap = null,
      poly = null,
      seq = null;
    const off = { x: -T.offX, y: -T.offY };
    if (act.type === 'seat') {
      const prt = this.plugRT[act.plug],
        s = L.socketsById[act.socket];
      path = [
        { x: prt.x, y: prt.y },
        { x: (prt.x + s.x) / 2 + (s.y - prt.y) * 0.12, y: (prt.y + s.y) / 2 - (s.x - prt.x) * 0.12 },
        { x: s.x + s.fx * T.slideU, y: s.y + s.fy * T.slideU },
      ];
      if (prt.plug.device.via.length) {
        // the hand shows the whole route: through every hoop, then home
        poly = Rules.routeVia(L, { x: prt.x, y: prt.y }, act.plug, act.socket, { x: s.x + s.fx * T.slideU, y: s.y + s.fy * T.slideU }, this.st);
        path = null;
      }
    } else if (act.type === 'unseat') {
      const prt = this.plugRT[act.plug],
        s = L.socketsById[act.from];
      path = [
        { x: s.x, y: s.y },
        { x: s.x + s.fx * 40, y: s.y + s.fy * 40 },
        { x: s.x + s.fx * 80 + 24, y: s.y + s.fy * 80 },
      ];
    } else if (act.type === 'switch') {
      const strip = L.stripsById[act.strip];
      const xs = Rules.switchX(strip);
      const ca = Math.cos(strip.angle),
        sa = Math.sin(strip.angle);
      tap = { x: strip.x + xs * ca, y: strip.y + xs * sa };
    } else if (act.type === 'mend') {
      poly = this.tapeHintPoly(L.socketsById[act.socket]);
      off.x = 0;
      off.y = 0;
    } else if (act.type === 'lure') {
      // the hand presses the floor beside her and leads the light to the far corner
      const f = act.from || { x: 180, y: 400 },
        to = act.to;
      const dx = to.x - f.x,
        dy = to.y - f.y,
        n = Math.hypot(dx, dy) || 1;
      const a = { x: f.x + (dx / n) * 40, y: f.y + (dy / n) * 40 };
      poly = [a, { x: (a.x + to.x) / 2 + dy * 0.06, y: (a.y + to.y) / 2 - dx * 0.06 }, { x: to.x, y: to.y }];
      path = null;
      off.x = 0;
      off.y = 0;
    } else if (act.type === 'draw') {
      // the hand takes hold of the carrier and traces its road
      poly = act.pts.slice();
      path = null;
      off.x = 0;
      off.y = 0;
    } else if (act.type === 'pet' && this.sleeper) {
      tap = { x: this.sleeper.x, y: this.sleeper.y };
      off.x = 0;
      off.y = 0;
    } else if (act.type === 'magnet') {
      // a tap on the crane's head: the magnet switches (Act 5, Crane Game)
      tap = { x: act.at.x, y: act.at.y };
      off.x = 0;
      off.y = 0;
    } else if (act.type === 'points' || act.type === 'lever') {
      // a tap on the points, or on the signal lever
      const TK = L.carried[0].carrier.track;
      tap = { x: TK[act.type].x, y: TK[act.type].y };
      off.x = 0;
      off.y = 0;
    } else if (act.type === 'wind' && this.windHintSeq) {
      // the hand aims the toy (a drag along the heading), then circles its brass key for the clicks it needs
      seq = this.windHintSeq(act);
      off.x = 0;
      off.y = 0;
    } else if (act.type === 'block' && this.blockHintPath) {
      // the hand takes hold of the block and carries it along its route to where it should stand
      poly = this.blockHintPath(act);
      path = null;
      off.x = 0;
      off.y = 0;
    } else if (act.type === 'lock' && this.bassLockPoly) {
      // the hand walks a quarter turn round the collar of a plug that is seated but not yet locked
      poly = this.bassLockPoly(act);
      path = null;
      off.x = 0;
      off.y = 0;
    } else if (act.type === 'wait') {
      // nothing to do but watch: say so, over whatever is moving
      const st = act.strip && L.stripsById[act.strip];
      Fx.caption('wait for it...', st ? st.x : 180, st ? st.y - 48 : 300, '#fff4c8');
      this.hint = null;
      return true;
    } else if (act.type === 'slide') {
      // the hand takes hold of the strip's end grip and drags it along the rail to the detent it should rest at
      const strip = L.stripsById[act.strip],
        R = strip.rail;
      const tk = R.detents[act.to];
      const dx = (R.x1 - R.x0) * (tk - strip.k),
        dy = (R.y1 - R.y0) * (tk - strip.k);
      const gx = strip.x - (strip.n * strip.pitch) / 2 - 9,
        gy = strip.y;
      path = [
        { x: gx, y: gy },
        { x: gx + dx / 2, y: gy + dy / 2 - 8 },
        { x: gx + dx, y: gy + dy },
      ];
      off.x = 0;
      off.y = 0;
    }
    this.hint = { act, path, poly, tap, seq, t: 0, loops: 0, off, plug: act.plug };
    if (this.seqRT) this.seqHint(act);
    if (act.type === 'switch') this.stripRT[act.strip].swHint = 1;
    return true;
  };

  /* ---------------------------------------------------------------- update */
  Room.prototype.faceTargets = function (rt, dt) {
    const f = rt.face;
    const on = rt.p === 'on';
    let eo = on ? 1 : 0,
      smile = on ? 0.35 : 0,
      brow = 0,
      squint = 0,
      sweat = 0,
      open = 0,
      blush = 0;
    const prt = this.plugRT[rt.dev.plug.id];
    // attention to the plug being carried
    let lx = 0,
      ly = 0;
    if (prt && prt.grab) {
      const dx = prt.x - rt.dev.x,
        dy = prt.y - rt.dev.y;
      lx = U.clamp(dx / 70, -1, 1);
      ly = U.clamp(dy / 70, -1, 1);
      if (!on) eo = prt.grab.detent && !prt.grab.popped ? 0.3 : 0.9;
      brow = 0.5;
      if (prt.state === 'held' && prt.rope.strain > 0.55) {
        squint = 1;
        sweat = 1;
        brow = -1;
      }
    } else if (on) {
      rt.glanceT -= dt;
      if (rt.glanceT <= 0) {
        rt.glanceT = 3 + Math.random() * 5;
        rt.glanceX = (Math.random() - 0.5) * 1.6;
        rt.glanceY = (Math.random() - 0.5) * 1.0;
      }
      lx = rt.glanceX;
      ly = rt.glanceY;
    }
    if (rt.wince > 0) {
      rt.wince -= dt;
      squint = 1;
      brow = -0.6;
    }
    // a sliding strip pulling on this device's seated cable
    if (prt && prt.railStrain > 0.5) {
      squint = 1;
      sweat = 1;
      brow = -1;
    }
    if (rt.delight > 0) {
      rt.delight = Math.max(0, rt.delight - dt * 0.35);
      if (rt.delight > 0.05) {
        eo = 0.05;
        smile = 1;
        blush = 1;
      }
    }
    if (rt.poke > 0) {
      rt.poke = Math.max(0, rt.poke - dt * 1.8);
      smile = 1;
      eo = rt.poke > 0.5 ? 0.9 : 0.1;
      blush = 0.8;
    }
    if (rt.wake >= 0 && rt.wake < 0.5 && on) {
      // eyes pop wide as the screen blooms
      eo = rt.wake < 0.14 ? U.ease.outBack(sat(rt.wake / 0.14), 3) * 1.15 : 1;
      smile = 0.5;
    }
    // occasional yawn for tablets
    if (rt.dev.type === 'tablet' && rt.wake >= 0 && rt.wake < 1.2 && on) open = Math.sin(Math.PI * sat(rt.wake / 1.2)) * 1.1;
    const k = 0.07;
    f.eyeOpen = U.damp(f.eyeOpen, eo, k, dt);
    f.smile = U.damp(f.smile, smile, k, dt);
    f.brow = U.damp(f.brow, brow, k, dt);
    f.squint = squint ? 1 : U.damp(f.squint, 0, 0.05, dt);
    f.sweat = U.damp(f.sweat, sweat, 0.08, dt);
    f.open = U.damp(f.open, open, 0.08, dt);
    f.blush = U.damp(f.blush, blush, 0.12, dt);
    f.lookX = U.damp(f.lookX, lx, 0.07, dt);
    f.lookY = U.damp(f.lookY, ly, 0.07, dt);
    // blinking
    if (f.eyeOpen > 0.6) {
      rt.blinkT -= dt;
      if (rt.blinkT <= 0) {
        rt.blinkP = 0;
        rt.blinkT = 3 + Math.random() * 3.5;
      }
    }
    if (rt.blinkP >= 0) {
      rt.blinkP += dt / 0.14;
      f.blink = rt.blinkP < 1 ? 1 - Math.abs(rt.blinkP * 2 - 1) : 0;
      if (rt.blinkP >= 1) rt.blinkP = -1;
    } else f.blink = 0;
  };

  Room.prototype.update = function (dt, simDt) {
    this.t += dt;
    // scheduled callbacks (real time)
    for (let i = this.queue.length - 1; i >= 0; i--) {
      const q = this.queue[i];
      if (this.t >= q.t) {
        this.queue.splice(i, 1);
        q.fn();
      }
    }
    if (this.phase === 'arriving' && this.t > 0.5 + this.L.devices.length * 0.02) this.phase = 'playing';
    this.idle += dt;
    const L = this.L;
    const sdt = simDt;

    /* ---- plug logic ---- */
    let maxSpeed = 0,
      heldAny = false;
    for (const prt of this.plugList) {
      const rope = prt.rope;
      // lift / scale springs
      const tgtLift = prt.state === 'held' ? 1 : prt.state === 'seating' ? prt.lift : 0;
      if (prt.state === 'held') prt.lift = U.damp(prt.lift, 1, T.liftMs / 1000 / 2.2, dt);
      else if (prt.state === 'rest') prt.lift = U.damp(prt.lift, 0, 0.07, dt);
      prt.wobV += (-prt.wob * 420 - prt.wobV * 14) * dt;
      prt.wob += prt.wobV * dt;
      prt.rim = Math.max(0, prt.rim - dt * 1.6);
      prt.sq.step(dt);
      prt.strumCd = Math.max(0, prt.strumCd - dt);
      prt.tockCd = Math.max(0, prt.tockCd - dt);
      rope.advanceVib(dt);
      prt.vAvg = U.damp(prt.vAvg, prt.state === 'held' ? rope.speed : 0, 0.05, dt);

      if (prt.state === 'held') {
        heldAny = true;
        const g = prt.grab;
        g.t += dt;
        if (g.detent && !g.popped) {
          // seated plug resists, then pops
          const moved = Math.hypot(g.fx - g.sx, g.fy - g.sy);
          if (moved > T.detent) this.unseatNow(prt, g);
        }
      }
      if (prt.state === 'seated' && prt.grab && prt.grab.detent && !prt.grab.popped) {
        const g = prt.grab;
        g.t += dt;
        const moved = Math.hypot(g.fx - g.sx, g.fy - g.sy);
        // a hair of resistance feel: the plug leans toward the finger while still seated
        prt.wobV += ((g.fx - g.sx) * 0.02) * 0;
        const collar = this.bassRT && this.bassGrip(prt, g); // on a lock level the collar governs a seated plug: a twist, or a refused pull
        if (!collar && moved > T.detent) this.unseatNow(prt, g);
      }
      if (prt.state === 'held' && prt.grab && !(prt.grab.detent && !prt.grab.popped)) {
        const g = prt.grab;
        const ease = U.ease.outCubic(sat(g.t / T.offEase));
        let tx = g.fx + T.offX * ease,
          ty = g.fy + T.offY * ease;
        tx = U.clamp(tx, 10, 350);
        ty = U.clamp(ty, 30, 615);
        prt.aimX = tx;
        prt.aimY = ty;
        const cand = this.findCandidate(prt);
        if (cand) {
          const s = cand.sock;
          if (prt.hover !== s.id) {
            prt.hover = s.id;
            A().sfx.magnet();
            H().pulse('magnet');
          }
          const pre = { x: s.x + s.fx * T.slideU, y: s.y + s.fy * T.slideU };
          const w = T.pullMax * U.smoothstep(T.engageR, 18, cand.d);
          tx = U.lerp(tx, pre.x, w);
          ty = U.lerp(ty, pre.y, w);
          prt.hoverW = w;
          prt.hoverNose = Math.atan2(-s.fy, -s.fx);
        } else {
          prt.hover = null;
          prt.hoverW = U.damp(prt.hoverW, 0, 0.06, dt);
        }
        if (this.gateRT && !prt.hover) [tx, ty] = this.gateFunnel(prt, tx, ty);
        rope.hold(tx, ty, prt.fat ? T.tauFat : T.tauSlim, prt.fat ? T.vmaxFat : T.vmaxSlim);
      }

      if (prt.anim) this.advanceAnim(prt, dt);
    }

    /* ---- kinematic strips (rails) move before the ropes step, so seated cables trail them ---- */
    if (this.railRT) this.railUpdate(sdt);
    if (this.pendRT) this.pendulumUpdate(sdt); // a swinging carriage: its sockets are where the swing puts them before the cables step

    /* ---- rope physics at a fixed step ---- */
    this.acc += sdt;
    let steps = 0;
    for (const prt of this.plugList) if (prt.rope.twin) this.syncTwin(prt);
    while (this.acc >= STEP && steps < 8) {
      for (const prt of this.plugList) {
        prt.rope.step(STEP, this.obsFor(prt));
        if (prt.rope.twin) {
          prt.rope.twin.step(STEP, this.obsFor(prt));
          this.coupleTwin(prt);
        }
      }
      this.acc -= STEP;
      steps++;
    }
    if (steps === 8) this.acc = 0;
    if (this.def.wind && this.def.wind.catch) this.fanCatch(); // Act 5, Fan Mail: a plug the gust carries onto a socket is caught
    if (this.torchRT) this.torchSeeAll(); // Act 5, Torchlight: whatever the pool touches is seen
    if (this.craneRT) this.craneUpdate(); // Act 5, Crane Game: the head and the prizes, read by the rules
    if (this.dollRT) this.dollUpdate(dt); // Act 5, Dollhouse: the big room's locks open when the miniature is whole
    if (this.brownRT) this.brownoutUpdate(dt); // Act 5, Brownout: the lights go out, and come back
    if (this.reelRT) this.reelSync(); // Act 5, Rewind: the reels' lengths, read by the hints
    if (this.duetRT) this.duetUpdate(dt); // Act 5, Duet: the ghost hand plays its recorded path
    if (this.ghostRT) this.ghostUpdate(); // Act 5, Ghost Cables: a plug that seats while its cable is warm is counted

    /* ---- read back plug poses ---- */
    for (const prt of this.plugList) {
      const rope = prt.rope;
      prt.x = rope.plugX();
      prt.y = rope.plugY();
      if (prt.state === 'seated') {
        prt.x = prt.pose.x;
        prt.y = prt.pose.y;
        prt.nose = prt.pose.nose;
        prt.noseDisp = prt.nose;
      } else if (prt.state === 'seating' || prt.state === 'refused' || prt.state === 'hop') {
        prt.nose = prt.noseDisp;
      } else {
        const ropeNose = rope.plugAngle;
        let target = ropeNose;
        if (prt.hover) target = U.lerpAng(ropeNose, prt.hoverNose, sat(prt.hoverW / T.pullMax));
        prt.noseDisp = U.lerpAng(prt.noseDisp, target, 1 - Math.exp(-dt / (T.alignMs / 1000 / 2.2)));
        prt.nose = prt.noseDisp;
      }
      if (prt.state === 'held') {
        maxSpeed = Math.max(maxSpeed, rope.speed);
        // taut: the cable says no
        if (rope.strain > 0.6 && !prt.twanged) {
          prt.twanged = true;
          A().sfx.twang();
          Fx.caption('oof', prt.dev.dev.x, prt.dev.dev.y - prt.dev.dev.meta.h / 2 - 8, '#ffe3d0');
        } else if (rope.strain < 0.2) prt.twanged = false;
      }
      prt.scale = prt.state === 'held' ? 1 + T.liftScale * prt.lift : prt.state === 'seating' ? prt.scale : prt.sq.x;
      if (prt.state === 'rest') prt.scale = 1 + T.liftScale * prt.lift;
      // lean into the motion (the cable drags the tail): lateral velocity tilts the plug a few degrees
      if (dt > 0) {
        const vx = (prt.x - prt.px) / dt,
          vy = (prt.y - prt.py) / dt;
        const lat = -vx * Math.sin(prt.nose) + vy * Math.cos(prt.nose);
        const tl = prt.state === 'held' ? U.clamp(-lat * 0.00042, -0.2, 0.2) : 0;
        prt.lean = U.damp(prt.lean, tl, 0.07, dt);
      }
      prt.px = prt.x;
      prt.py = prt.y;
      // a cable that strikes an obstacle gives a soft tock
      const touching = rope.hitMax > 0.05;
      if (rope.hitMax > 0) {
        // only a fresh contact tocks (sliding along a book stays quiet)
        if (!prt.wasTouching && rope.hitMax > 0.6 && prt.tockCd <= 0 && (prt.state === 'held' || rope.speed > 120)) {
          prt.tockCd = 0.14;
          const pw = U.clamp(rope.hitMax / 3, 0.15, 1);
          A().sfx.tock(pw, this.pan(rope.hitX || prt.x));
          Fx.spawn(Fx.KIND.DUST, rope.hitX || prt.x, rope.hitY || prt.y, 0, 0, 0.35, 1.6, '#ffffff');
          H().pulse('tock', 0.5 + pw);
        }
        rope.hitMax = 0;
      }
      prt.wasTouching = touching;
    }
    // audio: cable rustle follows the carried cable
    const heavy = this.plugList.some((p) => p.state === 'held' && p.fat);
    this.rustleV = U.damp(this.rustleV, heldAny ? sat(maxSpeed / 1100) : 0, 0.05, dt);
    let maxStrain = 0;
    for (const p of this.plugList) {
      if (p.state === 'held') maxStrain = Math.max(maxStrain, p.rope.strain);
      if (p.railStrain) maxStrain = Math.max(maxStrain, p.railStrain);
    }
    A().rustle(this.rustleV, heavy, maxStrain);

    /* ---- strips and sockets ---- */
    for (const s of L.strips) {
      const rt = this.stripRT[s.id];
      rt.squash.step(dt);
      rt.sq = rt.squash.x;
      rt.swS.step(dt);
      rt.sw = rt.swS.x;
      rt.ledFlick = Math.max(0, rt.ledFlick - dt * 4);
      if (rt.wave !== undefined && rt.wave < 2) rt.wave += dt * 1.9;
      rt.swHint = rt.swHint > 0 ? rt.swHint : 0;
      for (const sock of s.sockets) {
        let target = 0;
        for (const prt of this.plugList) {
          if (prt.state !== 'held') continue;
          if (prt.hover === sock.id) target = 1;
          else if (target < 0.3) {
            const d = Math.hypot(prt.x - sock.x, prt.y - sock.y);
            if (d < 95 && Rules.canSeat(L, this.st, prt.id, sock.id).ok) target = Math.max(target, 0.3 * (1 - d / 95));
          }
        }
        rt.glow[sock.id] = U.damp(rt.glow[sock.id] || 0, target, target > (rt.glow[sock.id] || 0) ? 0.05 : 0.09, dt);
        if (rt.flash[sock.id] > 0) rt.flash[sock.id] = Math.max(0, rt.flash[sock.id] - dt * 3.2);
        if (rt.fpFlash[sock.id] > 0) rt.fpFlash[sock.id] = Math.max(0, rt.fpFlash[sock.id] - dt * 2.2);
        if (rt.ember[sock.id] > 0) rt.ember[sock.id] = Math.max(0, rt.ember[sock.id] - dt * 0.35);
      }
    }
    // brick footprint preview while carrying a fat plug over a socket
    for (const prt of this.plugList) {
      if (prt.state === 'held' && prt.fat && prt.hover) {
        const s = L.socketsById[prt.hover];
        const rt = this.stripRT[s.strip.id];
        for (const k of Rules.footprint(prt.plug, s)) {
          const sk = s.strip.sockets[k - 1];
          if (sk.id !== s.id) rt.fpFlash[sk.id] = Math.max(rt.fpFlash[sk.id] || 0, 0.5);
        }
      }
    }

    /* ---- pulses along cables ---- */
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const p = this.pulses[i];
      if (p.s < 0 && p.s + T.pulseSpeed * dt >= 0 && !p.started) {
        p.started = true;
        A().sfx.zip();
      } else if (p.s >= 0 && !p.started) {
        p.started = true;
        A().sfx.zip();
      }
      p.s += T.pulseSpeed * dt;
      if (p.s >= p.rope.len) {
        this.pulses.splice(i, 1);
        if (p.rt.p === 'waking') this.wake(p.rt);
      }
    }

    /* ---- devices ---- */
    for (const d of L.devices) {
      const rt = this.devRT[d.id];
      rt.hopS.step(dt);
      rt.hop = rt.hopS.x;
      if (rt.p === 'on') {
        rt.bloom = U.damp(rt.bloom, 1, 0.12, dt);
        if (rt.wake >= 0) rt.wake += dt;
        rt.batt = U.damp(rt.batt, 1, 0.22, dt);
      } else {
        rt.bloom = U.damp(rt.bloom, 0, 0.07, dt);
        if (rt.bloom < 0.01) rt.bloom = 0;
        rt.wake = -1;
        rt.batt = U.damp(rt.batt, 0, 0.1, dt);
      }
      rt.power = rt.bloom > 0.02 ? 'on' : rt.p === 'standby' ? 'standby' : 'off';
      rt.wig = U.damp(rt.wig, 0, 0.1, dt) + (rt.poke > 0 ? Math.sin(this.t * 40) * 0.05 * rt.poke : 0);
      // shiver when strained
      const prt = this.plugRT[d.plug.id];
      if (prt && ((prt.state === 'held' && prt.rope.strain > 0.6) || prt.railStrain > 0.6)) {
        rt.shx = (Math.random() - 0.5) * 0.9;
        rt.shy = (Math.random() - 0.5) * 0.9;
      } else {
        rt.shx = U.damp(rt.shx, 0, 0.04, dt);
        rt.shy = U.damp(rt.shy, 0, 0.04, dt);
      }
      this.faceTargets(rt, dt);
      // asleep: drifting z's
      if (rt.p !== 'on' && !this.title) {
        rt.zzzT -= dt;
        if (rt.zzzT <= 0) {
          rt.zzzT = 2.4 + Math.random();
          if (this.phase !== 'cut') Fx.zzz(d.x + d.meta.w * 0.3, d.y - d.meta.h * 0.35);
        }
      }
    }

    /* ---- decor ---- */
    const decor = this.def.decor || [];
    this.decorLit = U.damp(this.decorLit, this.decorLitT, 0.35, dt);
    for (let i = 0; i < decor.length; i++) {
      const d = decor[i],
        rt = this.decorRT[i];
      rt.poke = Math.max(0, rt.poke - dt * 1.4);
      if (!rt.hidden) rt.appear = Math.min(1, rt.appear + dt * 2.2);
      if (d.art === 'mug' && (d.steam || this.awakeFrac > 0.5)) {
        rt.steamT -= dt;
        if (rt.steamT <= 0) {
          rt.steamT = 0.3 + Math.random() * 0.2;
          if (this.awakeFrac > 0.15 || d.steam) Fx.steam(d.x, d.y - 4);
        }
      }
      if (d.art === 'outline') {
        // painted tool outlines on the pegboard light up one after another as the room wakes (a marquee)
        rt.lit = sat(this.decorLit * 1.35 - 0.13 * i);
      }
      if (d.art === 'lamp') {
        rt.lit = this.decorLit;
        // the decor lamp looks toward the carried plug
        const prt = this.plugList.find((p) => p.state === 'held');
        if (prt) {
          rt.lookX = U.damp(rt.lookX, U.clamp((prt.x - d.x) / 120, -1, 1), 0.1, dt);
          rt.lookY = U.damp(rt.lookY, U.clamp((prt.y - d.y) / 120, -1, 1), 0.1, dt);
        } else {
          rt.lookX = U.damp(rt.lookX, 0, 0.2, dt);
          rt.lookY = U.damp(rt.lookY, 0, 0.2, dt);
        }
      }
    }
    // dust motes in the lamp light once the room is awake
    if (this.awakeFrac > 0.6) {
      this.dustT -= dt;
      if (this.dustT <= 0) {
        this.dustT = 0.35;
        Fx.dust(40 + Math.random() * 280, 60 + Math.random() * 480);
      }
    }

    /* ---- room light ---- */
    this.awakeShown = U.damp(this.awakeShown, this.awakeFrac, 0.45, dt);
    if (this.blackoutT > 0) {
      this.blackoutT -= dt;
      if (this.blackoutT <= 0) this.blackout = 0;
    }
    this.flash = Math.max(0, this.flash - dt * 3.2);

    /* ---- Biscuit and the spot of light ---- */
    if (this.cat && this.def.herd) this.herdUpdate(dt);

    /* ---- carried strips (the snail) ---- */
    if (this.carryRT) this.carryUpdate(dt);

    /* ---- alphabet blocks ---- */
    if (this.blockRT) this.blocksUpdate(dt);

    /* ---- the beat along a strip (Level 26) ---- */
    if (this.chainRT) this.chainUpdate(dt);

    /* ---- the sequencer's loop (Levels 27, 29, 30) ---- */
    if (this.seqRT) this.seqUpdate(dt);
    if (this.bassRT) this.bassUpdate(dt);
    if (this.def.boss) this.bossUpdate(dt);
    if (this.world.zeroG) this.zeroGUpdate(dt);
    if (this.orbitRT) this.orbitalUpdate(dt);

    /* ---- the dark kitchen ---- */
    if (this.fridgeT > 0) this.fridgeT = Math.max(0, this.fridgeT - dt);
    if (this.dark) this.darkUpdate(dt);

    /* ---- timer sockets ---- */
    if (this.timerRT) this.timerUpdate(dt);

    /* ---- the breaker ---- */
    if (this.loadRT) this.breakerUpdate(dt);

    /* ---- puddles and the wind that dries them ---- */
    if (this.wetRT) this.wetUpdate(dt);

    /* ---- the roll of tape ---- */
    if (this.tape) this.tapeUpdate(dt);

    /* ---- hoops: which cables run through which gates ---- */
    if (this.gateRT) this.gateUpdate(dt);

    /* ---- crossings ---- */
    this.crossT -= dt;
    if (this.crossT <= 0) {
      this.crossT = 0.1;
      this.updateCross();
      const noCross = this.def.rules && this.def.rules.noCross;
      if (this.crossHits.length && (noCross || (this.def.tidy && !this.crossHinted && this.phase === 'playing'))) {
        const h = this.crossHits[0];
        if (!noCross) {
          this.crossHinted = true;
          Fx.caption('tidy?', h.x, h.y - 10, '#cfe8ff');
        }
        Fx.sparks(h.x, h.y, '#bfe3ff', noCross ? 3 : 5);
        if (noCross && Math.random() < 0.3) A().sfx.zap();
      }
    }

    /* ---- win, idle hints ---- */
    if (this.finale) this.finale.update(dt);
    this.checkWin(dt);
    if (this.hint) {
      this.hint.t += dt;
    }
    this.hintGlow = U.damp(this.hintGlow, this.idle > 45 && this.phase === 'playing' ? 1 : this.idle > 20 && this.phase === 'playing' ? 0.45 : 0, 0.4, dt);
    if (this.def.id === 1 && !this.autoHintDone && this.phase === 'playing' && this.idle > 2.5 && !this.hint) {
      this.autoHintDone = true;
      this.showHint();
    }
    if (this.def.id === 5 && this.phase === 'playing' && this.idle > 5 && !this.hint) {
      const act = Rules.hint(this.L, this.st);
      if (act && act.type === 'switch') this.showHint();
    }
    // a tidy hint hand for the nudge in the noCross level after a long stay
    if (this.def.rules && this.def.rules.noCross && this.phase === 'playing' && this.crossHits.length && this.idle > 14 && !this.hint) {
      this.idle = 6;
      this.showHint();
    }
    // the switch pulses when everything is plugged and waiting
    for (const s of L.strips) {
      if (!s.hasSwitch) continue;
      const rt = this.stripRT[s.id];
      const allSeated = L.plugs.every((p) => this.st.seat[p.id]);
      const waiting = allSeated && !this.st.sw[s.id] && this.phase === 'playing';
      rt.swHint = U.damp(rt.swHint, waiting ? 0.7 : this.hint && this.hint.act.type === 'switch' ? 1 : 0, 0.2, dt);
    }
  };

  /* ---------------------------------------------------------------- kinematic animations */
  Room.prototype.advanceAnim = function (prt, dt) {
    const a = prt.anim;
    a.t += dt;
    if (a.t < 0) return;
    if (a.type === 'seat') {
      const s = a.sock;
      const k = Math.min(1, a.t / a.dur);
      const pa = 0.64;
      const nose = Math.atan2(-s.fy, -s.fx);
      const pre = { x: s.x + s.fx * T.slideU, y: s.y + s.fy * T.slideU };
      let x, y, scale, lift, ins;
      if (k < pa) {
        const e = U.ease.outCubic(k / pa);
        x = U.lerp(a.from.x, pre.x, e);
        y = U.lerp(a.from.y, pre.y, e);
        prt.noseDisp = U.lerpAng(a.from.nose, nose, e);
        scale = U.lerp(a.from.scale, 1.06, e);
        lift = U.lerp(a.from.lift, 0.4, e);
        ins = 0;
      } else {
        const e = U.ease.inQuad((k - pa) / (1 - pa));
        x = U.lerp(pre.x, s.x, e);
        y = U.lerp(pre.y, s.y, e);
        prt.noseDisp = nose;
        scale = U.lerp(1.06, 0.96, e);
        lift = U.lerp(0.4, 0, e);
        ins = e;
      }
      prt.scale = scale;
      prt.lift = lift;
      prt.ins = ins;
      prt.rope.pin(x, y, s.fx, s.fy);
      prt.rope.x[prt.rope.n - 1] = x;
      prt.rope.y[prt.rope.n - 1] = y;
      if (k >= 1 && !a.contact) {
        a.contact = true;
        prt.state = 'seated';
        prt.pose = { x: s.x, y: s.y, nose };
        prt.ins = 1;
        prt.lift = 0;
        prt.rope.pin(s.x, s.y, s.fx, s.fy, true);
        this.onContact(prt);
        prt.anim = null;
      }
    } else if (a.type === 'refuse') {
      const k = Math.min(1, a.t / a.dur);
      const kt = 60 / (T.refuseMs || 240);
      let x, y, scale;
      if (k < kt) {
        const e = U.ease.outQuad(k / kt);
        x = a.from.x - a.ax * 5 * e;
        y = a.from.y - a.ay * 5 * e;
        scale = a.from.scale;
      } else {
        if (!a.knocked) {
          a.knocked = true;
          this.onRefuseKnock(prt);
        }
        const e = U.ease.outCubic((k - kt) / (1 - kt));
        const arc = Math.sin(Math.PI * e) * 10;
        x = a.from.x - a.ax * 5 + a.ax * T.hopU * e;
        y = a.from.y - a.ay * 5 + a.ay * T.hopU * e - arc * 0.4;
        scale = 1 + 0.1 * Math.sin(Math.PI * e);
        prt.noseDisp = a.from.nose + Math.sin(Math.PI * e) * 0.35;
      }
      prt.scale = scale;
      prt.lift = 0.5 * (1 - k);
      prt.rope.pinX = x;
      prt.rope.pinY = y;
      prt.rope.exitX = -Math.cos(prt.noseDisp);
      prt.rope.exitY = -Math.sin(prt.noseDisp);
      prt.rope.x[prt.rope.n - 1] = x;
      prt.rope.y[prt.rope.n - 1] = y;
      if (k >= 1) {
        prt.state = 'rest';
        prt.rope.release();
        prt.seatSock = null;
        this.st.seat[prt.id] = null;
        prt.anim = null;
        if (a.g && a.g.fromSock) this.pushUndo({ plug: prt.id, fromSock: a.g.fromSock, fromPos: a.g.fromPos, toSock: null });
        this.updateCover();
      }
    } else if (a.type === 'hop') {
      const k = Math.min(1, a.t / a.dur);
      const e = U.ease.outCubic(k);
      const x = U.lerp(a.from.x, a.to.x, e),
        y = U.lerp(a.from.y, a.to.y, e) - Math.sin(Math.PI * e) * 14;
      prt.scale = 1 + 0.12 * Math.sin(Math.PI * e);
      prt.lift = 0.6 * Math.sin(Math.PI * e);
      prt.noseDisp = a.from.nose + a.spin * e;
      prt.rope.pinX = x;
      prt.rope.pinY = y;
      prt.rope.exitX = -Math.cos(prt.noseDisp);
      prt.rope.exitY = -Math.sin(prt.noseDisp);
      prt.rope.x[prt.rope.n - 1] = x;
      prt.rope.y[prt.rope.n - 1] = y;
      if (k >= 1) {
        prt.state = 'rest';
        prt.rope.release();
        prt.anim = null;
        A().sfx.thud(0.3);
        if (a.after) a.after();
      }
    }
  };

  /* ---------------------------------------------------------------- poke (Settle) */
  Room.prototype.pokeAt = function (x, y) {
    if (this.sleeper && this.petCat(x, y)) return true;
    if (this.cat && this.def.herd && this.catPoke(x, y)) return true;
    if (this.finale && this.finale.hit(x, y)) {
      this.finale.nudge();
      return true;
    }
    // devices
    for (const d of this.L.devices) {
      const m = d.meta;
      if (Math.abs(x - d.x) < m.w / 2 + 6 && Math.abs(y - d.y) < m.h / 2 + 6) {
        const rt = this.devRT[d.id];
        rt.poke = 1;
        rt.hopS.kick(1.3);
        H().pulse('poke');
        if (!this.seqPoke || !this.seqPoke(d)) A().sfx.bip((Math.random() * 6) | 0);
        Fx.sparkle(d.x, d.y, '#ffe9bd', 5);
        Fx.caption(rt.p === 'on' ? 'bzz' : 'zz?', d.x, d.y - m.h / 2 - 6, '#fff7dc');
        return true;
      }
    }
    // a groove's silent pad is a drum too: hit on the beat, it is the pocket (the secret)
    if (this.seqRT && this.seqRestTap && this.seqRestTap(x, y)) {
      this.idle = 0;
      return true;
    }
    // a tap on a sequencer strip plays the tune again
    if (this.seqRT && this.seqStripAt(x, y)) {
      this.seqDemo();
      this.idle = 0;
      return true;
    }
    // decor + secrets
    const decor = this.def.decor || [];
    for (let i = 0; i < decor.length; i++) {
      const d = decor[i],
        rt = this.decorRT[i];
      if (rt.hidden || d.inert) continue; // (light patches and the like are not things you can poke)
      if (Math.hypot(x - d.x, y - d.y) < (d.r || 34) + 10) {
        rt.poke = 1;
        H().pulse('poke');
        if (d.art === 'mug') Fx.steam(d.x, d.y - 4);
        if (d.art === 'cattail') {
          A().sfx.cat();
          Fx.caption('mrrp', d.x - 30, d.y - 36, '#fff7dc');
        }
        if (d.art === 'clock') A().chime(7);
        if (d.art === 'eggtimer' && this.timerRT) this.timerReset();
        if (d.art === 'fridge') {
          this.fridgeT = 2.4; // the door light clicks on and spills cold light for a moment
          A().sfx.click();
          Fx.caption('click', d.x, d.y + 38, '#cfe8ff');
        }
        if (d.art === 'discoball') {
          A().chime(9);
          Fx.sparkle(d.x, d.y, '#ffe3a8', 10);
        }
        if (d.art === 'lamp') this.decorLitT = this.decorLitT > 0.5 ? 0.55 : 1;
        const sec = this.def.secret;
        if (sec && sec.on === d.art) rt.pokes = (rt.pokes || 0) + 1;
        if (sec && sec.on === d.art && !this.secretFound && rt.pokes >= (sec.taps || 1)) {
          this.secretFound = true;
          rt.found = true;
          this.onEvent('secret', sec);
          A().chime(9);
          Fx.sparkle(sec.x, sec.y, '#ffe9bd', 14);
          Fx.starburst(sec.x, sec.y, 10);
        }
        return true;
      }
    }
    return false;
  };

  /* ---------------------------------------------------------------- lights for the light map (stage units) */
  Room.prototype.lights = function () {
    const out = [];
    for (const d of this.L.devices) {
      const rt = this.devRT[d.id];
      if (rt.bloom < 0.02) continue;
      const col = d.type === 'lamp' ? '#ffe2a0' : U.mix(Art.KEYCOL[d.color] || '#ffe2a0', '#ffe6b0', 0.55);
      out.push({ x: d.x + this.offX, y: d.y, r: T.poolR * (d.type === 'lamp' ? 1.9 : d.type === 'laptop' || d.type === 'tablet' ? 1.3 : 1) * (0.55 + 0.45 * rt.bloom), i: rt.bloom, col });
    }
    (this.def.decor || []).forEach((d, i) => {
      if (d.art === 'lamp' && this.decorLit > 0.02) out.push({ x: d.x + this.offX, y: d.y, r: 230 * (0.5 + 0.5 * this.decorLit), i: this.decorLit, col: '#ffe2a0' });
    });
    if (this.def.dark) {
      // the plug in your hand is a lantern; seated plugs keep a small glow; strips are only a remembered shadow
      for (const prt of this.plugList) {
        if (prt.state === 'held') out.push({ x: prt.x + this.offX, y: prt.y, r: 96, i: 0.95, col: '#fff1c8' });
        else if (prt.seatSock) out.push({ x: prt.x + this.offX, y: prt.y, r: 38, i: 0.45, col: '#ffe9bd' });
      }
      for (const s of this.L.strips) out.push({ x: s.x + this.offX, y: s.y, r: 72, i: 0.16, col: '#cfd8ff' });
      const c = this.sleeper;
      if (c) out.push({ x: c.x + this.offX, y: c.y, r: 46, i: 0.22 + 0.2 * c.al, col: '#ffd8a8' });
      const fr = (this.def.decor || []).find((q) => q.art === 'fridge');
      if (fr) out.push({ x: fr.x + this.offX, y: fr.y + 10, r: 70 + 90 * Math.min(1, (this.fridgeT || 0) / 1.2), i: 0.2 + 0.5 * Math.min(1, (this.fridgeT || 0) / 1.2), col: '#cfe8ff' });
    }
    if (this.gateRT) for (const g of this.L.gates) {
      const gr = this.gateRT[g.id];
      if (gr.lit > 0.03) out.push({ x: g.x + this.offX, y: g.y, r: 70 * (0.5 + 0.5 * gr.lit), i: 0.55 * gr.lit, col: Art.KEYCOL[g.key] ? U.mix(Art.KEYCOL[g.key], '#ffe9b8', 0.45) : '#ffe2a0' });
    }
    if (this.finale && this.finale.lights) for (const l of this.finale.lights()) out.push(l);
    if (this.finale && this.finale.rt.bloom > 0.02) out.push({ x: this.finale.x + this.offX, y: this.finale.y, r: 120 * this.finale.rt.bloom, i: this.finale.rt.bloom, col: '#ffd9a0' });
    if (this.title && this.titleLit > 0.02) out.push({ x: 180 + this.offX, y: 330, r: 330 * this.titleLit, i: this.titleLit, col: '#ffe2a0' });
    return out;
  };
  Room.prototype.ambientAlpha = function () {
    let a = T.ambientDark * (1 - this.dawn * 0.32) * (1 - Math.pow(Math.min(1, this.awakeShown), 0.8));
    if (this.def.dark) a = U.lerp(0.9, 0.46, Math.pow(Math.min(1, this.awakeShown), 0.8)); // a black kitchen that warms as devices wake
    if (this.title) a = T.ambientDark * 1.05 * (1 - Math.pow(this.titleLit, 0.8));
    if (this.blackout > 0) a = U.lerp(a, 0.93, Math.min(1, this.blackout));
    return a;
  };

  /* ---------------------------------------------------------------- draw */
  function appearXf(ctx, p, cx, cy) {
    const e = U.ease.outBack(p, 1.4);
    const s = 0.55 + 0.45 * e;
    ctx.translate(cx, cy - (1 - e) * 24);
    ctx.scale(s, s);
    ctx.translate(-cx, -cy);
    ctx.globalAlpha = Math.min(1, p * 1.8);
  }
  Room.prototype.ap = function (key) {
    return sat((this.t - (this.appearAt[key] || 0)) / 0.38);
  };

  Room.prototype.draw = function (ctx) {
    const L = this.L,
      t = this.t;
    ctx.save();
    ctx.translate(this.offX, 0);
    // the felt mat
    if (this.mat) {
      const M = Art.MAT,
        m = this.mat;
      ctx.drawImage(m.cv, M.x - m.pad, M.y - m.pad, M.w + m.pad * 2, M.h + m.pad * 2);
    }
    if (this.title) G.Game.drawTitleLetters(ctx, this);
    const obstacles = this.def.obstacles || [];
    if (this.carryRT) this.carryDrawUnder(ctx, t);
    const decor = this.def.decor || [];
    // shadows
    for (const s of L.strips) {
      const p = this.ap('s:' + s.id);
      if (p > 0.01) {
        ctx.save();
        ctx.globalAlpha = p;
        Art.stripUnder(ctx, s, this.stripRT[s.id], t);
        ctx.restore();
      }
    }
    for (const d of L.devices) {
      const p = this.ap('d:' + d.id);
      if (p > 0.01 && d.type !== 'anchor') {
        ctx.save();
        ctx.globalAlpha = p;
        Art.deviceShadow(ctx, d, this.devRT[d.id]);
        ctx.restore();
      }
    }
    obstacles.forEach((o, i) => {
      const p = this.ap('o:' + i);
      if (p < 0.01) return;
      ctx.save();
      ctx.globalAlpha = p;
      if (o.shape === 'circle') Art.shadow(ctx, o.x, o.y, o.r * 2 + 10, o.r * 2, o.r, 0, 0.35, 0.5);
      else Art.shadow(ctx, o.x, o.y, o.w, o.h, o.cr || 8, o.rot || 0, 0.3, 0.55);
      ctx.restore();
    });
    decor.forEach((d, i) => {
      const rt = this.decorRT[i];
      const p = this.ap('c:' + i) * (d.showAfterScript ? rt.appear : 1);
      if (p < 0.01) return;
      ctx.save();
      ctx.globalAlpha = p;
      Art.decorShadow(ctx, d);
      ctx.restore();
    });
    if (this.wetRT) for (const id in this.wetRT) Art.puddle(ctx, this.wetRT[id], t, this.L);
    if (this.blockRT) this.blocksDrawShadows(ctx, t);
    // decor and obstacles
    decor.forEach((d, i) => {
      const rt = this.decorRT[i];
      const p = this.ap('c:' + i) * (d.showAfterScript ? rt.appear : 1);
      if (p < 0.01) return;
      ctx.save();
      appearXf(ctx, p, d.x, d.y);
      Art.decor(ctx, d, rt, t);
      ctx.restore();
    });
    obstacles.forEach((o, i) => {
      const p = this.ap('o:' + i);
      if (p < 0.01) return;
      ctx.save();
      appearXf(ctx, p, o.x, o.y);
      ctx.translate(o.x, o.y);
      if (o.rot) ctx.rotate(o.rot);
      Art.decor(ctx, Object.assign({}, o, { x: 0, y: 0, art: o.art || 'mug' }), { poke: 0 }, t);
      ctx.restore();
    });
    if (this.gateRT) for (const g of L.gates) Art.gate(ctx, g, this.gateRT[g.id], t);
    if (this.finale) {
      this.finale.drawUnder(ctx, t);
      this.finale.drawCloth(ctx, t);
    }
    // secrets that have been found
    if (this.def.secret && this.secretFound) {
      const sec = this.def.secret;
      Art.secret(ctx, sec.art, sec.x, sec.y, 1, t);
    }
    // strips
    for (const s of L.strips) {
      const p = this.ap('s:' + s.id);
      if (p < 0.01) continue;
      ctx.save();
      appearXf(ctx, p, s.x, s.y);
      if (s.carrier && this.carryRT) this.carryDrawBody(ctx, s, t);
      Art.stripBody(ctx, s, this.stripRT[s.id], t, this.hasKeys);
      ctx.restore();
    }
    // the alphabet blocks lie over any floor outlet they cover
    if (this.blockRT) this.blocksDraw(ctx, t);
    // the beat running along a strip, and the name tapes under the devices
    if (this.chainRT) this.chainDrawUnder(ctx, t);
    if (this.seqRT) this.seqDrawUnder(ctx, t);
    if (this.magnetRT) this.magnetDraw(ctx, t);
    if (this.pendRT) this.pendulumDraw(ctx, t);
    // devices
    for (const d of L.devices) {
      if (d.type === 'anchor') continue;
      const p = this.ap('d:' + d.id);
      if (p < 0.01) continue;
      ctx.save();
      appearXf(ctx, p, d.x, d.y);
      Art.device(ctx, d, this.devRT[d.id], t);
      ctx.restore();
    }
    if (this.loadRT) for (const d of L.devices) if (d.watts && !d.cord) Art.deviceBolts(ctx, d, this.devRT[d.id], t, this.ap('d:' + d.id));
    // cables: seated, resting, then the one in hand
    const order = this.plugList.slice().sort((a, b) => (a.state === 'held' ? 1 : 0) - (b.state === 'held' ? 1 : 0));
    for (const prt of order) {
      const ropes = prt.rope.twin ? [prt.rope, prt.rope.twin] : [prt.rope];
      ropes.forEach((rope, k) => {
        const dev = prt.plug.devices[k] || prt.plug.device;
        const p = this.ap('d:' + dev.id);
        if (p < 0.01) return;
        // a device may colour its own cable (the two halves of a Y-plug); otherwise the plug's key does
        const ck = dev.def.cableCol || (prt.plug.key !== 'any' ? prt.plug.key : null);
        const col = ck ? Art.KEYCOL[ck] : Art.CREAM;
        let pulse;
        for (const pu of this.pulses) if (pu.rope === rope && pu.s >= 0) pulse = pu.s;
        const rt = this.devRT[dev.id];
        Art.cable(ctx, rope, col, {
          key: ck || 'any',
          strain: Math.max(rope.strain, prt.railStrain || 0),
          pulse,
          lift: prt.lift,
          alpha: p,
          live: rt.p === 'on' ? Math.min(1, rt.bloom) * 0.8 : 0,
        });
      });
    }
    // plugs
    const drawPlug = (prt) => {
      const dev = prt.plug.device;
      const p = this.ap('d:' + dev.id);
      if (p < 0.01) return;
      const info = {
        x: prt.x,
        y: prt.y,
        nose: prt.nose,
        lift: prt.lift,
        scale: prt.scale,
        fat: prt.fat,
        key: prt.plug.devices.length > 1 ? prt.plug.devices[0].def.cableCol || prt.plug.key : prt.plug.key,
        keyB: prt.plug.devices.length > 1 ? prt.plug.devices[1].def.cableCol : undefined,
        ins: prt.ins,
        rim: prt.rim,
        wob: prt.wob,
        lean: prt.lean,
        ledOn: this.devRT[dev.id].p === 'on',
      };
      ctx.save();
      ctx.globalAlpha = Math.min(1, p * 1.8);
      Art.plugShadow(ctx, info);
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = Math.min(1, p * 1.8);
      Art.plug(ctx, info, t);
      ctx.restore();
    };
    for (const prt of this.plugList) if (prt.state !== 'held') drawPlug(prt);
    for (const prt of this.plugList) if (prt.state === 'held') drawPlug(prt);
    if (this.riversOn) this.riverDraw(ctx, t); // the light rivers run over the laid cables, under the cat and the devices' faces
    if (this.def.inset) this.insetDraw(ctx, t); // Act 4, Hang Time: the cutaway of the wall, top right
    if (this.craneRT) this.craneDraw(ctx, t); // Act 5, Crane Game: the prizes and the magnet head
    if (this.ghostRT) this.ghostDraw(ctx, t); // Act 5, Ghost Cables: the last run's cables, cold, under the live ones
    if (this.brownRT) this.brownoutDraw(ctx); // Act 5, Brownout: the dark, over the bench and the plugs, under the captions
    if (this.duetRT) this.duetDraw(ctx, t); // Act 5, Duet: the record dot
    if (this.skyRT) this.skylineDraw(ctx); // Act 5, Blackout: the credits cable, through the lit windows
    if (this.torchRT) this.torchDraw(ctx, t); // Act 5, Torchlight: the dark, over everything but the caption
    if (this.chainRT) this.chainDrawBubbles(ctx, t);
    if (this.bassRT) this.bassDrawCollars(ctx, t);
    if (this.def.sling) this.slingDraw(ctx);
    if (this.sleeper) Art.cat2(ctx, this.sleeper, t);
    if (this.cat && this.def.herd) {
      Art.lightSpot(ctx, this.spot, t);
      Art.catWalker(ctx, this.catView(), t);
    }
    if (this.tape) Art.tapeRoll(ctx, this.tape, t);
    if (this.finale) this.finale.drawCat(ctx, t);
    // crossing sparks (noCross levels)
    if (this.def.rules && this.def.rules.noCross) {
      for (const h of this.crossHits) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = 'rgba(190,230,255,0.85)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        let x = h.x - 8,
          y = h.y + (Math.random() - 0.5) * 6;
        ctx.moveTo(x, y);
        for (let k = 0; k < 5; k++) {
          x += 3.4;
          y = h.y + (Math.random() - 0.5) * 9;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.fillStyle = 'rgba(190,230,255,0.4)';
        ctx.beginPath();
        ctx.arc(h.x, h.y, 5 + Math.random() * 2, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();
  };

  // fx and the ghost hand are drawn separately so the light map can sit between them
  Room.prototype.drawHint = function (ctx) {
    const h = this.hint;
    if (!h) return;
    ctx.save();
    ctx.translate(this.offX, 0);
    const t = h.t % 3.2;
    const loop = Math.floor(h.t / 3.2);
    if (loop >= 3) {
      this.hint = null;
      ctx.restore();
      return;
    }
    let a = 0,
      press = 0,
      x = 0,
      y = 0;
    if (h.path || h.poly) {
      let at;
      if (h.poly) {
        // a polyline hint (a route through hoops): walk it by arc length
        const Q = h.poly,
          cum = [0];
        for (let i = 1; i < Q.length; i++) cum.push(cum[i - 1] + Math.hypot(Q[i].x - Q[i - 1].x, Q[i].y - Q[i - 1].y));
        const tot = cum[cum.length - 1] || 1;
        at = (u) => {
          const d = u * tot;
          let i = 1;
          while (i < Q.length - 1 && cum[i] < d) i++;
          const f = (d - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]);
          return { x: Q[i - 1].x + (Q[i].x - Q[i - 1].x) * f, y: Q[i - 1].y + (Q[i].y - Q[i - 1].y) * f };
        };
      } else {
        const P = h.path;
        at = (u) => {
          // quadratic through three points
          const k = 1 - u;
          return { x: k * k * P[0].x + 2 * k * u * P[1].x + u * u * P[2].x, y: k * k * P[0].y + 2 * k * u * P[1].y + u * u * P[2].y };
        };
      }
      let u = 0;
      if (t < 0.4) {
        a = t / 0.4;
        u = 0;
      } else if (t < 0.6) {
        a = 1;
        press = (t - 0.4) / 0.2;
      } else if (t < 1.9) {
        a = 1;
        press = 1;
        u = U.ease.inOutCubic((t - 0.6) / 1.3);
      } else if (t < 2.1) {
        a = 1;
        press = 1 - (t - 1.9) / 0.2;
        u = 1;
      } else {
        a = Math.max(0, 1 - (t - 2.1) / 0.5);
        u = 1;
      }
      const p = at(u);
      x = p.x + h.off.x;
      y = p.y + h.off.y;
      // the plug rides with the finger (so the demonstration reads), only while pressed
    } else if (h.seq) {
      // a hand that follows a script of gestures (the wind-up toy: aim, then wind)
      for (const sg of h.seq) {
        if (t >= sg.t0 && t < sg.t1) {
          const r = sg.at((t - sg.t0) / (sg.t1 - sg.t0));
          x = r.x;
          y = r.y;
          a = r.a;
          press = r.press;
          break;
        }
      }
    } else if (h.tap) {
      x = h.tap.x;
      y = h.tap.y;
      if (t < 0.4) a = t / 0.4;
      else a = t < 2.4 ? 1 : Math.max(0, 1 - (t - 2.4) / 0.5);
      press = t > 0.5 && t < 0.8 ? (t - 0.5) / 0.3 : t >= 0.8 && t < 1.1 ? 1 - (t - 0.8) / 0.3 : 0;
    }
    Art.hand(ctx, x, y, press, a);
    ctx.restore();
  };
})();
