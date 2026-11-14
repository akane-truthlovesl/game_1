# 05 · Rules of the Room

The formal model beneath the fun. Its job is to make **any two mechanics combine without a special case**, and to let the solver, the hint system, the bot playtester and the validator all share one definition of "legal".

The rules live in one module (`rules.js`) that runs in the browser *and* in Node. Rendering and physics never decide legality; they only *report geometry* to the rules.

---

## 1 · The primitives

Everything in a level is one of these. Mechanics only talk to these primitives, which is why they compose.

| Primitive | What it is | Key properties |
| --- | --- | --- |
| **Surface** | The ground a room sits on | friction, slope/gravity vector, material (sound/look), bounds |
| **Obstacle** | Something cables cannot pass | shape (circle / rounded rect), `tall` (blocks cables) vs flat (decor) |
| **Device** | A thing that wants power | position, angle, port offset, `required`, type (cast member), cable |
| **Cable** | A rope from a device port to a plug | length `L`, skin, curl sign, stiffness |
| **Plug** | The free end | `key`, `size` (slim / fat), state, seated socket |
| **Socket** | A hole | `key`, `dead`, strip, slot index, insertion axis |
| **Strip** | A row (or single) of sockets | slots, pitch, angle, switch, own power source |
| **Agent** *(later)* | A thing that moves on its own | behavior, path, interactions |
| **Source** | Where power comes from | wall outlets, batteries, generators, solar |

## 2 · The compatibility rule (keys)

```
fits(plug, socket) =
    !socket.dead
 && (socket.key == 'any' || plug.key == 'any' || socket.key == plug.key)
```

- Keys: `coral · amber · mint · sky · violet · any`. `any` on either side is a **joker**.
- Early levels use `any` on both sides (no keys at all). Keys enter in Level 4 and jokers are always drawn as the neutral ring.
- Future keys are just more names (a "voltage" key, a "USB-C" key); the rule does not change.

## 3 · Reach

- Each cable has a length `L`. A plug can be **seated** in a socket only if the **geodesic distance** (shortest path around tall obstacles, with a clearance of `cableRadius + 1 u`) from the device **port** to the plug's **rear anchor when seated** is ≤ `L + 1 u`.
- The *rear anchor* is the point where the cable meets the plug collar when the plug is seated: socket center displaced 16 u along the cable-exit direction.
- Obstacles *cost length*: the cable has to wrap around them, so the path is longer than the chord. This is the whole second dimension of reach.
- The simulation enforces reach physically (the plug cannot be dragged farther); the rules module computes the *same* value geometrically so the validator can reason without running physics.

**Clarity margins (design rules checked by the validator):**
- The intended solution's cable uses ≤ **94%** of `L` (≥ 6% slack) so it never looks like it is barely reaching.
- A *decoy* socket that is too far must exceed `L` by ≥ **10%**, so "too short" reads unambiguously as too short.

## 4 · Footprints (bricks and overhangs)

Every plug has a footprint: the set of slot indices it occupies on its strip, centered on its seat slot.

