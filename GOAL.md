# SNUG — THE GOAL

> **Read this first after any interruption** (tool timeout, new session, context reset). Start at §0, run the resume protocol in §9, then keep going. This file is the single source of truth for *what we are doing, why, how, and what "done" means*. **Update §0 at every milestone.**

**Paste-ready resume prompt** (for a new session, `/loop`, or any "goal" command):
```
Continue building Snug in /home/xrdpuser/Desktop/game_1. Read CLAUDE.md and GOAL.md (§0 first), verify the toolchain is green (§9),
then do the next unchecked item under NEXT ACTIONS and keep the Phase Loop (§4) going until a stop condition in §8 is reached.
Never mass-produce levels: every level gets an identity card (§5), passes the validator and the real-drag bot, and is reviewed by eye.
```

---

## 0 · STATUS & NEXT ACTIONS *(the only part that changes often)*

**Last updated:** 2026-11-14, Pass 02 v2 (originality pass) written; Phase 2 build starting with B0 (the feel layer).

| Layer | State |
| --- | --- |
| Design: GDD (index + 10 chapters), Pass 01, Pass 02 | Written (`docs/`) |
| Engine + feel stack (cable physics, plug state machine, magnet, seat, light, audio, haptics, UI) | **Built, verified headlessly** |
| Act 1 · The Desk (levels 1–10) | **Built.** Validator green, 54 rule tests, real-drag bot completes all 10, UI flow + touch + feel probes pass |
| Act 2 · Workshop & Kitchen (11–20) | **Redesigned as an originality pass (v2)** in `docs/passes/pass-02-levels-11-20.md`; **being built now** (see §0 B) |
| Acts 3–5 (21–50) | **Seeds only** (§6): each still needs its own deep pass before it is built |
| Meta layer (House Map, postcards, cast cards, skins, daily…) | Designed in `docs/gdd/08-hook-and-retention.md`; **not built** (level select is a plain grid) |

**Owed to the user (cannot be verified here):** a phone session. Real *feel* (weight, lag, snap), haptics, speakers, iOS audio/vibration, GPU frame rate, and a human reading of the squint/joker/pattern cues. Questions to answer are in Pass 01 §6 and Pass 02 §7.

### NEXT ACTIONS *(in order; tick when done; append anything discovered)*

**A · Carried over from Phase 1 (do alongside Phase 2; none blocks it)**
- [ ] **A0.** Ask the user to approve `git init` + one commit per phase. *The project has no version control; for a 50-level haul that is the biggest risk.* (Do not init/commit unasked.)
- [ ] **A1.** *(user)* Phone session → answer Pass 01 §6 → send tuned numbers (tuning panel **Copy**) → bake them into `src/tune.js`. Do not wait for it; keep building.
- [ ] **A2.** Strengthen **Level 4**'s aha (rainbow-joker reads weakly: `p_luck 0.59`, waived). Redesign via search so a real trap exists without a waiver, or fold the joker lesson into a better level in the same slot.
- [ ] **A3.** Decide whether Level 10's **Tidy** star should be attainable (nudge hint) or stay unpromised (currently unpromised).
- [ ] **A4.** Wire stored-but-unused features: show the level **caption** as a handwritten postcard card on the Wake; `settings.leftHand` (mirror the finger offset) and haptic intensity UI; hint tier 2 ("show me why"); "skip with a postcard".
- [ ] **A5.** PWA: icons (manifest has none), optional service worker (needs https/localhost).
- [ ] **A6.** iOS silent-switch audio keep-alive trick (documented in chapter 04 §10.4, **not implemented**).
- [ ] **A7.** Extend **pattern mode** (currently plug bodies only) to sockets/devices; verify by screenshot.
- [ ] **A8.** Cosmetic: a few resting arcs bulge past the mat edge (levels 2, 4, 5). Tune rests/curl or shorten more.
- [ ] **A9.** Turn `tools/search-level.js` (hard-coded `l6`/`l10` templates) into a template-per-mechanic tool; Phase 2 needs it.

