// Act 5, Level 41 "Fan Mail", with real mouse input:  node fan41.mjs
//  1. a plug let go in the gust, under the slot, is carried up through the slot and caught on the socket (S.1), and the golden tumbler is found
//  2. the control: a plug let go in the same gust but behind the fence, far from the socket, is not caught in 4 s
import { launch, sleep, toClient, URL } from './common.mjs';
const { browser, page, logs } = await launch({ dpr: 1 });
const ev = (fn, a) => page.evaluate(fn, a);
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };
async function load() {
  await page.goto(URL + '?level=41'); await sleep(900);
  for (let i = 0; i < 40 && (await ev(() => window.__snug.G.Game.room.phase)) !== 'playing'; i++) await sleep(200);
  await page.mouse.click(8, 420); await sleep(200);
}
const pip = () => ev(() => { const r = window.__snug.G.Game.room; const p = r.plugRT.pip; return { x: p.x, y: p.y, st: p.state, seat: r.st.seat.pip || null, secret: !!r.secretFound }; });
async function carryTo(x, y) {
  const p0 = await pip(); const a = await toClient(page, p0.x, p0.y), b = await toClient(page, x, y);
  await page.mouse.move(a[0], a[1]); await page.mouse.down();
  for (let k = 1; k <= 30; k++) { const u = k / 30; await page.mouse.move(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u); await sleep(20); }
  await sleep(300); await page.mouse.up();
}
// ---- 1: let go in front of the slot, in the gust
await load();
await carryTo(290, 420); // inside the gust, under the slot
let caught = null;
for (let i = 0; i < 10 && !caught; i++) { await sleep(400); const s = await pip(); if (s.seat) caught = s; }
ok(!!caught && caught.seat === 'S.1', 'let go in the gust under the slot, the plug is carried up through it and caught on the socket (' + (caught ? caught.seat : 'not caught') + ')');
await sleep(1000);
ok((await pip()).secret, 'the catch is the golden tumbler: the gust put it home');
// ---- 2: the control: let go behind the fence, in the same gust, far from the socket
await load();
await carryTo(120, 265);
await sleep(4000);
const left = await pip();
ok(!left.seat, 'the control: behind the fence the gust carries it, but far from the socket it is not caught (x ' + Math.round(left.x) + ', y ' + Math.round(left.y) + ')');
console.log('LOGS:', logs.join('\n') || 'none');
console.log(fails ? fails + ' FAILED' : 'all fan41 probes passed');
await browser.close();
process.exit(fails ? 1 : 0);
