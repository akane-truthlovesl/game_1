// Level 27 (First Four Notes) behaviour probe, with real mouse input:  node seq.mjs
//  1. the room plays the tune once at the start: four notes in step order, on four different instruments, exactly one beat apart
//  2. tapping a device plays its instrument
//  3. a device plugged into the wrong step sits out (standby) and the loop buzzes at it; the right one joins the loop and plays on its step
//  4. the loop keeps perfect time (the notes are scheduled on the audio clock): consecutive loops are exactly one loop apart
//  5. all four right: the Wake (the loop plays on with everyone in it); the secret needs a run with no wrong plug at all
import { launch, sleep, toClient, URL } from './common.mjs';
const { browser, page, logs } = await launch({ dpr: 1 });
const ev = (fn, a) => page.evaluate(fn, a);
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };
async function setup() {
  await page.goto(URL + '?level=27'); await sleep(500);
  await page.mouse.click(8, 420); // a first touch unlocks the audio (browsers need a gesture): without it there is no audio clock to read
  await sleep(300);
  await ev(() => { // count the instruments with the time they are scheduled for (audio clock + lead)
    const wait = setInterval(() => {
      const A = window.__snug && window.__snug.G && window.__snug.G.Audio;
      if (!A) return;
      clearInterval(wait);
      window.__notes = []; window.__buzz = [];
      const w = (k, rec) => { const f = A[k]; A[k] = function () { rec(arguments); return f && f.apply(this, arguments); }; };
      w('inst', (a) => window.__notes.push({ voice: a[0], midi: a[1], at: (A.now() || 0) + (a[4] || 0), real: performance.now() }));
      w('buzz', (a) => window.__buzz.push({ at: (A.now() || 0) + (a[0] || 0) }));
    }, 20);
  });
  for (let i = 0; i < 40 && (await ev(() => window.__snug.G.Game.room.phase)) !== 'playing'; i++) await sleep(200);
  for (let i = 0; i < 60 && (await ev(() => (window.__notes || []).length)) < 4; i++) await sleep(150); // the demo plays four notes
}
async function dragPlug(plugId, sockId) {
  const info = await ev(([p, s]) => { const G = window.__snug.G, r = G.Game.room, T = G.T; const pl = r.plugRT[p], sk = r.L.socketsById[s]; return { from: [pl.x, pl.y], to: [sk.x, sk.y], off: [-T.offX, -T.offY] }; }, [plugId, sockId]);
  const f = (q) => [q[0] + info.off[0], q[1] + info.off[1]];
  const path = [info.from, f([(info.from[0] + info.to[0]) / 2, (info.from[1] + info.to[1]) / 2]), f(info.to)];
  const cl = []; for (const q of path) cl.push(await toClient(page, q[0], q[1]));
  await page.mouse.move(cl[0][0], cl[0][1]); await page.mouse.down();
  for (let i = 1; i <= 24; i++) { const u = (i / 24) * 2, k = Math.min(1, Math.floor(u)), fr = u - k; await page.mouse.move(cl[k][0] + (cl[k + 1][0] - cl[k][0]) * fr, cl[k][1] + (cl[k + 1][1] - cl[k][1]) * fr); await sleep(36); }
  await sleep(150); await page.mouse.up(); await sleep(900);
}
async function pullOut(plugId) {
  const info = await ev((p) => { const G = window.__snug.G, r = G.Game.room, T = G.T; const sk = r.L.socketsById[r.st.seat[p]]; return { from: [sk.x, sk.y], off: [-T.offX, -T.offY] }; }, plugId);
  const a = await toClient(page, info.from[0], info.from[1]), b = await toClient(page, info.from[0] + info.off[0] + 30, info.from[1] - 120);
  await page.mouse.move(a[0], a[1]); await page.mouse.down();
  for (let i = 1; i <= 16; i++) { await page.mouse.move(a[0] + (b[0] - a[0]) * i / 16, a[1] + (b[1] - a[1]) * i / 16); await sleep(30); }
  await page.mouse.up(); await sleep(700);
}
const dev = (id) => ev((id) => window.__snug.Game.room.devRT[id].p, id);

