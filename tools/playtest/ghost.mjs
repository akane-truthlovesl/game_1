// Act 5, Ghost Cables (E6), with real mouse input (loads defs/ghost-toy.json through ?def=):  node ghost.mjs
//  1. a complete run leaves its cables behind: the next attempt (the refresh button, same page) has the ghost; a reload forgets it
//  2. the follow measure: a cable that is on its ghost's route scores high (>= 0.9); one a long way off scores low (<= 0.2)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { launch, sleep, toClient, URL } from './common.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const def = encodeURIComponent(fs.readFileSync(path.join(here, 'defs', 'ghost-toy.json'), 'utf8'));
const { browser, page, logs } = await launch({ dpr: 1 });
const ev = (fn, a) => page.evaluate(fn, a);
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };
async function load() {
  await page.goto(URL + '?def=' + def); await sleep(1800);
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
// ---- 1: a first run, to the socket, round the post; then a fresh load has its ghost
await load();
ok((await ev(() => window.__snug.G.Game.room.ghostRT.prev)) === null, 'the first attempt has no ghost');
const pp = await ev(() => { const p = window.__snug.G.Game.room.plugRT.pip; return { x: p.x, y: p.y }; });
const sock = await ev(() => { const s = window.__snug.G.Game.room.L.socketsById['G.1']; return { x: s.x, y: s.y }; });
await drag([[pp.x, pp.y], [230, 470], [sock.x, sock.y]], 1400);
await sleep(1200);
ok((await ev(() => window.__snug.G.Game.room.st.seat.pip)) === 'G.1', 'the first run seats the plug in its socket (round the post)');
ok((await ev(() => !!window.__snug.G.ghostStore[99])), 'the completed run leaves its cables in the store (for this page)');
await ev(() => window.__snug.G.Game.restart()); // the refresh button: the same page, a new attempt
await sleep(1800);
for (let i = 0; i < 40 && (await ev(() => window.__snug.G.Game.room.phase)) !== 'playing'; i++) await sleep(200);
const prev = await ev(() => window.__snug.G.Game.room.ghostRT.prev);
ok(prev && prev.pip && prev.pip.length > 4, 'the next attempt has the ghost of the last run (' + (prev && prev.pip ? prev.pip.length : 0) + ' points)');
// ---- 2: the measure: a rope on its ghost scores high; a rope far from it scores low
const scores = await ev(() => {
  const R = window.__snug.G.Room.prototype, prev = window.__snug.G.Game.room.ghostRT.prev.pip;
  const fake = (dx) => { const n = (prev.length - 1) * 4 + 1; const x = new Float32Array(n), y = new Float32Array(n); for (let i = 0; i < prev.length; i++) { x[(i) * 4] = prev[i].x + dx; y[(i) * 4] = prev[i].y; } for (let i = 0; i < n; i++) { if (i % 4) { const a = Math.floor(i / 4), t = (i % 4) / 4; x[i] = x[a * 4] * (1 - t) + x[Math.min(a + 1, prev.length - 1) * 4] * t; y[i] = y[a * 4] * (1 - t) + y[Math.min(a + 1, prev.length - 1) * 4] * t; } } return { n, x, y }; };
  const room = window.__snug.G.Game.room;
  return { on: R.ghostMatch.call(room, { rope: fake(0) }, prev), far: R.ghostMatch.call(room, { rope: fake(160) }, prev) };
});
ok(scores.on >= 0.9, 'a cable on its ghost route scores high (' + scores.on.toFixed(2) + ')');
ok(scores.far <= 0.2, 'a cable a long way off scores low (' + scores.far.toFixed(2) + ')');
console.log('LOGS:', logs.join('\n') || 'none');
console.log(fails ? fails + ' FAILED' : 'all ghost probes passed');
await browser.close();
process.exit(fails ? 1 : 0);
