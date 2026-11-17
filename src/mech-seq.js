/* Snug — mech-seq.js : the sequencer strip (Levels 27, 29, 30).
   A strip whose sockets are the STEPS of a loop. A light walks along it, one step per beat, forever; whatever is plugged into a step
   plays its note when the light gets there, so the loop builds as you plug, and plugging is musical on its own. Every device has one
   instrument (a bell, a celesta, a pluck, a woodblock...) and one step it belongs on (dev.seq: { step, voice, note }); on any other
   step it sits out and the loop answers with a soft buzz and a hop (it plays a different note than the one you heard). At the start
   the room plays the whole tune once as a demo (and again when you ask for a hint or tap the strip); the sound is the clue, not the
   colour and not the place. Tapping a device plays its instrument, so you can hear who is who.
   Notes are scheduled a little ahead on the audio clock (the lookahead below), so the loop keeps perfect time whatever the frame
   rate does. Rules.* owns who belongs where (Rules.seqOK / seqWrong / power); this file owns the clock, the light and the sound. */
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
  const TAU = U.TAU;
  const LOOKAHEAD = 0.14;
  const STEPCOL = ['#ffd9a0', '#bfe6ff', '#ffc4dd', '#d4efb4', '#e2c8ff', '#ffe08a', '#a8f0e0', '#ffb8a0'];

  Room.prototype.seqInit = function () {
    const strip = this.L.strips.find((s) => s.seq),
      cfg = strip.seq;
    this.seqRT = {
      strip,
      steps: strip.sockets.length,
      dur: (60 / (cfg.bpm || 104)) * (cfg.beat || 1),
      phase: 'wait', // wait -> running (the demo plays once at the start, then the loop walks on)
      demoAt: cfg.demoAt || 1.3,
      demoLeft: 0,
      nextT: 0,
      idx: 0,
      ev: [],
      light: -1,
      lightT: -9,
      hint: null,
      aLast: undefined,
      aRun: -9,
      flash: {},
      stopAt: 0,
      staff: (this.def.decor || []).findIndex((d) => d.art === 'staff'),
      bad: false, // a device has been put on a step it does not belong to (the secret asks for none)
      // Level 29, the groove: a voice off its pocket still sounds (ragged); the rest pad is silent by design; a lit groove swings
      groove: !!cfg.groove,
      rest: cfg.rest || 0, // the 1-based pad that is silent on purpose: the rest is the pocket
      swingOn: false,
      swing: 0.14, // a lit groove: every second pad sits this share of a step late
    };
  };
  // the signed distance, in steps, from pad `e` to a pocket, the short way round an n-step loop
  const seqErr = (e, n) => (((e % n) + n + n / 2) % n) - n / 2;
  // the groove's warm glow: one small sprite, made once, drawn scaled every frame
  let glow = null;
  const glowSprite = () => {
    if (glow || typeof document === 'undefined') return glow;
    glow = document.createElement('canvas');
    glow.width = glow.height = 128;
    const g = glow.getContext('2d'),
      gr = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,196,128,0.5)');
    gr.addColorStop(1, 'rgba(255,196,128,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    return glow;
  };
  // the clock the loop keeps: the audio clock when it is running (a lookahead on it never glitches), else the room's own
  Room.prototype.seqClock = function () {
    const S = this.seqRT,
      a = A().now ? A().now() : undefined;
    if (typeof a === 'number') {
      if (S.aLast !== undefined && a > S.aLast) S.aRun = this.t;
      S.aLast = a;
    }
    const audio = typeof a === 'number' && this.t - S.aRun < 0.3;
    if (audio !== S.audio && S.phase === 'running') S.nextT = (audio ? a : this.t) + 0.1; // the clock changed (the audio woke up): re-anchor the loop
    S.audio = audio;
    return audio ? a : this.t;
  };
  const deviceAt = (room, sock) => {
    for (const p of room.L.plugs) if (room.st.seat[p.id] === sock.id) return p.device;
    return null;
  };
  const pan = (room, x) => room.pan(x);
  // play the whole tune once: the first note on the next beat
  Room.prototype.seqDemo = function () {
    const S = this.seqRT;
    if (!S) return;
    S.phase = 'running';
    S.demoLeft = S.steps;
    S.idx = 0;
    S.nextT = this.seqClock() + 0.35;
    S.ev = S.ev.filter((e) => e.kind !== 'demo');
  };
  Room.prototype.seqUpdate = function (dt) {
    const S = this.seqRT,
      L = this.L;
    const T = this.seqClock();
    if (S.phase === 'wait') {
      if (this.phase === 'playing' && this.t > S.demoAt) this.seqDemo();
      return;
    }
    if (S.phase === 'done') return;
    if (S.groove) {
      const lit = Rules.grooveLit(L, this.st);
      if (lit !== S.swingOn) {
        S.swingOn = lit;
        if (lit) this.seqLit();
      }
    }
    if (Rules.seqWrong(L, this.st).length) S.bad = true;
    if (S.stopAt && this.t > S.stopAt) {
      S.phase = 'done';
      return;
    }
    // schedule every step that falls inside the lookahead window
    while (S.nextT < T + LOOKAHEAD) {
      const k = S.idx % S.steps,
        sock = S.strip.sockets[k],
        when = Math.max(0, S.nextT - T),
        sw = S.swingOn && k % 2 === 1 ? S.dur * S.swing : 0; // a lit groove swings: every second pad sits a little late
      if (S.demoLeft > 0) {
        S.demoLeft--;
        const d = L.devices.find((dd) => dd.seq && dd.seq.step === k + 1);
        if (d) {
          A().inst(d.seq.voice, d.seq.note, d.seq.vel || 0.85, pan(this, sock.x), when);
          S.ev.push({ t: S.nextT, k, kind: 'demo', midi: d.seq.note });
        } else S.ev.push({ t: S.nextT, k, kind: 'tick' }); // a silent pad: the light still walks over it
      } else {
        const d = deviceAt(this, sock);
        if (d && d.seq && sock.slot === d.seq.step) {
          A().inst(d.seq.voice, d.seq.note, d.seq.vel || 0.8, pan(this, sock.x), when + sw);
          S.ev.push({ t: S.nextT, k, kind: 'play', dev: d, midi: d.seq.note });
        } else if (d && d.seq && S.groove) {
          // off its pocket it still sounds, but ragged: pushed or dragged by how far it is from where it belongs
          const err = seqErr(d.seq.step - sock.slot, S.steps);
          A().inst(d.seq.voice, d.seq.note, (d.seq.vel || 0.8) * 0.8, pan(this, sock.x), Math.max(0, when + sw + err * 0.03));
          S.ev.push({ t: S.nextT, k, kind: 'ragged', dev: d, midi: d.seq.note });
        } else if (d && d.seq) {
          A().buzz(when, pan(this, sock.x));
          S.ev.push({ t: S.nextT, k, kind: 'buzz', dev: d });
        } else S.ev.push({ t: S.nextT, k, kind: 'tick' });
      }
      S.nextT += S.dur;
      S.idx++;
    }
    // the visible side of each step, as the clock reaches it
    for (let i = 0; i < S.ev.length; ) {
      const e = S.ev[i];
      if (e.t > T) {
        i++;
        continue;
      }
      S.ev.splice(i, 1);
      const sock = S.strip.sockets[e.k];
      S.light = e.k;
      S.lightT = this.t;
      if (e.kind === 'tick') continue;
      if (S.staff >= 0 && e.midi !== undefined) {
        // the note appears on the chalk staff (the tune stays up for a while when the room plays it)
        const rt = this.decorRT[S.staff];
        rt.notes = rt.notes || [];
        rt.notes[e.k] = { midi: e.midi, t: this.t, hold: e.kind === 'demo' ? S.dur * S.steps + 2.4 : 1.1 };
      }
      S.flash[e.k] = { t: this.t, kind: e.kind };
      if (e.kind === 'buzz') {
        const rt = this.devRT[e.dev.id];
        rt.hopS.kick(1.0);
        rt.wince = 0.35;
        Fx.ring(sock.x, sock.y, 40, '#ff9a8a', 0.5, 1.4);
        H().pulse('refuse');
      } else if (e.kind === 'ragged') {
        Fx.ring(sock.x, sock.y, 30, '#ffc27a', 0.4, 1.2); // a voice off its pocket: an amber ring, the groove stays on
      } else {
        const col = STEPCOL[e.k % STEPCOL.length];
        Fx.ring(sock.x, sock.y, 46, col, 0.7, 1.7);
        Fx.caption(e.kind === 'demo' ? '♪' : '♫', sock.x + (e.k % 2 ? 8 : -8), sock.y - 40, col);
        if (e.kind === 'play') {
          this.devRT[e.dev.id].hopS.kick(0.8);
          H().pulse('tick', 0.5);
        }
      }
    }
    if (S.hint && this.t > S.hint.until) S.hint = null;
    if (S.staff >= 0) this.decorRT[S.staff].now = this.t;
  };
  // the hint plays the tune again and pulses the socket the next device belongs in
  Room.prototype.seqHint = function (act) {
    const S = this.seqRT;
    if (!S || !act || act.type !== 'seat') return;
    this.seqDemo();
    S.hint = { sock: act.socket, until: this.t + 4.2 };
  };
  // pressing the strip's body (not a plug) plays the tune again
  Room.prototype.seqStripAt = function (x, y) {
    const S = this.seqRT;
    if (!S || this.phase !== 'playing') return false;
    return G.Geom.pointPolyDist(x, y, Rules.stripPoly(S.strip)) < 4;
  };
  // a tap on a device plays its instrument (so you can hear who is who)
  Room.prototype.seqPoke = function (d) {
    if (!this.seqRT || !d.seq) return false;
    A().inst(d.seq.voice, d.seq.note, 0.85, pan(this, d.x), 0);
    return true;
  };
  // the groove locks in: every voice is in its pocket. The band bounces, a block knocks, and the loop starts to swing
  Room.prototype.seqLit = function () {
    const S = this.seqRT,
      sk = S.strip.sockets[Math.floor(S.strip.sockets.length / 2)];
    A().sfx.woodblock && A().sfx.woodblock(1, 0);
    H().pulse('seat', 0.8);
    for (const d of this.L.devices) if (d.seq) this.devRT[d.id].hopS.kick(0.9);
    Fx.caption('in the pocket', sk.x, S.strip.y - 58, '#fff1c8');
    Fx.sparkle(sk.x, S.strip.y - 20, '#ffe9bd', 10);
  };
  // seconds from the clock to the nearest arrival of the light on pad k (negative: the clock is early for it)
  Room.prototype.seqBeatErr = function (k, T) {
    const S = this.seqRT,
      n = S.steps,
      ic = S.idx - (S.nextT - T) / S.dur; // the step index the clock is at, fractional
    let best = null;
    for (let j = Math.round(ic) - n; j <= Math.round(ic) + n; j++) {
      if ((((j % n) + n) % n) !== k) continue;
      if (best === null || Math.abs(j - ic) < Math.abs(best - ic)) best = j;
    }
    return (ic - best) * S.dur;
  };
  // the silent pad of a groove: a tap on it is a ghost hit; ON THE BEAT (the light is there) it is the pocket, and the secret
  Room.prototype.seqRestTap = function (x, y) {
    const S = this.seqRT;
    if (!S || !S.groove || !S.rest || S.phase === 'wait' || this.phase !== 'playing') return false;
    const sock = S.strip.sockets[S.rest - 1];
    if (!sock || deviceAt(this, sock) || Math.hypot(x - sock.x, y - sock.y) > 20) return false;
    const err = this.seqBeatErr(S.rest - 1, this.seqClock()),
      on = Math.abs(err) < 0.14;
    A().sfx.woodblock && A().sfx.woodblock(3, pan(this, sock.x));
    Fx.ring(sock.x, sock.y, 20, on ? '#fff1c8' : '#9aa3b8', 0.45, 1.6);
    if (!on) {
      Fx.caption(err < 0 ? 'early' : 'late', sock.x, sock.y - 30, '#c9d0e0');
      return true;
    }
    Fx.caption("That's the pocket.", sock.x, sock.y - 30, '#fff7dc');
    const sec = this.def.secret;
    if (sec && sec.on === 'ghost' && !this.secretFound) {
      this.secretFound = true;
      this.onEvent('secret', sec);
      A().chime(9);
      Fx.sparkle(sec.x, sec.y, '#ffe9bd', 14);
      Fx.starburst(sec.x, sec.y, 10);
    }
    return true;
  };
  // the Wake: the loop plays on a little while with everyone in it, then stops
  Room.prototype.seqWake = function () {
    const S = this.seqRT;
    if (!S) return;
    S.phase = 'running';
    S.demoLeft = 0;
    S.stopAt = this.t + S.dur * S.steps * 3.2;
    // the secret: the tune rebuilt without ever putting anything on a wrong step
    const sec = this.def.secret;
    if (sec && sec.on === 'perfect' && !S.bad && !this.secretFound) {
      this.secretFound = true;
      this.later(0.9, () => {
        this.onEvent('secret', sec);
        A().chime(9);
        Fx.sparkle(sec.x, sec.y, '#ffe9bd', 14);
        Fx.starburst(sec.x, sec.y, 10);
      });
    }
    if (this.def.teaser) this.later(5.4, () => A().sfx[this.def.teaser] && A().sfx[this.def.teaser]());
  };

  /* ---------------------------------------------------------------- drawing */
  Room.prototype.seqDrawUnder = function (ctx, t) {
    const S = this.seqRT;
    if (!S) return;
    const strip = S.strip;
    // a groove: the room breathes with the tempo, a warm glow that swells on the first pad of every bar
    if (S.groove) {
      const age = S.light === 0 ? this.t - S.lightT : 9,
        pulse = Math.max(0, 1 - age / 0.45),
        g = glowSprite();
      if (g && pulse > 0.01) {
        // one cached sprite, drawn only while the bar's downbeat is swelling (a big additive draw every frame cost ~8 fps here)
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.45 + 0.55 * pulse;
        ctx.drawImage(g, strip.x - 190, strip.y - 290, 380, 380);
        ctx.restore();
      }
    }
    // a pad's state in the groove: 'ok' (its voice is in its pocket), 'off' (a voice sits on the wrong pad), 'empty'
    const padState = (k) => {
      const sock = strip.sockets[k],
        d = deviceAt(this, sock);
      if (!d || !d.seq) return 'empty';
      return sock.slot === d.seq.step ? 'ok' : 'off';
    };
    for (let k = 0; k < S.steps; k++) {
      const sock = strip.sockets[k];
      const col = STEPCOL[k % STEPCOL.length];
      // the accent map: in a groove the odd pads (1, 3, 5, 7) are the bright ones
      const acc = S.groove && k % 2 === 0,
        pad = S.groove ? padState(k) : 'plain',
        lamp = pad === 'ok' ? '#ffe39a' : pad === 'off' ? '#ff9a7a' : col;
      // the accent map: a faint warm ring round each bright pad, so the loud pads read at a glance
      if (acc) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = 'rgba(255,226,150,0.26)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sock.x, sock.y, 25, 0, TAU);
        ctx.stroke();
        ctx.restore();
      }
      // a little step lamp below each socket: dim until the light is on it
      const age = S.light === k ? this.t - S.lightT : 9;
      const on = Math.max(0, 1 - age / (S.dur * 0.9));
      const f = S.flash[k],
        fa = f ? Math.max(0, 1 - (this.t - f.t) / 0.5) : 0;
      ctx.save();
      ctx.translate(sock.x, strip.y + 40);
      ctx.beginPath();
      ctx.arc(0, 0, acc ? 5.2 : 4.2, 0, TAU);
      ctx.fillStyle = on > 0.02 ? U.mix(acc ? '#7b8196' : '#4a4d58', lamp, Math.min(1, on * 1.3)) : acc ? '#5a5f72' : S.groove ? '#2c2f38' : '#3a3d48';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      if (on > 0.05) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = Art.rad(ctx, 0, -2, 1, 22, [0, lamp + 'aa', 1, lamp + '00']);
        ctx.fillRect(-22, -24, 44, 44);
      }
      // the groove's state has a shape as well as a colour: a dot for a voice in its pocket, a dash for one that is not
      if (pad === 'ok' || pad === 'off') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(40,30,20,0.75)';
        if (pad === 'ok') {
          ctx.beginPath();
          ctx.arc(0, 0, 1.6, 0, TAU);
          ctx.fill();
        } else ctx.fillRect(-2.4, -0.6, 4.8, 1.2);
      }
      ctx.restore();
      // the light on the socket: a warm ring that follows the beat
      if (on > 0.05 || fa > 0.02) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const bad = f && (f.kind === 'buzz' || f.kind === 'ragged');
        const hue = f && f.kind === 'ragged' ? 'rgba(255,190,110,' : bad ? 'rgba(255,130,110,' : 'rgba(255,226,150,';
        ctx.strokeStyle = hue + (0.55 * Math.max(on, fa)).toFixed(3) + ')';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.arc(sock.x, sock.y, 22 + 5 * (1 - Math.max(on, fa)), 0, TAU);
        ctx.stroke();
        ctx.restore();
      }
    }
    if (S.hint) {
      const sock = this.L.socketsById[S.hint.sock];
      const p = 0.5 + 0.5 * Math.sin(t * 7);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(255,240,180,' + (0.35 + 0.4 * p).toFixed(3) + ')';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(sock.x, sock.y, 24 + 5 * p, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  };
})();
