/* Snug — save.js : versioned localStorage (progress, stars, secrets, settings). Never throws; the game runs without storage. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const KEY = 'snug.save.v1';
  const defaults = () => ({
    v: 1,
    level: 1, // furthest unlocked
    stars: {}, // id -> [lit, tidy, clean]
    secrets: {}, // id -> true
    cards: {}, // id -> { img (small jpeg data URL), cap, name }: the postcards
    seen: {}, // 'skin:rope' -> true: earned cosmetics the player has already been told about (meta.js)
    settings: { sound: true, music: true, haptics: true, reduce: false, patterns: false, leftHand: false, skin: 'braid', chime: 'bell' },
  });
  const S = (G.Save = {
    data: defaults(),
    load() {
      try {
        const s = localStorage.getItem(KEY);
        if (!s) return;
        const o = JSON.parse(s);
        if (!o || o.v !== 1) return;
        const d = defaults();
        S.data = Object.assign(d, o, { settings: Object.assign(d.settings, o.settings || {}) });
      } catch (e) {}
    },
    save() {
      try {
        localStorage.setItem(KEY, JSON.stringify(S.data));
      } catch (e) {}
    },
    complete(id, stars) {
      const cur = S.data.stars[id] || [false, false, false];
      S.data.stars[id] = [cur[0] || stars.lit, cur[1] || stars.tidy, cur[2] || stars.clean];
      if (id + 1 > S.data.level) S.data.level = id + 1;
      S.save();
    },
    card(id, c) {
      S.data.cards = S.data.cards || {};
      S.data.cards[id] = c;
      S.save(); // (storage may be full or unavailable: save() never throws)
    },
    secret(id) {
      S.data.secrets[id] = true;
      S.save();
    },
    reset() {
      S.data = defaults();
      S.save();
    },
    starCount(id) {
      const s = S.data.stars[id];
      return s ? s.filter(Boolean).length : 0;
    },
  });
})();
