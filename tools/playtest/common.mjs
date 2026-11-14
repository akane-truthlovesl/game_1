import { chromium } from 'playwright-core';
import fs from 'fs';
fs.mkdirSync('out', { recursive: true });
export const URL = process.env.SNUG_URL || 'http://127.0.0.1:8123/index.html';
export async function launch(opts = {}) {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', headless: true,
    args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required', '--disable-features=Translate'] });
  const ctx = await browser.newContext({ viewport: { width: opts.w || 390, height: opts.h || 844 }, deviceScaleFactor: opts.dpr || 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', (e) => logs.push('PAGEERROR: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  return { browser, ctx, page, logs };
}
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export async function toClient(page, x, y) {
  return page.evaluate(([x, y]) => { const V = window.__snug.G.Game.view; const r = document.getElementById('c').getBoundingClientRect(); return [r.left + V.ox + x * V.scale, r.top + V.oy + y * V.scale]; }, [x, y]);
}
export async function drag(page, from, to, steps = 28, ms = 700) {
  const [fx, fy] = await toClient(page, from[0], from[1]);
  const [tx, ty] = await toClient(page, to[0], to[1]);
  await page.mouse.move(fx, fy);
  await page.mouse.down();
  for (let i = 1; i <= steps; i++) {
    const t = i / steps, e = t * t * (3 - 2 * t);
    await page.mouse.move(fx + (tx - fx) * e, fy + (ty - fy) * e);
    await sleep(ms / steps);
  }
  await sleep(60);
  await page.mouse.up();
}
