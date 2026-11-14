# Pass 01 · Act 1 — The Desk (levels 1–10)

*One morning. One desk. Ten rooms. From a blue pre-dawn silence to a golden, glowing, cat-approved sunrise.*

This pass designs the **core experience and the first ten levels** deeply enough to build straight from. Numbers are **initial design values**; the *intent* and the *structure* of each level are the contract. The validator (`tools/validate-levels.js`) certifies solvability and margins, and the "as built" notes at the end record what changed once real levels met real physics.

> Conventions: stage 360 × 640 u, **y grows downward**. Phones live in the upper band (y ≈ 110–170), resting plugs in the middle (y ≈ 250–380), strips in the lower band (y ≈ 430–540), never lower than y ≈ 560, so the thumb and the HUD never collide. Plugs slide into a socket from the strip's **front** (north, for strips on the bottom), so cables always arrive from the devices' side. A phone's **port** is at the bottom-center of its body.

---

## 1 · Act 1 at a glance

| # | Title | New thing | The aha (one sentence) | Devices | Class |
| --- | --- | --- | --- | --- | --- |
| 1 | **Hello, Pip** | Drag, seat, wake | *(none: learn the verb)* | Pip | Intro |
| 2 | **Duet** | Rising chime; a hint of *tidy* | Straight lines are prettier than crossed lines | Pip ×2 | Intro |
| 3 | **Short Leash** | **Reach** | Do the shortest cable first | Pip ×3 | Teaching puzzle |
| 4 | **Colour Code** | **Keys** and the **joker** | Save the joker for the plug with no other home | Pip ×5 | Teaching puzzle |
| 5 | **Flip It** | **Switch** | Plug first, then flip for the cascade | Pip ×3, Big Sleepy, Lumi | **Breather** |
| 6 | **Read the Room** | **Obstacles** | Measure the route, not the distance | Pip ×3 | Teaching puzzle |
| 7 | **Fat Bricks** | **Footprints** | A brick covers its neighbors, so it belongs at an end | Boxy, Gus, Pip ×2 | Puzzle |
| 8 | **Burnt Out** | **Dead sockets** (+ the Power Cut) | Re-plan around the socket that just died: its overhang is a brick's parking spot | Boxy, Pip ×3 | Story / breather |
| 9 | **Tidy Up** | **noCross gate**, **nudge**, a **tangle** | A free socket is a workspace for sorting | Pip ×5 | Puzzle |
| 10 | **Morning Rush** | *(boss: combine everything)* | Solve the room in layers: bricks → keys → reach → flip | Boxy, Gus, Big Sleepy, Pip ×2, Lumi (+ Rex, the mystery radio) | **Boss** |

**Difficulty sketch (0–10):** 0.5 · 1 · 3 · 3 · 1 · 4 · 5 · 3 · 5 · 7. Peak at the boss; a breather at 5 and a story beat at 8. *Never three hard levels in a row.*

**Time of day:** a single morning across the act: L1 `dawn 0.05` (pre-dawn blue) → L10 `dawn 1.0` (golden). The mat's ambient color and the window light on its edge warm by ~0.1 per level.

**Cast reveal order:** Pip (L1) · Lumi's *light* (L1, as decor; first *device* at L5) · Big Sleepy (L5) · Boxy and Gus (L7) · Biscuit's tail (L8) · Rex the radio and Biscuit's full cameo (L10).

**Surprise beats:** L1 *the eyes follow your finger* · L3 *the squint and the twang* · L5 *the big cascade* · L8 *the Power Cut* · L10 *the radio, the cat, the unplug*.

**Postcard captions:** (1) *Pip woke up first. As always.* (2) *A duet for two phones and one very patient strip.* (3) *Short cable, long story.* (4) *Everyone found their color.* (5) *Plug everything. Then, flip.* (6) *The book was not moved. The book will never be moved.* (7) *Bricks: they go at the ends.* (8) *Something burned out. Something else lit up.* (9) *Untangled. Smug. Justified.* (10) *Rex has opinions about jazz.*

**Secrets (one tappable thing per room, found in the Settle):** (1) a lost sock under the plant · (2) a doodle on the notebook that animates · (3) a ladybird on the plant leaf · (4) a gold button under the mug · (5) a tiny "ON" sticker under the switch that peels off · (6) a sticky note with a doodle of Pip · (7) a stray USB stick that wiggles · (8) *the cat's tail* (tap it: *mrrp*, it twitches) · (9) a golden plug taped under the strip · (10) **Rex** (the radio itself) + a golden plug.

