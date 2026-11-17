// scratch diagnostic (not part of the gate): crossing pairs of Level 29's groove arrangement under each settle sign
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
globalThis.Snug = {};
const S = (p) => require(path.join(ROOT, 'src', p));
['util.js', 'tune.js', 'geom.js', 'rope.js', 'rules.js'].forEach(S);
S('levels/world1.js');
S('levels/world2.js');
S('levels/world3.js');
const G = globalThis.Snug;
const R = G.Rules;
const id = parseInt(process.argv[2] || '29', 10);
const def = G.Levels.find((d) => d.id === id);
const L = R.compile(def);
const sols = R.solveAll(L, { cap: 3000 });
console.log('solutions', sols.length);
const m = sols[0];
const dev = (pid) => L.devices.find((d) => d.plug.id === pid);
const sc = process.argv[3] !== undefined ? [parseFloat(process.argv[3])] : [1, -1, 0.5, -0.5, 0.25, -0.25];
for (const s of sc) {
  const arcs = {};
  for (const d of L.devices) {
    const sid = m[d.plug.id];
    const sk = L.socketsById[sid];
    const n = 48;
    const ox = new Float64Array(n), oy = new Float64Array(n);
    G.Rope.arcPoints(d.port.x, d.port.y, sk.x, sk.y, d.len, n, s, ox, oy);
    const pts = [];
    for (let i = 0; i < n; i++) pts.push({ x: ox[i], y: oy[i] });
    arcs[d.id] = pts;
  }
  const ids = Object.keys(arcs);
  const pairs = [];
  for (let a = 0; a < ids.length; a++)
    for (let b = a + 1; b < ids.length; b++) {
      const A = arcs[ids[a]], B = arcs[ids[b]];
      let hit = false;
      for (let i = 0; i + 1 < A.length && !hit; i++)
        for (let j = 0; j + 1 < B.length && !hit; j++)
          if (segX(A[i], A[i + 1], B[j], B[j + 1])) hit = true;
      if (hit) pairs.push(ids[a] + 'x' + ids[b]);
    }
  const c = R.solutionCrossings(L, m);
  console.log('settleCurl', s, 'arc-crossings', pairs.length ? pairs.join(' ') : 'none', '| solutionCrossings', c);
}
function segX(p1, p2, p3, p4) {
  const d = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x);
  if (Math.abs(d) < 1e-9) return false;
  const t = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / d;
  const u = ((p3.x - p1.x) * (p2.y - p1.y) - (p3.y - p1.y) * (p2.x - p1.x)) / d;
  return t > 0 && t < 1 && u > 0 && u < 1;
}
console.log('assignment', L.devices.map((d) => d.id + '->S' + L.socketsById[m[d.plug.id]].slot).join(' '));
