// storyboard: node shots.mjs <level> [prefix]  — screenshots the start, after every hinted action, and the wake
import { launch, sleep, toClient, URL } from './common.mjs';
import fs from 'fs';
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
await page.goto(process.env.DEF ? URL + '?def=' + encodeURIComponent(fs.readFileSync(process.env.DEF, 'utf8')) : URL + '?level=' + id); await sleep(2400);
await page.screenshot({ path: `out/${prefix}-0-start.png` });
if (process.env.ONLY_START) { console.log('LOGS:', logs.join('\n') || 'none'); await browser.close(); process.exit(0); }
for (let step = 1; step < 30; step++) {
  const st = await ev(() => { const r = window.__snug.Game.room; return { phase: r.phase, locked: r.locked }; });
  if (st.phase === 'settling' || st.phase === 'waking') break;
  if (st.locked || st.phase === 'cut' || st.phase === 'arriving') { await sleep(300); continue; }
  const act = await ev(() => {
    const G = window.__snug.G, r = G.Game.room, T = G.T, h = G.Rules.hint(r.L, r.st); if (!h) return null;
    const out = { type: h.type, off: [-T.offX, -T.offY], slow: !!r.def.dark, bass: !!r.L.bassLock };
    if (h.type === 'seat') { const p = r.plugRT[h.plug], s = r.L.socketsById[h.socket]; const Tm = s.timer; out.timed = !!Tm; out.sock = h.socket; if (Tm) { const ph = (((r.st.flags.clock || 0) - Tm.phase) % Tm.period + Tm.period) % Tm.period, open = ph < Tm.on; out.delay = Math.max(0, (open && Tm.on - ph >= 1.5 ? 0 : Tm.period - ph - (open ? 0 : 0)) - 0.9) * 1000; if (!open) out.delay = Math.max(0, (Tm.period - ph) - 0.9) * 1000; } out.from = [p.x, p.y]; out.to = [s.x, s.y]; out.pre = [s.x + s.fx * T.slideU, s.y + s.fy * T.slideU]; const g = G.Geom.shortest({ x: p.x, y: p.y }, { x: out.pre[0], y: out.pre[1] }, r.L.obstacles, 22); out.route = g.pts.map((q) => [q.x, q.y]); if (p.plug.device.via.length) out.route = G.Rules.routeVia(r.L, { x: p.x, y: p.y }, h.plug, h.socket, { x: out.pre[0], y: out.pre[1] }, r.st).map((q) => [q.x, q.y]); }
    else if (h.type === 'unseat') { const s = r.L.socketsById[h.from]; out.from = [s.x, s.y]; out.to = [s.x + s.fx * 70 + 18, s.y + s.fy * 70]; }
    else if (h.type === 'lock') { out.plug = h.plug; out.pts = r.bassLockPoly(h).map((q) => [q.x, q.y]); }
    else if (h.type === 'pet') { out.at = [r.sleeper.x, r.sleeper.y]; }
    else if (h.type === 'draw') { out.pts = h.pts.map((q) => [q.x, q.y]); }
    else if (h.type === 'wind') { out.aim = h.aim; out.clicks = h.clicks; out.from = [h.from.x, h.from.y]; }
    else if (h.type === 'block') { out.pts = r.blockHintPath(h).map((q) => [q.x, q.y]); out.id = h.id; }
    else if (h.type === 'points' || h.type === 'lever') { const Tk = r.L.carried[0].carrier.track, q = h.type === 'points' ? Tk.points : Tk.lever; out.at = [q.x, q.y]; }
    else if (h.type === 'lure') { const f = h.from || { x: 180, y: 400 }, dx = h.to.x - f.x, dy = h.to.y - f.y, n = Math.hypot(dx, dy) || 1; out.pts = [[f.x + dx / n * 40, f.y + dy / n * 40], [(f.x + h.to.x) / 2 + dy * 0.05, (f.y + h.to.y) / 2 - dx * 0.05], [h.to.x, h.to.y]]; out.dist = n; }
    else if (h.type === 'switch') { const s = r.L.stripsById[h.strip]; const xs = G.Rules.switchX(s); out.at = [s.x + xs * Math.cos(s.angle), s.y + xs * Math.sin(s.angle)]; }
    else if (h.type === 'mend') { const s = r.L.socketsById[h.socket]; out.from = [r.tape.x, r.tape.y]; out.to = [s.x, s.y]; }
    else if (h.type === 'slide') { const s = r.L.stripsById[h.strip], R = s.rail, tk = R.detents[h.to]; out.from = [s.x - s.n * s.pitch / 2 - 9, s.y]; out.to = [out.from[0] + (R.x1 - R.x0) * (tk - s.k), out.from[1] + (R.y1 - R.y0) * (tk - s.k)]; }
    return out;
  });
  if (!act) break;
  const f = (p) => [p[0] + act.off[0], p[1] + act.off[1]];
  if (act.type === 'wait') { await sleep(1600); continue; }
  if (act.type === 'wind') {
      // aim: press the toy and drag toward where it should face; then wind: circle the key, a quarter-turn per click
      const dir = [Math.cos(act.aim), Math.sin(act.aim)];
      await mouseDrag([act.from, [act.from[0] + dir[0] * 34, act.from[1] + dir[1] * 34], [act.from[0] + dir[0] * 70, act.from[1] + dir[1] * 70]], 700);
      await sleep(900);
      const kp = await page.evaluate(() => { const r = window.__snug.Game.room; return r.windKeyPos(r.carryRT.S); });
      const a0 = Math.atan2(act.from[1] - kp.y, act.from[0] - kp.x) + Math.PI; // start on the near side of the key
      const sweep = act.clicks * (Math.PI / 2) + 0.35, n = Math.max(8, Math.round(act.clicks * 10)), circ = [];
      for (let i = 0; i <= n; i++) { const a = a0 + (sweep * i) / n; circ.push([kp.x + Math.cos(a) * 22, kp.y + Math.sin(a) * 22]); }
      await mouseDrag(circ, 500 + act.clicks * 330);
      await sleep(400);
    } else if (act.type === 'block') {
      let len = 0; for (let i = 1; i < act.pts.length; i++) len += Math.hypot(act.pts[i][0] - act.pts[i - 1][0], act.pts[i][1] - act.pts[i - 1][1]);
      await mouseDrag(act.pts, Math.max(800, len / 190 * 1000));
      await page.waitForFunction(() => { const r = window.__snug.Game.room; return r.blockRT.every((b) => !b.held && !b.dest); }, { timeout: 8000 }).catch(() => {});
      await sleep(450);
    } else if (act.type === 'lure') { await mouseDrag(act.pts, Math.max(1500, act.dist * 11)); await sleep(500); }
  else if (act.type === 'draw') { await mouseDrag(act.pts, Math.max(900, Math.min(2600, act.pts.length * 260))); await sleep(300); }
  else if (act.type === 'switch' || act.type === 'pet' || act.type === 'points' || act.type === 'lever') { const [cx, cy] = await toClient(page, act.at[0], act.at[1]); await page.mouse.click(cx, cy); }
  else if (act.type === 'seat' && act.timed) {
    // a timed socket: carry the plug over it, hold, and let go when its window is open or within the grace (as the bot does)
    const f = (p) => [p[0] + act.off[0], p[1] + act.off[1]];
    const route = act.route && act.route.length > 2 ? act.route : [act.from, [(act.from[0] + act.pre[0]) / 2, (act.from[1] + act.pre[1]) / 2], act.pre];
    const pts = []; for (const q of [act.from, ...route.slice(1).map(f), f(act.to)]) pts.push(await toClient(page, q[0], q[1]));
    await page.mouse.move(pts[0][0], pts[0][1]); await page.mouse.down();
    for (let i = 1; i < pts.length; i++) for (let k = 1; k <= 10; k++) { const u = k / 10; await page.mouse.move(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u); await sleep(16); }
    for (let i = 0; i < 500; i++) { const w = await page.evaluate((sid) => { const r = window.__snug.G.Game.room; return window.__snug.G.Rules.opensIn(r.st, r.L.socketsById[sid]); }, act.sock); if (w <= 0.5) break; await sleep(10); }
    await page.mouse.up(); await sleep(300);
  }
  else if (act.type === 'seat') { if (act.delay) await sleep(act.delay); const route = act.route && act.route.length > 2 ? act.route : [act.from, [(act.from[0] + act.pre[0]) / 2, (act.from[1] + act.pre[1]) / 2], act.pre]; await mouseDrag([act.from, ...route.slice(1).map(f), f(act.to)], act.slow ? 2600 : 900); }
  else if (act.type === 'lock') {
    // a real twist of the collar (the seat has to be settled first: the plug is 'seated')
    await page.waitForFunction((id) => window.__snug.G.Game.room.plugRT[id].state === 'seated', act.plug, { timeout: 3000 }).catch(() => {});
    await mouseDrag(act.pts, 420);
    await sleep(200);
  }
  else if (act.type === 'unseat') await mouseDrag([act.from, f(act.to)], 450);
  else if (act.type === 'mend') {
    const R = 24, circ = [];
    for (let i = 0; i <= 120; i++) { const a = Math.PI + (i / 36) * Math.PI * 2; circ.push([act.to[0] + Math.cos(a) * R, act.to[1] + Math.sin(a) * R]); }
    await mouseDrag([act.from, [(act.from[0] + act.to[0]) / 2, (act.from[1] + act.to[1]) / 2 - 10], act.to, ...circ], 4600);
    await sleep(400);
  } else if (act.type === 'slide') {
    // shoot a frame mid-slide
    const pts = []; for (const p of [act.from, [(act.from[0] + act.to[0]) / 2, (act.from[1] + act.to[1]) / 2], act.to]) pts.push(await toClient(page, p[0], p[1]));
    await page.mouse.move(pts[0][0], pts[0][1]); await page.mouse.down();
    for (let i = 1; i <= 30; i++) { const u = i / 30, e = u * u * (3 - 2 * u); await page.mouse.move(pts[0][0] + (pts[2][0] - pts[0][0]) * e, pts[0][1] + (pts[2][1] - pts[0][1]) * e); await sleep(1100 / 30); if (i === 14) await page.screenshot({ path: `out/${prefix}-${step}-midslide.png` }); }
    await sleep(160); await page.mouse.up(); await sleep(500);
  }
  await sleep(act.bass && act.type === 'seat' ? 150 : 900); // a bass level: the twist must follow the seat inside its grace
  await page.screenshot({ path: `out/${prefix}-${step}-${act.type}.png` });
}
await sleep(1800); await page.screenshot({ path: `out/${prefix}-9-wake.png` });
await sleep(2200); await page.screenshot({ path: `out/${prefix}-9-settle.png` });
// TIMELINE=n: keep shooting every 1.3 s (the finale plays out during the settle)
for (let i = 0; i < parseInt(process.env.TIMELINE || '0', 10); i++) { await sleep(1300); await page.screenshot({ path: `out/${prefix}-t${String(i).padStart(2, '0')}.png`, clip: { x: 0, y: 70, width: 390, height: 640 } }); }
console.log('LOGS:', logs.join('\n') || 'none');
await browser.close();
