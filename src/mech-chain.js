/* Snug — mech-chain.js : the beat along a strip (Level 26 "Order Up").
   Devices LISTEN to one another. A chalk arrow (def.devices[].after) means "I follow him": a device wakes only while the one it follows is
   awake somewhere to its LEFT on the same strip; the beat runs left to right along a strip, and a follower on the wrong side, on another
   strip, or with a sleeping leader stays in standby with a bubble that names who it is waiting for. A chalk bolt (clash) means "never
   neighbours": two devices in neighbouring sockets howl with feedback and both go quiet. Rules.chainState says who is awake and why
   not; this file owns the beat (a light running along the strip, Tick's pendulum), the bubbles, the name tapes, the relay clicks and
   the count-in at the Wake. */
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
  const BEAT = 1.6; // seconds for one swing of Tick's pendulum and one pulse along the strip
  const TAU = U.TAU;

  Room.prototype.chainInit = function () {
    this.chainRT = { t: 0, info: null, clashPrev: {}, side: 1, lastSide: 1, ticks: 0 };
    this.chainBoard = (this.def.decor || []).findIndex((d) => d.art === 'chalkboard');
    this.chainApply(null, {});
  };
  const nameOf = (L, id) => {
    const d = L.devicesById[id];
    return d ? (d.def.label || d.meta.name).toUpperCase() : '?';
  };
  // after every change of power: who waits for whom, and which edges of the chalkboard are alive
  Room.prototype.chainApply = function (info, pw) {
    const L = this.L,
      C = this.chainRT;
    C.info = info;
    let fresh = null;
    for (const d of L.devices) {
      const rt = this.devRT[d.id];
      rt.needs = info && pw[d.id] === 'standby' && info.why[d.id] ? info.why[d.id] : null;
      if (info && info.clashed[d.id] && !C.clashPrev[d.id]) fresh = d;
    }
    if (fresh) {
      // two neighbours howl: a screech, a shiver, and both stay quiet
      A().sfx.screech();
      H().pulse('refuse');
      const o = L.devicesById[info.why[fresh.id].other];
      for (const dd of [fresh, o]) {
        if (!dd) continue;
        const rt = this.devRT[dd.id];
        rt.wince = 0.6;
        Fx.caption('eeeee!', dd.x, dd.y - dd.meta.h / 2 - 8, '#ffd0c4');
      }
    }
    C.clashPrev = info ? Object.assign({}, info.clashed) : {};
    // the chalkboard: an arrow glows when the follower is awake, a bolt when the pair is clashing
    if (this.chainBoard >= 0) {
      const dec = this.def.decor[this.chainBoard],
        rt = this.decorRT[this.chainBoard];
      rt.edgeOn = (dec.edges || []).map((e) => (info ? (e.kind === 'after' ? !!info.awake[e.b] : !!(info.clashed[e.a] && info.clashed[e.b])) : false));
    }
  };

  Room.prototype.chainUpdate = function (dt) {
    const C = this.chainRT,
      L = this.L;
    C.t += dt;
    const ph = (C.t / BEAT) * TAU;
    for (const d of L.devices) {
      const rt = this.devRT[d.id];
      if (d.type === 'metronome') {
        // Tick's pendulum swings in time while he is awake (and comes to rest when he is not)
        const target = rt.p === 'on' || rt.p === 'waking' ? Math.sin(ph) * 0.55 : 0;
        rt.arm = U.damp(rt.arm || 0, target, 0.05, dt);
        // a soft tock at each end of the swing, while he is awake and the room is still being put together
        if (rt.p === 'on' && this.phase === 'playing') {
          const side = Math.sin(ph) >= 0 ? 1 : -1;
          if (side !== C.lastSide) {
            C.lastSide = side;
            A().sfx.tock2 && A().sfx.tock2(0.25);
          }
        }
      }
      if (rt.needs) rt.needsBlink = (rt.needsBlink || 0) + dt;
    }
  };

  // the count-in at the Wake: Tick says one, two, three, four on a woodblock; the room wakes after it. returns the delay it needs
  Room.prototype.chainWake = function () {
    const L = this.L,
      tick = L.devices.find((d) => d.type === 'metronome');
    const names = ['one', 'two', 'three', 'four'];
    names.forEach((nm, i) =>
      this.later(i * 0.22, () => {
        A().sfx.woodblock(i, tick ? this.pan(tick.x) : 0);
        if (tick) {
          Fx.caption(nm, tick.x, tick.y - tick.meta.h / 2 - 14 - i * 0, '#fff4c8');
          const rt = this.devRT[tick.id];
          rt.hopS.kick(1.1);
        }
        H().pulse('poke', 0.35);
      })
    );
    if (this.def.teaser) this.later(5.6, () => A().sfx[this.def.teaser] && A().sfx[this.def.teaser]());
    return 0.95;
  };

  /* ---------------------------------------------------------------- drawing */
  // under the devices: the name tapes, and the beat running along the strip
  Room.prototype.chainDrawUnder = function (ctx, t) {
    const L = this.L,
      C = this.chainRT;
    // the beat: a bright dot runs to the right from every awake leader along its strip
    const info = C.info;
    if (info)
      for (const d of L.devices) {
        if (!L.devices.some((o) => o.after === d.id) || !info.awake[d.id]) continue;
        const sock = L.socketsById[this.st.seat[d.plug.id]];
        if (!sock) continue;
        const strip = sock.strip,
          b = Rules.stripBounds(strip);
        const x0 = sock.x,
          x1 = strip.x + b[1] - 8,
          y = strip.y - 21;
        const u = (C.t / BEAT) % 1,
          e = u * u * (3 - 2 * u),
          ex = x0 + (x1 - x0) * e;
        ctx.save();
        const g = ctx.createLinearGradient(x0, 0, ex, 0);
        g.addColorStop(0, 'rgba(255,225,140,0)');
        g.addColorStop(1, 'rgba(255,225,140,' + (0.55 * (1 - u * 0.6)).toFixed(3) + ')');
        ctx.strokeStyle = g;
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x0, y);
        ctx.lineTo(ex, y);
        ctx.stroke();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = Art.rad(ctx, ex, y, 1, 12, [0, 'rgba(255,236,170,' + (0.95 * (1 - u * 0.5)).toFixed(3) + ')', 1, 'rgba(255,200,100,0)']);
        ctx.fillRect(ex - 12, y - 12, 24, 24);
        // a ring on each awake listener's socket as the dot passes it
        for (const o of L.devices) {
          if (o.after !== d.id || !info.awake[o.id]) continue;
          const so = L.socketsById[this.st.seat[o.plug.id]];
          if (!so || so.strip !== strip) continue;
          const near = Math.abs(ex - so.x);
          if (near < 18) {
            ctx.strokeStyle = 'rgba(255,230,160,' + (0.8 * (1 - near / 18)).toFixed(3) + ')';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(so.x, strip.y, 21 + (18 - near) * 0.6, 0, TAU);
            ctx.stroke();
          }
        }
        ctx.restore();
      }
    // the name tapes (gaffer tape with a marker name) under each device (a level may keep the band to its ears: noTapes)
    if (!this.def.noTapes)
      for (const d of L.devices) {
      if (d.cord || d.type === 'anchor') continue;
      const nm = nameOf(L, d.id),
        y = d.y + d.meta.h / 2 + 12;
      ctx.save();
      ctx.translate(d.x, y);
      ctx.rotate(((d.x * 7) % 9) * 0.004 - 0.016);
      ctx.beginPath();
      Art.rrect(ctx, -22, -6.5, 44, 13, 1.6);
      ctx.fillStyle = 'rgba(224,210,160,0.9)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(70,56,20,0.45)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.font = '800 8.5px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(40,30,10,0.85)';
      ctx.fillText(nm, 0, 0.6);
      ctx.restore();
    }
  };
  // over the devices: the bubble of a device in standby, which names who it is waiting for (and where they should be)
  Room.prototype.chainDrawBubbles = function (ctx, t) {
    const L = this.L;
    for (const d of L.devices) {
      const rt = this.devRT[d.id];
      if (!rt.needs || rt.p !== 'standby') continue;
      const n = rt.needs,
        blink = 0.45 + 0.55 * (Math.sin((rt.needsBlink || 0) * 6) > -0.2 ? 1 : 0.1);
      const clash = n.kind === 'clash';
      const lab = clash ? nameOf(L, n.other) : nameOf(L, n.leader);
      const w = 22 + lab.length * 6.4,
        h = 22,
        x = d.x,
        y = d.y - d.meta.h / 2 - 20;
      ctx.save();
      ctx.globalAlpha = blink;
      ctx.translate(x, y + Math.sin(t * 3 + d.x) * 1.2);
      ctx.beginPath();
      Art.rrect(ctx, -w / 2, -h / 2, w, h, 10);
      ctx.moveTo(-5, h / 2 - 1);
      ctx.lineTo(0, h / 2 + 7);
      ctx.lineTo(5, h / 2 - 1);
      ctx.fillStyle = clash ? 'rgba(255,226,216,0.97)' : 'rgba(255,248,228,0.97)';
      ctx.fill();
      ctx.strokeStyle = clash ? 'rgba(160,50,40,0.8)' : 'rgba(60,44,20,0.7)';
      ctx.lineWidth = 1.3;
      ctx.stroke();
      // the glyph: a bolt for a clash, an arrow pointing left (the beat comes from the left) for a listener
      ctx.strokeStyle = clash ? '#c0392b' : '#3a2c10';
      ctx.fillStyle = clash ? '#c0392b' : '#3a2c10';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const gx = -w / 2 + 11;
      ctx.beginPath();
      if (clash) {
        ctx.moveTo(gx + 1, -6);
        ctx.lineTo(gx - 3, 0.5);
        ctx.lineTo(gx + 2, 0.5);
        ctx.lineTo(gx - 2, 6);
        ctx.stroke();
      } else {
        ctx.moveTo(gx + 5, 0);
        ctx.lineTo(gx - 5, 0);
        ctx.moveTo(gx - 1, -4);
        ctx.lineTo(gx - 5, 0);
        ctx.lineTo(gx - 1, 4);
        ctx.stroke();
      }
      ctx.font = '800 10px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(lab, gx + 9, 0.5);
      ctx.restore();
    }
  };
})();
