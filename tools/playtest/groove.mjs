// Level 29 (On the Beat) behaviour probe, with real mouse input:  node groove.mjs
//  1. the room plays one bar once: seven voices in groove order (kick, hat, snare, bass, tom, chord, bell) on eighth-note pads, with a
//     silent pad between chord and bell (the gap is two pads, not one)
//  2. tapping a device plays its voice
//  3. a tap on the silent pad two pads early is early: no secret
//  4. the silent pad tapped ON THE BEAT is the pocket: a golden drumstick
//  5. the left-to-right trap (the bell on pad 7): the groove is not lit, nothing wakes, nothing buzzes, and the bell plays ragged
//     (30 ms late per pad of error); its amber ring shows, and it still sounds
//  6. the bell in its pocket (pad 8): the groove is lit, the loop swings (every second pad 42 ms late) and the room wakes
import { launch, sleep, toClient, URL } from './common.mjs';
const { browser, page, logs } = await launch({ dpr: 1 });
const ev = (fn, a) => page.evaluate(fn, a);
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };
async function setup() {
  await page.goto(URL + '?level=29'); await sleep(500);
  await page.mouse.click(8, 420); // a first touch unlocks the audio (browsers need a gesture): without it there is no audio clock
  await sleep(300);
  await ev(() => {
    const wait = setInterval(() => {
      const A = window.__snug && window.__snug.G && window.__snug.G.Audio;
      if (!A) return;
      clearInterval(wait);
      window.__notes = []; window.__buzz = [];
      const w = (k, rec) => { const f = A[k]; A[k] = function () { rec(arguments); return f && f.apply(this, arguments); }; };
      w('inst', (a) => window.__notes.push({ voice: a[0], midi: a[1], vel: a[2], at: (A.now() || 0) + (a[4] || 0), real: performance.now() }));
      w('buzz', (a) => window.__buzz.push({ at: (A.now() || 0) + (a[0] || 0) }));
    }, 20);
  });
  for (let i = 0; i < 40 && (await ev(() => window.__snug.G.Game.room.phase)) !== 'playing'; i++) await sleep(200);
  for (let i = 0; i < 80 && (await ev(() => (window.__notes || []).length)) < 7; i++) await sleep(150); // the demo plays seven voices
}
async function dragPlug(plugId, sockId) {
  const info = await ev(([p, s]) => { const G = window.__snug.G, r = G.Game.room, T = G.T; const pl = r.plugRT[p], sk = r.L.socketsById[s]; return { from: [pl.x, pl.y], to: [sk.x, sk.y], off: [-T.offX, -T.offY] }; }, [plugId, sockId]);
  const f = (q) => [q[0] + info.off[0], q[1] + info.off[1]];
  const path = [info.from, f([(info.from[0] + info.to[0]) / 2, (info.from[1] + info.to[1]) / 2]), f(info.to)];
  const cl = []; for (const q of path) cl.push(await toClient(page, q[0], q[1]));
  await page.mouse.move(cl[0][0], cl[0][1]); await page.mouse.down();
  for (let i = 1; i <= 24; i++) { const u = (i / 24) * 2, k = Math.min(1, Math.floor(u)), fr = u - k; await page.mouse.move(cl[k][0] + (cl[k + 1][0] - cl[k][0]) * fr, cl[k][1] + (cl[k + 1][1] - cl[k][1]) * fr); await sleep(36); }
  await sleep(150); await page.mouse.up(); await sleep(900);
}
async function pullOut(plugId) {
  const info = await ev((p) => { const G = window.__snug.G, r = G.Game.room, T = G.T; const sk = r.L.socketsById[r.st.seat[p]]; return { from: [sk.x, sk.y], off: [-T.offX, -T.offY] }; }, plugId);
  const a = await toClient(page, info.from[0], info.from[1]), b = await toClient(page, info.from[0] + info.off[0] + 30, info.from[1] - 120);
  await page.mouse.move(a[0], a[1]); await page.mouse.down();
  for (let i = 1; i <= 16; i++) { await page.mouse.move(a[0] + (b[0] - a[0]) * i / 16, a[1] + (b[1] - a[1]) * i / 16); await sleep(30); }
  await page.mouse.up(); await sleep(700);
}
const phase = () => ev(() => window.__snug.G.Game.room.phase);
const seqRT = () => ev(() => { const S = window.__snug.G.Game.room.seqRT; return { light: S.light, lightT: S.lightT, t: window.__snug.G.Game.room.t, swingOn: S.swingOn }; });
const devP = (id) => ev((id) => window.__snug.G.Game.room.devRT[id].p, id);
const sockXY = (k) => ev((k) => { const s = window.__snug.G.Game.room.seqRT.strip.sockets[k]; return [s.x, s.y]; }, k);

