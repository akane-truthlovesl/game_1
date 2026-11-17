// Act 5, Level 47 "Rewind", with real mouse input:  node reel47.mjs
//  1. the drum under Pip's port lets the cable out when dragged down, and winds it in when dragged up (the cable's length follows the drum)
//  2. winding it all the way in is the rewound secret's act: the reel is wound back to its minimum
//  3. with the cable let out, the plug is carried across the bench and seats in the far socket (T.1); the rewound run finds the golden hook
import { launch, sleep, toClient, URL } from './common.mjs';
const { browser, page, logs } = await launch({ dpr: 1 });
const ev = (fn, a) => page.evaluate(fn, a);
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };
await page.goto(URL + '?level=47'); await sleep(900);
for (let i = 0; i < 40 && (await ev(() => window.__snug.G.Game.room.phase)) !== 'playing'; i++) await sleep(200);
await page.mouse.click(8, 420); await sleep(200);
const handle = () => ev(() => { const h = window.__snug.G.Game.room.reelRT.devs.pip.handle; return [h.x, h.y]; });
const len = () => ev(() => window.__snug.G.Game.room.plugRT.pip.rope.len);
const seat = (pid) => ev((pid) => window.__snug.G.Game.room.st.seat[pid] || null, pid);
const plugXY2 = (pid) => ev((pid) => { const p = window.__snug.G.Game.room.plugRT[pid]; return [p.x, p.y]; }, pid);
const plugXY = () => ev(() => { const p = window.__snug.G.Game.room.plugRT.pip; return [p.x, p.y]; });
async function drag(pts, ms = 900) {
  const cl = []; for (const q of pts) cl.push(await toClient(page, q[0], q[1]));
  await page.mouse.move(cl[0][0], cl[0][1]); await page.mouse.down();
  const steps = 20;
  for (let i = 1; i < cl.length; i++) for (let k = 1; k <= steps; k++) { const u = k / steps; await page.mouse.move(cl[i - 1][0] + (cl[i][0] - cl[i - 1][0]) * u, cl[i - 1][1] + (cl[i][1] - cl[i - 1][1]) * u); await sleep(ms / (steps * cl.length)); }
  await sleep(200); await page.mouse.up(); await sleep(400);
}
// ---- 1: let the cable out, then wind it in
const h0 = await handle();
const L0 = await len();
ok(Math.abs(L0 - 200) < 2, 'the cable starts on the drum at its short length (' + Math.round(L0) + ')');
await drag([h0, [h0[0], h0[1] + 150]], 900);
const L1 = await len();
ok(L1 > L0 + 200, 'dragging the drum down lets the cable out (' + Math.round(L0) + ' to ' + Math.round(L1) + ')');
const h1 = await handle();
await drag([h1, [h1[0], h1[1] - 400]], 900);
const L2 = await len();
ok(L2 <= 112 && (await ev(() => !!window.__snug.G.Game.room.reelWoundBack)), 'dragging the drum up winds the cable all the way in (' + Math.round(L2) + ')');
// ---- 2 and 3: let it out again to reach across the bench, and seat in the far socket
const h2 = await handle();
await drag([h2, [h2[0], h2[1] + 170]], 1000);
const L3 = await len();
ok(L3 > 340, 'the cable is let out to reach the far socket (' + Math.round(L3) + ')');
const p0 = await plugXY();
await drag([p0, [110, 160]], 1400); // to the far socket T.1 (110,120); the finger ends below it
ok((await seat('pip')) === 'T.1', 'the plug is carried across the bench and seats in the far socket (T.1)');
const d0 = await plugXY2('dot');
await drag([d0, [250, 160]], 1200);
ok((await seat('dot')) === 'T.2', 'Dot seats in the other socket (T.2), and the level is whole');
await sleep(1200);
ok(await ev(() => !!window.__snug.G.Game.room.secretFound), 'the cable was wound back to the drum during the run: the golden hook is found');
console.log('LOGS:', logs.join('\n') || 'none');
console.log(fails ? fails + ' FAILED' : 'all reel47 probes passed');
await browser.close();
process.exit(fails ? 1 : 0);
