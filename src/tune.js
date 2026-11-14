/* Snug — tune.js : every feel constant lives here, with a live tuning panel.
   Open the panel with ?tune=1 or by triple-tapping the level pill.
   Values persist to localStorage('snug.tune.v1'). "Copy JSON" prints them so you can paste finals back here. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});

  // [key, default, min, max, step, group, label]
  const defs = [
    // ---- Cable ----
    ['segLen', 8, 5, 14, 0.5, 'Cable', 'Segment length (applies on next level load)'],
    ['cableR', 2.6, 1.5, 5, 0.1, 'Cable', 'Cable radius'],
    ['wSlim', 0.4, 0.1, 1, 0.02, 'Cable', 'Slim plug inverse mass (low = heavy)'],
    ['wFat', 0.22, 0.05, 1, 0.02, 'Cable', 'Fat plug inverse mass'],
    ['iters', 12, 4, 24, 1, 'Cable', 'Solver iterations'],
    ['stretchTol', 0.015, 0, 0.06, 0.005, 'Cable', 'Stretch tolerance'],
    ['bendK', 0.12, 0, 0.6, 0.005, 'Cable', 'Bend smoothing (more when taut)'],
    ['relaxK', 0.03, 0, 0.12, 0.005, 'Cable', 'Seated cable settles into a neat arc (per step)'],
    ['curlBias', 0, 0, 1.5, 0.01, 'Cable', 'Curl bias (u): off by default'],
    ['friction', 900, 100, 3000, 20, 'Cable', 'Coulomb friction (u/s²)'],
    ['damp', 2.2, 0, 8, 0.1, 'Cable', 'Viscous damping (1/s)'],
    ['stiction', 0.02, 0, 0.08, 0.005, 'Cable', 'Rest stiction (u/step)'],
    // ---- Plug / finger ----
    ['tauSlim', 0.055, 0.02, 0.2, 0.005, 'Plug', 'Follow lag τ, slim (s)'],
    ['tauFat', 0.085, 0.02, 0.3, 0.005, 'Plug', 'Follow lag τ, fat (s)'],
    ['vmaxSlim', 2600, 800, 6000, 100, 'Plug', 'Max speed, slim (u/s)'],
    ['vmaxFat', 1800, 600, 5000, 100, 'Plug', 'Max speed, fat (u/s)'],
    ['offX', -6, -30, 30, 1, 'Plug', 'Held offset X (u)'],
    ['offY', -40, -90, 0, 1, 'Plug', 'Held offset Y (u)'],
    ['offEase', 0.12, 0.02, 0.4, 0.01, 'Plug', 'Offset ease-in (s)'],
    ['liftScale', 0.14, 0, 0.4, 0.01, 'Plug', 'Lift scale gain'],
    ['liftMs', 90, 30, 250, 5, 'Plug', 'Lift time (ms)'],
    ['hitR', 34, 20, 60, 1, 'Plug', 'Grab radius (u)'],
    // ---- Magnet ----
    ['engageR', 44, 20, 80, 1, 'Magnet', 'Engage radius (u)'],
    ['releaseR', 54, 24, 100, 1, 'Magnet', 'Release radius (u)'],
    ['pullMax', 0.65, 0, 1, 0.05, 'Magnet', 'Max pull toward socket'],
    ['alignMs', 80, 20, 250, 5, 'Magnet', 'Align time (ms)'],
    ['refuseR', 30, 10, 60, 1, 'Magnet', 'Refusal radius (u)'],
    // ---- Seat ----
    ['seatMs', 110, 60, 260, 5, 'Seat', 'Release → contact (ms)'],
    ['slideU', 12, 4, 24, 1, 'Seat', 'Slide distance (u)'],
    ['hitstopSlim', 0.035, 0, 0.12, 0.005, 'Seat', 'Hit-stop slim (s)'],
    ['hitstopFat', 0.05, 0, 0.15, 0.005, 'Seat', 'Hit-stop fat (s)'],
    ['shakeSlim', 1.6, 0, 6, 0.1, 'Seat', 'Camera nudge slim (u)'],
    ['shakeFat', 2.4, 0, 8, 0.1, 'Seat', 'Camera nudge fat (u)'],
    ['squash', 0.03, 0, 0.1, 0.005, 'Seat', 'Strip squash'],
    ['detent', 12, 4, 30, 1, 'Seat', 'Unplug detent (u)'],
    ['refuseMs', 240, 100, 500, 10, 'Seat', 'Refusal hop (ms)'],
    ['hopU', 44, 10, 90, 1, 'Seat', 'Refusal hop distance (u)'],
    // ---- Rail (sliding strips) ----
    ['railK', 230, 80, 700, 10, 'Rail', 'Drag spring (higher = snappier)'],
    ['railC', 30, 8, 80, 1, 'Rail', 'Drag damping (heavier feel = more)'],
    ['railFric', 170, 30, 600, 10, 'Rail', 'Rolling friction after a flick (u/s²)'],
    ['railSnapK', 900, 300, 3000, 50, 'Rail', 'Detent pull strength'],
    ['railSnapC', 42, 20, 140, 2, 'Rail', 'Detent damping (lower = a livelier settle bounce)'],
    ['railSnapV', 190, 60, 500, 10, 'Rail', 'Speed below which a detent catches the strip (u/s)'],
    ['railBounce', 0.22, 0, 0.8, 0.02, 'Rail', 'End-stop / taut-cable bounce'],
    ['railDrag', 1.5, 0, 4, 0.1, 'Rail', 'Speed drag after a flick (1/s): hard flicks do not ping-pong'],
    // ---- Juice ----
    ['pulseSpeed', 1500, 400, 4000, 50, 'Juice', 'Power pulse speed (u/s)'],
    ['sparkN', 8, 0, 20, 1, 'Juice', 'Seat sparks'],
    ['rippleR', 34, 10, 80, 1, 'Juice', 'Ripple radius (u)'],
    ['poolR', 120, 60, 240, 5, 'Juice', 'Light pool radius (u)'],
    ['ambientDark', 0.54, 0.2, 0.9, 0.02, 'Juice', 'Dark ambient strength'],
    // ---- Audio ----
    ['volSfx', 0.9, 0, 1.5, 0.05, 'Audio', 'SFX volume'],
    ['volChime', 0.8, 0, 1.5, 0.05, 'Audio', 'Chime volume'],
    ['volPad', 1.0, 0, 2, 0.05, 'Audio', 'Pad (room chord) volume'],
    ['volAmb', 1.0, 0, 2, 0.05, 'Audio', 'Ambience volume'],
    ['volRustle', 1.0, 0, 2, 0.05, 'Audio', 'Cable rustle volume'],
  ];

  const T = (G.T = {});
  const meta = (G.TUNE_DEFS = defs);
  for (const d of defs) T[d[0]] = d[1];

  const KEY = 'snug.tune.v1';
  G.Tune = {
    defs,
    load() {
      try {
        const s = localStorage.getItem(KEY);
        if (!s) return;
        const o = JSON.parse(s);
        for (const k in o) if (k in T && typeof o[k] === 'number') T[k] = o[k];
      } catch (e) {
        /* storage unavailable: fine */
      }
    },
    save() {
      try {
        const o = {};
        for (const d of defs) if (T[d[0]] !== d[1]) o[d[0]] = T[d[0]];
        localStorage.setItem(KEY, JSON.stringify(o));
      } catch (e) {}
    },
    reset() {
      for (const d of defs) T[d[0]] = d[1];
      try {
        localStorage.removeItem(KEY);
      } catch (e) {}
    },
    json() {
      const o = {};
      for (const d of defs) if (T[d[0]] !== d[1]) o[d[0]] = T[d[0]];
      return JSON.stringify(o, null, 1);
    },

    /* ---------- the panel (browser only) ---------- */
    panel: null,
    toggle() {
      if (!G.U.isBrowser) return;
      if (!this.panel) this.build();
      this.panel.classList.toggle('open');
    },
    build() {
      const self = this;
      const p = (this.panel = document.createElement('div'));
      p.id = 'tunepanel';
      const head = document.createElement('div');
      head.className = 'th';
      head.innerHTML = '<b>Tuning</b>';
      const mk = (txt, fn) => {
        const b = document.createElement('button');
        b.textContent = txt;
        b.onclick = fn;
        head.appendChild(b);
        return b;
      };
      mk('Slow ½', () => (G.timeScale = G.timeScale === 0.5 ? 1 : 0.5));
      mk('Slow ⅒', () => (G.timeScale = G.timeScale === 0.1 ? 1 : 0.1));
      mk('Debug', () => (G.debug = !G.debug));
      mk('Copy', () => {
        const t = self.json();
        if (navigator.clipboard) navigator.clipboard.writeText(t).catch(() => {});
        console.log('SNUG TUNE', t);
      });
      mk('Reset', () => {
        self.reset();
        p.remove();
        self.panel = null;
        self.toggle();
      });
      mk('✕', () => p.classList.remove('open'));
      p.appendChild(head);
      let group = null,
        box = null;
      const body = document.createElement('div');
      body.className = 'tb';
      p.appendChild(body);
      for (const d of defs) {
        if (d[5] !== group) {
          group = d[5];
          const h = document.createElement('div');
          h.className = 'tg';
          h.textContent = group;
          body.appendChild(h);
        }
        const row = document.createElement('label');
        row.className = 'tr';
        const name = document.createElement('span');
        name.textContent = d[6];
        const val = document.createElement('i');
        val.textContent = T[d[0]];
        const inp = document.createElement('input');
        inp.type = 'range';
        inp.min = d[2];
        inp.max = d[3];
        inp.step = d[4];
        inp.value = T[d[0]];
        inp.oninput = () => {
          T[d[0]] = parseFloat(inp.value);
          val.textContent = T[d[0]];
          self.save();
        };
        row.appendChild(name);
        row.appendChild(val);
        row.appendChild(inp);
        body.appendChild(row);
      }
      document.body.appendChild(p);
    },
  };
  G.timeScale = 1;
  G.debug = false;
})();