**B · Phase 2 v2 (levels 11–20)**, per `docs/passes/pass-02-levels-11-20.md` §5; each step = toy/engine + rules + solver/validator + bot + art + audio + level + screenshots; keep everything green:
- [ ] **B0 Feel layer** (touches Act 1 too): dynamic thunk · material worlds · stereo · cables-as-strings (strum/pluck) · tension creak · plug lean + neighbour wobble · cable-contact tock · per-device wake voices.
- [ ] B1 **L11 Slide** (rail; kinematic strips; drill; steel world) · B2 **L12 Fairy Lights** (hoops, route-through) · B3 **L13 Stereo** (shared Y-plug) · B4 **L14 Tape It** (mend gesture) · B5 **L15 Pegboard Wall** (daisy chain).
- [ ] B6 **L16 Puddle** (dryer + wet) · B7 **L17 Lazy Susan** (turntable + winding) · B8 **L18 Egg Timer** (timers) · B9 **L19 Midnight Snack** (dark, radar, quiet hands, sleeping cat) · B10 **L20 Breakfast for Twelve** (boss, agents, sunrise).
- [ ] B11 **Hooks:** postcards (captions on the Wake + an album), the **House Map** level select, cable **skins** and **chime sets** unlocked by stars/secrets.
- [ ] B12 Phase 2 acceptance gate (§7) + as-built notes → **B13 write Pass 03** (Toy Room & Studio).

**C–F · Phases 3, 4, 5, long tail:** repeat the Phase Loop (§4) per act using the seeds in §6.

### Open decisions that need the user *(everything else I decide and log in `docs/GDD.md`)*
1. `git init` + per-phase commits (A0).
2. Whether the boss should promise Tidy (A3).
3. Any change of identity: the view (top-down vs a side-on skin), tone, title ("Snug" is a working title), or anything touching monetization.
4. Deleting or overwriting the old draft `Plug-It-In-GDD.md` (left untouched on purpose; it was open in an editor).

---

## 1 · Mission and end state

**Mission.** Make **Snug**: a portrait HTML mobile puzzle game about carrying plugs, on cables with real weight and real length, to sockets that wake sleeping devices, until every room glows. Where it ends up is a **50+ level game in which every level has its own form, soul and creative identity** (§5), wrapped in a meta layer that makes players say *"just one more level"*, with the tactile feel of the plug **never** compromised.

**End state (what "done" looks like), whole game:**
- 50 levels, each with a completed identity card, validated, bot-solvable with real drags, and reviewed by eye.
- The click is perfect on real phones (the Click Test passes with strangers: ≥ 4 of 5 replay a plug-in "for no reason").
- The seven loops of `docs/gdd/08-hook-and-retention.md` exist: touch, wake, solve, finish, settle→swap, collect (House Map, postcards, cast, skins, secrets), ritual (daily, fidget).
- Acts 1–5 plus an open-ended long tail (daily, Zen, seasonal, wild worlds).
- The docs tell the truth: every pass has as-built notes; decisions are logged; nothing claimed that wasn't verified.

**Where the game's soul lives** (never trade these away): *the thunk is the product*; the cable is a character; rooms wake up (progress is light and a chord you composed); gentle always (no timers that fail, no lives, free undo); surprise lives in the cracks.

---

## 2 · The founding brief *(the user's words, verbatim; this is the contract)*

```
I want to build an HTML mobile puzzle game with a level-based progression vibe, similar to the reference screenshot (connecting cables to power up all the phones).

Right now, my #1 goal is nailing the smallest playable core loop first. The tactile feel—the snap and weight of plugging things in, the cable physics and texture, the overall polish, layout, and visual aesthetic—has to be spot-on. What's in the reference screenshot is just a super rough prototype. Game feel and immersion come first; expanding gameplay variety comes second.

Looking ahead, I'm picturing 50+ levels. Mechanics like color-coding, 2- vs. 3-socket strips, cable reach limits or spatial blocking, whether wires can cross or overlap, damaged cables, and so on are just starting points for puzzle twists—treat them as open springboards to spark way wilder ideas, not a fixed checklist. Not every mechanic has to appear in every level; we can mix and match freely. It doesn't even have to stay static—pieces could move, rotate, or come alive, right? Even better, let your imagination run free and pull in unexpected elements or blend in mechanics from completely different game genres instead of sticking to just this one setup.

About the draft doc already sitting in this project folder: it came from an earlier session and is just a super short, ~300-line rough version—nowhere near deep or imaginative enough. I want you to build way beyond that mediocre baseline into something much grander, richer, and way more fun. Here's how we should work: first, pour real creative energy into crafting a genuinely thorough, deeply imagined GDD before touching code, and once that GDD is solid, go straight into executing it without stopping. When shaping the doc, intentionally keep plenty of open creative space—not meaning "leave it for later," but keeping things open-ended so you have room to associate freely, brainstorm wildly, and never treat a few bullet points as the ceiling. Visualize what the moment-to-moment play actually feels like, and even though monetization isn't on our radar right now, think deeply about what makes it genuinely addictive—satisfying feedback loops, clever progression rewards, surprise twists, fresh mechanics, whatever keeps players saying "just one more level."

Crucially, do NOT try to design or build all 50+ levels in one shot—cranking everything out at once inevitably turns into watered-down, mediocre filler. Instead, sketch a loose big-picture arc, then build this out phase by phase so every single stage is crafted to its absolute fullest. For example, deeply design the core experience and the first 10 levels first, execute straight from that plan, and then—as you build and feel how the difficulty curve evolves—write a fresh, expanded design pass for the next 10 levels. Stay flexible with those 10-level milestones (or iterate section by section) while constantly brainstorming new mechanics on the fly. Just watch out for one trap: once you jump into coding, don't get bogged down in technical details and let the game lose its taste, personality, and fun. Keep everything open-ended, stretch your imagination to the limit, and pack in tons of rich, playful details to pull players in and keep them hooked.
```

