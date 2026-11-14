// B0 feel layer probes: dynamics, strum/pluck, lean, tock, neighbour wobble (real pointer events)
import { launch, sleep, toClient, URL } from './common.mjs';
const { browser, page, logs } = await launch({ dpr: 1 });
const ev = (fn, arg) => page.evaluate(fn, arg);
const rep = (n, v, pass) => console.log((pass ? 'PASS  ' : 'FAIL  ') + n.padEnd(52) + v);
const hook = () => ev(() => {
  const G = window.__snug.G, A = G.Audio, c = (window.__c = { pluck: [], tock: 0, thunk: [], voice: [] });
  const op = A.pluck; A.pluck = (...a) => { c.pluck.push(a.slice(0, 2)); return op(...a); };
  const ot = A.sfx.tock; A.sfx.tock = (...a) => { c.tock++; return ot(...a); };
  const oh = A.sfx.thunk; A.sfx.thunk = (...a) => { c.thunk.push(a[1] || {}); return oh(...a); };
  const ov = A.voice; A.voice = (...a) => { c.voice.push(a[0]); return ov(...a); };
});
async function fingerDrag(path, ms, release = true) {
  const pts = []; for (const p of path) pts.push(await toClient(page, p[0], p[1]));
  await page.mouse.move(pts[0][0], pts[0][1]); await page.mouse.down();
  const steps = 24;
  for (let i = 1; i <= steps; i++) { const u = (i / steps) * (pts.length - 1), k = Math.min(pts.length - 2, Math.floor(u)), f = u - k; await page.mouse.move(pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f, pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f); await sleep(ms / steps); }
  if (release) await page.mouse.up();
}
// ---------------------------------------------------------------- pluck by touching a cable body
await page.goto(URL + '?level=3'); await sleep(1800); await hook();
const node = await ev(() => { const r = window.__snug.Game.room, p = r.plugRT.b, k = Math.floor(p.rope.n / 2); return [p.rope.x[k], p.rope.y[k], k, p.rope.n]; });
const [cx, cy] = await toClient(page, node[0], node[1]);
await page.mouse.move(cx, cy); await page.mouse.down(); await sleep(60);
const vib = await ev(() => { const p = window.__snug.Game.room.plugRT.b.rope; return p.vib ? { amp: p.vib.amp, s0: +p.vib.s0.toFixed(2) } : null; });
rep('touching a cable plucks it (vib set)', JSON.stringify(vib), !!vib && vib.amp > 1);
await ev(() => window.__snug.Game.room.plugRT.b.rope.vibDisp(0.5));
const d1 = await ev(() => window.__snug.Game.room.plugRT.b.rope.vibDisp(0.5)); await sleep(130);
const d2 = await ev(() => window.__snug.Game.room.plugRT.b.rope.vibDisp(0.5));
rep('vibration moves over time (visual standing wave)', d1.toFixed(2) + ' -> ' + d2.toFixed(2), Math.abs(d1 - d2) > 0.05);
await page.mouse.up(); await sleep(1700);
const gone = await ev(() => window.__snug.Game.room.plugRT.b.rope.vib);
rep('vibration decays away', String(gone), gone === null);
const pl = await ev(() => window.__c.pluck.length);
rep('pluck sounded on touch + release (2 notes)', String(pl), pl >= 2);
// ---------------------------------------------------------------- strum across cables (harp)
await page.goto(URL + '?level=7'); await sleep(1800); await hook();
// sweep a straight line across the middle of the board, starting in empty space
const sw = await ev(() => { const r = window.__snug.Game.room; let y = 0, n = 0; for (const p of r.plugList) { y += p.rope.y[Math.floor(p.rope.n / 2)]; n++; } return y / n; });
await fingerDrag([[22, sw], [340, sw]], 320);
await sleep(200);
const notes = await ev(() => window.__c.pluck.map((a) => a[0]));
rep('strum: a sweep plucks several different cables', notes.join(','), notes.length >= 2 && new Set(notes).size >= 2);
// ---------------------------------------------------------------- dynamics: slow vs fast release
async function seatAt(level, plugId, sockId, ms, hold) {
  await page.goto(URL + '?level=' + level); await sleep(1600); await hook();
  const I = await ev(([pid, sid]) => { const r = window.__snug.Game.room, T = window.__snug.G.T, p = r.plugRT[pid], s = r.L.socketsById[sid]; return { p: [p.x, p.y], to: [s.x - T.offX, s.y - T.offY] }; }, [plugId, sockId]);
  const pts = [I.p, I.to];
  await fingerDrag(pts, ms, false);
  await sleep(hold);
  await page.mouse.up(); await sleep(700);
  return ev(() => window.__c.thunk.map((o) => ({ power: +(o.power || 0).toFixed(2), crisp: +(o.crisp || 0).toFixed(2), mat: o.mat, pan: +(o.pan || 0).toFixed(2) })));
}
const slow = await seatAt(1, 'pip', 'G.1', 1100, 520);
const fast = await seatAt(1, 'pip', 'G.1', 260, 0);
rep('dynamics: slow placement is softer than a fling', JSON.stringify(slow) + ' vs ' + JSON.stringify(fast), slow.length && fast.length && fast[0].power > slow[0].power + 0.1);
rep('thunk carries the material and a pan', JSON.stringify(fast[0]), fast[0].mat === 'desk' && typeof fast[0].pan === 'number');
// ---------------------------------------------------------------- lean while carried
await page.goto(URL + '?level=2'); await sleep(1600); await hook();
const P = await ev(() => { const p = window.__snug.Game.room.plugRT.a; return [p.x, p.y]; });
const pts = [P, [P[0] + 60, P[1] - 30], [P[0] - 40, P[1] - 80], [P[0] + 70, P[1] - 120]];
const px = []; for (const p of pts) px.push(await toClient(page, p[0], p[1]));
await page.mouse.move(px[0][0], px[0][1]); await page.mouse.down();
let leanMax = 0;
for (let i = 1; i < px.length; i++) for (let k = 1; k <= 10; k++) { await page.mouse.move(px[i - 1][0] + (px[i][0] - px[i - 1][0]) * k / 10, px[i - 1][1] + (px[i][1] - px[i - 1][1]) * k / 10); await sleep(14); leanMax = Math.max(leanMax, Math.abs(await ev(() => window.__snug.Game.room.plugRT.a.lean))); }
await page.mouse.up(); await sleep(300);
rep('plug leans into a swerve (max |lean| rad)', leanMax.toFixed(3), leanMax > 0.03);
// ---------------------------------------------------------------- neighbour wobble (two adjacent sockets on level 2)
await page.goto(URL + '?level=2'); await sleep(1600); await hook();
await ev(() => { const r = window.__snug.Game.room; window.__nb = []; const oc = r.onContact.bind(r); r.onContact = (p) => { oc(p); window.__nb.push(r.plugList.filter((q) => q !== p && q.seatSock).map((q) => +q.wobV.toFixed(2))); }; });
for (const [pid, sid] of [['a', 'A.1'], ['b', 'A.2']]) {
  const I = await ev(([pid, sid]) => { const r = window.__snug.Game.room, T = window.__snug.G.T, p = r.plugRT[pid], s = r.L.socketsById[sid]; const g = window.__snug.G.Geom.shortest({ x: p.x, y: p.y }, { x: s.x + s.fx * T.slideU, y: s.y + s.fy * T.slideU }, r.L.obstacles, 22); return { route: g.pts.map((q) => [q.x - T.offX, q.y - T.offY]), from: [p.x, p.y] }; }, [pid, sid]);
  await fingerDrag([I.from, ...I.route.slice(1)], 900, false); await sleep(200); await page.mouse.up(); await sleep(900);
}
const nb = await ev(() => window.__nb);
rep('neighbour shivers when a plug lands beside it', JSON.stringify(nb), nb.length >= 2 && nb[1].some((v) => Math.abs(v) > 0.5));
const vo = await ev(() => window.__c.voice);
rep('wake voices fire per device type', JSON.stringify(vo), vo.length >= 1);
console.log('LOGS:', logs.join('\n') || 'none');
await browser.close();
