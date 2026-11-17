// Level 24 (Wind-Up Parade) behaviour probe, with real mouse input:  node wind.mjs
//  1. the drummer stands at the start facing north; its brass key sticks out of one side and is always on the mat
//  2. a tap on the toy turns it a quarter (clockwise); a drag from it aims it on a dial of sixteen detents (it turns to face the aim)
//  3. circling the key winds it: one click per quarter-turn (rising ratchet), back off to unwind, capped at eight; the ghost road follows
//  4. wound all the way: the golden key secret; let go and it marches the ghost road exactly (bonks into a block, wobbles it, pivots right,
//     runs down slower and slower at the end), then stops
//  5. a seated cable holds the toy: the ghost road turns red where the cable runs out, the toy strains, and undoing a plug frees it
import { launch, sleep, toClient, URL } from './common.mjs';
const { browser, page, logs } = await launch({ dpr: 1 });
const ev = (fn, a) => page.evaluate(fn, a);
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };
const S = () => ev(() => {
  const r = window.__snug.G.Game.room, rt = r.carryRT.S, w = rt.wind, k = r.windKeyPos(rt);
  return { state: rt.state, x: Math.round(rt.strip.x), y: Math.round(rt.strip.y), heading: +rt.heading.toFixed(2), aim: +w.aim.toFixed(2), clicks: w.clicks, mode: w.mode,
    ghost: w.ghost ? w.ghost.pts.length : 0, ghostLen: w.ghost ? Math.round(w.ghost.len) : 0, ghostEnd: w.ghost ? [Math.round(w.ghost.end.x), Math.round(w.ghost.end.y), +w.ghost.end.h.toFixed(2)] : null,
    stall: Math.round(w.ghostStall), road: rt.road.length, secret: !!r.secretFound, seat: r.st.seat, phase: r.phase, key: [Math.round(k.x), Math.round(k.y)], side: w.keySide };
});
const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return Math.abs(d); };
const onMat = (k) => k[0] > 34 && k[0] < 326 && k[1] > 70 && k[1] < 592;
const mv = async (q) => { const [x, y] = await toClient(page, q[0], q[1]); await page.mouse.move(x, y); };
async function path(pts, ms) {
  const cl = []; for (const p of pts) cl.push(await toClient(page, p[0], p[1]));
  await page.mouse.move(cl[0][0], cl[0][1]); await page.mouse.down();
  const total = cl.length - 1, steps = Math.max(20, cl.length * 2);
  for (let i = 1; i <= steps; i++) { const u = i / steps, e = u * total, k = Math.min(total - 1, Math.floor(e)), f = e - k; await page.mouse.move(cl[k][0] + (cl[k + 1][0] - cl[k][0]) * f, cl[k][1] + (cl[k + 1][1] - cl[k][1]) * f); await sleep(ms / steps); }
  await page.mouse.up();
}
const click = async (x, y) => { const [cx, cy] = await toClient(page, x, y); await page.mouse.click(cx, cy); };
async function aimTo(a, from) { // press the toy, drag out along the aim, let go
  const d = [Math.cos(a), Math.sin(a)];
  await path([from, [from[0] + d[0] * 34, from[1] + d[1] * 34], [from[0] + d[0] * 70, from[1] + d[1] * 70]], 700);
  await sleep(900);
}
async function ready(level) {
  await page.goto(URL + '?level=' + level); await sleep(2600);
  for (let i = 0; i < 40 && (await ev(() => window.__snug.G.Game.room.phase)) !== 'playing'; i++) await sleep(200);
}
// press the key and circle it by `sweep` radians (positive = clockwise on screen); stay pressed, return the finger's angle
async function keyDown(kp, a0) { await mv([kp[0] + Math.cos(a0) * 22, kp[1] + Math.sin(a0) * 22]); await page.mouse.down(); }
async function keyTurn(kp, a0, a1, ms) {
  const n = Math.max(6, Math.round(Math.abs(a1 - a0) * 8));
  for (let i = 1; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; await mv([kp[0] + Math.cos(a) * 22, kp[1] + Math.sin(a) * 22]); await sleep(ms / n); }
}

// ---------------------------------------------------------------- 1 + 2: the toy, its key, aiming
await ready(24);
let s = await S();
ok(s.state === 'idle' && s.x === 190 && s.y === 556 && angDiff(s.heading, -Math.PI / 2) < 0.05, 'the drummer stands at the start facing north: ' + JSON.stringify([s.state, s.x, s.y, s.heading]));
ok(onMat(s.key), 'its brass key sticks out of the side and is on the mat: ' + JSON.stringify(s.key));
await click(s.x, s.y); await sleep(600);
let t = await S();
ok(angDiff(t.aim, 0) < 0.05 && t.state === 'idle', 'a tap on the toy turns its aim a quarter clockwise (north to east): aim ' + t.aim);
ok(angDiff(t.heading, 0) < 0.15, 'and it turns to face it: heading ' + t.heading);
await click(t.x, t.y); await sleep(300); await click(t.x, t.y); await sleep(300); await click(t.x, t.y); await sleep(700);
t = await S();
ok(angDiff(t.aim, -Math.PI / 2) < 0.05, 'four taps are a full turn: it faces north again (aim ' + t.aim + ')');
await aimTo(0, [t.x, t.y]);
t = await S();
ok(angDiff(t.aim, 0) < 0.12 && t.road === 0, 'a drag from the toy aims it east without sending it anywhere: aim ' + t.aim);

