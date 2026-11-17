import { launch, sleep } from './common.mjs';
import fs from 'fs';
const { browser, page, logs } = await launch({ dpr: 1 });
await page.goto((process.env.SNUG_URL || 'http://127.0.0.1:8123/index.html').replace('index.html', 'tools/playtest/audio-test.html'));
await sleep(500);
const res = await page.evaluate(async () => {
  const G = window.Snug, SR = 32000;
  const cases = {
    tick: (A) => A.sfx.tick(), magnet: (A) => A.sfx.magnet(), thunk: (A) => A.sfx.thunk(0), thunkFat: (A) => A.sfx.thunk(1),
    thunkSoft: (A) => A.sfx.thunk(0, { power: 0.3, crisp: 0.2 }), thunkHard: (A) => A.sfx.thunk(0, { power: 1, crisp: 1 }),
    thunkSteel: (A) => A.sfx.thunk(0, { power: 0.8, mat: 'steel' }), thunkTile: (A) => A.sfx.thunk(0, { power: 0.8, mat: 'tile' }),
    thunkNight: (A) => A.sfx.thunk(0, { power: 0.6, mat: 'night' }), thunkLeft: (A) => A.sfx.thunk(0, { power: 0.8, pan: -0.65 }),
    tock: (A) => A.sfx.tock(0.7, 0.3), pluck: (A) => A.pluck(67, 0.8, -0.3), pluckLow: (A) => A.pluck(55, 1, 0.5),
    vPhone: (A) => A.voice('phone', 2, 0), vTablet: (A) => A.voice('tablet', 2, 0), vLaptop: (A) => A.voice('laptop', 2, 0),
    vConsole: (A) => A.voice('console', 2, 0), vLamp: (A) => A.voice('lamp', 2, 0), vRadio: (A) => A.voice('radio', 2, 0),
    vDrill: (A) => A.voice('drill', 2, 0), vSpeaker: (A) => A.voice('speaker', 2, 0),
    chimeAct2: (A) => { A.setRoot(1); A.chime(3, 0, -0.5); },
    pop: (A) => A.sfx.pop(), twang: (A) => A.sfx.twang(), knock: (A) => A.sfx.knock(), zap: (A) => A.sfx.zap(), click: (A) => A.sfx.click(),
    zip: (A) => A.sfx.zip(), whoosh: (A) => A.sfx.whoosh(), thud: (A) => A.sfx.thud(0.5), bip: (A) => A.sfx.bip(2), powerdown: (A) => A.sfx.powerdown(),
    cat: (A) => A.sfx.cat(), purr: (A) => A.sfx.purr(1.2),
    chime0: (A) => A.chime(0), chime5: (A) => A.chime(5), star: (A) => A.star(1),
    win: (A) => A.win(5),
    riff: (A) => A.sfx.riff(),
    // Act 2: the machines, the kitchen and the stingers
    tock2: (A) => A.sfx.tock2(0.9), whistleFar: (A) => A.sfx.whistleFar(), splash: (A) => A.sfx.splash(), cling: (A) => A.sfx.cling(),
    crackle: (A) => A.sfx.crackle(), clack: (A) => A.sfx.clack(), choke: (A) => A.sfx.choke(), detent: (A) => A.sfx.detent(), clunk: (A) => A.sfx.clunk(),
    endstop: (A) => A.sfx.endstop(), ledrun: (A) => A.sfx.ledrun(3), rip: (A) => A.sfx.rip(), mend: (A) => A.sfx.mend(), wind: (A) => A.wind(1),
    hum: (A) => A.hum(0.08, 0.4, 330), vKettle: (A) => A.voice('kettle', 3, 0), vToaster: (A) => A.voice('toaster', 3, 0), vDryer: (A) => A.voice('dryer', 3, 0),
    // earned cosmetics: the four other chime sets and the five cable plucks
    chimeMarimba: (A) => { A.settings({ chime: 'marimba' }); A.chime(5); }, chimeMusicBox: (A) => { A.settings({ chime: 'musicbox' }); A.chime(5); },
    // Act 3 (the studio and the boss): the lullaby box, the groove and the bass voices, the lock, the teasers
    chimeLullaby: (A) => { A.settings({ chime: 'lullaby' }); A.chime(5); },
    kick: (A) => A.inst('kick', 36, 1, 0, 0), snare: (A) => A.inst('snare', 60, 1, 0, 0), tom: (A) => A.inst('tom', 50, 1, 0, 0),
    hat: (A) => A.inst('hat', 84, 0.6, 0, 0), chordStack: (A) => A.inst('chord', 60, 0.6, 0, 0), bassPluck: (A) => A.inst('bass', 40, 0.6, 0, 0),
    bellVoice: (A) => A.inst('bell', 79, 0.6, 0, 0), celestaTag: (A) => A.inst('celesta', 84, 0.5, 0, 0),
    lockClick: (A) => A.sfx.lockClick(), padsFlash: (A) => A.sfx.padsFlash(), stationBeep: (A) => A.sfx.stationBeep(), spotOn: (A) => A.sfx.spotOn(),
    bassWake: (A) => { A.inst('kick', 36, 1, 0, 0); A.inst('chord', 48, 0.5, 0, 0.3); A.chime(4); A.chime(8); },
    chimeGlass: (A) => { A.settings({ chime: 'glass' }); A.chime(5); }, chimeKalimba: (A) => { A.settings({ chime: 'kalimba' }); A.chime(5); },
    pluckRope: (A) => { A.settings({ skin: 'rope' }); A.pluck(64, 0.8, 0); }, pluckLicorice: (A) => { A.settings({ skin: 'licorice' }); A.pluck(64, 0.8, 0); },
    pluckRibbon: (A) => { A.settings({ skin: 'ribbon' }); A.pluck(64, 0.8, 0); }, pluckNeon: (A) => { A.settings({ skin: 'neon' }); A.pluck(64, 0.8, 0); },
    pluckBeads: (A) => { A.settings({ skin: 'beads' }); A.pluck(64, 0.8, 0); },
    padChord: (A) => { [0, 1, 2, 3].forEach((k, i) => setTimeout(() => {}, 0)); [0, 1, 2, 3].forEach((k) => A.pad.add(k)); },
  };
  const out = {}; const wavs = {};
  for (const name in cases) {
    const secs = name === 'riff' ? 9.6 : name === 'win' || name === 'padChord' ? 3.2 : name === 'whistleFar' ? 5.2 : name === 'purr' ? 1.6 : 1.4;
    const ctx = new OfflineAudioContext(2, SR * secs, SR);
    const A = G.createAudio(ctx);
    cases[name](A);
    const buf = await ctx.startRendering();
    const L = buf.getChannelData(0), R = buf.getChannelData(1);
    let peak = 0, sum = 0, dc = 0, nan = 0, last = 0;
    const N = L.length;
    for (let i = 0; i < N; i++) { const v = (L[i] + R[i]) / 2; if (!isFinite(v)) nan++; const a = Math.abs(v); if (a > peak) peak = a; sum += v * v; dc += v; if (a > 0.002) last = i; }
    // spectral centroid on the loudest 2048-sample window
    let bi = 0, bp = 0; for (let i = 0; i + 2048 < N; i += 512) { let p = 0; for (let k = 0; k < 2048; k += 4) p += L[i + k] * L[i + k]; if (p > bp) (bp = p), (bi = i); }
    let num = 0, den = 0; const W = 1024;
    for (let k = 1; k < 300; k++) { let re = 0, im = 0; const f = (k * SR) / W / 2; for (let n = 0; n < W; n++) { const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * n) / W); const x = L[bi + n] * w; re += x * Math.cos((2 * Math.PI * k * n) / W); im -= x * Math.sin((2 * Math.PI * k * n) / W); } const m = Math.hypot(re, im); num += m * f; den += m; }
    out[name] = { peak: +peak.toFixed(3), rms: +Math.sqrt(sum / N).toFixed(4), dc: +(dc / N).toFixed(5), tail_s: +(last / SR).toFixed(2), centroid_hz: den ? Math.round(num / den) : 0, nan };
    // mono 16-bit for a sampler
    const pcm = new Int16Array(N); for (let i = 0; i < N; i++) pcm[i] = Math.max(-1, Math.min(1, (L[i] + R[i]) / 2)) * 32767;
    wavs[name] = Array.from(pcm.slice(0, Math.min(N, Math.ceil((last / SR + 0.15) * SR))));
  }
  return { out, wavs };
});
console.log('name        peak   rms     dc       tail_s centroid_hz  nan');
for (const [k, v] of Object.entries(res.out)) console.log(k.padEnd(11), String(v.peak).padEnd(6), String(v.rms).padEnd(7), String(v.dc).padEnd(8), String(v.tail_s).padEnd(6), String(v.centroid_hz).padEnd(6), v.nan ? 'NaN!' : '', String(v.nan));
// sampler: each sound, 0.25s gap
const order = ['tick', 'magnet', 'thunk', 'thunkSoft', 'thunkHard', 'thunkSteel', 'thunkTile', 'thunkNight', 'thunkFat', 'tock', 'pluck', 'pluckLow', 'vPhone', 'vTablet', 'vLaptop', 'vConsole', 'vLamp', 'vRadio', 'vDrill', 'vSpeaker', 'chimeAct2', 'pop', 'knock', 'zap', 'click', 'twang', 'bip', 'powerdown', 'chime0', 'chime5', 'star', 'thud', 'cat', 'win', 'riff'];
const SR = 32000; const gap = new Array(Math.floor(SR * 0.35)).fill(0); let all = [];
for (const n of order) { all = all.concat(res.wavs[n], gap); }
const buf = Buffer.alloc(44 + all.length * 2);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + all.length * 2, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(all.length * 2, 40);
all.forEach((v, i) => buf.writeInt16LE(v, 44 + i * 2));
fs.mkdirSync('../../docs/audio', { recursive: true });
fs.writeFileSync('../../docs/audio/sfx-sampler.wav', buf);
{ const bad = Object.entries(res.out).filter(([, v]) => v.nan > 0 || v.peak > 1); console.log(bad.length ? 'NAN OR CLIP: ' + bad.map(([k]) => k).join(', ') : 'all sounds render finite and under full scale'); if (bad.length) process.exitCode = 1; }
console.log('sampler:', order.join(' → '), (buf.length / 1024).toFixed(0) + ' KB');
console.log('LOGS:', logs.length ? logs.join('\n') : 'none');
await browser.close();
