# Pass 02 · Act 2 — The Workshop & the Kitchen (levels 11–20) · **v2, the originality pass**

*A day in the house: the garage at four o'clock, the pegboard at golden hour, the kitchen at dinner, at two in the morning, and finally at sunrise. Act 1 taught the room to click. Act 2 teaches it that the **thumb can mean ten different things**.*

> Status: **v2 designed; being built** (see `GOAL.md` §0 B). v1 of this pass (rail · clips · pegs · bridges · daisy · timer · breaker · dryer · conveyor · cat) was ten competent *gadgets*. The user's `/goal` directive (2026-11-14) asked for "genuine originality… every level a brand-new world", so v1 was rewritten around **verbs**: what the thumb does and what kind of thinking it asks for. The v1 gadgets are not lost; they live in `docs/gdd/06-idea-garden.md` ("Act 2 v1 gadget shelf") and several return in Acts 3–5.

---

## 1 · What Phase 1 taught us (these are findings from the build, not opinions)

| Finding | Consequence for Act 2 |
| --- | --- |
| **The cable is delicate.** Bend smoothing at rest made cables creep; a curl bias made them coil and resist straightening. It only felt right as a plain rope with friction, smoothing only while carried or taut, and a gentle settle into a neat arc once seated. | Every new object that touches the cable (hoops, hubs, tape, a shared plug) is born as a **toy room** with the rest-stability/inextensibility/reach regression *before* it gets a puzzle. |
| **Tidy is a physics outcome.** Cables learned to settle into nested arcs; Tidy became attainable and beautiful. | Anything that changes where cables settle must say how it interacts with the settle. Solver crossings are judged the way the player sees them. |
| **Hit areas fight each other.** A brick stole taps from the switch; the magnet judged the lagging plug, not the aim. | Every new interactive object gets a hit-area audit and a bot check. The **aim point** is the source of truth for intent. |
| **The solver-as-muse works.** L6 and L10 came from search. Hand-tuning clean reach gaps was the slowest part of Phase 1. | Levels are **found by search, curated by taste**. The search tool gets one template per mechanic. |
| **The best puzzle was the packing one (bricks).** Visible rule, tempting wrong move, clean aha, lowest luck score. | Insight density first; `p_luck ≤ 0.25` for puzzle levels. |
| **A scripted surprise landed (the Power Cut).** | Act 2's surprises stay scripted and legible: the cat's two appearances (19, 20) and the Wake of the boss. |
| **The bot is a real teammate.** It found three UX bugs and a physics bug no reading would have. | Every mechanic ships with bot support: solved by *real drags* before it is called done. |
| **Pure-sweet-spot puzzles collapse.** If a strip can move anywhere, "move it first, then plug" trivialises it. | A movable thing needs a **reason the order matters** (limits that bite *while seated*), or it is only a teaching level (L11 is exactly that, openly). |

### The originality audit (why v1 was cut, why v2 holds)

For every candidate we asked: *what does the thumb do that it has not done before, and what is the player thinking about?*

| Verb (what the thumb means) | Logic family | Level |
| --- | --- | --- |
| **push** the power to the devices | sweet-spot geometry (teaching) | 11 |
| **thread** the cable through hoops | topology / route-through | 12 |
| **carry one plug with two cables** | intersection of constraints | 13 |
| **mend** with a limited roll of tape | resource allocation + a hand ritual | 14 |
| **feed the feeder** | dependency graph (set piece) | 15 |
| **wake a helper first** (a device that changes the room) | cause and effect | 16 |
| **spin** a table and **wind** the cables | physical manipulation / unwinding | 17 |
| **plug on the tick** | rhythm (the breather) | 18 |
| **sneak** by light, sound and soft hands | stealth / perception | 19 |
| **conduct** everything, with a cat | composition (boss) | 20 |

Ten verbs, ten logic families, ten rooms. No two adjacent levels share a signature object, an aha type or a surprise. Gadgets that are *only* a budget or a lane (breaker, bridge, clips) were shelved: they are a different dimension of the same verb we already have.

## 2 · The shape of Act 2

