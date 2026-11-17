/* Snug — mech-inset.js : the cutaway inset (Act 4, Level 36 "Hang Time"). The room stays top-down; beside it, at the top right, a
   panel shows the wall from the side: a vertical wall with each socket at its true height, and each plug at its height, with a line from
   a seated plug's socket down to where the plug hangs. It is a SCHEMATIC of heights, not a projection of the cables: the cables are the
   room's own ropes, and the panel only says how high each plug is against its socket. A level turns it on with `inset: true`; the panel
   stays clear of every socket (the sockets sit left of it). */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const Art = G.Art,
    Room = G.Room;
  const PX0 = 262,
    PX1 = 344,
    PY0 = 56,
    PY1 = 300; // the panel, top right
  const WALL = PX0 + 22; // the wall's line, inside the panel
  const PLUGX = PX0 + 44; // where the plugs hang, inside the panel (each plug takes its own column, so two at one height still show)
  // a stage height (44..616) on the panel's height (with a margin top and bottom)
  const heightOf = (y) => PY0 + 26 + ((y - 44) / 572) * (PY1 - PY0 - 52);

  Room.prototype.insetDraw = function (ctx, t) {
    ctx.save();
    // the panel: a dark cut of the station, with a silver edge
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(PX0, PY0, PX1 - PX0, PY1 - PY0, 10) : ctx.rect(PX0, PY0, PX1 - PX0, PY1 - PY0);
    ctx.fillStyle = 'rgba(22,28,42,0.93)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(200,212,230,0.55)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // the wall: a vertical bar, the socket heights on it
    ctx.fillStyle = '#4a5163';
    ctx.fillRect(WALL - 3, PY0 + 12, 6, PY1 - PY0 - 24);
    ctx.font = '600 8px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#e6ecf6';
    ctx.fillText('wall', PX0 + 6, PY0 + 8);
    const sockX = (i) => WALL + 10 + i * 7; // sockets at one height share the wall: each keeps its own column
    this.L.sockets.forEach((sk, i) => {
      const sy = heightOf(sk.y);
      ctx.beginPath();
      ctx.arc(sockX(i), sy, 4, 0, G.U.TAU);
      ctx.fillStyle = Art.KEYCOL[sk.key] || '#fff4d0';
      ctx.fill();
    });
    // each plug at its height; a seated plug's line runs from its socket to where it is
    this.plugList.forEach((prt, j) => {
      const py = heightOf(prt.y),
        col = Art.KEYCOL[prt.plug.key] || '#fff4d0',
        px = PLUGX + j * 9;
      const seat = this.st.seat[prt.id];
      if (seat) {
        const sk = this.L.socketsById[seat];
        ctx.beginPath();
        ctx.moveTo(sockX(this.L.sockets.indexOf(sk)), heightOf(sk.y));
        ctx.lineTo(px, py);
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, G.U.TAU);
      ctx.fillStyle = col;
      ctx.fill();
    });
    ctx.restore();
  };
})();
