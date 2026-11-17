// Act 4, Level 32 (Docking) behaviour probe, with real mouse input:  node dock.mjs
//  1. the notch turns: a hatch's window moves round its ring as the clock goes (the phase advances with the clock)
//  2. a plug released well before its hatch opens (beyond the 0.8 s grace) is turned away: "not yet", and it bounces back
//  3. a plug released a little before its hatch opens (within the grace) waits, and docks when the notch reaches the keyhole
//  4. all four docked with no plug turned away at any hatch: the golden hatch, at the Wake
import { launch, sleep, toClient, URL } from './common.mjs';
const { browser, page, logs } = await launch({ dpr: 1 });
const ev = (fn, a) => page.evaluate(fn, a);
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };

async function setup() {
  await page.goto(URL + '?level=32'); await sleep(500);
  await page.mouse.click(8, 420); await sleep(200);
  for (let i = 0; i < 40 && (await ev(() => window.__snug.G.Game.room.phase)) !== 'playing'; i++) await sleep(200);
}
// the wait (seconds) until a socket opens: 0 while open
const waitFor = (sid) => ev((sid) => { const r = window.__snug.G.Game.room; const s = r.L.socketsById[sid]; return window.__snug.G.Rules.opensIn(r.st, s); }, sid);
const phaseOf = (sid) => ev((sid) => { const r = window.__snug.G.Game.room; const rt = r.stripRT.H; return rt.timer && rt.timer[sid] ? rt.timer[sid].ph : null; }, sid);
const seat = (pid) => ev((pid) => window.__snug.G.Game.room.st.seat[pid] || null, pid);
const hatchBounced = () => ev(() => !!window.__snug.G.Game.room.hatchBounced);
const phaseNow = () => ev(() => window.__snug.G.Game.room.phase);
// a real drag from a plug's rest over a socket, HELD there until the hatch's wait meets `want` (a predicate on seconds), then let go
async function dragHold(pid, sid, want) {
  const info = await ev(([p, s]) => { const G = window.__snug.G, r = G.Game.room, T = G.T; const pl = r.plugRT[p], sk = r.L.socketsById[s]; return { from: [pl.x, pl.y], to: [sk.x, sk.y], off: [-T.offX, -T.offY] }; }, [pid, sid]);
  const f = (q) => [q[0] + info.off[0], q[1] + info.off[1]];
  const path = [info.from, f([(info.from[0] + info.to[0]) / 2, (info.from[1] + info.to[1]) / 2]), f(info.to)];
  const cl = []; for (const q of path) cl.push(await toClient(page, q[0], q[1]));
  await page.mouse.move(cl[0][0], cl[0][1]); await page.mouse.down();
  for (let i = 1; i <= 16; i++) { const u = (i / 16) * 2, k = Math.min(1, Math.floor(u)), fr = u - k; await page.mouse.move(cl[k][0] + (cl[k + 1][0] - cl[k][0]) * fr, cl[k][1] + (cl[k + 1][1] - cl[k][1]) * fr); await sleep(20); }
  let w = null;
  for (let i = 0; i < 1500; i++) { w = await waitFor(sid); if (want(w)) break; await sleep(8); }
  const at = w;
  await page.mouse.up();
  return at;
}

// ---- 1: the notch turns
await setup();
const pa = await phaseOf('H.1'), t0 = await ev(() => window.__snug.G.Game.room.t);
await sleep(600);
const pb = await phaseOf('H.1'), t1 = await ev(() => window.__snug.G.Game.room.t);
const dph = ((pb - pa) + 3.0) % 3.0;
ok(Math.abs(dph - (t1 - t0)) < 0.12, 'the notch turns with the clock: the coral hatch moved ' + dph.toFixed(2) + ' s of its 3.0 s ring in ' + (t1 - t0).toFixed(2) + ' s');

// ---- 2: a release well before the opening is turned away
// the mint hatch (4.8 s period, 0.9 s open): start its drag while it is 2.0-2.6 s from opening, so the release is beyond the 0.8 s grace
const w2 = await dragHold('sleepy', 'H.4', (w) => w > 1.1 && w < 1.7);
ok(w2 !== null && w2 > 0.8, 'released with the mint hatch still ' + (w2 === null ? '?' : w2.toFixed(2)) + ' s from opening (beyond the 0.8 s grace)');
await sleep(700);
ok((await hatchBounced()) === true && (await seat('sleepy')) === null, 'released too early, the mint hatch turns the tablet away ("not yet") and the tablet bounces back');

// ---- 3: a release within the grace waits and docks
await sleep(300);
const rel = await dragHold('pip', 'H.1', (w) => w > 0.15 && w < 0.6);
await sleep(2600);
ok((await seat('pip')) === 'H.1', 'released ' + (rel === null ? '?' : rel.toFixed(2)) + ' s before its hatch opens (within the grace): the phone waits and docks when the notch reaches the keyhole');

// ---- 4: the secret: all four docked, no plug turned away (a fresh room)
await page.goto(URL + '?level=32'); await sleep(500);
await page.mouse.click(8, 420); await sleep(200);
for (let i = 0; i < 40 && (await phaseNow()) !== 'playing'; i++) await sleep(200);
for (const [pid, sid] of [['pip', 'H.1'], ['rex', 'H.2'], ['lumi', 'H.3'], ['sleepy', 'H.4']]) {
  await dragHold(pid, sid, (w) => w > 0.15 && w < 0.6);
  await sleep(300);
}
await sleep(3500);
const sec = await ev(() => { const r = window.__snug.G.Game.room; return { seats: Object.keys(r.st.seat).filter((k) => r.st.seat[k]).length, bounced: !!r.hatchBounced, secret: !!r.secretFound, phase: r.phase }; });
ok(sec.seats === 4 && !sec.bounced && sec.secret, 'all four docked in their windows, none turned away: the golden hatch (' + JSON.stringify(sec) + ')');

console.log('LOGS:', logs.join('\n') || 'none');
console.log(fails ? fails + ' FAILED' : 'all dock probes passed');
await browser.close();
process.exit(fails ? 1 : 0);