| # | Title | Room · light · sound | Signature object | Cast (★ new device) | Class · difficulty |
| --- | --- | --- | --- | --- | --- |
| 11 | **Slide** | Garage bench · 4 pm tungsten · steel rail clack | ridged steel strip on a brass-capped rail | ★Spike (drill), Lux (lamp), Dot (phone), Gus (console) | teach · 4 |
| 12 | **Fairy Lights** | Pegboard at golden hour · glass bell scale | hoops with glass bulbs | Wick (lamp), Static (radio), Boxy (laptop) | puzzle · 5 |
| 13 | **Stereo** | Garage party · panned chimes, bass thump | the Y-plug: one plug, two cables | ★Lefty & ★Righty (speakers), Spike | puzzle · 5 |
| 14 | **Tape It** | Bench at dusk · rip of tape, copper zzt | the roll of silver gaffer tape | ★Gluey (glue gun), Dot, Lux | breather · 4 |
| 15 | **The Pegboard Wall** | The wall, vertical · relay clacks, an LED wave | a strip with its own cord | the whole bench cast | set piece · 6 |
| 16 | **Puddle** | Kitchen tile · early evening · wind loop, "cling" | the shimmering puddle + a wind line | ★Dryer, ★Whisk (mixer), ★Kettle | puzzle · 6 |
| 17 | **Lazy Susan** | Dinner table · candle gold · brass tick-tick | the turntable and the hub the cables wind round | ★Toasty (toaster), Whisk, Kettle, Gus | hard · 7 |
| 18 | **Egg Timer** | Kitchen after dinner · metronome tick | the egg timer + filling rings | ★Tick (egg timer), Kettle, Static | breather · 3 |
| 19 | **Midnight Snack** | The kitchen at 2 am · hush, fridge hum, a radar of hums | a plug that is also a flashlight | Biscuit (asleep), fridge, a night-light | puzzle · 5 |
| 20 | **Breakfast for Twelve** | Sunrise kitchen · warm chaos | the whole table, and the sun coming in | everyone; Biscuit awake | boss · 8 |

**Time of day** (Act 1 was a desk morning): 11–15 afternoon → golden hour; 16–18 evening; 19 two in the morning; 20 **sunrise** (the Wake of the boss is literally a dawn). **Root of the music** moves up a semitone to D♭ at Act 2 (`Audio.setRoot`): a small change you feel as "a different room".

**Mixing rule:** each level carries at most three active mechanics, **one new**. Known mechanics (keys, reach, bricks, dead sockets, switch, obstacles, noCross) fill the rest; the boss may stack.

**Difficulty sketch:** 4 · 5 · 5 · 4 · 6 · 6 · 7 · 3 · 5 · 8. Breathers at 14 and 18; a hush at 19; nothing is hard three times in a row.

## 3 · The feel layer (B0): what changes under the thumb in *every* level

Phase 1 made the thunk. Phase 2 makes the thunk **mean something**. These apply to Act 1 as well.

1. **Dynamic thunk.** Contact power (release speed, how centered the aim was) scales the body, the pin click, hit-stop, shake, squash and the haptic. A gentle placement is a soft *tk*; a fling is a *THUNK*. No two are identical (micro-variation); a perfectly centered seat has a crisper click.
2. **Material worlds.** `def.world`: **desk** (felt, wooden knock), **steel** (workbench: a bright inharmonic ring after the knock, lower friction), **tile** (kitchen: a clack and a ceramic tick), **night** (muted, close). The surface changes how the thunk *sounds* and how far a loose cable slides: texture you can hear and feel.
3. **Stereo.** Every sound is panned by where it happens on the stage (wake chimes, seats, pops). Level 13 turns that from an effect into a theme.
4. **Cables are strings.** Tap or strum cables and they *vibrate* (a visual standing wave) and sound a plucked note whose pitch comes from the cable's length (pentatonic). Sweep a finger across several cables and you play a harp. A Click-Test fidget that is also the seed of Act 4's music levels.
5. **Tension creaks.** A taut carried cable has its own thin, rising creak (separate from the rustle); the lamp-and-phone squint was visual, now it is audible too.
6. **Plug lean and neighbours.** The carried plug leans into its motion (inertia you can see); seating a plug makes the plugs and cables next to it shiver, decaying with distance.
7. **Cable contact tock.** A cable that strikes an obstacle gives a soft, speed-scaled *tock* and a puff of dust.
8. **Per-device wake voices.** Phone: bright two-note blip. Tablet: a warm yawning sweep. Laptop: a boot chime in fifths. Console: a chip arpeggio. Lamp: a glass *ting* and filament hum. Radio: a tuning sweep into a note. Drill: a whirr resolving to a pitch. Layered *under* the chime ladder so the chord still composes itself.
9. **Postcards.** The level caption becomes a polaroid on the Wake and an album page (the first piece of the collect loop). *(B11)*

