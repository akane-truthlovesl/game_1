// Act 5, Level 48 "Duet With Yourself", with real mouse input:  node duet48.mjs
//  1. tap the record dot, then drag Pip round the teacup to its socket: the drag is recorded (kept for this page)
//  2. after a refresh, a ghost hand plays Pip's recorded drag by itself; the thumb seats Dot within a second of it: the golden crescent
import { launch, sleep, toClient, URL } from './common.mjs';
const { browser, page, logs } = await launch({ dpr: 1 });
const ev = (fn, a) => page.evaluate(fn, a);
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };
async function load() {
  await page.goto(URL + '?level=48'); await sleep(900);
  for (let i = 0; i < 40 && (await ev(() => window.__snug.G.Game.room.phase)) !== 'playing'; i++) await sleep(200);
  await page.mouse.click(8, 420); await sleep(200);
}
const seat = (pid) => ev((pid) => window.__snug.G.Game.room.st.seat[pid] || null, pid);
const plugXY = (pid) => ev((pid) => { const p = window.__snug.G.Game.room.plugRT[pid]; return [p.x, p.y]; }, pid);
async function drag(pts, ms = 900) {
  const cl = []; for (const q of pts) cl.push(await toClient(page, q[0], q[1]));
  await page.mouse.move(cl[0][0], cl[0][1]); await page.mouse.down();
  const steps = 20;
  for (let i = 1; i < cl.length; i++) for (let k = 1; k <= steps; k++) { const u = k / steps; await page.mouse.move(cl[i - 1][0] + (cl[i][0] - cl[i - 1][0]) * u, cl[i - 1][1] + (cl[i][1] - cl[i - 1][1]) * u); await sleep(ms / (steps * cl.length)); }
  await sleep(200); await page.mouse.up(); await sleep(300);
}
async function tap(x, y) { const c = await toClient(page, x, y); await page.mouse.move(c[0], c[1]); await page.mouse.down(); await sleep(60); await page.mouse.up(); await sleep(200); }
// ---- 1: record Pip's drag round the teacup
await load();
await tap(318, 92);
ok(await ev(() => !!window.__snug.G.Game.room.duetRT.armed), 'the record dot is armed by a tap');
const p0 = await plugXY('pip');
await drag([p0, [120, 300], [255, 250], [255, 160]], 2000);
ok((await seat('pip')) === 'D.2', 'the recorded drag seats Pip in the far socket (D.2), round the teacup');
ok(await ev(() => !!(window.__snug.G.duetStore && window.__snug.G.duetStore[48] && window.__snug.G.duetStore[48].path.length > 10)), 'the drag was recorded (' + (await ev(() => window.__snug.G.duetStore[48].path.length)) + ' points)');
// ---- 2: refresh: the ghost plays Pip; the thumb seats Dot within a second of it
await ev(() => window.__snug.G.Game.restart());
await sleep(1800);
for (let i = 0; i < 40 && (await ev(() => window.__snug.G.Game.room.phase)) !== 'playing'; i++) await sleep(200);
await sleep(300);
ok(!(await seat('pip')), 'the second attempt starts with Pip on its drum (no seat)');
// the thumb starts Dot's drag as the ghost's last stretch begins, so the two seats land together
const gdur = await ev(() => window.__snug.G.Game.room.duetRT.ghost.dur);
for (let i = 0; i < 200; i++) { const gt = await ev(() => window.__snug.G.Game.room.duetRT.ghost.t); if (gt >= gdur - 0.9) break; await sleep(50); }
const d0 = await plugXY('dot');
await drag([d0, [105, 160]], 600);
let ghostSeated = !!(await seat('pip'));
ok(ghostSeated, 'the ghost hand plays Pip back and seats it');
ok((await seat('dot')) === 'D.1', 'the thumb seats Dot in the other socket (D.1) as the ghost lands');
await sleep(1200);
ok(await ev(() => !!window.__snug.G.Game.room.secretFound), 'the two seats were a duet (within a second): the golden crescent');
console.log('LOGS:', logs.join('\n') || 'none');
console.log(fails ? fails + ' FAILED' : 'all duet48 probes passed');
await browser.close();
process.exit(fails ? 1 : 0);
