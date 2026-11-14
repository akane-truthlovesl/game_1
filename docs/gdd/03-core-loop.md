# 03 · The Core Loop

What happens, second by second, under the thumb. This chapter is the *script* for the feel work in chapter 04.

---

## Five loops at five speeds

| Loop | Time scale | The player feels | Lever |
| --- | --- | --- | --- |
| **Touch** | ~1 s | A plug seats and it feels *great* | Feel Bible (04) |
| **Solve** | 15–90 s | The click of insight, "oh!" | One aha per level (05, Pass 01) |
| **Wake** | ~6 s | The room lights up in a chain | Win sequence + chord |
| **Settle → Swap** | ~5–10 s | Affection, curiosity about the next room | Toy time + teaser |
| **Session / Meta** | minutes → weeks | "One more", then a lit-up house, a postcard album, a cast of friends | Chapter 08 |

Each loop feeds the next. The Touch loop must be so good that it carries a trivial level; the Solve loop must be good enough to carry a plain-looking level.

---

## The micro-loop, moment by moment

*(All times are starting values; see 04 for the numbers.)*

### 0 · Idle
The room breathes. Standby LEDs pulse. Dead phones lie dim with a drifting *z*. Plugs rest on the desk, their cables slumped in believable curves. A socket rim breathes. Nothing is frozen; nothing is loud.

### 1 · Touch down on a plug
- Hit-test is generous (34 u) and prefers the nearest plug.
- The plug **lifts** toward you: scale +14% over ~90 ms with a little overshoot, shadow spreads and drifts down-right.
- A soft **pick-up tick** plays, a tiny haptic tap fires.
- The device **stirs**: one eye cracks, pupils slide to the plug.
- The plug is held by a point slightly *above* the fingertip (about 40 u up, 6 u left) so the thumb never covers what it is aiming at. The offset eases in over ~120 ms so it never feels like a jump.

### 2 · Drag
- The plug follows with ~55 ms of lag and a speed limit, so it has *weight* but never feels sluggish.
- The cable trails behind: slack lies on the desk with friction, the section near the plug straightens and slides, the rest stays put until the cable is pulled taut. A quiet **rustle** scales with cable speed.
- The device's eyes track the plug. The plug's nose rotates to point along the direction of travel.
- Compatible, free sockets get a *very* faint rim glow as you pass within ~90 u. No arrows, no text.

### 3 · Tautness (the cable says "no")
- As the cable straightens it visibly tightens: the highlight line brightens, the ribbing stretches, and the plug starts to **resist**.
- At the limit the plug stops; a gentle **twang** plays once; the device **squints** (strained face); the plug trembles ~1 px. The finger can keep going; the plug stays at the limit. No snapping, no sliding past.

### 4 · Near a socket (the magnet)
- Inside **44 u** of a free, compatible, live socket the plug **leans in**: position eases toward a pre-seat point a few units *before* the socket along its insertion axis, rotation aligns over ~80 ms, the socket rim lights, a tiny haptic tick marks the engagement.
- It is **forgiving**: the release zone is larger than the visible socket. The game assumes you meant it.
- Moving away past **54 u** releases the magnet (hysteresis so it never flutters).

### 5 · Release → seat
- The plug **slides in along its insertion axis** over ~110 ms with a **1–2 u overshoot** and a tiny squash (scale 1.14 → 0.96 → 1.0).
- At contact: **hit-stop** (35 ms freeze of simulation), a micro **camera nudge** (1.6 u), the strip **compresses** 3% and springs back, a crisp **thunk** plays, a medium haptic fires, a **ripple ring** expands on the mat, 8 **sparks** in the key color fly off.
- The cable gives a **one-bounce wobble** as it settles.

### 6 · Power
- A **pulse of light** races from the socket down the cable toward the device at ~1500 u/s (so ~150 ms for a typical cable).
- On arrival: the device **wakes** (its signature performance), its **chime** plays on the next scale step, its **pad voice** fades in, a warm **light pool** blooms on the mat, the ambient darkness lifts a notch.
- If the strip has a switch that is off, the device shows **standby** (an amber LED, a soft "bip") until the switch is flipped; flipping triggers the *whole strip's* cascade.