## 4 · Level cards

Layouts are intent; numbers come from the search tool and validator exactly as in Phase 1.

### Level 11 · "Slide"          *The Workshop · 4 pm · heft*
- **Aha.** The strip is not fixed. Slide it along its rail until every cable stops squinting; the power comes to the devices.
- **Signature.** The ridged steel strip on a brass-capped rail with detent teeth: a drawer on good runners.
- **Soul + cast.** Heft, the satisfaction of a well-made tool. **Spike** the drill (impatient; whirrs and jitters), **Lux** the clamp lamp, **Dot** the phone, **Gus** the console.
- **Form.** The felt becomes a **brushed-steel work mat**; cool steel with warm tungsten from the upper left; a rail along the bottom with two brass end stops; screws, a vice and a tape measure in the corners; sawdust motes.
- **Thumb's journey.** Dot's plug is close and fine. Spike's cable is short: drag it and the drill squints ("oof"). The strip's end caps pulse a chevron once: drag the strip. It *glides with weight*, clunking over detents (*tikka-tikka*), and the seated plugs ride along, their cables trailing. Slide too far and a cable goes taut: the strip stops against the cable with a rubber-band *bonk* and a squint. The player *feels* the sweet spot: every squint relaxes at one detent, which lands with a deeper clunk.
- **Trap.** The first detent that helps three of the four devices (a decoy). Plugging everything and then sliding strands the long cable.
- **Delight budget.** Flick the strip and it glides through the detents on momentum and bonks the end stop with a brass *ting* (a fidget in itself); the rail's teeth glint as it passes; Spike's whirr. **Wow:** at the sweet-spot detent the four LEDs chase on like a drumroll as the devices wake.
- **Wake gag.** Spike drives a screw into the bench; a puff of sawdust.
- **Sound twist.** Steel: a bright inharmonic ring after every knock; the rail ratchet.
- **Secret.** Tap the tape measure before winning: it zips out and snaps back. **Caption:** "Moved the mountain. Mostly the strip." **Teaser:** a dark glass bulb hanging in from the left edge.
- **Engine.** Kinematic strips: a strip with a `rail` (endpoints + detents) is draggable by its body, with momentum, detent magnets and end stops; its sockets move (`Rules.moveStrip`), seated plugs ride (pinned roots move), seated cables limit the slide (the strip stops *before* a cable would exceed its reach). Reach is computed per detent (`reachAt`). Solver: BFS over (detent, assignment).
- **Validator/bot.** Solvable; a decoy detent exists (3 of 4 reach); class *teach*, `p_luck ≤ 0.55` over a random legal player that also slides. Bot action `slide` (a real drag on the strip body).
- **Risks.** Strip drag vs plug drag: the plug always wins a touch contest; the strip has visible grip caps.

