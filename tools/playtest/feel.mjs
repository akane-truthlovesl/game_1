import { launch, sleep, toClient, URL } from './common.mjs';
const { browser, page, logs } = await launch({ dpr: 2 });
const ev = (fn, arg) => page.evaluate(fn, arg);
const rep = (n, v, pass) => console.log((pass === undefined ? '      ' : pass ? 'PASS  ' : 'FAIL  ') + n.padEnd(46) + v);
await page.goto(URL + '?level=1'); await sleep(1800);
// 5. rest stability
const rest = await ev(async () => { const r = window.__snug.Game.room; let m = 0; for (let i = 0; i < 90; i++) { await new Promise(requestAnimationFrame); m = Math.max(m, r.plugList[0].rope.speed); } return m; });
rep('5  rest stability: max cable speed at rest', rest.toFixed(3) + ' u/s', rest < 2.4);
const P = await ev(() => { const r = window.__snug.Game.room, p = r.plugList[0]; return [p.x, p.y]; });
const [cx, cy] = await toClient(page, P[0], P[1]);
// 1. touch -> visible response within a frame
await ev(() => { window.__t = {}; const G = window.__snug.G, g = G.Game; const od = g.onDown.bind(g); g.onDown = (e) => { window.__t.down = performance.now(); od(e); }; const ou = g.onUp.bind(g); g.onUp = (e) => { window.__t.up = performance.now(); ou(e); }; const r = g.room; const oc = r.onContact.bind(r); r.onContact = (p) => { window.__t.contact = performance.now(); oc(p); }; });
await page.mouse.move(cx, cy); await page.mouse.down();
const lift1 = await ev(async () => { await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); const p = window.__snug.Game.room.plugList[0]; return { lift: p.lift, state: p.state, dt: performance.now() - window.__t.down }; });
rep('1  lift after ~2 frames (>0.05) / state', lift1.lift.toFixed(2) + ' / ' + lift1.state + '  (' + lift1.dt.toFixed(0) + ' ms)', lift1.lift > 0.05 && lift1.state === 'held');
// 3. follow lag at a slow, constant velocity (200 u/s) and a fast one (600 u/s)
async function lagAt(speed) {
  const s = await ev(() => { const p = window.__snug.Game.room.plugList[0]; return { y: p.rope.ty }; });
  const V = await ev(() => window.__snug.Game.view);
  const t0 = Date.now(); let lagMax = 0, lagEnd = 0, n = 0;
  const startX = cx, startY = cy; const pxPerU = V.scale;
  while (Date.now() - t0 < 700) {
    const el = (Date.now() - t0) / 1000;
    await page.mouse.move(startX + speed * el * pxPerU * 0.6, startY + speed * el * pxPerU * 0.2);
    await sleep(8);
    if (el > 0.4) { const l = await ev(() => { const p = window.__snug.Game.room.plugList[0], r = p.rope; return Math.hypot(r.tx - p.x, r.ty - p.y); }); lagEnd = l; n++; }
  }
  return lagEnd;
}
const l200 = await lagAt(200); rep('3  follow lag, 200 u/s drag (target - plug)', l200.toFixed(1) + ' u', l200 < 14);
const l600 = await lagAt(600); rep('   follow lag, 600 u/s drag (info)', l600.toFixed(1) + ' u');
await page.mouse.up(); await sleep(400);
// 4. cable inextensibility during a vigorous drag
await ev(() => { const r = window.__snug.Game.room; r.plugList[0].rope.mode = 0; });
const P2 = await ev(() => { const p = window.__snug.Game.room.plugList[0]; return [p.x, p.y]; });
const [ax, ay] = await toClient(page, P2[0], P2[1]);
await page.mouse.move(ax, ay); await page.mouse.down();
let maxRatio = 0, minChord = 1e9;
for (let i = 0; i < 60; i++) { await page.mouse.move(ax + 120 * Math.sin(i / 5), ay + 90 * Math.cos(i / 4) + i * 3); await sleep(12); const r = await ev(() => { const rp = window.__snug.Game.room.plugList[0].rope; return rp.polyLength() / rp.len; }); maxRatio = Math.max(maxRatio, r); }
rep('4  cable length / L under a vigorous drag (max)', maxRatio.toFixed(3), maxRatio < 1.03);
await page.mouse.up(); await sleep(400);
// 2. release -> contact
await page.goto(URL + '?level=1'); await sleep(1800);
await ev(() => { window.__t = {}; const G = window.__snug.G, g = G.Game; const ou = g.onUp.bind(g); g.onUp = (e) => { window.__t.up = performance.now(); ou(e); }; const r = g.room; const oc = r.onContact.bind(r); r.onContact = (p) => { window.__t.contact = performance.now(); oc(p); }; });
const I = await ev(() => { const r = window.__snug.Game.room, T = window.__snug.G.T, p = r.plugList[0], s = r.L.sockets[0]; return { p: [p.x, p.y], to: [s.x - T.offX, s.y - T.offY] }; });
const [bx, by] = await toClient(page, I.p[0], I.p[1]); const [tx, ty] = await toClient(page, I.to[0], I.to[1]);
await page.mouse.move(bx, by); await page.mouse.down();
for (let i = 1; i <= 26; i++) { await page.mouse.move(bx + (tx - bx) * i / 26, by + (ty - by) * i / 26); await sleep(28); }
await sleep(450); await page.mouse.up(); await sleep(500);
const tt = await ev(() => window.__t);
rep('2  release -> contact', (tt.contact - tt.up).toFixed(0) + ' ms  (target 90-130 incl. one frame)', tt.contact - tt.up > 85 && tt.contact - tt.up < 150);
// 6. reach honesty on level 3 (short cable cannot reach the far grommet)
await page.goto(URL + '?level=3'); await sleep(1800);
const I3 = await ev(() => { const r = window.__snug.Game.room, p = r.plugRT.a, s = r.L.socketsById['F.1']; return { p: [p.x, p.y], to: [s.x, s.y], port: [p.rope.rootX, p.rope.rootY], L: p.rope.len }; });
const [px, py] = await toClient(page, I3.p[0], I3.p[1]); const [qx, qy] = await toClient(page, I3.to[0], I3.to[1] + 40);
await page.mouse.move(px, py); await page.mouse.down();
let maxChord = 0, strained = 0;
for (let i = 1; i <= 36; i++) { await page.mouse.move(px + (qx - px) * i / 36, py + (qy - py) * i / 36); await sleep(30); const r = await ev(() => { const p = window.__snug.Game.room.plugRT.a; return { c: Math.hypot(p.x - p.rope.rootX, p.y - p.rope.rootY), s: p.rope.strain }; }); maxChord = Math.max(maxChord, r.c); strained = Math.max(strained, r.s); }
await page.mouse.up(); await sleep(500);
const seated = await ev(() => window.__snug.Game.room.st.seat.a);
rep('6  reach honesty: max chord / L, strain, seated?', (maxChord / I3.L).toFixed(3) + ' / ' + strained.toFixed(2) + ' / ' + seated, maxChord / I3.L < 1.02 && strained > 0.6 && !seated);
// 10. frame time with several cables moving
await page.goto(URL + '?level=7'); await sleep(1800);
const ft = await ev(async () => { const r = window.__snug.Game.room; const ts = []; let last = performance.now(); for (const p of r.plugList) { p.rope.mode = 0; } for (let i = 0; i < 180; i++) { for (const p of r.plugList) { const k = p.rope.n - 1; p.rope.x[k] += Math.sin(i / 9 + p.rope.x[0]) * 4; p.rope.y[k] += Math.cos(i / 7) * 4; } await new Promise(requestAnimationFrame); const n = performance.now(); ts.push(n - last); last = n; } ts.sort((a, b) => a - b); return { p50: ts[90], p90: ts[162], max: ts[179] }; });
rep('10 frame interval, 4 cables moving (p50 / p90 / max)', ft.p50.toFixed(1) + ' / ' + ft.p90.toFixed(1) + ' / ' + ft.max.toFixed(1) + ' ms  (headless, software raster)', ft.p90 < 24);
console.log('LOGS:', logs.join('\n') || 'none');
await browser.close();