**`/goal` directive (2026-11-14, session-scoped hook):** *push creativity to the absolute limit and hone every detail, especially the tactile game feel, what hooks players, and above all the gameplay mechanics; reveal genuinely original new layers and dimensions so every level feels like a brand-new world; keep pushing hard until finished. **Do not launch subagents.***

**Follow-up (2026-11-14), also the user's intent:** *this is a long haul: 50 levels, each demanding fresh creativity pushed to its absolute peak, each with its own distinct form, soul and creative identity. Create a persistent goal that keeps driving everything forward so an interruption never costs momentum.*

*(Note: the reference screenshot has never been visible to me. If it is ever added to the folder, compare layout, proportions and palette against it and log any divergence in `docs/GDD.md`.)*

---

## 3 · What the brief means in practice *(the ten principles)*

1. **Feel first, variety second.** Every change is judged by the Click Test and the feel acceptance tests (`docs/gdd/04-feel-bible.md` §15). If a mechanic makes the plug under the finger feel less like a physical object, it is wrong, however clever.
2. **The smallest playable loop is sacred.** New physical objects (rails, pegs, clips, belts…) are born as **toy rooms** with no goal and must be delightful on their own before they get a puzzle.
3. **GDD before code, per phase.** Each phase opens with a fresh, *expanded* design pass written after playing the previous one, keeping real **open water** (associative, unfinished-on-purpose space) in it.
4. **Phase by phase, never mass-produced.** ~10 levels per phase (milestones flexible). A level is not built until its card (§5) exists. Filler is the enemy.
5. **Mechanics are springboards.** Mix freely; let pieces move, rotate, come alive; borrow from other genres; invent on the fly. Record every idea (`docs/gdd/06-idea-garden.md`, `docs/gdd/07-crossovers-and-set-pieces.md`) so nothing is lost.
6. **Don't let engineering eat the soul.** Personality is a requirement, not polish: every level gets cast, decor, a wake-up gag, a sound twist, a secret, a caption. Keep the engine boring and the game charming.
7. **Make "one more level" true.** Five-to-seven loops (chapter 08), a surprise budget, reward ladders that never gate the puzzles. (Monetization is out of scope.)
8. **Moment-to-moment is the unit of design.** Visualize and narrate the thumb's experience second by second (as in chapter 03).
9. **Respect the user's files.** The old draft stays untouched unless they say otherwise.
10. **Be honest.** Separate *verified here* from *needs a phone*. A gate that is waived is waived out loud, with a reason.

---

## 4 · The Phase Loop *(run per ~10 levels; each step has an exit check)*