### Level 12 · "Fairy Lights"          *The Workshop · golden hour · delicate craft*
- **Aha.** A device only wakes if its cable passes **through** its hoop. The cable is the string; thread it and the glass bulb lights.
- **Signature.** The pegboard slalom of hoops, each two brass-capped posts with a glass bulb between them.
- **Soul + cast.** Delicate, patient craft (threading a needle). **Wick** the lamp, **Static** the radio, **Boxy** the laptop; the three bulbs have tiny sleeping caps and open their eyes when lit.
- **Form.** The golden-hour pegboard: perforated hardboard with painted tool outlines (hammer, saw, spanner), hoops at different angles forming a slalom between the devices (top) and the strip (bottom). Warm window light.
- **Thumb's journey.** Drag a plug straight at the strip: the cable catches on a post and goes taut. The bulb flickers unlit. Now thread: slide the plug through the gap; as the cable passes, the bulb **lights** (a glass *tink*, the next pentatonic note) and gold glints ride the cable. The device wakes only when every hoop on its route is lit; a device seated with an unlit hoop stays in standby (a yawning face) and its hoop *blinks*.
- **Trap.** The shortcut: a long cable can physically go round the outside of a post. It reaches, it seats, and the device stays dark: teaching that the *route*, not the destination, is the rule.
- **Delight budget.** The bulbs hum a chord when all are lit; fat bricks cannot pass a narrow hoop (the posts stop them: a *bonk*); the Wake lights the painted tool outlines like marquee bulbs. **Wow:** the whole wall fills with light in a wave.
- **Wake gag.** The bulbs chase along the wall; the radio plays a tiny glass-bell scale up the board.
- **Sound twist.** Glass bells (high, inharmonic partials), the *tink* of each thread.
- **Secret.** The first bulb on the left is always on ("somebody left it on"). **Caption:** "Threaded the needle. And the wall." **Teaser:** a speaker cone with two cables peeking in.
- **Engine.** `gates: [{id, x, y, rot, gap}]` = two post obstacles plus a gap segment. Devices declare `via: ['g1', …]`. Reach is the geodesic **through the gap midpoints** in order. At runtime each cable polyline is tested against its gap segments (parity of crossings); `st.thread[plug][gate]`; `Rules.power` needs seated ∧ energized ∧ threaded. Bulb art, glass audio.
- **Validator/bot.** Via-reach honest (decoys: the around-the-post route is *long enough to seat* but unthreaded); `p_luck ≤ 0.40`; the bot drives the plug along the via waypoints.
- **Risks.** Legibility of "why isn't it waking": the hoop blinks and a caption "through!" appears once.

### Level 13 · "Stereo"          *The Workshop · party night · playful*
- **Aha.** **One plug, two devices.** The plug has two cables and must sit where **both** can reach; the room is a Venn diagram of reach disks. And now the room has a left and a right.
- **Signature.** The Y-plug: one plug, two cables branching to two speakers.
- **Soul + cast.** Playful companionship; two halves of one sentence. **Lefty** and **Righty** glance at each other and blush when the plug lands; **Spike** crashes the party as a single.
- **Form.** The garage party: a string of bulbs, a disco-ball glint, the two speakers on crates at the top corners, the strip below. Coral cable to Lefty, sky to Righty, the plug's collar split in two colors.
- **Thumb's journey.** Drag the Y-plug down: one cable goes taut first (Righty squints) and the plug **stops**; steer toward the middle and both relax: the plug goes only where the intersection allows. Sockets 2–3 are inside it.
- **Trap.** The socket nearest Lefty: his cable is slack, Righty's is a bowstring.
- **Delight budget.** Every chime is panned: Lefty's wake chime in the left ear, Righty's in the right (they ping-pong); the pad *spreads wide*; the cones pump bass ripples across the mat that meet in the middle. **Wow:** the two ripple rings cross at the plug.
- **Wake gag.** The speakers bounce on a beat; confetti on the bass.
- **Sound twist.** Stereo panning as a theme; a bass thump.
- **Secret.** Tap a speaker cone before winning: it *thumps* and the other answers. **Caption:** "Left, right, and exactly one plug in the middle." **Teaser:** a roll of silver tape rolling in from the bottom left.
- **Engine.** `sharePlug`: a plug owns two ropes; the plug is projected into the intersection of both reach disks (alternating projection) and both cable tips follow it; `Rules` reach is the max of both; power wakes both. Y-plug art.
- **Validator/bot.** Reach intersections computed; `p_luck ≤ 0.40`; hint/bot unchanged (the plug is still one drag).
- **Risks.** Two ropes pulling one plug: a toy room first (no jitter, no lock-ups).

