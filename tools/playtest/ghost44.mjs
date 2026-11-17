// Act 5, Level 44 "Ghost Cables", with real mouse input:  node ghost44.mjs
//  1. the first run seats all three plugs (Rex's cable goes round the teacup); the wake leaves the cables as ghosts
//  2. a second run that follows the first (the same drags, after the refresh button) seats every plug warm: the golden teacup spoon
import { launch, sleep, toClient, URL } from './common.mjs';
const { browser, page, logs } = await launch({ dpr: 1 });
const ev = (fn, a) => page.evaluate(fn, a);
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };
async function load() {
  await page.goto(URL + '?level=44'); await sleep(900);
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
// one run: the same three drags every time (Rex's goes round the teacup)
async function run() {
  const pip = await plugXY('pip'), rex = await plugXY('rex'), dot = await plugXY('dot');
  await drag([[pip.x, pip.y], [110, 200]], 1000);
  await drag([[rex.x, rex.y], [240, 330], [200, 230], [180, 200]], 1400);
  await drag([[dot.x, dot.y], [250, 200]], 1000);
  await sleep(1500);
}
await load();
await run();
ok((await seat('pip')) === 'K.1' && (await seat('rex')) === 'K.2' && (await seat('dot')) === 'K.3', 'the first run seats all three plugs (Rex round the teacup)');
ok(await ev(() => !!window.__snug.G.ghostStore[44]), 'the first run leaves its cables as ghosts');
// the second run: the refresh button (the same page), then the same drags
await ev(() => window.__snug.G.Game.restart());
await sleep(1800);
for (let i = 0; i < 40 && (await ev(() => window.__snug.G.Game.room.phase)) !== 'playing'; i++) await sleep(200);
await sleep(300);
await run();
const warm = await ev(() => { const R = window.__snug.G.Game.room.ghostRT; return { pip: !!R.warm.pip, rex: !!R.warm.rex, dot: !!R.warm.dot, match: R.match }; });
ok(warm.pip && warm.rex && warm.dot, 'the second run follows the first: every plug seats warm (' + JSON.stringify(warm) + ')');
await sleep(1200);
ok(await ev(() => !!window.__snug.G.Game.room.secretFound), 'the golden teacup spoon is found');
console.log('LOGS:', logs.join('\n') || 'none');
console.log(fails ? fails + ' FAILED' : 'all ghost44 probes passed');
await browser.close();
process.exit(fails ? 1 : 0);
