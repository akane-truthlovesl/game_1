import { launch, sleep, URL } from './common.mjs';
const sizes = [[360, 740, 'a'], [412, 915, 'b'], [375, 667, 'c'], [1280, 800, 'd']];
for (const [w, h, k] of sizes) {
  const { browser, page, logs } = await launch({ w, h, dpr: k === 'd' ? 1 : 2 });
  await page.goto(URL + '?level=7'); await sleep(2000);
  await page.screenshot({ path: 'out/vp-' + k + '.png' });
  console.log(w + 'x' + h, JSON.stringify(await page.evaluate(() => { const v = window.__snug.Game.view; return { scale: +v.scale.toFixed(3), ox: +v.ox.toFixed(1), oy: +v.oy.toFixed(1) }; })), logs.length ? logs[0] : 'ok');
  await browser.close();
}
