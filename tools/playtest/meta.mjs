// The meta layer: the House Map, earned cable skins and chime sets, unlock toasts:  node meta.mjs
//  - a fresh save has only the defaults and the settings sheet says what unlocks next
//  - a save with progress earns everything that is earned; tapping the pickers cycles through exactly those
//  - a skin changes the drawn cable and its pluck, a chime set changes the wake voice
//  - the House Map has one floor per act, lit windows for solved rooms, a gold frame for a full set of secrets
//  - finishing Act 1 announces what it earned
import { launch, sleep, URL } from './common.mjs';
const { browser, ctx, page, logs } = await launch({ dpr: 2 });
const ev = (fn, a) => page.evaluate(fn, a);
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };

// ---- 1. a fresh save
await page.goto(URL); await sleep(1500);
await ev(() => { localStorage.clear(); });
await page.goto(URL + '?level=1'); await sleep(1800);
let r = await ev(() => { const M = window.__snug.G.Meta; return { skin: M.pick('skin'), chime: M.pick('chime'), rope: M.earned('skin', 'rope'), marimba: M.earned('chime', 'marimba') }; });
ok(r.skin === 'braid' && r.chime === 'bell' && !r.rope && !r.marimba, 'fresh save: braid and bell only (' + JSON.stringify(r) + ')');
await page.click('#btnGear').catch(() => {});
await sleep(500);
const txt = await ev(() => [...document.querySelectorAll('#opts .opt.pick')].map((b) => b.textContent.replace(/\s+/g, ' ').trim()));
ok(txt.length === 2 && /Braid/.test(txt[0]) && /Next: Rope/.test(txt[0]) && /Finish Act 1/.test(txt[0]), 'settings pickers show the current choice and what unlocks next: ' + JSON.stringify(txt));
await page.screenshot({ path: 'out/meta-1-settings-fresh.png' });

// ---- 2. a save with progress
const progress = { v: 1, level: 21, stars: {}, secrets: {}, cards: {}, seen: {}, settings: { sound: true, music: true, haptics: true, reduce: false, patterns: false, leftHand: false, skin: 'braid', chime: 'bell' } };
for (let i = 1; i <= 20; i++) progress.stars[i] = [true, i !== 10, true];
for (let i = 1; i <= 9; i++) progress.secrets[i] = true;
await ev((p) => localStorage.setItem('snug.save.v1', JSON.stringify(p)), progress);
await page.goto(URL + '?level=4'); await sleep(1800);
r = await ev(() => { const M = window.__snug.G.Meta; return { skins: M.KINDS.skin.items.filter((i) => i.ok()).map((i) => i.id), chimes: M.KINDS.chime.items.filter((i) => i.ok()).map((i) => i.id) }; });
ok(r.skins.length === 6 && r.chimes.length === 5, 'a save with 20 rooms lit, 9 secrets and 59 stars has earned every skin and chime set: ' + JSON.stringify(r));

// cycle the pickers
await page.click('#btnGear').catch(() => {});
await sleep(500);
const seen = [];
for (let i = 0; i < 6; i++) {
  seen.push(await ev(() => window.__snug.G.Art.skin + '/' + window.__snug.G.Audio.pending.skin));
  await ev(() => document.querySelectorAll('#opts .opt.pick')[0].click());
  await sleep(80);
}
ok(new Set(seen.map((x) => x.split('/')[0])).size === 6 && seen.every((x) => x.split('/')[0] === x.split('/')[1]), 'tapping the cable row visits all six skins and keeps the pluck in step: ' + seen.join(' '));
const chimes = [];
for (let i = 0; i < 5; i++) {
  chimes.push(await ev(() => window.__snug.G.Audio.pending.chime || 'bell'));
  await ev(() => document.querySelectorAll('#opts .opt.pick')[1].click());
  await sleep(60);
}
ok(new Set(chimes).size === 5, 'tapping the chimes row visits all five sets: ' + chimes.join(' '));
const saved = await ev(() => JSON.parse(localStorage.getItem('snug.save.v1')).settings);
ok(saved.skin === 'braid' && saved.chime === 'bell', 'the choice is saved (after a full cycle it is back to braid/bell): ' + JSON.stringify([saved.skin, saved.chime]));
await page.screenshot({ path: 'out/meta-2-settings-earned.png' });
await ev(() => { document.querySelector('#settings [data-close]').click(); });
await sleep(300);

// ---- 3. what each skin looks like on a real level (the mat only)
for (const skin of ['braid', 'rope', 'licorice', 'ribbon', 'neon', 'beads']) {
  progress.settings.skin = skin;
  await ev((p) => localStorage.setItem('snug.save.v1', JSON.stringify(p)), progress);
  await page.goto(URL + '?level=4'); await sleep(1700);
  await page.screenshot({ path: 'out/meta-skin-' + skin + '.png', clip: { x: 0, y: 130, width: 390, height: 330 } });
}
progress.settings.skin = 'braid';

