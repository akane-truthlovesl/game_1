// Act 4, Level 34 (Magnet Moon) behaviour probe, with real mouse input:  node magnet.mjs
//  1. a plug let go on a paperclip sticks to it: it powers nothing, and no socket takes it
//  2. a gentle touch on a stuck plug does nothing: the clip holds it
//  3. a firm pull peels the plug off the clip (the clip is marked peeled), and the plug comes away with the finger
//  4. the peeled plugs seat in their sockets; with every clip peeled, the Wake gives the golden clip
import { launch, sleep, toClient, URL } from './common.mjs';
const { browser, page, logs } = await launch({ dpr: 1 });
const ev = (fn, a) => page.evaluate(fn, a);
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };
await page.goto(URL + '?level=34'); await sleep(500);
await page.mouse.click(8, 420); await sleep(200);
for (let i = 0; i < 40 && (await ev(() => window.__snug.G.Game.room.phase)) !== 'playing'; i++) await sleep(200);

const plugAt = (pid) => ev((pid) => { const r = window.__snug.G.Game.room, p = r.plugRT[pid]; return { x: p.x, y: p.y, st: p.state, seat: r.st.seat[pid] || null, stuck: !!p.stuckTo, p: r.devRT[pid].p }; }, pid);
const clipOf = (cid) => ev((cid) => { const c = window.__snug.G.Game.room.magnetRT.clips.find((k) => k.id === cid); return { stuck: c.stuck, peeled: c.peeled, x: c.x, y: c.y }; }, cid);
const sockXY = (sid) => ev((sid) => { const r = window.__snug.G.Game.room, s = r.L.socketsById[sid]; return { x: s.x, y: s.y }; }, sid);
// a real drag along a path of stage points, then let go
async function drag(points, ms = 700) {
  const cl = []; for (const q of points) cl.push(await toClient(page, q[0], q[1]));
  await page.mouse.move(cl[0][0], cl[0][1]); await page.mouse.down();
  const steps = 20;
  for (let i = 1; i < cl.length; i++) for (let k = 1; k <= steps; k++) { const u = k / steps; await page.mouse.move(cl[i - 1][0] + (cl[i][0] - cl[i - 1][0]) * u, cl[i - 1][1] + (cl[i][1] - cl[i - 1][1]) * u); await sleep(ms / (steps * cl.length)); }
  await page.mouse.up(); await sleep(500);
}

// ---- 1: Pip is let go on the first clip (c1)
const c1 = await clipOf('c1');
await drag([[40, 320], [c1.x, c1.y]]);
const pip1 = await plugAt('pip');
const c1b = await clipOf('c1');
ok(c1b.stuck === 'pip' && pip1.seat === null && pip1.p !== 'on', 'let go on a paperclip, Pip sticks to it: no socket took it, and the lamp-less device stays dark (' + pip1.p + ')');

// ---- 2: a gentle touch does nothing
await drag([[c1.x, c1.y], [c1.x + 6, c1.y - 6]], 300);
ok((await clipOf('c1')).stuck === 'pip', 'a gentle touch on the stuck plug does nothing: the clip holds it');

// ---- 3: a firm pull peels it off, and it comes away with the finger
await drag([[c1.x, c1.y], [c1.x + 40, c1.y - 60], [200, 190]], 500);
const c1c = await clipOf('c1');
const pip3 = await plugAt('pip');
ok(c1c.stuck === null && c1c.peeled >= 1, 'a firm pull peels Pip off the clip (peeled ' + c1c.peeled + ')');
ok(pip3.stuck === false && pip3.st === 'rest', 'and Pip is dropped where the finger let go (' + Math.round(pip3.x) + ', ' + Math.round(pip3.y) + ')');

// ---- 4: seat the peeled plugs, and peel the other clips on the way
const S = { coral: await sockXY('R.1'), amber: await sockXY('R.2'), sky: await sockXY('R.3'), mint: await sockXY('R.4') };
{ const q = await plugAt('pip'); await drag([[q.x, q.y], [S.coral.x, S.coral.y]], 700); }
ok((await plugAt('pip')).seat === 'R.1', 'Pip docks in its own socket (R.1)');
// Rex: stick to c2, then peel, then seat
const c2 = await clipOf('c2');
await drag([[150, 440], [c2.x, c2.y]], 700);
const rexStuck = await clipOf('c2');
ok(rexStuck.stuck === 'rex', 'Rex sticks to the second clip');
await drag([[c2.x, c2.y], [c2.x + 40, c2.y + 60], [240, 560]], 500);
ok((await clipOf('c2')).peeled >= 1, 'and is peeled off it');
{ const q = await plugAt('rex'); await drag([[q.x, q.y], [S.amber.x, S.amber.y]], 700); }
ok((await plugAt('rex')).seat === 'R.2', 'Rex docks in its socket (R.2)');
// Lumi: stick to c3, peel, seat
const c3 = await clipOf('c3');
await drag([[300, 250], [c3.x, c3.y]], 900);
ok((await clipOf('c3')).stuck === 'lumi', 'Lumi sticks to the third clip');
await drag([[c3.x, c3.y], [c3.x + 40, c3.y - 60], [200, 420]], 500);
{ const q = await plugAt('lumi'); await drag([[q.x, q.y], [S.sky.x, S.sky.y]], 700); }
ok((await plugAt('lumi')).seat === 'R.3', 'and, peeled, docks in its socket (R.3)');
await drag([[335, 430], [S.mint.x, S.mint.y]], 700);
ok((await plugAt('sleepy')).seat === 'R.4', 'Big Sleepy docks in its socket (R.4): the room is whole');
await sleep(2400);
const sec = await ev(() => { const r = window.__snug.G.Game.room; return { secret: !!r.secretFound, peeled: r.magnetRT.clips.map((c) => c.peeled), phase: r.phase }; });
ok(sec.secret && sec.peeled.every((n) => n >= 1), 'every clip was peeled before the Wake: the golden clip (' + JSON.stringify(sec) + ')');

console.log('LOGS:', logs.join('\n') || 'none');
console.log(fails ? fails + ' FAILED' : 'all magnet probes passed');
await browser.close();
process.exit(fails ? 1 : 0);