### 7 · The Wake (level complete)
When the last required device is powered (and any gates such as tidy-ness are satisfied):
1. A brief **beat of stillness** (180 ms) so the last chime lands alone.
2. A **cascade**: every device does a delighted hop in sequence, 140 ms apart, each ringing its chime again an octave up as a rising arpeggio.
3. A **chord blooms**: all pad voices swell; a shimmer rises; ambient noise opens to full brightness.
4. The **camera eases out** ~3% and back; **confetti sparks** run along every cable; dust motes drift in the lamp beam.
5. **Stars** pop in with soft chimes (Lit, Tidy, Clean), each with a different pitch and a little wobble.
6. After ~1.7 s a **Next** affordance glows near the thumb. Tapping anywhere also continues. Nothing times out.

### 8 · The Settle
The room is lit, the puzzle is solved, nothing is demanded. The player can **poke** things: devices react (jitter, giggle, hop), the lamp changes brightness, the mug puffs steam, the plant sways, a secret reveals itself. This is the emotional "exhale" and the best place to put easter eggs. It lasts as long as the player wants.

### 9 · The Swap
The current room slides away like a table being swapped under the camera, with the cables trailing (they are still simulated). The next room's objects **drop in with staggered soft bounces** (60 ms apart), each with a tiny thud. One *new thing* is visible and a little mysterious. No loading spinner: the level is built in the previous frame.

### 10 · Mistake (any time)
A wrong or invalid action is **never a buzzer.**
- **Invalid drop** (wrong key / blocked by a brick / dead socket): the plug politely **hops back** along a short arc (~180 ms), the cable whips once, a soft wooden **knock** plays, the device **winces**, the socket **flashes** a soft red shimmer for a dead one, or the neighboring brick *visibly* lights its footprint (so the reason is clear).
- **Out of reach:** see tautness (3). The cable explains it.
- **Dropped in empty space:** the plug just *lies there*, carrying a little of your release velocity so it slides a few units and settles. No penalty.

---

## State machines

### Plug

```
          touch              lift done          within 44u of valid socket
RESTING ─────────► GRABBED ───────────► DRAGGING ◄──────────────────────┐
   ▲                                       │  │                          │
   │ settle                                │  └──► HOVERING (engaged) ───┘ leave > 54u
   │                              release  │            │
   │                 in empty space       ▼            │ release
   └──────────────── DROPPING ◄───────────┘            ▼
   ▲                                              SEATING ──► SEATED
   │ bounce done                                       ▲          │
   └──────────── REFUSED ◄─ release over invalid ──────┘          │ drag > detent (12 u)
                                                                  ▼
                                                              UNSEATING ──► DRAGGING
```

| State | Visual | Sound | Haptic |
| --- | --- | --- | --- |
| RESTING | Lying, rotated by cable tension, small shadow | — | — |
| GRABBED | Lifts (scale+, shadow spreads) | pick-up *tick* | light tap |
| DRAGGING | Held offset above finger, nose points along travel | cable *rustle* | — |
| HOVERING | Leans + aligns to socket; socket rim glows | magnet *tick* | micro tick |
| SEATING | Slide + squash + overshoot | **thunk** at contact | medium thud |
| SEATED | Flush, tiny rim glow | — | — |
| UNSEATING | Resists, then pops free | **pop** | tick |
| REFUSED | Hop back, cable whip | wooden *knock* | double micro-pulse |
| DROPPING | Slides a little, settles | soft *plap* | — |

### Device

`ASLEEP → STIRRING (its plug touched) → ATTENTIVE (carried) ↔ STRAINED (taut) → AWAKE (powered) → DELIGHTED (level complete) → IDLE-AWAKE`; any state can go to `WINCE` (refused) or `POKED` (Settle tap). Unplugging an awake device runs a **power-down** (screen shrinks to a dot, falling glide) back to ASLEEP.

