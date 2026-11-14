// storyboard: node shots.mjs <level> [prefix]  — screenshots the start, after every hinted action, and the wake
import { launch, sleep, toClient, URL } from './common.mjs';
const id = parseInt(process.argv[2] || '11', 10), prefix = process.argv[3] || 'sb';
const { browser, page, logs } = await launch({ dpr: 2 });
const ev = (fn, a) => page.evaluate(fn, a);
async function mouseDrag(path, ms) {
  const pts = []; for (const p of path) pts.push(await toClient(page, p[0], p[1]));
  await page.mouse.move(pts[0][0], pts[0][1]); await page.mouse.down();
  const total = pts.length - 1, steps = 26;
  for (let i = 1; i <= steps; i++) { const u = i / steps, e = u * u * (3 - 2 * u) * total, k = Math.min(total - 1, Math.floor(e)), f = e - k; await page.mouse.move(pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f, pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f); await sleep(ms / steps); }
  await sleep(160); await page.mouse.up();
}
await page.goto(URL + '?level=' + id); await sleep(2400);
await page.screenshot({ path: `out/${prefix}-0-start.png` });
for (let step = 1; step < 30; step++) {
  const st = await ev(() => { const r = window.__snug.Game.room; return { phase: r.phase, locked: r.locked }; });
  if (st.phase === 'settling' || st.phase === 'waking') break;
  if (st.locked || st.phase === 'cut' || st.phase === 'arriving') { await sleep(300); continue; }
  const act = await ev(() => {
    const G = window.__snug.G, r = G.Game.room, T = G.T, h = G.Rules.hint(r.L, r.st); if (!h) return null;
    const out = { type: h.type, off: [-T.offX, -T.offY] };
    if (h.type === 'seat') { const p = r.plugRT[h.plug], s = r.L.socketsById[h.socket]; out.from = [p.x, p.y]; out.to = [s.x, s.y]; out.pre = [s.x + s.fx * T.slideU, s.y + s.fy * T.slideU]; const g = G.Geom.shortest({ x: p.x, y: p.y }, { x: out.pre[0], y: out.pre[1] }, r.L.obstacles, 22); out.route = g.pts.map((q) => [q.x, q.y]); }
    else if (h.type === 'unseat') { const s = r.L.socketsById[h.from]; out.from = [s.x, s.y]; out.to = [s.x + s.fx * 70 + 18, s.y + s.fy * 70]; }
    else if (h.type === 'switch') { const s = r.L.stripsById[h.strip]; const xs = G.Rules.switchX(s); out.at = [s.x + xs * Math.cos(s.angle), s.y + xs * Math.sin(s.angle)]; }
    else if (h.type === 'slide') { const s = r.L.stripsById[h.strip], R = s.rail, tk = R.detents[h.to]; out.from = [s.x - s.n * s.pitch / 2 - 8, s.y]; out.to = [out.from[0] + (R.x1 - R.x0) * (tk - s.k), out.from[1] + (R.y1 - R.y0) * (tk - s.k)]; }
    return out;
  });
  if (!act) break;
  const f = (p) => [p[0] + act.off[0], p[1] + act.off[1]];
  if (act.type === 'switch') { const [cx, cy] = await toClient(page, act.at[0], act.at[1]); await page.mouse.click(cx, cy); }
  else if (act.type === 'seat') { const route = act.route && act.route.length > 2 ? act.route : [act.from, [(act.from[0] + act.pre[0]) / 2, (act.from[1] + act.pre[1]) / 2], act.pre]; await mouseDrag([act.from, ...route.slice(1).map(f), f(act.to)], 900); }
  else if (act.type === 'unseat') await mouseDrag([act.from, f(act.to)], 450);
  else if (act.type === 'slide') {
    // shoot a frame mid-slide
    const pts = []; for (const p of [act.from, [(act.from[0] + act.to[0]) / 2, (act.from[1] + act.to[1]) / 2], act.to]) pts.push(await toClient(page, p[0], p[1]));
    await page.mouse.move(pts[0][0], pts[0][1]); await page.mouse.down();
    for (let i = 1; i <= 30; i++) { const u = i / 30, e = u * u * (3 - 2 * u); await page.mouse.move(pts[0][0] + (pts[2][0] - pts[0][0]) * e, pts[0][1] + (pts[2][1] - pts[0][1]) * e); await sleep(1100 / 30); if (i === 14) await page.screenshot({ path: `out/${prefix}-${step}-midslide.png` }); }
    await sleep(160); await page.mouse.up(); await sleep(500);
  }
  await sleep(900);
  await page.screenshot({ path: `out/${prefix}-${step}-${act.type}.png` });
}
await sleep(1800); await page.screenshot({ path: `out/${prefix}-9-wake.png` });
await sleep(2200); await page.screenshot({ path: `out/${prefix}-9-settle.png` });
console.log('LOGS:', logs.join('\n') || 'none');
await browser.close();
