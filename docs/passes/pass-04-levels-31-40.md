# Pass 04 · Act 4 — The Space Station & The Wall (levels 31–40) · **v1, written after building Act 3**

*Act 3 let the room move and sing. Act 4 lets it **float, stretch, swing and fall**. The first half is weightless: the station, where plugs drift, dock, sling and cling to metal, and the Earth comes up in the window. The second half is the wall: gravity comes back, the room is seen from the side, and the cables hang, swing, and find their way down lanes and patch panels. It ends with the server hall, a tidy cathedral of cable in which the maintenance robot's trolley does the boss's work.*

> Status: **designed, not built.** Written at the end of Phase 3 (`GOAL.md` §4, steps 1–2), after the Act 3 build and the Phase 3 regression. Nothing is binding until a card is complete (`GOAL.md` §5). Each card carries its engine cost, and the one change of *view* (the side-on wall) is a **user decision** (see §5), not a default.

---

## 1 · Debrief: what Act 3 taught (these shape this pass)

| What the build and the regression showed | Consequence for Act 4 |
| --- | --- |
| **Every new mechanic was a filter, not an engine rewrite.** The chain, the groove and the bass lock stacked on `Rules.power` and on the solver with no new rules (Level 30 is three of them at once). | Act 4 keeps that discipline: a new physics (drift, elastic, pendulum) is a *motion* module; the rules see only "seated / not seated, reach, order". |
| **Tidy is a geometry fact.** Crossing-free means the devices' left-to-right order matches the pad order; the bulge sign (`settleCurl`) decides whether long arcs cross. | Any layout with many long cables is designed with a scratch arc-crossing script before the level is drawn. |
| **Reach honesty costs length.** Eight sockets at 38 u need every cable to reach every socket at ratio ≤ 0.9, which makes long cables and rests far from their ports. | Anything that *flies* (drift, sling, pendulum) changes reach over time, so Act 4 needs a reach model for motion, not only for a resting cable. |
| **A rare effect drawn every frame cost 8 fps.** The groove's glow is now drawn only while it swells. | Zero-g and the wall's gravity are whole-scene effects. They are cheap only if they are computed once per plug, not per pixel. |
| **The bot found the grace trap and the twist order.** The bass lock needed a twist *inside* the grace (1.1 s); a bot that waited 0.9 s before twisting popped its own plugs. | Timing windows in Act 4 (the docking notch, the pendulum's bottom, the sling's apex) are *windows with a grace*, never a reflex test. |
| **Two of three probes failed on the test, not the level** (stale House Map numbers; a bot that never reached level 29). | The gate is a list of checks that each name what they measure; every new act updates its own expectations in the same change. |
| **The hints audit caught a silent bulb.** A hint type with no presentation looks like "nothing to do". | Every new hint verb (drift, dock, sling, swing, lane, patch) gets a bulb check on the day it lands. |
| **Players remember the sensory causes** (the lantern, the purr, the lullaby). | Each Act 4 level leads with a *thing that moves* and a *sound that changes with it*. |

---

## 2 · The shape of Act 4 (v1)

**The station (31–35)** is the weightless half: the first five levels each change one physical law, shown by a single object. Float removes gravity (the plugs drift). Docking adds a rotating hatch (the socket has a notch that comes round). Stretch makes the cable elastic. Magnet Moon makes the metal pull, with decoys. Orbital Repair is the set piece: eight devices and the Earth rising, the biggest cascade in the game.

**The wall (36–40)** is the gravity half: 36 brings gravity back as a *view change* (the side-on wall, a user decision), 37 hangs the plug from a pendulum, 38 makes the cables run down lanes, 39 gives cables two ends, and 40 is the server hall, where the robot's trolley lays the cables out and the lights run along them.

**Distinctness, neighbours first.** Float (drift, bright white station, Biscuit in a sleeping bag) and Docking (a precise notch, a ring of blue light) share an act and a palette, so Docking is the one *quiet* level (a slow metronome, no drift) and Float is the one with no floor. Stretch is the only level where a plug flies in an arc you can *see* before you throw it. Magnet Moon is the only one where the plug can be wrong in a way that feels right (a paperclip is metal too). Orbital Repair is the only set piece in the act (eight devices, a rising planet). Hang Time is the only level that changes the camera. Swing & Plug is the only one whose timing is a *motion*, not a window on a still room. Lanes is the only one where the cable's route, not its end, is the puzzle. Patch Panel is the only one with two-ended cords. The Server Hall is the only boss that is a *machine* (the trolley) as much as the band.

---

## 3 · Identity cards (levels 31–40)

Each card: aha (one sentence) · signature · soul and cast · form · the thumb's journey · the trap · delight · the wake gag · the sound twist · the secret / caption / teaser · validator and bot · engine cost.

### Level 31 · "Float" — Act 4 · the station · a white cabin with no floor · serene weightlessness
- **Aha:** Nothing is heavy here: a flick sends a plug drifting, and the cable's pull brings it to rest where the cable says.
- **Signature:** the drift. A plug keeps its velocity after release; the cable is a tether that springs it back when taut.
- **Soul + cast:** the station's quiet. **Biscuit** asleep in a zero-g bag, turning slowly; **Mug** (a tumbler with a straw) floating in a loop; **Rex** the radio, playing soft beeps when it is powered.
- **Form:** a pale cabin with no floor, a round window at the top showing the blue of the planet, sockets on a ring around the room. Focal point: the drifting plug.
- **Thumb's journey:** a drag is too slow and too fussy; a *lob* is the natural move. Flick a plug toward its socket; it coasts; when the cable comes taut, the tether pulls it back, and if the socket is close enough at the right speed it docks (the capture radius is wide at low speed, narrow at high). Each seat is a small story of momentum.
- **The trap:** dragging it there by hand. The cable pulls the plug back as you move, and a slow drag never reaches the socket's capture speed. Teaches: let it go.
- **Delight:** the plug's tail of light; a whoosh whose pitch follows the speed; the drift stops with a soft *tink* when it docks; Biscuit turns to watch.
- **The wake gag:** the station's lamp (decor) drifts up, lights, and Biscuit floats up to sleep under it.
- **Sound twist:** every drifting plug is a voice whose pitch is its speed (a slide down as it slows: the Doppler of a passing ship).
- **Secret / caption / teaser:** three flicks of Mug make it spin, and a golden tumbler appears; caption "Nothing is heavy here." Teaser: the docking ring's blue light, far off.
- **Validator and bot:** `cls teach`, the layout is a ring; the solution is static (the drift is the plan); luck waived (a flick is a plan); the bot flicks each plug along its lob (a computed velocity) and checks the capture.
- **Engine cost:** *a zero-g motion module* (per-plug velocity, a damped drift, a tether spring when taut, a speed-dependent capture radius). New, but local to plugs: the rules see only seats. **Toy first:** `tools/playtest/defs/float-toy.json`, a room with no goal, drifting plugs only.

