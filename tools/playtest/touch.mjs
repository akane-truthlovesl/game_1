import { launch, sleep, toClient, URL } from './common.mjs';
const { browser, ctx, page, logs } = await launch({ dpr: 2 });
const cdp = await ctx.newCDPSession(page);
const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1, radiusX: 8, radiusY: 8, force: 0.6 }] });
await page.goto(URL + '?level=1'); await sleep(1800);
const I = await page.evaluate(() => { const r = window.__snug.Game.room, T = window.__snug.G.T, p = r.plugList[0], s = r.L.sockets[0]; return { p: [p.x, p.y], to: [s.x - T.offX, s.y - T.offY] }; });
const [ax, ay] = await toClient(page, I.p[0], I.p[1]); const [bx, by] = await toClient(page, I.to[0], I.to[1]);
await touch('touchStart', ax, ay); await sleep(80);
const held = await page.evaluate(() => ({ st: window.__snug.Game.room.plugList[0].state, scrolled: window.scrollY }));
for (let i = 1; i <= 24; i++) { await touch('touchMove', ax + (bx - ax) * i / 24, ay + (by - ay) * i / 24); await sleep(26); }
await sleep(300); await touch('touchEnd');
await sleep(4200);
const res = await page.evaluate(() => { const r = window.__snug.Game.room; return { seat: r.st.seat, phase: r.phase, stars: r.stars }; });
console.log('touch drag: grabbed =', held.st, '| page scrolled =', held.scrolled, '| result', JSON.stringify(res));
console.log('PASS touch drag solves level 1', res.phase === 'settling' && held.st === 'held' && held.scrolled === 0);
// tuning panel
await page.goto(URL + '?level=1&tune=1'); await sleep(1500);
const panel = await page.evaluate(() => { const p = document.getElementById('tunepanel'); return { exists: !!p, open: p && p.classList.contains('open'), sliders: p ? p.querySelectorAll('input[type=range]').length : 0, groups: p ? [...p.querySelectorAll('.tg')].map((g) => g.textContent).join(',') : '' }; });
console.log('tuning panel:', JSON.stringify(panel));
await page.evaluate(() => { const i = document.querySelector('#tunepanel .tr input'); i.value = i.max; i.dispatchEvent(new Event('input')); });
console.log('slider changes live value (segLen):', await page.evaluate(() => window.__snug.G.T.segLen));
await page.screenshot({ path: 'out/tune.png' });
console.log('LOGS:', logs.join('\n') || 'none');
await browser.close();
