/* Snug — mech-boss.js : "Jam Session" (Level 30), the boss of Act 3.
   The show, in the order the room needs it. The clock first: Tick is the leader on the groove, and the others listen to him, so they
   wait in standby until he is on. The groove: eight pads, one of them silent, each voice in its pocket (Level 29's engine). The bass:
   the speaker wall kicks, and a voice that is not locked in pops out on the thump (Level 28's engine). The spotlights come up one at a
   time as the band locks in. At the Wake the room plays the finale: a pad chord under a lullaby, each voice in turn, the devices
   hopping in time. This file owns only the stage (the spotlights and the lullaby); the mechanics are the sequencer, the chain and the
   bass, and they already know how to stand the band down. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const U = G.U,
    Room = G.Room;
  const A = () => G.Audio;
  // an original lullaby figure, eight notes in C major, sung by the voices in the order they stand (left to right)
  const MEL = [72, 76, 79, 76, 72, 79, 76, 72];
  const STEP = 0.42; // seconds between the notes of the lullaby
  // the lullaby's voice for each groove voice (the hat and the snare have no pitch, so they sing with a pluck and a wood block)
  const VOICE = { wood: 'wood', hat: 'pluck', snare: 'wood', bass: 'bass', tom: 'tom', chord: 'chord', bell: 'bell' };

  // the spotlights: one more comes up each time a sixth (then a third, then all) of the band is locked in; at the Wake, all of them
  Room.prototype.bossUpdate = function (dt) {
    const locked = this.st.flags.locked || {},
      n = this.L.plugs.length;
    const k = this.L.plugs.filter((p) => locked[p.id]).length,
      frac = n ? k / n : 0;
    const spots = [];
    (this.def.decor || []).forEach((d, i) => {
      if (d.art === 'spot') spots.push(i);
    });
    spots.forEach((i, j) => {
      const want = this.completed || frac >= (j + 1) / (spots.length + 1) ? 1 : 0;
      this.decorRT[i].lit = U.damp(this.decorRT[i].lit || 0, want, 0.08, dt);
    });
  };

  // the finale: the pad chord comes up, then the lullaby is sung one voice at a time, each device hopping as its note goes by,
  // and a music-box tag closes it. Every note is scheduled on the audio clock, so the figure keeps perfect time.
  Room.prototype.bossWake = function () {
    const devs = this.L.devices
      .filter((d) => d.seq)
      .sort((a, b) => a.x - b.x);
    const T0 = 1.0;
    A().inst('chord', 48, 0.5, 0, T0);
    MEL.forEach((note, i) => {
      const d = devs[i % devs.length];
      A().inst(VOICE[d.seq.voice] || 'pluck', note, 0.7, this.pan(d.x), T0 + i * STEP);
      this.later(T0 + i * STEP, () => this.devRT[d.id].hopS.kick(0.9));
    });
    A().inst('celesta', 84, 0.5, 0, T0 + MEL.length * STEP + 0.2);
  };
})();
