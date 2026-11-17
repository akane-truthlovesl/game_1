// Level 21 (Snail Mail) behaviour probe, with real mouse input:  node carry.mjs
//  1. a road cannot be drawn across the river (the crayon stops at the bank)
//  2. the snail walks the road at its own pace, stops to munch the lettuce, and the sockets move with it
//  3. a cable that is plugged TETHERS the snail: a road past the end of its reach stalls it ("strain") and the room reports the stall point
//  4. unplugging lets it walk on; a tap makes it hide and pauses it
//  5. a plug is refused where it cannot reach (never a seat that would be torn out)
import { launch, sleep, toClient, URL } from './common.mjs';
const { browser, page, logs } = await launch({ dpr: 1 });
const ev = (fn, a) => page.evaluate(fn, a);
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };
const snap = () => ev(() => { const r = window.__snug.G.Game.room, c = r.carryRT.S, s = r.L.stripsById.S; return { state: c.state, x: Math.round(s.x), y: Math.round(s.y), s: +c.s.toFixed(0), len: Math.round(c.len), stall: Math.round(c.stallRel), hide: +c.hideT.toFixed(1), seat: r.st.seat, munch: +c.munch.toFixed(1), worst: +c.seatedWorst.toFixed(2) }; });
async function drawRoad(pts, ms = 1100) {
  const cl = []; for (const p of pts) cl.push(await toClient(page, p[0], p[1]));
  await page.mouse.move(cl[0][0], cl[0][1]); await page.mouse.down();
  const total = cl.length - 1, steps = 40;
  for (let i = 1; i <= steps; i++) { const u = i / steps, e = u * total, k = Math.min(total - 1, Math.floor(e)), f = e - k; await page.mouse.move(cl[k][0] + (cl[k + 1][0] - cl[k][0]) * f, cl[k][1] + (cl[k + 1][1] - cl[k][1]) * f); await sleep(ms / steps); }
  await page.mouse.up();
}
async function dragPlug(plugId, sockId) {
  const info = await ev(([p, s]) => { const G = window.__snug.G, r = G.Game.room, T = G.T; const pl = r.plugRT[p], sk = r.L.socketsById[s]; return { from: [pl.x, pl.y], to: [sk.x, sk.y], off: [-T.offX, -T.offY] }; }, [plugId, sockId]);
  const f = (q) => [q[0] + info.off[0], q[1] + info.off[1]];
  await drawRoad([info.from, f([(info.from[0] + info.to[0]) / 2, (info.from[1] + info.to[1]) / 2]), f(info.to)], 900);
}
await page.goto(URL + '?level=21'); await sleep(2500);
for (let i = 0; i < 40 && (await ev(() => window.__snug.G.Game.room.phase)) !== 'playing'; i++) await sleep(200);
const start = await snap();

// ---- 5. refused where it cannot reach
await dragPlug('static', 'S.2'); await sleep(900);
let s0 = await snap();
ok(!s0.seat.static, 'a plug dropped on a socket it cannot reach is not seated (reach refusal, no tear-out later): ' + JSON.stringify(s0.seat));

// ---- 1. a road across the river
const before = await ev(() => window.__snug.G.Game.room.carryRT.S.drawing);
await drawRoad([[start.x, start.y], [120, 480], [100, 440], [100, 360], [100, 300]], 1100);
await sleep(300);
const refused = await ev(() => { const c = window.__snug.G.Game.room.carryRT.S; return { road: c.road.map((p) => [Math.round(p.x), Math.round(p.y)]), len: Math.round(c.len) }; });
const maxCrossY = Math.min(...refused.road.map((p) => p[1]));
ok(refused.road.length > 1 && maxCrossY > 395, 'the crayon stops at the river bank: the road never goes above y=395 (highest point ' + maxCrossY + ')');
// let it walk that stub to the end, then plug the lamp while it stands still
for (let i = 0; i < 60; i++) { await sleep(300); if ((await snap()).state === 'idle') break; }

// ---- plug the lamp (it is next to the snail), then draw the real road across the deck and past the dock
await dragPlug('lux', 'S.1'); await sleep(900);
await ev(() => { const c = window.__snug.G.Game.room.carryRT.S; c.road = []; c.cum = [0]; c.len = 0; c.s = 0; c.state = 'idle'; });
const here = await snap();
ok(here.seat.lux === 'S.1', 'the lamp is plugged into the moving strip');
await drawRoad([[here.x, here.y], [250, 470], [262, 392], [262, 330], [262, 250]], 1500); // a road that runs well past the dock
let walking = null, strained = false, munched = false, maxY = 999;
for (let i = 0; i < 80; i++) {
  await sleep(250);
  const q = await snap();
  if (q.state === 'munch') munched = true;
  if (q.state === 'strain') { strained = true; walking = q; break; }
  if (q.state === 'idle' && i > 8) break;
}
ok(munched, 'the snail stopped to munch the lettuce on the way');
ok(strained, 'with the lamp plugged, a road past the dock STALLS the snail (state strain) instead of tearing the plug out');
ok(strained && walking.worst <= 0.99, 'and the cable never over-stretches (worst ratio ' + (walking && walking.worst) + ')');
ok(strained && walking.y > 330 && walking.y < 392, 'it parks just beyond the deck, where the lamp\'s cable runs out (y=' + (walking && walking.y) + ')');
const stallShown = await ev(() => window.__snug.G.Game.room.carryRT.S.stallRel);
ok(typeof stallShown === 'number', 'the room knows where the road stalls (shown as a red dashed stretch): ' + stallShown);

// ---- 4. unplugging lets it go on; a tap hides it
await ev(() => document.getElementById('btnUndo') && 0);
await ev(() => { const r = window.__snug.G.Game.room; const prt = r.plugRT.lux; r.hopTo(prt, prt.plug.device.rest.x, prt.plug.device.rest.y, 0.3, 0); r.updateCover(); r.refreshPower(); });
await sleep(1600);
const freed = await snap();
ok(freed.state !== 'strain', 'without the cable it walks on (state ' + freed.state + ', y=' + freed.y + ')');
const [tx, ty] = await toClient(page, freed.x, freed.y);
await page.mouse.click(tx, ty); await sleep(250);
const hid = await snap();
ok(hid.hide > 0.5, 'a tap makes it hide in its shell (hide ' + hid.hide + ')');

console.log('LOGS:', logs.join('\n') || 'none');
console.log(fails ? fails + ' FAILED' : 'all carry probes passed');
await browser.close();
process.exit(fails ? 1 : 0);