// ---- 4. the House Map
await ev((p) => localStorage.setItem('snug.save.v1', JSON.stringify(p)), progress);
await page.goto(URL + '?level=4'); await sleep(1800);
await page.click('#btnLevels'); await sleep(900);
const house = await ev(() => ({ floors: document.querySelectorAll('#grid .floor').length, lit: document.querySelectorAll('#grid .node.done').length, nodes: document.querySelectorAll('#grid .node').length, roof: (document.querySelector('#grid .roof span') || {}).textContent, litFloors: document.querySelectorAll('#grid .floor.lit').length, goldFloors: document.querySelectorAll('#grid .floor.gold').length, firstIsLevel1: document.querySelector('#grid .node b').textContent }));
const want = await ev(() => { const G = window.__snug.G; return { floors: G.Acts.filter((a) => G.Levels.some((l) => l.act === a.n)).length, nodes: G.Levels.length }; });
ok(house.floors === want.floors && house.nodes === want.nodes && house.lit === 20 && house.litFloors === 2 && house.firstIsLevel1 === '1', 'House Map: one floor per act with levels (' + want.floors + '), one window per level (' + want.nodes + '), the twenty of Acts 1-2 lit, DOM in level order: ' + JSON.stringify(house));
ok(house.roof === '20 of ' + want.nodes + ' rooms lit', 'the roof counts the lit rooms: ' + house.roof);
ok(house.goldFloors === 0, 'a floor is not gilded until every secret on it is found (secrets 1-9 of 20)');
await page.screenshot({ path: 'out/meta-3-house.png' });
await page.click('#levels [data-close]'); await sleep(300);

// a fully-found Act 1 gilds the first floor
for (let i = 1; i <= 10; i++) progress.secrets[i] = true;
await ev((p) => localStorage.setItem('snug.save.v1', JSON.stringify(p)), progress);
await page.goto(URL + '?level=4'); await sleep(1500);
await page.click('#btnLevels'); await sleep(700);
const gold = await ev(() => [...document.querySelectorAll('#grid .floor')].map((f) => f.classList.contains('gold')));
ok(gold[0] === true && gold[1] === false, 'finding every secret of Act 1 gilds its floor: ' + JSON.stringify(gold));
await page.screenshot({ path: 'out/meta-3b-house-gold.png' });
await page.click('#levels [data-close]'); await sleep(300);

// ---- 5. the unlock announcement (a save one room short of Act 1)
const near = { v: 1, level: 10, stars: {}, secrets: {}, cards: {}, seen: {}, settings: progress.settings };
for (let i = 1; i <= 9; i++) near.stars[i] = [true, true, true];
near.settings.skin = 'braid';
await ev((p) => localStorage.setItem('snug.save.v1', JSON.stringify(p)), near);
await page.goto(URL + '?level=10'); await sleep(1800);
const before = await ev(() => window.__snug.G.Meta.fresh().length);
ok(before === 0, 'boot treats what the save has already earned as seen (' + before + ' announcements)');
const fresh = await ev(() => { const G = window.__snug.G; G.Save.complete(10, { lit: true, tidy: false, clean: true }); return G.Meta.fresh().map((f) => f.kind + ':' + f.id); });
ok(fresh.includes('skin:rope') && fresh.includes('chime:marimba'), 'finishing Act 1 earns the rope cable and the marimba: ' + JSON.stringify(fresh));
await ev(() => { const G = window.__snug.G; G.Save.data.seen = {}; G.Meta.fresh(); G.Save.data.seen['skin:rope'] = false; delete G.Save.data.seen['skin:rope']; G.Game.announceUnlocks(10); });
await sleep(900);
const toast = await ev(() => (document.getElementById('toast') || {}).textContent || '');
ok(/New cable: Rope/.test(toast), 'a toast tells the player: "' + toast + '"');

// ---- 5. Act 3's rewards: the crayon cable and the lullaby box are earned by finishing the Toy Room & Studio (levels 21-30)
const act3 = await ev(() => { const G = window.__snug.G; const before = { crayon: G.Meta.earned('skin', 'crayon'), lullaby: G.Meta.earned('chime', 'lullaby') }; G.Save.complete(30, { lit: true, tidy: true, clean: true }); return { before, crayon: G.Meta.earned('skin', 'crayon'), lullaby: G.Meta.earned('chime', 'lullaby'), fresh: G.Meta.fresh().map((f) => f.kind + ':' + f.id) }; });
ok(act3.before.crayon === false && act3.before.lullaby === false && act3.crayon && act3.lullaby, 'finishing Act 3 earns the crayon cable and the lullaby box: ' + JSON.stringify(act3));
ok(act3.fresh.includes('skin:crayon') && act3.fresh.includes('chime:lullaby'), 'and both are announced as news: ' + JSON.stringify(act3.fresh));

console.log('LOGS:', logs.join('\n') || 'none');
console.log(fails ? fails + ' FAILED' : 'all meta checks passed');
await browser.close();
process.exit(fails ? 1 : 0);