| # | Step | Exit check |
| --- | --- | --- |
| 1 | **Debrief.** Read the previous pass's "Questions to answer by playing", the user's phone notes (if any), and the as-built notes. List what surprised us. | A short "what we learned" list exists in the new pass |
| 2 | **Write the fresh Pass N**: deepen the act's theme, brainstorm *wildly* (use the creativity ritual, §5), pick, and write identity cards + the moment-to-moment feel for each level. Keep open water. | `docs/passes/pass-0N-…md` complete; every level has a card; weakest ideas cut |
| 3 | **Toy rooms** for every new physical object/agent/physics mode (Click Test, no goal). Add each to the regression harness. | Delightful alone; rest stability / inextensibility / reach probes still pass |
| 4 | **Engine + rules + tools** for the act's mechanics: rules module, solver mode (`static` vs `simulate`), validator checks, search template, bot actions. | `tools/test-rules.js` + `tools/validate-levels.js` green with new cases |
| 5 | **Generate candidates** with `tools/search-level.js` (solver-as-muse); **curate by taste**, then hand-polish composition. | One chosen layout per level; the aha confirmed by the solver's trap structure |
| 6 | **Personality pass** per level: cast cameo, decor set, wake-up gag, sound twist, haptic, secret, caption, teaser for the next level. | Identity card checklist (§5) complete |
| 7 | **Verify.** Validator, rules tests, **bot with real drags on *all* levels so far**, UI flow, feel probes, console clean, screenshots at 4 viewports, audio render hygiene. | All gates in §7 pass |
| 8 | **Review by eye.** Does each level read at a glance, have one focal point, and have a lit room worth a postcard? Would a player tell a friend about it? | Honest yes, or redesign |
| 9 | **Document.** As-built notes in the pass, decisions log (`docs/GDD.md`), README/tools, **this file's §0**, memory. | Docs match the code |
| 10 | **Hand off for feel.** Summarize what was verified vs owed; ask the user for a phone session *and keep going* (the next pass does not wait for it unless a stop condition fires). | Report is honest and brief |
| 11 | **Loop.** Start Pass N+1 at step 1. | A next action exists in §0 |

*An end-of-block rule:* never end a work block with the validator or tests red, or §0 stale.

---

## 5 · The Level Identity Standard *(how every one of 50 levels earns its own form, soul and creative identity)*

**Form** = what the level *looks and composes like*: silhouette and layout, the room, light and palette, the signature object, the shape of the thumb's journey.
**Soul** = what the level *feels like*: one emotional note (hush, tension, release, mischief, awe, tenderness…), the cast's mood, the sound world, the pace.
**Identity** = what a player would *tell a friend*: one aha, one surprise, one image they'd draw from memory.

### The identity card *(copy into the pass doc for every level; a level without a complete card is not built)*
```
Level N · "Title"                       Act/World · time of day · mood
Aha (one sentence, discoverable from what is on screen):
Signature object (the thing you'd draw from memory):
Soul (one feeling, one line) + cast:
Form (composition sketch, focal point, palette/light, decor set):
Thumb's journey (what the first 20 seconds feel like):
The trap (the first obvious move, and how it teaches):
Surprise / delight budget (≥ 3 tiny delights + 1 "wow"):
Wake-up gag (the payoff animation unique to this room):
Sound twist (one new voice or one changed sound):
Secret · Postcard caption · Teaser of the next level:
Validator targets (class, p_luck, solutions, par) · Bot expectations:
```

### The distinctness test *(run against the previous five levels and the next five seeds)*
Compare on nine axes: **layout silhouette · palette & light · signature object · sound voice · mechanic combination · aha type · pace/solve time · emotional beat · cast**. A level must differ from *each* of its five neighbors on **at least three** axes, and its **signature object, aha type and surprise must be unique within its act**. Fail → redesign, not retouch.

### The creativity ritual *(use it for every card; the long haul is won here)*
1. **Collide** one primitive (plug, cable, socket, strip, device, surface, obstacle, agent, source) × one verb (hide, reveal, delay, repeat, mirror, merge, split, swap, grow, shrink, sing, sleep, steal, carry) × one genre (rhythm, Sokoban, nonogram, cooking, stealth, tower defense, platformer, escape room…).
2. Write **ten** level seeds from that collision, including at least three *weird* ones. Keep the one that is both **surprising and clear**; log the rest in the Idea Garden (`docs/gdd/06-idea-garden.md`).
3. Name the **signature object** and the **one sound you'd hum** before anything else.
4. **Kill-your-darlings question:** *"What would a player tell a friend about this level?"* If there is no answer, redesign.
5. **Violate one habit** from the last five levels on purpose (a new rhythm, a new silence, a new scale of room).
6. End by writing the **teaser**: the strange new object glimpsed as this table slides away.