// ---- 1: the demo
await setup();
const demo = await ev(() => window.__notes.slice(0, 7).map((n) => n.voice));
ok(demo.join(',') === 'kick,hat,snare,bass,tom,chord,bell', 'the room plays one bar in groove order: ' + demo.join(', '));
const dt = await ev(() => { const n = window.__notes; return [1, 2, 3, 4, 5, 6].map((i) => n[i].at - n[i - 1].at); });
ok(dt.slice(0, 5).every((g) => Math.abs(g - 0.3) < 0.004), 'eighth-note pads, 0.300 s apart: ' + dt.map((g) => g.toFixed(4)).join(', '));
// ---- 2: tap the bell
await ev(() => { window.__notes.length = 0; });
const [bx, by] = await toClient(page, 312, 230);
await page.mouse.click(bx, by); await sleep(250);
ok((await ev(() => window.__notes.length)) >= 1 && (await ev(() => window.__notes[0].voice)) === 'bell', 'a tap on Bell plays its voice');
// ---- 3 and 4: the silent pad (pad 7), early, then on the beat
const [rx, ry] = await sockXY(6);
for (let i = 0; i < 80; i++) { const s = await seqRT(); if (s.light === 4 && s.t - s.lightT < 0.04) break; await sleep(20); }
const [ex, ey] = await toClient(page, rx, ry);
await page.mouse.click(ex, ey); await sleep(300);
ok(!(await ev(() => !!window.__snug.G.Game.room.secretFound)), 'a tap on the silent pad two pads early is early: no secret yet');
for (let i = 0; i < 120; i++) { const s = await seqRT(); if (s.light === 6 && s.t - s.lightT < 0.09) break; await sleep(10); }
await page.mouse.click(ex, ey); await sleep(300);
ok(await ev(() => !!window.__snug.G.Game.room.secretFound), 'the silent pad tapped ON THE BEAT is the pocket: the golden drumstick');
// ---- 5: the left-to-right trap
const plan = [['kick', 'S.1'], ['hat', 'S.2'], ['snare', 'S.3'], ['bass', 'S.4'], ['tom', 'S.5'], ['chord', 'S.6'], ['bell', 'S.7']];
for (const [p, s] of plan) await dragPlug(p, s);
await ev(() => { window.__notes.length = 0; window.__buzz.length = 0; });
await sleep(3200);
ok((await phase()) === 'playing', 'filled left to right, the groove is not lit and nothing wakes (' + (await phase()) + ')');
ok((await ev(() => window.__buzz.length)) === 0, 'and nothing buzzes: a misplaced voice still sounds');
ok((await devP('bell')) === 'on', 'the bell on the silent pad is on (it plays), not standing by');
const bellGap = await ev(() => { const n = window.__notes; const c = n.find((x) => x.voice === 'chord'), b = n.find((x) => x.voice === 'bell'); return c && b ? b.at - c.at : null; });
ok(bellGap !== null && Math.abs(bellGap - 0.33) < 0.006, 'the bell plays ragged: pad 7 is 0.330 s after the chord, not 0.300 s (' + (bellGap === null ? 'none' : bellGap.toFixed(4)) + ')');
// ---- 6: the bell in its pocket
await pullOut('bell');
await dragPlug('bell', 'S.8');
await ev(() => { window.__notes.length = 0; });
await sleep(1600);
ok((await seqRT()).swingOn === true, 'the groove is lit: every voice is in its pocket, and the loop swings');
// the gaps between consecutive voices: a straight pad then a swung one is 0.342 s, a swung pad then a straight one 0.258 s
const diffs = await ev(() => { const n = window.__notes.slice().sort((a, b) => a.at - b.at); return n.slice(1).map((x, i) => x.at - n[i].at); });
const has = (v) => diffs.some((g) => Math.abs(g - v) < 0.006);
ok(has(0.342) && has(0.258), 'the off-beat pads sit 42 ms late: the gaps are 0.342 and 0.258 s (' + diffs.map((g) => g.toFixed(3)).join(', ') + ')');
await sleep(1500);
const ph = await phase();
ok(ph === 'waking' || ph === 'settling', 'the room wakes when the groove is tight (' + ph + ')');
console.log('LOGS:', logs.join('\n') || 'none');
console.log(fails ? fails + ' FAILED' : 'all groove probes passed');
await browser.close();
process.exit(fails ? 1 : 0);
