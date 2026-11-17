// Level 25 (Block Party) behaviour probe, with real mouse input:  node blocks.mjs
//  1. a block lifts under the thumb and follows it with weight (it lags a quick flick, then catches up)
//  2. it never overlaps another block, the box or a seated plug; it stops against them and the bump plays a marimba note
//  3. let go between cells and it settles on a whole cell (a wooden thunk)
//  4. undo puts the block back
//  5. blocks slid aside (the plan, with real drags) uncover the outlets ("ta-da"), and then the cables seat
//  6. a plugged-in cable is a tether: a block that would leave it too short goes back
//  7. S N U G side by side is the secret (a golden block)
import { launch, sleep, toClient, URL } from './common.mjs';
const { browser, page, logs } = await launch({ dpr: 1 });
const ev = (fn, a) => page.evaluate(fn, a);
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };
const mv = async (q) => { const [x, y] = await toClient(page, q[0], q[1]); await page.mouse.move(x, y); };
const blk = (id) => ev((id) => { const r = window.__snug.Game.room, rt = r.blockRT.find((q) => q.b.id === id); return { x: rt.x, y: rt.y, c: rt.b.c, r: rt.b.r, held: rt.held, lift: rt.lift, dest: rt.dest }; }, id);
const overlaps = () => ev(() => { const r = window.__snug.Game.room; let worst = 0; const R = r.blockRT; for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) { const a = R[i], b = R[j]; const ox = Math.min(a.x + a.b.ww / 2, b.x + b.b.ww / 2) - Math.max(a.x - a.b.ww / 2, b.x - b.b.ww / 2), oy = Math.min(a.y + a.b.hh / 2, b.y + b.b.hh / 2) - Math.max(a.y - a.b.hh / 2, b.y - b.b.hh / 2); if (ox > 0.5 && oy > 0.5) worst = Math.max(worst, Math.min(ox, oy)); } return worst; });
const settled = (ms) => ev(() => new Promise((res) => { const r = window.__snug.Game.room; const t0 = performance.now(); const f = () => (r.blockRT.every((b) => !b.held && !b.dest) || performance.now() - t0 > 6000 ? res(true) : setTimeout(f, 50)); f(); }));
async function dragBlock(id, path, ms, hold) {
  const b = await blk(id);
  const pts = [[b.x, b.y], ...path];
  let total = 0; for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  await mv(pts[0]); await page.mouse.down();
  const steps = Math.max(10, Math.round(total / 5));
  let worst = 0;
  for (let i = 1; i <= steps; i++) {
    const u = (i / steps) * (pts.length - 1), k = Math.min(pts.length - 2, Math.floor(u)), f = u - k;
    await mv([pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f, pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f]);
    await sleep(ms / steps);
    if (i % 4 === 0) worst = Math.max(worst, await overlaps());
  }
  if (hold) await sleep(hold);
  await page.mouse.up();
  return worst;
}
await page.goto(URL + '?level=25'); await sleep(2600);
for (let i = 0; i < 40 && (await ev(() => window.__snug.G.Game.room.phase)) !== 'playing'; i++) await sleep(200);
// count the sounds
await ev(() => { const A = window.__snug.G.Audio; window.__snd = { marimba: 0, thunk: 0, lift: 0, chime: 0 }; const w = (o, k, n) => { const f = o[k]; o[k] = function () { window.__snd[n]++; return f && f.apply(this, arguments); }; }; w(A, 'marimba', 'marimba'); w(A, 'chime', 'chime'); w(A.sfx, 'woodThunk', 'thunk'); w(A.sfx, 'blockLift', 'lift'); });

// ---- 1: lift and weight
let n0 = await blk('N');
ok(n0.c === 4 && n0.r === 7 && !n0.held, 'N stands in the box at cell (4,7): ' + JSON.stringify([n0.c, n0.r]));
await mv([n0.x, n0.y]); await page.mouse.down(); await sleep(250);
let n1 = await blk('N');
ok(n1.held && n1.lift > 0.5, 'pressing a block lifts it (lift ' + n1.lift.toFixed(2) + ')');
await mv([n0.x + 88, n0.y]); await sleep(60);
let n2 = await blk('N');
ok(n2.x > n0.x + 2 && n2.x < n0.x + 80, 'a quick flick of the thumb does not teleport it: it lags (moved ' + (n2.x - n0.x).toFixed(0) + ' of 88 u after 60 ms)');
await sleep(700);
let n3 = await blk('N');
ok(Math.abs(n3.x - (n0.x + 88)) < 3, 'and it catches up: ' + (n3.x - n0.x).toFixed(1) + ' u');
// ---- 3: let go between cells
await mv([n0.x + 88, n0.y + 17]); await sleep(500); await page.mouse.up();
await settled();
const nS = await blk('N');
ok(nS.c === 6 && nS.r === 7 && nS.dest === null, 'let go between cells it settles on a whole cell: (' + nS.c + ',' + nS.r + ')');
ok((await ev(() => window.__snd.thunk)) >= 1 && (await ev(() => window.__snd.lift)) >= 1, 'a lift tick and a wooden thunk were played');
// ---- 4: undo
await ev(() => document.getElementById('btnUndo').click()); await settled();
const nU = await blk('N');
ok(nU.c === 4 && nU.r === 7, 'undo puts N back where it was: (' + nU.c + ',' + nU.r + ')');

