// Act 5, the crane (E4), with real mouse input (loads defs/crane-toy.json through ?def=):  node crane.mjs
//  1. a tap on the head over a prize takes it: the prize then moves with the head
//  2. a tap over the tray lands the prize in the tray (no drop)
//  3. a tap away from the tray drops the prize, and the drop is counted
//  4. a prize on a socket covers it: a plug let go there is refused; once the prize is lifted, the socket takes its plug
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { launch, sleep, toClient, URL } from './common.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const def = encodeURIComponent(fs.readFileSync(path.join(here, 'defs', 'crane-toy.json'), 'utf8'));
const { browser, page, logs } = await launch({ dpr: 1 });
const ev = (fn, a) => page.evaluate(fn, a);
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };
await page.goto(URL + '?def=' + def); await sleep(1800);
for (let i = 0; i < 40 && (await ev(() => window.__snug.G.Game.room.phase)) !== 'playing'; i++) await sleep(200);
await page.mouse.click(8, 420); await sleep(200);
const head = () => ev(() => { const C = window.__snug.G.Game.room.craneRT; return { x: C.x, y: C.y, on: C.on, drops: C.drops }; });
const prize = (id) => ev((id) => { const p = window.__snug.G.Game.room.craneRT.prizes.find((q) => q.id === id); return { x: p.x, y: p.y, att: p.att, inTray: p.inTray }; }, id);
const pipSeat = () => ev(() => window.__snug.G.Game.room.st.seat.pip || null);
// a real drag of the head along points, then let go; a tap is a press and release in place
async function drag(pts, ms = 700) {
  const cl = []; for (const q of pts) cl.push(await toClient(page, q[0], q[1]));
  await page.mouse.move(cl[0][0], cl[0][1]); await page.mouse.down();
  const steps = 16;
  for (let i = 1; i < cl.length; i++) for (let k = 1; k <= steps; k++) { const u = k / steps; await page.mouse.move(cl[i - 1][0] + (cl[i][0] - cl[i - 1][0]) * u, cl[i - 1][1] + (cl[i][1] - cl[i - 1][1]) * u); await sleep(ms / (steps * cl.length)); }
  await page.mouse.up(); await sleep(250);
}
async function tap(x, y) { const c = await toClient(page, x, y); await page.mouse.move(c[0], c[1]); await page.mouse.down(); await sleep(60); await page.mouse.up(); await sleep(250); }
// ---- 0: the C prize covers the coral socket: a plug let go over it is refused
{
  const pp = await ev(() => { const p = window.__snug.G.Game.room.plugRT.pip; return { x: p.x, y: p.y }; });
  await drag([[pp.x, pp.y], [150, 520]], 900);
  ok(!(await pipSeat()), 'under the C prize the coral socket is covered: the plug is refused');
  const pq = await ev(() => { const p = window.__snug.G.Game.room.plugRT.pip; return { x: p.x, y: p.y }; });
  await drag([[pq.x, pq.y], [60, 380]], 700); // back to its rest, off the prize
}
// ---- 1: take the C prize (it sits on the coral socket) and carry it
const h0 = await head();
await drag([[h0.x, h0.y], [150, 520]], 900);
await tap(150, 520);
ok((await prize('c')).att, 'a tap over the C prize takes it on the magnet');
await drag([[150, 520], [150, 330]], 700);
const cNow = await prize('c'), hNow = await head();
ok(cNow.att && Math.abs(cNow.y - hNow.y) < 6, 'the prize moves with the head (prize y ' + Math.round(cNow.y) + ', head y ' + Math.round(hNow.y) + ')');
// ---- 2: carry it to the tray and let go: it lands there
await drag([[150, 330], [290, 120]], 900);
await tap(290, 120);
const cTray = await prize('c');
ok(cTray.inTray && !cTray.att, 'a tap over the tray lands the prize in the tray');
ok((await head()).drops === 0, 'and nothing was dropped on the way');
// ---- 3: take the R prize and drop it away from the tray: counted
const h2 = await head();
await drag([[h2.x, h2.y], [210, 520]], 900);
await tap(210, 520);
await drag([[210, 520], [100, 200]], 800);
await tap(100, 200);
const rDrop = await prize('r');
ok(!rDrop.inTray && (await head()).drops === 1, 'a tap away from the tray drops the R prize, and the drop is counted (' + (await head()).drops + ')');
// ---- 4: the coral socket is covered until the C prize leaves it; now C is in the tray, so the socket is free
// first, put R back on its socket (so the amber socket is covered and the coral one is free): a plug over the covered amber socket is refused
const pipAt = await ev(() => { const p = window.__snug.G.Game.room.plugRT.pip; return { x: p.x, y: p.y }; });
await drag([[pipAt.x, pipAt.y], [150, 520]], 900);
ok((await pipSeat()) === 'B.1', 'with the C prize lifted off the coral socket, the coral plug seats in it');
console.log('LOGS:', logs.join('\n') || 'none');
console.log(fails ? fails + ' FAILED' : 'all crane probes passed');
await browser.close();
process.exit(fails ? 1 : 0);
