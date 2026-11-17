/* Snug — mech-skyline.js : the finale of the city (Act 5, Level 50 "Blackout"). At the wake the house sings the lullaby of Level 30, and a thin
   gold cable runs from window to window through the lit skyline, one window after another, like the credits of a house: every room the
   player has solved, and this one. The window grid is the skyline art's own (Art.skylineWins), so the cable runs through the real windows.
   A level turns it on with `skyline: true`. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const Room = G.Room;
  const A = () => G.Audio;
  const MEL = [72, 76, 79, 76, 72, 79, 76, 72]; // the lullaby figure of Level 30
  const STEP = 0.42;

  Room.prototype.skylineWake = function () {
    const d = (this.def.decor || []).find((k) => k.art === 'skyline');
    if (!d || !G.Art || !G.Art.skylineWins) return;
    const solved = (G.Save && G.Save.data && G.Save.data.stars && Object.keys(G.Save.data.stars).length) || 0;
    const lit = G.Art.skylineWins(d).filter((w) => w.index < solved + 1); // this room's own window lights as the credits begin
    // the credits: the postcards the player has earned, the last six, as small pictures with their captions
    const cards = Object.entries((G.Save && G.Save.data && G.Save.data.cards) || {}).slice(-6).map(([id, c]) => {
      const img = new Image();
      if (c && c.img) img.src = c.img;
      return { id, img, cap: (c && c.cap) || '', name: (c && c.name) || '' };
    });
    this.skyRT = { lit, t: 0, cards };
    A().inst && A().inst('chord', 48, 0.4, 0, 0.4);
    MEL.forEach((n, i) => A().inst && A().inst('celesta', n, 0.6, i % 2 ? 0.3 : -0.3, 0.6 + i * STEP));
  };

  // the credits cable: from one lit window to the next, drawn gold, a window every 0.25 s
  Room.prototype.skylineDraw = function (ctx) {
    const S = this.skyRT;
    if (!S || !S.lit.length) return;
    S.t += 1 / 60;
    const n = Math.min(S.lit.length, Math.floor(S.t / 0.25) + 1);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,214,120,0.85)';
    ctx.lineWidth = 1.6;
    ctx.shadowColor = 'rgba(255,214,120,0.6)';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const w = S.lit[i];
      if (i === 0) ctx.moveTo(w.x, w.y);
      else ctx.lineTo(w.x, w.y);
    }
    ctx.stroke();
    ctx.restore();
    // the credits row: once the cable has passed the last window, the postcards come up along the top of the skyline
    const done = S.lit.length * 0.25 + 0.6;
    if (S.t > done && S.cards.length) {
      const k = Math.min(1, (S.t - done) / 0.8);
      ctx.save();
      ctx.globalAlpha = k;
      S.cards.forEach((c, i) => {
        const x = 62 + i * 52,
          y = 196;
        ctx.fillStyle = 'rgba(250,244,228,0.95)';
        ctx.fillRect(x, y, 46, 34);
        if (c.img && c.img.complete && c.img.naturalWidth) ctx.drawImage(c.img, x + 2, y + 2, 42, 24);
        ctx.font = '600 6px Georgia, serif';
        ctx.fillStyle = '#4a3a22';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(c.cap || c.name || '').slice(0, 14), x + 23, y + 29);
      });
      ctx.restore();
    }
  };
})();
