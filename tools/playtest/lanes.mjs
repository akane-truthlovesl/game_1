// Act 4, Level 38 (Lanes) toy, with real mouse input (loads defs/lanes-toy.json through ?def=):  node lanes.mjs
//  1. a cable pulled straight at its socket through another lane is refused: the bar across that lane's gap stops it, and the gate does not thread
//  2. the same cable routed round the lanes (under them, then up its own lane) threads its own three clips and seats
//  3. a cable whose lane is straight below its socket runs up through its clips and seats
//  4. the phone is routed round the other side the same way and seats
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { launch, sleep, toClient, URL } from './common.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const def = encodeURIComponent(fs.readFileSync(path.join(here, 'defs', 'lanes-toy.json'), 'utf8'));
const { browser, page, logs } = await launch({ dpr: 1 });
const ev = (fn, a) => page.evaluate(fn, a);
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };
async function load() {
  await page.goto(URL + '?def=' + def); await sleep(1800);
  for (let i = 0; i < 40 && (await ev(() => window.__snug.G.Game.room.phase)) !== 'playing'; i++) await sleep(200);
  await page.mouse.click(8, 420); await sleep(200);
}
await load();

const plugAt = (pid) => ev((pid) => { const r = window.__snug.G.Game.room, p = r.plugRT[pid]; return { x: p.x, y: p.y, seat: r.st.seat[pid] || null }; }, pid);
const threadOf = (pid, gid) => ev(([pid, gid]) => !!window.__snug.G.Game.room.st.thread[pid][gid], [pid, gid]);
// a real drag along stage points (a thumb's pace), then let go
async function drag(points, ms = 900) {
  const cl = []; for (const q of points) cl.push(await toClient(page, q[0], q[1]));
  await page.mouse.move(cl[0][0], cl[0][1]); await page.mouse.down();
  const steps = 16;
  for (let i = 1; i < cl.length; i++) for (let k = 1; k <= steps; k++) { const u = k / steps; await page.mouse.move(cl[i - 1][0] + (cl[i][0] - cl[i - 1][0]) * u, cl[i - 1][1] + (cl[i][1] - cl[i - 1][1]) * u); await sleep(ms / (steps * cl.length)); }
  await sleep(250); await page.mouse.up(); await sleep(500);
}

// ---- 1: Squeak (coral) straight at its socket: the line crosses the sky lane's gap (s2), which is shut to a coral cable
await drag([[300, 470], [180, 300]], 700);
ok(!(await threadOf('squeak', 's2')), 'a coral cable pulled straight through the sky lane is refused: the sky clip does not thread');

await load();
// ---- 2: Squeak routed under the lanes, then up its own lane (c3, c2, c1), into its socket R.1
await drag([[300, 470], [300, 520], [110, 520], [110, 430], [110, 380], [110, 330], [110, 236]], 1400);
const sq = await plugAt('squeak');
ok(sq.seat === 'R.1', 'routed round the lanes and up its own, Squeak seats in R.1 (' + sq.seat + ')');
ok((await threadOf('squeak', 'c1')) && (await threadOf('squeak', 'c2')) && (await threadOf('squeak', 'c3')), 'all three coral clips are threaded');
ok(!(await threadOf('squeak', 'a1')) && !(await threadOf('squeak', 's1')), 'and no other lane\'s clip was threaded on the way');

await load();
// ---- 3: Spike (amber) straight up its own lane into R.2
await drag([[180, 500], [180, 236]], 1000);
ok((await plugAt('spike')).seat === 'R.2', 'Spike runs straight up its own lane and seats in R.2');

await load();
// ---- 4: Dot (sky) routed round the other side, under the lanes, and up the sky lane into R.3
await drag([[60, 470], [60, 520], [250, 520], [250, 430], [250, 380], [250, 330], [250, 236]], 1400);
ok((await plugAt('dot')).seat === 'R.3', 'Dot routed round under the lanes seats in R.3');

console.log('LOGS:', logs.join('\n') || 'none');
console.log(fails ? fails + ' FAILED' : 'all lanes probes passed');
await browser.close();
process.exit(fails ? 1 : 0);