// the dial: sixteen detents (22.5 deg); the thumb must be well past the next notch (> 62 %) before the aim lets go of the one it has
{
  const here = [t.x, t.y], d12 = (a) => [here[0] + Math.cos(a * Math.PI / 180) * 60, here[1] + Math.sin(a * Math.PI / 180) * 60];
  const [px, py] = await toClient(page, here[0], here[1]); await page.mouse.move(px, py); await page.mouse.down();
  await mv(d12(0)); await sleep(150);
  await mv(d12(11)); await sleep(150); let a1 = await S();
  ok(a1.aim === 0, 'a drag 11 deg off the notch does not let go of it (aim ' + a1.aim + ')');
  const dialOn = await ev(() => window.__snug.Game.room.carryRT.S.wind.dial);
  await mv(d12(17)); await sleep(150); a1 = await S();
  ok(angDiff(a1.aim, Math.PI / 8) < 0.01, '17 deg clicks over to the next notch, 22.5 deg (aim ' + a1.aim + ')');
  ok(dialOn > 0.3 && (await ev(() => window.__snug.Game.room.carryRT.S.wind.dial)) > 0.6, 'the dial of notches is showing while the thumb aims it');
  await mv(d12(-85)); await sleep(150); a1 = await S();
  ok(angDiff(a1.aim, -Math.PI / 2) < 0.01, 'and it follows the thumb round to straight north: every aim is one of the sixteen (aim ' + a1.aim + ')');
  await mv(d12(2)); await sleep(150); await page.mouse.up(); await sleep(700);
  a1 = await S();
  ok(angDiff(a1.aim, 0) < 0.01, 'let go on the east notch: aim 0');
}

// ---------------------------------------------------------------- 3: the key
let kp = t.key, a0 = Math.atan2(t.y - kp[1], t.x - kp[0]) + Math.PI; // start the thumb on the side of the key away from the toy
await keyDown(kp, a0);
await keyTurn(kp, a0, a0 + Math.PI / 2 * 2 + 0.2, 700);
let c = await S();
ok(c.clicks === 2 && c.mode === 'key', 'half a turn round the key is two clicks: ' + c.clicks);
ok(c.ghost > 2 && Math.abs(c.ghostLen - 110) < 6, 'and the ghost road is two clicks long (~110 u): ' + c.ghostLen);
await keyTurn(kp, a0 + Math.PI + 0.2, a0 + Math.PI / 2 + 0.2, 400); // back off a quarter
c = await S();
ok(c.clicks === 1, 'turning back unwinds a click: ' + c.clicks);
await keyTurn(kp, a0 + Math.PI / 2 + 0.2, a0 + Math.PI * 6, 2400); // far past the cap
c = await S();
ok(c.clicks === 8, 'winding on stops at the eight-click cap: ' + c.clicks);
ok(c.secret, 'wound all the way round: the golden key secret is found');
const ghost8 = c.ghostEnd, len8 = c.ghostLen;
ok(len8 > 300, 'the full wind is a long ghost road (' + len8 + ' u), turned right at the blocks (ends facing ' + ghost8[2] + ')');
const walkSample = await ev(() => { const rt = window.__snug.G.Game.room.carryRT.S; return rt.state; });
ok(walkSample === 'idle', 'while the thumb is on the key the toy stands still');
await page.mouse.up();
await sleep(500);
c = await S();
ok(c.state === 'walking' && c.road > 3, 'let go of the key: the drummer marches off (walking, road ' + c.road + ' points)');
let st0 = Date.now(), prev = null, bumped = false, sawBump = false, minRamp = 1, stepsHeard = 0;
while (Date.now() - st0 < 60000) {
  const q = await S(); if (prev && Math.abs(q.heading - prev.heading) > 0.2) bumped = true; prev = q;
  const e = await ev(() => { const rt = window.__snug.Game.room.carryRT.S; return { st: rt.state, ramp: rt.ramp || 1 }; });
  if (e.st === 'bump') sawBump = true;
  if (e.st === 'walking') minRamp = Math.min(minRamp, e.ramp);
  if (q.state === 'idle') break; await sleep(120);
}
ok(sawBump, 'it stops for a bonk when it hits a block (state bump) and pivots');
ok(minRamp < 0.5, 'and the last stretch is walked slower and slower: it runs down (speed fell to ' + minRamp.toFixed(2) + ' of full)');
const shook = await ev(() => window.__snug.Game.room.decorRT.filter((r) => r.shakeAt !== undefined).length);
ok(shook >= 1, 'the block it hit wobbled (' + shook + ' block shaken)');
c = await S();
ok(c.state === 'idle', 'the road ends and it stops (idle at ' + c.x + ',' + c.y + ')');
ok(Math.hypot(c.x - ghost8[0], c.y - ghost8[1]) < 8, 'exactly where the ghost road said it would (' + ghost8[0] + ',' + ghost8[1] + ')');
ok(bumped, 'on the way it turned right at a wall (the heading changed)');

