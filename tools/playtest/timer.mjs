// Level 18 (timer sockets) behaviour probe, with real mouse drags:  node timer.mjs
//  1. released too early (> grace before the window opens) -> refused "not yet", never seated next door
//  2. released within the grace window -> the plug waits in front of the socket and seats right as it opens ("on the tick")
//  3. a plug seated inside a window stays seated after the window shuts
//  4. tapping the egg timer restarts the beat
//  5. four plugs each seated on the tick -> the rising phrase ("in tune")
import { launch, sleep, toClient, URL } from './common.mjs';
const { browser, page, logs } = await launch({ dpr: 1 });
const ev = (fn, a) => page.evaluate(fn, a);
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };

async function dragPlug(plugId, sockId, releaseClock, ms = 900) {
  const info = await ev(([p, s]) => { const G = window.__snug.G, r = G.Game.room, T = G.T; const pl = r.plugRT[p], sk = r.L.socketsById[s]; return { from: [pl.x, pl.y], to: [sk.x, sk.y], off: [-T.offX, -T.offY] }; }, [plugId, sockId]);
  const f = (q) => [q[0] + info.off[0], q[1] + info.off[1]];
  const path = [info.from, f([(info.from[0] + info.to[0]) / 2, (info.from[1] + info.to[1]) / 2]), f(info.to)];
  const pts = []; for (const q of path) pts.push(await toClient(page, q[0], q[1]));
  await page.mouse.move(pts[0][0], pts[0][1]); await page.mouse.down();
  const total = pts.length - 1, steps = 26;
  for (let i = 1; i <= steps; i++) { const u = i / steps, e = u * u * (3 - 2 * u) * total, k = Math.min(total - 1, Math.floor(e)), fr = e - k; await page.mouse.move(pts[k][0] + (pts[k + 1][0] - pts[k][0]) * fr, pts[k][1] + (pts[k + 1][1] - pts[k][1]) * fr); await sleep(ms / steps); }
  if (releaseClock !== undefined) { await sleep(120); await setClock(releaseClock); await page.mouse.up(); } else { await sleep(160); await page.mouse.up(); }
}
const setClock = (c) => ev((c) => { const r = window.__snug.G.Game.room; r.clockOff = r.t - c; r.st.flags.clock = c; }, c);
const state = () => ev(() => { const r = window.__snug.G.Game.room, R = window.__snug.G.Rules; return { clock: +r.timerClock().toFixed(2), seat: r.st.seat, states: r.plugList.map((p) => p.id + ':' + p.state).join(','), opens: r.L.sockets.map((s) => +R.opensIn(r.st, s).toFixed(2)), tick: r.plugList.map((p) => !!p.tickSeat), phrase: !!r.phraseDone, phase: r.phase }; });

await page.goto(URL + '?level=18'); await sleep(2600);
for (let i = 0; i < 40 && (await state()).phase !== 'playing'; i++) await sleep(200);

// ---- 1. too early
await dragPlug('kettle', 'A.1', 3.5); // A.1 (phase 0, on 1.9, period 4.8) is closed and opens at 4.8: released 1.3 s early
await sleep(900);
let s1 = await state();
ok(s1.seat.kettle === null, 'early release (about 1.3 s before opening) is refused: kettle not seated (' + s1.states + ')');
ok(Object.values(s1.seat).every((v) => v === null), 'and nothing seated in a neighbouring socket: ' + JSON.stringify(s1.seat));

// ---- 2. within the grace window
await sleep(500);
await dragPlug('kettle', 'A.1', 4.3); // released 0.5 s before A.1 opens
let waited = false;
for (let i = 0; i < 10; i++) { const s = await state(); if (/kettle:seating/.test(s.states)) { waited = true; break; } await sleep(40); }
ok(waited, 'release inside the grace window: the plug waits in front of the socket (state "seating")');
await sleep(1600);
let s2 = await state();
ok(s2.seat.kettle === 'A.1', 'it seated in A.1 once the window opened (' + s2.states + ')');
ok(s2.tick[0] === true, 'and counts as "on the tick"');

// ---- 3. stays seated after the window shuts
await setClock(2.6); // window of A.1 shut at 1.9
await sleep(600);
let s3 = await state();
ok(s3.seat.kettle === 'A.1' && s3.opens[0] > 0, 'after the window shuts the kettle is still seated (opensIn ' + s3.opens[0] + ')');

// ---- 4. the egg timer restarts the beat
await setClock(3.7);
const [cx, cy] = await toClient(page, 70, 556);
await page.mouse.click(cx, cy);
await sleep(250);
const s4 = await state();
ok(s4.clock < 0.8, 'tapping the egg timer restarted the beat (clock ' + s4.clock + ')');

// ---- 5. four on the tick: the phrase
await ev(() => document.getElementById('btn-restart') && document.getElementById('btn-restart').click());
await page.goto(URL + '?level=18'); await sleep(2600);
for (let i = 0; i < 40 && (await state()).phase !== 'playing'; i++) await sleep(200);
const plan = [['kettle', 'A.1', 0], ['dot', 'A.4', 3.6], ['static', 'A.2', 1.2], ['toasty', 'A.3', 2.4]];
for (const [pid, sid, phase] of plan) {
  await dragPlug(pid, sid, phase + 0.1); // released 0.1 s after the window opened
  await sleep(700);
}
await sleep(1200);
const s5 = await state();
console.log('   ', JSON.stringify(s5.seat), 'tick', JSON.stringify(s5.tick), 'phase', s5.phase);
ok(s5.tick.every(Boolean), 'all four plugs were seated on the tick');
ok(s5.phrase, 'the rising phrase fired ("in tune")');
await sleep(1200);
await page.screenshot({ path: 'out/timer-5.png' });
console.log('LOGS:', logs.join('\n') || 'none');
console.log(fails ? fails + ' FAILED' : 'all timer probes passed');
await browser.close();
process.exit(fails ? 1 : 0);
