// Level 26 (Order Up) behaviour probe, with real mouse input:  node chain.mjs
//  1. a follower plugged in alone waits in standby with a bubble naming who it needs (absent), and the chalk arrow stays dark
//  2. the leader plugged to its RIGHT does not wake it (the beat runs left to right): the bubble says so
//  3. the leader moved to its left wakes it, with a relay click, and the chalk arrow lights
//  4. two clashing neighbours howl: a screech, both stay in standby with a bolt bubble; a gap between them cures it
//  5. the last plug starts the Wake: Tick counts one-two-three-four on a woodblock, then the room wakes
//  6. three taps on the chalkboard are the secret (a golden pick)
import { launch, sleep, toClient, URL } from './common.mjs';
const { browser, page, logs } = await launch({ dpr: 1 });
const ev = (fn, a) => page.evaluate(fn, a);
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };
const dev = (id) => ev((id) => { const r = window.__snug.Game.room, rt = r.devRT[id]; return { p: rt.p, needs: rt.needs ? JSON.stringify(rt.needs) : null, arm: rt.arm }; }, id);
const seat = () => ev(() => window.__snug.Game.room.st.seat);
async function dragPlug(plugId, sockId) {
  const info = await ev(([p, s]) => { const G = window.__snug.G, r = G.Game.room, T = G.T; const pl = r.plugRT[p], sk = r.L.socketsById[s]; return { from: [pl.x, pl.y], to: [sk.x, sk.y], off: [-T.offX, -T.offY] }; }, [plugId, sockId]);
  const f = (q) => [q[0] + info.off[0], q[1] + info.off[1]];
  const path = [info.from, f([(info.from[0] + info.to[0]) / 2, (info.from[1] + info.to[1]) / 2]), f(info.to)];
  const cl = []; for (const q of path) cl.push(await toClient(page, q[0], q[1]));
  await page.mouse.move(cl[0][0], cl[0][1]); await page.mouse.down();
  for (let i = 1; i <= 24; i++) { const u = (i / 24) * 2, k = Math.min(1, Math.floor(u)), fr = u - k; await page.mouse.move(cl[k][0] + (cl[k + 1][0] - cl[k][0]) * fr, cl[k][1] + (cl[k + 1][1] - cl[k][1]) * fr); await sleep(36); }
  await sleep(150); await page.mouse.up(); await sleep(1100);
}
async function pullOut(plugId) { // drag a seated plug out, then drop it in the open
  const info = await ev((p) => { const G = window.__snug.G, r = G.Game.room, T = G.T; const sk = r.L.socketsById[r.st.seat[p]]; return { from: [sk.x, sk.y], off: [-T.offX, -T.offY] }; }, plugId);
  const a = await toClient(page, info.from[0], info.from[1]), b = await toClient(page, info.from[0] + info.off[0] + 20, info.from[1] - 120);
  await page.mouse.move(a[0], a[1]); await page.mouse.down();
  for (let i = 1; i <= 16; i++) { await page.mouse.move(a[0] + (b[0] - a[0]) * i / 16, a[1] + (b[1] - a[1]) * i / 16); await sleep(30); }
  await page.mouse.up(); await sleep(700);
}
await page.goto(URL + '?level=26'); await sleep(2600);
for (let i = 0; i < 40 && (await ev(() => window.__snug.G.Game.room.phase)) !== 'playing'; i++) await sleep(200);
await ev(() => { const A = window.__snug.G.Audio; window.__snd = { relay: 0, screech: 0, wood: 0 }; const w = (o, k, n) => { const f = o[k]; o[k] = function () { window.__snd[n]++; return f && f.apply(this, arguments); }; }; w(A.sfx, 'relay', 'relay'); w(A.sfx, 'screech', 'screech'); w(A.sfx, 'woodblock', 'wood'); });

