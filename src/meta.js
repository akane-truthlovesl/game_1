/* Snug — meta.js : what stars and secrets unlock. Cable skins and chime sets are cosmetic and EARNED (nothing is bought and nothing
   gates a puzzle). The choice lives in Save.data.settings.skin / .chime; an option that is not (or no longer) earned falls back to
   the default. A skin changes the weave and the pluck of a cable, never its colour code; a chime set changes the voice of the
   wake chimes. Act 3+ add their own rewards here. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const D = () => G.Save.data;
  const solved = (id) => !!(D().stars[id] && D().stars[id][0]);
  const starTotal = () => {
    let n = 0;
    for (const k in D().stars) n += D().stars[k].filter(Boolean).length;
    return n;
  };
  const secretTotal = () => Object.keys(D().secrets).length;
  const actDone = (n) => {
    const a = (G.Acts || []).find((x) => x.n === n);
    return !!a && solved(a.to);
  };

  const KINDS = {
    skin: {
      label: 'Cable',
      def: 'braid',
      items: [
        { id: 'braid', name: 'Braid', how: '', ok: () => true },
        { id: 'rope', name: 'Rope', how: 'Finish Act 1', ok: () => actDone(1) },
        { id: 'licorice', name: 'Licorice', how: 'Find 3 secrets', ok: () => secretTotal() >= 3 },
        { id: 'ribbon', name: 'Ribbon', how: 'Earn 20 stars', ok: () => starTotal() >= 20 },
        { id: 'neon', name: 'Neon', how: 'Finish Act 2', ok: () => actDone(2) },
        { id: 'beads', name: 'Bead chain', how: 'Find 8 secrets', ok: () => secretTotal() >= 8 },
        { id: 'crayon', name: 'Crayon', how: 'Finish Act 3', ok: () => actDone(3) },
      ],
    },
    chime: {
      label: 'Chimes',
      def: 'bell',
      items: [
        { id: 'bell', name: 'Bell', how: '', ok: () => true },
        { id: 'marimba', name: 'Marimba', how: 'Finish Act 1', ok: () => actDone(1) },
        { id: 'musicbox', name: 'Music box', how: 'Find 2 secrets', ok: () => secretTotal() >= 2 },
        { id: 'glass', name: 'Glass', how: 'Finish Act 2', ok: () => actDone(2) },
        { id: 'kalimba', name: 'Kalimba', how: 'Earn 30 stars', ok: () => starTotal() >= 30 },
        { id: 'lullaby', name: 'Lullaby box', how: 'Finish Act 3', ok: () => actDone(3) },
      ],
    },
  };

  const Meta = (G.Meta = {
    KINDS,
    item(kind, id) {
      return KINDS[kind].items.find((i) => i.id === id);
    },
    earned(kind, id) {
      const it = Meta.item(kind, id);
      return !!it && it.ok();
    },
    // the selected option, or the default when it is not earned
    pick(kind) {
      const id = D().settings[kind];
      return Meta.earned(kind, id) ? id : KINDS[kind].def;
    },
    apply() {
      G.Art.skin = Meta.pick('skin');
      G.Audio.settings({ skin: Meta.pick('skin'), chime: Meta.pick('chime') });
    },
    // choose the next earned option (a tap on the settings row)
    cycle(kind) {
      const ids = KINDS[kind].items.filter((i) => i.ok()).map((i) => i.id);
      const cur = Meta.pick(kind);
      D().settings[kind] = ids[(ids.indexOf(cur) + 1) % ids.length];
      G.Save.save();
      Meta.apply();
      return D().settings[kind];
    },
    // anything earned since the last look (and marks it seen): [{kind,label,id,name}]
    fresh() {
      D().seen = D().seen || {};
      const out = [];
      for (const kind in KINDS)
        for (const it of KINDS[kind].items) {
          const key = kind + ':' + it.id;
          if (it.ok() && !D().seen[key]) {
            D().seen[key] = true;
            out.push({ kind, label: KINDS[kind].label, id: it.id, name: it.name });
          }
        }
      if (out.length) G.Save.save();
      return out;
    },
    // at boot: what an old save has already earned is not news
    init() {
      Meta.fresh();
      Meta.apply();
    },
  });
})();
