/* Snug — mech-magnet.js : Magnet Moon (Act 4, Level 34). Metal pulls. A paperclip (a decoy) is metal: a plug let go within its reach sticks
   to it and goes no further. It is not a socket, so a stuck plug powers nothing; the lamp stays dark and the caption asks whether that is
   a socket. To take it off you peel it: press the stuck plug and pull firmly, and the clip lets go with a small shk. The clip holds the
   plug where it is while the finger stays close, so a gentle touch does nothing and a firm pull is the only way off. The sockets (the rail's
   holes) are the only things that power a thing; Rules.* does not know the decoys exist. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const U = G.U,
    Room = G.Room,
    Fx = G.Fx,
    Art = G.Art;
  const A = () => G.Audio;
  const TAU = U.TAU;
  const REACH = 26; // u: a plug let go this close to a clip sticks to it
  const PEEL = 24; // u: the finger must pull this far from the clip to take the plug off it

  Room.prototype.magnetInit = function () {
    this.magnetRT = {
      clips: (this.def.decoys || []).map((d) => ({ id: d.id, x: d.x, y: d.y, r: d.r || 13, stuck: null, peeled: 0 })),
      peeledSet: {},
    };
  };
  // the clip a released plug sticks to, if any. Reach is measured from the finger that let go (a held plug floats above the finger)
  Room.prototype.magnetNear = function (prt, g) {
    if (!this.magnetRT) return null;
    const x = g && g.fx !== undefined ? g.fx : prt.x,
      y = g && g.fy !== undefined ? g.fy : prt.y;
    for (const c of this.magnetRT.clips) if (Math.hypot(x - c.x, y - c.y) < REACH) return c;
    return null;
  };
  // a plug let go on a clip: it is pinned to the clip (its cable leaves toward the device), and powers nothing
  Room.prototype.magnetStick = function (prt, clip) {
    const dev = prt.plug.device,
      dx = dev.port.x - clip.x,
      dy = dev.port.y - clip.y,
      d = Math.hypot(dx, dy) || 1;
    prt.stuckTo = clip;
    clip.stuck = prt.id;
    prt.x = clip.x;
    prt.y = clip.y;
    prt.rope.pin(clip.x, clip.y, dx / d, dy / d);
    prt.state = 'rest';
    prt.hover = null;
    A().sfx.magnet && A().sfx.magnet();
    Fx.sparkle(clip.x, clip.y, '#dfe8ff', 6);
    if (!this.magnetRT.asked) {
      this.magnetRT.asked = true; // the first time, the caption asks what the trap is
      Fx.caption('is that a socket?', clip.x, clip.y - 24, '#e6ecf6');
    }
    this.refreshPower();
  };
  // a grab on a stuck plug: it stays on its clip until the finger pulls firmly away; then the clip lets go
  Room.prototype.magnetMoveGrab = function (prt, g, x, y) {
    const clip = prt.stuckTo;
    if (!clip) return false;
    if (Math.hypot(x - clip.x, y - clip.y) < PEEL) {
      g.fx = clip.x; // the clip holds it
      g.fy = clip.y;
      return true;
    }
    // the peel: the clip lets go, with a small shk, and the plug comes away with the finger
    prt.stuckTo = null;
    clip.stuck = null;
    clip.peeled += 1;
    this.magnetRT.peeledSet[clip.id] = true;
    A().sfx.knock && A().sfx.knock();
    Fx.sparkle(clip.x, clip.y, '#ffffff', 5);
    prt.rope.mode = 1;
    return false;
  };
  // the secret: every clip peeled off at least once by the Wake
  Room.prototype.magnetWakeCheck = function () {
    if (!this.magnetRT || !this.def.secret || this.secretFound) return;
    const all = this.magnetRT.clips.every((c) => this.magnetRT.peeledSet[c.id]);
    if (all) {
      this.secretFound = true;
      this.later(0.9, () => this.onEvent('secret', this.def.secret));
    }
  };
  // the clips: a silver paperclip each, drawn over the table (under the devices)
  Room.prototype.magnetDraw = function (ctx, t) {
    if (!this.magnetRT) return;
    for (const c of this.magnetRT.clips) Art.paperclip(ctx, c.x, c.y, c.stuck ? 1 : 0, t);
  };
})();
