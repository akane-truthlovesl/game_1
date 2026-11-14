import { launch, sleep, toClient, URL } from './common.mjs';
const { browser, ctx, page, logs } = await launch();
const ev = (fn, arg) => page.evaluate(fn, arg);
const ok = (name, cond, extra) => console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : ''));
async function dragPlug(plugId, toSockId, ms = 800) {
  const info = await ev(([pid, sid]) => { const r = window.__snug.Game.room, T = window.__snug.G.T, p = r.plugRT[pid], s = r.L.socketsById[sid]; return { p: [p.x, p.y], to: [s.x - T.offX, s.y - T.offY] }; }, [plugId, toSockId]);
  const [cx, cy] = await toClient(page, info.p[0], info.p[1]);
  const [tx, ty] = await toClient(page, info.to[0], info.to[1]);
  await page.mouse.move(cx, cy); await page.mouse.down();
  for (let i = 1; i <= 26; i++) { await page.mouse.move(cx + (tx - cx) * i / 26, cy + (ty - cy) * i / 26); await sleep(ms / 26); }
  await sleep(260); await page.mouse.up();
}
await page.goto(URL); await sleep(2000);
ok('title mode', (await ev(() => window.__snug.Game.mode)) === 'title');
// first plug-in
await dragPlug('cord', 'G.1', 900); await sleep(2600);
ok('menu appears after the first plug-in', await ev(() => document.getElementById('menu').classList.contains('in')));
await page.screenshot({ path: 'out/flow-1-menu.png' });
// levels sheet: only level 1 unlocked
await page.click('#mLevels'); await sleep(500);
const locked = await ev(() => [...document.querySelectorAll('#grid .node')].map((n) => n.classList.contains('lock')));
const NL = await ev(() => window.__snug.G.Levels.length);
ok('levels grid: one node per level, only #1 unlocked', locked.length === NL && !locked[0] && locked.slice(1).every(Boolean), JSON.stringify(locked));
await page.screenshot({ path: 'out/flow-2-levels.png' });
await page.click('#levels [data-close]'); await sleep(400);
await page.click('#mPlay'); await sleep(1500);
ok('Play starts level 1', (await ev(() => document.getElementById('lvnum').textContent)) === 'Level 1');
// solve L1, expect stars and Next
await dragPlug('pip', 'G.1'); await sleep(4200);
ok('level 1 solved (settling)', (await ev(() => window.__snug.Game.room.phase)) === 'settling');
ok('Next is visible', await ev(() => document.getElementById('next').classList.contains('in')));
await page.screenshot({ path: 'out/flow-3-win.png' });
await page.click('#next'); await sleep(1800);
ok('Next goes to level 2', (await ev(() => document.getElementById('lvnum').textContent)) === 'Level 2');
// undo / hint / restart on level 2
await dragPlug('a', 'A.1'); await sleep(700);
ok('plug a seated', (await ev(() => window.__snug.Game.room.st.seat.a)) === 'A.1');
ok('undo enabled', !(await ev(() => document.getElementById('btnUndo').classList.contains('dis'))));
await page.click('#btnUndo'); await sleep(900);
ok('undo unseats it', (await ev(() => window.__snug.Game.room.st.seat.a)) === null && (await ev(() => window.__snug.Game.room.plugRT.a.state)) !== 'seated');
await page.click('#btnHint'); await sleep(900);
ok('hint hand appears', !!(await ev(() => window.__snug.Game.room.hint)));
await page.screenshot({ path: 'out/flow-4-hint.png' });
await page.click('#btnRestart'); await sleep(1600);
ok('restart gives a fresh room', (await ev(() => window.__snug.Game.room.seatCount)) === 0 && (await ev(() => window.__snug.Game.room.phase)) !== 'settling');
// settings
await page.click('#btnGear'); await sleep(500);
await page.screenshot({ path: 'out/flow-5-settings.png' });
const before = await ev(() => window.__snug.G.Fx.reduce);
await page.click('#opts .opt:nth-child(4)'); await sleep(200);
ok('reduce-motion toggles', (await ev(() => window.__snug.G.Fx.reduce)) !== before);
await page.click('#settings [data-close]'); await sleep(400);
// persistence
const saved = await ev(() => JSON.parse(localStorage.getItem('snug.save.v1')));
ok('progress saved (level 2 unlocked, level 1 stars)', saved && saved.level >= 2 && saved.stars['1'] && saved.stars['1'][0] === true, JSON.stringify({ level: saved && saved.level, st: saved && saved.stars }));
await page.reload(); await sleep(1800);
await dragPlug('cord', 'G.1', 700); await sleep(2600);
await page.click('#mLevels'); await sleep(500);
const unlocked = await ev(() => [...document.querySelectorAll('#grid .node')].map((n) => !n.classList.contains('lock')));
ok('after reload: levels 1-2 unlocked', unlocked[0] && unlocked[1] && !unlocked[2], JSON.stringify(unlocked));
console.log('LOGS:', logs.join('\n') || 'none');
await browser.close();
