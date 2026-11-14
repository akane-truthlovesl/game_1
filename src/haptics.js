/* Snug — haptics.js : vibration patterns (Android) with a best-effort iOS fallback.
   The game is complete on visuals alone; haptics are a bonus. All calls come from user-gesture handlers when possible. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const PAT = {
    grab: 10,
    magnet: 6,
    seat: 26,
    seatFat: 38,
    pop: 14,
    refuse: [12, 40, 12],
    switch: 20,
    win: [18, 60, 18, 60, 40],
    poke: 8,
    cut: [40, 50, 20, 30, 60],
    pluck: 5,
    tock: 6,
    mend: 8,
    thread: 12,
    spin: 5,
    tick: 5,
  };
  let iosEl = null;
  const H = (G.Haptics = {
    enabled: true,
    scale: 1,
    supported: typeof navigator !== 'undefined' && !!navigator.vibrate,
    // k: optional 0..1.5 intensity multiplier (a gentle placement is a softer tap than a fling)
    pulse(name, k) {
      if (!H.enabled) return;
      const p = PAT[name];
      if (p === undefined) return;
      const sc = H.scale * (k === undefined ? 1 : k);
      try {
        if (H.supported) {
          if (Array.isArray(p)) navigator.vibrate(p.map((v, i) => (i % 2 === 0 ? Math.max(4, Math.round(v * sc)) : v)));
          else navigator.vibrate(Math.max(4, Math.round(p * sc)));
        } else if (G.U.isBrowser) {
          // iOS 17.4+: toggling a <input switch> inside a gesture yields a light tap. Best effort only.
          if (!iosEl) {
            iosEl = document.createElement('label');
            iosEl.style.cssText = 'position:fixed;left:-99px;top:-99px;opacity:0;pointer-events:none';
            const i = document.createElement('input');
            i.type = 'checkbox';
            i.setAttribute('switch', '');
            iosEl.appendChild(i);
            document.body.appendChild(iosEl);
          }
          iosEl.click();
        }
      } catch (e) {}
    },
  });
})();
