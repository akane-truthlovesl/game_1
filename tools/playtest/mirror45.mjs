// Act 5, Level 45 "Mirror, Mirror", with real mouse input:  node mirror45.mjs
//  1. one drag of Pip seats Pip and its reflection together (the reflection is grabbed by the same finger, at the mirror of it)
//  2. a clean run, with no finger across the seam, finds the golden crescent
//  3. a run that drags a plug across the seam cracks the glass, and the crescent is not found
import { launch, sleep, toClient, URL } from './common.mjs';
const { browser, page, logs } = await launch({ dpr: 1 });
const ev = (fn, a) => page.evaluate(fn, a);
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };
async function load() {
  await page.goto(URL + '?level=45'); await sleep(900);
  for (let i = 0; i < 40 && (await ev(() => window.__snug.G.Game.room.phase)) !== 'playing'; i++) await sleep(200);
  await page.mouse.click(8, 420); await sleep(200);
}
async function drag(pts, ms = 900) {
  const cl = []; for (const q of pts) cl.push(await toClient(page, q[0], q[1]));
  await page.mouse.move(cl[0][0], cl[0][1]); await page.mouse.down();
  const steps = 18;
  for (let i = 1; i < cl.length; i++) for (let k = 1; k <= steps; k++) { const u = k / steps; await page.mouse.move(cl[i - 1][0] + (cl[i][0] - cl[i - 1][0]) * u, cl[i - 1][1] + (cl[i][1] - cl[i - 1][1]) * u); await sleep(ms / (steps * cl.length)); }
  await sleep(200); await page.mouse.up(); await sleep(400);
}
const plugXY = (pid) => ev((pid) => { const p = window.__snug.G.Game.room.plugRT[pid]; return { x: p.x, y: p.y }; }, pid);
const seat = (pid) => ev((pid) => window.__snug.G.Game.room.st.seat[pid] || null, pid);
// the three pairs, the left side first: Pip, Rex, Dot (their reflections follow)
async function run(crack) {
  const pip = await plugXY('pip');
  await drag([[pip.x, pip.y], [80, 200]], 1100);
  if (crack === 'before') {
    // a finger that crosses the seam on the way: Rex goes round by the right, so its reflection crosses too
  }
  const rex = await plugXY('rex');
  await drag([[rex.x, rex.y], [120, 200]], 1100);
  const dot = await plugXY('dot');
  await drag(crack ? [[dot.x, dot.y], [200, 330], [160, 200]] : [[dot.x, dot.y], [160, 200]], 1100);
  await sleep(1500);
}
// ---- 1: Pip's drag seats Pip and its reflection together
await load();
const pip0 = await plugXY('pip');
await drag([[pip0.x, pip0.y], [80, 200]], 1100);
ok((await seat('pip')) === 'M.1' && (await seat('pip2')) === 'M.6', 'one drag of Pip seats Pip (M.1) and its reflection (M.6) together');
// ---- 2: the clean run, with no crack: the golden crescent
await load();
await run(false);
ok((await seat('rex')) === 'M.2' && (await seat('rex2')) === 'M.5' && (await seat('dot')) === 'M.3', 'the clean run seats every pair');
ok(await ev(() => window.__snug.G.Game.room.mirrorRT.crack === false), 'the glass never cracked');
await sleep(1200);
ok(await ev(() => !!window.__snug.G.Game.room.secretFound), 'the clean run finds the golden crescent');
// ---- 3: a run that drags a plug across the seam cracks the glass: no crescent
await load();
await run(true);
ok(await ev(() => window.__snug.G.Game.room.mirrorRT.crack === true), 'a finger across the seam cracks the glass');
await sleep(1200);
ok(!(await ev(() => !!window.__snug.G.Game.room.secretFound)), 'a cracked run does not find the crescent');
console.log('LOGS:', logs.join('\n') || 'none');
console.log(fails ? fails + ' FAILED' : 'all mirror45 probes passed');
await browser.close();
process.exit(fails ? 1 : 0);