// ---- 1: the demo
await setup();
let notes = await ev(() => window.__notes.slice());
ok(notes.length >= 4, 'the room plays the tune at the start (' + notes.length + ' notes)');
const demo = notes.slice(0, 4);
ok(demo.map((n) => n.voice).join(',') === 'wood,pluck,bell,celesta', 'on four different instruments, in step order: ' + demo.map((n) => n.voice).join(', '));
const gaps = [1, 2, 3].map((i) => demo[i].at - demo[i - 1].at);
ok(gaps.every((g) => Math.abs(g - 0.6) < 0.004), 'exactly one beat (0.600 s) apart on the audio clock: ' + gaps.map((g) => g.toFixed(4)).join(', '));
// ---- 2: tapping a device plays its instrument
const before = (await ev(() => window.__notes.length));
const [tx, ty] = await toClient(page, 266, 188);
await page.mouse.click(tx, ty); await sleep(250);
const tapped = await ev(() => window.__notes.slice(-1)[0]);
ok((await ev(() => window.__notes.length)) > before && tapped.voice === 'bell', 'a tap on Dot plays his bell: ' + tapped.voice);
// ---- 3: the wrong step, then the right one
await sleep(2200);
await ev(() => { window.__buzz.length = 0; });
await dragPlug('dot', 'S.1'); // Dot belongs on step 3
await sleep(3000);
ok((await dev('dot')) === 'standby', 'Dot on step 1 sits out (standby)');
ok((await ev(() => window.__buzz.length)) >= 1, 'and the loop buzzes at him (' + (await ev(() => window.__buzz.length)) + ' buzzes)');
await pullOut('dot');
await dragPlug('tick', 'S.1');
await sleep(300);
ok(['on', 'waking'].includes(await dev('tick')), 'Tick on step 1 (his own) wakes');
await ev(() => { window.__notes.length = 0; });
await sleep(5200);
const woods = await ev(() => window.__notes.filter((n) => n.voice === 'wood'));
ok(woods.length >= 2, 'and plays his woodblock once every loop (' + woods.length + ' in five seconds)');
// ---- 4: perfect time
const lp = [];
for (let i = 1; i < woods.length; i++) lp.push(woods[i].at - woods[i - 1].at);
ok(lp.length >= 1 && lp.every((g) => Math.abs(g - 2.4) < 0.004), 'the loop is exactly one loop (2.400 s) long, loop after loop: ' + lp.map((g) => g.toFixed(4)).join(', '));
// ---- 5: finish
await dragPlug('static', 'S.2');
await dragPlug('dot', 'S.3');
await ev(() => window.__notes.length = 0);
await dragPlug('lux', 'S.4');
await sleep(600);
const ph = await ev(() => window.__snug.Game.room.phase);
ok(ph === 'waking' || ph === 'settling', 'the fourth right plug wakes the room (' + ph + ')');
await sleep(4200);
const voices = new Set((await ev(() => window.__notes)).map((n) => n.voice));
ok(voices.size === 4, 'the loop plays on with all four instruments in it: ' + [...voices].join(', '));
ok(!(await ev(() => !!window.__snug.Game.room.secretFound)), 'after a wrong plug there is no secret key');
// ---- the secret: a perfect run
await setup();
await sleep(600);
for (const [p, s] of [['tick', 'S.1'], ['static', 'S.2'], ['dot', 'S.3'], ['lux', 'S.4']]) await dragPlug(p, s);
await sleep(2500);
ok(await ev(() => !!window.__snug.Game.room.secretFound), 'the tune rebuilt with no wrong plug is the secret (a music-box key)');
console.log('LOGS:', logs.join('\n') || 'none');
console.log(fails ? fails + ' FAILED' : 'all sequencer probes passed');
await browser.close();
process.exit(fails ? 1 : 0);
