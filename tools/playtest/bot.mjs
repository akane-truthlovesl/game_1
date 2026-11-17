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
// the ids are not always contiguous while a phase is being built (Level 28 comes after 29's build), so walk the real list
const IDS = await page.evaluate(() => window.__snug.G.Levels.map((d) => d.id));
for (const id of IDS) {
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
      const out = { type: h.type, off: [-T.offX, -T.offY], slow: !!r.def.dark || !!r.world.grav, bass: !!r.L.bassLock };
      if (h.type === 'seat') { const p = r.plugRT[h.plug], s = r.L.socketsById[h.socket]; out.from = [p.x, p.y]; out.to = [s.x, s.y]; out.pre = [s.x + s.fx * T.slideU, s.y + s.fy * T.slideU]; out.plug = h.plug; out.sock = h.socket; const Tm = s.timer; out.timed = !!Tm; out.moving = !!(s.strip.carrier && s.strip.carrier.mode === 'pendulum'); if (Tm) { const ph = (((r.st.flags.clock || 0) - Tm.phase) % Tm.period + Tm.period) % Tm.period, open = ph < Tm.on; out.delay = Math.max(0, (open && Tm.on - ph >= 1.5 ? 0 : Tm.period - ph - (open ? 0 : 0)) - 0.9) * 1000; if (!open) out.delay = Math.max(0, (Tm.period - ph) - 0.9) * 1000; } const g = G.Geom.shortest({ x: p.x, y: p.y }, { x: out.pre[0], y: out.pre[1] }, r.L.obstacles, 22); out.route = g.pts.map((q) => [q.x, q.y]); if (p.plug.device.via.length) out.route = G.Rules.routeVia(r.L, { x: p.x, y: p.y }, h.plug, h.socket, { x: out.pre[0], y: out.pre[1] }, r.st).map((q) => [q.x, q.y]); }
      else if (h.type === 'unseat') { const s = r.L.socketsById[h.from]; out.from = [s.x, s.y]; out.to = [s.x + s.fx * 70 + 18, s.y + s.fy * 70]; out.plug = h.plug; }
      else if (h.type === 'lock') { out.plug = h.plug; out.pts = r.bassLockPoly(h).map((q) => [q.x, q.y]); }
      else if (h.type === 'pet') { out.at = [r.sleeper.x, r.sleeper.y]; }
      else if (h.type === 'draw') { out.pts = h.pts.map((q) => [q.x, q.y]); }
      else if (h.type === 'wind') { out.aim = h.aim; out.clicks = h.clicks; out.from = [h.from.x, h.from.y]; }
      else if (h.type === 'block') { out.pts = r.blockHintPath(h).map((q) => [q.x, q.y]); out.id = h.id; }
      else if (h.type === 'magnet') { out.at = [h.at.x, h.at.y]; }
      else if (h.type === 'points' || h.type === 'lever') { const Tk = r.L.carried[0].carrier.track, q = h.type === 'points' ? Tk.points : Tk.lever; out.at = [q.x, q.y]; }
      else if (h.type === 'lure') {
        // press the floor where it is free: the spot goes down on a clear patch beside the cat, not on a seated plug or a socket (a press on a plug grabs it)
        const c = h.from || { x: 180, y: 400 };
        const plugsXY = Object.values(r.plugRT).map((p) => ({ x: p.x, y: p.y })), socks = r.L.sockets.map((q) => ({ x: q.x, y: q.y }));
        const freeAt = (q) => q.x > 30 && q.x < 330 && q.y > 60 && q.y < 600 && plugsXY.every((p) => Math.hypot(p.x - q.x, p.y - q.y) > 40) && socks.every((k) => Math.hypot(k.x - q.x, k.y - q.y) > 30);
        let f = c;
        for (let a = 0; a < 16; a++) { const ang = (a * Math.PI) / 8, q = { x: c.x + Math.cos(ang) * 46, y: c.y + Math.sin(ang) * 46 }; if (freeAt(q)) { f = q; break; } }
        const dx = h.to.x - f.x, dy = h.to.y - f.y, n = Math.hypot(dx, dy) || 1;
        out.pts = [[f.x, f.y], [(f.x + h.to.x) / 2 + dy * 0.05, (f.y + h.to.y) / 2 - dx * 0.05], [h.to.x, h.to.y]]; out.dist = n;
      }
      else if (h.type === 'switch') { const s = r.L.stripsById[h.strip]; const xs = G.Rules.switchX(s); out.at = [s.x + xs * Math.cos(s.angle), s.y + xs * Math.sin(s.angle)]; }
      else if (h.type === 'mend') { const s = r.L.socketsById[h.socket]; out.from = [r.tape.x, r.tape.y]; out.to = [s.x, s.y]; out.sock = h.socket; }
      else if (h.type === 'slide') { const s = r.L.stripsById[h.strip], R = s.rail, tk = R.detents[h.to]; out.from = [s.x - s.n * s.pitch / 2 - 9, s.y]; out.to = [out.from[0] + (R.x1 - R.x0) * (tk - s.k), out.from[1] + (R.y1 - R.y0) * (tk - s.k)]; out.strip = h.strip; out.toDetent = h.to; }
      return out;
    });
    if (!act) { note = 'no hint (crossings or stuck)'; break; }
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
      // a real thumb drag on the block, along its route of cells (a heavy block follows with lag, so not too fast), then it settles
      let len = 0; for (let i = 1; i < act.pts.length; i++) len += Math.hypot(act.pts[i][0] - act.pts[i - 1][0], act.pts[i][1] - act.pts[i - 1][1]);
      await mouseDrag(act.pts, Math.max(800, len / 190 * 1000));
      await page.waitForFunction(() => { const r = window.__snug.Game.room; return r.blockRT.every((b) => !b.held && !b.dest); }, { timeout: 8000 }).catch(() => {});
      await sleep(450);
    } else if (act.type === 'lure') { await mouseDrag(act.pts, Math.max(1500, act.dist * 11)); await sleep(500); }
    else if (act.type === 'draw') { await mouseDrag(act.pts, Math.max(900, Math.min(2600, act.pts.length * 260))); await sleep(300); }
    else if (act.type === 'switch' || act.type === 'pet' || act.type === 'points' || act.type === 'lever' || act.type === 'magnet') { const [cx, cy] = await toClient(page, act.at[0], act.at[1]); await page.mouse.click(cx, cy); }
    else if (act.type === 'seat' && act.timed && act.moving) {
      // a swinging socket (Level 37): walk the plug to the carriage, then follow the live socket with the finger, and let go as it comes past
      // the bottom of its swing inside the window (a plug waits up to the grace; this releases only when the window is open)
      const f = (p) => [p[0] + act.off[0], p[1] + act.off[1]];
      const route = act.route && act.route.length > 2 ? act.route : [act.from, act.pre];
      const pts = []; for (const q of [act.from, ...route.slice(1).map(f)]) pts.push(await toClient(page, q[0], q[1]));
      await page.mouse.move(pts[0][0], pts[0][1]); await page.mouse.down();
      for (let i = 1; i < pts.length; i++) for (let k = 1; k <= 10; k++) { const u = k / 10; await page.mouse.move(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u); await sleep(16); }
      const t0 = Date.now();
      while (Date.now() - t0 < 14000) {
        const sk = await page.evaluate((sid) => { const r = window.__snug.G.Game.room, so = r.L.socketsById[sid]; return { x: so.x, y: so.y, w: window.__snug.G.Rules.opensIn(r.st, so), th: r.L.carried[0].carrier.th }; }, act.sock);
        const c = await toClient(page, sk.x + act.off[0], sk.y + act.off[1]);
        await page.mouse.move(c[0], c[1]);
        if (sk.w <= 0 && Math.abs(sk.th) < 0.14) break;
        await sleep(8);
      }
      await page.mouse.up();
      await sleep(300);
    } else if (act.type === 'seat' && act.timed) {
      // a timed socket (a hatch, an egg timer): carry the plug over it, hold, and let go when the window is open or within its grace
      // (the plug waits for the opening). A guessed delay drifts with the frame rate; the hold follows the real clock.
      const f = (p) => [p[0] + act.off[0], p[1] + act.off[1]];
      const route = act.route && act.route.length > 2 ? act.route : [act.from, [(act.from[0] + act.pre[0]) / 2, (act.from[1] + act.pre[1]) / 2], act.pre];
      const pts = []; for (const q of [act.from, ...route.slice(1).map(f), f(act.to)]) pts.push(await toClient(page, q[0], q[1]));
      await page.mouse.move(pts[0][0], pts[0][1]); await page.mouse.down();
      for (let i = 1; i < pts.length; i++) for (let k = 1; k <= 10; k++) { const u = k / 10; await page.mouse.move(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u); await sleep(16); }
      for (let i = 0; i < 500; i++) { const w = await page.evaluate((sid) => { const r = window.__snug.G.Game.room; return window.__snug.G.Rules.opensIn(r.st, r.L.socketsById[sid]); }, act.sock); if (w <= 0.5) break; await sleep(10); }
      await page.mouse.up();
      await sleep(300);
    } else if (act.type === 'seat') {
      // a timed socket: leave so that the plug arrives as its window opens (the drag below takes about a second)
      if (act.delay) await sleep(act.delay); // a timed socket: arrive as its window opens (the drag takes about a second)
      // touch ON the plug; the plug then floats up to finger+offset, so the finger ends below the socket
      const f = (p) => [p[0] + act.off[0], p[1] + act.off[1]];
      const endF = f(act.to);
      const route = act.route && act.route.length > 2 ? act.route : [act.from, [(act.from[0] + act.pre[0]) / 2, (act.from[1] + act.pre[1]) / 2], act.pre];
      // finger path: touch ON the plug, then the finger follows the route minus the hold offset
      await mouseDrag([act.from, ...route.slice(1).map(f), endF], act.slow ? 2600 : 900);
    } else if (act.type === 'lock') {
      // a real twist: the thumb presses the collar and walks about 110 degrees round the plug (a quarter turn locks it)
      await page.waitForFunction((id) => { const r = window.__snug.Game.room; return r.plugRT[id].state === 'seated'; }, act.plug, { timeout: 3000 }).catch(() => {});
      await mouseDrag(act.pts, 420);
      await sleep(200);
    } else if (act.type === 'unseat') {
      const f = (p) => [p[0] + act.off[0], p[1] + act.off[1]];
      await mouseDrag([act.from, f(act.to)], 450);
    } else if (act.type === 'mend') {
      // press the roll, carry its tongue to the frayed socket, then scribble two and a bit circles around it
      const R = 24, circ = [];
      for (let i = 0; i <= 120; i++) { const a = Math.PI + (i / 36) * Math.PI * 2; circ.push([act.to[0] + Math.cos(a) * R, act.to[1] + Math.sin(a) * R]); }
      await mouseDrag([act.from, [(act.from[0] + act.to[0]) / 2, (act.from[1] + act.to[1]) / 2 - 10], act.to, ...circ], 4600);
      await sleep(400);
    } else if (act.type === 'slide') {
      // a real thumb drag on the strip's end grip, along the rail, released over the target detent
      await mouseDrag([act.from, [(act.from[0] + act.to[0]) / 2, (act.from[1] + act.to[1]) / 2], act.to], 1100);
      await sleep(500);
    }
    actions++;
    // on a bass level the twist must follow the seat within the plug's grace: no long pause between them
    await sleep(act.bass && act.type === 'seat' ? 150 : 900);
    console.log('  L'+id+' step '+step+' '+JSON.stringify({a:act.type,plug:act.plug,sock:act.sock||null}), JSON.stringify(await page.evaluate(()=>{const r=window.__snug.Game.room;return {seat:r.st.seat,phase:r.phase,on:r.requiredOn(),states:r.plugList.map(p=>p.id+':'+p.state).join(',')}})));
    const seat = await page.evaluate((id) => { const r = window.__snug.Game.room; return act => 0; }, id);
  }
  // let the win sequence play out
  await page.waitForFunction(() => { const r = window.__snug.Game.room; return !(r.carryHold && r.carryHold()); }, { timeout: 25000 }).catch(() => {});
  // the Wake judges Tidy when the cables have settled: wait for it (a count-in or a finale makes the Wake longer)
  await page.waitForFunction(() => { const r = window.__snug.Game.room; return r.phase === 'settling' || r.phase === 'done' || r.phase === 'playing'; }, { timeout: 12000 }).catch(() => {});
  await sleep(1500);
  const fin = await page.evaluate(() => { const r = window.__snug.Game.room; return { phase: r.phase, stars: r.stars, seatCount: r.seatCount, fps: window.__snug.Game.fps && +window.__snug.Game.fps.toFixed(0), cross: r.crossHits.length, secret: !!r.secretFound, hits: r.crossHits.slice(0, 3).map((h) => JSON.stringify(h).slice(0, 160)) }; });
  results.push({ id, actions, ms: Date.now() - t0, ...fin, note });
  console.log(JSON.stringify(results[results.length - 1]));
  await sleep(1500); await page.screenshot({ path: `out/fin-${id}.png` });
  console.log('   after settle: crossings', await page.evaluate(() => window.__snug.Game.room.crossHits.length));
}
console.log('LOGS:', logs.length ? logs.slice(0, 6).join('\n') : 'none');
await browser.close();