### Level 14 · "Tape It"          *The Workshop · dusk · tenderness (a breather)*
- **Aha.** Frayed things carry no power. A roll of tape can mend **only so many**; choose what to mend.
- **Signature.** The roll of silver gaffer tape with its torn tongue and its smiling face.
- **Soul + cast.** Tenderness: fixing something small. **Gluey** the glue gun (embarrassed about the fray), **Dot**, **Lux**, and **Roll** the tape.
- **Form.** The bench at dusk: warm lamp pool, a pegboard behind; the strip has a few scorched sockets (copper showing, a faint blue spark); Gluey's cable has a bare patch.
- **Thumb's journey.** Plug the glue gun: it stays sad, its face wincing at the patch. Roll pulses. **Drag the tape's tongue to the patch and wrap**: scribble circles around it; each half turn is a *rip-tick* and a haptic tick, the tape winds on, a silver band appears, and Gluey wakes with a sigh. The roll has three wraps; the strip has more frayed sockets than that.
- **Trap.** Mending a socket you didn't need: a wasted wrap strands a later device.
- **Delight budget.** The roll jiggles when you hover; tape ripping is a real, satisfying sound; Gluey blushes; hold-to-mend works as an alternative to scribbling (accessibility). **Wow:** the taped patch is a stiff silver section that visibly changes how that cable bends.
- **Wake gag.** Gluey squeezes out a heart of glue.
- **Sound twist.** Tape rip (filtered noise sweep) and copper *zzt*.
- **Secret.** Peel the roll's tongue all the way to its end: "the tape's last inch" is a four-leaf clover. **Caption:** "Mended. Mostly with tape." **Teaser:** a faint steam curl from the right edge.
- **Engine.** `frayed: {sockets, cables}` and `tape: {wraps}`; a mend gesture (drag the tongue → circular scribble or hold) turning a frayed socket/patch into a mended one; mended cable patches become stiff rope segments; solver: an assignment is valid iff `used frayed sockets + frayed cables ≤ wraps`.
- **Validator/bot.** Tape budget makes the solution set small; the bot performs real circular drags; class *breather*.
- **Risks.** The scribble gesture on small screens: radius band is generous; hold alternative; reduce-motion safe.

### Level 15 · "The Pegboard Wall"          *The Workshop · late afternoon · pride (set piece)*
- **Aha.** **Power the powerer.** One strip has its own cord and plug and its sockets are dark until that plug is seated in an energized socket: a daisy chain.
- **Signature.** The pegboard wall (vertical) with tool silhouettes, strips screwed to it, the wave of light running through the chain.
- **Soul + cast.** Workshop pride; a wave. The whole bench cast cameos. Spike, Lux, Static, Gluey, Dot and Boxy wait on hooks.
- **Form.** The mat becomes a wall: perforated board, hooks with outlines of the tools that *aren't* there, a wall outlet at the top corner, two strips screwed to the board, a tool chest below.
- **Thumb's journey.** Plug a few devices into the chained strip first: nothing wakes; they stand by (dim) and the strip's LEDs are dark. Its cord's plug glows faint. Plug the cord into strip A: **a wave of light runs through B's LEDs one by one** and the standby devices wake in a cascade.
- **Trap.** Plugging into the unpowered strip first (no punishment, a lesson).
- **Delight budget.** The relay clacks; the hooks sway when the wave passes; the tool outlines on the board fill with colour as light flows through. **Wow:** the entire wall floods warm in one sweep.
- **Wake gag.** The wall's tool outlines light as marquee bulbs.
- **Sound twist.** The LED run (a *brrrip*) and relay clacks.
- **Secret.** Tap the hammer outline: a tiny hammer swings in. **Caption:** "Power the power. The wall approves." **Teaser:** steam from a kettle.
- **Engine.** `strips[].cord: {len, plug}` → a cord plug (not a required device) with a rope rooted at the strip's cord port; `Rules.energized` recursion (switch ∧ fed); cycle check; hint treats feeder plugs as actions.
- **Validator/bot.** Static solve over feeders; `p_luck ≤ 0.25`.

