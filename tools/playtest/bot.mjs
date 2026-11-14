import { launch, sleep, toClient, URL } from './common.mjs';
const only = process.argv.slice(2).map(Number).filter(Boolean);
const { browser, page, logs } = await launch({ dpr: 1 });
const results = [];
async function mouseDrag(path, ms) {
  // path: array of stage points for the FINGER
  const pts = [];
  for (const p of path) pts.push(await toClient(page, p[0], p[1]));
  await page.mouse.move(pts[0][0], pts[0][1]);
  await page.mouse.down();
  const total = pts.length - 1;
  const steps = 26;
  for (let i = 1; i <= steps; i++) {
    const u = i / steps, e = u * u * (3 - 2 * u) * total;
    const k = Math.min(total - 1, Math.floor(e)), f = e - k;
    await page.mouse.move(pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f, pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f);
    await sleep(ms / steps);
  }
  await sleep(160);
  console.log('    pre-release', JSON.stringify(await page.evaluate(() => { const r = window.__snug.Game.room; return r.plugList.filter(p=>p.grab||p.state==='held').map(p => ({ id: p.id, st: p.state, x: +p.x.toFixed(0), y: +p.y.toFixed(0), hover: p.hover, strain: +p.rope.strain.toFixed(2), tgt: [+p.rope.tx.toFixed(0), +p.rope.ty.toFixed(0)], g: p.grab && [+p.grab.fx.toFixed(0), +p.grab.fy.toFixed(0)] })); })));
  await page.mouse.up();
}
await page.goto(URL); await sleep(1200);
const NLEV = await page.evaluate(() => window.__snug.G.Levels.length);
for (let id = 1; id <= NLEV; id++) {
  if (only.length && !only.includes(id)) continue;
  await page.goto(URL + '?level=' + id);
  await sleep(1500);
  const t0 = Date.now();
  let actions = 0, note = '';
  for (let step = 0; step < 60 && Date.now() - t0 < 70000; step++) {
    const st = await page.evaluate(() => { const r = window.__snug.Game.room; return { phase: r.phase, locked: r.locked }; });
    if (st.phase === 'settling' || st.phase === 'waking') break;
    if (st.locked || st.phase === 'cut' || st.phase === 'arriving') { await sleep(300); continue; }
    const act = await page.evaluate(() => {
      const G = window.__snug.G, r = G.Game.room, T = G.T;
      const h = G.Rules.hint(r.L, r.st);
      if (!h) return null;
      const out = { type: h.type, off: [-T.offX, -T.offY] };
      if (h.type === 'seat') { const p = r.plugRT[h.plug], s = r.L.socketsById[h.socket]; out.from = [p.x, p.y]; out.to = [s.x, s.y]; out.pre = [s.x + s.fx * T.slideU, s.y + s.fy * T.slideU]; out.plug = h.plug; out.sock = h.socket; const g = G.Geom.shortest({ x: p.x, y: p.y }, { x: out.pre[0], y: out.pre[1] }, r.L.obstacles, 22); out.route = g.pts.map((q) => [q.x, q.y]); }
      else if (h.type === 'unseat') { const s = r.L.socketsById[h.from]; out.from = [s.x, s.y]; out.to = [s.x + s.fx * 70 + 18, s.y + s.fy * 70]; out.plug = h.plug; }
      else if (h.type === 'switch') { const s = r.L.stripsById[h.strip]; const xs = G.Rules.switchX(s); out.at = [s.x + xs * Math.cos(s.angle), s.y + xs * Math.sin(s.angle)]; }
      else if (h.type === 'slide') { const s = r.L.stripsById[h.strip], R = s.rail, tk = R.detents[h.to]; out.from = [s.x - s.n * s.pitch / 2 - 8, s.y]; out.to = [out.from[0] + (R.x1 - R.x0) * (tk - s.k), out.from[1] + (R.y1 - R.y0) * (tk - s.k)]; out.strip = h.strip; out.toDetent = h.to; }
      return out;
    });
    if (!act) { note = 'no hint (crossings or stuck)'; break; }
    if (act.type === 'switch') { const [cx, cy] = await toClient(page, act.at[0], act.at[1]); await page.mouse.click(cx, cy); }
    else if (act.type === 'seat') {
      // touch ON the plug; the plug then floats up to finger+offset, so the finger ends below the socket
      const f = (p) => [p[0] + act.off[0], p[1] + act.off[1]];
      const endF = f(act.to);
      const route = act.route && act.route.length > 2 ? act.route : [act.from, [(act.from[0] + act.pre[0]) / 2, (act.from[1] + act.pre[1]) / 2], act.pre];
      // finger path: touch ON the plug, then the finger follows the route minus the hold offset
      await mouseDrag([act.from, ...route.slice(1).map(f), endF], 900);
    } else if (act.type === 'unseat') {
      const f = (p) => [p[0] + act.off[0], p[1] + act.off[1]];
      await mouseDrag([act.from, f(act.to)], 450);
    } else if (act.type === 'slide') {
      // a real thumb drag on the strip's end grip, along the rail, released over the target detent
      await mouseDrag([act.from, [(act.from[0] + act.to[0]) / 2, (act.from[1] + act.to[1]) / 2], act.to], 1100);
      await sleep(500);
    }
    actions++;
    await sleep(900);
    console.log('  L'+id+' step '+step+' '+JSON.stringify({a:act.type,plug:act.plug,sock:act.sock||null}), JSON.stringify(await page.evaluate(()=>{const r=window.__snug.Game.room;return {seat:r.st.seat,phase:r.phase,on:r.requiredOn(),states:r.plugList.map(p=>p.id+':'+p.state).join(',')}})));
    const seat = await page.evaluate((id) => { const r = window.__snug.Game.room; return act => 0; }, id);
  }
  // let the win sequence play out
  await sleep(1500);
  const fin = await page.evaluate(() => { const r = window.__snug.Game.room; return { phase: r.phase, stars: r.stars, seatCount: r.seatCount, fps: window.__snug.Game.fps && +window.__snug.Game.fps.toFixed(0), cross: r.crossHits.length }; });
  results.push({ id, actions, ms: Date.now() - t0, ...fin, note });
  console.log(JSON.stringify(results[results.length - 1]));
  await sleep(1500); await page.screenshot({ path: `out/fin-${id}.png` });
  console.log('   after settle: crossings', await page.evaluate(() => window.__snug.Game.room.crossHits.length));
}
console.log('LOGS:', logs.length ? logs.slice(0, 6).join('\n') : 'none');
await browser.close();
