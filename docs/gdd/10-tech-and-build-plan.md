# 10 · Tech & Build Plan

How the game is built, so that **feel stays first** and the code never gets in the way of taste. The architecture is deliberately boring: plain files, one shared rules module, a deterministic physics core, and tools that test by *playing*.

---

## 1 · Principles

1. **Feel first.** The first thing built is the *toy*: one plug, one socket, one phone, a tuning panel. No levels until the toy is delightful.
2. **No build step.** Classic `<script>` files with a tiny namespace; runs from `file://` and any static server. (ES modules do not load over `file://`.)
3. **One rules module** shared by game, solver, hints, validator and bot. Rendering and physics report geometry to rules; rules decide legality.
4. **Deterministic core.** Fixed timestep, authored randomness, timestamped input. Same level + same input = same result.
5. **Data over code.** Levels, cast, skins, tuning are tables.
6. **Test by playing.** A headless browser plays every level with real drags; the solver certifies it first.
7. **Degrade gracefully.** A ladder that steps visuals down before frames drop.
8. **Don't gold-plate.** Architecture exists to serve taste; if a clean abstraction costs a delightful detail, the detail wins.

## 2 · File layout

```
index.html                 shell: canvas + HUD DOM + overlays; loads scripts in order
style.css                  HUD, menus, tuning panel, safe-area handling
manifest.webmanifest       home-screen install metadata (no service worker in Phase 1)

src/
  util.js                  math, easing, springs, seeded rng, color helpers, tiny event bus
  tune.js                  TUNE table (every feel constant) + tuning panel + persistence
  geom.js                  SDF obstacles, segment intersection, geodesic path (visibility graph)
  rules.js                 compatibility, reach, footprints, power, crossing, stars, solver  [browser + Node]
  rope.js                  Verlet cable (PBD): integrate, constrain, collide, strain          [browser + Node]
  audio.js                 Web Audio engine: bus graph, reverb IR, synth recipes, pad/chord, ambience
  haptics.js               vibrate patterns + iOS switch fallback + toggles
  fx.js                    particles, rings, shake spring, hit-stop clock, captions
  art.js                   all drawing: surface, shadows, strips, sockets, plugs, devices, decor, light map
  levels/world1.js         Act 1 level data (levels 1–10)
  room.js                  one level instance: plug state machine, magnet, seating, pulses, wakes, Power Cut, win, hints
  game.js                  view fitting, input + hit-testing, level lifecycle, swap transition, lighting, title, toy
  finale.js                the Level 10 stinger: Rex under a cloth, the cat
  ui.js                    title menu, HUD, level pill, settings, level select, stars, transitions
  save.js                  versioned localStorage (progress, stars, settings, tuning)
  main.js                  boot, resize/DPR, main loop (fixed-step sim + render), debug hooks

tools/
  validate-levels.js       Node: runs rules.js over every level; solvable, margins, luck score, ASCII maps
  (later) level-search.js  Node: random layout search ranked by p_luck (the "solver as muse")

docs/                      this GDD and the passes
```

*Script load order matters:* `util → tune → geom → rules → rope → audio → haptics → fx → art → levels → save → game → ui → main`.

## 3 · Runtime model

### 3.1 Main loop
`requestAnimationFrame` drives render. The simulation uses an accumulator with a fixed step of **1/120 s** (≤ 8 steps per frame; leftover carried). **Hit-stop** scales the sim clock to 0 for 35–50 ms; particles, audio and the camera spring continue. **Slow-mo** (debug) scales the sim clock; the audio engine is *not* slowed.

### 3.2 Coordinates
Design space 360 × 640 u; one `View` object holds `scale, ox, oy, dpr` and converts pointer pixels to u. All physics is in u.

### 3.3 Rendering layers (back to front)
1. **Surface** (cached): wood, mat, vignette, key-light gradient.
2. **Decor under** and contact shadows (cached sprites).
3. **Strips and sockets**, **devices** (screens, faces).
4. **Cables** (per-cable passes).
5. **Plugs** (resting/seated), then the **held plug** on top.
6. **Particles** and rings.
7. **Light map** composite (half-res).
8. **Overlays**: hint hand, tuning overlays.
HUD is DOM, not canvas.

