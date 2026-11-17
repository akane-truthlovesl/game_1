// Level 23 (All Aboard) behaviour probe, with real mouse input:  node track.mjs
//  1. the train rolls at the start; the strip is a dynamo that charges only on a clean run with every cable plugged in
//  2. a tap on the points flips them (ka-chak); a tap on the lever brakes the train into the next station on its route and holds it
//  3. with every cable plugged, the shared stretch and the small loop are safe and the big loop is RED (a cable cannot follow it)
//  4. rolling on with the points set to the big loop: the cables stall the train ("strain"), the dynamo stops
import { launch, sleep, toClient, URL } from './common.mjs';
const { browser, page, logs } = await launch({ dpr: 1 });
const ev = (fn, a) => page.evaluate(fn, a);
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };
const tr = () => ev(() => { const r = window.__snug.G.Game.room, t = r.carryRT.S.tr, s = r.L.stripsById.S; return { seg: t.seg, s: Math.round(t.s), v: Math.round(t.v), state: t.state, stopped: t.stopped, lever: t.lever, points: t.pointsTo, x: Math.round(s.x), y: Math.round(s.y), fail: Object.fromEntries(Object.entries(t.fail).map(([k, v]) => [k, Math.round(v)])), moving: !!r.st.flags.carryMoving.S, on: r.requiredOn(), phase: r.phase, seat: r.st.seat }; });
const click = async (x, y) => { const [cx, cy] = await toClient(page, x, y); await page.mouse.click(cx, cy); };
async function dragPlug(plugId, sockId) {
  const info = await ev(([p, s]) => { const G = window.__snug.G, r = G.Game.room, T = G.T; const pl = r.plugRT[p], sk = r.L.socketsById[s]; return { from: [pl.x, pl.y], to: [sk.x, sk.y], off: [-T.offX, -T.offY] }; }, [plugId, sockId]);
  const f = (q) => [q[0] + info.off[0], q[1] + info.off[1]];
  const path = [info.from, f([(info.from[0] + info.to[0]) / 2, (info.from[1] + info.to[1]) / 2]), f(info.to)];
  const cl = []; for (const q of path) cl.push(await toClient(page, q[0], q[1]));
  await page.mouse.move(cl[0][0], cl[0][1]); await page.mouse.down();
  for (let i = 1; i <= 24; i++) { const u = i / 24 * 2, k = Math.min(1, Math.floor(u)), fr = u - k; await page.mouse.move(cl[k][0] + (cl[k + 1][0] - cl[k][0]) * fr, cl[k][1] + (cl[k + 1][1] - cl[k][1]) * fr); await sleep(36); }
  await sleep(120); await page.mouse.up();
}
await page.goto(URL + '?level=23'); await sleep(2500);
for (let i = 0; i < 40 && (await ev(() => window.__snug.G.Game.room.phase)) !== 'playing'; i++) await sleep(200);
const T = await ev(() => window.__snug.G.Game.room.L.carried[0].carrier.track);
const P = { x: T.points.x, y: T.points.y }, LV = { x: T.lever.x, y: T.lever.y };
let a = await tr();
ok(a.v > 20 && a.points === 'big' && a.lever === 'go', 'the train is rolling at the start, points set to the big loop: ' + JSON.stringify([a.v, a.points, a.lever]));
ok(a.on === 0, 'and rolling alone wakes nothing (no cable is plugged in)');

// (the first lap goes round the big loop whatever you do: the junction is 2.5 s from the start. Wait for it to come back on the shared stretch.)
let back = null, tb = Date.now();
while (Date.now() - tb < 40000) { const q = await tr(); if (q.seg === 'shared' && q.s < 40 && Date.now() - tb > 3000) { back = q; break; } await sleep(120); }
ok(!!back, 'the first lap takes the big loop (the points start there) and comes back to the shared stretch: ' + JSON.stringify(back && [back.seg, back.s]));