### Level 16 · "Puddle"          *The Kitchen · early evening · wonder at cause and effect*
- **Aha.** A device can help another. A socket sits in a puddle and refuses; wake the **hair dryer** and its warm wind dries it.
- **Signature.** The shimmering puddle and the dotted line of wind from the dryer to it.
- **Soul + cast.** Curious wonder. **Dryer** (loud, over-enthusiastic), **Whisk**, **Kettle** (whistles when the room is dry).
- **Form.** Terracotta-and-cream tile with grout lines, a checked tea towel for the mat, a window shaft of evening light, the puddle's sky reflection.
- **Thumb's journey.** The best socket is in the puddle: plugging in refuses with a splash and a *bzzt*. The Dryer's cable is short and reaches only one dry socket. Waking it blows a visible gust: the puddle *shrinks with a shimmer*, a drip lingers, a tiny *cling* when it is dry. Now the wet socket is safe.
- **Trap.** Going for the wet socket first.
- **Delight budget.** The tea towel flutters in the wind; cables sway; the puddle shows the sky; the first time waking something **changes the room**. **Wow:** the dried puddle leaves a tiny rainbow.
- **Wake gag.** The dryer's wind lifts the tea towel and Whisk's whiskers.
- **Sound twist.** Wind loop (shaped noise) and the ceramic *cling*.
- **Secret.** Tap the puddle: it splashes and a rubber duck floats up. **Caption:** "Dried it. Wired it. Whisk says thanks." **Teaser:** the brass rim of a turntable.
- **Engine.** `wet: [{x, y, r, sockets}]`; devices with `tool: {type: 'dryer', cone}`; `st.dry` (instant in the static model: covered wet sockets are legal once the dryer is seated); runtime wetness decays under the cone; refuse reason `wet`.
- **Validator/bot.** Order matters (dryer first); `p_luck ≤ 0.30` with wet sockets illegal until dry; the bot waits for the dry-tick.

### Level 17 · "Lazy Susan"          *The Kitchen · dinner · mesmerizing spin*
- **Aha.** Spin the turntable and the sockets on it come to you, but **the cables wind around the hub**, eating their own length. Unwind before you pull.
- **Signature.** The brass turntable, its hub, and four cables wrapping it like a maypole.
- **Soul + cast.** Dinner-party warmth and delight at motion. **Toasty**, **Whisk**, **Kettle**, **Gus** around the table.
- **Form.** The dinner table under a candle: a round brass turntable in the middle with a ring strip, a hub post at its centre, devices around the table's edge, cutlery as obstacles, golden candle light.
- **Thumb's journey.** Drag the turntable's rim: it spins with momentum, friction and a brass *tick-tick-tick* at every detent. A socket arrives at Toasty's cable: plug. Spin more: the seated cable is carried round the hub, **winding**, its slack disappearing until it goes taut and the plug *pings* out. Spin back to unwind.
- **Trap.** Spinning freely with everything seated.
- **Delight budget.** The table is a fidget toy on its own (a flick keeps spinning); the cables wrap with real rope physics; the candle flame leans with the spin; **wow:** all four cables wound to the hub like a maypole as the Wake begins.
- **Wake gag.** Toasty launches toast that lands on the lazy Susan and rides it round.
- **Sound twist.** The brass detent tick; a low bearing hum.
- **Secret.** Spin the table 5 times: the candle sneezes out and relights. **Caption:** "Seconds, anyone?" **Teaser:** the beam of a torch sweeping the dark.
- **Engine.** Kinematic **turntable** mount (the same machinery as the rail, angular); hub as an obstacle; seated plugs ride; strain-pop on over-wind. Solver is `simulate`: discrete angle detents × winding numbers.
- **Validator/bot.** A scripted solution plan the bot executes with real drags (spin to detent, seat, spin, seat…).
- **Risks.** Multi-wrap rope behaviour: toy room first, strict rest-stability and no-tunnelling checks.

