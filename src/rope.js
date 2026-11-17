/* Snug — rope.js : the cable. Position-based dynamics (Verlet) with Coulomb friction, bend stiffness with a
   curl bias, obstacle collisions, finger coupling and exact reach (follow-the-leader projection).
   Pure data + math; runs in Node and the browser. See docs/gdd/04-feel-bible.md section 2. */
(function () {
  'use strict';
  const G = (globalThis.Snug = globalThis.Snug || {});
  const T = G.T,
    Geom = G.Geom,
    U = G.U;
  const tmp = { d: 0, nx: 0, ny: 0 };

  function Rope(o) {
    this.len = o.len;
    this.n = Math.max(8, Math.min(64, Math.ceil(o.len / T.segLen) + 1));
    this.seg = o.len / (this.n - 1);
    const n = this.n;
    this.x = new Float64Array(n);
    this.y = new Float64Array(n);
    this.px = new Float64Array(n);
    this.py = new Float64Array(n);
    this.w = new Float64Array(n);
    this.curl = o.curl || 1;
    this.settleCurl = o.settleCurl === undefined ? 0 : o.settleCurl; // 0 = keep the side the cable already lies on
    this.fat = !!o.fat;
    this.mode = 0; // 0 free · 1 held by a finger · 2 pinned (seated / tweened)
    this.rootX = o.rootX;
    this.rootY = o.rootY;
    this.tx = 0;
    this.ty = 0;
    this.tau = 0.055;
    this.vmax = 2600;
    this.pinX = 0;
    this.pinY = 0;
    this.exitX = 0;
    this.exitY = -1;
    this.strain = 0;
    this.speed = 0;
    this.plugAngle = 0;
    this.nudgeI = -1;
    this.nudgeX = 0;
    this.nudgeY = 0;
    this.slack = 0;
    this.relaxOn = false;
    this.relaxHold = 0;
    this.fricK = o.fricK || 1; // surface friction scale (steel is slick, felt is grippy)
    this.dampK = o.dampK || 1; // viscous damping scale: a zero-g station lets a flicked cable drift on (Act 4)
    this.gravK = o.gravK || 0; // a downward pull (px/s^2) on every free node: the wall, where gravity is back (Act 4, Level 36); 0 everywhere else
    this.wind = o.wind || null; // a band of air {x0,x1,y0,y1,ax,ay}: a node inside it is pushed by (ax,ay) px/s^2 (Act 5, the fan; null everywhere else)
    this.noRelax = !!o.noRelax; // cables that must keep their route (through hoops) never relax toward a circular arc
    this.hitMax = 0; // biggest obstacle push since last read (the Room turns it into a tock)
    this.vib = null; // a plucked cable's standing wave (visual only): { t, s0, amp }
    this.idealDirty = true;
    this.idealOK = false;
    this.ix = new Float64Array(this.n);
    this.iy = new Float64Array(this.n);
    this.iw = new Float64Array(this.n);
    this.build(o.rootX, o.rootY, o.plugX, o.plugY);
  }
  G.Rope = Rope;

  /* a circular arc of exact length `len` from (rx,ry) to (px,py), bulging to the `curl` side; writes n points */
  function arcPoints(rx, ry, px, py, len, n, curl, outX, outY) {
    let cx = px - rx,
      cy = py - ry;
    let c = Math.hypot(cx, cy);
    if (c > len * 0.985) {
      const k = (len * 0.985) / c;
      cx *= k;
      cy *= k;
      c = len * 0.985;
    }
    if (c < 1) {
      cx = 0;
      cy = 1;
      c = 1;
    }
    const ux = cx / c,
      uy = cy / c;
    const nx = -uy * curl,
      ny = ux * curl; // bulge normal
    const ratio = len / c;
    let theta = 0;
    if (ratio > 1.00001) {
      // solve theta/sin(theta) = ratio on (0, pi)
      let lo = 1e-4,
        hi = Math.PI - 1e-3;
      for (let i = 0; i < 50; i++) {
        const mid = (lo + hi) / 2;
        if (mid / Math.sin(mid) < ratio) lo = mid;
        else hi = mid;
      }
      theta = (lo + hi) / 2;
    }
    const mx = rx + cx / 2,
      my = ry + cy / 2;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      let X, Y;
      if (theta < 1e-3) {
        X = rx + cx * t;
        Y = ry + cy * t;
      } else {
        const r = len / (2 * theta);
        const phi = -theta + 2 * theta * t;
        const along = r * Math.sin(phi);
        const bulge = r * Math.cos(phi) - r * Math.cos(theta);
        X = mx + ux * along + nx * bulge;
        Y = my + uy * along + ny * bulge;
      }
      outX[i] = X;
      outY[i] = Y;
    }
  }
  Rope.arcPoints = arcPoints;

  /* a long cable parked near its device does not form a giant loop: it lies in loose S-folds, like a real cord on a bench.
     len/chord <= FOLD_AT is the usual circular arc; beyond that, a sine meander whose amplitude is solved so that the
     path is exactly `len` long (resampled to equal segments), tapering to the chord at both ends. */
  const FOLD_AT = 2.1;
  function restPoints(rx, ry, px, py, len, n, curl, outX, outY) {
    const cx = px - rx,
      cy = py - ry;
    const c = Math.max(1, Math.hypot(cx, cy));
    if (len / c <= FOLD_AT) return arcPoints(rx, ry, px, py, len, n, curl, outX, outY);
    const ux = cx / c,
      uy = cy / c;
    const nx = -uy * curl,
      ny = ux * curl;
    const waves = Math.max(1.5, Math.round(len / c * 0.55 * 2) / 2); // fewer, broader folds: a loose cord, not a phone spring
    const K = 240;
    const xs = new Float64Array(K + 1),
      ys = new Float64Array(K + 1);
    const build = (A) => {
      let L = 0;
      for (let i = 0; i <= K; i++) {
        const t = i / K;
        xs[i] = c * t;
        ys[i] = A * Math.sin(Math.PI * t) * Math.sin(2 * Math.PI * waves * t);
        if (i) L += Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1]);
      }
      return L;
    };
    let lo = 0,
      hi = len;
    for (let it = 0; it < 48; it++) {
      const mid = (lo + hi) / 2;
      if (build(mid) < len) lo = mid;
      else hi = mid;
    }
    build((lo + hi) / 2);
    // resample at equal arc length
    const cum = new Float64Array(K + 1);
    for (let i = 1; i <= K; i++) cum[i] = cum[i - 1] + Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1]);
    const tot = cum[K];
    let j = 1;
    for (let i = 0; i < n; i++) {
      const d = (i / (n - 1)) * tot;
      while (j < K && cum[j] < d) j++;
      const f = (d - cum[j - 1]) / Math.max(1e-9, cum[j] - cum[j - 1]);
      const X = xs[j - 1] + (xs[j] - xs[j - 1]) * f,
        Y = ys[j - 1] + (ys[j] - ys[j - 1]) * f;
      outX[i] = rx + ux * X + nx * Y;
      outY[i] = ry + uy * X + ny * Y;
    }
  }
  Rope.restPoints = restPoints;
  Rope.FOLD_AT = FOLD_AT;
  Rope.prototype.build = function (rx, ry, px, py) {
    restPoints(rx, ry, px, py, this.len, this.n, this.curl, this.x, this.y);
    for (let i = 0; i < this.n; i++) {
      this.px[i] = this.x[i];
      this.py[i] = this.y[i];
    }
    this.rootX = rx;
    this.rootY = ry;
    this.mode = 0;
    this.nudgeI = -1;
    this.relaxOn = false;
  };

  Rope.prototype.setRoot = function (x, y) {
    this.rootX = x;
    this.rootY = y;
  };
  Rope.prototype.plugX = function () {
    return this.x[this.n - 1];
  };
  Rope.prototype.plugY = function () {
    return this.y[this.n - 1];
  };

  Rope.prototype.hold = function (tx, ty, tau, vmax) {
    this.mode = 1;
    this.tx = tx;
    this.ty = ty;
    this.tau = tau;
    this.vmax = vmax;
  };
  Rope.prototype.pin = function (x, y, ex, ey, relax) {
    this.mode = 2;
    const moved = Math.abs(this.pinX - x) + Math.abs(this.pinY - y) > 0.5;
    this.pinX = x;
    this.pinY = y;
    this.exitX = ex;
    this.exitY = ey;
    if (relax) {
      if (!this.relaxOn) this.relaxHold = 0.28; // let the thunk's wobble play first
      this.relaxOn = true;
      if (moved || !this.ix) this.idealDirty = true;
    } else {
      this.relaxOn = false;
      this.idealDirty = true; // the plug is moving: whatever arc was cached belongs to an old socket
    }
  };
  Rope.prototype.release = function () {
    this.mode = 0;
  };
  Rope.prototype.nudge = function (i, tx, ty) {
    this.nudgeI = i;
    this.nudgeX = tx;
    this.nudgeY = ty;
  };
  Rope.prototype.endNudge = function () {
    this.nudgeI = -1;
  };

  // nearest interior point to (x,y); returns {i, d}
  Rope.prototype.nearest = function (x, y, skipEnds) {
    let bi = -1,
      bd = 1e9;
    const a = skipEnds ? 2 : 1,
      b = this.n - (skipEnds ? 3 : 1);
    for (let i = a; i <= b; i++) {
      const d = Math.hypot(this.x[i] - x, this.y[i] - y);
      if (d < bd) (bd = d), (bi = i);
    }
    return { i: bi, d: bd };
  };

  Rope.prototype.step = function (dt, obstacles) {
    const n = this.n,
      last = n - 1,
      x = this.x,
      y = this.y,
      px = this.px,
      py = this.py,
      w = this.w,
      seg = this.seg;
    const pinned = this.mode === 2;
    const fric = T.friction * this.fricK * dt * dt;
    const vd = Math.max(0, 1 - T.damp * this.dampK * dt);
    const stick = T.stiction;

    // ---- root ----
    x[0] = this.rootX;
    y[0] = this.rootY;
    px[0] = x[0];
    py[0] = y[0];

    // ---- integrate (Verlet + Coulomb/viscous friction + stiction) ----
    const lastFree = pinned ? last - 2 : last;
    for (let i = 1; i <= lastFree; i++) {
      let vx = x[i] - px[i],
        vy = y[i] - py[i];
      const sp = Math.sqrt(vx * vx + vy * vy);
      if (sp > 0) {
        let s2 = sp - fric;
        if (s2 < 0) s2 = 0;
        s2 *= vd;
        if (s2 < stick) s2 = 0;
        const k = s2 / sp;
        vx *= k;
        vy *= k;
      }
      px[i] = x[i];
      py[i] = y[i];
      x[i] += vx;
      y[i] += vy + this.gravK * dt * dt;
      const W = this.wind;
      if (W && x[i] > W.x0 && x[i] < W.x1 && y[i] > W.y0 && y[i] < W.y1) {
        x[i] += W.ax * dt * dt;
        y[i] += W.ay * dt * dt;
      }
    }

    // ---- plug handling ----
    if (pinned) {
      // plug and its exit segment are kinematic
      px[last] = x[last];
      py[last] = y[last];
      x[last] = this.pinX;
      y[last] = this.pinY;
      px[last] = x[last];
      py[last] = y[last];
      x[last - 1] = this.pinX + this.exitX * seg;
      y[last - 1] = this.pinY + this.exitY * seg;
      px[last - 1] = x[last - 1];
      py[last - 1] = y[last - 1];
      this.strain = 0;
    } else if (this.mode === 1) {
      const alpha = 1 - Math.exp(-dt / this.tau);
      let dx = (this.tx - x[last]) * alpha,
        dy = (this.ty - y[last]) * alpha;
      const m = Math.sqrt(dx * dx + dy * dy),
        maxStep = this.vmax * dt;
      if (m > maxStep) {
        dx *= maxStep / m;
        dy *= maxStep / m;
      }
      x[last] += dx;
      y[last] += dy;
    }

    // ---- nudged mid-cable point is pinned to the finger (clamped by reach) ----
    let ni = this.nudgeI;
    if (ni > 0 && ni < last) {
      let tx = this.nudgeX,
        ty = this.nudgeY;
      let dx = tx - this.rootX,
        dy = ty - this.rootY;
      let d = Math.hypot(dx, dy);
      const maxR = seg * ni * 0.985;
      if (d > maxR) {
        tx = this.rootX + (dx / d) * maxR;
        ty = this.rootY + (dy / d) * maxR;
      }
      if (pinned) {
        dx = tx - this.pinX;
        dy = ty - this.pinY;
        d = Math.hypot(dx, dy);
        const maxP = seg * (last - ni) * 0.985;
        if (d > maxP) {
          tx = this.pinX + (dx / d) * maxP;
          ty = this.pinY + (dy / d) * maxP;
        }
      }
      const a = 0.45;
      px[ni] = x[ni];
      py[ni] = y[ni];
      x[ni] += (tx - x[ni]) * a;
      y[ni] += (ty - y[ni]) * a;
    } else ni = -1;

    // ---- bend stiffness + curl bias (Laplacian smoothing toward a slightly curved chord) ----
    // smoothing is gentle on slack cable and stronger under tension, so loops and coils unwind instead of jamming
    // never at rest (a cable on a desk must not move on its own); a little while carried; more when taut
    const bk = this.mode === 1 ? T.bendK * 0.35 + 0.22 * this.strain : pinned ? T.bendK * 0.1 : 0,
      cb = T.curlBias * this.curl;
    if (bk > 0) {
      for (let i = 1; i < last; i++) {
        if (pinned && i >= last - 1) continue;
        if (i === ni) continue;
        const ax = x[i - 1],
          ay = y[i - 1],
          bx = x[i + 1],
          by = y[i + 1];
        const cx = bx - ax,
          cy = by - ay;
        const cl = Math.sqrt(cx * cx + cy * cy) || 1;
        const mx = (ax + bx) * 0.5 + (-cy / cl) * cb,
          my = (ay + by) * 0.5 + (cx / cl) * cb;
        x[i] += (mx - x[i]) * bk;
        y[i] += (my - y[i]) * bk;
      }
    }

    // ---- seated cables settle into a neat arc (nested arcs make Tidy attainable and look deliberate) ----
    if (pinned && this.relaxOn && !this.noRelax) {
      if (this.idealDirty) {
        this.idealDirty = false;
        let sc = this.settleCurl;
        if (!sc) {
          // keep the side the cable already bulges to (signed area between chord and chain)
          let area = 0;
          const cx = this.pinX - this.rootX,
            cy = this.pinY - this.rootY;
          for (let i = 1; i < n - 1; i++) area += cx * (y[i] - this.rootY) - cy * (x[i] - this.rootX);
          sc = area > 0 ? -1 : 1;
        }
        arcPoints(this.rootX, this.rootY, this.pinX, this.pinY, this.len, n, sc, this.ix, this.iy);
        let ok = true;
        for (let i = 1; i < n && ok; i++) {
          const t = i / (n - 1);
          this.iw[i] = U.smoothstep(0.02, 0.2, t) * U.smoothstep(1.0, 0.78, t);
          for (let o = 0; o < (obstacles ? obstacles.length : 0); o++) {
            const ob = obstacles[o];
            if (ob.tall === false) continue;
            Geom.sdf(ob, this.ix[i], this.iy[i], tmp);
            if (tmp.d < T.cableR + 3) {
              ok = false;
              break;
            }
          }
        }
        this.idealOK = ok;
      }
      if (this.relaxHold > 0) this.relaxHold -= dt;
      else if (this.idealOK && ni < 0 && T.relaxK > 0) {
        const kk = T.relaxK;
        for (let i = 2; i < last - 1; i++) {
          const wgt = this.iw[i] * kk;
          x[i] += (this.ix[i] - x[i]) * wgt;
          y[i] += (this.iy[i] - y[i]) * wgt;
        }
      }
    }
    if (ni > 0) this.relaxHold = 0.5;

    // ---- weights ----
    const wP = this.fat ? T.wFat : T.wSlim;
    for (let i = 0; i < n; i++) w[i] = 1;
    w[0] = 0;
    if (pinned) {
      w[last] = 0;
      w[last - 1] = 0;
    } else w[last] = wP;
    if (ni > 0) w[ni] = 0;

    // ---- constraints ----
    const iters = T.iters | 0;
    const nObs = obstacles ? obstacles.length : 0;
    const rC = T.cableR + 0.6;
    for (let it = 0; it < iters; it++) {
      const fwd = (it & 1) === 0;
      for (let k = 0; k < last; k++) {
        const i = fwd ? k : last - 1 - k;
        const wi = w[i],
          wj = w[i + 1];
        const ws = wi + wj;
        if (ws === 0) continue;
        const dx = x[i + 1] - x[i],
          dy = y[i + 1] - y[i];
        const d = Math.sqrt(dx * dx + dy * dy) || 1e-6;
        const c = (d - seg) / d / ws;
        x[i] += dx * c * wi;
        y[i] += dy * c * wi;
        x[i + 1] -= dx * c * wj;
        y[i + 1] -= dy * c * wj;
      }
      if (nObs && (it & 1) === 0) this.collide(obstacles, rC);
    }

    // ---- exact reach: follow-the-leader from the pinned root when the chain stretched ----
    if (!pinned) {
      let total = 0;
      for (let i = 0; i < last; i++) {
        const dx = x[i + 1] - x[i],
          dy = y[i + 1] - y[i];
        total += Math.sqrt(dx * dx + dy * dy);
      }
      if (total > this.len * (1 + T.stretchTol)) {
        for (let i = 1; i <= last; i++) {
          if (i === ni) continue;
          let dx = x[i] - x[i - 1],
            dy = y[i] - y[i - 1];
          const d = Math.sqrt(dx * dx + dy * dy) || 1e-6;
          x[i] = x[i - 1] + (dx / d) * seg;
          y[i] = y[i - 1] + (dy / d) * seg;
        }
      }
    }
    if (nObs) this.collide(obstacles, rC);

    // ---- keep everything on stage ----
    for (let i = 1; i <= last; i++) {
      if (x[i] < -30) x[i] = -30;
      else if (x[i] > 390) x[i] = 390;
      if (y[i] < -30) y[i] = -30;
      else if (y[i] > 670) y[i] = 670;
    }

    // ---- read-outs ----
    const lx = x[last],
      ly = y[last];
    if (this.mode === 1) {
      const sx = this.tx - lx,
        sy = this.ty - ly;
      const raw = (Math.sqrt(sx * sx + sy * sy) - 6) / 30;
      const s = raw < 0 ? 0 : raw > 1 ? 1 : raw;
      this.strain += (s - this.strain) * (1 - Math.exp(-dt / 0.04));
    } else this.strain += (0 - this.strain) * (1 - Math.exp(-dt / 0.08));
    const vx = lx - px[last],
      vy = ly - py[last];
    this.speed = Math.sqrt(vx * vx + vy * vy) / dt;
    // plug nose angle: from the cable toward the plug
    const k0 = last - 2;
    const ang = Math.atan2(y[last] - y[k0], x[last] - x[k0]);
    if (!pinned) this.plugAngle = U.lerpAng(this.plugAngle, ang, 1 - Math.exp(-dt / 0.05));
    // slack measure for visuals: chord/len
    const chord = Math.hypot(lx - this.rootX, ly - this.rootY);
    this.slack = 1 - chord / this.len;
  };

  Rope.prototype.collide = function (obstacles, rC) {
    const n = this.n,
      last = n - 1,
      x = this.x,
      y = this.y;
    const pinned = this.mode === 2;
    for (let i = 1; i <= last; i++) {
      if (pinned && i >= last - 1) continue;
      if (i === this.nudgeI) continue;
      const rr = i === last ? 11 : rC;
      for (let o = 0; o < obstacles.length; o++) {
        const ob = obstacles[o];
        if (ob.tall === false) continue;
        // quick reject
        const rad = ob.shape === 'circle' ? ob.r : Math.max(ob.w, ob.h) / 2 + 6;
        const ddx = x[i] - ob.x,
          ddy = y[i] - ob.y;
        if (ddx * ddx + ddy * ddy > (rad + rr + 12) * (rad + rr + 12)) continue;
        Geom.sdf(ob, x[i], y[i], tmp);
        if (tmp.d < rr) {
          const push = rr - tmp.d;
          if (push > this.hitMax) {
            this.hitMax = push;
            this.hitX = x[i];
            this.hitY = y[i];
          }
          x[i] += tmp.nx * push;
          y[i] += tmp.ny * push;
        }
      }
    }
  };

  /* a plucked cable vibrates: two standing-wave modes (amplitude by where it was plucked), purely visual, decays in ~1.4 s */
  Rope.prototype.pluck = function (s0, amp) {
    const prev = this.vib && this.vib.t < 0.6 ? this.vib.amp * 0.5 : 0;
    this.vib = { t: 0, s0: U.clamp(s0, 0.04, 0.96), amp: Math.min(7, amp + prev) };
  };
  Rope.prototype.advanceVib = function (dt) {
    if (!this.vib) return;
    this.vib.t += dt;
    if (this.vib.t > 1.5) this.vib = null;
  };
  // displacement (u, perpendicular to the cable) at arc fraction s
  Rope.prototype.vibDisp = function (s) {
    const v = this.vib;
    if (!v) return 0;
    const w = 2 * Math.PI * 8.5,
      dec = Math.exp(-v.t / 0.42);
    const a1 = Math.sin(Math.PI * v.s0),
      a2 = Math.sin(2 * Math.PI * v.s0);
    return v.amp * dec * (a1 * Math.sin(Math.PI * s) * Math.cos(w * v.t) + 0.55 * a2 * Math.sin(2 * Math.PI * s) * Math.cos(2.02 * w * v.t));
  };

  // run N relaxation steps with the plug resting (used at level load; deterministic)
  Rope.prototype.settle = function (steps, obstacles) {
    const dt = 1 / 120;
    for (let i = 0; i < steps; i++) this.step(dt, obstacles);
    for (let i = 0; i < this.n; i++) {
      this.px[i] = this.x[i];
      this.py[i] = this.y[i];
    }
  };

  // total polyline length (diagnostic)
  Rope.prototype.polyLength = function () {
    let t = 0;
    for (let i = 0; i < this.n - 1; i++) t += Math.hypot(this.x[i + 1] - this.x[i], this.y[i + 1] - this.y[i]);
    return t;
  };
})();
