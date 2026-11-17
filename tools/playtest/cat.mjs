// Level 22 (Laser Pointer) behaviour probe, with real mouse input:  node cat.mjs
//  1. Biscuit sits on the middle socket and it refuses plugs ("cat"); a tap on her makes her purr and she stays
//  2. a spot of light under the thumb makes her get up (the socket is free the moment she does)
//  3. a slow spot is stalked, a fast spot is chased (run), a spot that stops is pounced on (pounce -> leap -> caught)
//  4. let go: the spot stays where it was left; she guards it, gets bored and pads home to the nearest FREE socket
import { launch, sleep, toClient, URL } from './common.mjs';
const { browser, page, logs } = await launch({ dpr: 1 });
const ev = (fn, a) => page.evaluate(fn, a);
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };
const cat = () => ev(() => { const r = window.__snug.G.Game.room, c = r.cat, sp = r.spot; return { state: c.state, x: Math.round(c.x), y: Math.round(c.y), sock: c.sock, blocked: Object.keys(r.st.flags.blocked).filter((k) => r.st.flags.blocked[k]), spot: sp.on ? [Math.round(sp.x), Math.round(sp.y)] : null, caught: +sp.caught.toFixed(1), speed: Math.round(sp.speed), seat: r.st.seat }; });
const mv = async (q) => { const [x, y] = await toClient(page, q[0], q[1]); await page.mouse.move(x, y); };
async function waitState(pred, ms, label) { const t0 = Date.now(); let c; while (Date.now() - t0 < ms) { c = await cat(); if (pred(c)) return c; await sleep(100); } return null; }

await page.goto(URL + '?level=22'); await sleep(2500);
for (let i = 0; i < 40 && (await ev(() => window.__snug.G.Game.room.phase)) !== 'playing'; i++) await sleep(200);
let c0 = await cat();
ok(c0.blocked.includes('A.2') && c0.state === 'sit', 'Biscuit starts sitting on the middle socket: ' + JSON.stringify([c0.state, c0.blocked]));
const why = await ev(() => { const G = window.__snug.G, r = G.Game.room; return G.Rules.canSeat(r.L, r.st, 'static', 'A.2').why; });
ok(why === 'cat', 'that socket refuses a plug while she is on it (why: ' + why + ')');
// a tap on her: a purr, and she stays
const [tx, ty] = await toClient(page, c0.x, c0.y);
await page.mouse.click(tx, ty); await sleep(400);
const purred = await ev(() => window.__snug.G.Game.room.cat.purr > 0.5);
let c1 = await cat();
ok(purred && c1.state === 'sit' && c1.blocked.includes('A.2'), 'a tap makes her purr and she stays put');

// ---- the spot: press bare floor below the strip and creep away slowly
await mv([150, 470]); await page.mouse.down();
let stalked = false, gotUp = false;
for (let i = 0; i < 24; i++) { // creep left along y=470 at ~50 u/s
  await mv([150 - i * 4.5, 470]); await sleep(90);
  const c = await cat();
  if (!c.blocked.includes('A.2')) gotUp = true;
  if (c.state === 'stalk') stalked = true;
}
ok(gotUp, 'a spot of light under the thumb makes her get up: the socket is free');
ok(stalked, 'a slowly creeping spot is stalked (state stalk)');
// now run
let ran = false;
for (let i = 0; i < 16; i++) { await mv([45 + i * 14, 470 + Math.sin(i) * 40]); await sleep(60); const c = await cat(); if (c.state === 'run') ran = true; }
ok(ran, 'a fast spot is chased (state run)');
// stop the spot where she can reach it: she pounces
await mv([260, 520]);
let pounced = false, caught = false;
const t0 = Date.now();
while (Date.now() - t0 < 9000) { const c = await cat(); if (c.state === 'pounce' || c.state === 'leap') pounced = true; if (c.state === 'caught' || c.caught > 0) { caught = true; break; } await sleep(80); }
ok(pounced, 'a spot that stops is pounced on (pounce, then a leap)');
ok(caught, 'and caught under her paws');
await page.mouse.up();

// ---- propped: she guards it, then gets bored and goes home to a FREE socket
const home = await waitState((c) => c.state === 'sit' && c.sock, 16000);
ok(!!home, 'after a few seconds she gets bored and pads back to sit on a socket: ' + JSON.stringify(home && [home.state, home.sock]));
ok(home && home.sock && !Object.values(home.seat).includes(home.sock), 'and it is a free socket (never one with a plug in it)');
console.log('LOGS:', logs.join('\n') || 'none');
console.log(fails ? fails + ' FAILED' : 'all cat probes passed');
await browser.close();
process.exit(fails ? 1 : 0);
