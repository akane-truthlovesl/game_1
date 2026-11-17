// Act 5, the fan (the wind band, E0), with real mouse input (loads defs/wind-toy.json through ?def=):  node fan.mjs
//  1. a plug let go inside the wind band is carried along the band (to the right): it moves at least 40 u in 1.5 s
//  2. a plug let go above the band is not pushed: it moves less than 8 u sideways in 1.5 s (the control)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { launch, sleep, toClient, URL } from './common.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const def = encodeURIComponent(fs.readFileSync(path.join(here, 'defs', 'wind-toy.json'), 'utf8'));
const { browser, page, logs } = await launch({ dpr: 1 });
const ev = (fn, a) => page.evaluate(fn, a);
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };
async function load() {
  await page.goto(URL + '?def=' + def); await sleep(1800);
  for (let i = 0; i < 40 && (await ev(() => window.__snug.G.Game.room.phase)) !== 'playing'; i++) await sleep(200);
  await page.mouse.click(8, 420); await sleep(200);
}
const pipXY = () => ev(() => { const p = window.__snug.G.Game.room.plugRT.pip; return { x: p.x, y: p.y, st: p.state }; });
// grab the plug, carry it to (x,y), let go
async function place(x, y) {
  const p0 = await pipXY(); const a = await toClient(page, p0.x, p0.y), b = await toClient(page, x, y);
  await page.mouse.move(a[0], a[1]); await page.mouse.down();
  for (let k = 1; k <= 30; k++) { const u = k / 30; await page.mouse.move(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u); await sleep(20); }
  await sleep(300); await page.mouse.up(); await sleep(150);
}
const pushes = async (ms) => { const a = await pipXY(); await sleep(ms); const b = await pipXY(); return { dx: b.x - a.x, x0: a.x, x1: b.x, st: b.st }; };

// ---- 1: released inside the band
await load();
await place(150, 420);
const inBand = await pushes(1500);
ok(inBand.dx > 40, 'released inside the wind band, the plug is carried along it (x ' + Math.round(inBand.x0) + ' to ' + Math.round(inBand.x1) + ', ' + Math.round(inBand.dx) + ' u)');

// ---- 2: released above the band: the control
await load();
await place(150, 250);
const above = await pushes(1500);
ok(Math.abs(above.dx) < 8, 'released above the band, the plug is not pushed (' + Math.round(above.dx) + ' u sideways, the control)');

console.log('LOGS:', logs.join('\n') || 'none');
console.log(fails ? fails + ' FAILED' : 'all fan probes passed');
await browser.close();
process.exit(fails ? 1 : 0);
