// Act 5, Level 46 "Dollhouse", with real mouse input:  node doll46.mjs
//  1. the big room is locked: a plug let go on a big socket is refused ("locked") and does not seat, and the house stays shut
//  2. on a fresh attempt with no refusal: the miniature's two plugs (Lux, Gus) seat, the house opens, the big room takes Pip and Rex,
//     and the golden door-knocker is found (no plug was turned away)
import { launch, sleep, toClient, URL } from './common.mjs';
const { browser, page, logs } = await launch({ dpr: 1 });
const ev = (fn, a) => page.evaluate(fn, a);
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };
async function load() {
  await page.goto(URL + '?level=46'); await sleep(900);
  for (let i = 0; i < 40 && (await ev(() => window.__snug.G.Game.room.phase)) !== 'playing'; i++) await sleep(200);
  await page.mouse.click(8, 420); await sleep(200);
}
const plugXY = (pid) => ev((pid) => { const p = window.__snug.G.Game.room.plugRT[pid]; return { x: p.x, y: p.y }; }, pid);
const seat = (pid) => ev((pid) => window.__snug.G.Game.room.st.seat[pid] || null, pid);
const open = () => ev(() => !!window.__snug.G.Game.room.st.flags.doll.open);
async function drag(pts, ms = 900) {
  const cl = []; for (const q of pts) cl.push(await toClient(page, q[0], q[1]));
  await page.mouse.move(cl[0][0], cl[0][1]); await page.mouse.down();
  const steps = 18;
  for (let i = 1; i < cl.length; i++) for (let k = 1; k <= steps; k++) { const u = k / steps; await page.mouse.move(cl[i - 1][0] + (cl[i][0] - cl[i - 1][0]) * u, cl[i - 1][1] + (cl[i][1] - cl[i - 1][1]) * u); await sleep(ms / (steps * cl.length)); }
  await sleep(200); await page.mouse.up(); await sleep(400);
}
// ---- 1: a refusal on the locked big socket (its own attempt)
await load();
const pip0 = await plugXY('pip');
await drag([[pip0.x, pip0.y], [105, 370]], 1100); // the finger ends below the socket, as in the other drags
ok(!(await seat('pip')) && !(await open()), 'a plug let go on the locked big socket is refused: it does not seat, and the house is still shut');
ok((await ev(() => window.__snug.G.Game.room.refuseCount || 0)) >= 1, 'the refusal is counted');
// ---- 2: a fresh attempt, no refusal: the house first, then the big room
await load();
const lux = await plugXY('lux');
await drag([[lux.x, lux.y], [150, 150]], 900);
ok((await seat('lux')) === 'M.1', 'Lux seats in the little house (M.1)');
ok(!(await open()), 'one miniature plug is not enough: the house is still shut');
const gus = await plugXY('gus');
await drag([[gus.x, gus.y], [210, 150]], 900);
ok((await seat('gus')) === 'M.2' && (await open()), 'Gus seats: the miniature is whole and the house opens');
const pip1 = await plugXY('pip');
await drag([[pip1.x, pip1.y], [105, 370]], 1100); // the finger ends below the socket: the plug's aim is 40 u above the finger
ok((await seat('pip')) === 'B.1', 'with the house open, Pip seats in the big room (B.1)');
const rex = await plugXY('rex');
await drag([[rex.x, rex.y], [255, 370]], 1100);
ok((await seat('rex')) === 'B.2', 'and Rex seats in the big room (B.2)');
await sleep(1200);
ok(await ev(() => !!window.__snug.G.Game.room.secretFound), 'no plug was turned away on this attempt: the golden door-knocker is found');
console.log('LOGS:', logs.join('\n') || 'none');
console.log(fails ? fails + ' FAILED' : 'all doll46 probes passed');
await browser.close();
process.exit(fails ? 1 : 0);