// ---- 2: collisions
const cB = await blk('C');
await mv([cB.x, cB.y]); await page.mouse.down(); await sleep(250);
await ev(() => { window.__snd.marimba = 0; });
let worst = 0;
for (let shove = 0; shove < 3; shove++) {
  // a quick shove down into Blocky's top (a bump is silent below a gentle push: this one is a knock)
  for (let i = 1; i <= 6; i++) { await mv([cB.x, cB.y + i * 15]); await sleep(18); worst = Math.max(worst, await overlaps()); }
  await sleep(220);
  await mv([cB.x, cB.y - 10]); await sleep(260); // pull back, then again
  if ((await ev(() => window.__snd.marimba)) >= 2) break;
}
await page.mouse.up();
ok(worst < 0.6, 'shoving C into Blocky never overlaps another block (worst overlap ' + worst.toFixed(2) + ' u)');
await settled();
const cA = await blk('C');
ok(cA.c === 3 && cA.r === 7, 'C stopped against Blocky and went back to its own cell (' + cA.c + ',' + cA.r + ')');
ok((await ev(() => window.__snd.marimba)) >= 2, 'the knock played marimba notes, its own and Blocky\'s (' + (await ev(() => window.__snd.marimba)) + ')');
const wallW = await dragBlock('U', [[-40, 392 + 44]], 500, 150); // U is at (0,8): drag it off the left edge of the box
await settled();
const uA = await blk('U');
ok(wallW < 0.6 && uA.c === 0, 'a block cannot be dragged out of the box (U stays at column ' + uA.c + ')');

// ---- 5: the plan, with real drags
const plan = await ev(() => { const G = window.__snug.G, r = G.Game.room; const p = G.Rules.blockSolve(r.L); return p && p.moves.map((m) => ({ id: m.id, route: G.Rules.blockRoute(r.L, G.Rules.blockLayout(r.L), r.L.blocks.findIndex((b) => b.id === m.id), m.to) })); });
ok(!!plan && plan.length === 7, 'the solver\'s plan from the start is seven moves');
const wasCovered = await ev(() => window.__snug.Game.room.L.sockets.filter((s) => window.__snug.G.Rules.blockCovers(window.__snug.Game.room.L, s)).length);
ok(wasCovered === 2, 'two outlets are under Blocky at the start');
await ev(() => { window.__snd.chime = 0; });
for (let k = 0; k < 7; k++) {
  // each move is computed from the layout as it stands (the plan is replanned after every real drag)
  const step = await ev(() => { const G = window.__snug.G, r = G.Game.room; const p = G.Rules.blockSolve(r.L); if (!p || !p.moves.length) return null; const m = p.moves[0]; const i = r.L.blocks.findIndex((b) => b.id === m.id); const route = G.Rules.blockRoute(r.L, G.Rules.blockLayout(r.L), i, m.to); return { id: m.id, pts: route.map((q) => { const c = G.Rules.cellCentre(r.L, q[0], q[1], r.L.blocks[i].w, r.L.blocks[i].h); return [c.x, c.y]; }) }; });
  if (!step) break;
  await dragBlock(step.id, step.pts.slice(1), Math.max(700, step.pts.length * 260), 120);
  await settled(); await sleep(250);
}
const free = await ev(() => { const G = window.__snug.G, r = G.Game.room; return { covered: r.L.sockets.filter((s) => G.Rules.blockCovers(r.L, s)).length, can: r.L.plugs.map((p) => G.Rules.canSeat(r.L, r.st, p.id, 'S.' + (['dot', 'static', 'lux'].indexOf(p.id) + 1)).ok) }; });
ok(free.covered === 0, 'after the moves no outlet is under a block');
ok(free.can.every(Boolean), 'and every cable can be plugged into its outlet: ' + JSON.stringify(free.can));
ok((await ev(() => window.__snd.chime)) >= 2, 'the outlets that were uncovered said ta-da (chimes ' + (await ev(() => window.__snd.chime)) + ')');
async function dragPlug(plugId, sockId) {
  const info = await ev(([p, s]) => { const G = window.__snug.G, r = G.Game.room, T = G.T; const pl = r.plugRT[p], sk = r.L.socketsById[s]; return { from: [pl.x, pl.y], to: [sk.x, sk.y], off: [-T.offX, -T.offY] }; }, [plugId, sockId]);
  const f = (q) => [q[0] + info.off[0], q[1] + info.off[1]];
  const path = [info.from, f([(info.from[0] + info.to[0]) / 2, (info.from[1] + info.to[1]) / 2]), f(info.to)];
  const cl = []; for (const q of path) cl.push(await toClient(page, q[0], q[1]));
  await page.mouse.move(cl[0][0], cl[0][1]); await page.mouse.down();
  for (let i = 1; i <= 24; i++) { const u = (i / 24) * 2, k = Math.min(1, Math.floor(u)), fr = u - k; await page.mouse.move(cl[k][0] + (cl[k + 1][0] - cl[k][0]) * fr, cl[k][1] + (cl[k + 1][1] - cl[k][1]) * fr); await sleep(36); }
  await sleep(150); await page.mouse.up();
}
await dragPlug('static', 'S.2'); await sleep(900);
let seat = await ev(() => window.__snug.Game.room.st.seat);
ok(seat.static === 'S.2', 'the middle cable seats once the way is clear: ' + JSON.stringify(seat));

