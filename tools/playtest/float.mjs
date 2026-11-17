// Act 4, the station (zero-g toy, no goal): node float.mjs   (loads defs/float-toy.json through ?def=)
//  1. a flicked plug drifts on after the hand lets go, and comes to rest within a few seconds
//  2. the tether holds: however hard the flick, the plug never leaves its cable's reach
//  3. a plug drifting slowly past a free socket is caught by its magnet and docks
//  4. a plug drifting fast past a socket flies on: it is not caught
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { launch, sleep, toClient, URL } from './common.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const def = encodeURIComponent(fs.readFileSync(path.join(here, 'defs', 'float-toy.json'), 'utf8'));
const { browser, page, logs } = await launch({ dpr: 1 });
const ev = (fn, a) => page.evaluate(fn, a);
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };

await page.goto(URL + '?def=' + def); await sleep(1800);
for (let i = 0; i < 40 && (await ev(() => window.__snug.G.Game.room.phase)) !== 'playing'; i++) await sleep(200);
await page.mouse.click(8, 420); await sleep(200); // a first touch (audio, haptics)

const pos = (id) => ev((id) => { const r = window.__snug.G.Game.room, p = r.plugRT[id]; return { x: p.x, y: p.y, st: p.state, seat: r.st.seat[id] || null, sp: p.rope.speed, port: r.L.devicesById[id] ? r.L.devicesById[id].port : null, len: r.L.devicesById[id] ? r.L.devicesById[id].len : null }; }, id);
// a flick: press on the plug, move quickly (about `ms` per `steps`) toward (tx, ty), let go
async function flick(id, tx, ty, ms, steps = 4) {
  const p0 = await pos(id);
  const a = await toClient(page, p0.x, p0.y), b = await toClient(page, tx, ty);
  await page.mouse.move(a[0], a[1]); await page.mouse.down();
  for (let i = 1; i <= steps; i++) { await page.mouse.move(a[0] + (b[0] - a[0]) * i / steps, a[1] + (b[1] - a[1]) * i / steps); await sleep(ms / steps); }
  await page.mouse.up();
}
const trace = async (id, ms, every = 50) => { const out = []; for (let t = 0; t < ms; t += every) { out.push(await pos(id)); await sleep(every); } return out; };

// ---- 1: the drift
const r0 = await pos('pip');
await flick('pip', r0.x + 70, r0.y - 40, 90, 3);
const tr1 = await trace('pip', 3200);
const d1 = tr1.map((p) => Math.hypot(p.x - r0.x, p.y - r0.y));
const moved = Math.max(...d1);
const last = tr1[tr1.length - 1];
ok(moved > 60 && (last.sp || 0) < 14, 'a flicked plug drifts on after the hand lets go (furthest ' + moved.toFixed(0) + ' u from where it started) and comes to rest (speed ' + (last.sp || 0).toFixed(1) + ')');
console.log('      trace (u from start, every 0.4 s):', d1.filter((_, i) => i % 8 === 0).map((d) => d.toFixed(0)).join(' '));

// ---- 2: the tether
const p2 = await pos('pip');
const port = p2.port, len = p2.len;
await flick('pip', p2.x - 120, p2.y + 60, 30, 2);
const tr2 = await trace('pip', 1600, 40);
const far = Math.max(...tr2.map((p) => Math.hypot(p.x - port.x, p.y - port.y)));
ok(far <= len + 8, 'the tether holds: the furthest the plug gets from its port is ' + far.toFixed(0) + ' u, against a cable of ' + len + ' u');

// ---- 3: a slow drift into a socket's magnet
const p3 = await pos('rex');
await flick('rex', 250, 250 + 10, 260, 6); // a lob that is slow where it matters: it drifts into the amber socket
const tr3 = await trace('rex', 2600, 40);
const seated3 = (await pos('rex')).seat;
ok(!!seated3 && seated3.startsWith('G2'), 'a slow plug drifting past a free socket is caught by its magnet (seat: ' + seated3 + ')');
console.log('      start', p3.x.toFixed(0), p3.y.toFixed(0), 'end', tr3[tr3.length - 1].x.toFixed(0), tr3[tr3.length - 1].y.toFixed(0), 'speeds', tr3.filter((_, i) => i % 6 === 0).map((p) => (p.sp || 0).toFixed(0)).join(' '));

// ---- 4: a fast pass goes by (a fresh room: Pip at rest, nothing seated, flicked hard past the amber socket)
await page.goto(URL + '?def=' + def); await sleep(1800);
for (let i = 0; i < 40 && (await ev(() => window.__snug.G.Game.room.phase)) !== 'playing'; i++) await sleep(200);
const rest4 = await pos('pip');
console.log('      fresh room: pip', rest4.st, rest4.seat, rest4.x.toFixed(0), rest4.y.toFixed(0));
await flick('pip', 280, 235, 60, 3); // along the line from its rest (150,300) through the amber socket (250,250)
const tr4 = await trace('pip', 900, 25);
const caught4 = tr4.some((p) => p.seat);
const near4 = tr4.filter((p) => Math.hypot(p.x - 250, p.y - 250) < 40);
ok(!caught4, 'a plug flicked fast past the amber socket is not caught on the way by');
console.log('      fast pass: peak speed', Math.max(...tr4.map((p) => p.sp || 0)).toFixed(0), 'u/s; speed near the socket', near4.map((p) => (p.sp || 0).toFixed(0)).join(' ') || 'none');

console.log('LOGS:', logs.join('\n') || 'none');
console.log(fails ? fails + ' FAILED' : 'all float probes passed');
await browser.close();
process.exit(fails ? 1 : 0);