### Anti-filler rules *(hard)*
- No level exists merely to be "number N" or to add difficulty. Each has a reason to exist.
- No level solved by random dragging beyond Act 1's teaching levels (validator `p_luck` classes).
- No two adjacent levels share a signature object, an aha type, or a surprise.
- No level skips the personality pass; "mechanically fine" is not done.
- No level ships on the validator alone: the bot *and* a screenshot review are required.
- Waivers are explicit (`waive:`), justified in the card, and rare.

### Act 1 identity audit *(proof the standard is real; honest verdicts)*
| # | Signature object | Soul | Sound | Surprise | Verdict |
| --- | --- | --- | --- | --- | --- |
| 1 | the dangling plug, the lamp that clicks on | hush → first light | marimba, a clock | the phone's eyes follow your finger | strong |
| 2 | a coral/sky cable pair | companionship (a duet) | chime ladder | "tidy?" | soft |
| 3 | the staircase of grommets | the tension of a short leash | twang | the cable says no | strong |
| 4 | the rainbow joker ring | tidy sorting | match clicks | the odd coral out | **weak: fix (A2)** |
| 5 | the rocker switch, Big Sleepy's yawn | release, delayed payoff | clack + run | the cascade | strong |
| 6 | the book wall | wry detective calm | tock at contact | route vs distance | good |
| 7 | the power bricks | crunchy packing | heavy thunk | fat footprints | **best** |
| 8 | the sooty socket + a cat's tail | a story beat, dark humor | zap, thump, silence | the Power Cut | strong |
| 9 | the tangle and its comb | untangling contentment | zaps → hush | a free socket is a workspace | strong |
| 10 | Rex under a cloth + the cat | warm triumph | jazz riff, purr | the cheeky unplug | strong |

---

## 6 · The creative ledger: levels 1–50 *(seeds are promises, not specs)*

Levels 1–10 are built; 11–20 are designed (Pass 02); **21–50 are one-line seeds** that each get a full, fresh pass *before* they are built, and any seed may be replaced by a better idea (the replaced idea goes to `docs/gdd/06-idea-garden.md`). Seeds exist only so no two levels collapse into the same thing.

