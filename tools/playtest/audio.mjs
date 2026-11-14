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
    padChord: (A) => { [0, 1, 2, 3].forEach((k, i) => setTimeout(() => {}, 0)); [0, 1, 2, 3].forEach((k) => A.pad.add(k)); },
  };
  const out = {}; const wavs = {};
  for (const name in cases) {
    const secs = name === 'riff' ? 9.6 : name === 'win' || name === 'padChord' ? 3.2 : name === 'purr' ? 1.6 : 1.4;
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
console.log('name        peak   rms     dc       tail_s centroid_hz');
for (const [k, v] of Object.entries(res.out)) console.log(k.padEnd(11), String(v.peak).padEnd(6), String(v.rms).padEnd(7), String(v.dc).padEnd(8), String(v.tail_s).padEnd(6), String(v.centroid_hz).padEnd(6), v.nan ? 'NaN!' : '');
// sampler: each sound, 0.25s gap
const order = ['tick', 'magnet', 'thunk', 'thunkSoft', 'thunkHard', 'thunkSteel', 'thunkTile', 'thunkNight', 'thunkFat', 'tock', 'pluck', 'pluckLow', 'vPhone', 'vTablet', 'vLaptop', 'vConsole', 'vLamp', 'vRadio', 'vDrill', 'vSpeaker', 'chimeAct2', 'pop', 'knock', 'zap', 'click', 'twang', 'bip', 'powerdown', 'chime0', 'chime5', 'star', 'thud', 'cat', 'win', 'riff'];
const SR = 32000; const gap = new Array(Math.floor(SR * 0.35)).fill(0); let all = [];
for (const n of order) { all = all.concat(res.wavs[n], gap); }
const buf = Buffer.alloc(44 + all.length * 2);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + all.length * 2, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(all.length * 2, 40);
all.forEach((v, i) => buf.writeInt16LE(v, 44 + i * 2));
fs.mkdirSync('../../docs/audio', { recursive: true });
fs.writeFileSync('../../docs/audio/sfx-sampler.wav', buf);
console.log('sampler:', order.join(' → '), (buf.length / 1024).toFixed(0) + ' KB');
console.log('LOGS:', logs.length ? logs.join('\n') : 'none');
await browser.close();
