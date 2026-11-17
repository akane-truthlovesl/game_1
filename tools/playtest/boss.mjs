// Level 30 (Jam Session, the boss) behaviour probe, with real mouse input:  node boss.mjs
//  1. the clock first: Hat plugged before Tick waits in standby, and its bubble names Tick; once Tick is locked on, Hat is on
//  2. a loose voice of the groove pops out on the thump (Snare is left unlocked through its grace)
//  3. the stage microphone tapped three times is the golden microphone (the secret)
//  4. the spotlights come up as the band locks in, and are all on at the Wake
//  5. the Wake is the finale: the pad chord, the lullaby (eight notes, one per voice) and the music-box tag, with the devices hopping
import { launch, sleep, toClient, URL } from './common.mjs';
const { browser, page, logs } = await launch({ dpr: 1 });
const ev = (fn, a) => page.evaluate(fn, a);
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };

async function setup() {
  await page.goto(URL + '?level=30'); await sleep(500);
  await page.mouse.click(8, 420); // a first touch unlocks the audio
  await sleep(300);
  await ev(() => {
    const wait = setInterval(() => {
      const A = window.__snug && window.__snug.G && window.__snug.G.Audio;
      if (!A) return;
      clearInterval(wait);
      window.__inst = [];
      const f = A.inst;
      A.inst = function (voice, midi, vel, pan, when) { window.__inst.push({ voice, midi, at: (A.now() || 0) + (when || 0) }); return f && f.apply(this, arguments); };
    }, 20);
  });
  for (let i = 0; i < 40 && (await ev(() => window.__snug.G.Game.room.phase)) !== 'playing'; i++) await sleep(200);
}
const st = (id) => ev((id) => { const r = window.__snug.G.Game.room, rt = r.devRT[id]; return { p: rt.p, needs: rt.needs ? JSON.stringify(rt.needs) : null }; }, id);
const seated = (id) => ev((id) => window.__snug.G.Game.room.st.seat[id] || null, id);
const locked = (id) => ev((id) => !!(window.__snug.G.Game.room.st.flags.locked || {})[id], id);
const popped = () => ev(() => window.__snug.G.Game.room.bassRT.popped);
const phase = () => ev(() => window.__snug.G.Game.room.phase);

// a real drag of a plug from where it is to a socket, then a short settle
async function seatPlug(plugId, sockId, settle = 0) {
  const info = await ev(([p, s]) => { const G = window.__snug.G, r = G.Game.room, T = G.T; const pl = r.plugRT[p], sk = r.L.socketsById[s]; return { from: [pl.x, pl.y], to: [sk.x, sk.y], off: [-T.offX, -T.offY] }; }, [plugId, sockId]);
  const f = (q) => [q[0] + info.off[0], q[1] + info.off[1]];
  const path = [info.from, f([(info.from[0] + info.to[0]) / 2, (info.from[1] + info.to[1]) / 2]), f(info.to)];
  const cl = []; for (const q of path) cl.push(await toClient(page, q[0], q[1]));
  await page.mouse.move(cl[0][0], cl[0][1]); await page.mouse.down();
  for (let i = 1; i <= 24; i++) { const u = (i / 24) * 2, k = Math.min(1, Math.floor(u)), fr = u - k; await page.mouse.move(cl[k][0] + (cl[k + 1][0] - cl[k][0]) * fr, cl[k][1] + (cl[k + 1][1] - cl[k][1]) * fr); await sleep(36); }
  await sleep(150); await page.mouse.up(); await sleep(settle);
}
// a quarter turn and a bit round a seated plug's collar, from the notch
async function twist(plugId) {
  await page.waitForFunction((p) => window.__snug.G.Game.room.plugRT[p].state === 'seated', plugId, { timeout: 2500 }).catch(() => {});
  const c = await ev((p) => { const prt = window.__snug.G.Game.room.plugRT[p]; return [prt.x, prt.y]; }, plugId);
  const cl = []; for (let i = 0; i <= 14; i++) { const a = -Math.PI / 2 + (i / 14) * 1.9; cl.push(await toClient(page, c[0] + Math.cos(a) * 24, c[1] + Math.sin(a) * 24)); }
  await page.mouse.move(cl[0][0], cl[0][1]); await page.mouse.down();
  for (let i = 1; i < cl.length; i++) { await page.mouse.move(cl[i][0], cl[i][1]); await sleep(28); }
  await page.mouse.up(); await sleep(150);
}
// seat a voice and lock it at once: the recipe's usual step (the grace period is long enough for it)
async function seatAndLock(plugId, sockId) {
  await seatPlug(plugId, sockId, 0);
  await twist(plugId);
}

