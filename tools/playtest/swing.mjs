// Act 4, Level 37 (Swing & Plug) toy, with real mouse input (loads defs/swing-toy.json through ?def=):  node swing.mjs
//  1. the carriage swings on the room clock: its position is the pendulum (pivot, length, amplitude, period) to within 0.5 u
//  2. its sockets open at the bottom of each half-swing and are shut at the top, past the grace (0.8 s)
//  3. a plug held to the socket and released in the bottom window seats on the carriage
//  4. a plug released at the top, where the socket has gone, falls (it does not seat)
//  5. the other plugs seat on later bottoms, and the cables reach across the whole swing (verifyPendulum)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { launch, sleep, toClient, URL } from './common.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const def = encodeURIComponent(fs.readFileSync(path.join(here, 'defs', 'swing-toy.json'), 'utf8'));
const { browser, page, logs } = await launch({ dpr: 1 });
const ev = (fn, a) => page.evaluate(fn, a);
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };
await page.goto(URL + '?def=' + def); await sleep(1800);
for (let i = 0; i < 40 && (await ev(() => window.__snug.G.Game.room.phase)) !== 'playing'; i++) await sleep(200);
await page.mouse.click(8, 420); await sleep(200);

const swingState = () => ev(() => {
  const r = window.__snug.G.Game.room, rec = r.pendRT[0], C = rec.C;
  return { x: rec.st.x, y: rec.st.y, th: C.th, clock: rec.clock, amp: C.amp, period: C.period, pivot: C.pivot, len: C.len, phase: r.phase };
});
const sockState = (sid) => ev((sid) => {
  const r = window.__snug.G.Game.room, s = r.L.socketsById[sid], rec = r.pendRT[0];
  return { x: s.x, y: s.y, wait: window.__snug.G.Rules.opensIn(r.st, s), th: rec.C.th, seat: Object.keys(r.st.seat).find((k) => r.st.seat[k] === sid) || null };
}, sid);
const plugAt = (pid) => ev((pid) => { const r = window.__snug.G.Game.room, p = r.plugRT[pid]; return { x: p.x, y: p.y, st: p.state, seat: r.st.seat[pid] || null }; }, pid);

// ---- 1: the motion is the pendulum
{
  let worstX = 0, worstTh = 0, maxDx = 0;
  for (let i = 0; i < 40; i++) {
    const s = await swingState();
    const want = s.amp * Math.sin((2 * Math.PI * s.clock) / s.period);
    worstTh = Math.max(worstTh, Math.abs(s.th - want));
    const px = s.pivot.x + s.len * Math.sin(s.th), py = s.pivot.y + s.len * Math.cos(s.th);
    worstX = Math.max(worstX, Math.hypot(s.x - px, s.y - py));
    maxDx = Math.max(maxDx, Math.abs(s.x - s.pivot.x));
    await sleep(35);
  }
  ok(worstTh < 1e-6 && worstX < 0.5, 'the carriage swings on the room clock: the angle is the sine of the clock (worst ' + worstTh.toExponential(1) + ' rad), and its position is the pendulum (worst ' + worstX.toFixed(2) + ' u)');
  const want = (await swingState());
  const reach = want.len * Math.sin(want.amp);
  ok(maxDx > reach * 0.85, 'the sweep reaches its amplitude (' + maxDx.toFixed(0) + ' u of the ' + reach.toFixed(0) + ' u a swing should reach so far)');
}

// ---- 2: the window: open at the bottom, shut at the top, past the grace
{
  const bottom = await ev(async () => {
    const r = window.__snug.G.Game.room;
    const sockId = 'Choo.1';
    for (let i = 0; i < 2000; i++) {
      const th = r.L.carried[0].carrier.th;
      const w = window.__snug.G.Rules.opensIn(r.st, r.L.socketsById[sockId]);
      if (Math.abs(th) < 0.01) return { w, th };
      await new Promise((res) => setTimeout(res, 4));
    }
    return null;
  });
  ok(bottom && bottom.w === 0, 'at the bottom of the swing the socket is open (' + (bottom ? 'opens in ' + bottom.w.toFixed(2) : 'never reached the bottom') + ')');
  const top = await ev(async () => {
    const r = window.__snug.G.Game.room;
    const C = r.L.carried[0].carrier;
    for (let i = 0; i < 4000; i++) {
      if (Math.abs(C.th) > 0.9 * C.amp) return { w: window.__snug.G.Rules.opensIn(r.st, r.L.socketsById['Choo.1']), th: C.th };
      await new Promise((res) => setTimeout(res, 4));
    }
    return null;
  });
  ok(top && top.w > 0.8, 'at the top of the swing the socket is shut, past the grace (opens in ' + (top ? top.w.toFixed(2) : '?') + ' s)');
}

// a real drag: grab a plug, follow its socket with the finger, and release when the socket is open (bottom) or at the top
async function chase(plugId, sockId, mode, timeout = 9000) {
  const p0 = await plugAt(plugId);
  const c0 = await toClient(page, p0.x, p0.y);
  await page.mouse.move(c0[0], c0[1]); await page.mouse.down();
  const t0 = Date.now();
  let last = null;
  while (Date.now() - t0 < timeout) {
    const s = await sockState(sockId);
    const c = await toClient(page, s.x, s.y);
    await page.mouse.move(c[0], c[1]);
    last = s;
    if (mode === 'bottom' && s.wait === 0 && Math.abs(s.th) < 0.14) break;
    if (mode === 'top' && Math.abs(s.th) > 0.9 * 0.28 && s.wait > 0.8) break;
    await sleep(8);
  }
  const releaseTh = last ? last.th : null;
  await page.mouse.up(); await sleep(450);
  return { releaseTh, seated: (await plugAt(plugId)).seat };
}

// ---- 3: seat Squeak in a bottom window
{
  const r1 = await chase('squeak', 'Choo.1', 'bottom');
  ok(r1.seated === 'Choo.1', 'released in the bottom window, Squeak seats on the carriage (Choo.1), at a swing angle of ' + (r1.releaseTh !== null ? r1.releaseTh.toFixed(3) : '?') + ' rad');
}

// ---- 4: release Spike at the top: it falls
{
  const r2 = await chase('spike', 'Choo.2', 'top');
  ok(r2.seated === null, 'released at the top, where the socket is shut, Spike does not seat (it falls)');
}

// ---- 5: Dot seats on a later bottom; and the cables reach across the whole swing
{
  const r3 = await chase('dot', 'Choo.3', 'bottom', 12000);
  ok(r3.seated === 'Choo.3', 'Dot seats on a later bottom (Choo.3)');
  await sleep(300);
  const spikeSeat = await ev(() => { const r = window.__snug.G.Game.room; return r.st.seat.spike || null; });
  // Spike still has to seat: take another bottom for it (the sockets are the same: Choo.2 is free)
  const r4 = spikeSeat ? { seated: spikeSeat } : await chase('spike', 'Choo.2', 'bottom', 12000);
  ok(r4.seated === 'Choo.2', 'Spike seats on the next bottom (Choo.2)');
  const v = await ev(() => { const r = window.__snug.G.Game.room; return window.__snug.G.Rules.verifyPendulum(r.L); });
  ok(v.ok, 'every cable reaches across the whole swing (' + (v.ok ? 'worst ' + (v.worst * 100).toFixed(0) + '% of its length' : v.why) + ')');
}

console.log('LOGS:', logs.join('\n') || 'none');
console.log(fails ? fails + ' FAILED' : 'all swing probes passed');
await browser.close();
process.exit(fails ? 1 : 0);
