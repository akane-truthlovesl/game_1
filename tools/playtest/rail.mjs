// Rail feel probes: drag to a detent, flick, taut-cable stop, moving strips refuse plugs (real pointer events)
import { launch, sleep, toClient, URL } from './common.mjs';
const { browser, page, logs } = await launch({ dpr: 1 });
const ev = (fn, arg) => page.evaluate(fn, arg);
const rep = (n, v, pass) => console.log((pass ? 'PASS  ' : 'FAIL  ') + n.padEnd(58) + v);
const hook = () => ev(() => {
  const A = window.__snug.G.Audio, c = (window.__c = { detent: 0, clunk: 0, end: 0, twang: 0 });
  for (const [k, f] of [['detent', 'detent'], ['clunk', 'clunk'], ['end', 'endstop'], ['twang', 'twang']]) { const o = A.sfx[f]; A.sfx[f] = (...a) => { c[k]++; return o(...a); }; }
});
const grip = () => ev(() => { const s = window.__snug.Game.room.L.rails[0]; return [s.x - s.n * s.pitch / 2 - 8, s.y, s.k]; });
async function dragStrip(dx, ms, release = true, steps = 30) {
  const [gx, gy] = await grip();
  const a = await toClient(page, gx, gy), b = await toClient(page, gx + dx, gy);
  await page.mouse.move(a[0], a[1]); await page.mouse.down();
  for (let i = 1; i <= steps; i++) { const u = i / steps; await page.mouse.move(a[0] + (b[0] - a[0]) * u, a[1]); await sleep(ms / steps); }
  if (release) await page.mouse.up();
}
const state = () => ev(() => { const r = window.__snug.Game.room, s = r.L.rails[0], rt = r.railRT.R; return { k: +s.k.toFixed(3), det: r.st.rail.R, moving: !!r.st.flags.moving.R, v: +rt.v.toFixed(1), settled: rt.settled }; });
await page.goto(URL + '?level=11'); await sleep(1800); await hook();
// 1. a slow drag one detent to the left
const s0 = await state();
await dragStrip(-36, 700);
await sleep(900);
const s1 = await state(); const c1 = await ev(() => ({ ...window.__c }));
rep('slow drag one detent left settles on detent 3', JSON.stringify(s0) + ' -> ' + JSON.stringify(s1), s0.det === 4 && s1.det === 3 && !s1.moving && s1.settled);
rep('a ratchet tick / clunk on the way', JSON.stringify(c1), c1.clunk >= 1);
// 2. a flick: fast drag, released while still moving
await page.goto(URL + '?level=11'); await sleep(1500); await hook();
const [gx, gy] = await grip();
const a = await toClient(page, gx, gy), b = await toClient(page, gx - 80, gy);
await page.mouse.move(a[0], a[1]); await page.mouse.down();
for (let i = 1; i <= 8; i++) { await page.mouse.move(a[0] + (b[0] - a[0]) * i / 8, a[1]); await sleep(9); }
await page.mouse.up();
const early = await state();
await sleep(1600);
const fl = await state(); const cf = await ev(() => ({ ...window.__c }));
rep('a flick keeps gliding after release (v > 60 at release)', JSON.stringify(early), Math.abs(early.v) > 60 || early.moving);
rep('and settles on a detent with ticks on the way', JSON.stringify(fl) + ' ' + JSON.stringify(cf), fl.settled && !fl.moving && [0, 1, 2, 3].includes(fl.det) && cf.detent >= 1);
// 3. a hard flick into the end stop
await page.goto(URL + '?level=11'); await sleep(1500); await hook();
const [g3x, g3y] = await grip();
const a3 = await toClient(page, g3x, g3y), b3 = await toClient(page, g3x - 200, g3y);
await page.mouse.move(a3[0], a3[1]); await page.mouse.down();
for (let i = 1; i <= 6; i++) { await page.mouse.move(a3[0] + (b3[0] - a3[0]) * i / 6, a3[1]); await sleep(8); }
await page.mouse.up(); await sleep(1800);
const e3 = await state(); const ce = await ev(() => ({ ...window.__c }));
rep('flicking into the left end stop tings and rests at detent 0', JSON.stringify(e3) + ' ' + JSON.stringify(ce), e3.det === 0 && ce.end >= 1);
// 4. a taut cable stops the strip: seat Gus (short cable) at the right end, then drag the strip hard to the left
await page.goto(URL + '?level=11'); await sleep(1500); await hook();
const I = await ev(() => { const r = window.__snug.Game.room, T = window.__snug.G.T, p = r.plugRT.gus, s = r.L.socketsById['R.4']; const g = window.__snug.G.Geom.shortest({ x: p.x, y: p.y }, { x: s.x + s.fx * T.slideU, y: s.y + s.fy * T.slideU }, r.L.obstacles, 22); return { route: g.pts.map((q) => [q.x - T.offX, q.y - T.offY]), from: [p.x, p.y] }; });
{ const pts = []; for (const q of [I.from, ...I.route.slice(1)]) pts.push(await toClient(page, q[0], q[1])); await page.mouse.move(pts[0][0], pts[0][1]); await page.mouse.down(); for (let i = 1; i <= 24; i++) { const u = (i / 24) * (pts.length - 1), k = Math.min(pts.length - 2, Math.floor(u)), f = u - k; await page.mouse.move(pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f, pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f); await sleep(38); } await sleep(200); await page.mouse.up(); await sleep(700); }
const seated = await ev(() => window.__snug.Game.room.st.seat.gus);
await dragStrip(-170, 900, false);
const held = await ev(() => { const r = window.__snug.Game.room, p = r.plugRT.gus; return { k: +r.L.rails[0].k.toFixed(3), strain: +(p.railStrain || 0).toFixed(2), squint: +r.devRT.gus.face.squint.toFixed(2), wince: +r.devRT.gus.wince.toFixed(2), canSeat: window.__snug.G.Rules.canSeat(r.L, r.st, 'lux', 'R.1').why }; });
await page.mouse.up(); await sleep(900);
const after = await state();
rep('Gus seated at the right end first', String(seated), seated === 'R.4');
rep('pulling past the cable: strip stops, Gus strains and squints', JSON.stringify(held), held.k > 0.2 && held.k < 0.5 && held.strain > 0.5 && (held.squint > 0.5 || held.wince > 0));
rep('while the strip is held it refuses plugs (reason: moving)', held.canSeat, held.canSeat === 'moving');
rep('released: the strip settles on a detent the cable allows (>= 2)', JSON.stringify(after), after.settled && after.det >= 2);
console.log('LOGS:', logs.join('\n') || 'none');
await browser.close();
