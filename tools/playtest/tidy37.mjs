// Level 37 tidy over a whole swing: seat the three plugs (real drags), then sample the live cable crossings for two full periods.
//   node tidy37.mjs   — reports how many samples show a crossing, and at which swing angles
import { launch, sleep, toClient, URL } from './common.mjs';
const { browser, page } = await launch({ dpr: 1 });
const ev = (fn, a) => page.evaluate(fn, a);
await page.goto(URL + '?level=37'); await sleep(900);
for (let i = 0; i < 40 && (await ev(() => window.__snug.G.Game.room.phase)) !== 'playing'; i++) await sleep(200);
await page.mouse.click(8, 420); await sleep(200);
const bottom = () => ev(() => { const r = window.__snug.G.Game.room, C = r.L.carried[0].carrier; return { w: window.__snug.G.Rules.opensIn(r.st, r.L.socketsById['Choo.1']), th: C.th, m: Math.round(r.timerClock() / (C.period / 2)), off: [-window.__snug.G.T.offX, -window.__snug.G.T.offY] }; });
const sock = (sid) => ev((sid) => { const s = window.__snug.G.Game.room.L.socketsById[sid]; return { x: s.x, y: s.y }; }, sid);
const plug = (pid) => ev((pid) => { const p = window.__snug.G.Game.room.plugRT[pid]; return { x: p.x, y: p.y }; }, pid);
async function chase(pid, sid, timeout = 12000) {
  const p0 = await plug(pid); const c0 = await toClient(page, p0.x, p0.y);
  await page.mouse.move(c0[0], c0[1]); await page.mouse.down();
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    const s = await sock(sid), b = await bottom();
    const c = await toClient(page, s.x + b.off[0], s.y + b.off[1]); await page.mouse.move(c[0], c[1]);
    if (Date.now() - t0 > 250 && b.w <= 0 && Math.abs(b.th) < 0.14) break;
    await sleep(8);
  }
  await page.mouse.up(); await sleep(450);
}
await chase('squeak', 'Choo.1'); await chase('spike', 'Choo.2'); await chase('dot', 'Choo.3');
const samples = await ev(() => new Promise((res) => {
  const out = []; const t0 = performance.now(); const r = window.__snug.G.Game.room, C = r.L.carried[0].carrier;
  const tick = () => { out.push({ th: C.th, n: r.crossHits.length, t: performance.now() - t0 }); if (performance.now() - t0 < 11000) setTimeout(tick, 25); else res(out); };
  tick();
}));
const withCross = samples.filter((s) => s.n > 0);
const angles = withCross.map((s) => s.th.toFixed(2));
console.log('samples', samples.length, 'with a crossing', withCross.length, 'angles (rad):', [...new Set(angles)].slice(0, 30).join(' '));
console.log('crossing range', withCross.length ? Math.min(...withCross.map((s) => s.th)).toFixed(3) + ' .. ' + Math.max(...withCross.map((s) => s.th)).toFixed(3) : 'none');
await browser.close();
