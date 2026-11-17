/* Snug — ui.js : quiet chrome. A cream pill, three round buttons, stars, a Next glow, and a few calm overlays.
   The room is the interface; everything here eases in with a tiny overshoot and never blinks. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const U = G.U;
  const $ = (id) => document.getElementById(id);

  const ICON = {
    undo: '<svg viewBox="0 0 24 24"><path d="M9 14 4 9l5-5"/><path d="M4 9h9.5a6 6 0 0 1 0 12H9"/></svg>',
    restart: '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v5h-5"/></svg>',
    hint: '<svg viewBox="0 0 24 24"><path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3z"/></svg>',
    gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/></svg>',
    grid: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.2 1.2-6.5L2.5 9.5l6.6-.9z"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  };

  const UI = (G.UI = {
    game: null,
    modals: 0,
    pillTaps: [],
    nextShown: false,
    pips: 0,
    total: 0,
    nameT: 0,
  });

  UI.init = function (game) {
    UI.game = game;
    const app = $('app');
    app.insertAdjacentHTML(
      'beforeend',
      `
      <div id="hud" class="off">
        <div id="top">
          <button id="btnLevels" class="rb sm" aria-label="Levels">${ICON.grid}</button>
          <div id="pillwrap"><div id="pill"><b id="lvnum"></b><span id="lvname"></span></div><div id="pips"></div></div>
          <button id="btnGear" class="rb sm" aria-label="Settings">${ICON.gear}</button>
        </div>
        <div id="bottom">
          <button id="btnUndo" class="rb" aria-label="Undo">${ICON.undo}</button>
          <button id="btnRestart" class="rb" aria-label="Restart">${ICON.restart}</button>
          <button id="btnHint" class="rb" aria-label="Hint">${ICON.hint}</button>
        </div>
        <div id="stars"></div>
        <div id="card"><b id="cardTitle"></b><span id="cardText"></span></div>
        <button id="next" class="off"><span>Next</span><i>▸</i></button>
        <div id="toast"></div>
      </div>
      <div id="menu" class="off">
        <button id="mPlay" class="big">Play</button>
        <div class="row"><button id="mLevels" class="pill">Levels</button><button id="mFidget" class="pill">Fidget</button></div>
      </div>
      <div id="levels" class="sheet off"><div class="card"><div class="ch"><b>Levels</b><button class="rb sm" data-close>${ICON.close}</button></div><div id="grid"></div><div class="foot"><button class="pill" id="lvTitle">Title</button></div></div></div>
      <div id="settings" class="sheet off"><div class="card"><div class="ch"><b>Settings</b><button class="rb sm" data-close>${ICON.close}</button></div><div id="opts"></div></div></div>
      <div id="actend" class="sheet off"><div class="card center"><div class="trophy">${ICON.star}</div><b class="big2" id="aeTitle">Act 1 complete</b><p id="aeText">The desk is awake. Something furry noticed.</p><div class="row"><button class="pill" id="aeLevels">Levels</button><button class="pill" id="aeAgain">Replay</button><button class="pill gold" id="aeNext">Continue</button></div></div></div>
    `
    );
    $('btnUndo').onclick = () => game.undo();
    $('btnRestart').onclick = () => game.restart();
    $('btnHint').onclick = () => game.hint();
    $('next').onclick = () => {
      UI.hideNext();
      game.next();
    };
    $('btnLevels').onclick = () => UI.showLevels();
    $('btnGear').onclick = () => UI.showSettings();
    $('mPlay').onclick = () => {
      UI.hideMenu();
      const d = G.Save.data;
      game.startLevel(Math.min(d.level, G.Levels.length));
    };
    $('mLevels').onclick = () => UI.showLevels();
    $('mFidget').onclick = () => {
      UI.hideMenu();
      game.startToy();
    };
    $('lvTitle').onclick = () => {
      UI.closeSheet('levels');
      game.startTitle();
    };
    $('aeLevels').onclick = () => {
      UI.closeSheet('actend');
      UI.showLevels();
    };
    $('aeAgain').onclick = () => {
      UI.closeSheet('actend');
      game.startLevel(UI.actEndAct ? UI.actEndAct.from : 1);
    };
    $('aeNext').onclick = () => {
      UI.closeSheet('actend');
      const nx = UI.actEndAct ? UI.actEndAct.to + 1 : 0;
      if (G.Levels.find((l) => l.id === nx)) game.startLevel(nx);
      else game.startTitle();
    };
    document.querySelectorAll('[data-close]').forEach((b) => (b.onclick = () => UI.closeSheet(b.closest('.sheet').id)));
    document.querySelectorAll('.sheet').forEach((s) =>
      s.addEventListener('pointerdown', (e) => {
        if (e.target === s) UI.closeSheet(s.id);
      })
    );
    // triple-tap on the pill opens the tuning panel (feel is judged on the phone)
    $('pill').addEventListener('pointerdown', () => {
      const now = performance.now();
      UI.pillTaps = UI.pillTaps.filter((t) => now - t < 800);
      UI.pillTaps.push(now);
      if (UI.pillTaps.length >= 3) {
        UI.pillTaps = [];
        G.Tune.toggle();
      }
    });
    // keep UI presses from becoming canvas input
    for (const id of ['hud', 'menu', 'levels', 'settings', 'actend']) {
      $(id).addEventListener('pointerdown', (e) => {
        if (e.target.closest('button, .card, #pill')) e.stopPropagation();
        G.Audio.unlock();
      });
    }
    UI.buildSettings();
    UI.buildLevels();
  };

  UI.layout = function (V) {
    const root = document.documentElement;
    root.style.setProperty('--vh', V.H + 'px');
  };

  UI.blocking = () => UI.modals > 0;

  /* ---- title / menu ---- */
  UI.showTitle = function (on) {
    UI.hideMenu();
    UI.hideNext();
    $('hud').classList.remove('off');
    $('top').classList.add('titletop');
    $('bottom').classList.add('off');
    $('pillwrap').classList.add('off');
    $('btnLevels').classList.add('off');
    $('stars').innerHTML = '';
  };
  UI.showMenu = function () {
    $('menu').classList.remove('off');
    requestAnimationFrame(() => $('menu').classList.add('in'));
  };
  UI.hideMenu = function () {
    $('menu').classList.remove('in');
    $('menu').classList.add('off');
  };

  /* ---- in-level HUD ---- */
  UI.enterPlay = function () {
    $('hud').classList.remove('off');
    $('top').classList.remove('titletop');
    $('top').classList.remove('off');
    $('bottom').classList.remove('off');
    $('pillwrap').classList.remove('off');
    $('btnLevels').classList.remove('off');
  };
  UI.onLevel = function (def, total) {
    UI.enterPlay();
    $('lvnum').textContent = 'Level ' + def.id;
    $('lvname').textContent = def.name;
    $('pill').classList.add('show');
    UI.nameT = 1.8;
    $('stars').innerHTML = '';
    UI.hideNext();
    UI.winShown = false;
    document.body.classList.remove('won');
    UI.setPips(0, def.devices.filter((d) => d.required !== false).length);
    $('btnHint').classList.remove('glow', 'breath');
  };
  UI.onToy = function () {
    UI.enterPlay();
    $('lvnum').textContent = 'Fidget';
    $('lvname').textContent = 'plug it, pull it, repeat';
    $('pill').classList.add('show');
    UI.nameT = 2.2;
    $('stars').innerHTML = '';
    UI.hideNext();
    $('pips').innerHTML = '';
  };
  UI.setPips = function (n, total) {
    const box = $('pips');
    if (UI.total !== total) {
      box.innerHTML = '';
      for (let i = 0; i < total; i++) box.insertAdjacentHTML('beforeend', '<i></i>');
      UI.total = total;
    }
    const els = box.children;
    for (let i = 0; i < els.length; i++) els[i].classList.toggle('on', i < n);
    UI.pips = n;
  };
  UI.onWin = function () {
    document.body.classList.add('won');
    $('bottom').classList.add('dim');
  };
  UI.showCard = function (def) {
    if (!def || !def.caption) return;
    $('cardTitle').textContent = 'Level ' + def.id + ' · ' + def.name;
    $('cardText').textContent = def.caption;
    clearTimeout(UI.cardT);
    UI.cardT = setTimeout(() => $('card').classList.add('in'), 900);
  };
  UI.hideCard = function () {
    clearTimeout(UI.cardT);
    $('card').classList.remove('in');
  };
  UI.showStars = function (s) {
    const box = $('stars');
    const names = ['Lit', 'Tidy', 'Clean'];
    const vals = [s.lit, s.tidy, s.clean];
    box.innerHTML = '';
    vals.forEach((v, i) => {
      const el = document.createElement('div');
      el.className = 'star' + (v ? ' on' : '');
      el.innerHTML = ICON.star + '<em>' + names[i] + '</em>';
      box.appendChild(el);
      setTimeout(() => {
        el.classList.add('pop');
        if (v && G.Audio) G.Audio.star(i);
        if (v && G.Haptics) G.Haptics.pulse('poke');
      }, 160 * i);
    });
  };
  UI.showNext = function () {
    if (UI.nextShown) return;
    UI.nextShown = true;
    $('next').classList.remove('off');
    requestAnimationFrame(() => $('next').classList.add('in'));
  };
  UI.hideNext = function () {
    UI.hideCard();
    UI.nextShown = false;
    $('next').classList.remove('in');
    $('next').classList.add('off');
    $('bottom').classList.remove('dim');
    $('stars').innerHTML = '';
  };
  UI.toast = function (msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('in');
    clearTimeout(UI.toastT);
    UI.toastT = setTimeout(() => t.classList.remove('in'), 1800);
  };

  UI.tick = function (room, dt) {
    if (UI.nameT > 0) {
      UI.nameT -= dt;
      if (UI.nameT <= 0) $('pill').classList.remove('show');
    }
    const undo = $('btnUndo');
    const can = room.undo && room.undo.length > 0 && room.phase === 'playing';
    undo.classList.toggle('dis', !can);
    const hb = $('btnHint');
    hb.classList.toggle('glow', room.hintGlow > 0.8);
    hb.classList.toggle('breath', room.hintGlow > 0.3 && room.hintGlow <= 0.8);
    hb.classList.toggle('dis', room.phase !== 'playing' || room.toy);
  };

  /* ---- sheets ---- */
  UI.openSheet = function (id) {
    const el = $(id);
    if (!el.classList.contains('off')) return;
    el.classList.remove('off');
    UI.modals++;
    requestAnimationFrame(() => el.classList.add('in'));
  };
  UI.closeSheet = function (id) {
    const el = $(id);
    if (el.classList.contains('off')) return;
    el.classList.remove('in');
    UI.modals = Math.max(0, UI.modals - 1);
    setTimeout(() => el.classList.add('off'), 180);
  };
  UI.showLevels = function () {
    UI.buildLevels();
    UI.openSheet('levels');
    const cur = UI.houseCurrent;
    if (cur) requestAnimationFrame(() => cur.scrollIntoView({ block: 'center' }));
  };
  UI.showSettings = function () {
    UI.buildSettings();
    UI.openSheet('settings');
  };
  UI.showActEnd = function (act) {
    act = act || (G.Acts || [])[0];
    UI.actEndAct = act;
    $('aeTitle').textContent = 'Act ' + act.n + ' complete';
    $('aeText').textContent = act.done;
    const more = !!G.Levels.find((l) => l.id === act.to + 1);
    $('aeNext').style.display = more ? '' : 'none';
    $('aeAgain').textContent = 'Replay Act ' + act.n;
    UI.openSheet('actend');
  };
  // the House Map: the ground at the bottom, one floor per act (the house grows upward as the game does), the roof on top.
  // CSS reverses the stack, so the DOM stays in level order. A solved room lights its window (with its postcard as the view),
  // an act whose rooms are all lit warms its floor, and finding every secret of an act gilds its frame.
  UI.buildLevels = function () {
    const grid = $('grid');
    const d = G.Save.data;
    grid.innerHTML = '';
    const ground = document.createElement('div');
    ground.className = 'ground';
    ground.innerHTML = '<span>Snug</span>';
    grid.appendChild(ground);
    const acts = G.Acts || [];
    const floors = {};
    let rooms = grid,
      lit = 0,
      current = null;
    G.Levels.forEach((def) => {
      const act = acts.find((a) => def.id >= a.from && def.id <= a.to);
      if (act && !floors[act.n]) {
        const f = document.createElement('div');
        f.className = 'floor f' + act.n;
        const h = document.createElement('div');
        h.className = 'actHead';
        h.textContent = 'Act ' + act.n + ' · ' + act.name;
        const r = document.createElement('div');
        r.className = 'rooms';
        f.appendChild(h);
        f.appendChild(r);
        grid.appendChild(f);
        floors[act.n] = { el: f, rooms: r, ids: [], secrets: [], lit: 0 };
      }
      const F = act && floors[act.n];
      if (F) rooms = F.rooms;
      const unlocked = def.id <= d.level || d.level >= 99;
      const st = d.stars[def.id] || [false, false, false];
      const b = document.createElement('button');
      b.className = 'node' + (unlocked ? '' : ' lock') + (st[0] ? ' done' : '');
      b.innerHTML = '<b>' + def.id + '</b><span>' + st.map((v) => '<i class="' + (v ? 'on' : '') + '"></i>').join('') + '</span>';
      b.title = def.name;
      const card = d.cards && d.cards[def.id];
      if (card && card.img && st[0]) {
        b.classList.add('card');
        b.style.backgroundImage = 'linear-gradient(rgba(20,16,30,0.05), rgba(20,16,30,0.5)), url(' + card.img + ')';
      }
      if (st[0]) lit++;
      if (F) {
        F.ids.push(def.id);
        if (st[0]) F.lit++;
        if (def.secret) F.secrets.push(!!d.secrets[def.id]);
      }
      if (unlocked && !st[0] && !current) current = b; // the first room still dark is where the player is
      b.onclick = () => {
        if (!unlocked) return;
        UI.closeSheet('levels');
        UI.hideMenu();
        G.Game.startLevel(def.id);
      };
      rooms.appendChild(b);
    });
    for (const n in floors) {
      const F = floors[n];
      if (F.lit === F.ids.length) F.el.classList.add('lit');
      if (F.secrets.length && F.secrets.every(Boolean)) F.el.classList.add('gold');
    }
    const roof = document.createElement('div');
    roof.className = 'roof';
    roof.innerHTML =
      '<svg viewBox="0 0 320 70" preserveAspectRatio="none"><defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b4705a"/><stop offset="1" stop-color="#8a4f40"/></linearGradient></defs>' +
      '<rect x="236" y="2" width="26" height="30" rx="3" fill="#7d4a3d"/><rect x="232" y="0" width="34" height="7" rx="3" fill="#946052"/>' +
      '<polygon points="0,70 44,10 276,10 320,70" fill="url(#rg)"/><polygon points="0,70 44,10 276,10 320,70" fill="none" stroke="rgba(255,235,210,0.35)" stroke-width="2"/>' +
      '<g stroke="rgba(60,25,18,0.28)" stroke-width="1.4">' + [26, 42, 58].map((y) => '<line x1="' + (40 - (y - 10) * 0.9) + '" y1="' + y + '" x2="' + (280 + (y - 10) * 0.9) + '" y2="' + y + '"/>').join('') + '</g></svg>' +
      '<span>' + lit + ' of ' + G.Levels.length + ' rooms lit</span>';
    grid.appendChild(roof);
    UI.houseCurrent = current || grid.querySelector('.node:last-of-type');
  };
  UI.buildSettings = function () {
    const box = $('opts');
    const s = G.Save.data.settings;
    box.innerHTML = '';
    const row = (key, label, fn) => {
      const b = document.createElement('button');
      b.className = 'opt' + (s[key] ? ' on' : '');
      b.innerHTML = '<span>' + label + '</span><i></i>';
      b.onclick = () => {
        s[key] = !s[key];
        b.classList.toggle('on', s[key]);
        G.Save.save();
        if (fn) fn(s[key]);
      };
      box.appendChild(b);
    };
    row('sound', 'Sound effects', (v) => G.Audio.settings({ sfx: v }));
    row('music', 'Ambience & chords', (v) => G.Audio.settings({ music: v }));
    row('haptics', 'Haptics', (v) => (G.Haptics.enabled = v));
    row('reduce', 'Reduce motion', (v) => (G.Fx.reduce = v));
    row('patterns', 'Shape patterns', (v) => (G.Art.patternMode = v));
    // earned cosmetics: tap to cycle through what has been earned; the next reward and how to get it is shown underneath
    const picker = (kind) => {
      const K = G.Meta.KINDS[kind];
      const b = document.createElement('button');
      b.className = 'opt pick';
      const render = () => {
        const cur = G.Meta.item(kind, G.Meta.pick(kind));
        const next = K.items.find((i) => !i.ok());
        b.innerHTML =
          '<span>' + K.label + ': <b>' + cur.name + '</b><small>' + (next ? 'Next: ' + next.name + ' — ' + next.how : 'Everything earned') + '</small></span>' +
          (kind === 'skin' ? '<canvas width="264" height="68"></canvas>' : '<em>♪</em>');
        if (kind === 'skin') {
          const c = b.querySelector('canvas').getContext('2d');
          c.scale(2, 2);
          G.Art.cableSample(c, 132, 34, cur.id, '#e4685a');
        }
      };
      b.onclick = () => {
        G.Meta.cycle(kind);
        render();
        const A = G.Audio;
        if (kind === 'skin') {
          A.pluck(64, 0.7, 0);
          setTimeout(() => A.pluck(67, 0.6, 0), 130);
        } else {
          A.chime(3);
          setTimeout(() => A.chime(5), 140);
          setTimeout(() => A.chime(7), 280);
        }
      };
      render();
      box.appendChild(b);
    };
    picker('skin');
    picker('chime');
    const reset = document.createElement('button');
    reset.className = 'opt danger';
    reset.innerHTML = '<span>Reset progress</span><i>⟲</i>';
    reset.onclick = () => {
      if (reset.dataset.arm) {
        G.Save.reset();
        UI.buildLevels();
        UI.toast('Progress reset');
        reset.dataset.arm = '';
        reset.firstChild.textContent = 'Reset progress';
      } else {
        reset.dataset.arm = '1';
        reset.firstChild.textContent = 'Tap again to confirm';
        setTimeout(() => {
          reset.dataset.arm = '';
          reset.firstChild.textContent = 'Reset progress';
        }, 2500);
      }
    };
    box.appendChild(reset);
    if (location.search.indexOf('tune') >= 0 || location.search.indexOf('debug') >= 0) {
      const t = document.createElement('button');
      t.className = 'opt';
      t.innerHTML = '<span>Tuning panel</span><i>⚙</i>';
      t.onclick = () => G.Tune.toggle();
      box.appendChild(t);
    }
  };
})();