// ---- 1: the clock first
await setup();
await seatAndLock('hat', 'S.2'); // the hat before the clock: it is locked, but it waits for Tick
let s = await st('hat');
const need = s.needs ? JSON.parse(s.needs) : null;
ok(s.p === 'standby' && need && need.leader === 'tick', 'Hat plugged and locked before Tick waits in standby, its bubble naming Tick (' + (need ? need.why + ' ' + need.leader : 'none') + ')');
await seatAndLock('tick', 'S.1');
s = await st('tick');
ok(s.p === 'on' && (await locked('tick')), 'Tick, the clock, locks on and wakes');
await sleep(300);
s = await st('hat');
ok(s.p === 'on', 'and Hat, which listens to him, is on at once');
// ---- 2: the microphone: three taps
const [mx, my] = await toClient(page, 330, 588);
for (let i = 0; i < 3; i++) { await page.mouse.click(mx, my); await sleep(220); }
ok(await ev(() => !!window.__snug.G.Game.room.secretFound), 'three taps on the stage microphone: the golden microphone (the secret)');
// ---- 3: a voice left loose through its grace pops out on the thump
await seatPlug('snare', 'S.3', 0);
const p0 = await popped();
await sleep(3000);
ok((await popped()) > p0 && (await seated('snare')) === null, 'a voice left loose through its grace is popped out by the thump (' + (await popped()) + ' pops)');
// ---- 4: the rest of the band, locked as they hop in (Snare is re-seated and locked now)
await seatAndLock('snare', 'S.3');
ok((await locked('snare')) === true, 'Snare seated again and locked');
const lit1 = await ev(() => window.__snug.G.Game.room.decorRT[1].lit);
await seatAndLock('chord', 'S.6');
await seatAndLock('tom', 'S.5');
const lit2 = await ev(() => window.__snug.G.Game.room.decorRT[1].lit);
ok(lit2 > 0.3, 'the first spotlight comes up as the band locks in (lit ' + lit2.toFixed(2) + ', was ' + lit1.toFixed(2) + ')');
await seatAndLock('bass', 'S.4');
await seatAndLock('bell', 'S.8');
await sleep(600);
const ph = await phase();
ok(ph === 'waking' || ph === 'settling', 'seven locked in the right pockets, the room wakes (' + ph + ')');

await sleep(4200);
const fin = await ev(() => window.__inst.slice().map((n) => ({ voice: n.voice, midi: n.midi })));
ok(fin.some((n) => n.voice === 'chord' && n.midi === 48) && fin.some((n) => n.voice === 'celesta' && n.midi === 84), 'the finale: the pad chord comes up, and a music-box tag closes the lullaby');
const spots = await ev(() => { const r = window.__snug.G.Game.room; return (r.def.decor || []).map((d, i) => [d.art, r.decorRT[i].lit]).filter(([a]) => a === 'spot').map(([, l]) => +l.toFixed(2)); });
ok(spots.length === 2 && spots.every((l) => l > 0.9), 'at the Wake both spotlights are on (' + spots.join(', ') + ')');
console.log('LOGS:', logs.join('\n') || 'none');
console.log(fails ? fails + ' FAILED' : 'all boss probes passed');
await browser.close();
process.exit(fails ? 1 : 0);