### Strip and socket

Sockets are `FREE | OCCUPIED | COVERED (by a brick footprint) | DEAD`. Strips are `OFF | ON` when they have a switch. A **trip** (later mechanics) is a transient `TRIPPED` state with a clack and sparks.

### Level

`ARRIVING (drop-in) → PLAYING → WAKING (win cascade) → SETTLING → SWAPPING → (next ARRIVING)`.

---

## The thumb

- **Primary gesture:** press on a plug, drag, release. That is 95% of the game.
- **Reach zones:** the bottom 20% of the screen belongs to the HUD and the thumb's resting arc; strips and resting plugs never sit there. The plug being carried floats above the finger so the thumb never occludes the socket.
- **Handedness:** the offset is mostly *vertical* (6 u left, 40 u up). It is symmetric enough for left and right thumbs; a setting can mirror the 6 u lean.
- **Secondary gestures (introduced one at a time):**

| Gesture | Target | Result | Introduced |
| --- | --- | --- | --- |
| Press + drag | Plug (resting or seated) | Pick up / unplug / carry | Level 1 |
| Tap | Strip switch | Toggle (satisfying rocker *clack*) | Level 5 |
| Tap | Device or decor | Poke (reaction, easter egg) | Level 1 (Settle) |
| Press + drag | Cable body (middle) | **Nudge** slack to tidy a crossing | Level 2 (hint), Level 9 (required) |
| Press and hold (~350 ms), no move | Plug or cable | **Trace**: highlight the whole cable and its device | Tangle levels |
| Two touches | Two plugs | Hold two at once | Act 3 two-hand levels |
| Tilt (optional) | Device | Gravity direction | Act 4 |

---

## What a miss feels like (taxonomy)

| Situation | What the player sees | Why this is kind |
| --- | --- | --- |
| Wrong key | Plug hovers, no glow, release → hop-back + knock; socket's glyph pulses to say "not me" | Glyph/color already told them; the knock is almost affectionate |
| Dead socket | Sooty socket spits a tiny spark; plug hops back; socket blackens a shade more | Memory aid without penalty |
| Blocked by a brick | The neighbor plug's *footprint* flashes over the covered socket | The *reason* is drawn on screen |
| Out of reach | Taut cable, squinting device, a twang | Physics explains |
| Strip switched off | Device shows an amber standby LED instead of waking | "Almost" is communicated, not failure |
| Plug dropped in empty space | Lies there, slides a bit | Nothing happened; try again |
| Crossing cables (no-cross level) | Blue sparks at the intersection | Visible, local, fixable by nudging |

---

## The first thirty seconds of the game (the first-run script)

1. **0 s** — Black. A single clock tick. A cable *thumps* from the top and swings, a plug dangling at the end of a looped lowercase "snug" in the dark. At the bottom a socket rim breathes.
2. **~2.5 s** — If untouched, a ghost fingertip fades up beside the plug and *taps* (ring), then holds. No words.
3. **First touch** — The plug lifts and rustles; the title cable straightens; the socket glows as it nears; the magnet leans the plug in.
4. **Release** — **Thunk.** The lamp clicks on; the title glows; a soft warm chord blooms; menu buttons ease in at the thumb.
5. **Tap Play** — The title desk slides away; Level 1 drops in: one phone, one socket, one plug. Same gesture, same reward, new character: **Pip**.

Total time to first reward: **< 15 seconds**, zero reading. The first *two* thunks have taught the entire core mechanic.

## The first five minutes (a script, not a promise)

| Time | Level | What the player learns | Reward |
| --- | --- | --- | --- |
| 0:00 | Title | Drag a plug into a socket | Lamp + chord |
| 0:20 | 1 Hello, Pip | A device wants power; its cable limits you gently | Room blooms |
| 0:45 | 2 Duet | Two devices, rising chime, *tidy* hint | Melody |
| 1:20 | 3 Short Leash | Cable length matters; the cable explains | First "oh!" |
| 2:30 | 4 Colour Code | Colors/glyphs are keys; jokers exist | Satisfying matches |
| 3:30 | 5 Flip It | Plug first, *then* a payoff switch | The first big cascade |
| 4:30 | 6 Read the Room | Space matters; obstacles cost cable (a book is a wall) | Room reveal |