// ---------------------------------------------------------------- 5: the cable holds the toy
await ready(24);
for (let step = 0; step < 8; step++) {
  const h = await ev(() => { const G = window.__snug.G, r = G.Game.room; const x = G.Rules.hint(r.L, r.st); return x && { type: x.type, aim: x.aim, clicks: x.clicks, from: x.from, plug: x.plug, socket: x.socket }; });
  if (!h) break;
  if (h.type === 'wait') { await sleep(1500); continue; }
  if (h.type !== 'wind') { if (h.type === 'seat') { var seatHint = h; } break; }
  const from = [h.from.x, h.from.y];
  await aimTo(h.aim, from);
  const k2 = await ev(() => { const r = window.__snug.Game.room; const k = r.windKeyPos(r.carryRT.S); return [k.x, k.y]; });
  const b0 = Math.atan2(from[1] - k2[1], from[0] - k2[0]) + Math.PI, sweep = h.clicks * (Math.PI / 2) + 0.35, n = Math.max(8, Math.round(h.clicks * 10)), circ = [];
  for (let i = 0; i <= n; i++) { const a = b0 + (sweep * i) / n; circ.push([k2[0] + Math.cos(a) * 22, k2[1] + Math.sin(a) * 22]); }
  await path(circ, 500 + h.clicks * 330);
  await sleep(300);
  for (let i = 0; i < 90; i++) { await sleep(400); if ((await S()).state === 'idle') break; }
}
c = await S();
ok(!!seatHint, 'following the hint the wind-ups bring the strip to the dock, where the hint says to plug ' + (seatHint && seatHint.plug) + ' in: ' + JSON.stringify([c.x, c.y]));
if (seatHint) {
  const info = await ev(([p, sk]) => { const G = window.__snug.G, r = G.Game.room, T = G.T; const pl = r.plugRT[p], so = r.L.socketsById[sk]; return { from: [pl.x, pl.y], to: [so.x, so.y], off: [-T.offX, -T.offY] }; }, [seatHint.plug, seatHint.socket]);
  const mid = [(info.from[0] + info.to[0]) / 2, (info.from[1] + info.to[1]) / 2];
  const cl = []; for (const q of [info.from, mid, info.to]) cl.push(await toClient(page, q[0], q[1]));
  await page.mouse.move(cl[0][0], cl[0][1]); await page.mouse.down();
  for (let i = 1; i <= 24; i++) { const u = (i / 24) * 2, k = Math.min(1, Math.floor(u)), fr = u - k; await page.mouse.move(cl[k][0] + (cl[k + 1][0] - cl[k][0]) * fr, cl[k][1] + (cl[k + 1][1] - cl[k][1]) * fr); await sleep(36); }
  await sleep(150); await page.mouse.up(); await sleep(900);
  c = await S();
  ok(Object.values(c.seat).filter(Boolean).length === 1, 'the cable is plugged into the strip: ' + JSON.stringify(c.seat));
  // now wind it far away from the devices: south, five clicks
  const here = [c.x, c.y];
  await aimTo(Math.PI / 2, here);
  const k3 = (await S()).key, b1 = Math.atan2(here[1] - k3[1], here[0] - k3[0]) + Math.PI;
  await keyDown(k3, b1);
  await keyTurn(k3, b1, b1 + 5 * (Math.PI / 2) + 0.3, 2200);
  c = await S();
  ok(c.clicks === 5 && c.stall >= 0, 'with a cable plugged in, a long ghost road turns red where the cable runs out (stall at ' + c.stall + ' u of ' + c.ghostLen + ')');
  await page.mouse.up(); await sleep(500);
  let strained = null; st0 = Date.now();
  while (Date.now() - st0 < 30000) { const q = await S(); if (q.state === 'strain') { strained = q; break; } if (q.state === 'idle') break; await sleep(150); }
  ok(!!strained, 'the toy marches until the cable is taut, then strains instead of ripping the plug out: ' + JSON.stringify(strained && [strained.x, strained.y]));
  const stayed = await ev(() => Object.values(window.__snug.G.Game.room.st.seat).filter(Boolean).length);
  ok(stayed === 1, 'and the plug stays seated');
  let freed = false;
  for (let i = 0; i < 3 && !freed; i++) {
    await ev(() => document.getElementById('btnUndo').click()); await sleep(900);
    const q = await S();
    if (q.state !== 'strain') freed = true;
  }
  ok(freed, 'pulling the plug (undo) lets the toy go again — it is never stuck for good');
}
console.log('LOGS:', logs.join('\n') || 'none');
console.log(fails ? fails + ' FAILED' : 'all wind probes passed');
await browser.close();
process.exit(fails ? 1 : 0);