// ---- 1: a follower alone
await dragPlug('pip', 'S.3'); // Pip into the third socket, Tick nowhere
let pip = await dev('pip');
ok(pip.p === 'standby' && pip.needs && JSON.parse(pip.needs).leader === 'tick' && JSON.parse(pip.needs).why === 'absent', 'Pip alone waits in standby with a bubble that names Tick: ' + pip.needs);
ok(await ev(() => !window.__snug.Game.room.decorRT[0].edgeOn.some(Boolean)), 'and no chalk arrow is lit');
// ---- 2: the leader to the right
await dragPlug('tick', 'S.5');
pip = await dev('pip');
const tick = await dev('tick');
ok(tick.p === 'on' || tick.p === 'waking', 'Tick (a leader) wakes on his own: ' + tick.p);
ok(pip.p === 'standby' && JSON.parse(pip.needs).why === 'right', 'Tick on Pip\'s RIGHT does not wake him: the beat runs left to right (' + pip.needs + ')');
// ---- 3: the leader to the left
await pullOut('tick');
await dragPlug('tick', 'S.1');
await sleep(600);
pip = await dev('pip');
ok(pip.p === 'on' || pip.p === 'waking', 'Tick moved to the left wakes Pip: ' + pip.p);
ok((await ev(() => window.__snd.relay)) >= 1, 'a relay clicked as the beat reached him (' + (await ev(() => window.__snd.relay)) + ')');
ok(await ev(() => window.__snug.Game.room.decorRT[0].edgeOn[0] === true), 'and the chalk arrow from Tick to Pip lights');
// ---- 4: two neighbours howl
await dragPlug('lefty', 'S.4');
await dragPlug('righty', 'S.5');
await sleep(500);
const lefty = await dev('lefty'), righty = await dev('righty');
ok(lefty.p === 'standby' && righty.p === 'standby' && JSON.parse(lefty.needs).kind === 'clash' && JSON.parse(righty.needs).kind === 'clash', 'Lefty and Righty next to each other both go quiet with a clash bubble');
ok((await ev(() => window.__snd.screech)) >= 1, 'with a screech of feedback (' + (await ev(() => window.__snd.screech)) + ')');
await pullOut('righty');
await dragPlug('righty', 'S.6');
await sleep(700);
const l2 = await dev('lefty'), r2 = await dev('righty');
ok((l2.p === 'on' || l2.p === 'waking') && (r2.p === 'on' || r2.p === 'waking'), 'a gap between them (Righty moved one socket right) wakes both: ' + l2.p + ' / ' + r2.p);
// ---- 5: the Wake: the count-in
await ev(() => { window.__snd.wood = 0; });
await dragPlug('lumi', 'S.2'); // between Tick and Pip is not free; Pip sits in S.3, so S.2 is: Lumi joins there (a free agent)
const ph = await ev(() => window.__snug.Game.room.phase);
ok(ph === 'waking' || ph === 'settling', 'the last plug starts the Wake (' + ph + ')');
await sleep(1500);
ok((await ev(() => window.__snd.wood)) === 4, 'Tick counted the band in: four woodblock hits (' + (await ev(() => window.__snd.wood)) + ')');
await sleep(2500);
ok(await ev(() => window.__snug.Game.room.requiredOn() === window.__snug.Game.room.requiredCount()), 'and the whole rack is awake');
// ---- 6: the secret
await page.goto(URL + '?level=26'); await sleep(2600);
for (let i = 0; i < 40 && (await ev(() => window.__snug.G.Game.room.phase)) !== 'playing'; i++) await sleep(200);
const [bx, by] = await toClient(page, 180, 106);
for (let i = 0; i < 3; i++) { await page.mouse.click(bx, by); await sleep(250); }
ok(await ev(() => !!window.__snug.Game.room.secretFound), 'three taps on the chalkboard smudge it: the secret (a golden pick)');
console.log('LOGS:', logs.join('\n') || 'none');
console.log(fails ? fails + ' FAILED' : 'all chain probes passed');
await browser.close();
process.exit(fails ? 1 : 0);
