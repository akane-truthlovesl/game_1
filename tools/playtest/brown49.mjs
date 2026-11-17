// Act 5, Level 49 "Brownout", with real mouse input:  node brown49.mjs
//  1. the first seat turns the lights out: the bench is dark (a brownout is running)
//  2. in the dark, the other two plugs seat from memory, and the solve finishes in the dark: the golden crescent
//  3. the lights come back on their own after the dark (a second run that waits for the light, with no secret)
import { launch, sleep, toClient, URL } from './common.mjs';
const { browser, page, logs } = await launch({ dpr: 1 });
const ev = (fn, a) => page.evaluate(fn, a);
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };
async function load() {
  await page.goto(URL + '?level=49'); await sleep(900);
  for (let i = 0; i < 40 && (await ev(() => window.__snug.G.Game.room.phase)) !== 'playing'; i++) await sleep(200);
  await page.mouse.click(8, 420); await sleep(200);
}
const plugXY = (pid) => ev((pid) => { const p = window.__snug.G.Game.room.plugRT[pid]; return { x: p.x, y: p.y }; }, pid);
const seat = (pid) => ev((pid) => window.__snug.G.Game.room.st.seat[pid] || null, pid);
const dark = () => ev(() => !!window.__snug.G.Game.room.brownRT.dark);
async function drag(pts, ms = 700) {
  const cl = []; for (const q of pts) cl.push(await toClient(page, q[0], q[1]));
  await page.mouse.move(cl[0][0], cl[0][1]); await page.mouse.down();
  const steps = 16;
  for (let i = 1; i < cl.length; i++) for (let k = 1; k <= steps; k++) { const u = k / steps; await page.mouse.move(cl[i - 1][0] + (cl[i][0] - cl[i - 1][0]) * u, cl[i - 1][1] + (cl[i][1] - cl[i - 1][1]) * u); await sleep(ms / (steps * cl.length)); }
  await sleep(200); await page.mouse.up(); await sleep(300);
}
// ---- 1 and 2: the first seat, then the rest in the dark
await load();
const p0 = await plugXY('pip');
await drag([[p0.x, p0.y], [100, 240]], 800); // Pip, to the coral socket (the finger ends below the socket)
ok((await seat('pip')) === 'L.1', 'Pip seats in the coral socket (L.1)');
await sleep(300);
ok(await dark(), 'the first seat turns the lights out: the bench is dark');
const r0 = await plugXY('rex');
await drag([[r0.x, r0.y], [180, 240]], 700);
ok((await seat('rex')) === 'L.2', 'in the dark, Rex seats from memory (L.2)');
const d0 = await plugXY('dot');
await drag([[d0.x, d0.y], [260, 240]], 700);
ok((await seat('dot')) === 'L.3', 'and Dot seats in the dark (L.3): the solve finished while the lights were out');
await sleep(1200);
ok(await ev(() => !!window.__snug.G.Game.room.secretFound), 'the golden crescent is found: finished in the dark');
// ---- 3: a run that waits for the light: no crescent
await load();
const q0 = await plugXY('pip');
await drag([[q0.x, q0.y], [100, 240]], 800);
await sleep(6500); // the dark runs its six seconds
ok(!(await dark()), 'the lights come back on their own, after the dark');
const r1 = await plugXY('rex');
await drag([[r1.x, r1.y], [180, 240]], 700);
const d1 = await plugXY('dot');
await drag([[d1.x, d1.y], [260, 240]], 700);
await sleep(1200);
ok((await seat('dot')) === 'L.3' && !(await ev(() => !!window.__snug.G.Game.room.secretFound)), 'a solve finished in the light finds no crescent');
console.log('LOGS:', logs.join('\n') || 'none');
console.log(fails ? fails + ' FAILED' : 'all brown49 probes passed');
await browser.close();
process.exit(fails ? 1 : 0);