### Level 18 · "Egg Timer"          *The Kitchen · after dinner · the breather*
- **Aha.** Some sockets are only open on their beat: a ring fills with light; plug when it is green. The kettle's whistle is the metronome.
- **Signature.** The egg timer ticking, and a filling ring around each timed socket.
- **Soul + cast.** Cozy rhythm; the whole room breathes. **Tick** the egg timer (smiles on each tick), **Kettle**, **Static**.
- **Form.** The kitchen after dinner, lamp low, a kettle ticking on the stove, soft cream tile, every timed socket wearing its ring.
- **Thumb's journey.** Plug in a closed socket: a soft *tick* and the plug hops back (no zap). Wait for the ring to fill and plug *on the tick*: a tiny perfect-timing sparkle. A plug seated during a window **stays** after it shuts (the window gates *insertion*, not power).
- **Trap.** None; it is a breather.
- **Delight budget.** The beat is the music: the room's pad pulses on it; a "hold to wait" assist is an option (a plug held over a closed socket auto-seats when it opens). **Wow:** four devices seated on four consecutive ticks form a rising phrase.
- **Wake gag.** The rhythm resolves and the kettle whistles a resolved note.
- **Sound twist.** Metronome tick; each ring's phase is a note.
- **Secret.** Tap the egg timer to set its dial. **Caption:** "Everything in its time." **Teaser:** a dark kitchen and one blinking fridge light.
- **Engine.** `timers`: per socket `{period, on, phase}`; `canSeat` returns `{why: 'closed', opensIn}`; static solve ignores windows; validator checks every window ≥ 1.2 s.
- **Risks.** Accessibility of timing: windows are generous; light and sound agree; assist exists.

### Level 19 · "Midnight Snack"          *The Kitchen · 2 am · hush and tenderness*
- **Aha.** In the dark the plug is a **flashlight**; live sockets **hum** (louder as you near); and a cat is sleeping on the warm spot: **how softly you place things is the volume**.
- **Signature.** The plug's lantern cone moving through a black kitchen.
- **Soul + cast.** Hush; tenderness; a held breath. **Biscuit** asleep (breathing visibly), the fridge's cold glow, a night-light.
- **Form.** Near-black room, a silver moonlight shaft, the fridge's thin glow; you see only a halo around the plug plus the faint outlines of things; awake devices light their own patch; the strip is a dim silhouette.
- **Thumb's journey.** Drag the glowing plug through the dark. A low hum grows toward a live socket (pan and pitch). Seat softly: a muted felt *tk* and a warm chime. Move fast or fling: a clink, Biscuit's ear twitches, a ring of alertness fills. If it fills she wakes, stretches, and **sits on the strip**: tap to pet her and she goes back to sleep. Never a failure.
- **Trap.** Sprinting; or searching with the finger instead of listening.
- **Delight budget.** Biscuit's breathing curve; the fridge hum shifts as devices wake; each device lights its own bubble of the kitchen, one by one. **Wow:** the last device wakes the fridge light and the first grey of dawn appears in the window.
- **Wake gag.** Biscuit opens one eye, stretches, and curls back into a purr.
- **Sound twist.** The hum radar; felt-soft seats; low fridge drone.
- **Secret.** Tap the fridge: its light clicks and Biscuit's tail flicks. **Caption:** "Nobody tell Biscuit." **Teaser:** the kitchen window turning from black to grey.
- **Engine.** `dark: {radius}` (a light-map mode with the plug as a lantern), `radar` (per live socket hum, gain/pitch by plug distance), `quiet` (noise = plug speed + thunk power vs a decay), a `sleeper` agent with states (asleep, stirring, awake, resting), pet gesture.
- **Validator/bot.** Static assignment; the bot moves slowly and never trips the cat; a second run proves a loud play wakes her and a pet resets her; p_luck n/a (perceptual).
- **Risks.** Readability in darkness: afterimages of strips at 40 % and a *Hint* that pulses the next socket.