| # | Working title | New thing · signature object | Soul / identity hook |
| --- | --- | --- | --- |
| **Act 1 · The Desk (built)** | | | |
| 1–10 | Hello, Pip · Duet · Short Leash · Colour Code · Flip It · Read the Room · Fat Bricks · Burnt Out · Tidy Up · Morning Rush | see Pass 01 | dawn to golden morning |
| **Act 2 · Workshop & Kitchen (designed)** | | | |
| 11 | Slide | **push the power**: a strip on a rail with detents · the ridged steel strip | heft: the power comes to the devices |
| 12 | Fairy Lights | **thread** the cable through glass-bulb hoops · the bulbs | delicate craft; the cable *is* the string |
| 13 | Stereo | **one plug, two cables** (Y-plug) · Lefty & Righty, panned chimes | playful companionship; a Venn diagram of reach |
| 14 | Tape It | **mend** frayed cables/sockets with a limited roll of tape · the scribble-wrap | tenderness; scarcity |
| 15 | The Pegboard Wall | daisy chain: **power the powerer** · the wave of light | workshop pride; a wall floods warm |
| 16 | Puddle | a device that **helps another** (the hair dryer dries a wet socket) | curious wonder; cause and effect |
| 17 | Lazy Susan | **spin** a turntable; the cables **wind** around the hub | mesmerizing spin; a dinner party |
| 18 | Egg Timer | plug **on the tick** · filling rings; the kettle as metronome | cozy rhythm breather |
| 19 | Midnight Snack | the plug is a **flashlight**, sockets **hum**, softness is volume · a sleeping cat | hush and tenderness |
| 20 | Breakfast for Twelve | boss: layers + Biscuit awake · launched toast · **sunrise** | warm chaos; a train whistle teaser |
| **Act 3 · Toy Room (seeds)** | | | |
| 21 | Snail Mail | a snail carrying a strip on its shell | patience; the funniest slow solve |
| 22 | All Aboard | a toy train with a socket wagon, a signal lever | nostalgic clatter; the whistle from level 20 |
| 23 | Taxi! | a robot vacuum carrying a strip; docks each lap | a dutiful little robot; its dotted path |
| 24 | Wind-Up Parade | tin toys that carry plugs; a *twist* gesture | clattering joy; a new verb |
| 25 | Biscuit's Sunbeam | the cat as a full mechanic; a drifting sunbeam | domestic comedy; time of day made visible |
| **Act 3 · Studio (seeds)** | | | |
| 26 | Order Up | boot-order gate; chalk dependency arrows | backstage hush |
| 27 | First Four Notes | Simon melody by plug order | music-box purity: devices as instruments |
| 28 | Bass Drop | speaker bass shakes plugs loose | club tremor; ripples on the mat |
| 29 | On the Beat | pulsing sockets; optional on-the-beat plugging | groove; sockets as drum pads |
| 30 | Jam Session *(boss)* | melody + belt + bass; the band wakes | concert triumph; every device applauds |
| **Act 4 · Space Station (seeds)** | | | |
| 31 | Float | zero-g toy: flick plugs and they drift | serene weightlessness |
| 32 | Docking | low-speed capture; magnet rings | precision calm |
| 33 | Stretch | rubber cables that sling plugs | playful twang; arc previews |
| 34 | Magnet Moon | metal rails, decoy paperclips, peel | curious science |
| 35 | Orbital Repair *(set piece)* | eight devices; Earth rises as the station wakes | awe; the biggest cascade yet |
| **Act 4 · The Wall (seeds)** | | | |
| 36 | Hang Time | gravity returns: cables sag (side-on view) | relief of weight; a total camera change |
| 37 | Swing & Plug | pendulum release timing | trapeze joy |
| 38 | Lanes | cable lanes in a server rack | cable-management ASMR |
| 39 | Patch Panel | two-ended patch cords; brass jacks | the vintage operator |
| 40 | The Server Hall *(boss)* | cable management as art; light rivers | quiet awe; a maintenance robot's trolley |
| **Act 5 · Lab (seeds)** | | | |
| 41 | Fan Mail | wake the fan; wind carries a plug across a gap | whimsy; ribbons on the fan |
| 42 | Torchlight | a dark room; aim the lamp to reveal sockets | candle-lit mystery |
| 43 | Crane Game | electromagnet crane lifts the blocker | arcade clunk |
| 44 | Ghost Cables | your last attempt haunts as "hot" cables | eerie-friendly |
| 45 | Mirror, Mirror | a mirrored room; moves are twinned | elegant symmetry |
| **Act 5 · City (seeds)** | | | |
| 46 | Dollhouse | recursion: solve the miniature to power the real room | wonder; the zoom |
| 47 | Rewind | time scrub as a verb | gentle magic; tape-reel sound |
| 48 | Duet With Yourself | record 8 s; your ghost holds the strip | collaboration with yourself |
| 49 | Brownout | the Power Cut, reprised on a city block | dramatic callback |
| 50 | Blackout *(finale)* | power the skyline; every room you solved is a lit window; the credits are a cable through them all | the biggest payoff: *wake the world* |

**Beyond 50 (the long tail):** wild worlds (Haunted House, Greenhouse, Underwater, Circus, Candy Land, the Sleepover), seasonal micro-worlds (the string-light Tree), the daily **Morning Plug**, a Zen sandbox, Boss Rush, ghosted friend runs. See `docs/gdd/06-idea-garden.md`, `07-crossovers-and-set-pieces.md`, `08-hook-and-retention.md`.

**Engine roadmap by phase:** 2 kinematic strips (rail, turntable) · hoops/route-through · shared plug · mend/tape · daisy chains · tool devices + wet zones · timers · dark/radar/quiet + sleeper agent · agents. 3 moving sockets · order gates · melody/rhythm systems. 4 zero-g mode · gravity/side-on · stretch/magnet · two-ended cables. 5 chain reactions · replay/ghosts (deterministic input log) · mirror · nested scenes · time scrub · self-duet. Meta alongside: House Map, postcards, cast cards, skins, chime sets, daily.

---

## 7 · Quality gates

**Per level (all required):**
- [ ] Identity card complete (§5); distinctness test passed; aha written in one sentence.
- [ ] Validator: solvable, layout clean, resting arcs fit, reach margins, `p_luck` within class, tidy feasible *if promised*, par correct (waivers explicit).
- [ ] **Bot** completes it with real drags and earns the promised stars.
- [ ] Screenshots at 4 viewports reviewed: readable at a glance, one focal point, a lit room worth a postcard.
- [ ] Feel regression: rest stability 0, cable ≤ 1.03 L, reach honesty, release→contact 90–130 ms, no jams/drift.
- [ ] New sounds render clean (no clipping/NaN); every sound and haptic has a visual equivalent.
- [ ] Accessibility: nothing color-only; reduce-motion and pattern modes behave.
- [ ] Console clean; docs updated.

