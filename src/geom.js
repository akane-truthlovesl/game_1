/* Snug — geom.js : obstacle SDFs, segment tests, geodesic (shortest-around-obstacles) paths.
   Pure functions; runs in Node and the browser. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const Geom = (G.Geom = {});

  /* ---------- obstacles ----------
     { shape:'circle', x,y,r }  |  { shape:'rrect', x,y,w,h,rot,cr }  (centered)  */
  Geom.sdf = function (ob, x, y, out) {
    if (ob.shape === 'circle') {
      const dx = x - ob.x,
        dy = y - ob.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      out.d = d - ob.r;
      if (d > 1e-6) {
        out.nx = dx / d;
        out.ny = dy / d;
      } else {
        out.nx = 0;
        out.ny = -1;
      }
      return out;
    }
    const rot = ob.rot || 0;
    const c = Math.cos(rot),
      s = Math.sin(rot);
    const px = x - ob.x,
      py = y - ob.y;
    const lx = px * c + py * s;
    const ly = -px * s + py * c;
    const cr = ob.cr === undefined ? 8 : ob.cr;
    const hw = ob.w / 2 - cr,
      hh = ob.h / 2 - cr;
    const qx = Math.abs(lx) - hw,
      qy = Math.abs(ly) - hh;
    const ox = qx > 0 ? qx : 0,
      oy = qy > 0 ? qy : 0;
    const outside = Math.sqrt(ox * ox + oy * oy);
    const inside = Math.min(Math.max(qx, qy), 0);
    out.d = outside + inside - cr;
    let nlx, nly;
    if (outside > 1e-6) {
      nlx = (ox / outside) * (lx < 0 ? -1 : 1);
      nly = (oy / outside) * (ly < 0 ? -1 : 1);
    } else if (qx > qy) {
      nlx = lx < 0 ? -1 : 1;
      nly = 0;
    } else {
      nlx = 0;
      nly = ly < 0 ? -1 : 1;
    }
    out.nx = nlx * c - nly * s;
    out.ny = nlx * s + nly * c;
    return out;
  };

  // convex polygon (CCW-agnostic) approximating an obstacle inflated by `clr`
  Geom.inflatedPolygon = function (ob, clr) {
    const pts = [];
    if (ob.shape === 'circle') {
      const N = 24;
      const R = (ob.r + clr) / Math.cos(Math.PI / N);
      for (let i = 0; i < N; i++) {
        const a = ((i + 0.5) / N) * Math.PI * 2;
        pts.push({ x: ob.x + Math.cos(a) * R, y: ob.y + Math.sin(a) * R });
      }
      return pts;
    }
    const rot = ob.rot || 0,
      c = Math.cos(rot),
      s = Math.sin(rot);
    const cr = (ob.cr === undefined ? 8 : ob.cr) + clr;
    const hw = ob.w / 2 + clr - cr,
      hh = ob.h / 2 + clr - cr;
    const corners = [
      [hw, hh, 0],
      [-hw, hh, 0.5],
      [-hw, -hh, 1],
      [hw, -hh, 1.5],
    ];
    const per = 4;
    const R = cr / Math.cos(Math.PI / (4 * per * 1));
    for (const cc of corners) {
      for (let k = 0; k <= per; k++) {
        const a = (cc[2] + k / per / 2) * Math.PI;
        const lx = cc[0] + Math.cos(a) * R,
          ly = cc[1] + Math.sin(a) * R;
        pts.push({ x: ob.x + lx * c - ly * s, y: ob.y + lx * s + ly * c });
      }
    }
    return pts;
  };

  // does open segment a→b pass through the interior of convex polygon poly? (Cyrus–Beck clip)
  function segBlocked(ax, ay, bx, by, poly) {
    const n = poly.length;
    // orientation sign
    let area = 0;
    for (let i = 0; i < n; i++) {
      const p = poly[i],
        q = poly[(i + 1) % n];
      area += p.x * q.y - q.x * p.y;
    }
    const sgn = area >= 0 ? 1 : -1;
    let t0 = 0,
      t1 = 1;
    const dx = bx - ax,
      dy = by - ay;
    for (let i = 0; i < n; i++) {
      const p = poly[i],
        q = poly[(i + 1) % n];
      // inward normal (for CCW polygon (y down) we use sgn)
      const ex = q.x - p.x,
        ey = q.y - p.y;
      const nx = -ey * sgn,
        ny = ex * sgn; // inward
      const num = (ax - p.x) * nx + (ay - p.y) * ny; // distance-ish of a from the edge (positive = inside)
      const den = dx * nx + dy * ny;
      const eps = 1e-6;
      if (Math.abs(den) < eps) {
        if (num < 0.02) return false; // parallel and outside / on boundary
      } else {
        const t = -num / den;
        if (den > 0) {
          if (t > t0) t0 = t;
        } else if (t < t1) t1 = t;
        if (t0 >= t1 - 1e-4) return false;
      }
    }
    // shrink by tiny epsilon so boundary-grazing segments are allowed
    return t1 - t0 > 1e-3 && segLenInside(dx, dy, t0, t1) > 0.05;
  }
  function segLenInside(dx, dy, t0, t1) {
    return Math.sqrt(dx * dx + dy * dy) * (t1 - t0);
  }

  // shortest path from a to b around tall obstacles (visibility graph + Dijkstra)
  Geom.shortest = function (a, b, obstacles, clr) {
    const tall = obstacles.filter((o) => o.tall !== false);
    if (!tall.length) return { len: Math.hypot(b.x - a.x, b.y - a.y), pts: [a, b] };
    const polys = tall.map((o) => Geom.inflatedPolygon(o, clr));
    const blocked = (p, q) => {
      for (let i = 0; i < polys.length; i++) if (segBlocked(p.x, p.y, q.x, q.y, polys[i])) return true;
      return false;
    };
    if (!blocked(a, b)) return { len: Math.hypot(b.x - a.x, b.y - a.y), pts: [a, b] };
    const nodes = [a, b];
    for (const poly of polys) for (const v of poly) nodes.push(v);
    const N = nodes.length;
    const dist = new Array(N).fill(Infinity),
      prev = new Array(N).fill(-1),
      done = new Array(N).fill(false);
    dist[0] = 0;
    for (let it = 0; it < N; it++) {
      let u = -1,
        best = Infinity;
      for (let i = 0; i < N; i++) if (!done[i] && dist[i] < best) (best = dist[i]), (u = i);
      if (u < 0 || u === 1) break;
      done[u] = true;
      for (let v = 0; v < N; v++) {
        if (done[v]) continue;
        const d = Math.hypot(nodes[v].x - nodes[u].x, nodes[v].y - nodes[u].y);
        if (dist[u] + d >= dist[v]) continue;
        if (blocked(nodes[u], nodes[v])) continue;
        dist[v] = dist[u] + d;
        prev[v] = u;
      }
    }
    if (!isFinite(dist[1])) return { len: Infinity, pts: [a, b] };
    const pts = [];
    for (let v = 1; v >= 0; v = prev[v]) {
      pts.push(nodes[v]);
      if (v === 0) break;
    }
    pts.reverse();
    return { len: dist[1], pts };
  };

  /* ---------- segments / polylines ---------- */
  Geom.segInter = function (ax, ay, bx, by, cx, cy, dx, dy, out) {
    const rx = bx - ax,
      ry = by - ay,
      sx = dx - cx,
      sy = dy - cy;
    const den = rx * sy - ry * sx;
    if (Math.abs(den) < 1e-9) return false;
    const t = ((cx - ax) * sy - (cy - ay) * sx) / den;
    const u = ((cx - ax) * ry - (cy - ay) * rx) / den;
    if (t <= 0 || t >= 1 || u <= 0 || u >= 1) return false;
    if (out) {
      out.x = ax + rx * t;
      out.y = ay + ry * t;
    }
    return true;
  };

  // count proper crossings between two polylines (arrays of {x,y})
  Geom.polyCross = function (A, B, hits) {
    let c = 0;
    const o = { x: 0, y: 0 };
    for (let i = 0; i < A.length - 1; i++) {
      for (let j = 0; j < B.length - 1; j++) {
        if (Geom.segInter(A[i].x, A[i].y, A[i + 1].x, A[i + 1].y, B[j].x, B[j].y, B[j + 1].x, B[j + 1].y, o)) {
          c++;
          if (hits) hits.push({ x: o.x, y: o.y });
        }
      }
    }
    return c;
  };

  /* ---------- simple convex shapes for layout checks ---------- */
  Geom.rectPoly = function (x, y, w, h, rot) {
    const c = Math.cos(rot || 0),
      s = Math.sin(rot || 0);
    const hw = w / 2,
      hh = h / 2;
    return [
      [-hw, -hh],
      [hw, -hh],
      [hw, hh],
      [-hw, hh],
    ].map((p) => ({ x: x + p[0] * c - p[1] * s, y: y + p[0] * s + p[1] * c }));
  };
  function project(poly, ax, ay) {
    let mn = Infinity,
      mx = -Infinity;
    for (const p of poly) {
      const d = p.x * ax + p.y * ay;
      if (d < mn) mn = d;
      if (d > mx) mx = d;
    }
    return [mn, mx];
  }
  // polygon vs polygon SAT with margin
  Geom.polyOverlap = function (A, B, margin) {
    margin = margin || 0;
    for (const P of [A, B]) {
      for (let i = 0; i < P.length; i++) {
        const p = P[i],
          q = P[(i + 1) % P.length];
        let ax = -(q.y - p.y),
          ay = q.x - p.x;
        const l = Math.hypot(ax, ay) || 1;
        ax /= l;
        ay /= l;
        const a = project(A, ax, ay),
          b = project(B, ax, ay);
        if (a[1] + margin < b[0] || b[1] + margin < a[0]) return false;
      }
    }
    return true;
  };
  // distance from point to polygon (0 if inside)
  Geom.pointPolyDist = function (px, py, poly) {
    let inside = false,
      best = Infinity;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[i],
        b = poly[j];
      if (a.y > py !== b.y > py && px < ((b.x - a.x) * (py - a.y)) / (b.y - a.y) + a.x) inside = !inside;
      const dx = b.x - a.x,
        dy = b.y - a.y;
      const t = Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / (dx * dx + dy * dy || 1)));
      const d = Math.hypot(px - (a.x + dx * t), py - (a.y + dy * t));
      if (d < best) best = d;
    }
    return inside ? 0 : best;
  };
})();
