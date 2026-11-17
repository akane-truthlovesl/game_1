// Level 28 (Bass Drop) behaviour probe, with real mouse input:  node bass.mjs
//  1. the speaker wall kicks from 1.8 s on, every 0.652 s (92 beats a minute), on the audio clock
//  2. a loose plug survives its grace period (1.1 s after seating) and is popped out by the first kick after it
//  3. a plug twisted inside its grace period locks (a quarter turn of its collar), stays seated through kicks, and refuses a pull
//  4. a twist back unlocks it, and then a pull takes it out
//  5. a plug held through a thump and seated ON the beat is the secret: a gold plug
//  6. all four locked: the room wakes
import { launch, sleep, toClient, URL } from './common.mjs';
const { browser, page, logs } = await launch({ dpr: 1 });
const ev = (fn, a) => page.evaluate(fn, a);
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };

async function setup() {
  await page.goto(URL + '?level=28'); await sleep(500);
  await page.mouse.click(8, 420); // a first touch unlocks the audio: the kicks are scheduled on the audio clock
  await sleep(300);
  await ev(() => {
    const wait = setInterval(() => {
      const A = window.__snug && window.__snug.G && window.__snug.G.Audio;
      if (!A) return;
      clearInterval(wait);
      window.__kicks = [];
      const f = A.inst;
      A.inst = function (voice, midi, vel, pan, when) { if (voice === 'kick') window.__kicks.push({ at: (A.now() || 0) + (when || 0) }); return f && f.apply(this, arguments); };
    }, 20);
  });
  for (let i = 0; i < 40 && (await ev(() => window.__snug.G.Game.room.phase)) !== 'playing'; i++) await sleep(200);
}
const room = (fn, a) => ev((a2) => { const r = window.__snug.G.Game.room; return (new Function('r', 'a', 'return (' + fn + ')(r, a);'))(r, a2); }, a);
const seated = (id) => ev((id) => window.__snug.G.Game.room.st.seat[id] || null, id);
const locked = (id) => ev((id) => !!(window.__snug.G.Game.room.st.flags.locked || {})[id], id);
const popped = () => ev(() => window.__snug.G.Game.room.bassRT.popped);
const kickT = () => ev(() => window.__snug.G.Game.room.bassRT.kickT);
const roomT = () => ev(() => window.__snug.G.Game.room.t);

// a real drag of a plug from where it is to a socket; `settle` ms are left before returning
async function seatPlug(plugId, sockId, settle = 0) {
  const info = await ev(([p, s]) => { const G = window.__snug.G, r = G.Game.room, T = G.T; const pl = r.plugRT[p], sk = r.L.socketsById[s]; return { from: [pl.x, pl.y], to: [sk.x, sk.y], off: [-T.offX, -T.offY] }; }, [plugId, sockId]);
  const f = (q) => [q[0] + info.off[0], q[1] + info.off[1]];
  const path = [info.from, f([(info.from[0] + info.to[0]) / 2, (info.from[1] + info.to[1]) / 2]), f(info.to)];
  const cl = []; for (const q of path) cl.push(await toClient(page, q[0], q[1]));
  await page.mouse.move(cl[0][0], cl[0][1]); await page.mouse.down();
  for (let i = 1; i <= 24; i++) { const u = (i / 24) * 2, k = Math.min(1, Math.floor(u)), fr = u - k; await page.mouse.move(cl[k][0] + (cl[k + 1][0] - cl[k][0]) * fr, cl[k][1] + (cl[k + 1][1] - cl[k][1]) * fr); await sleep(36); }
  await sleep(150); await page.mouse.up(); await sleep(settle);
}
// a quarter turn and a bit (about 110 degrees) round a seated plug's collar, starting at the notch
async function twist(plugId) {
  // a grab needs the plug at rest in its socket ('seated'), not still sliding home
  await page.waitForFunction((p) => window.__snug.G.Game.room.plugRT[p].state === 'seated', plugId, { timeout: 2000 }).catch(() => {});
  const c = await ev((p) => { const prt = window.__snug.G.Game.room.plugRT[p]; return [prt.x, prt.y]; }, plugId);
  const cl = []; for (let i = 0; i <= 14; i++) { const a = -Math.PI / 2 + (i / 14) * 1.9; cl.push(await toClient(page, c[0] + Math.cos(a) * 24, c[1] + Math.sin(a) * 24)); }
  await page.mouse.move(cl[0][0], cl[0][1]); await page.mouse.down();
  for (let i = 1; i < cl.length; i++) { await page.mouse.move(cl[i][0], cl[i][1]); await sleep(28); }
  await page.mouse.up(); await sleep(150);
}
// a pull: drag the seated plug out of its socket and away from it
async function pullOut(plugId) {
  const info = await ev((p) => { const G = window.__snug.G, r = G.Game.room, T = G.T; const sk = r.L.socketsById[r.st.seat[p]]; return { from: [sk.x, sk.y], off: [-T.offX, -T.offY] }; }, plugId);
  const a = await toClient(page, info.from[0], info.from[1]), b = await toClient(page, info.from[0] + info.off[0] + 30, info.from[1] - 120);
  await page.mouse.move(a[0], a[1]); await page.mouse.down();
  for (let i = 1; i <= 16; i++) { await page.mouse.move(a[0] + (b[0] - a[0]) * i / 16, a[1] + (b[1] - a[1]) * i / 16); await sleep(30); }
  await page.mouse.up(); await sleep(500);
}