### 3.4 Input
Pointer Events with capture, `touch-action: none`. A tiny gesture layer maps pointers to *intents*: `grabPlug(p, id)`, `drag(p, x, y)`, `release(p)`, `tap(x, y)`, `nudge(cableId, point)`. Intent handlers live in `game.js`; they never touch rendering.

### 3.5 Physics API (`rope.js`)
```
Rope.create({ root, len, restPlug, curl, skin })      // builds points on a relaxed arc
rope.setRoot(x, y)                                    // device port (fixed) 
rope.holdPlug(targetX, targetY, tau, vmax)            // finger coupling
rope.pinPlug(x, y, angle)                             // seated
rope.freePlug()                                       // resting
rope.step(dt, obstacles)                              // PBD solve
rope.strain, rope.length, rope.points, rope.plug      // read-outs
```
Pure functions on typed arrays; no DOM; runs in Node for validation and tests.

### 3.6 Audio API (`audio.js`)
```
Audio.unlock()                          // on first gesture
Audio.sfx.tick(), .magnet(), .thunk(weight), .pop(), .twang(), .knock(), .zap(), .click()
Audio.sfx.chime(n), .star(i), .whoosh(), .thud(size)
Audio.rustle.set(speed)                 // continuous
Audio.pad.add(note) / .remove(id)       // room chord
Audio.ambient.setAwake(0..1)            // filter + clock
Audio.win()                             // cascade + bloom
Audio.settings({ sfx:true, music:true })
```

### 3.7 State and saves
`save.js` stores `{ v:1, level, stars:{id:[lit,tidy,clean]}, secrets:{id:true}, settings:{sound,music,haptics,reduceMotion,patterns,leftHand}, tune }`. Every plug state change in the current level is also stored in `snug.run.v1` so the app resumes mid-level. Versioned; unknown versions are migrated or reset safely.

## 4 · Tools and automated testing

### 4.1 `tools/validate-levels.js` (Node, no dependencies)
Loads `rules.js` + `levels/*.js`, prints an ASCII map and a metrics row per level (solutions, par, min reach margin, `p_luck`, tidy feasibility, layout checks). Non-zero exit on any hard failure. Run before every commit-worthy change to level data.

### 4.2 Headless playtest (Playwright driving the system Chrome)
Kept *outside* the shipped files (a scratch harness) so the project stays dependency-free, but the scripts are documented here:
- **Smoke:** load at 390 × 844 @2x with touch; no console errors/warnings; frame loop alive.
- **Bot:** for each level, ask the solver for a solution, then perform each move as **real pointer drags** (down, interpolated moves, up) at human speeds; confirm the level completes; record frame times.
- **Screenshots:** every level at 3 viewports (390×844, 360×740, 412×915) and a desktop (1280×800) for visual review.
- **Feel probes:** measure release→contact time, follow lag, cable length ratio, rest stability (the acceptance tests in chapter 04) via exposed debug hooks (`window.__snug`).
- **Audio probes:** render each SFX in an `OfflineAudioContext` and check peak, RMS, DC, duration and spectral centroid; dump WAVs for human ears.

### 4.3 In-game debug
`?tune=1` panel · `?level=7` · `?toy=1` (Click Test scene) · `?slow=0.25` · `?solve=1` (auto-solve on a button) · `?debug=1` overlays. `window.__snug` exposes the game for tests.

## 5 · Performance plan

| Item | Plan |
| --- | --- |
| Target | 60 fps on a mid-range phone; JS ≤ 12 ms/frame |
| DPR | Cap 2 (degrade to 1.5/1.25) |
| Static layers | Surface and rectangle shadows are cached bitmaps |
| Cables | ≤ 10 per room; ≤ 60 points; two shadow strokes max |
| Particles | Cap 220, pooled typed arrays |
| Light map | Half-res; third-res on degrade |
| GC | No per-frame object allocation in hot paths (pooled vectors, typed arrays) |
| Degrade ladder | See chapter 04 section 13; watched by a p90 frame-time monitor |

## 6 · Compatibility

