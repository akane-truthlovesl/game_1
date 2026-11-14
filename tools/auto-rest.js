#!/usr/bin/env node
/* Snug — tools/auto-rest.js : choose tidy resting positions (+ curl side, + optional shorter cables) so every resting
   arc fits on the stage, avoids strips/obstacles, and nests with its neighbours without crossing.
   usage: node tools/auto-rest.js --levels 2,4 [--shrink 2,4] [--write]
   --shrink N : cable length := 1.08 x the distance the tidy solution needs (generous levels only) */
'use strict';
const fs = require('fs'),
  path = require('path');
globalThis.Snug = {};
const S = (p) => require(path.join(__dirname, '..', 'src', p));
['util.js', 'tune.js', 'geom.js', 'rope.js', 'rules.js'].forEach(S);
S('levels/world1.js');
const G = globalThis.Snug,
  R = G.Rules,
  Geom = G.Geom;
const args = process.argv.slice(2);
const list = (flag) => (args.includes(flag) ? args[args.indexOf(flag) + 1].split(',').map(Number) : []);
const write = args.includes('--write');
const only = list('--levels').length ? list('--levels') : G.Levels.map((l) => l.id);
const shrink = list('--shrink');

const result = {};
for (const def0 of G.Levels) {
  if (!only.includes(def0.id)) continue;
  let def = def0;
  if (shrink.includes(def.id)) {
    // lengths from the tidy solution
    const L0 = R.compile(def);
    const sols = R.solveAll(L0, { cap: 400 });
    let best = null, bc = 1e9;
    for (const m of sols) { const c = R.solutionCrossings(L0, m); if (c < bc) (bc = c), (best = m); }
    const devices = def.devices.map((d) => {
      const need = L0.reach[d.id][best[d.id]].needed;
      return Object.assign({}, d, { cable: Object.assign({}, d.cable, { len: Math.ceil((need * 1.08) / 5) * 5 }) });
    });
    def = Object.assign({}, def, { devices });
  }
  const L = R.compile(def);
  const sols = R.solveAll(L, { cap: 400, dead: def.script ? Object.fromEntries(def.script.deadAfter.map((k) => [k, true])) : {} });
  let best = sols[0], bc = 1e9;
  for (const m of sols) { const c = R.solutionCrossings(L, m); if (c < bc) (bc = c), (best = m); }

  const items = [];
  for (const s of L.strips) items.push(R.stripPoly(s));
  for (const o of L.obstacles) items.push(R.obstaclePoly(o));
  for (const d of L.devices) items.push(R.devicePoly(d));
  const decorPolys = (def.decor || []).filter((d) => d.art !== 'cattail').map((d) => Geom.rectPoly(d.x, d.y, 56, 56, 0));
  const devs = L.devices.slice().sort((a, b) => a.x - b.x);
  const chosen = []; // {x,y,curl,arc:[{x,y}]}
  result[def.id] = {};
  for (const dev of devs) {
    const sock = best ? L.socketsById[best[dev.id]] : null;
    const n = Math.max(8, Math.min(64, Math.ceil(dev.len / G.T.segLen) + 1));
    const ax = new Float64Array(n), ay = new Float64Array(n);
    let pick = null, ps = -1e9;
    for (let a = -80; a <= 80; a += 4)
      for (let f = 0.6; f <= 0.9; f += 0.03) {
        const ang = (a * Math.PI) / 180;
        const c = dev.len * f;
        const x = dev.port.x + Math.sin(ang) * c, y = dev.port.y + Math.cos(ang) * c;
        if (x < 28 || x > 332 || y < 70 || y > 585) continue;
        if (dev.len / c > 1.6) continue;
        let okPos = true;
        for (const pl of items) if (Geom.pointPolyDist(x, y, pl) < 24) { okPos = false; break; }
        for (const pl of decorPolys) if (okPos && Geom.pointPolyDist(x, y, pl) < 6) okPos = false;
        for (const q of chosen) if (okPos && Math.hypot(q.x - x, q.y - y) < 36) okPos = false;
        if (!okPos) continue;
        for (const curl of [1, -1]) {
          G.Rope.arcPoints(dev.port.x, dev.port.y, x, y, dev.len, n, curl, ax, ay);
          let ok = true;
          const arc = [];
          for (let i = 0; i < n; i++) {
            if (ax[i] < 22 || ax[i] > 338 || ay[i] < 52 || ay[i] > 600) { ok = false; break; }
            arc.push({ x: ax[i], y: ay[i] });
          }
          if (!ok) continue;
          // keep clear of strips, obstacles and other devices (ignore the first stretch near the port)
          for (let i = 6; i < n && ok; i += 2) for (const pl of items) if (Geom.pointPolyDist(ax[i], ay[i], pl) < 5) { ok = false; break; }
          if (!ok) continue;
          let cross = 0;
          for (const q of chosen) cross += Geom.polyCross(arc, q.arc);
          if (cross) continue;
          const px = sock ? dev.port.x + (sock.x - dev.port.x) * 0.3 : dev.port.x;
          const yPref = sock ? Math.min(sock.y - 70, dev.port.y + dev.len * 0.72) : y;
          // an arc that bulges toward the middle of the mat stays tidy; the edge is a last resort
          let bulgeX = 0;
          for (let i = 0; i < n; i++) bulgeX += ax[i];
          bulgeX /= n;
          const score = f * 7 - Math.abs(x - px) / 35 - Math.abs(y - yPref) / 80 - Math.abs(a) / 50 - Math.abs(bulgeX - 180) / 90;
          if (score > ps) (ps = score), (pick = { x: Math.round(x), y: Math.round(y), curl, arc });
        }
      }
    if (!pick) {
      console.error('no valid rest for', def.id, dev.id);
      pick = { x: Math.round(dev.rest.x), y: Math.round(dev.rest.y), curl: dev.curl, arc: [] };
    }
    chosen.push(pick);
    result[def.id][dev.id] = { x: pick.x, y: pick.y, curl: pick.curl, len: dev.len };
  }
}
console.log(JSON.stringify(result));
if (write) {
  const file = path.join(__dirname, '..', 'src', 'levels', 'world1.js');
  let src = fs.readFileSync(file, 'utf8');
  for (const lid in result) {
    const start = src.indexOf('id: ' + lid + ', act: 1');
    if (start < 0) continue;
    let end = src.indexOf('LV.push', start + 10);
    if (end < 0) end = src.length;
    let block = src.slice(start, end);
    for (const did in result[lid]) {
      const r = result[lid][did];
      const re = new RegExp("(\\{ id: '" + did + "',[^\\n]*?)cable: \\{ len: \\d+, curl: -?1 \\}([^\\n]*?)(?:, dir: -?\\d+, frac: [\\d.]+|, rest: \\{ x: -?\\d+, y: -?\\d+ \\})( \\},?)");
      if (re.test(block)) block = block.replace(re, '$1cable: { len: ' + r.len + ', curl: ' + r.curl + ' }$2, rest: { x: ' + r.x + ', y: ' + r.y + ' }$3');
    }
    src = src.slice(0, start) + block + src.slice(end);
  }
  fs.writeFileSync(file, src);
  console.error('rewrote rests/curls/lengths in src/levels/world1.js');
}
