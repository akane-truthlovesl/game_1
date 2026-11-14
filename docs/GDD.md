# SNUG — Game Design Document

> *Every room starts asleep. You plug it awake.*

**Status:** Phase 0 (design) and Phase 1 (core feel stack + Act 1, levels 1–10) are **done**; Pass 02 (levels 11–20) is **designed, not built**. Written 2026-11-14.
**Working title:** **Snug** (a plug that fits *snug*; a room that feels snug). The earlier draft called it *Plug It In*. The title lives in one constant; rename freely.
**Platform:** portrait HTML5 for phones (works with a mouse on desktop), one thumb, sound optional, haptics a bonus.

This document supersedes the ~300-line draft `Plug-It-In-GDD.md` (left untouched in the project root because it was open in an editor when this work began). Nothing in the draft was thrown away blindly: the good bones (Verlet cable, magnet/snap numbers, juice checklist, modular mechanics, levels-as-data, validator) are all carried forward, then pushed much further.

---

## How these documents are organised

The GDD is split into chapters so each one can go deep. Read in order the first time; afterwards jump around.

| # | Chapter | What it answers |
| --- | --- | --- |
| 01 | [North Star](gdd/01-north-star.md) | What is the feeling? What do we refuse to compromise on? |
| 02 | [World, Cast & Voice](gdd/02-world-cast-voice.md) | What does it look, sound and *behave* like? Who lives in the room? |
| 03 | [The Core Loop](gdd/03-core-loop.md) | What happens, second by second, under the thumb? |
| 04 | [The Feel Bible](gdd/04-feel-bible.md) | The numbers and recipes: cable, plug, snap, sound, haptics, juice. |
| 05 | [Rules of the Room](gdd/05-rules-of-the-room.md) | The formal model that lets any mechanic combine with any other, and the validator that keeps levels honest. |
| 06 | [The Idea Garden](gdd/06-idea-garden.md) | ~120 mechanic seeds. Deliberately a springboard, not a checklist. |
| 07 | [Crossovers & Set Pieces](gdd/07-crossovers-and-set-pieces.md) | Genre transplants, living agents, rule-breaking worlds, bosses. |
| 08 | [Hook & Retention](gdd/08-hook-and-retention.md) | Why "one more level"? Loops, rewards, surprise budget, collection. |
| 09 | [The Arc](gdd/09-the-arc.md) | The loose 50+ level shape, pacing, and how we grow it ten levels at a time. |
| 10 | [Tech & Build Plan](gdd/10-tech-and-build-plan.md) | Architecture, performance, testing, build order, risks. |
| P1 | [Pass 01 · Levels 1–10](passes/pass-01-levels-01-10.md) | Act 1 designed level by level: layouts, ahas, traps, feel beats. |

Later passes (written *after* the previous one is built and played, because difficulty is felt, not predicted):

| P2 | [Pass 02 · Levels 11–20](passes/pass-02-levels-11-20.md) | Workshop & Kitchen, informed by what building Phase 1 taught us. **Designed, not built.** |
| --- | --- | --- |

Project root: [`README.md`](../README.md) (how to run) · `tools/` (validator, search, tests) · `docs/audio/sfx-sampler.wav` (hear the feel).

---

## The game in sixty seconds

You see a small, warm, dimly lit desk from above. Phones lie dead on it, each with a cable that ends in a plug. A power strip waits nearby. You pick a plug up with your thumb. It has *weight*. The cable drags behind it like a real cable on a real desk. You carry it to a socket, the socket's rim wakes up as you approach, the plug leans in on its own, you let go, and it slides home with a short, firm, perfectly pitched **thunk**. A pulse of light races down the cable and the phone wakes up: two eyes pop open, the screen blooms, the battery counts up, a chime sings one note of a tune. The room gets a little brighter.

Do that for every device and the whole room is glowing, every phone smiling, a chord ringing that *you* built note by note. Then the next room slides in under the camera, with one new strange object in it you want to understand.

That is it. The puzzle is the excuse to do the lovely thing again; the lovely thing is the reason the puzzle is worth solving.

## What makes it *this* game and not another cable game

1. **A physical cable you can trust.** Real length, real drag, real taut-and-twang. The cable is the teacher: it tells you "no" by physics, never by a buzzer.
2. **Devices with faces and feelings.** They watch your finger, squint when stretched, yawn awake. Personality in every pixel of the screen they sleep behind.
3. **The room is the progress bar.** Light is progress. Dim blue room → warm glowing diorama. The soundtrack is a chord assembled by your plugging.
4. **A rules sandbox that keeps growing.** Reach, keys, switches, bricks, dead sockets, tidy-ness, and then: moving rooms, cats, zero-g, chain reactions, time loops, rhythm. Cozy by default, wild by design.
5. **Gentle, always.** No timers, lives or fail screens. Undo is free. A wrong move is a small, funny knock, never a scolding.

---

## Decisions and assumptions log

Where the brief left a choice open, I decided so work could continue without stopping. Each decision has a reason and a "how to reverse" so you can overrule cheaply.