**Per phase:** all levels so far still pass the bot · UI flow and touch tests pass · as-built notes written · decisions logged · a phone-session question list handed to the user · **the next pass written**.

**Whole game:** the end state in §1, including a Click Test and a phone performance check *run by the user*.

---

## 8 · Standing orders

**Momentum.** Within a phase, do not stop between design → toys → levels → verification → docs. Between phases, continue automatically (write the next pass, start its toys) unless a stop condition fires. Always leave §0 and memory current. If a tool call times out, resume from §0, do not restart.

**Ask the user only for:** (1) real-device feel verdicts and tuning; (2) forks that change the game's identity (view, tone, title, monetization); (3) deleting or overwriting the user's own files; (4) anything outward-facing or irreversible (publishing/sharing, global installs, spending, `git init`/commits/pushes); (5) conflicting instructions. Everything else: decide, log it, move on.

**Never:** launch subagents (user directive, 2026-11-14) · mass-produce levels · ship a level without its card, the bot and an eye review · add a build step or dependencies to the game without asking · weaken a gate to make something pass · claim verification that did not happen · touch `Plug-It-In-GDD.md`.

**Stop conditions:** (a) the §1 end state is reached and verified; (b) the user says stop; (c) only blocked on a user-only decision *and* no other productive work remains (then say exactly what is needed).

---

## 9 · Resume protocol and timeout resilience

**On resume (every time):**
1. Read `CLAUDE.md`, this file's §0, and the latest `docs/passes/*.md`.
2. `node tools/test-rules.js && node tools/validate-levels.js` must be green. If red, fix first.
3. Serve and regress when needed: `python3 -m http.server 8123 --bind 127.0.0.1` (background), then `cd tools/playtest && npm install && node bot.mjs` (~5 min; background it).
4. Take the next unchecked item in §0 and go.

**Staying alive through timeouts (learned the hard way):**
- Anything over ~2 minutes runs **in the background with output to a file**; poll with a bounded loop (`until grep -q DONE file; do sleep 3; done`). Never pipe a long run into `tail` (it buffers everything until exit).
- **Never `pkill -f "<text that appears in your own command line>"`**: it kills your own shell. Use the bracket trick (`pgrep -f "[h]ttp.server 8123"`).
- Write results to disk early; keep each foreground call under ~10 minutes; end blocks green and documented.
- The scratchpad is disposable; the harness lives in `tools/playtest/` (README inside).
- The project has **no version control** (see A0); until that is approved, avoid risky bulk rewrites without a plan to undo them.

---

## 10 · Map of the project *(details in `README.md` and `docs/GDD.md`)*

- **Game:** `index.html`, `style.css`, `src/` (`util, tune, geom, rope, rules` run in Node too; `audio, haptics, fx, art, art-devices, finale, save, room, game, ui, main`; `src/levels/world1.js`).
- **Tools:** `tools/validate-levels.js` · `tools/test-rules.js` · `tools/search-level.js` (solver-as-muse) · `tools/auto-rest.js` · `tools/playtest/` (bot, flow, feel, touch, audio render, finale shots; README inside).
- **Docs:** `docs/GDD.md` (index, decisions D-01…D-14, glossary, status) · `docs/gdd/01-north-star.md` … `10-tech-and-build-plan.md` · `docs/passes/pass-01…`, `pass-02…` · `docs/audio/sfx-sampler.wav`.
- **Hard-won engineering rules (don't relearn):** no curl bias · bend smoothing only while carried/taut (never at rest) · invalidate the cached settle-arc on re-seat · resting arcs must fit the stage · the magnet follows the *aim* point · brick hit areas must not steal switch taps · reach is a puzzle *between strips*, not between adjacent slots · judge Tidy on settled arcs.
- **Vocabulary:** `docs/GDD.md` glossary (device, plug, socket, strip, reach, seat, the Wake/Settle/Swap, Lit/Tidy/Clean, open water).

*Closing north star:* **the thunk is the product, the puzzle earns the next thunk, and every one of the fifty rooms should be something a player tells a friend about.**
