// Act 4, Level 37 (Swing & Plug): the golden pendulum, with real input:  node golden37.mjs
//  1. two fingers (real multi-touch) seat two plugs in one bottom window, and the third plug seats at the next bottom of the same swing:
//     the golden pendulum is found
//  2. the same three seats, each one a whole period after the last, do not find it
// A period is two bottoms (half-periods): the half-period index m = round(clock / (period / 2)); windows open at even and odd m, and
// the windows m = 2j and 2j+1 both fall in the same period j.
import { launch, sleep, toClient, URL } from './common.mjs';
const { browser, page, logs } = await launch({ dpr: 1 });
const ev = (fn, a) => page.evaluate(fn, a);
const cdp = await page.context().newCDPSession(page);
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };

async function load() {
  await page.goto(URL + '?level=37'); await sleep(900);
  for (let i = 0; i < 40 && (await ev(() => window.__snug.G.Game.room.phase)) !== 'playing'; i++) await sleep(200);
  await page.mouse.click(8, 420); await sleep(200);
}
// the state the thumb needs: the window on the socket, the swing's angle, and the half-period index; the finger's offset
const bottomState = () => ev(() => {
  const r = window.__snug.G.Game.room, C = r.L.carried[0].carrier;
  return { w: window.__snug.G.Rules.opensIn(r.st, r.L.socketsById['Choo.1']), th: C.th, m: Math.round(r.timerClock() / (C.period / 2)), off: [-window.__snug.G.T.offX, -window.__snug.G.T.offY] };
});
const sockXY = (sid) => ev((sid) => { const s = window.__snug.G.Game.room.L.socketsById[sid]; return { x: s.x, y: s.y }; }, sid);
const plugXY = (pid) => ev((pid) => { const p = window.__snug.G.Game.room.plugRT[pid]; return { x: p.x, y: p.y }; }, pid);
const seatOf = (pid) => ev((pid) => window.__snug.G.Game.room.st.seat[pid] || null, pid);
const secretOf = () => ev(() => !!window.__snug.G.Game.room.secretFound);
const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map((p, i) => ({ x: p[0], y: p[1], id: i + 1 })) });

// a single finger: grab the plug, follow its socket, and release in an open bottom window whose half-period index is at least minM
async function chase(plugId, sockId, minM = -Infinity, timeout = 12000) {
  const p0 = await plugXY(plugId);
  const c0 = await toClient(page, p0.x, p0.y);
  await page.mouse.move(c0[0], c0[1]); await page.mouse.down();
  const t0 = Date.now();
  let at = null;
  while (Date.now() - t0 < timeout) {
    const s = await sockXY(sockId), b = await bottomState();
    const c = await toClient(page, s.x + b.off[0], s.y + b.off[1]);
    await page.mouse.move(c[0], c[1]);
    if (Date.now() - t0 > 250 && b.w <= 0 && Math.abs(b.th) < 0.14 && b.m >= minM) { at = b.m; break; }
    await sleep(8);
  }
  await page.mouse.up(); await sleep(450);
  return { seat: await seatOf(plugId), m: at };
}

// ---- 1: two fingers at one bottom (an even half-period), the third at the next bottom
await load();
{
  const sq = await plugXY('squeak'), sp = await plugXY('spike');
  const a = await toClient(page, sq.x, sq.y), b = await toClient(page, sp.x, sp.y);
  await touch('touchStart', [a, b]);
  let bm = null;
  const t0 = Date.now();
  while (Date.now() - t0 < 16000) {
    const s1 = await sockXY('Choo.1'), s2 = await sockXY('Choo.2'), st = await bottomState();
    const ca = await toClient(page, s1.x + st.off[0], s1.y + st.off[1]), cb = await toClient(page, s2.x + st.off[0], s2.y + st.off[1]);
    await touch('touchMove', [ca, cb]);
    if (st.w <= 0 && Math.abs(st.th) < 0.14 && st.m % 2 === 0) { bm = st.m; break; }
    await sleep(8);
  }
  await touch('touchEnd', []);
  await sleep(450);
  ok(bm !== null && (await seatOf('squeak')) === 'Choo.1' && (await seatOf('spike')) === 'Choo.2', 'two fingers, one bottom window: Squeak and Spike seat together (half-period ' + bm + ')');
  const third = await chase('dot', 'Choo.3', bm + 1); // the next bottom: half-period bm+1 is the same period as bm
  ok(third.seat === 'Choo.3', 'Dot seats on the next bottom of the same swing (Choo.3, half-period ' + third.m + ')');
  await sleep(1200);
  ok(await secretOf(), 'all three inside one swing: the golden pendulum is found');
}

// ---- 2: one plug a whole period after the last: the same three seats, not golden
await load();
{
  const s1 = await chase('squeak', 'Choo.1');
  ok(s1.seat === 'Choo.1', 'Squeak seats (half-period ' + s1.m + ')');
  const next = (Math.floor(s1.m / 2) + 1) * 2; // the first bottom of the next period
  const s2 = await chase('spike', 'Choo.2', next);
  ok(s2.seat === 'Choo.2', 'Spike seats a whole period later (half-period ' + s2.m + ')');
  const next2 = (Math.floor(s2.m / 2) + 1) * 2;
  const s3 = await chase('dot', 'Choo.3', next2);
  ok(s3.seat === 'Choo.3', 'Dot seats a period after that (half-period ' + s3.m + ')');
  await sleep(1200);
  ok(!(await secretOf()), 'the same three, spread over periods: no golden pendulum');
}

console.log('LOGS:', logs.join('\n') || 'none');
console.log(fails ? fails + ' FAILED' : 'all golden probes passed');
await browser.close();
process.exit(fails ? 1 : 0);