### Level 32 · "Docking" — Act 4 · the station · a ring of blue light · precision calm
- **Aha:** The hatch turns; the plug has to arrive when its notch comes round.
- **Signature:** the rotating docking ring: each socket is a hatch with a notch that turns slowly, and a plug seats only through its notch.
- **Soul + cast:** a careful, quiet room; **Pip** the phone stands on the hatch rim, eyes following the notch; the station's clock (a metronome) ticks in the corner.
- **Form:** a grey hull with four hatches in a row, each a ring with a blue notch; the ring turns at a different speed per hatch. Focal point: the notch.
- **Thumb's journey:** the plug hangs at the hatch; you wait (the grace), and when the notch comes to the plug's key you release. The bot holds, then drops; the hint shows a small arc of the notch's path with a dotted "now" mark.
- **The trap:** releasing as soon as the plug is over the hatch: it bounces off the rim ("not yet"), and the ring's clunk teaches the timing.
- **Delight:** the blue ring brightens as the notch comes round; each dock is a *click*, and the four clicks make a rising chord.
- **The wake gag:** the four hatches open like petals, and Pip waves through the window.
- **Sound twist:** a metronome-like tick for the notch, whose rate doubles on the last hatch.
- **Secret / caption / teaser:** dock all four on one turn of the ring (no waiting): a golden hatch; caption "Right on time." Teaser: a second ring, turning in the dark.
- **Validator and bot:** `cls puzzle`; the solution is static; a *timed* socket (the existing `timer` mechanic, reused) with a 1.2 s grace; `p_luck` waived as a timing window; the bot waits for the notch with a real hold and drop.
- **Engine cost:** a *rotating socket* (a notch angle per hatch, a phase, a window) reusing the timer's window logic and the key-colour rule. Moderate. **Toy first:** `docking-toy.json`.

### Level 33 · "Stretch" — Act 4 · the station · the rubber cable · playful twang
- **Aha:** The cable is elastic: pull a plug back and let it go, and it *slings* to its socket; the arc is shown before you throw.
- **Signature:** the sling and its **arc preview**: a dotted ballistic arc from the plug to where it would land, updating as you pull back.
- **Soul + cast:** a squeaky rubber duck, **Squeak** (a device with a flat face and a red beak), and Biscuit batting at the cable.
- **Form:** a white room with a red line on the floor (the launch line), the sockets on the far wall in a fan. Focal point: the stretched cable's shine.
- **Thumb's journey:** pull the plug back (the cable stretches, its colour lightens with tension), watch the dotted arc, adjust the pull, release. A good pull lands; a strong one overshoots and bounces back off the wall.
- **The trap:** pulling as far as possible. The sling overshoots the sockets, bounces, and the arc teaches the *right* tension.
- **Delight:** the twang, with pitch rising with stretch; the duck squeaks on landing; the arc fades when you let go.
- **The wake gag:** Squeak bounces on the cable like a trampoline, and the room hums with it.
- **Sound twist:** the cable plays itself: each stretch is a string whose note is its tension (a pluck with a sling-shot release).
- **Secret / caption / teaser:** a sling that lands on the duck's own socket (a squeak): a golden squeak; caption "Boing." Teaser: the squeak of a door far off.
- **Validator and bot:** `cls puzzle`; the solution is a set of tensions (a small search over pull vectors, the way the wind toy searches aims); p_luck waived; the bot slings with a real drag and release.
- **Engine cost:** *elastic cable* (a rest length, a stretch limit, a spring constant that is not the rope's default) and *ballistic flight* (the arc preview is the same integrator run ahead). Moderate-high; the arc preview is the feel's centre. **Toy first:** `stretch-toy.json`, with a preview only.

### Level 34 · "Magnet Moon" — Act 4 · the station · metal and paper · curious science
- **Aha:** Metal pulls: a plug sticks to any metal, but only the socket powers a thing; the paperclip sticks too, and you have to peel it off.
- **Signature:** the magnetic rail (a bar of holes) and the **decoy paperclips**: metal that attracts a plug without powering it.
- **Soul + cast:** a schoolroom of curiosities: **Lumi** the lamp (on the rail, lit by a paperclip), a horseshoe magnet "Horse" who has been waiting a long time, and the paperclips, who are the trap.
- **Form:** a pale tabletop with a magnetic strip along it, the paperclips scattered like stars, the sockets in the rail's holes.
- **Thumb's journey:** the plug snaps to the nearest metal; you learn its magnet has a *peel* strength; a clip is peeled off by a firm pull (a spring-loaded 'pop'); the rail's real socket holds it with a soft seat.
- **The trap:** seating on the nearest hole, which is a paperclip. It is metal, so the plug sticks, and it does nothing: the lamp stays dark, and the caption asks "Is that a socket?"
- **Delight:** the peel: a little *shk* and the clip flies off the magnet; the rail hums when a plug sits on a real socket.
- **The wake gag:** the paperclips rearrange themselves into a smile around Lumi.
- **Sound twist:** magnetic hum that changes pitch with the distance to the nearest metal (a Theremin for a fridge door).
- **Secret / caption / teaser:** peel every clip off and drop them in a line: a golden clip; caption "Stuck on you." Teaser: a compass needle swinging far off.
- **Validator and bot:** `cls teach`; the solution is static; the decoys are sockets for the reach solver but are marked `decoy` (never powering); the bot peels each decoy with a firm drag, then seats.
- **Engine cost:** *magnet sockets with peel*: a metal target that holds a plug unpowered until a pull beyond a peel force. Moderate; the existing magnet tuning group is the start. **Toy first:** `magnet-toy.json`.

### Level 35 · "Orbital Repair" (set piece) — Act 4 · the station · the Earth rising · awe
- **Aha:** Wake the station in the right order and the whole ring lights, and the planet rises in the window.
- **Signature:** the **cascade**: eight devices, each waking the next along a tree, and the Earth coming up over the window as the last one lights.
- **Soul + cast:** the crew, all eight devices: Pip, Dot, Lux, Tick, Squeak, Mug, Rex, Lumi, each with a face and a job.
- **Form:** a long ring of bays, with the window at the top, the planet a blue crescent below it that grows as the room wakes. Focal point: the crescent.
- **Thumb's journey:** plug the root (Tick, the clock); the cascade runs down the tree (the chain of Pass 03's Level 26), each device a wake that makes the next possible; a lost link stops a branch, and the branch's light goes out.
- **The trap:** plugging the leaves first: a whole branch waits in standby, and the bubbles name the missing root.
- **Delight:** the cascade itself: light running along the bays, a chord that builds as the devices wake, the planet's sunrise.
- **The wake gag:** the planet turns, and the station's lamp (Lumi) rises above the crescent like a moon.
- **Sound twist:** each wake is one note of a chord that resolves at the last device (a song that is the room).
- **Secret / caption / teaser:** wake all eight in one cascade with no standby: a golden crescent; caption "Good morning, Earth." Teaser: the Earth's own radio, faint.
- **Validator and bot:** `cls puzzle`; the solution is a tree (`after` links), eight devices; par 8; the bot seats the root first from the hint order.
- **Engine cost:** the chain (Pass 03), at a larger scale, plus a planet decor that rises with `rt.lit`. Low engine cost; high art cost (the planet). **Toy first:** none needed (the chain is proven).

