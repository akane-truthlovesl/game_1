/* Snug — audio.js : the room is a music box and you are winding it.
   All sound is synthesized (no files). Recipes follow docs/gdd/04-feel-bible.md section 10.
   G.createAudio(ctx) builds an engine on any AudioContext (the live one, or an OfflineAudioContext for tests).
   G.Audio is a stable proxy that no-ops until unlock() is called from a user gesture. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const T = G.T;

  // C major pentatonic ladder, in semitones from C5 (MIDI 72)
  const LADDER = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28, 31];
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const jit = (pct) => 1 + (Math.random() * 2 - 1) * pct;

  function makeIR(ctx, seconds) {
    const sr = ctx.sampleRate,
      n = Math.floor(sr * seconds);
    const buf = ctx.createBuffer(2, n, sr);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      let lp = 0;
      for (let i = 0; i < n; i++) {
        const t = i / sr;
        let v = (Math.random() * 2 - 1) * Math.exp(-t / (seconds * 0.26));
        // gentle high-pass to keep the tail airy, not boomy
        lp += (v - lp) * 0.12;
        d[i] = (v - lp) * (1 - 0.35 * (t / seconds));
      }
    }
    return buf;
  }
  function noiseBuffer(ctx, kind, seconds) {
    const sr = ctx.sampleRate,
      n = Math.floor(sr * seconds);
    const buf = ctx.createBuffer(1, n, sr);
    const d = buf.getChannelData(0);
    if (kind === 'white') for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    else if (kind === 'pink') {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < n; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856;
        b4 = 0.55 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.016898;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
      }
    } else {
      let last = 0;
      for (let i = 0; i < n; i++) {
        const w = Math.random() * 2 - 1;
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.5;
      }
    }
    return buf;
  }

  G.createAudio = function (ctx) {
    const A = {};
    let voices = 0;
    let root = 0; // semitone shift of the whole music (Act 2 moves up a half-step: "a different room")
    const lastAt = {};
    const flags = { sfx: true, music: true };
    A.ctx = ctx;
    A.now = () => ctx.currentTime;

    /* ---------------- graph ---------------- */
    const master = ctx.createGain();
    master.gain.value = 1.35;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 12;
    comp.ratio.value = 3;
    comp.attack.value = 0.005;
    comp.release.value = 0.12;
    master.connect(comp);
    comp.connect(ctx.destination);
    const sfxBus = ctx.createGain();
    sfxBus.connect(master);
    const chimeBus = ctx.createGain();
    chimeBus.connect(master);
    const padBus = ctx.createGain();
    const padLP = ctx.createBiquadFilter();
    padLP.type = 'lowpass';
    padLP.frequency.value = 1400;
    padBus.connect(padLP);
    padLP.connect(master);
    const ambBus = ctx.createGain();
    ambBus.gain.value = 0.05;
    const ambLP = ctx.createBiquadFilter();
    ambLP.type = 'lowpass';
    ambLP.frequency.value = 900;
    ambBus.connect(ambLP);
    ambLP.connect(master);
    const revIn = ctx.createGain();
    const rev = ctx.createConvolver();
    rev.buffer = makeIR(ctx, 1.1);
    const revOut = ctx.createGain();
    revOut.gain.value = 0.55;
    revIn.connect(rev);
    rev.connect(revOut);
    revOut.connect(master);

    const white = noiseBuffer(ctx, 'white', 1.0);
    const pink = noiseBuffer(ctx, 'pink', 2.0);
    const brown = noiseBuffer(ctx, 'brown', 3.0);

    /* ---------------- helpers ---------------- */
    const SFX = () => T.volSfx * (flags.sfx ? 1 : 0);
    function gate(name, ms) {
      const t = A.now();
      if (lastAt[name] !== undefined && t - lastAt[name] < ms / 1000) return false;
      lastAt[name] = t;
      return voices < 56;
    }
    // exponential envelope: 0 → peak in `a`, then decay to ~0 over `d`
    function env(g, t0, a, peak, d) {
      g.gain.cancelScheduledValues(t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t0 + Math.max(a, 0.001));
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
    }
    function mk(node, t1) {
      voices++;
      node.onended = () => {
        voices--;
        try { node.disconnect(); } catch (e) {}
      };
      node.stop(t1);
    }
    // stereo: every voice created while curPan != 0 goes through a cached panner in front of its bus
    let curPan = 0;
    const panners = new Map();
    let busId = 0;
    function routed(dest) {
      const bus = dest || sfxBus;
      if (!curPan || !ctx.createStereoPanner) return bus;
      if (bus._pid === undefined) bus._pid = ++busId;
      if (bus !== sfxBus && bus !== chimeBus) return bus; // only the main buses are panned (filters keep their own routing)
      const q = Math.round(curPan * 8) / 8;
      const key = bus._pid + ':' + q;
      let pn = panners.get(key);
      if (!pn) {
        pn = ctx.createStereoPanner();
        pn.pan.value = q;
        pn.connect(bus);
        panners.set(key, pn);
      }
      return pn;
    }
    function withPan(p, fn) {
      curPan = Math.max(-1, Math.min(1, p || 0));
      try {
        fn();
      } finally {
        curPan = 0;
      }
    }
    A.withPan = withPan;
    A.at = withPan; // A.at(pan, () => sfx...): everything created inside is panned
    function tone(type, f0, f1, t0, a, d, peak, dest, send) {
      const o = ctx.createOscillator(),
        g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f0, t0);
      if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(f1, 20), t0 + a + d * 0.8);
      env(g, t0, a, peak, d);
      o.connect(g);
      g.connect(routed(dest));
      if (send) {
        const s = ctx.createGain();
        s.gain.value = send;
        g.connect(s);
        s.connect(revIn);
      }
      o.start(t0);
      mk(o, t0 + a + d + 0.05);
      return o;
    }
    function burst(t0, dur, peak, type, freq, q, dest, send, buf) {
      const s = ctx.createBufferSource();
      s.buffer = buf || white;
      s.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq;
      f.Q.value = q;
      const g = ctx.createGain();
      env(g, t0, 0.001, peak, dur);
      s.connect(f);
      f.connect(g);
      g.connect(routed(dest));
      if (send) {
        const x = ctx.createGain();
        x.gain.value = send;
        g.connect(x);
        x.connect(revIn);
      }
      s.start(t0, Math.random() * 0.5);
      mk(s, t0 + dur + 0.05);
      return f;
    }

    /* ---------------- SFX ---------------- */
    const sfx = (A.sfx = {});
    // pick-up tick
    sfx.tick = function () {
      if (!gate('tick', 25)) return;
      const t = A.now(),
        v = SFX(),
        j = jit(0.03);
      burst(t, 0.018, 0.35 * v, 'bandpass', 2600 * j, 1.4);
      tone('sine', 880 * j, 700 * j, t, 0.002, 0.024, 0.1 * v);
    };
    sfx.magnet = function () {
      if (!gate('magnet', 60)) return;
      const t = A.now(),
        v = SFX(),
        j = jit(0.03);
      tone('sine', 1320 * j, 1320 * j, t, 0.002, 0.012, 0.06 * v);
      burst(t, 0.008, 0.08 * v, 'bandpass', 1200, 2);
    };
    // the signature. weight 0..1 (fat bricks are heavier). o: { power 0..1 (how hard it landed), crisp 0..1 (how centred),
    // mat 'desk'|'steel'|'tile'|'night', pan -1..1 }. A gentle placement is a soft tk; a fling is a THUNK; no two alike.
    sfx.thunk = function (weight, o) {
      if (!gate('thunk', 40)) return;
      weight = weight || 0;
      o = o || {};
      const pw = o.power === undefined ? 0.75 : Math.max(0, Math.min(1, o.power));
      const crisp = o.crisp === undefined ? 0.5 : Math.max(0, Math.min(1, o.crisp));
      const mat = o.mat || 'desk';
      const amp = 0.55 + 0.5 * pw;
      withPan(o.pan, () => {
        const t = A.now(),
          v = SFX(),
          j = jit(0.04);
        const night = mat === 'night';
        const f0 = (190 - 70 * weight) * j * (mat === 'steel' ? 1.12 : mat === 'tile' ? 1.3 : night ? 0.88 : 1);
        const len = 0.7 + 0.3 * pw;
        tone('triangle', f0, f0 * 0.52, t, 0.002, (0.16 + 0.05 * weight) * len, 0.85 * amp * v * (night ? 0.6 : 1), sfxBus, 0.1); // body
        tone('sine', f0 * 0.26, f0 * 0.24, t, 0.003, (0.12 + 0.06 * weight) * (0.6 + 0.4 * pw), 0.35 * amp * v * (mat === 'tile' ? 0.55 : 1)); // sub
        burst(t, 0.009, 0.45 * amp * v * (0.55 + 0.9 * crisp) * (night ? 0.4 : 1), 'highpass', 2500, 0.7); // pin click
        burst(t + 0.002, 0.045, 0.25 * amp * v * (night ? 0.5 : 1), 'bandpass', 1100 * j, 6, sfxBus, 0.08); // plastic knock
        if (!night) {
          tone('sine', 3150 * j, 3150 * j, t, 0.001, 0.06, 0.05 * v * amp, sfxBus); // metal tink
          tone('sine', 5230 * j, 5230 * j, t, 0.001, 0.05, 0.04 * v * amp, sfxBus);
        }
        if (mat === 'steel') {
          // the bench rings: a bright inharmonic tail after the knock
          [1840, 2860, 4310].forEach((f, i) => tone('sine', f * j, f * j * 0.995, t + 0.004, 0.001, 0.26 - i * 0.05, (0.07 - i * 0.015) * v * amp, sfxBus, 0.18));
        } else if (mat === 'tile') {
          // a ceramic clack
          burst(t, 0.022, 0.3 * amp * v, 'bandpass', 3300 * j, 3, sfxBus, 0.1);
          tone('sine', 910 * j, 700 * j, t, 0.001, 0.05, 0.12 * v * amp, sfxBus);
        }
      });
    };
    // the rail: one ratchet tick as the strip passes a detent, a clunk when it settles, a brass ting at an end stop
    sfx.detent = function (power, pan) {
      if (!gate('detent', 28)) return;
      withPan(pan, () => {
        const t = A.now(),
          v = SFX(),
          pw = Math.max(0.2, Math.min(1, power || 0.5)),
          j = jit(0.03);
        burst(t, 0.008, 0.3 * pw * v, 'highpass', 2200 * j, 0.8, sfxBus);
        tone('sine', 1500 * j, 980 * j, t, 0.001, 0.02, 0.1 * pw * v, sfxBus);
      });
    };
    sfx.clunk = function (power, mat, pan) {
      if (!gate('clunk', 60)) return;
      withPan(pan, () => {
        const t = A.now(),
          v = SFX(),
          pw = Math.max(0.3, Math.min(1, power || 0.7)),
          j = jit(0.04);
        tone('triangle', 150 * j, 82 * j, t, 0.002, 0.13, 0.7 * pw * v, sfxBus, 0.08);
        tone('sine', 62, 55, t, 0.003, 0.1, 0.3 * pw * v, sfxBus);
        burst(t, 0.02, 0.3 * pw * v, 'bandpass', 700 * j, 3, sfxBus);
        if (mat === 'steel') [2100, 3260].forEach((f, i) => tone('sine', f * j, f * j, t + 0.003, 0.001, 0.2 - i * 0.05, (0.06 - i * 0.015) * pw * v, sfxBus, 0.15));
      });
    };
    sfx.endstop = function (power, pan) {
      if (!gate('endstop', 90)) return;
      withPan(pan, () => {
        const t = A.now(),
          v = SFX(),
          pw = Math.max(0.25, Math.min(1, power || 0.6));
        [1480, 2230, 3340].forEach((f, i) => tone('sine', f, f * 0.997, t, 0.001, 0.34 - i * 0.07, (0.09 - i * 0.02) * pw * v, sfxBus, 0.25));
        tone('sine', 120, 70, t, 0.002, 0.09, 0.35 * pw * v, sfxBus);
      });
    };
    // a cable striking an obstacle: a soft, speed-scaled tock
    sfx.tock = function (power, pan) {
      if (!gate('tock', 90)) return;
      withPan(pan, () => {
        const t = A.now(),
          v = SFX(),
          pw = Math.max(0.1, Math.min(1, power || 0.4)),
          j = jit(0.05);
        tone('sine', 560 * j, 380 * j, t, 0.001, 0.045, 0.12 * pw * v, sfxBus);
        burst(t, 0.02, 0.12 * pw * v, 'bandpass', 1400, 2.5, sfxBus);
      });
    };
    sfx.pop = function () {
      if (!gate('pop', 40)) return;
      const t = A.now(),
        v = SFX();
      burst(t, 0.01, 0.3 * v, 'highpass', 1800, 0.7);
      tone('sine', 260, 520, t, 0.002, 0.04, 0.25 * v);
    };
    sfx.twang = function () {
      if (!gate('twang', 300)) return;
      const t = A.now(),
        v = SFX();
      tone('sine', 180, 150, t, 0.003, 0.14, 0.15 * v);
      tone('sine', 363, 300, t, 0.003, 0.25, 0.07 * v);
      burst(t, 0.012, 0.1 * v, 'bandpass', 1800, 2);
    };
    // wooden knock (refusal)
    sfx.knock = function () {
      if (!gate('knock', 80)) return;
      const t = A.now(),
        v = SFX(),
        j = jit(0.03);
      tone('sine', 190 * j, 170 * j, t, 0.001, 0.045, 0.5 * v);
      tone('sine', 410 * j, 380 * j, t, 0.001, 0.03, 0.3 * v);
      burst(t, 0.025, 0.25 * v, 'bandpass', 900, 3);
    };
    sfx.zap = function () {
      if (!gate('zap', 100)) return;
      const t = A.now(),
        v = SFX();
      const f = burst(t, 0.12, 0.25 * v, 'bandpass', 3000, 3);
      f.frequency.setValueAtTime(3000, t);
      f.frequency.exponentialRampToValueAtTime(800, t + 0.12);
      tone('sine', 60, 55, t, 0.004, 0.09, 0.15 * v);
      const n = 3 + ((Math.random() * 3) | 0);
      for (let i = 0; i < n; i++) burst(t + Math.random() * 0.08, 0.004, 0.2 * v, 'highpass', 3000, 0.7);
    };
    // rocker switch: two-stage click
    sfx.click = function () {
      if (!gate('click', 80)) return;
      const t = A.now(),
        v = SFX();
      burst(t, 0.012, 0.45 * v, 'highpass', 1200, 0.8);
      tone('sine', 140, 110, t, 0.002, 0.06, 0.5 * v);
      burst(t + 0.038, 0.008, 0.22 * v, 'highpass', 1500, 0.8);
      tone('sine', 120, 100, t + 0.038, 0.002, 0.04, 0.2 * v);
    };
    sfx.zip = function () {
      if (!gate('zip', 30)) return;
      const t = A.now(),
        v = SFX();
      tone('sine', 600, 2400, t, 0.004, 0.14, 0.05 * v, sfxBus, 0.25);
    };
    sfx.whoosh = function () {
      const t = A.now(),
        v = SFX();
      const f = burst(t, 0.45, 0.1 * v, 'bandpass', 300, 1.2, sfxBus, 0.1);
      f.frequency.setValueAtTime(300, t);
      f.frequency.exponentialRampToValueAtTime(2400, t + 0.45);
    };
    sfx.thud = function (size) {
      if (!gate('thud', 30)) return;
      const t = A.now(),
        v = SFX(),
        s = size || 0.5;
      tone('sine', 120 - 30 * s, 70 - 15 * s, t, 0.003, 0.08, 0.22 * v);
    };
    // standby blip when plugged into a dead strip
    sfx.bip = function (n) {
      if (!gate('bip', 50)) return;
      const t = A.now(),
        v = SFX();
      tone('square', mtof(84 + (LADDER[Math.min(n || 0, LADDER.length - 1)] % 12)), mtof(84 + (LADDER[Math.min(n || 0, LADDER.length - 1)] % 12)), t, 0.002, 0.07, 0.03 * v);
    };
    sfx.powerdown = function () {
      if (!gate('pdown', 60)) return;
      const t = A.now(),
        v = SFX();
      tone('sine', 700, 180, t, 0.004, 0.22, 0.1 * v, sfxBus, 0.15);
    };
    sfx.cat = function () {
      const t = A.now(),
        v = SFX();
      tone('sine', 520, 760, t, 0.01, 0.12, 0.08 * v);
      tone('sine', 760, 480, t + 0.12, 0.01, 0.16, 0.07 * v);
    };
    sfx.purr = function (dur) {
      const t = A.now(),
        v = SFX();
      const s = ctx.createBufferSource();
      s.buffer = brown;
      s.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 220;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.5 * v, t + 0.3);
      g.gain.linearRampToValueAtTime(0.0001, t + (dur || 1.6));
      // 24 Hz amplitude flutter
      const lfo = ctx.createOscillator(),
        lg = ctx.createGain();
      lfo.frequency.value = 24;
      lg.gain.value = 0.25 * v;
      lfo.connect(lg);
      lg.connect(g.gain);
      s.connect(f);
      f.connect(g);
      g.connect(sfxBus);
      s.start(t);
      lfo.start(t);
      mk(s, t + (dur || 1.6) + 0.1);
      mk(lfo, t + (dur || 1.6) + 0.1);
    };

    // Rex's riff: a small radio playing Dm7 - G7 - Cmaj7 (walking bass, swung comping, brushes, crackle)
    sfx.riff = function () {
      if (!flags.sfx) return;
      const t0 = A.now() + 0.05,
        v = SFX();
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 260;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 3000;
      const bus = ctx.createGain();
      bus.gain.value = 0.9 * v;
      hp.connect(lp);
      lp.connect(bus);
      bus.connect(master);
      const send = ctx.createGain();
      send.gain.value = 0.25;
      bus.connect(send);
      send.connect(revIn);
      const beat = 60 / 112;
      const bass = [[38, 41, 45, 48], [43, 47, 50, 53], [48, 52, 55, 47]];
      const chords = [[53, 57, 60, 64], [53, 59, 62, 67], [52, 55, 59, 62]];
      for (let bar = 0; bar < 3; bar++) {
        for (let b = 0; b < 4; b++) {
          const t = t0 + (bar * 4 + b) * beat;
          tone('triangle', mtof(bass[bar][b]), mtof(bass[bar][b]), t, 0.008, beat * 0.7, 0.3, hp, 0);
          burst(t + beat * 0.62, 0.04, 0.05, 'highpass', 6500, 0.7, hp, 0);
        }
        for (const off of [0, 1.62]) {
          const t = t0 + (bar * 4 + off) * beat;
          chords[bar].forEach((m, i) => tone('triangle', mtof(m), mtof(m), t + i * 0.012, 0.01, beat * 1.1, 0.07, hp, 0));
        }
      }
      const tf = t0 + 12 * beat;
      [48, 52, 55, 59, 62].forEach((m, i) => tone('triangle', mtof(m), mtof(m), tf + i * 0.02, 0.01, beat * 3, 0.07, hp, 0.4));
      tone('triangle', mtof(36), mtof(36), tf, 0.01, beat * 3, 0.3, hp, 0);
      for (let i = 0; i < 14; i++) burst(t0 + Math.random() * 14 * beat, 0.004, 0.05, 'highpass', 2500, 0.7, hp, 0);
    };

    /* ---------------- chimes (bells) ---------------- */
    const PARTIALS = [
      [1, 1, 1.1],
      [2.0, 0.42, 0.7],
      [3.01, 0.22, 0.45],
      [4.2, 0.12, 0.28],
      [5.4, 0.06, 0.18],
    ];
    function bell(midi, t0, vol, send, bright) {
      const f = mtof(midi + root);
      for (const p of PARTIALS) {
        const det = 1 + (Math.random() * 2 - 1) * 0.0017;
        tone('sine', f * p[0] * det, f * p[0] * det, t0, 0.003, p[2] * (bright || 1), vol * p[1], chimeBus, send);
      }
      tone('sine', f / 2, f / 2, t0, 0.01, 0.4, vol * 0.22, chimeBus);
    }
    // n = number of devices awake right now (the ladder), `when` seconds from now
    // glass: a hoop lights. A short, bright, slightly inharmonic bell; n climbs a pentatonic scale from C6
    A.glass = function (n, when) {
      if (!flags.sfx) return;
      const t = A.now() + (when || 0.005),
        f = mtof(84 + root + LADDER[Math.max(0, Math.min(LADDER.length - 1, n || 0))] % 24),
        v = T.volChime;
      const P = [[1, 1, 0.8], [2.76, 0.4, 0.45], [5.4, 0.2, 0.28], [8.93, 0.08, 0.18]];
      for (const q of P) tone('sine', f * q[0], f * q[0], t, 0.001, q[2], 0.1 * v * q[1], chimeBus, 0.5);
      burst(t, 0.01, 0.04 * v, 'highpass', 6000, 0.7, chimeBus);
    };
    A.setRoot = function (semi) {
      root = semi | 0;
    };
    A.chime = function (n, when, pan) {
      if (!flags.sfx) return;
      const step = LADDER[Math.max(0, Math.min(n, LADDER.length - 1))];
      withPan(pan, () => bell(72 + step, A.now() + (when || 0.01), 0.16 * T.volChime, 0.35));
    };
    A.star = function (i, when) {
      if (!flags.sfx) return;
      bell(72 + LADDER[5 + i] + 0, A.now() + (when || 0.01), 0.12 * T.volChime, 0.4, 1.3);
    };
    // per-device wake voices, layered quietly under the chime ladder so the room's chord still composes itself
    A.voice = function (kind, n, pan) {
      if (!flags.sfx) return;
      withPan(pan, () => {
        const t = A.now() + 0.012,
          v = T.volChime;
        const b0 = 72 + LADDER[Math.max(0, Math.min(n || 0, LADDER.length - 1))];
        const fq = (m) => mtof(m + root);
        switch (kind) {
          case 'phone':
            tone('square', fq(b0 + 12), fq(b0 + 12), t, 0.002, 0.05, 0.02 * v, chimeBus);
            tone('square', fq(b0 + 16), fq(b0 + 16), t + 0.075, 0.002, 0.07, 0.02 * v, chimeBus);
            break;
          case 'tablet': {
            tone('sine', fq(b0 - 7), fq(b0 + 5), t, 0.09, 0.55, 0.05 * v, chimeBus, 0.3);
            const f = burst(t, 0.5, 0.018 * v, 'bandpass', 500, 1.2, chimeBus);
            f.frequency.setValueAtTime(500, t);
            f.frequency.exponentialRampToValueAtTime(1500, t + 0.45);
            break;
          }
          case 'laptop':
            bell(b0 - 12, t, 0.05 * v, 0.5, 1.2);
            bell(b0 - 5, t + 0.14, 0.045 * v, 0.5, 1.2);
            break;
          case 'console':
            [0, 4, 7, 12, 16].forEach((st, i) => tone('square', fq(b0 + st), fq(b0 + st), t + i * 0.055, 0.002, 0.06, 0.018 * v, chimeBus));
            break;
          case 'lamp':
            tone('sine', fq(b0 + 24), fq(b0 + 24), t, 0.001, 0.5, 0.05 * v, chimeBus, 0.4);
            tone('triangle', mtof(98 + root), mtof(110 + root), t, 0.12, 0.5, 0.035 * v, chimeBus);
            break;
          case 'radio': {
            const f = burst(t, 0.34, 0.03 * v, 'bandpass', 450, 3, chimeBus);
            f.frequency.setValueAtTime(450, t);
            f.frequency.exponentialRampToValueAtTime(2600, t + 0.3);
            tone('sine', fq(b0), fq(b0), t + 0.3, 0.004, 0.35, 0.045 * v, chimeBus, 0.3);
            break;
          }
          case 'drill': {
            const o = tone('sawtooth', 80, 240, t, 0.05, 0.36, 0.03 * v, chimeBus);
            const lfo = ctx.createOscillator(),
              lg = ctx.createGain();
            lfo.frequency.value = 26;
            lg.gain.value = 30;
            lfo.connect(lg);
            lg.connect(o.frequency);
            lfo.start(t);
            mk(lfo, t + 0.45);
            tone('square', fq(b0 + 7), fq(b0 + 7), t + 0.34, 0.002, 0.1, 0.02 * v, chimeBus);
            break;
          }
          case 'speaker':
            tone('sine', 96, 48, t, 0.003, 0.22, 0.09 * v, chimeBus);
            burst(t, 0.012, 0.05 * v, 'lowpass', 400, 0.7, chimeBus);
            break;
          default:
            break;
        }
      });
    };
    // a plucked cable: additive partials, pitch from the cable's length (pentatonic degree), vel 0..1
    A.pluck = function (midi, vel, pan) {
      if (!flags.sfx) return;
      withPan(pan, () => {
        const t = A.now() + 0.004,
          v = SFX(),
          f = mtof(midi + root),
          vv = Math.max(0.05, Math.min(1, vel || 0.6));
        const P = [[1, 1, 0.95], [2.003, 0.45, 0.55], [3.011, 0.25, 0.35], [4.05, 0.12, 0.22], [5.2, 0.06, 0.14]];
        for (const q of P) tone('sine', f * q[0], f * q[0] * 0.998, t, 0.001, q[2], 0.1 * vv * q[1] * v, sfxBus, 0.18);
        burst(t, 0.012, 0.05 * vv * v, 'bandpass', 2200, 1.5, sfxBus);
      });
    };

    /* ---------------- pad (the room chord) ---------------- */
    const PADTONES = [48, 55, 64, 71, 74, 60, 67, 76];
    let padId = 0;
    const pads = {};
    A.pad = {
      add(k) {
        if (!flags.music) return -1;
        const t = A.now(),
          f = mtof(PADTONES[k % PADTONES.length] + (k >= PADTONES.length ? 12 : 0) + root);
        const o1 = ctx.createOscillator(),
          o2 = ctx.createOscillator(),
          g = ctx.createGain();
        o1.type = o2.type = 'triangle';
        o1.frequency.value = f * 1.0035;
        o2.frequency.value = f / 1.0035;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.setTargetAtTime(0.034 * T.volPad, t, 0.25);
        o1.connect(g);
        o2.connect(g);
        g.connect(padBus);
        o1.start(t);
        o2.start(t);
        voices += 2;
        const id = ++padId;
        pads[id] = { o1, o2, g };
        return id;
      },
      remove(id) {
        const p = pads[id];
        if (!p) return;
        delete pads[id];
        const t = A.now();
        p.g.gain.cancelScheduledValues(t);
        p.g.gain.setTargetAtTime(0.0001, t, 0.25);
        p.o1.stop(t + 1.6);
        p.o2.stop(t + 1.6);
        p.o1.onended = () => { voices -= 2; try { p.o1.disconnect(); p.o2.disconnect(); p.g.disconnect(); } catch (e) {} };
      },
      clear() {
        for (const id in pads) this.remove(+id);
      },
      swell() {
        const t = A.now();
        padBus.gain.cancelScheduledValues(t);
        padBus.gain.setTargetAtTime(2.2, t, 0.25);
        padBus.gain.setTargetAtTime(1.0, t + 1.2, 0.8);
      },
    };

    /* ---------------- win cascade ---------------- */
    A.win = function (n) {
      if (!flags.sfx) return;
      const t = A.now() + 0.05;
      // final add9 bloom (C major regardless of key) + shimmer + sparkles
      [60, 64, 67, 71, 74].forEach((m, i) => bell(m + 12 * (i > 3 ? 0 : 0), t + i * 0.035, 0.1 * T.volChime, 0.5, 1.8));
      burst(t, 1.2, 0.07 * T.volSfx, 'highpass', 5000, 0.5, sfxBus, 0.3);
      [96, 100, 103].forEach((m, i) => tone('sine', mtof(m), mtof(m), t + 0.1 + i * 0.09, 0.002, 0.5, 0.03 * T.volChime, chimeBus, 0.5));
      A.pad.swell();
    };

    /* ---------------- continuous: cable rustle ---------------- */
    const rSrc = ctx.createBufferSource();
    rSrc.buffer = pink;
    rSrc.loop = true;
    const rBP = ctx.createBiquadFilter();
    rBP.type = 'bandpass';
    rBP.frequency.value = 800;
    rBP.Q.value = 0.9;
    const rG = ctx.createGain();
    rG.gain.value = 0;
    rSrc.connect(rBP);
    rBP.connect(rG);
    rG.connect(sfxBus);
    rSrc.start();
    // the rail's rolling rumble (a steel drawer on runners): noise through a band, level and pitch follow speed
    const rlSrc = ctx.createBufferSource();
    rlSrc.buffer = brown;
    rlSrc.loop = true;
    const rlBP = ctx.createBiquadFilter();
    rlBP.type = 'bandpass';
    rlBP.frequency.value = 240;
    rlBP.Q.value = 1.1;
    const rlG = ctx.createGain();
    rlG.gain.value = 0;
    rlSrc.connect(rlBP);
    rlBP.connect(rlG);
    rlG.connect(sfxBus);
    rlSrc.start();
    A.rail = function (v) {
      const t = A.now();
      const vv = Math.max(0, Math.min(1, v || 0));
      rlG.gain.setTargetAtTime(flags.sfx ? 0.5 * Math.pow(vv, 1.1) * T.volRustle : 0, t, 0.05);
      rlBP.frequency.setTargetAtTime(170 + 520 * vv, t, 0.06);
    };
    // tension creak: a thin rising whine and a squeaky band that only a taut carried cable makes
    const cSrc = ctx.createBufferSource();
    cSrc.buffer = pink;
    cSrc.loop = true;
    const cBP = ctx.createBiquadFilter();
    cBP.type = 'bandpass';
    cBP.frequency.value = 2400;
    cBP.Q.value = 7;
    const cG = ctx.createGain();
    cG.gain.value = 0;
    cSrc.connect(cBP);
    cBP.connect(cG);
    cG.connect(sfxBus);
    cSrc.start();
    const wO = ctx.createOscillator();
    wO.type = 'sine';
    wO.frequency.value = 600;
    const wG = ctx.createGain();
    wG.gain.value = 0;
    wO.connect(wG);
    wG.connect(sfxBus);
    wO.start();
    A.rustle = function (v, heavy, strain) {
      // v: normalised cable speed 0..1; strain: 0..1 (how taut the carried cable is)
      const t = A.now();
      const jitter = 0.75 + Math.random() * 0.5;
      const target = flags.sfx ? 0.22 * Math.pow(v, 1.2) * T.volRustle * jitter * (heavy ? 1.3 : 1) : 0;
      rG.gain.setTargetAtTime(target, t, 0.04);
      rBP.frequency.setTargetAtTime(500 + 1800 * v + (heavy ? -200 : 0), t, 0.05);
      const s = flags.sfx ? Math.max(0, Math.min(1, strain || 0)) : 0;
      cG.gain.setTargetAtTime(0.045 * s * s * T.volRustle, t, 0.05);
      cBP.frequency.setTargetAtTime(1800 + 1400 * s + Math.random() * 60, t, 0.05);
      wG.gain.setTargetAtTime(0.011 * Math.pow(s, 2.6) * T.volRustle, t, 0.06);
      wO.frequency.setTargetAtTime(480 + 520 * s, t, 0.08);
    };

    /* ---------------- ambience: the room, muffled → bright ---------------- */
    const aSrc = ctx.createBufferSource();
    aSrc.buffer = brown;
    aSrc.loop = true;
    aSrc.connect(ambBus);
    aSrc.start();
    let awake = 0;
    let clockOn = true;
    let clockTimer = null;
    function tick() {
      if (!flags.music || !clockOn || awake > 0.9) return;
      const t = A.now(),
        v = 0.03 * (1 - awake) * T.volAmb;
      burst(t, 0.006, v * 3, 'highpass', 3000, 0.7, ambBus);
      tone('sine', 1400, 1400, t, 0.001, 0.01, v, ambBus);
    }
    A.ambient = {
      setAwake(a) {
        awake = a;
        const t = A.now();
        ambLP.frequency.setTargetAtTime(900 + 8100 * Math.pow(a, 1.2), t, 0.3);
        ambBus.gain.setTargetAtTime((flags.music ? 0.05 : 0) * T.volAmb * (0.6 + 0.4 * (1 - a * 0.4)), t, 0.4);
      },
      duck(db, secs) {
        const t = A.now();
        ambBus.gain.setTargetAtTime(0.05 * Math.pow(10, db / 20) * T.volAmb, t, 0.05);
        ambBus.gain.setTargetAtTime(0.05 * T.volAmb, t + (secs || 1), 0.6);
      },
      startClock() {
        if (clockTimer || typeof setInterval === 'undefined') return;
        clockTimer = setInterval(tick, 1000);
      },
      stopClock() {
        if (clockTimer) clearInterval(clockTimer);
        clockTimer = null;
      },
    };

    A.settings = function (o) {
      if (o.sfx !== undefined) flags.sfx = !!o.sfx;
      if (o.music !== undefined) {
        flags.music = !!o.music;
        if (!flags.music) A.pad.clear();
        ambBus.gain.value = flags.music ? 0.05 * T.volAmb : 0;
      }
    };
    A.flags = flags;
    return A;
  };

  /* ---------------- stable proxy: no-op until unlocked ---------------- */
  const paths = [
    'sfx.tick', 'sfx.magnet', 'sfx.thunk', 'sfx.pop', 'sfx.twang', 'sfx.knock', 'sfx.zap', 'sfx.click', 'sfx.zip',
    'sfx.whoosh', 'sfx.thud', 'sfx.bip', 'sfx.powerdown', 'sfx.cat', 'sfx.purr', 'sfx.riff', 'sfx.tock', 'chime', 'star', 'win', 'rustle',
    'voice', 'pluck', 'setRoot', 'at', 'glass', 'rail', 'sfx.detent', 'sfx.clunk', 'sfx.endstop',
    'pad.add', 'pad.remove', 'pad.clear', 'pad.swell', 'ambient.setAwake', 'ambient.duck', 'ambient.startClock',
    'ambient.stopClock', 'settings',
  ];
  const P = (G.Audio = { impl: null, ready: false, pending: { sfx: true, music: true } });
  for (const path of paths) {
    const parts = path.split('.');
    let o = P;
    for (let i = 0; i < parts.length - 1; i++) o = o[parts[i]] = o[parts[i]] || {};
    const last = parts[parts.length - 1];
    o[last] = function () {
      const impl = P.impl;
      if (!impl) return path === 'pad.add' ? -1 : undefined;
      let f = impl;
      for (const k of parts) f = f[k];
      let ctxObj = impl;
      for (let i = 0; i < parts.length - 1; i++) ctxObj = ctxObj[parts[i]];
      return f.apply(ctxObj, arguments);
    };
  }
  P.settings = function (o) {
    Object.assign(P.pending, o);
    if (P.impl) P.impl.settings(o);
  };
  P.unlock = function () {
    if (P.impl) {
      if (P.impl.ctx.state === 'suspended') P.impl.ctx.resume();
      return;
    }
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return;
    try {
      const ctx = new AC({ latencyHint: 'interactive' });
      if (ctx.state === 'suspended') ctx.resume();
      P.impl = G.createAudio(ctx);
      P.impl.settings(P.pending);
      P.impl.ambient.startClock();
      P.ready = true;
    } catch (e) {
      /* audio unavailable: the game is fully playable without it */
    }
  };
  P.resume = function () {
    if (P.impl && P.impl.ctx.state !== 'running') P.impl.ctx.resume();
  };
})();
