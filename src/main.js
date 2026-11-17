/* Snug — main.js : boot and the loop. */
(function () {
  'use strict';
  const G = globalThis.Snug;

  function boot() {
    G.Tune.load();
    G.Save.load();
    const params = new URLSearchParams(location.search);
    const s = G.Save.data.settings;
    G.Audio.settings({ sfx: s.sound, music: s.music });
    G.Haptics.enabled = s.haptics;
    G.Fx.reduce = s.reduce || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    G.Art.patternMode = s.patterns;
    G.Meta.init(); // earned cable skins and chime sets (what an old save has earned is not news)
    const canvas = document.getElementById('c');
    G.Game.init(canvas);
    G.UI.init(G.Game);
    if (params.get('tune')) G.Tune.toggle();
    if (params.get('slow')) G.timeScale = parseFloat(params.get('slow')) || 1;
    if (params.get('debug')) G.debug = true;
    // dev: ?def=<url-encoded level JSON> previews any level definition (used by tools/playtest/shots.mjs)
    if (params.get('def')) {
      try {
        const d = JSON.parse(params.get('def'));
        d.id = d.id || 99;
        G.Levels = G.Levels.filter((l) => l.id !== d.id);
        G.Levels.push(d);
        G.Game.startLevel(d.id);
      } catch (e) {
        console.error('bad ?def', e);
        G.Game.startTitle();
      }
    } else if (params.get('toy')) G.Game.startToy();
    else if (params.get('level')) G.Game.startLevel(parseInt(params.get('level'), 10));
    else G.Game.startTitle();
    const loop = (ts) => {
      try {
        G.Game.frame(ts);
      } catch (e) {
        console.error(e);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame((ts) => {
      G.Game.last = ts;
      requestAnimationFrame(loop);
    });
    window.__snug = { G, Game: G.Game };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