// ---- 6: a seated plug is solid for blocks, and a cable is a tether
const solid = await ev(() => { const r = window.__snug.Game.room, s = r.L.socketsById['S.2']; const rt = r.blockRT.find((q) => q.b.id === 'C'); rt.x = s.x; rt.y = s.y; return !!r.blockOverlap(rt); });
ok(solid, 'a block cannot stand on a socket that has a plug in it');
await ev(() => { const r = window.__snug.Game.room, rt = r.blockRT.find((q) => q.b.id === 'C'); const p = window.__snug.G.Rules.cellCentre(r.L, rt.b.c, rt.b.r, 1, 1); rt.x = p.x; rt.y = p.y; });

// the tether: with the middle cable plugged in, blocks on both sides of the way in and one more over it would leave it nowhere to go
const tether = await ev(() => {
  const G = window.__snug.G, r = G.Game.room, R = G.Rules, L = r.L;
  const put = (id, c, rr) => { const rt = r.blockRT.find((q) => q.b.id === id); R.placeBlock(L, rt.b, c, rr); rt.x = rt.b.x; rt.y = rt.b.y; rt.dest = null; return rt; };
  const a = put('A', 2, 7), s = put('S', 4, 7);
  r.blocksRefresh();
  const alone = r.blockTetherBroken();
  const orig = [r.blockRT.find((q) => q.b.id === 'C').b.c, r.blockRT.find((q) => q.b.id === 'C').b.r];
  const c = put('C', 3, 7);
  c.grab = orig; c.dest = [3, 7];
  r.blockSettled(c, R.cellCentre(L, 3, 7, 1, 1));
  return { alone, sent: c.dest ? c.dest.slice() : null };
});
ok(tether.alone === false, 'blocks either side of the way in leave the plugged-in cable a route');
ok(tether.sent && (tether.sent[0] !== 3 || tether.sent[1] !== 7), 'a block that would leave the plugged-in cable nowhere to go is sent back (' + JSON.stringify(tether.sent) + ')');

// ---- 7: the secret (S N U G in a row)
await page.goto(URL + '?level=25'); await sleep(2600);
for (let i = 0; i < 40 && (await ev(() => window.__snug.G.Game.room.phase)) !== 'playing'; i++) await sleep(200);
await ev(() => { const r = window.__snug.Game.room, G = window.__snug.G; const set = { S: [0, 9], N: [1, 9], U: [2, 9], G: [3, 9] }; r.L.blocks.forEach((b) => { if (set[b.id]) G.Rules.placeBlock(r.L, b, set[b.id][0], set[b.id][1]); }); r.blockRT.forEach((rt) => { rt.x = rt.b.x; rt.y = rt.b.y; }); r.blockSpellCheck(); });
ok(await ev(() => !!window.__snug.Game.room.secretFound), 'S N U G in a row, in order, is the secret (the golden block)');
console.log('LOGS:', logs.join('\n') || 'none');
console.log(fails ? fails + ' FAILED' : 'all block probes passed');
await browser.close();
process.exit(fails ? 1 : 0);