| ID | Decision | Why | To reverse |
| --- | --- | --- | --- |
| D-01 | **Top-down diorama**, soft shadows, light from upper-left. A later *Wall* world uses side-on gravity as a feature. | Top-down makes a cable on a desk friction-driven and stable, makes crossing/overlap/blocking readable, and keeps strips and obstacles easy to compose. The earlier draft asked "side-on wall?" and got no answer. | The sim has a `gravity` and `friction` parameter per level; a side-on skin is a render change plus level re-layout. |
| D-02 | **The reference screenshot was not visible to me** (not in the folder; the earlier session also could not see it). I designed from your description: *connect cables to power up phones*. | Honesty over guessing. | Drop the screenshot into the folder; I'll compare layout, proportions and palette against it. |
| D-03 | **Each device owns its cable**; you move the *plug end*. Loose cables, adapters and extension cords are later seeds. | Most readable for a first touch: "this phone's cable needs a home." | n/a (it is the base verb) |
| D-04 | **Compatibility uses color + shape glyph together** (5 keys + a universal "joker"). | Colorblind safety without a setting; glyph shapes also add a second readable cue at small sizes. | Keys are data; add/remove freely. |
| D-05 | **Crossing is physical and allowed** by default. It costs the *Tidy* star, and in specific levels it blocks the win (visible sparks where cables cross). | Forgiving by default, strict as a deliberate twist; gives a "tidy itch" that feeds replay. | Per-level `noCross` flag. |
| D-06 | **No fail state, no timers** in the base game. Time pressure only appears as soft, optional goals or world mechanics that cannot hard-fail. | Pillar 5. | n/a |
| D-07 | **All audio synthesized in the browser** (Web Audio); no sample files in Phase 1. | Zero load time, endless pitch variation, and the chord/melody system needs generative notes anyway. Samples can be layered in later. | Audio module is isolated behind an `sfx.*` API. |
| D-08 | **No build step.** Plain classic `<script>` files, works from `file://` and any static server. | Lowest friction for you to run and tweak; ES modules do not load over `file://`. | A bundler can be added later without changing source. |
| D-09 | **Levels are data**; one logical rules module shared by the game, the solver, the hint system and the validator. | A level the validator cannot solve never ships; hints come for free. | n/a |
| D-10 | **Phases of ~10 levels**, each preceded by a fresh design pass written after playing the previous phase. | Your brief. | Milestones are flexible; split or merge as the curve demands. |
| D-11 | **Old draft left in place, untouched.** | It was open in an editor (swap file present); overwriting it risked clobbering. | Delete it once you are happy with this set. |
| D-12 | **Tidy is judged on settled arcs.** Seated cables glide into nested arcs (one handedness per level, `settleCurl`); the solver counts crossings on those arcs. | Found while building: with random slack, "tidy" was unattainable by honest play. Settling makes Tidy a physical outcome and makes cables beautiful. | `relaxK = 0` in the tuning panel turns settling off. |
| D-13 | **The magnet follows the aim point** (finger + offset), not the lagging plug. | A thumb that stops over socket A must win even while a heavy brick is still catching up. | `findCandidate` in `room.js`. |
| D-14 | **Reach is a puzzle between strips, never between adjacent slots.** Generous levels waive the ambiguity check explicitly. | Distances to neighbouring sockets differ by a few percent; no cable length separates them cleanly. | `waive: ['ambiguousReach']` per level. |

---

## Glossary (terms used everywhere)

- **u** — design unit. The stage is **360 × 640 u**, scaled to the screen.
- **Device** — a sleeping thing that wants power (phone, lamp, laptop…). It has a **port** and owns one **cable**.
- **Plug** — the free end of a cable. It has a **key** (color+glyph, or universal) and a **size** (*slim* or *fat brick*).
- **Socket** — a hole that accepts a plug. Has a key (or is universal), may be **dead**, may be **covered** by a neighbor's brick.
- **Strip** — a row of sockets (a *power strip*); may have a **switch**. A **grommet** is a single desk socket.
- **Reach** — how far a cable can carry its plug (its length, measured *along the cable path*, so obstacles cost length).
- **Seat** — to insert a plug fully. **Seated / resting / held / hovering / refused** are plug states (chapter 03).
- **The Wake** — the level-complete cascade. **The Settle** — the few calm seconds of poking the lit room. **The Swap** — the transition to the next room.
- **Tidy / Lit / Clean** — the three stars: no cables crossing · everything powered · no plug ever pulled out.
- **Room chord** — the harmony that builds as devices power on.
- **Pass** — a design document for the next block of ~10 levels.
- **Open water** — a section at the end of each chapter that is *deliberately unfinished*: loose ideas to swim in while building. Not "later", just "not yet pinned down".

---

## Status board

| Phase | Scope | State |
| --- | --- | --- |
| 0 | This GDD + Pass 01 | Written |
| 1 | Core feel stack + Act 1 (levels 1–10) + validator + bot playtest | **Built and verified headlessly.** Owed: a real-phone feel/haptics/audio session. |
| 2 | Pass 02 design → levels 11–20 (Workshop + Kitchen) | **Designed** ([pass-02](passes/pass-02-levels-11-20.md)); build starts with toy rooms |
| 3+ | Acts 3–5, meta (house map, postcards, skins), daily | Sketched in chapter 09 |

*How to run it:* see the project [`README.md`](../README.md).