By minute five the player has learned **reach, keys, switches and obstacles** without reading a word, and has been rewarded six times in six different ways.

---

## Two narrated plays

### Level 1 · "Hello, Pip" (a perfect first play)
A dim blue room fades in over 0.8 s. A clock ticks. Objects settle onto the desk with soft thuds: the mat, a strip with a single socket, Pip the phone, a mug, a lamp. Pip's screen is dark; a tiny *z* drifts up. Its cable lies in a lazy S, the plug resting at the end. The socket's rim breathes.

After 2.5 s of stillness a ghost finger fades up, taps the plug, and drags it in a gentle arc to the socket. The player's own thumb lands first. The plug lifts toward them; Pip cracks one eye. The cable rustles as the plug is carried; Pip's eyes follow. The socket rim brightens, the plug leans in, a tick. Release. The plug slides in, overshoots a hair, **thunk**; a hair of shake; ripple on the mat. A pulse of light runs down the cable. Pip's eyes pop, the screen blooms, 12% ticks up to 100%, a bell sings C. The lamp clicks. The room goes warm. Steam rises from the mug. A faint birdsong. Three stars pop in. A glowing arrow-less "next" pulse appears. Total: ~12 s.

### Level 7 · "Fat Bricks" (a mid-game moment)
A six-socket strip, two phones, a laptop and a game console. Boxy's brick plug is *large*: it follows the finger with noticeably more lag and a deeper rustle. The player lifts it toward the middle of the strip, hovers: the two neighboring sockets dim and a ghost footprint lights over them. "Oh — it covers its neighbors." They slide it toward the end of the strip: the footprint now covers only one neighbor and hangs off the edge. The socket lights; release; a heavy **thunk** (lower, longer), a stronger haptic. Boxy wakes with a scanning light and a fan whirr. Gus's brick goes to the other end. Two slim phones fit in the middle. The cascade is bigger than usual because the strip is fully packed: all six sockets are *used or covered*, a visibly perfect fit.

---

## Edge cases the loop must survive

- **Multi-touch:** each pointer owns at most one plug; a second pointer on the same plug is ignored; a pointer on another plug works (needed for two-hand levels).
- **`pointercancel` / lost capture:** treat as release at the last known position (safe drop).
- **App backgrounded mid-drag:** drop the plug, pause audio, resume exactly on return.
- **Orientation/resize:** re-fit the stage; never reload the level.
- **Plug dropped off-screen:** impossible; the plug is clamped to the stage plus margin.
- **Two plugs overlapping:** the topmost (last touched) wins; resting plugs are pushed apart gently so none ever becomes unreachable.
- **Very small screens (320 wide):** the stage scales; hit radii are specified in screen px minimums (never below 22 px effective).
- **Sound blocked:** first gesture unlocks audio; if still blocked the game plays on with visuals and haptics.

---

## Open water

- **A "fidget" mode:** a strip with endless sockets and a bucket of plugs to pop in and out for the sound and haptic only. A tiny *cozy toy* on the home screen: bubble wrap with a story.
- **What if the first plug you *ever* pull, the title one, remembers where you last left it?** The title screen is slightly different each time you return (dusk, dawn, rain).
- **Auto-tidy by gesture:** a two-finger "comb" swipe across a mess of cables gently straightens them (a toy and a mechanic).
- **Cable ASMR slider:** a settings toggle that raises the volume of the rustle/knock/thunk layer relative to chimes, for those who play with sound on and want it *tactile*.
- **A slow-motion replay of your last plug-in** as a lightbox on the postcard: the thunk in 0.25×. Brag-worthy and a nice way to test our own feel.
