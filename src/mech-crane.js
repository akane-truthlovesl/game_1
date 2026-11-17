/* Snug — mech-crane.js : the crane (Act 5, Level 43 "Crane Game"). A magnet head hangs on a cable over the bench. Drag the head (a press
   within reach of it) to move it; a tap switches the magnet. Tap over a prize and the magnet takes it; the prize moves with the head. Tap
   again over the tray and it lands there (inside the tray it is home); tap anywhere else and it drops, and that drop is counted. A prize is
   a tall block (its rectangle is an obstacle, moved with it), and a socket under a prize that has not been lifted cannot take a plug
   ("covered"). Rules.* reads the head and the prizes from st.flags (crane, prizes), and hints the next move. A level turns it on with
   `crane: { start, tray, prizes }`. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const U = G.U,
    Rules = G.Rules,
    Fx = G.Fx,
    Room = G.Room;
  const A = () => G.Audio;
  const H = () => G.Haptics;
  const GRAB_R = 34; // u: how close a press must be to the head to take it
  const MAG_R = 34; // u: how close the head must be to a prize for the magnet to take it
  const MAT = { x0: 18, x1: 342, y0: 44, y1: 616 };
  const inRect = (x, y, r) => Math.abs(x - r.x) <= r.w / 2 && Math.abs(y - r.y) <= r.h / 2;

  Room.prototype.craneInit = function () {
    const d = this.def.crane;
    const C = { x: d.start.x, y: d.start.y, on: false, held: false, ptr: null, down: null, moved: 0, grip: null, drops: 0, tray: d.tray, prizes: [] };
    d.prizes.forEach((p, i) => {
      const pz = { id: p.id || 'p' + (i + 1), x: p.x, y: p.y, w: p.w, h: p.h, letter: p.letter || '', att: false, inTray: false };
      pz.ob = { shape: 'rrect', x: pz.x, y: pz.y, w: pz.w, h: pz.h, rot: 0, cr: 4, tall: true, art: 'craneprize', letter: pz.letter };
      this.L.obstacles.push(pz.ob); // a prize is a tall block: the cables go round it, and it moves with the head
      C.prizes.push(pz);
    });
    this.craneRT = C;
    this.craneSync();
  };

  // the state the rules read: where the head is, what it holds, and where each prize is
  Room.prototype.craneSync = function () {
    const C = this.craneRT;
    for (const pz of C.prizes) {
      pz.ob.x = pz.x;
      pz.ob.y = pz.y;
    }
    this.st.flags.crane = { x: C.x, y: C.y, on: C.on, att: C.grip ? C.grip.id : null };
    this.st.flags.tray = C.tray;
    this.st.flags.prizes = C.prizes.map((p) => ({ id: p.id, x: p.x, y: p.y, w: p.w, h: p.h, att: p.att, inTray: p.inTray }));
  };

  Room.prototype.craneUpdate = function () {
    if (this.craneRT) this.craneSync();
  };

  Room.prototype.beginCrane = function (ptrId, x, y) {
    const C = this.craneRT;
    if (!C || this.phase !== 'playing' || C.held) return false;
    if (Math.hypot(x - C.x, y - C.y) > GRAB_R) return false;
    C.held = true;
    C.ptr = ptrId;
    C.down = { x, y, t: this.t };
    C.moved = 0;
    this.cancelHint();
    this.idle = 0;
    H().pulse('grab');
    return true;
  };
  Room.prototype.moveCrane = function (x, y) {
    const C = this.craneRT;
    if (!C || !C.held) return;
    const nx = U.clamp(x, MAT.x0 + 16, MAT.x1 - 16),
      ny = U.clamp(y, MAT.y0 + 16, MAT.y1 - 16);
    C.moved += Math.hypot(nx - C.x, ny - C.y);
    C.x = nx;
    C.y = ny;
    if (C.grip) {
      C.grip.x = C.x;
      C.grip.y = C.y;
    }
  };
  Room.prototype.endCrane = function () {
    const C = this.craneRT;
    if (!C || !C.held) return;
    C.held = false;
    C.ptr = null;
    if (C.moved < 10) this.craneTap(); // a tap on the head: the magnet switches
  };
  Room.prototype.craneTap = function () {
    const C = this.craneRT;
    if (!C.on) {
      // the magnet is off: it takes the nearest prize under the head, if there is one
      let best = null,
        bd = MAG_R;
      for (const pz of C.prizes) {
        const d = Math.hypot(pz.x - C.x, pz.y - C.y);
        if (d < bd) {
          best = pz;
          bd = d;
        }
      }
      C.on = true;
      if (best) {
        best.att = true;
        best.inTray = false;
        C.grip = best;
        A().sfx.magnet && A().sfx.magnet();
        Fx.sparkle(C.x, C.y, '#ffe9a8', 8);
      } else {
        A().sfx.tick && A().sfx.tick(); // nothing under the magnet: it hums and waits
      }
    } else {
      C.on = false;
      const pz = C.grip;
      if (pz) {
        C.grip = null;
        pz.att = false;
        pz.inTray = inRect(pz.x, pz.y, C.tray);
        if (!pz.inTray) C.drops += 1; // a drop away from the tray is counted (the unbroken-run secret)
        A().sfx.thud && A().sfx.thud(pz.inTray ? 0.3 : 0.7);
        Fx.sparkle(pz.x, pz.y, pz.inTray ? '#d8ffd0' : '#ffd0c0', 6);
      }
    }
    this.craneSync();
  };

  // a magnet head on a cable, over the bench: the cable goes up to the top edge, the head is a brass claw with a magnet face
  Room.prototype.craneDraw = function (ctx, t) {
    const C = this.craneRT;
    ctx.save();
    // the tray: a shallow box, labelled
    const tr = C.tray;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(tr.x - tr.w / 2, tr.y - tr.h / 2, tr.w, tr.h, 6) : ctx.rect(tr.x - tr.w / 2, tr.y - tr.h / 2, tr.w, tr.h);
    ctx.fillStyle = 'rgba(40,46,58,0.55)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(214,190,130,0.7)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.font = '600 9px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(240,226,190,0.8)';
    ctx.fillText('tray', tr.x, tr.y - tr.h / 2 - 7);
    // the prizes: wooden blocks with a letter; a prize on the magnet is lifted a little, and its shadow stays on the bench
    for (const pz of C.prizes) {
      ctx.save();
      ctx.translate(pz.x, pz.y);
      if (pz.att) {
        ctx.beginPath();
        ctx.ellipse(0, pz.h * 0.5 + 10, pz.w * 0.45, 5, 0, 0, U.TAU);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fill();
      }
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(-pz.w / 2, -pz.h / 2, pz.w, pz.h, 5) : ctx.rect(-pz.w / 2, -pz.h / 2, pz.w, pz.h);
      ctx.fillStyle = pz.att ? '#e6c48a' : '#d9b374';
      ctx.fill();
      ctx.strokeStyle = '#8a6a3a';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.font = '700 16px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#5a3f1e';
      ctx.fillText(pz.letter, 0, 1);
      ctx.restore();
    }
    // the cable, from the top edge to the head
    ctx.beginPath();
    ctx.moveTo(C.x, MAT.y0 - 6);
    ctx.lineTo(C.x, C.y - 12);
    ctx.strokeStyle = '#6b6f7a';
    ctx.lineWidth = 2;
    ctx.stroke();
    // the head: a brass ring, with a magnet face that glows when it is on
    ctx.beginPath();
    ctx.arc(C.x, C.y, 13, 0, U.TAU);
    ctx.fillStyle = '#c9a050';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(C.x, C.y, 8, 0, U.TAU);
    ctx.fillStyle = C.on ? '#fff4c8' : '#5b5f6a';
    ctx.fill();
    if (C.on) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.beginPath();
      ctx.arc(C.x, C.y, 22 + 2 * Math.sin(t * 6), 0, U.TAU);
      ctx.fillStyle = 'rgba(255,230,160,0.22)';
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  };
})();