| Size | Footprint at slot `s` | Look |
| --- | --- | --- |
| `slim` | `{ s }` | Fits in its socket |
| `fat` | `{ s−1, s, s+1 } ∩ [1..N]` | A brick that overhangs both neighbors; at an end it overhangs only one (and the strip's edge) |
| *(later)* `elbowL` / `elbowR` | `{ s−1, s }` / `{ s, s+1 }` | Orientation set by which side the cable comes from |

**Legal seating** also requires: the footprint is disjoint from every other seated plug's footprint, and does not cover another plug's *seat slot*. Dead sockets inside a footprint are fine (they are a gift: they waste nothing).

A socket covered by a neighbor's footprint is **COVERED**: unavailable, drawn dim.

## 5 · Power and the network

A device is **powered** iff its plug is seated and its socket's strip is **energized**:

```
energized(strip) = strip.switch.on (or no switch)
                && ( strip.source == 'wall'
                  || ( strip.plug is seated in a socket of an energized strip ) )
```

- In Act 1 every strip is fed directly from the wall; the recursive form is there so **daisy chains, extension reels, batteries and generators** (later seeds) need no new rules.
- A seated plug in a strip whose switch is **off** is **standby**: amber LED, a soft "bip", not awake.

## 6 · Win and gates

```
levelComplete = all(device.required => powered(device))
             && all(gate.satisfied)
```

Gates are optional mechanics that must be true at completion:
- **noCross:** zero cable crossings (section 7).
- **order:** devices must have woken in a sequence (Studio world).
- **exact:** no device may be powered that isn't in a target set ("leave Rex asleep").
- **budget:** total load ≤ strip capacity (wattage worlds).

Gates are evaluated every frame; `levelComplete` triggers the Wake only after the state has been stable for 180 ms.

## 7 · Crossing

- Each cable is a polyline (its simulated points). Two cables **cross** if any two of their segments properly intersect.
- **Ignored:** intersections within a **cable cover (bridge)** footprint; intersections within 6 u of a shared endpoint.
- **Debounce:** a crossing counts after it has persisted for 150 ms, so a cable passing over another during a drag does not flicker the Tidy star.
- Where `noCross` is a gate, crossings spark (blue-white) at each intersection and the win waits; the player fixes it by re-routing, re-seating, or **nudging** cable slack (press-drag the cable body).
- The validator checks tidy-feasibility on idealized taut geodesic polylines and the **bot playtest** confirms it with real physics.

## 8 · Stars

| Star | Condition |
| --- | --- |
| **Lit** | The level is complete |
| **Tidy** | Crossings = 0 at completion |
| **Clean** | Seat actions ≤ `par` (default `par` = number of plugs; levels may raise it when a temporary seat is *required* by the solution) |

Stars never gate progress in Act 1; later they unlock worlds (chapter 08).

## 9 · State, undo and hints

- **State** is small: for each plug, `seatedSocket | null` + resting position; for each switch, `on | off`; plus agent/mechanic state later.
- **Undo** is a stack of `{ plug, from, to }`. Undo animates the plug back (`from` is a socket or the resting spot the plug had before the grab). Unlimited depth.
- **Hint** calls the **solver** from the *current* state: it returns the shortest sequence of seat/unseat actions to a solved state; the hand shows only the first one. If nothing is solvable without removing a plug, the first action is *pulling that plug out*. The hint never runs out; the Hint button glows after ~45 s without progress.
- **Auto-solve** (debug/bot) plays the same sequence with real simulated drags.

## 10 · The solver

Depth-first search over plug→socket assignments, most-constrained plug first, pruned by `fits`, `reach`, footprint and strip rules. At ≤ 8 plugs and ≤ 12 sockets it finishes in microseconds, so it runs in the browser for hints.

```
solve(level, state) -> { solutions: [...assignments], count }
```

It also enumerates *all* solutions (capped at 5000) so the validator can measure how a level behaves.

## 11 · The validator (levels cannot ship without passing it)

`tools/validate-levels.js` loads the same `rules.js` and every level and prints a table. **Hard failures** stop the build; **warnings** need a human decision.

| Check | Type | Rule |
| --- | --- | --- |
| Solvable | Hard | `count ≥ 1` |
| Layout sanity | Hard | No overlapping strips/devices/obstacles; everything inside the safe stage; resting plugs outside strips; socket pitch ≥ 38 u |
| Reach margins | Hard | Intended solution ≤ 94% of `L`; decoys ≥ 110% (where a decoy is a pair the level *wants* to look plausible) |
| Tolerance | Hard | Every socket has ≥ 8 u of clear interaction room |
| Tidy feasibility | Hard if the level advertises Tidy; else warn | ≥ 1 solution with no crossings on taut geodesic polylines |
| Par | Hard | `par ≥` minimum number of seat actions in the best solution |
| **Luck score** `p_luck` | Warn | Probability that a random *legal-move* player (pick a random plug, drop it in a random currently-legal socket, repeat) solves the level with no pull-outs. See targets below. |
| Solution count | Info | 1 for puzzle levels; many for breathers |
| Decoy structure | Info | How many first moves are dead ends (the *shape* of the trap) |

**`p_luck` targets** (random legal play over 4000 trials):

| Level class | Target `p_luck` |
| --- | --- |
| Intro / breather | any (they are *supposed* to be easy) |
| Early puzzle (Act 1, L3–L6) | ≤ 0.40 |
| Mid puzzle | ≤ 0.20 |
| Hard / boss | ≤ 0.08 |

A level that is **solvable but random-solvable** is a failed puzzle; the validator says so.

### "Solvable ≠ good" checklist (a human reviews this per level)
- [ ] The **aha** is written in one sentence *before* the level is built.
- [ ] The aha is discoverable from what is *on screen* (nothing hidden but the cable's body language).
- [ ] The first obvious move is wrong **in a way that teaches the rule**, not in a way that wastes time.
- [ ] No pixel-perfect aim (every intended placement tolerates ±10 u finger error).
- [ ] No fiddly routing through gaps < 2 cable widths.
- [ ] A plausible player can finish in the target time (intro 15 s, puzzle 30–90 s, boss ≤ 4 min).
- [ ] Beautiful: composition reads at a glance; one clear focal point; the finished room is a screenshot you would share.

## 12 · Level data format

Levels are plain JS objects in `src/levels/*.js`. Annotated:

```js
{
  id: 7, act: 1, name: 'Fat Bricks',
  intent: 'Bricks cover their neighbors, so they belong at the ends.',   // the aha, one sentence
  mood: { dawn: 0.62 },              // 0 = pre-dawn blue ... 1 = golden morning
  rules: { noCross: false },         // mechanic flags / gates
  par: 4,
  obstacles: [ { id:'mug', shape:'circle', x:292, y:340, r:30, tall:true, art:'mug' } ],
  decor:     [ { art:'plant', x:56, y:560 }, { art:'lamp', x:300, y:90 } ],
  strips: [{
    id:'A', x:180, y:500, angle:0, slots:6, pitch:40,
    sockets:[ {key:'any'}, {key:'any'}, {key:'any'}, {key:'any'}, {key:'any'}, {key:'any'} ],
    switch: null,                    // or { on:false }
    source: 'wall'
  }],
  devices: [{
    id:'laptop', type:'laptop', x:90, y:150, angle:-0.05, color:'sky', required:true,
    cable:{ len: 330, curl: 1 },
    plug: { key:'any', size:'fat' },
    rest: { x:130, y:330 }
  } /* ... */ ],
  hand: [ /* optional authored hint path override */ ],
  secret: { art:'sock', x:30, y:610 }
}
```

*Authoring helpers:* `strip.row(x, y, n, {…})`, `device.phone(x, y, {…})`. The validator prints a one-screen ASCII map of every level so layouts can be reviewed without launching the game.

## 13 · Mechanic modules (for everything after Act 1)

Mechanics beyond the Act 1 set register hooks against the shared core; they never edit each other.

```js
Mechanics.register({
  id: 'timerSocket',
  onLevel(level, world) {},                     // build state
  canSeat(ctx) { return true | { no: 'reason' } },   // veto a seat (with the reason to show)
  blocks(ctx)  { return [] },                   // extra footprint / covered sockets
  power(ctx)   { return undefined },            // override a device's power
  onSeat(ctx) {}, onUnseat(ctx) {},
  onTick(dt, world) {},
  gate(ctx) { return true },                    // contributes to levelComplete
  draw(layer, g, world) {},                     // 'under' | 'devices' | 'over' | 'fx'
  solve(ctx) {}                                 // how the solver should model it (or mark "simulate")
});
```

- **Static mechanics** (keys, bricks, dead, reach, switch) are fully modeled by the solver.
- **Dynamic mechanics** (moving sockets, agents, timers) declare `solve: 'simulate'` and are validated by the bot playtester in a deterministic headless run instead.

## 14 · Determinism

Physics runs on a fixed step with no randomness in the loop (curl signs and shapes are authored), and all input is timestamped. Therefore: same level + same input timeline = same result. This makes replay (ghosts, rewind-scrub, share clips), bot tests and bug reports reliable.

---

## Open water

- **Tolerance as a design tool:** a "grumpy strip" whose sockets are 6 u narrower, rewarding a steady thumb. (Skill, not insight; use sparingly.)
- **Partial credit stars:** a fourth, hidden star for "found the secret".
- **Solver as a muse:** run the solver on random generated rooms and *rank them by `p_luck` and the shape of their traps*; surface the best as daily puzzles. A procedural-with-validation pipeline, curated by taste.
- **Explainable hints:** a second tier of hint that highlights *why* a plug cannot go somewhere (the covered socket, the too-short cable) without giving the move away. The game as teacher.
- **Level diffs:** since levels are data, "remix" is a one-line change; a level editor that tests solvability live and shows the `p_luck` as you drag things around could make *you* a faster designer than a spreadsheet.

---

## Appendix · Rules as built

- **Crossings are judged on settled arcs** (`Rules.solutionCrossings`): each seated cable is modeled as the circular arc it settles into (side = the level's `settleCurl`, default +1). Levels with obstacles fall back to geodesic polylines, because the settle step steps aside when an obstacle is in the way.
- **`settleCurl`** is a per-level field; the validator hard-fails a tidy level whose settled arcs leave the stage or cross, and suggests the opposite sign when that works.
- **Waivers:** `waive: ['ambiguousReach' | 'luck' | 'margin']` marks a deliberate exception; the validator reports it as a warning instead of a failure.
- **Class targets as built:** intro/breather/story: any · teach ≤ 0.55 · puzzle ≤ 0.40 · hard ≤ 0.20 · boss ≤ 0.20.
- **Hint** prefers **tidy** solutions (crossings weigh 4 per crossing in normal levels, 100 when `noCross` gates the win), then fewest changes from the current state.
- **Tools:** `tools/test-rules.js` (54 assertions), `tools/validate-levels.js`, `tools/search-level.js` (solver-as-muse), `tools/auto-rest.js` (tidy resting positions with arc-fit checks).
- **Rope exports** `Rope.arcPoints` so the rules and the validator can build the same arcs the physics settles into.