// ---- 2. points and lever
await click(P.x, P.y); await sleep(200);
a = await tr();
ok(a.points === 'small', 'a tap on the points flips them to the small loop');
await click(LV.x, LV.y); await sleep(200);
a = await tr();
ok(a.lever === 'stop', 'a tap on the lever puts it to STOP');
let t0 = Date.now(), stoppedAt = null;
while (Date.now() - t0 < 26000) { const q = await tr(); if (q.stopped) { stoppedAt = q; break; } await sleep(150); }
ok(stoppedAt && stoppedAt.seg === 'shared', 'the train brakes into the station on the shared platform and holds: ' + JSON.stringify(stoppedAt && [stoppedAt.seg, stoppedAt.s, stoppedAt.v]));
ok(stoppedAt && stoppedAt.v === 0 && !stoppedAt.moving, 'standing in the station the wheels do not turn');

// ---- 1. the dynamo: plug everything while it stands; nothing wakes until it rolls
await dragPlug('dot', 'S.1'); await sleep(500);
await dragPlug('static', 'S.2'); await sleep(500);
await dragPlug('lux', 'S.3'); await sleep(900);
a = await tr();
ok(Object.values(a.seat).every(Boolean), 'all three cables are plugged into the standing wagon: ' + JSON.stringify(a.seat));
ok(a.on === 0 && a.phase === 'playing', 'the strip is a dynamo: nothing is awake while the wheels stand still (awake ' + a.on + ')');

// ---- 3. the red track
ok(a.fail.small < 0 && a.fail.shared < 0, 'with every cable plugged the shared stretch and the small loop are safe (no red)');
ok(a.fail.big >= 0, 'the big loop is red from ' + a.fail.big + ' u (a cable cannot follow it)');

// ---- go: the lever back, on the small loop; the room wakes while it rolls
await click(LV.x, LV.y); await sleep(400);
let woke = false;
t0 = Date.now();
let sawCharge = 0;
while (Date.now() - t0 < 18000) { const q = await tr(); sawCharge = Math.max(sawCharge, await ev(() => window.__snug.Game.room.carryRT.S.tr.charge)); if (q.phase === 'waking' || q.phase === 'settling') { woke = true; break; } await sleep(150); }
ok(sawCharge > 0.3, 'the dynamo charges while it rolls (charge reached ' + sawCharge.toFixed(2) + ' before the wake)');
ok(woke, 'released, the train rolls a clean lap on the small loop, the dynamo fills and the room wakes');
// ---- 4. the wrong loop: plug everything at the station, flip the points back to the big loop, let go: the cables hold the train
await page.goto(URL + '?level=23'); await sleep(2500);
for (let i = 0; i < 40 && (await ev(() => window.__snug.G.Game.room.phase)) !== 'playing'; i++) await sleep(200);
tb = Date.now();
while (Date.now() - tb < 40000) { const q = await tr(); if (q.seg === 'shared' && q.s < 40 && Date.now() - tb > 3000) break; await sleep(120); }
await click(P.x, P.y); await sleep(200); // small
await click(LV.x, LV.y); await sleep(200); // stop
tb = Date.now();
while (Date.now() - tb < 26000) { const q = await tr(); if (q.stopped) break; await sleep(150); }
await dragPlug('dot', 'S.1'); await sleep(500);
await dragPlug('static', 'S.2'); await sleep(500);
await dragPlug('lux', 'S.3'); await sleep(700);
await click(P.x, P.y); await sleep(200); // back to the big loop (the lamp turns red)
a = await tr();
ok(a.points === 'big', 'the points are set to the big loop again');
await click(LV.x, LV.y); await sleep(300); // go
let strained = null;
tb = Date.now();
while (Date.now() - tb < 30000) { const q = await tr(); if (q.state === 'strain') { strained = q; break; } if (q.phase !== 'playing') break; await sleep(150); }
ok(strained && strained.seg === 'big', 'on the big loop the cables hold the train: it strains (seg ' + (strained && strained.seg) + ', ' + (strained && strained.s) + ' u in)');
ok(strained && !strained.moving && strained.on === 0, 'and with the wheels stopped the dynamo is dead (nothing awake)');
// pulling a plug lets it go again
for (let i = 0; i < 3 && strained; i++) {
  await ev(() => document.getElementById('btnUndo').click()); await sleep(500);
  const q = await tr();
  if (q.state !== 'strain') { strained = null; ok(true, 'undoing a plug frees the train (after ' + (i + 1) + ' undo)'); break; }
}
ok(strained === null, 'the train is never stuck for good');

console.log('LOGS:', logs.join('\n') || 'none');
console.log(fails ? fails + ' FAILED' : 'all track probes passed');
await browser.close();
process.exit(fails ? 1 : 0);