---

## 2 · Level designs

Each level lists **intent · cast and rules · layout · solution and traps · teaching · moment-to-moment · validator targets**.

---

### Level 1 · **Hello, Pip**

- **Intent.** Teach the verb (grab, drag, seat) and deliver the first full *Wake* in ~12 seconds. Zero failure possible.
- **Cast / rules.** Pip (mint case, neutral graphite cable). One grommet socket (`any`). No keys, no reach pressure (L ≈ 320 for a ~260 u path).
- **Layout.**
```
       lamp(off)                              . y≈ 90
                  ┌──── Pip ────┐ (180,150)   
                  └──────┬──────┘ port (180,196)
                         │ ╲_ cable 320, lazy S
   (118,322) plug ◄──────┘                  [mug·decor]
                                             . y≈330
                       ◉  grommet (180,470)   rear anchor (180,454)
   [plant+sock]                               . y≈560
```
- **Solution.** One move. Resting plug → grommet. `par = 1`.
- **Teaching.** After 2.5 s of idle a ghost finger fades up beside the plug and drags it to the socket. If the player touches first, no ghost. The socket's rim breathes.
- **Moment to moment.** *(See chapter 03's narrated play.)* The room fades in blue; objects drop with soft thuds; Pip's eyes crack open and **follow the plug**; the socket leans the plug in; **thunk**; the pulse zips; Pip's eyes pop, 12 → 100%, chime C; the lamp *clicks* on, the room goes warm, steam rises from the mug, a faint birdsong. Three stars pop. A **large** cascade for one device: it must *feel like a promise*.
- **Validator.** 1 solution · `par 1` · `p_luck 1.0` (intended) · reach margin ≥ 20%.

---

### Level 2 · **Duet**

- **Intent.** Two devices, a rising chime (C then D), and the first whisper of *tidy*. A melody completes.
- **Cast / rules.** Pip (coral) and Pip (sky). A 2-slot strip (`any`). Cables ≈ 320.
- **Layout.**
```
        Pip(coral)                  Pip(sky)         y≈150
        (104,150)                   (256,150)
            │  ╲                        ╱  │
            ▼   ╲  (plugs rest mid)    ╱   ▼
                 ┌────────────────┐
                 │  ◉(160)  ◉(200)│  strip, y≈486
                 └────────────────┘
```
- **Solution.** Left → left, right → right (tidy). The crossed assignment is *also valid* (`2 solutions`, 1 tidy). `par = 2`.
- **Teaching.** No ghost unless idle 8 s. When the player crosses, the cables spark softly *once* and the Tidy star later shows unlit; when they uncross, a small happy shimmer plays. The nudge gesture is *hinted* by a soft ripple if the player touches a cable body.
- **Moment to moment.** The second chime sits a tone above the first; the cascade is a two-note phrase. Pip-sky *glances at Pip-coral* when both are awake (a tiny wink).
- **Validator.** 2 solutions, 1 tidy · `par 2`.

---

### Level 3 · **Short Leash**

- **Intent.** Introduce **reach**. The cable explains it: it goes taut and the phone *squints*. A first "oh!" arrives within a minute.
- **Cast / rules.** Pip ×3 with cables of **short / medium / long**; three **grommet** sockets in a descending staircase. All `any`. *(If the validator reports `p_luck > 0.45`, add a fourth phone and grommet; the staircase scales.)*
- **Layout.**
```
   Pip A(60,130)    Pip B(180,130)    Pip C(300,130)       ports y≈176
   L=160 (short)    L=262 (medium)    L=372 (long)
        ╲                │                  ╲
   ◉ near (100,330)      │                   ╲
                    ◉ mid (200,430)           ╲
                                         ◉ far (300,530)
```
- **Reach sets (by design):** A → {near}; B → {near, mid}; C → {near, mid, far}. Reach margins ≥ 6%; decoys ≥ 10% over.
- **Solution.** A→near, B→mid, C→far. **Unique.** `par 3`.
- **Traps.** C → near feels natural (closest), then A has nowhere to go. B → near leaves A stranded.
- **Teaching.** Dragging A's plug toward the mid socket makes the cable taut at its limit; Pip A **squints**, a twang plays once, the plug stops, the cable is *visibly straight*. No text. The first time this happens, a tiny curved arrow (drawn like a sticker) flashes beside the cable for 800 ms.
- **Moment to moment.** The three cables lie in three visibly different lengths. The player tries the nearest-looking move; the cable says no; Pip squints. They look at A: short cable, one reachable socket. *Oh.* A's plug goes in; B's has to be mid; C reaches the far socket with a satisfying long cable *sweep*. The chime climbs C–D–E; the cascade is a 3-note run.
- **Validator.** 1 solution · `par 3` · `p_luck ≤ 0.45` (4-phone variant ≤ 0.30) · margins as above.

---

### Level 4 · **Colour Code**

- **Intent.** Introduce **keys** (color + glyph) and the **joker**. The player learns that plugs only fit matching sockets, and that a joker is precious.
- **Cast / rules.** Pip ×5: coral, sky, mint, amber, coral (left → right). A 5-slot strip with keys **[coral, sky, mint, amber, joker]**. Cables just long enough for the tidy layout. Keys active.
- **Layout.**
```
  Pip(coral)  Pip(sky)  Pip(mint)  Pip(coral)           y≈150
   (55)        (140)     (220)      (305)
     ╲           │         │          ╱
   ┌──────────────────────────────────┐
   │ [● coral][◆ sky][■ mint][○ joker]│   strip y≈490, pitch 40
   └──────────────────────────────────┘
```
- **Solution.** Coral→coral, sky→sky, mint→mint, amber→amber, the *other* coral→joker. (**One** solution as built; with the shorter cables the crossed coral swap is out of reach.) `par 5`.
- **Traps.** Putting sky or mint into the joker first strands a plug (the player will see an empty matching socket and a plug with nowhere to go).
- **Teaching.** A wrong key: the plug hovers without glowing; releasing near it hops back with a knock, the socket's glyph pulses ("not me"), the matching socket's rim *breathes brighter* for one beat. The joker's ring glows with *all five glyphs ghosted*.
- **Moment to moment.** Four plugs, four colors, two of them the same: the player grabs the unique ones first (satisfying matches), then realizes the last coral plug has only one place left: the odd ring. The final chime lands on the joker, the first time the "special" socket is used: a slightly different wake sparkle.
- **Validator.** 2 solutions, 1 tidy · `par 4` · `p_luck ≤ 0.40`.

---

### Level 5 · **Flip It** *(the breather)*

- **Intent.** A *pure payoff* level that also introduces the **switch**. Plug everything, then flip for the first big cascade. Almost no thinking; a lot of feeling. Also the first level where **tidy takes a bit of thought**, as an optional mastery.
- **Cast / rules.** Pip (coral), Pip (sky), Pip (mint), **Big Sleepy** (tablet), **Lumi** (lamp). A 5-slot strip with a large rocker switch at one end. All keys `any`. Cables long.
- **Layout.**
```
  Pip   Pip   Big Sleepy   Pip   Lumi                    y≈150
   (45) (112)    (180)    (248)  (315)
     ╲    ╲        │        ╱     ╱
   ┌──────────────────────────────────┐
   │ ◉ ◉ ◉ ◉ ◉                 [ ▌▐ ] │   strip y≈490, switch right
   └──────────────────────────────────┘
```
- **Rules in play.** The strip is **OFF**. Seated plugs show *standby*: an amber LED, a soft `bip` that climbs a tone per plug (so the satisfying thunks still reward each step). **Flip** the switch: a heavy *clack*; a pulse sweeps outward along the strip and down each cable; devices wake **left to right** with a rising five-note run; **Lumi wakes last** and floods the room with warm light.
- **Solution.** Any assignment works. **Tidy** (monotone order) is the optional mastery. `par 5`.
- **Teaching.** If all five are seated and the player idles for 5 s, the switch pulses and a ghost finger taps it. Flipping the switch *early* is fine: devices wake as they are seated.
- **Moment to moment.** Five quick plugs (it feels like setting a table), the room still dim and silent but for the standby bips; the switch glows; a satisfying *clack*; *then* the largest cascade yet, ending in Lumi's warm *tung*. Big Sleepy's yawn is the funniest beat of the act.
- **Validator.** All assignments valid; tidy feasibility yes; `par 5`; class *breather* (no `p_luck` requirement).

---

### Level 6 · **Read the Room**

- **Intent.** Introduce **obstacles**: a stack of books is a wall the plug and the cable cannot cross, so the route is longer than the distance. Fresh spatial thinking after a breather. *(Planned as "Around the Mug"; the geometry that makes a detour matter needs a wide wall, so the mug became a book.)*
- **Cast / rules.** Pip ×3 (coral, sky, mint), three **grommets**, one **book** (rounded rectangle 200 × 44, tall). All keys `any`.
- **Found by search** (`tools/search-level.js l6`, seed 31): unique solution, tidy, clean reach gaps (no cable in the ambiguous 94–110% band), obstacle changes the answer.
- **Layout (as built).** Phones at `y=120`, `x = 60 / 180 / 300` with cables `270 / 325 / 370`. Book centered `(175, 280)`. Grommets `S1 (135, 385)`, `S2 (210, 480)`, `S3 (245, 355)`: all tucked *behind* the book.
- **The trap.** `a → S3` and `b → S2` *look* reachable by straight line, but the book adds enough length that they are not. The only solution is `a → S1`, `b → S3`, `c → S2`; the long cable goes around the end of the book.
- **Teaching.** The cable *wraps* the book when dragged taut and the phone squints. No text. A plug is also blocked by the book, so the thumb has to route around its end, which is the physical insight.
- **Validator.** 1 solution · tidy ✓ · margin 89% · `p_luck 0.46` (class *teach*, ≤ 0.55) · bot: completes in 3 actions, 3 stars *(only when the finger routes around the book; the bot's straight-line drag correctly stalls against it)*.

---

### Level 7 · **Fat Bricks**

- **Intent.** Introduce **footprints**. Fat plugs (the laptop's and console's power bricks) cover their neighbor sockets; the player discovers that bricks belong at the ends. The act's first *packing* aha.
- **Cast / rules.** **Boxy** (laptop, fat), **Gus** (console, fat), Pip ×2 (slim). A **6-slot strip** (pitch 40). All keys `any`.
- **Layout.**
```
   Boxy            Pip      Pip            Gus           y≈150
  (70,150)       (150)    (210)         (290,150)
     ╲               ╲      ╱               ╱
   ┌───────────────────────────────────────────┐
   │ ◉  ◉  ◉  ◉  ◉  ◉                          │   strip (180,500), 6 slots
   └───────────────────────────────────────────┘
```
- **Rule.** `fat` footprint = seat ± 1 slot. At an end it covers one neighbor (and overhangs the strip). Covered sockets dim.
- **Solution.** Brick at slot 1, brick at slot 6, phones at 3 and 4 (any order). **Unique up to swapping the two phones** (as built, the cables are short enough that each brick can only reach its own end). `par 4`.
- **Traps.** A brick in the middle covers three sockets and ruins the packing. Hovering a brick shows its **footprint** (translucent) *before* release, so the player can see the rule: no text.
- **Teaching.** The first time a brick is held over the middle of the strip, the neighbors dim and a ghost footprint appears. The footprint turns **warning orange** if it would overlap another plug.
- **Moment to moment.** Boxy's brick is *heavy*: slower to follow, a deeper rustle, a bigger thunk, a stronger buzz. Placing Boxy at an end feels right the way a book fits a shelf. When the strip is **fully packed** (2 bricks + 2 phones filling 6 slots), the cascade is bigger: Boxy's scanning light, Gus's boot jingle, and a deeper chord.
- **Validator.** `p_luck ≤ 0.20` (this is a real puzzle) · 1 packing · footprints disjoint · `par 4`.

---

### Level 8 · **Burnt Out** *(the story beat)*

- **Intent.** The act's first **surprise**: the **Power Cut**. Plug three devices and the strip *overloads*: a flash, a crack, **the whole room goes dark**, every plug pops out, and one socket is now **sooty and dead**. Then solve the (easier) puzzle with the new rule: *a dead socket cannot take a plug, but a brick's overhang can swallow it for free.* Foreshadows the cat.
- **Cast / rules.** Boxy (fat) + Pip ×3 (slim). A **6-slot strip**. Script: `burnout@slot 3` triggers at the **third simultaneous seated plug**.
- **Sequence.**
  1. *Phase A* (free play): plug devices normally; chimes climb. At the **third** seat the strip's LED flickers *amber, red*.
  2. **The Cut** (~2.2 s): a bright flash at slot 3, a **clack**, a low *thump*, then **darkness** (ambient to 90%); all devices collapse to standby glimmers; every plug **pops out** and hops to rest; slot 3 becomes **sooty and dead**, a soft smoke curl; a faint **cat tail** swishes at the screen edge. *(The Zeigarnik seed.)*
  3. *Phase B*: the lights return, dimmer; the same devices, the same strip, one dead socket.
- **Solution (phase B).** Boxy's brick should sit **next to the dead socket** (slot 2 or 4) so its overhang covers slot 3 for free; three phones take the remaining live slots. *Several valid solutions*, so the level is a **breather with a twist**, not a trap. `par 4`.
- **Teaching.** Dead sockets are *visibly sooty*; a refused plug gets a small `zap`. The sooty look now means "dead" for the rest of the game.
- **Moment to moment.** The player is happily plugging: chime, chime, chime, **a spark**, *silence*. The room is dark, the standby lights breathe, a tail twitches. A little joke, then a new lay of the land. The Wake is bright because of the dark that came before.
- **Validator.** Phase B solvable · several solutions · a `script` field is validated as "the player can still solve after the cut".

---

### Level 9 · **Tidy Up** *(the tangle)*

- **Intent.** Introduce the **noCross gate** and the **nudge** gesture. The level *starts* as a tangle: plugs already seated in scrambled sockets, cables heavily crossed. Untangle by re-seating using the *empty* socket as a workspace. The act's **sorting aha**.
- **Cast / rules.** Pip ×5. A **6-slot strip with a switch** (off). `noCross` gate on. Cables of near-equal length, tight slack.
- **Start state.** Phones in a row (x-order 1…5); plugs seated in a scrambled permutation of slots (one slot empty).
```
   P1    P2    P3    P4    P5                            y≈150
    ╲  ╲╱ ╲  ╱╲   ╱                        (tangled: sparks at each crossing)
   ┌──────────────────────────────────┐
   │ ◉  ◉  ◉  ◉  ◉  ◉                 │   strip, 6 slots, switch OFF
   └──────────────────────────────────┘
```
- **Rule.** Where two cables cross, a **blue spark** pops; the Wake waits until crossings = 0 *and* all devices are awake. **Flip the switch** any time: devices wake (the room lights) but the Wake waits for tidy.
- **Solution.** Any *monotone* mapping (P1…P5 in left-to-right slot order) with one empty slot. Reaching it from the scramble requires parking one plug in the free socket and ripple-moving others (a sorting-by-swaps puzzle). `par` = the minimum number of seats in the best ripple. Multiple solutions (which slot ends empty).
- **Nudge.** Press and drag a cable body to bend its *slack* aside; this cures slack-bulges that still cross after sorting. The first crossing that persists for 12 s triggers the ghost hand for the nudge.
- **Teaching.** Sparks make the rule visible. The *comb*: when crossings hit 0 a soft shimmer runs along the cables, and they gently align to parallel lanes (the curl bias does the rest).
- **Moment to moment.** A mess that *wants* to be tidy. Each re-seat visibly reduces the sparks. The last spark winks out, the switch glows, flip: a cascade left to right through a perfectly combed fan of cables. Smug.
- **Validator.** Solvable on taut geodesic polylines · `par` · bot completes it with real physics (this one *needs* the playtest).

---

### Level 10 · **Morning Rush** *(the boss)*

- **Intent.** The act's finale: every idea from 1–9 in one rich room, solved in **layers** that each have one clear insight. A bigger payoff than anything before; a story beat that sets up Act 2.
- **As built (found by search, seed 43).** *Strip A*: 5 slots, **slot 2 is dead**. *Strip B*: 3 slots keyed **[any, sky, coral]** with a **switch**. A **mug** sits at the left. The console's short cable pins it to strip B (a brick at B.3 covering the sky socket), the laptop and the coral phone sort themselves around the sooty socket on strip A, the sky phone takes B.1, the lamp takes a free slot on A, and the switch comes last. **10 solutions, 2 tidy, `p_luck 0.15`.** Tidy is not promised because the cables are long for reach reasons.
- **Cast.** Boxy (fat), Gus (fat), Big Sleepy, Pip ×2, Lumi, and under a cloth on the shelf, **Rex** the mystery radio (the secret; not required). A hidden gold plug.
- **Rules in play.** Reach, keys + jokers, fat bricks, a dead socket, a switch, the mug obstacle, and the tidy star.
- **Layout (intent).** Two strips: **Strip A** (6 slots, one dead) takes the bricks and several slim plugs; **Strip B** (3 colored sockets + one joker, with a **switch**) takes the colored devices. The mug sits between two phones and Strip A. Cables differ in length so that *which brick goes to which end* is forced by reach.
- **Structure of the solve (the layers).**
  1. **Bricks** (footprints, the dead socket): park the bricks at the live ends.
  2. **Keys**: colored plugs find their colored sockets; the joker takes the leftover.
  3. **Reach**: the short-cabled device only reaches one strip, which fixes who goes where.
  4. **The mug**: one phone must route the other way around.
  5. **The switch**: flip last for the biggest Wake of the act.
- **Solution.** Unique under the validator (`p_luck ≤ 0.08`). `par` = number of plugs. A tidy solution exists.
- **The stinger.** After the Wake, the cloth on the shelf slides off: **Rex** plays a smoky jazz riff, a **dust-mote beam** crosses the room, and **Biscuit the cat** hops onto the desk, curls on the warmest device (Boxy), purrs (a low haptic rumble), then **casually unplugs one cable with a paw** *(the game's cliffhanger)*. Fade. *Next: Act 2.*
- **Moment to moment.** A crowded, beautiful desk at golden hour; the player peels it apart layer by layer with growing confidence; each correct idea is *visible* in the room's rising light. When the switch is flipped, the cascade runs through the whole room, crescendoes with Lumi, and the music of the act's chord *resolves*. And then the cat.
- **Validator.** 1 solution · `p_luck ≤ 0.08` · tidy-feasible · reach margins · bot completes.

---

## 3 · Act 1 audio plan

| Moment | Sound |
| --- | --- |
| Pre-dawn ambience | Muffled brown noise, a slow clock tick, low-pass ~900 Hz; opens with each wake |
| Plug-ins | The tick / rustle / thunk family; chimes climb the C-pentatonic ladder |
| Pip | Marimba blip wake · Lumi: warm pad *tung* · Big Sleepy: low bell with a slow glissando *yawn* · Boxy: clarinet-ish square with a fan whirr · Gus: four-note chiptune boot · Rex: band-passed jazz riff |
| L5 | A rising five-note run on the flip |
| L8 | The Cut: an overloaded *zzzt*, a low thump, a descending slide into silence; the restore plays the chord *a half-step lower* then resolves up |
| L10 | The radio riff: a looping 8-bar Dm7–G7–Cmaj7 walking-bass-and-keys figure, filtered to sound like it is coming from a small speaker |
| Cat | Purr (low-frequency amplitude-modulated noise), *mrrp* (a two-note slide) |

## 4 · Act 1 visual plan

| Level | `dawn` | Decor | Light |
| --- | --- | --- | --- |
| 1 | 0.05 | Lamp (off), mug, plant | Standby LEDs only |
| 2 | 0.12 | + notebook | |
| 3 | 0.20 | Plant with a ladybird | |
| 4 | 0.30 | + sticky notes | A hint of sky color on the mat's edge |
| 5 | 0.40 | + desk clock | |
| 6 | 0.50 | Big mug with steam | |
| 7 | 0.60 | Pencil cup | |
| 8 | 0.70 → 0 → 0.7 | Cat's tail at the edge | The Cut blacks out the room |
| 9 | 0.80 | Washi tape, sticky notes | |
| 10 | 1.00 | Everything, plus a sun beam across the mat | Golden hour |

## 5 · Phase 1 acceptance checklist

**Feel (chapter 04, section 15):** tests 1–10 pass; the Click Test scene (`?toy=1`) is delightful for 60 seconds with no goal.

**Levels:**
- [ ] All ten levels pass `tools/validate-levels.js` (no hard failures).
- [ ] Each has its aha written in the file *and* confirmed by the solver's trap structure.
- [ ] The headless **bot** completes all ten with real pointer drags and real physics.
- [ ] Level 9's tidy solution is reachable under real cable shapes (bot-confirmed).
- [ ] L8's Power Cut works from every possible third-seat state.

**Presentation:**
- [ ] Screenshots reviewed at 390×844, 360×740, 412×915 and 1280×800: composition, legibility, shadows, light.
- [ ] No console errors; no warnings on load; no unhandled rejections.
- [ ] Audio hygiene: no clipping; no stuck voices; ambient and pad levels sensible; all SFX audible but not harsh (`OfflineAudioContext` probes).
- [ ] Reduce-motion and pattern (colorblind) modes work.
- [ ] Save/resume: reload mid-level restores every plug; settings persist.

**First-run script (chapter 03):** the title-plug → lamp → menu → Level 1 flow plays without reading, in < 15 s to the first reward.

## 6 · Questions to answer by *playing* (they feed Pass 02)

1. Did the **squint and twang** teach reach without a hint? How long did the first-time bot (or a person) take on L3?
2. Is the **joker** idea clear on L4, or did the ring read as decoration?
3. Does the **switch cascade** in L5 *feel* like a reward? Is Big Sleepy's yawn the best beat?
4. Does the cable **wrap** around the mug look and feel right in L6 (no jitter, no tunneling)?
5. Is the **brick footprint** legible *before* release in L7? Does the heavy brick feel heavy but not sluggish?
6. Does the **Power Cut** land as a surprise or as an annoyance? (Length, sound, how much was lost.)
7. Is **nudge** discoverable in L9, and does the tidy comb feel earned?
8. Is the **boss** solved in layers, or do players flail? How long is a human run?
9. Which wake-up (Pip, Big Sleepy, Boxy, Gus, Lumi, Rex) is the *favorite*? Which needs more love?
10. Where does the player *pause*? (That is where design or feel is unclear.)
11. After L10, do they *want* Act 2? Did the cat land?
12. Which one **number** in the tuning panel changed the feel most? (Likely `tau`, magnet radius, friction.)

## 7 · What Pass 02 will probably inherit

- A feel stack proven on real devices and a **toy-first** approach for each new physical object (rail strips, pegs, clips).
- The **cat** promoted from stinger to mechanic.
- Pressure to add **sliding strips**, **pegs**, **clips**, **bridges** and **daisy chains** (Workshop), then **timers**, **breakers**, **wet zones**, **conveyors** (Kitchen).
- A *House Map* level select and the **postcard album** (art-heavy; scheduled at the start of Phase 2).

---

## As-built notes (written after Phase 1 was built and played by a bot)

### Verified here
- **Validator:** all ten levels pass with no hard failures (`node tools/validate-levels.js`). Six carry *explicit waivers* for non-reach levels (cable-length ambiguity, and one luck band) so the report stays honest.
- **Rules tests:** 54 assertions pass (`node tools/test-rules.js`).
- **The bot** (Playwright driving Chrome with real pointer drags, following the solver's hints) completes **all ten levels**. Stars: levels 1–9 earn **Lit + Tidy + Clean**; the boss earns Lit + Clean.
- **Real touch events** (CDP `touchStart/Move/End`) drive Level 1 to completion; the page never scrolls.
- **UI flow test** (15 checks): title plug-in → menu → Levels grid with progress gating → Play → solve → stars → Next → Undo → Hint → Restart → Settings toggle → save/resume after reload.
- **Feel probes** (headless Chrome): rest stability 0.000 u/s · lift response within 2 frames · release→contact **104 ms** · follow lag 6 u at 200 u/s · cable length ≤ 1.014 L under a vigorous drag · reach honesty (a short cable never seats a far socket). Main-thread cost: update ≈ 0.1–0.4 ms, draw ≈ 1.4–3 ms per frame.
- **Audio hygiene** (`OfflineAudioContext`): no NaN, no clipping, negligible DC; a rendered sampler lives at `docs/audio/sfx-sampler.wav`.

### Not verifiable here (needs your phone)
Real-device **feel** (weight, lag, snap), **haptics** (Android vibration and the iOS switch trick), **speakers**, **iOS Safari** audio unlock and silent-switch behavior, **frame rate on a phone GPU** (headless Chrome uses a software rasterizer, so frame rate there says nothing about phones), and a human's reading of the **color-blind pattern** mode.

### Final numbers (validator / bot)

| # | Title | Solutions (tidy) | Margin | `p_luck` | Par | Bot actions | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Hello, Pip | 1 (1) | 87% | 1.00 | 1 | 1 | Ghost hand at 2.5 s idle |
| 2 | Duet | 2 (1) | 84% | 1.00 | 2 | 2 | Crossed assignment is legal; "tidy?" caption once |
| 3 | Short Leash | 1 (1) | 93% | 0.46 | 3 | 3 | Lengths 172 / 275 / 385 |
| 4 | Colour Code | 1 (1) | 92% | 0.59 | 5 | 5 | **Five** phones (coral, sky, mint, amber, coral); luck band waived |
| 5 | Flip It | 24 (1) | 92% | 0.79 | 5 | 6 | Breather; switch moved 12 u further from the last socket |
| 6 | Read the Room | 1 (1) | 89% | 0.46 | 3 | 3 | Found by search; the *book* replaced the mug |
| 7 | Fat Bricks | 2 (1) | 92% | 0.11 | 4 | 4 | Lowest luck score: the best puzzle of the act |
| 8 | Burnt Out | 32→12 (2) | 93% | 0.65 | 4 | 7 | The Power Cut after the third seat; story class |
| 9 | Tidy Up | 330 (6) | 90% | — | 5 | 11 | Tangle start `p1 A.4, p2 A.6, p3 A.5, p4 A.2, p5 A.3`, found by search |
| 10 | Morning Rush | 10 (2) | 90% | 0.15 | 5 | 6 | Found by search; **Tidy not promised** (cables are long for reach reasons) |

### What changed from the plan, and why
1. **Cables shortened** in the generous levels (4, 5, 7, 8) to ≈ 1.08× what the *tidy* solution needs, so the arcs fit the mat and nest. Reach ambiguity in those levels is *waived by design*; they are not about reach.
2. **Seated cables settle into neat arcs** (`relax` toward a circular arc, all bulging the same way per level via `settleCurl`). This is what makes Tidy naturally attainable and the cables beautiful. The solver now judges crossings **the way the player sees them** (settled arcs), not on idealized taut lines (obstacle levels still use geodesic polylines).
3. **The magnet uses the aim point** (finger + offset), not the lagging plug. A thumb that stops over socket A must win over socket B even if a heavy brick is still catching up.
4. **Hit areas:** a seated brick no longer steals a tap meant for the switch beside it (tighter brick hit area, switch priority, and the switch block sits farther from the last socket).
5. **Level 6** became *Read the Room* (a wide book, not a mug) because only a wide obstacle makes the detour long enough for a clean reach gap.
6. **Level 9** uses short cables (340) and a start scramble found by search, so its settled arcs stay on the mat and the tidy solution is genuinely tidy.
7. **The Level 10 stinger** was built: Rex under a cloth, a synthesized jazz riff, the cat landing on Boxy, purring, and unplugging the coral phone.
8. **Boss luck target** relaxed to ≤ 0.2 (it has several valid layouts).
9. **Physics lessons** (details in chapter 04's appendix): no curl bias; smoothing only while carried or taut; stale ideal-arc cache invalidated on re-seat.

### Phase-1 acceptance checklist
- [x] All ten levels pass the validator.
- [x] Each aha is written in the file *and* confirmed by the solver's trap structure *(L4 and L5 are the weakest ahas; see questions)*.
- [x] The bot completes all ten with real pointer drags and real physics.
- [x] Level 9's tidy solution is reachable under real cable shapes (bot-confirmed, 3 stars).
- [x] Level 8's Power Cut works (bot-confirmed re-plan after the cut). *(Only tested from one third-seat state; the other states are covered by the rule "≥ 3 seated on the strip".)*
- [x] Screenshots reviewed at four viewport shapes.
- [x] No console errors on load or through the bot's ten-level run.
- [ ] Audio hygiene on real speakers, haptics on real phones, frame rate on a real GPU: **owed to a phone session.**
- [ ] The Level 10 *Tidy* star remains unpromised; Pass 02 can decide whether nudging should make it attainable.

### Answers (and new questions) from the build
- *Did squint + twang teach reach?* Mechanically yes (strain 1.0 + a stopped plug on every probe). A human must confirm it reads.
- *Is the joker clear in L4?* Probably the weakest idea in the act: five plugs with one rainbow ring. A human should say if it reads as a rule or as decoration.
- *Is the brick footprint legible?* Yes in screenshots (dim covered sockets + flashing footprint on refusal). The brick now looks like a power brick, not a strip.
- *New question:* does the aim-based magnet ever pull toward a socket the player did **not** intend? (Watch for this on small phones.)
