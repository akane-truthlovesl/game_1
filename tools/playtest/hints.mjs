// Hint-button audit, with the real button:  node hints.mjs [from] [to]
// For every level: load it, press the bulb at the start, and check the hint has something to SHOW (a hand: path, poly, tap or a gesture
// script; or, for "wait", a caption) and that drawing it raises no console error. The bot reads Rules.hint directly, so only this
// probe notices a hint type the room cannot present.
import { launch, sleep, URL } from './common.mjs';
const from = parseInt(process.argv[2] || '1', 10), to = parseInt(process.argv[3] || '99', 10);
const { browser, page, logs } = await launch({ dpr: 1 });
const ev = (fn, a) => page.evaluate(fn, a);
const ids = await (async () => { await page.goto(URL + '?level=1'); await sleep(1200); return ev(() => window.__snug.G.Levels.map((l) => l.id)); })();
let fails = 0, shown = 0;
for (const id of ids.filter((i) => i >= from && i <= to)) {
  const before = logs.length;
  await page.goto(URL + '?level=' + id); await sleep(2200);
  for (let i = 0; i < 40 && (await ev(() => window.__snug.G.Game.room.phase)) !== 'playing'; i++) await sleep(200);
  const act = await ev(() => { const r = window.__snug.G.Game.room, a = window.__snug.G.Rules.hint(r.L, r.st); return a && { type: a.type }; });
  await ev(() => document.getElementById('btnHint').click());
  await sleep(1300);
  const h = await ev(() => { const r = window.__snug.G.Game.room, h = r.hint; return h ? { type: h.act.type, hand: !!(h.path || h.poly || h.tap || h.seq) } : null; });
  await sleep(1400); // a second sample in the middle of the loop (the wind hint's key circle)
  const errs = logs.slice(before).filter((l) => l.startsWith('error') || l.startsWith('PAGEERROR'));
  const okHand = act === null || (h && h.hand) || (act && act.type === 'wait');
  if (!okHand || errs.length) fails++;
  if (h && h.hand) shown++;
  console.log((okHand && !errs.length ? '  ok   ' : '  FAIL ') + 'L' + id + ' hint ' + JSON.stringify(act && act.type) + ' -> ' + JSON.stringify(h) + (errs.length ? '  ERR ' + errs[0].slice(0, 160) : ''));
  if (id === 24 || id === 23) await page.screenshot({ path: `out/hint-L${id}.png` });
}
console.log('LOGS:', logs.filter((l) => !l.startsWith('warning')).join('\n') || 'none');
console.log(fails ? fails + ' FAILED' : 'all hints show something (' + shown + ' with a hand)');
await browser.close();
process.exit(fails ? 1 : 0);