### Level 20 · "Breakfast for Twelve"          *The Kitchen · sunrise · warm chaos (the boss)*
- **Aha.** *Layers*: a **daisy-chained** strip (15), a **wet** socket and a **dryer** (16), a **shared plug** (13), a **sliding** strip (11), and **Biscuit awake**, who naps on the warmest device and bats dangling plugs.
- **Signature.** The whole breakfast table and the sun coming in through the window.
- **Soul + cast.** Warm chaos, a family in motion. Everyone; **Biscuit** awake.
- **Form.** The kitchen at sunrise with a long counter, two strips (one on a rail), a puddle by the sink, the dryer on a stool, Toasty and the kettle at the end; a sun shaft that grows as the room wakes.
- **Thumb's journey.** Solved in visible layers: dry the puddle, feed the chain, share the plug, slide the strip, and let the cat decide the finale.
- **The cat (first full appearance).** Telegraphed (ears twitch, *mrrp*, a 0.8 s tail flick), redirectable (tap to pet: she stays six seconds; a spare plug as a lure), never destroys progress permanently, only ever pops **one** plug at a time and never during the Wake.
- **Delight budget.** Toasty launches toast into a ring of devices that each get a slice; the kettle's whistle resolves the act's chord; Biscuit curls on the warmest device and purrs. **Wow:** the sunrise. **Teaser:** a toy train whistle in the distance.
- **Engine.** Composition of the above plus the **agents** module (schedule, telegraph, lure, pet) and a `breakfast` finale.
- **Validator/bot.** `simulate` with the bot using the cat-lure strategy; `p_luck ≤ 0.15`; every agent action telegraphed ≥ 600 ms.

## 5 · Build order (toys first; every step ends green)

| # | Step | Exit check |
| --- | --- | --- |
| B0 | **Feel layer** (§3, items 1–8) plus the regression harness the later toys use. | The click is *better* (dynamics, materials, stereo, strum), Act 1 still passes the bot |
| B1 | **Rail toy → L11 Slide** (kinematic strips, drill art, steel world). | Sliding is fun on its own; solver/validator/bot green |
| B2 | **Hoop toy → L12 Fairy Lights.** | The cable never wedges; threading lights bulbs; unthreaded seats do not wake |
| B3 | **Y-plug toy → L13 Stereo.** | No jitter; intersection honest; stereo panning shipped |
| B4 | **Tape toy → L14 Tape It** (mend gesture, stiff patches). | Scribble and hold both work with real drags |
| B5 | **Daisy → L15 Pegboard Wall** (set piece). | Recursion and cycle checks in the solver; the wave of light |
| B6 | **Wet/dryer → L16 Puddle.** | Dry time ≈ 3–4 s; bot waits for the tick |
| B7 | **Turntable toy → L17 Lazy Susan.** | Winding never tunnels; rest stable |
| B8 | **Timers → L18 Egg Timer.** | Windows ≥ 1.2 s; assist works |
| B9 | **Dark + radar + quiet + sleeper → L19 Midnight Snack.** | The cat is charming and never frustrating |
| B10 | **Agents + L20 Breakfast for Twelve.** | The boss composes the act |
| B11 | **Hooks:** postcards, album, House Map, skins, chime sets. | Captions appear; the map shows lit rooms |
| B12 | **Acceptance gate + as-built notes + Pass 03.** | `GOAL.md` §7 per-phase gate |

## 6 · Questions Phase 2 must answer by playing (for the user's phone)

1. Does sliding (11) feel like a new verb or a chore? Is the sweet-spot *felt* (squints relaxing) without a hint?
2. Is threading (12) clear without the "through!" caption? Does the shortcut-then-dark teach or annoy?
3. Is the Y-plug (13) intuitive? Does panning delight or irritate with headphones off?
4. Is the scribble (14) pleasant on a thumb? Is hold-to-mend enough?
5. Is "power the powerer" (15) one idea? Is the wave worth the pause?
6. Is waiting for the dryer (16) a revelation or a wait?
7. Does winding (17) read as a physical rule or a glitch? Is it mesmerizing?
8. Is the metronome (18) calming? Does the assist feel like cheating?
9. Is the dark (19) readable? Do people tiptoe? Is the cat charming?
10. Does the boss (20) feel like an act-finale or a pile-up?
11. Does strumming cables (B0) become a fidget? Does it ever get in the way of nudging?

## 7 · Open water

- **A workbench sandbox** with every gadget of the act on one table.
- **A retractable-reel cable ("Tick")** as a cable skin: pull to extend, tap to retract.
- **Strum levels:** the cables-as-strings idea grows into puzzles where plug order plays a tune (Act 4).
- **Toast as a postcard:** the toaster's launch caught mid-air as a polaroid.
- **The kettle as the room's metronome** for every later rhythm level.
- **Taped-down cables:** tape as an anchor for tidy routing (the clips idea returns).
