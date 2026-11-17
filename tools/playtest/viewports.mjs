// screenshots at four viewports (small phone, big phone, short phone, desktop): a level of each act, the boss, and the House Map
//   node viewports.mjs            -> out/vp-<size>-L<level>.png and out/vp-<size>-house.png
import { launch, sleep, URL } from './common.mjs';
const sizes = [[360, 740, 'a'], [412, 915, 'b'], [375, 667, 'c'], [1280, 800, 'd']];
const levels = (process.env.LEVELS || '7,20').split(',').map((x) => parseInt(x, 10));
for (const [w, h, k] of sizes) {
  const { browser, page, logs } = await launch({ w, h, dpr: k === 'd' ? 1 : 2 });
  for (const lv of levels) {
    await page.goto(URL + '?level=' + lv); await sleep(2000);
    await page.screenshot({ path: 'out/vp-' + k + '-L' + lv + '.png' });
    console.log(w + 'x' + h, 'L' + lv, JSON.stringify(await page.evaluate(() => { const v = window.__snug.Game.view; return { scale: +v.scale.toFixed(3), ox: +v.ox.toFixed(1), oy: +v.oy.toFixed(1) }; })), logs.length ? logs.join('|') : 'no logs');
  }
  // the House Map must fit and scroll inside the card at every size
  await page.click('#btnLevels'); await sleep(700);
  const fit = await page.evaluate(() => { const c = document.querySelector('#levels .card').getBoundingClientRect(), g = document.getElementById('grid'); return { cardH: Math.round(c.height), winH: innerHeight, gridScrolls: g.scrollHeight > g.clientHeight, cardInside: c.top >= 0 && c.bottom <= innerHeight }; });
  console.log('   house map', JSON.stringify(fit));
  await page.screenshot({ path: 'out/vp-' + k + '-house.png' });
  await browser.close();
}
