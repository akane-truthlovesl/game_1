import { launch, sleep, toClient, URL } from './common.mjs';
const { browser, page, logs } = await launch({ dpr: 1 });
await page.goto(URL + '?level=10'); await sleep(1500);
// solve instantly via state (the bot proved the drags); then trigger the wake exactly like play would
await page.evaluate(() => {
  const r = window.__snug.Game.room, G = window.__snug.G;
  const plan = { boxy: 'A.3', pipa: 'A.1', pipb: 'B.1', gus: 'B.3', lumi: 'A.5' };
  for (const id in plan) r.placeSeated(r.plugRT[id], r.L.socketsById[plan[id]], true);
  r.updateCover(); r.refreshPower();
});
await sleep(600);
await page.evaluate(() => { const r = window.__snug.Game.room; r.flipSwitch(r.L.stripsById.B); });
await sleep(1800);
await page.screenshot({ path: 'out/fin-a.png' });
for (const [name, ms] of [['fin-b', 3200], ['fin-c', 3000], ['fin-d', 3500], ['fin-e', 3000]]) { await sleep(ms); await page.screenshot({ path: name + '.png' }); }
console.log(JSON.stringify(await page.evaluate(() => { const r = window.__snug.Game.room; return { phase: r.phase, rex: r.finale.revealed, cat: r.finale.cat.pose, seats: r.st.seat }; })));
console.log('LOGS:', logs.join('\n') || 'none');
await browser.close();
