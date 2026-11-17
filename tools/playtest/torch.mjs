// Act 5, Torchlight (the dark room and its memory, E2), with real mouse input (loads defs/torch-toy.json through ?def=):  node torch.mjs
//  1. a dark room: a socket the torch has not touched is not seen, and a plug let go over it is refused (it does not seat)
//  2. a sweep of the torch over the socket makes it seen (a ghost ring), and it stays seen after the torch moves away
//  3. with the socket seen, the plug seats in it
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { launch, sleep, toClient, URL } from './common.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const def = encodeURIComponent(fs.readFileSync(path.join(here, 'defs', 'torch-toy.json'), 'utf8'));
const { browser, page, logs } = await launch({ dpr: 1 });
const ev = (fn, a) => page.evaluate(fn, a);
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };
await page.goto(URL + '?def=' + def); await sleep(1800);
for (let i = 0; i < 40 && (await ev(() => window.__snug.G.Game.room.phase)) !== 'playing'; i++) await sleep(200);
await page.mouse.click(8, 420); await sleep(200);
const seen = (sid) => ev((sid) => !!window.__snug.G.Game.room.st.flags.seen[sid], sid);
const pip = () => ev(() => { const r = window.__snug.G.Game.room; const p = r.plugRT.pip; return { x: p.x, y: p.y, st: p.state, seat: r.st.seat.pip || null }; });
const sockXY = (sid) => ev((sid) => { const s = window.__snug.G.Game.room.L.socketsById[sid]; return { x: s.x, y: s.y }; }, sid);
// a real drag from a point to a point
async function drag(pts, ms = 900) {
  const cl = []; for (const q of pts) cl.push(await toClient(page, q[0], q[1]));
  await page.mouse.move(cl[0][0], cl[0][1]); await page.mouse.down();
  const steps = 16;
  for (let i = 1; i < cl.length; i++) for (let k = 1; k <= steps; k++) { const u = k / steps; await page.mouse.move(cl[i - 1][0] + (cl[i][0] - cl[i - 1][0]) * u, cl[i - 1][1] + (cl[i][1] - cl[i - 1][1]) * u); await sleep(ms / (steps * cl.length)); }
  await sleep(200); await page.mouse.up(); await sleep(400);
}
// ---- 1: the start: the coral socket is dark, and a plug over it is refused
ok(!(await seen('B.1')), 'in the dark, the coral socket (B.1) is not seen at the start');
const pStart = await pip();
const coral = await sockXY('B.1');
await drag([[pStart.x, pStart.y], [coral.x, coral.y]], 1000);
const refused = await pip();
ok(!refused.seat, 'a plug let go over an unseen socket does not seat (it is refused: ' + refused.st + ')');
// ---- 2: the torch sweeps over the coral socket: it is seen, and stays seen
await drag([[180, 300], [coral.x, coral.y + 30]], 900);
ok(await seen('B.1'), 'the torch sweeps over the coral socket, and it is seen');
await drag([[coral.x, coral.y + 30], [300, 380]], 600); // the torch moves away
ok(await seen('B.1'), 'once seen, the socket stays seen after the torch has moved away');
// ---- 3: with the socket seen, the plug seats in it
const p3 = await pip();
await drag([[p3.x, p3.y], [coral.x, coral.y]], 1000);
ok((await pip()).seat === 'B.1', 'with the socket seen, the plug seats in it (' + (await pip()).seat + ')');
console.log('LOGS:', logs.join('\n') || 'none');
console.log(fails ? fails + ' FAILED' : 'all torch probes passed');
await browser.close();
process.exit(fails ? 1 : 0);
