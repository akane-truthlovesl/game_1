// Level 19 (Midnight Snack) behaviour probe, with real mouse input:  node dark.mjs
//  1. a slow carry never wakes Biscuit (alertness stays low)
//  2. a shaking, fast carry wakes her; she pads to the nearest free socket and sits on it (the socket refuses: why "cat")
//  3. a tap pets her: the socket frees up and she goes back to sleep
//  4. the radar pings while a plug is carried toward the socket it fits
import { launch, sleep, toClient, URL } from './common.mjs';
const { browser, page, logs } = await launch({ dpr: 1 });
const ev = (fn, a) => page.evaluate(fn, a);
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };
const cat = () => ev(() => { const r = window.__snug.G.Game.room, c = r.sleeper; return { state: c.state, al: +c.al.toFixed(2), blocked: Object.keys(r.st.flags.blocked || {}), x: Math.round(c.x), y: Math.round(c.y), ping: +r.dark.pingT.toFixed(2) }; });
const plugPos = (id) => ev((id) => { const p = window.__snug.G.Game.room.plugRT[id]; return [p.x, p.y]; }, id);
const offs = () => ev(() => { const T = window.__snug.G.T; return [-T.offX, -T.offY]; });

await page.goto(URL + '?level=19'); await sleep(2600);
for (let i = 0; i < 40 && (await ev(() => window.__snug.G.Game.room.phase)) !== 'playing'; i++) await sleep(200);
const off = await offs();
const f = (q) => [q[0] + off[0], q[1] + off[1]];
const mv = async (q) => { const [x, y] = await toClient(page, q[0], q[1]); await page.mouse.move(x, y); };

// ---- 1. slow carry
const from = await plugPos('lux');
await mv(from); await page.mouse.down();
let maxAl = 0, pinged = false;
const target = [180, 410]; // the amber socket
for (let i = 1; i <= 40; i++) { // 3.2 s from the rest to near the socket
  const u = i / 40, e = u * u * (3 - 2 * u);
  await mv(f([from[0] + (target[0] - from[0]) * e, from[1] + (target[1] - 40 - from[1]) * e]));
  await sleep(80);
  const c = await cat(); maxAl = Math.max(maxAl, c.al); if (c.ping > 0) pinged = true;
}
ok(maxAl < 0.3, 'a slow carry keeps Biscuit asleep (max alertness ' + maxAl + ')');
ok(pinged, 'the radar pinged while the plug neared the socket it fits');
await page.mouse.up(); await sleep(900);
await ev(() => window.__snug.G.Game.room.undoLast && window.__snug.G.Game.room.undoLast());
await sleep(700);

// ---- 2. a fast, shaking carry wakes her
const p2 = await plugPos('static');
await mv(p2); await page.mouse.down();
for (let k = 0; k < 28; k++) { await mv(f([p2[0] - 90 + (k % 2) * 180, p2[1] - 20 + (k % 3) * 20])); await sleep(30); }
let woke = false;
for (let i = 0; i < 20; i++) { const c = await cat(); if (c.state !== 'asleep') { woke = true; break; } await mv(f([p2[0] - 90 + (i % 2) * 180, p2[1]])); await sleep(40); }
await page.mouse.up();
ok(woke, 'a fast shaking carry wakes her');
let sat = false, c2;
for (let i = 0; i < 40; i++) { c2 = await cat(); if (c2.state === 'sitting') { sat = true; break; } await sleep(150); }
ok(sat && c2.blocked.length === 1, 'she padded over and sat on a free socket: blocked ' + JSON.stringify(c2 && c2.blocked));
if (sat) {
  const why = await ev((b) => { const G = window.__snug.G, r = G.Game.room; const pid = r.L.plugs.find((p) => !r.st.seat[p.id]).id; return G.Rules.canSeat(r.L, r.st, pid, b[0]).why; }, c2.blocked);
  ok(why === 'cat' || why === 'key', 'that socket refuses plugs while she sits on it (why: ' + why + ')');
  // ---- 3. pet her
  const [cx, cy] = await toClient(page, c2.x, c2.y);
  await page.mouse.click(cx, cy);
  await sleep(300);
  const c3 = await cat();
  ok(c3.state === 'petted' && c3.blocked.length === 0, 'a tap pets her: the socket is free again (' + c3.state + ')');
  let back = false;
  for (let i = 0; i < 30; i++) { const c = await cat(); if (c.state === 'asleep') { back = true; break; } await sleep(150); }
  ok(back, 'and she goes back to sleep on her cushion');
}
await page.screenshot({ path: 'out/dark-end.png' });
console.log('LOGS:', logs.join('\n') || 'none');
console.log(fails ? fails + ' FAILED' : 'all dark probes passed');
await browser.close();
process.exit(fails ? 1 : 0);