// ---- 1: the clock
await setup();
await sleep(2600);
const kicks = await ev(() => window.__kicks.map((k) => k.at));
ok(kicks.length >= 3, 'the speaker wall kicks (' + kicks.length + ' kicks so far)');
const gaps = kicks.slice(1, 4).map((t, i) => t - kicks[i]);
ok(gaps.length >= 2 && gaps.every((g) => Math.abs(g - 0.652) < 0.005), 'every 0.652 s, on the audio clock: ' + gaps.map((g) => g.toFixed(4)).join(', '));
// ---- 2: a loose plug: grace, then a pop
await seatPlug('lefty', 'S.1', 0);
await sleep(900);
ok((await seated('lefty')) === 'S.1', 'a plug seated loose is safe through its grace period (0.9 s)');
const p0 = await popped();
await sleep(2400);
ok((await popped()) > p0 && (await seated('lefty')) === null, 'the first kick after the grace pops it out (popped ' + (await popped()) + ')');
// ---- 3: a twist inside the grace locks it; it stays put through kicks, and refuses a pull
await seatPlug('lefty', 'S.1', 260);
await twist('lefty');
ok((await locked('lefty')) === true, 'a quarter turn of its collar, within the grace, locks it');
await sleep(1500); // two kicks go by
ok((await seated('lefty')) === 'S.1' && (await locked('lefty')), 'a locked plug only shivers through the kicks: still seated, still locked');
await pullOut('lefty');
ok((await seated('lefty')) === 'S.1', 'a pull on a locked plug is refused: it stays in its socket');
// ---- 4: a twist back frees it; then the pull takes it out
await twist('lefty');
ok((await locked('lefty')) === false, 'a twist back unlocks it');
await pullOut('lefty');
ok((await seated('lefty')) === null, 'and then a pull takes it out');
// ---- 5: the secret: a plug held through a thump, seated ON the beat
const rp =await ev(() => { const r = window.__snug.G.Game.room, p = r.plugRT.righty, T = window.__snug.G.T; return { x: p.x, y: p.y, off: [-T.offX, -T.offY] }; });
const sk = await ev(() => { const r = window.__snug.G.Game.room, s = r.L.socketsById['S.3']; return { x: s.x, y: s.y }; });
const a = await toClient(page, rp.x, rp.y);
const mid = await toClient(page, (rp.x + sk.x) / 2 + rp.off[0], (rp.y + sk.y) / 2 + rp.off[1]);
const to = await toClient(page, sk.x + rp.off[0], sk.y + rp.off[1]);
await page.mouse.move(a[0], a[1]); await page.mouse.down();
await page.mouse.move(mid[0], mid[1]); await sleep(120);
await page.mouse.move(to[0], to[1]); await sleep(120);
const k0 = await kickT();
for (let i = 0; i < 200 && (await kickT()) === k0; i++) { await page.mouse.move(to[0] + (i % 2), to[1]); await sleep(8); }
// a thump has gone by while the plug is held: release now, just after it (on the beat)
await page.mouse.up();
await sleep(200);
ok((await ev(() => !!window.__snug.G.Game.room.secretFound)), 'a plug held through a thump and seated ON the beat is the secret (the gold plug)');
// ---- 6: lock everything: the room wakes
await twist('righty');
ok((await locked('righty')) === true, 'and the secret plug can be locked too');
await seatPlug('boxy', 'S.2', 260);
await twist('boxy');
await seatPlug('spike', 'S.4', 260);
await twist('spike');
await seatPlug('lefty', 'S.1', 260);
await twist('lefty');
await sleep(1200);
const ph = await ev(() => window.__snug.G.Game.room.phase);
ok(ph === 'waking' || ph === 'settling', 'four plugs locked in, the room wakes (' + ph + ')');
console.log('LOGS:', logs.join('\n') || 'none');
console.log(fails ? fails + ' FAILED' : 'all bass probes passed');
await browser.close();
process.exit(fails ? 1 : 0);
