// Act 4, Level 33 (Stretch) toy, with real mouse input (loads defs/stretch-toy.json through ?def=):  node sling.mjs
//  1. holding a plug pulled away from its device shows its flight as a dotted arc (the preview has the full path)
//  2. letting go slings the plug: its speed in the first moments is the pull times the spring
//  3. the sling whips the plug back toward its device, out past the port, and the tether brings it back
//  4. the arc is the flight: the plug's real path stays close to the path the preview drew (mean deviation, reported)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { launch, sleep, toClient, URL } from './common.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const def = encodeURIComponent(fs.readFileSync(path.join(here, 'defs', 'stretch-toy.json'), 'utf8'));
const { browser, page, logs } = await launch({ dpr: 1 });
const ev = (fn, a) => page.evaluate(fn, a);
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };
await page.goto(URL + '?def=' + def); await sleep(1800);
for (let i = 0; i < 40 && (await ev(() => window.__snug.G.Game.room.phase)) !== 'playing'; i++) await sleep(200);
await page.mouse.click(8, 420); await sleep(200);

const pos = () => ev(() => { const r = window.__snug.G.Game.room, p = r.plugRT.squeak, d = r.L.devicesById.squeak; return { x: p.x, y: p.y, st: p.state, sp: p.rope.speed, port: d.port, len: d.len }; });
const trace = (ms, every) => ev(([ms, every]) => new Promise((res) => { const out = []; const t0 = performance.now(); const tick = () => { const r = window.__snug.G.Game.room, p = r.plugRT.squeak; out.push({ x: p.x, y: p.y, sp: p.rope.speed, st: p.state, t: performance.now() - t0, sim: r.t }); if (performance.now() - t0 < ms) setTimeout(tick, every); else res(out); }; tick(); }), [ms, every]);

// ---- 1: pull the plug away from the port (to the left) and hold it: the arc appears
const p0 = await pos();
const a = await toClient(page, p0.x, p0.y), b = await toClient(page, p0.x - 130, p0.y + 4);
await page.mouse.move(a[0], a[1]); await page.mouse.down();
for (let i = 1; i <= 14; i++) { await page.mouse.move(a[0] + (b[0] - a[0]) * i / 14, a[1] + (b[1] - a[1]) * i / 14); await sleep(25); }
await sleep(250);
const held = await ev(() => { const r = window.__snug.G.Game.room, p = r.plugRT.squeak, v = r.slingVelocity(p); const pts = r.slingPath(p, v); return { st: p.state, pull: v.pull, n: pts.length, end: pts[pts.length - 1], far: Math.max(...pts.map((q) => Math.hypot(q.x - p.x, q.y - p.y))), vx: v.x, vy: v.y }; });
ok(held.st === 'held' && held.pull > 0.4 && held.n > 200, 'held away from its port, the flight is drawn: pull ' + held.pull.toFixed(2) + ', a path of ' + held.n + ' points');

// ---- 2 and 3: let go; the speed and the path
const tr = trace(2600, 40);
await page.mouse.up();
const samples = await tr;
// the room's own clock (sim), not the wall clock: a loaded machine runs fewer physics steps per second
const rel = samples.findIndex((s) => s.st !== 'held');
const early = samples.slice(rel).filter((s) => s.sim - samples[rel].sim <= 0.24);
const v0 = Math.max(...early.map((s) => s.sp || 0));
ok(early.length >= 1 && v0 > 150, 'let go, the plug is slung: it is moving at ' + v0.toFixed(0) + ' u/s in the first 0.24 s of its own clock (sampled every 40 ms; the launch is the pull times the spring)');
const port = (await pos()).port;
const dPort = samples.map((s) => Math.hypot(s.x - port.x, s.y - port.y));
const passed = Math.min(...dPort.slice(0, 20));
ok(passed < 80, 'the sling whips it back toward its device (closest approach ' + passed.toFixed(0) + ' u: the cable\'s own weight takes the rest)');
const far = Math.max(...samples.map((s) => Math.hypot(s.x - port.x, s.y - port.y)));
const back = samples.slice(samples.findIndex((s) => Math.hypot(s.x - port.x, s.y - port.y) === far)).some((s) => Math.hypot(s.x - port.x, s.y - port.y) < far - 60);
ok(far > 60 && back, 'out past the port to ' + far.toFixed(0) + ' u, and the tether brings it back');

// ---- 4: the arc was the flight: compare the real path with the preview's path (run again, fresh, same pull)
await page.goto(URL + '?def=' + def); await sleep(1800);
for (let i = 0; i < 40 && (await ev(() => window.__snug.G.Game.room.phase)) !== 'playing'; i++) await sleep(200);
await page.mouse.click(8, 420); await sleep(200);
const q0 = await pos();
const a2 = await toClient(page, q0.x, q0.y), b2 = await toClient(page, q0.x - 130, q0.y + 4);
await page.mouse.move(a2[0], a2[1]); await page.mouse.down();
for (let i = 1; i <= 14; i++) { await page.mouse.move(a2[0] + (b2[0] - a2[0]) * i / 14, a2[1] + (b2[1] - a2[1]) * i / 14); await sleep(25); }
await sleep(200);
const predicted = await ev(() => { const r = window.__snug.G.Game.room, p = r.plugRT.squeak, v = r.slingVelocity(p); return r.slingPath(p, v).filter((_, i) => i % 12 === 0).map((q) => [q.x, q.y]); });
const tr2 = trace(2000, 30);
await page.mouse.up();
const real = await tr2;
const relR = real.findIndex((s) => s.st !== 'held');
const sim0 = relR >= 0 ? real[relR].sim : 0;
const dev = [];
for (let k = 0; k < predicted.length; k++) {
  const tk = k * 12 / 120; // the preview's k-th point is 12 steps (0.1 s) after the release
  let best = null;
  for (const s of real.slice(relR)) { if (Math.abs(s.sim - sim0 - tk) < 0.03) { best = s; break; } }
  if (best) dev.push(Math.hypot(best.x - predicted[k][0], best.y - predicted[k][1]));
}
const mean = dev.length ? dev.reduce((x, y) => x + y, 0) / dev.length : 999;
ok(dev.length >= 6 && mean < 30, 'the arc is the flight: the real plug stays near the drawn path (mean ' + mean.toFixed(1) + ' u over ' + dev.length + ' samples)');

console.log('LOGS:', logs.join('\n') || 'none');
console.log(fails ? fails + ' FAILED' : 'all sling probes passed');
await browser.close();
process.exit(fails ? 1 : 0);