- **Browsers:** current Chrome/Edge/Safari/Firefox on phones; `OffscreenCanvas` not required; `Path2D`, `roundRect` polyfilled for older Safari.
- **iOS:** audio unlock on first gesture; vibration unavailable (fallback attempt); `100dvh` for viewport; safe-area insets via `env()`.
- **Android:** `navigator.vibrate`; Chrome's pull-to-refresh disabled via `overscroll-behavior: none`.
- **Desktop:** mouse = pointer; the stage letterboxes into a phone-shaped column with the surface art extending to the window edges.

## 7 · Build order for Phase 1 (each step has an exit check)

| # | Step | Exit check |
| --- | --- | --- |
| 1 | **The Toy.** One phone, one cable, one plug, one socket. Rope, finger coupling, magnet, seat, refuse, unplug, sound, haptics, tuning panel. | The Click Test: it is fun *with no goal*. Feel acceptance tests 1–9 pass. |
| 2 | **Device life.** Phone faces, eye tracking, strain, wake performance, light pool, pulse along the cable, chime ladder and pad. | The room *wakes*. Screenshots read right. |
| 3 | **Level engine.** Data loader, rules, solver, validator; strips, grommets, keys, jokers, reach, obstacles, bricks, dead, switch, crossing, stars, undo, hint. | Validator green on a handful of test levels; bot completes them. |
| 4 | **Act 1 content.** Levels 1–10 from Pass 01 (art for each cast member and decor). | Every level passes validator + bot; each looks like a postcard. |
| 5 | **The wrapper.** Title-screen-is-a-plug, HUD, level pill, stars, the Wake, Settle, Swap, level select, settings, saves. | The first-run script (chapter 03) plays end-to-end. |
| 6 | **Polish pass.** Idle life, secrets, captions, reduce-motion, color-pattern mode, degrade ladder, safe areas, accessibility. | Phase 1 acceptance checklist in Pass 01. |
| 7 | **Retune with the panel.** Play on a real phone; adjust the 20 constants that matter most. | You like the way it feels. |

*Note on honesty:* steps 1–6 are verifiable here (headless Chrome, screenshots, OfflineAudioContext, bot). Step 7 and **real-device haptics and real speakers** can only be judged on your phone.

## 8 · Risk register

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Cable jitter or "rubbery" feel | Medium | **Critical** | Coulomb friction + stiction; fixed step; debug overlays; rest-stability test |
| Plug "tunnels" through an obstacle at high drag speed | Medium | High | Sub-stepping; swept collision on the plug; cap speed |
| Latency on low-end phones | Medium | High | Degrade ladder; light-map cost cap; no per-frame allocation |
| Web Audio blocked or crackly | Medium | Medium | Unlock on gesture; voice limiting; compressor; fully playable muted |
| Haptics missing on iOS | Certain | Low | Treat as a bonus; visuals carry everything |
| Level that is solvable but luck-solvable | Medium | Medium | `p_luck` in the validator; human checklist |
| Crossing detection flicker | Medium | Medium | Debounce, ignore near shared endpoints, bridge exemptions, bot checks |
| Scope creep into Act 2 mechanics | High | Medium | The phase boundary and the mixing rule |
| Art volume (cast + decor) | Medium | Medium | All procedural vector drawing; small reusable parts |
| Over-engineering the code | Medium | Medium | Principle 8 |

## 9 · Run it

See the project [`README.md`](../../README.md). In short: `python3 -m http.server 8000` in the project folder, open it on the desktop or on a phone on the same network; `node tools/validate-levels.js` and `node tools/test-rules.js` certify the levels and the rules. Open the tuning panel with `?tune=1` or by triple-tapping the level pill.

---

## Open water

- **Procedural levels with taste:** the level search tool can generate thousands of candidate rooms and rank by `p_luck` and trap structure; you curate the ten best *as daily puzzles.*
- **WebGL later, for bloom:** if we want true soft bloom and refraction on the neon cable skin, a PixiJS layer could take only the light pass while Canvas handles everything else.
- **Replay as video:** since input is deterministic, a 2-second glow clip is just a replay rendered offscreen to a looping WebM.
- **WASM rope:** only if the profiler demands it; a 60-point rope is nothing.
- **A level editor** on the phone: drag objects; the validator's `p_luck` meter updates live.