### Level 36 · "Hang Time" — Act 4 · the wall · gravity returns · relief of weight
- **Aha:** Gravity is back, and the cables sag: the room is seen from the side, and the plugs hang.
- **Signature:** the side view. ***A change of view; a user decision (see §5).*** The proposal is a *cutaway inset*: the same room stays top-down, and a side-on window shows the wall the cables hang from.
- **Soul + cast:** the wall itself, a long grey panel of sockets, and **Gus** the console, who hangs from a hook and sways.
- **Form (inset):** the top-down room, and at its side a tall panel: the wall, the sockets as a column, the cables as catenaries (the curves of hanging chains).
- **Thumb's journey:** the cable is a chain now: it hangs from its device and the plug must be lifted up the wall to a socket above it; you feel the weight as a sag, and the sag is the hint.
- **The trap:** pulling up hard. A heavy plug swings back down (a pendulum by accident), and the sag shows what the cable can do.
- **Delight:** the relief when a plug finds its socket and the cable goes taut and straight: a "click, and the weight is gone."
- **The wake gag:** the cables relax into a gentle hammock; Gus stops swaying.
- **Sound twist:** the creak of a loaded cable as it sags; the creak eases as it is taken up.
- **Secret / caption / teaser:** lift every plug to the top with the sag at its lowest: a golden hook; caption "Up you go." Teaser: a lift, far below.
- **Validator and bot:** `cls puzzle`; the solution is a set of heights (the reach test runs in the wall's frame, with gravity); the bot lifts with a real drag.
- **Engine cost:** gravity for plugs (a catenary solver for hanging cables: the existing rope with a vertical bias and a side view), plus an inset renderer. **High**; the view is the risk. **Toy first:** `hang-toy.json`, with the inset alone.

### Level 37 · "Swing & Plug" — Act 4 · the wall · pendulum release timing · trapeze joy
- **Aha:** The device swings on its cable like a trapeze; you release the plug as the socket passes beneath it.
- **Signature:** the pendulum: a carriage of three sockets on a rope from a high pivot, swinging across the hall. *As built:* the carriage is the pendulum (the engine's sockets ride a strip); the devices stay on the shelf and their plugs go up to it.
- **Soul + cast:** a playful pair: **Choo** the train (on a hook, swinging, whistling at the top of each arc) and **Spike** the drill, who hangs upside-down and does not like it.
- **Form:** a long hall with a high pivot, the sockets on a low shelf; the device swings across the shelf.
- **Thumb's journey:** carry the plug up to the carriage, follow the socket with the finger, and let go as it comes past the bottom of its swing. *As built:* the window is 0.8 s at each bottom, so it opens twice a period.
- **The trap:** releasing at the top of the swing: the plug flies over the socket and falls. The fall is the teaching.
- **Delight:** the swing's rhythm; the creak; Choo's whistle at the top of each arc; the satisfying *tock* as the plug seats mid-swing.
- **The wake gag:** Choo and Spike swing together and high-five at the top of the arc.
- **Sound twist:** the pendulum's creak has a pitch from its length (the period is a note).
- **Secret / caption / teaser:** seat all of them inside one period of the swing: a golden pendulum; caption "Whee!" Teaser: a second pivot creaking far above. *As built:* a period holds two bottoms, so the golden run needs two fingers at one bottom and the third at the next.
- **Validator and bot:** `cls puzzle`; the timing is a window with a grace (the bot waits for the bottom); p_luck waived as a timing window.
- **Engine cost:** a pendulum device (a pivot, a rope length, angular velocity, damping) plus a timing window on a moving socket. Moderate. **Toy first:** `swing-toy.json`.

### Level 38 · "Lanes" — Act 4 · the wall · cable management in a server rack · ASMR
- **Aha:** The cables run in lanes, through clips; each cable's route is the puzzle, not its end.
- **Signature:** the lane: a vertical channel with clips every 40 u. A cable must be routed through the clips of its own lane, in order, and two cables may not share a lane.
- **Soul + cast:** a rack of servers (decor) and **Dryer** (a helper, who keeps a lane warm), and **Dot** the phone, who has to run a long cable through three lanes.
- **Form:** a tall rack of grey bays with blinking lights, the lanes as dark channels with silver clips.
- **Thumb's journey:** draw the route: the cable follows your finger through the clips (a snap at each), and it is refused at a clip of another lane. The plug seats at the top of its lane.
- **The trap:** taking the shortest path through another lane. It is refused at the first wrong clip, and a clip's clunk tells you which lane it is.
- **Delight:** the ASMR: a rhythm of clips as the cable snaps through; the lanes light up as they fill.
- **The wake gag:** the rack's lights turn green in a row, lane by lane, like a sigh.
- **Sound twist:** each clip is a click on a different pitch: a lane has a chord.
- **Secret / caption / teaser:** route all cables with no clip touched twice: a golden clip; caption "Tidy." Teaser: a fan spinning up in the rack.
- **Validator and bot:** `cls puzzle`; the solution is an assignment of cables to lanes with a path order (`via` hoops, the existing engine); the bot routes each cable through its clips with a real draw.
- **Engine cost:** lanes as ordered hoops with a lane-capacity rule; the hoops exist (Level 12). Moderate. **Toy first:** `lanes-toy.json`.

### Level 39 · "Patch Panel" — Act 4 · the wall · two-ended cords · the vintage operator
- **Aha:** A patch cord has two plugs; one goes in a jack on the panel, the other in a device, and the panel decides who talks to whom.
- **Signature:** the two-ended patch cord (a cable with a plug at each end) and brass jacks (sockets on a board that can take either end).
- **Soul + cast:** a switchboard: **Rex** the radio (the operator, who asks "Number, please?" as a caption), **Lux** the lamp, **Pip** the phone, and the jacks, numbered in brass.
- **Form:** a wide panel of brass jacks with cloth cords, lamp-lit from one side. Focal point: a lit jack.
- **Thumb's journey:** take one end of a cord from a jack, carry it to another jack, and the far end is plugged in. Two devices are connected through the panel; a device is powered only if its path reaches the mains.
- **The trap:** patching a device to a jack that is not on the mains: it connects, and nothing lights (the power path is the puzzle, not the connection).
- **Delight:** the jack's click; a lamp lights on each connected path; the cord's soft slap when it is set down.
- **The wake gag:** the operator's lamp goes on, and "Thank you" flashes over the board.
- **Sound twist:** each connection plays the two ends' voices as a call: the patch is a conversation.
- **Secret / caption / teaser:** patch all pairs with no cord crossing another: a golden jack; caption "Connecting." Teaser: a phone ringing, far off.
- **Validator and bot:** `cls puzzle`; the solution is a matching on a graph of jacks (two-ended cords); the validator checks a perfect matching with mains reachability; the bot patches each pair with two real drags.
- **Engine cost:** two-ended cables (a cord with two plugs, each seating in a socket; power flows through the path). New in the graph (`Rules.energized` through a cord), moderate. **Toy first:** `patch-toy.json`.

### Level 40 · "The Server Hall" (boss) — Act 4 · the wall · cable as art · the trolley
- **Aha:** The robot's trolley carries the loose cables into their lanes; you guide the trolley, and the lights run along each cable it lays.
- **Signature:** the maintenance trolley (a small robot with a basket and a torch), a herding agent like the cat (Pass 03), and the **light rivers**: light that runs along a cable once it is laid right.
- **Soul + cast:** the hall: the rack (Level 38), the panel (Level 39), the station's lamp, **Biscuit** asleep on the trolley's basket, and the trolley, who hums.
- **Form:** a long hall of racks, a floor of cable trays, a single lane of light down the middle. Focal point: the trolley's torch.
- **Thumb's journey:** the recipe: (1) the clock: the rack's fans spin up, which powers the lanes (the Level 26 chain); (2) the trolley: press it and drag a route for it to follow (it carries a loose cable, like the cat's spot of light); (3) lay each cable through its lane (the Level 38 routing); (4) patch the pairs (the Level 39 matching); (5) the light rivers run once every cable is tidy, and the trolley parks.
- **The trap:** laying cables before the fans are on: the lanes are dark, and the trolley cannot pass a dark lane.
- **Delight:** the trolley's hum; the light rivers; each laid cable's glow; the trolley's torch sweeping the hall.
- **The wake gag:** the trolley tips its basket, and Biscuit wakes and stretches on the rack.
- **Sound twist:** the lullaby of Level 30 returns, played by the fans: a motor's drone that hums the old tune.
- **Secret / caption / teaser:** lay every cable so its light runs the whole length of the hall: a golden torch; caption "Lights out, everyone." Teaser: the Earth's window, far above.
- **Validator and bot:** `cls boss`; exactly one legal order of operations (fans, lanes, trolley route, patch); luck waived with the reason (a recipe); par 12; the bot executes the recipe with real drags.
- **Engine cost:** a herding agent (reuse the cat's state machine, a trolley), the lanes (38), the patch (39), the chain (26). Composition, the Pass 03 pattern. Moderate. **Toy first:** the trolley's route, in `herd-toy.json`.

---

## 4 · Distinctness check (nine axes, neighbours first)

| Axis | 31 Float | 32 Docking | 33 Stretch | 34 Magnet | 35 Orbital | 36 Hang | 37 Swing | 38 Lanes | 39 Patch | 40 Server |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Silhouette | ring of sockets, no floor | hull with four hatches | fan of sockets, red line | paperclips on a rail | eight-bay ring, window | side wall, catenaries | high pivot, low shelf | tall rack, lanes | brass jack board | long hall of racks |
| Palette / light | white, blue window | grey and blue notch | white, red line | pale table, metal glints | planet blue, bay light | dark panel, sag | warm hall, swing | green rack lights | amber lamps | cool hall, light rivers |
| Signature object | the drift | rotating hatch | sling + arc | peel & decoy | cascade | the side view | pendulum | the lane | two-ended cord | the trolley |
| Sound voice | whoosh by speed | ticks, clicks | twang by tension | hum by metal | chord builds | creak of load | pendulum creak | clip ASMR | call tone | motor drone |
| Mechanic combination | motion + tether | timing window | elastic + search | magnet + decoy | chain (large) | gravity (view) | pendulum + window | ordered hoops | two-ended graph | herd + chain + lanes + patch |
| Aha type | let it go | wait for it | pull and release | it's not what it looks like | wake in order | lift against the sag | release at the bottom | route, not end | matching | recipe under a trolley |
| Pace | slow, weightless | slow, metronome | snappy | steady | big, rising | heavy, creaking | rhythmic | rhythmic clicks | brisk | long, many steps |
| Emotional beat | serene | calm precision | playful | curious | awe | relief | joy | calm tidiness | nostalgic | quiet awe |
| Cast | Biscuit, Mug, Rex | Pip | Squeak, Biscuit | Lumi, Horse | the whole crew | Gus | Choo, Spike | Dryer, Dot | Rex, Lux, Pip | trolley, Biscuit |

**The rule that kept the list honest:** if two cards share their aha type, they must differ on the signature and the sound voice. 33 and 37 both "release at the right moment" (33 is a sling, 37 a pendulum at the bottom), so 37's aha is *the bottom of a motion* and 33's is *the tension of a stretch*. 38 and 40 share lanes: 40 is a boss built from them and from a herding agent, so 38 is the routing and 40 the recipe.

---

## 5 · Decisions for the user (not defaults)

1. **The side-on wall (36, and the wall's view in 37–40).** A full camera change is a *view* fork (CLAUDE.md: forks that change the game's identity are the user's). **Proposed:** a cutaway inset, the top-down room kept, with the wall drawn beside it. **Ask before building the full view.**
2. **Zero-g in a portrait phone.** Drift is a *physics* change, not a view change; no question, but a phone test is owed (below).
3. **Biscuit's roles.** She appears in 31, 36, 40 and the wake of 35. Four appearances in one act is a cast decision; confirm or thin them.

## 6 · Build order *(toys first; every step ends green)*

| # | Step | Exit check |
| --- | --- | --- |
| D0 | **Motion module** (zero-g drift, the tether, the capture radius) in a goal-less `float-toy.json`. | A flicked plug drifts, is pulled back, and captures at low speed; never tunnels |
| D1 | **L31 Float.** | The bot flicks every plug along a computed lob; 3 stars |
| D2 | **Rotating hatch** toy, then **L32 Docking** (the timer's window, the notch). | A notch comes round at a fixed rate; the bot waits for it |
| D3 | **Elastic cable + arc preview** toy, then **L33 Stretch**. | The preview matches the flight within 2 %; the search finds a sling |
| D4 | **Magnet + peel** toy, then **L34 Magnet Moon**. | A decoy holds without powering; a firm pull peels it |
| D5 | **L35 Orbital Repair** (the chain at eight devices, the planet's rise). | The cascade has no standby leak; the sunrise follows the last wake |
| D6 | **Cutaway inset** and **catenary** toy (after the user's answer on the view), then **L36 Hang Time**. | The sag matches a catenary; the inset never covers a socket |
| D7 | **Pendulum** toy, then **L37 Swing & Plug**. | The period is steady; the window is the bottom 0.8 s |
| D8 | **Lanes** toy (ordered hoops with clips), then **L38 Lanes**. | A cable refused at a wrong clip; the clicks are on pitch |
| D9 | **Two-ended cord** toy, then **L39 Patch Panel**. | A cord carries power only along a path to the mains |
| D10 | **Trolley** (herding agent) and **L40 The Server Hall** (boss). | The bot runs the recipe; the light rivers run the length of the hall |
| D11 | Phase 4 acceptance gate (`GOAL.md` §7): every probe, four viewports, audio render, flow and touch, the phone question list, rewards. | All green or waived out loud |

## 7 · Questions Phase 4 must answer by playing (for the user's phone)

- **Float:** does a lob feel like throwing, or like fighting the tether? Is 0.8 s of drift the right length?
- **Docking:** is a 1.2 s grace on a turning notch forgiving, or does it read as a lottery?
- **Stretch:** does the arc preview make the sling a *decision*, or does it spoil the moment?
- **Magnet Moon:** do the decoys read as wrong before the plug sticks, or only after?
- **Orbital Repair:** does the cascade land as awe on a small screen (360 u wide), and is eight devices too many to read?
- **Hang Time:** does the inset read at a glance on a phone, or does the side view need the full screen?
- **Swing & Plug:** is the bottom 0.8 s of the swing fair to a thumb?
- **Lanes:** is the clip clunk pleasant through phone speakers, or tinny?
- **Patch Panel:** does a two-ended cord read as one thing, or as two plugs with a string?
- **The Server Hall:** is the recipe a show, or seven chores? (Same question as Pass 03's boss.)

## 8 · Open water *(ideas kept for later; not promised)*

- **The window as a timer:** the Earth's phase tells the time of the level, a sundial for the station.
- **Ice on the docking ring:** a hatch that needs a warm plug (the dryer from Pass 02) to open.
- **A spacewalk:** the robot's arm as a herding agent that carries a socket across the station.
- **The paperclip that was always a socket:** a decoy that a later level makes real; a callback that changes what peeling means.
- **Biscuit's zero-g bag:** a secret that she wakes only if every device is weightless at once.

---

## 9 · As built (running log; updated as each step lands)

**D0 · the zero-g motion module (built 2026-11-16).**
- **Engine:** the rope integrator has no gravity at all: a free end keeps its velocity under friction and viscous damping, and the tether is the rope's own length constraint. So "zero-g" is two world numbers: `WORLDS.station {fric 0.05, damp 0.22, zeroG: true}` (`src/room.js`) and a per-rope damping scale `dampK` (`src/rope.js`, default 1: every other level is unchanged). `src/mech-zerog.js` adds the two things a drift needs: the cabin's inner walls (a drifting plug rebounds at 55 % of its speed) and the **catch** (a drifting plug, 14–150 u/s, within 24 u of a free socket that can take it, is docked through `seatInto`; a plug at rest is not caught, and a faster one flies by).
- **Toy and probe:** `tools/playtest/defs/float-toy.json` (no goal) and `float.mjs` (4 checks, real flicks): a flicked plug drifts 275 u and rests in about two seconds; the tether holds (the furthest it got was 126–151 u of a 330 u cable); a slow drift into a free socket docks there (`G2.1`); a fast pass at 188–205 u/s within 40 u of the socket is not caught.
- **What the build taught:** (1) no gravity term was needed, because the rope never had one: zero-g is friction and damping, and that is cheap; (2) without walls a drifting plug leaves the cabin (one run ended at x = −17): the walls are part of the physics, not decoration; (3) the catch speed sits between 150 and 188 u/s on these numbers, a thin margin, so `CATCH_SPEED` is a tuning value to test on a phone; (4) a probe that drags a drifting plug leaves it wherever the drift took it: reset the room (a fresh `goto`) between cases, or the fourth case starts from a state the third left behind.

**D1 · Level 31 "Float" (built 2026-11-16).**
- **Data:** `src/levels/world4.js` (the first Act 4 level, and the Act 4 entry in `G.Acts`). Four devices in a diamond at the centre; four grommets on the ring, each keyed to one device (so the arrangement is one answer and the question is the flick); `world: 'station'`; par 4; luck waived with the reason (a flick is a plan). The secret: three taps on the porthole (a golden tumbler).
- **Art:** `src/art-station.js`: the space beyond the hull (a deep blue dark, stars, a haze), the cabin panel (brushed pale metal under a seam grid, a steel rim, rivets), the porthole decor (a brass ring, a planet turning under a band of cloud), and the golden tumbler. **A mistake worth keeping:** a surface builder returns a bare canvas, while a mat builder returns `{cv, pad, k}`. The first station surface returned the mat's shape and the game threw inside `drawImage`; the hints audit caught it, the console did not stop it.
- **House Map:** a fourth floor (`.floor.f4`), and the meta probe now derives its expectations from the level and act data, so the count stops being a hard-coded number.
- **Verified here:** `test-rules` 180; validator (one arrangement, margin 50 %, no hard failures); real-drag bot 4 actions / 3 stars / 4 seats = par / 0 crossings / 60 fps; `hints.mjs 31` (the bulb shows the seat); storyboard `shots.mjs 31` (start, wake); `float.mjs` on the toy; `meta.mjs` (four floors, thirty-one windows). **Not built yet:** the wake gag (the lamp drifting up to sleep), the bot flicks (it seats by drag; the drift is probed on the toy), and the sleeping cat as a cast member (a decision for D5/D10).
- **Owed to a phone:** whether a lob feels like throwing or like fighting the tether; whether 0.8–1.2 s of drift is the right length; whether the catch speed is generous enough that a sensible flick docks.

**D2 · Level 32 "Docking" (built 2026-11-16).**
- **Engine:** the timer sockets of Level 18 carry it unchanged (`Rules.opensIn`, the 0.8 s grace, a plug that waits for its window, the soft "not yet" for a plug released too early). New, and small: the timer runtime carries the window's phase (`rt.timer[id].ph`); a socket with `timer.hatch` draws a **hatch** (a bezel, a keyhole at the top, and a notch that turns round the ring, open exactly while the notch covers the keyhole: the same formula as `opensIn`, made visible); a `hatchBounced` counter for the "not yet" turns; and the docking secret at the Wake (`secret.on 'docking'`: no plug turned away; the golden hatch, `Art.SECRETS2.goldhatch`).
- **Data:** `src/levels/world4.js` (L32). Four hatches on one hull strip, each with its own period (3.0, 3.6, 4.2, 4.8 s) and phase, 0.9 s open; the devices stand staggered so their left-to-right order matches the hatch order (tidy); luck waived (a timing window is a plan of when to let go).
- **What the build taught:** (1) **a timed seat must be held, not guessed.** The bot's fixed pre-seat delay drifts with drag length and frame rate: Level 18 went from three stars to two seats and a timeout on one run and passed on the next. Now a timed seat carries the plug over the socket, holds, and lets go when the window is open or within its grace (`bot.mjs`, `shots.mjs`, `dock.mjs` all do this); (2) the probe's own drags take one to two seconds headless, so the timing is a *release* decision, read from the clock at the moment of letting go, not a drag that starts at the right moment; (3) a rotating notch is a rule made visible: if the art and `opensIn` can disagree, the art is wrong, and here they share the formula; (4) two devices that share an x are a crossing for free: the stagger is the tidy solution.
- **Verified here:** validator (one arrangement, tidy, margin 75 %, luck waived with its reason); real-drag bot 4 actions / 3 stars / 4 seats = par / 0 crossings (`bot.mjs 32`), and the same bot on Level 18 (`timer` regression: 4 actions, 3 stars); `dock.mjs` (five checks: the notch turns with the clock at the clock's rate; a release 1.7 s before the opening is turned away and bounces; a release 0.6 s before it waits and docks; all four docked with no bounce, and the golden hatch appears at the Wake); `timer.mjs` (Level 18's windows, unchanged); `hints.mjs 32`; storyboard `shots.mjs 32` (start, seats). **Not built:** the Wake gag (the hatches open like petals), and Pip's wave. **Owed to a phone:** whether 0.8 s of grace feels forgiving; whether the notch reads as a window (the arc sweeps to the keyhole) at a glance; whether "not yet" is gentle enough to try again.

**D3 · Level 33 "Stretch" (built 2026-11-16).**
- **Engine (`src/mech-sling.js`):** on a release that no socket took, in a `sling` level, the plug is launched at its pull times a spring (3 u/s per u; a cable pulled to its full length flings the plug at about 900 u/s): the velocity is set as the rope's last step, so the cable's own physics carries the flight (its tether, its damping, the station's walls). **The arc is the same flight:** while the plug is held, its path is run ahead on a copy of its rope (`cloneRope` + the room's own `step`, with the walls), so the dotted arc is what the plug does, cable and all. Measured: a mean deviation of 2.9 to 6.4 u against the real flight; about 9 ms per arc, recomputed ten times a second.
- **Toy and probe:** `tools/playtest/defs/stretch-toy.json` and `sling.mjs` (five checks: the arc is drawn while the plug is held; let go, the plug moves at 373 u/s in its first 0.24 s; it whips back to 45 u of its device; it goes out to 129 u and the tether brings it back; the real path stays near the arc).
- **Level:** `src/levels/world4.js` (L33): a console (Squeak) and a phone (Pip) on the left, two keyed sockets on the far wall, `sling: true`, par 2; luck waived (two keyed sockets make one answer); the secret is a slung plug that docks (`secret.on 'sling'`; the golden tumbler stands in for the golden squeak until its art exists).
- **What the build taught:** (1) a point-mass preview disagreed with the real flight by 118 u: the cable has mass, so the preview has to run the plug's real rope, not an idealised point; (2) the cable's inertia takes most of the speed: a sling aimed at a device passed it at 37 to 60 u, not through the port: a rubber cable is not a bullet, and the pull must be tuned for the cable; (3) the probe samples every 40 ms and missed the launch peak (about 400 u/s): a threshold must be one the sampling can see; (4) the arc computed every frame cost 9 ms: a 0.1 s throttle is enough, and a sharp change of pull still shows at once.
- **Verified here:** validator (one arrangement, tidy, luck waived with its reason); real-drag bot 2 actions / 3 stars / 2 seats = par / 0 crossings (the bot seats by drag, which works, so the sling is a way and not yet the only way); `hints.mjs 33`; storyboard `shots.mjs 33` (start, seats); `sling.mjs` (five checks). **Not built:** the red launch line on the floor from the card (the form), the squeak's duck art (the console stands in), Biscuit batting the cable. **Open design question (for D11):** a direct drag also solves this level. Should the far sockets be out of direct reach, so the sling is needed? Decide on a phone, not on paper. **Owed to a phone:** whether the pull feels like a rubber band (the tension, the twang); whether two seconds of arc is the right length to read; whether a sling is more fun than a drag.

**D4 · Level 34 "Magnet Moon" (built 2026-11-16).**
- **Engine (`src/mech-magnet.js`):** the decoys are paperclips, and they are not sockets. A plug let go within 26 u of a clip (measured from the finger that lets go, not from the lifted plug: a held plug floats above the finger) sticks to it: pinned there (`rope.pin`), unpowered, and refused by no socket. A grab on a stuck plug holds it on the clip while the finger stays within 24 u (a `moveGrab` hook); a firm pull past that peels the clip (`peeled` is counted, a small shk), and the plug comes away with the finger. `Rules.*` does not know the clips exist: a stuck plug is simply not seated.
- **Level:** `src/levels/world4.js` (L34): a rail of four keyed holes at the bottom, four keyed devices in a staggered pattern (left-to-right order matching the holes, so the arrangement is tidy), three paperclips in the middle; `world: 'steel'`; par 4; luck waived (the keys make one answer). The caption on the first stick is "is that a socket?"; the Wake caption is "Stuck on you."; the secret is the golden clip, given when every clip has been peeled at least once by the Wake.
- **What the build taught:** (1) reach must be measured where the finger is: the held plug floats above the finger by the game's lift, so a clip 26 u from the finger was 40 u from the plug, and the first probe saw no sticking at all; (2) a probe that drags to a fixed coordinate after a peel starts from nothing: start every drag from the plug's real position; (3) a decoy is cheap in the rules and expensive in feel: its hold (24 u) and its peel are where the level lives, and they are one function.
- **Verified here:** validator (one arrangement, tidy, luck waived with its reason); real-drag bot 4 actions / 3 stars / 4 seats = par / 0 crossings (`bot.mjs 34`); `magnet.mjs` (eleven checks: a plug let go on a clip sticks and powers nothing; a gentle touch does not peel; a firm pull peels and the plug comes away; the three peeled plugs seat; every clip peeled before the Wake gives the golden clip); `hints.mjs 34`; storyboard `shots.mjs 34` (start). **Not built:** the Wake gag (the clips rearranging into a smile around Lumi), the compass-needle teaser (the station beep stands in), the horse device. **Owed to a phone:** whether the 24 u hold feels like metal (a sticky, not a wall); whether a gentle touch and a firm pull are easy to tell apart on a phone; whether "is that a socket?" is the right question to ask.

**D5 · Level 35 "Orbital Repair" (the set piece, built 2026-11-16).**
- **Engine (`src/mech-orbital.js`, the Level 26 chain at eight devices):** the planet's rise follows the share of the ring that is awake (damped; full at the Wake); the cascade bookkeeping marks any device that was awake and is put back on standby during play (`orbitRT.broken`); at the Wake, a cascade that never went dark is the secret (the golden crescent, `Art.SECRETS2.goldcrescent`). The porthole is `earthwin` (`Art.DECOR2`): the planet sits low in the glass and rises as `rt.lit` climbs.
- **Keys remove the reach band.** Eight devices need eight keys, so the palette gains `rose`, `lime` and `teal` (`Art.KEYCOL`, `Rules.KEYS`), and each socket is keyed to one device in chain order. The validator's ambiguous-reach check counts only pairs a plug can fit, so each cable is sized to its *own* socket (about 0.88 of the distance), not to all eight: that is the difference between cables of 415 u and cables of 294 u.
- **Layout:** two rows of four (Tick, Rex, Lumi, Squeak on top; Pip, Big Sleepy, Kettle, Gus below), staggered so the left-to-right order is the chain's pad order (Tick 1, Pip 2, Rex 3, Big Sleepy 4, Kettle 5, Lumi 6, Gus 7, Squeak 8): the arrangement is one answer and it is tidy. The chain is a tree: Tick leads Pip and Big Sleepy; Pip leads Rex, Rex leads Lumi, Lumi leads Gus; Big Sleepy leads Kettle, Kettle leads Squeak.
- **What the build taught:** (1) keys remove the reach band (above): a long cable is a cost you can avoid; (2) a regex edit of `world4.js` matched the *first* line of each common device id, which is in Level 31, so it corrupted three rests there and one in Level 33: found by a validator run over Levels 31 to 35, restored by segment. Edit one level's block at a time, and validate every level after a bulk edit; (3) a rest on a flat search at 0.6 of the length leaves a bulge that leaves the mat; a rest on the circle at 0.85 does not; (4) flipping the bulge sign to fix one rest broke the tidy solution, so the sign stays at −0.25 and the rests move instead; (5) the baseline frame rate fell to 21 fps during this session (the machine is loaded), so compare a new level with level 7 in the same run.
- **Verified here:** validator (one arrangement, tidy, margin 88 %, luck waived with its reason); real-drag bot 8 actions / 3 stars / 8 seats = par / 0 crossings (`bot.mjs 35`); `hints.mjs 35`; storyboard `shots.mjs 35` (the wake: the cascade, the "Secret found!" banner, the golden crescent). **Not built:** Biscuit waking under the lamp, and the set piece's own sound layer (the chain's relay clicks and the Earth's radio teaser stand in). **Owed to a phone:** whether eight devices read as a ring or a crowd at 360 u; whether the planet's rise is seen at phone size; whether the 0.3 s per link cascade is awe or waiting.

**D7 · Level 37 "Swing & Plug" (built 2026-11-16).**
- **Engine (`src/mech-pendulum.js`; `Rules.pendulumAt`, `Rules.pendulumMove`, `Rules.verifyPendulum` in `src/rules.js`):** a carried strip with `carrier.mode 'pendulum'` hangs from a pivot. Its position is the sine of the room clock (theta = amp · sin(2 pi t / period)), the same clock the timer windows read, so the window is tied to the swing and not to a guessed delay. It has no walker: `carryInit` skips it, the hint falls through to the general seat hint (with its waits), and the validator checks every seated cable at 41 points across one whole period (`verifyPendulum`). The sockets carry a timer whose period is half the swing, so the window opens at each bottom.
- **Toy first:** `tools/playtest/defs/swing-toy.json` and `swing.mjs` (nine checks, real mouse): the motion is the formula to the last digit; the sweep reaches its amplitude (99 u); the socket is open at the bottom and shut at the top past the grace (1.25 s); Squeak seats in a bottom window at 0.12 rad; Spike released at the top falls; Dot and Spike seat on later bottoms; the worst cable across the swing is 86 % of its length.
- **Two decisions the build made (both can change on a phone):** (1) the card had the device swinging; the sockets ride a strip, so the carriage swings and the devices stay on the shelf. The plugs go up to it, which still reads as a trapeze. (2) The period is 5.2 s, not 4 s. The grace is global (0.8 s): at a 4 s period the top of the arc is 0.6 s before the next window, so a plug released at the top would wait and seat, and the trap would be lost. At 5.2 s the top is 0.9 s from the window.
- **The golden pendulum needs two fingers.** A period has two bottoms, so one finger can seat at most two plugs in it. The secret (all three inside one period) is therefore a two-finger move. The engine already keeps one grab per pointer. `golden37.mjs` drives it with real CDP touch.
- **Level:** `src/levels/world4.js` (L37): three keyed sockets on the carriage at pitch 40 (one answer per key), three keyed devices on the shelf (Squeak, Spike, Dot), par 3, **Tidy unpromised** (see below), luck waived (the keys make one answer, the timing is the puzzle), secret `goldpendulum` at (300,130), teaser `thumpFar`, caption "Whee!". Validator: one arrangement, tidy, margin 61 %, no hard failures (one warning: the waived luck).
- **Art:** `Art.SECRETS2.goldpendulum` in `src/art-station.js`; the beam, the rope and the brass hook are drawn in `pendulumDraw`. **Fixed on the way:** a non-grommet strip draws a mains lead to the right edge (`art.js` `stripUnder`), and a walking carrier draws its cord (`art.js` `stripUnder`, carriedUnder). Neither belongs to a hanging carriage, so both now skip pendulum strips.
- **Tidy is not promised on L37 (a decision made by the build, to be confirmed):** a 300 u cable over a short drop slacks into loops, and the loops settle differently at each seating. The real-drag bot crossed in one full run in five. The crossings are not a swing effect: in the crossed runs they persist at every angle of the swing, so the carriage is not the cause. The validator's settled-arc model passes with the current curls (Squeak -1, Spike 1, Dot 1), and every uniform curl setting failed it, so there was no clean geometry to find. The honest move, as on Level 10, is to leave the star unpromised and say why. Lit and Clean are promised.
- **Bot:** a moving-socket branch (`act.moving`). The finger walks the plug to the carriage, follows the live socket, and releases when the window is open and the swing is within 0.14 rad of the bottom. Level 37: three actions, three stars, three seats = par, no crossings.
- **Probes:** `swing.mjs` (nine checks, above); `golden37.mjs` (seven checks: two fingers seat Squeak and Spike in one bottom window, Dot seats at the next bottom, the golden is found; the same three, each a period apart, do not find it); `hints.mjs 37` (the seat hint shows a hand). The storyboard (`shots.mjs`) cannot follow a moving socket, so the frames of Level 37 were taken by a plain script: start, the carriage far left, the carriage at the bottom.
- **What the build taught:** (1) a probe that times a physics quantity by the wall clock is flaky on a loaded machine: `sling.mjs` read the launch speed at 138 to 350 u/s from one release, because the physics runs on a frame-driven accumulator. The probe now reads the room's own clock (`r.t`), and the arc check does too. (2) A window's grace is a global number, so a timed motion has to be sized around it: the top of the swing has to lie outside the grace, or the trap is not a trap. (3) A visual default can add a part nobody asked for: a strip without a fed-by draws a mains lead, which a hanging carriage must not have.
- **Gap:** Level 36 (Hang Time, D6) is still not built: it waits for the side-on view answer. The House Map now shows 36 rooms (35, then 37).
- **Owed to a phone:** does the 0.8 s window at the bottom feel fair to a thumb, or does a carriage at about 120 u/s feel like a lottery? Is the two-finger golden a delight, or a chore to find? Do the whistle at the top and the creak of the pivot carry the sound twist, and does the high-five at the next top land as the wake gag?

**D8 · Lanes: built (2026-11-16); the first attempt is kept below as the lesson.**
- **Engine (`src/rules.js`, `src/mech-gates.js`):** a level with `lanes: true` makes each gate of another key a closed bar to a cable (`Rules.laneBars`, the gap's width, six units high), in the router (`Rules.routeVia`) and in the cable physics (`Room.obsFor`, cached per plug). On a lanes level a cable's clips are ordered from its device's side (`dev.via` in `Rules.compile`): the top-first order made a cable from below double back through its own lane (664 u of route for a 360 u cable). The golden clip is counted in `Room.onThread` and checked at the wake (`Room.lanesWakeCheck`): every cable ran each of its clips once, and touched none twice. Other levels are unchanged (the bars are empty and the old order stays), and Level 12 still gets three stars.
- **Level 38 (`src/levels/world4.js`):** three columns of three clips (coral at x 110, amber 180, sky 250), each lane between channel walls. The walls are split into segments that stop short of the posts (a wall on a post is an overlap the validator refuses). The devices stand on the wrong side: Dot (sky) on the far left, Squeak (coral) on the right, so each cable's straight shot runs into another lane's wall, and the route is under the rack and up its own lane. The two cables cross under the rack, so Tidy is unpromised. Cable lengths are set to each routed path (Dot 490, Squeak 470, Spike 390; the ambiguous band forced the two longest). Validator: one arrangement, margin 93 %, warn only (waived luck). Real-drag bot: three seats, the room wakes, lit and clean, and the golden clip is found (the bot reports `secret: true`).
- **Art:** `Art.DECOR2.rackwall` in `src/art-station.js` draws the channel walls as dark bay sides with a silver edge.
- **Toy and probe:** `tools/playtest/defs/lanes-toy.json` and `lanes.mjs` (six checks, real mouse, a fresh load per scenario): a coral cable pulled straight through the sky lane does not thread it; a routed coral cable runs under the lanes and up its own three clips and seats (R.1); a straight amber cable seats (R.2); a routed sky cable seats (R.3); no other lane's clip is threaded on the way.
- **Hints:** `hints.mjs 38` (the seat hint shows a hand).
- **The first attempt, and why it failed (kept as the lesson):** the devices were stood out of lane order with no walls, and the cables were long. A seated cable with slack relaxed onto the straight line from its port to its socket, which passes the gates, not through them. The clips unthreaded, the plugs stayed unpowered, the room never woke, and the routed cables crossed one another. Lane walls on the posts broke the validator. The fix was the lane walls split between the posts, the devices under the wrong lanes (so the wall does the refusing), and cable lengths matched to each route. Lesson: test the power state (the room wakes), not only the seat.
- **Not built:** the wake's green row of lights (the card's gag), and the Dryer helper.

**D9 · Level 39 "Patch Panel" (built 2026-11-16).**
- **The two-ended cord is not new engine, and the record should say so.** A patch cord is a `cord: true` device (the Level 15 pegboard cord): its plug seats in one strip and its port feeds a second strip (`fedBy`). Level 15 already powers the second board only through the cord. Level 39 uses that exact engine: the mains board (strip A) takes the cord's plug; the second board (strip B, `fedBy 'K1'`) is dark until the cord is patched in.
- **What is new in Level 39:** the switchboard (`Art.DECOR2.jackboard`: a walnut board with a brass rim, a warm lamp, and brass numerals 1 to 4 over the jacks); a mains board with keyed jacks (violet for the cord, coral, amber, and a spare mint jack that no cable reaches); a second board keyed sky and mint (so only one device can take each jack); and the secret trigger `on: 'tidy'` (`Room.startWake`, after the stars are judged): every cord patched with no cord crossing another gives the golden jack.
- **Layout (after several validator rounds):** Rex (radio, coral) and Pip (phone, amber) on the right, Lux (lamp, sky) lower left, the cord on the left; the cables were lengthened (Rex 325, Pip 245) so each reach is below the ambiguous band (0.94), and the rests were moved off the devices (a heap and a too-close rest both fail the validator).
- **A bug found and fixed on the way:** the secret check was first placed at the top of `startWake`, before `def` and `tidy` were declared. The throw left the phase on `waking` with no stars and no secret, and the bot showed it as `stars: null`. The check now sits after `this.stars`. Keep new wake code after the star judgement.
- **Verified here:** validator (one arrangement, tidy, margin 91 %, no hard failures); real-drag bot 4 actions / three stars / four seats, the golden jack found (`bot.mjs 39`); `hints.mjs 39`; the switchboard screenshot.
- **Owed to a phone:** does a cord patched into the mains light the second board with a satisfying click, and is the trap (a device on the dark board) read as "no power" rather than "broken"?

**D10 · Level 40 "The Server Hall" (boss, built 2026-11-16) as a composition, reduced on purpose.**
- **What the card wanted:** a trolley (a herding agent that carries a loose cable to its lane), the fans as a clock that powers the lanes, the lanes, the patch, and the light rivers.
- **What is built:** the lanes of Level 38 (the same rack, walls, and cables); Biscuit asleep on the amber socket (the lure of Level 22, `herd`: draw the light, she leaves, the socket is free); and the light rivers at the wake (`Room.riverDraw`, a pulse of light that runs down each laid cable, device to socket, every few seconds, drawn over the cables). The secret is the golden torch: every cable ran each of its clips once (`lanesWakeCheck`). Luck is waived with its reason (a recipe: the lure has to come first).
- **The lure fix (found by repeating the bot four times):** Biscuit sits on the one free socket the last cable needs, and she returns to the free socket nearest her warm patch. The first beam (`x 300, r 110`) did not cover the sockets, so the lure never drew her off, and the bot looped. The beam now covers the rack (`x 180, y 300, r 150`), and the warm patch is at (330, 330). Four of four runs wake after the change (one in four failed before it).
- **Not built (kept for later):** the trolley and its herding route, and the fans' clock (the Level 26 chain driven by a motor rather than the cables). The card's trap ("laying cables before the fans are on") needs the fans, so it is also not built. Say so in the final report rather than let the boss read as complete.
- **Verified here:** validator (one arrangement, margin 93 %, warn only); real-drag bot 4 actions (the lure included), three stars without Tidy, the golden torch found (`bot.mjs 40`); the wake screenshot shows the lanes lit and the rivers running.
- **Owed to a phone:** does Biscuit's lure feel like the cat's from Level 22 in this hall, and do the rivers read as light running along the cables rather than as dots?

**D11 · the Phase 4 acceptance gate (run 2026-11-16, re-run after Levels 36 and 40's beam change): passed, with the waivers below.**
- **Run:** full real-drag bot over every level that exists (39 of the 40; Level 36 absent): every one reaches the wake. Three stars on all except the levels whose Tidy is unpromised (10 from before, and 37, 38, 40 from this act). The bot's last full run had no failures. Levels 38 and 40 needed the lanes latch and the lure fix to be reliable (see D8 and D10).
- **Probes (final code):** `swing`, `golden37`, `lanes`, `float`, `dock`, `sling`, `magnet`, `seq`, `groove` (one timing flake under load, passed on re-run), `bass`, `boss`, `chain`, `timer`, `carry`, `cat`, `track`, `wind`, `blocks`, `meta`, `audio` (renders finite, under full scale), `hints` (39 levels, each shows something), `feel` (check 10, frame interval, headless software raster: waived with the reason from Phase 3).
- **Rules and validator:** `test-rules` 203 passing; the validator has no hard failures (19 warnings: the waived luck and the warn-only checks).
- **Re-run after the last changes (2026-11-16):** the full bot ran 1–41 and every level wakes (three stars except the unpromised Tidy on 10, 38, 40); the probe suite ran on the final code, and every probe passed except `feel.mjs` check 10 (waived, headless), with two timing flakes (`sling` whip, `groove` pocket) that pass when re-run alone on the loaded machine. Waivers, each with its reason: `feel` check 10 (software raster, headless); `sling`/`groove` timing under load (re-run solo: green); Tidy unpromised on 10, 38, 40 (the settle flake and the crossed routes, recorded above).
- **Earlier note (superseded):** the gate was open while Level 36 was missing.
- **Not done (superseded, kept for the record):** Level 36 (Hang Time). It waits for the user's answer on the side-on view (§5, item 1): the cutaway inset is proposed, and the full camera change is a view fork. Also owed: the phone session (feel, haptics, the two-finger golden, the lure and rivers), and the Biscuit cast question in §5 item 3. The trolley in Level 40 is cut, and the fans clock is not built; both are logged in D10.

**D6 · Level 36 "Hang Time" (built 2026-11-16, after your answer: the cutaway inset).**
- **The view decision (yours, 2026-11-16):** the cutaway inset, as proposed in §5 item 1. The top-down room stays. A panel at the top right shows the wall.
- **What the inset is, and is not:** it is a SCHEMATIC of heights, not a projection of the cables. The wall is a vertical bar, the three sockets sit on it at their true heights, and the three plugs sit at theirs (each in its own column, so two at one height still show). A seated plug draws a line from its socket down to where it hangs. The cables themselves are the room's own ropes. A true side view would be a camera change, which is not what was chosen. (`src/mech-inset.js`; `Room.insetDraw`, drawn over the room; the panel stays left of the sockets.)
- **Engine:** gravity for the ropes (`Rope.gravK`, a downward pull on every free node, 0 everywhere else) and a `wall` world with `grav: 900` (`src/room.js` WORLDS). The rope integrates the pull with the same Verlet step, so the cable sags and the plug is heavy.
- **A floor, and a bug it exposed:** without a floor the plugs fell off the bottom of the mat (y 670), out of reach. The floor is a level obstacle, and it had to be `tall: true`: the rope skips obstacles marked `tall: false` (they are flat decals). That is a useful rule: a surface a cable must rest on needs `tall: true`.
- **Level:** `src/levels/world4.js` (L36, before L37): a wall strip of three keyed sockets at y 120; Gus (coral), Pip (amber), Dot (sky) at the bottom on y 500, each cable long enough for its lift (Pip 540: at 500 its reach was 96.5 %); the floor at y 600; `inset: true`; the secret is a golden hook on `tidy` (every plug lifted, every cable straight). Luck waived with its reason (keyed sockets: the lift is the puzzle).
- **Bot:** the gravity world uses the slow drag (`bot.mjs`, `r.world.grav`); the first seat failed on the fast drag because a heavy plug lags a fast finger.
- **Verified here:** validator (one arrangement, margin 90 %, warn only); real-drag bot 3 actions, three stars, the golden hook found (`bot.mjs 36`); `hints.mjs 36` (five with a hand); the inset screenshot (sockets and plugs in their columns); `meta.mjs` (40 rooms on the House Map).
- **Owed to a phone:** does the lift feel heavy (does the sag read as weight), and does the inset read as heights without being mistaken for the cables?

