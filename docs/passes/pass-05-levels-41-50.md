# Pass 05 · Lab & City (levels 41–50) — a fresh design pass

*Written 2026-11-16, after Phase 4 was built (levels 31–40). This is the design pass CLAUDE.md asks for before the next ten levels. It is a plan, not a build: nothing in this file is in the game yet. Every card below is a new world; none reuses a room from Acts 1–4, and each names its engine cost so the build can be sized before a line of code is written.*

---

## 1 · Debrief: what Act 4 taught (these shape this pass)

1. **Slack cables unthread.** A seated cable with slack relaxes onto the straight chord, past its gates. Fix that worked: latch the clip while the cable is seated (`mech-gates.js`, lanes levels only). Expect the same problem in any level where a plug must *stay* somewhere a cable can't.
2. **`tall: false` obstacles are invisible to ropes.** They are flat decals. A surface a cable must rest on needs `tall: true` (Level 36's floor).
3. **Gravity needs a floor.** Without one, a plug falls off the mat. A heavy plug also lags a fast finger, so the bot (and a player) needs a slower drag in a gravity world.
4. **A timed motion has to be sized around the global grace (0.8 s).** The top of a swing must lie outside the grace, or the trap seats late (Level 37: 5.2 s period).
5. **The golden secret that needs two fingers is real.** A period holds two bottoms, so one finger seats at most two plugs per period. Multi-touch goes through CDP touch in the probe (`golden37.mjs`).
6. **Repeat the bot, don't trust one run.** Level 40's lure looped one run in four; the fix (a beam that covers the sockets) only showed up on the fourth repetition.
7. **Validator bugs are design signals.** A wall on a gate post is an overlap; a rest arc that leaves the stage is a layout fault; "ambiguous reach" means a cable is 94–110 % of its length and should be re-sized, not waived.
8. **Cut scope is named, not hidden.** Level 40's trolley and fans clock were cut and logged. Act 5 keeps that discipline: a card lists what is *not* built.

## 2 · The shape of Act 5

Act 4 ended in a rack; Act 5 starts from the other end: the house's workshop, the lab, then the city. The act is a remix *and* a meta act, so its one hard rule is this: **each level brings exactly one new verb** and reuses only the engine parts that Acts 1–4 proved. That keeps the act legible and the build small.

- **Lab (41–45):** gadgets with a single purpose each: a fan, a torch, a crane, a memory, a mirror. The Lab's rooms are *smaller* than Act 4's (the workbench, not the station), so the mat reads as a table again.
- **City (46–50):** scale and time. The rooms zoom out (the dollhouse, the rewind reel, the duet), then the finale is the skyline: every room the player solved is a lit window.

## 3 · Identity cards (levels 41–50)

Each card: *Aha · Signature · Soul + cast · Form · Thumb's journey · Trap · Delight · Wake gag · Sound twist · Secret / caption / teaser · Engine cost (toy first).*

### Level 41 · "Fan Mail" — Lab · the box fan · whimsy, wind as a tool
- **Aha:** A fan cannot push a cable; it can carry a light plug down a gust.
- **Signature:** a **wind field**: a band of air across the bench (drawn as ribbons). A plug inside the band is pushed sideways; a plug outside it hangs. The fan's speed is a dial you turn with a drag.
- **Soul + cast:** **Doris**, a box fan with a grille face who is bored, and a pile of paper ribbons (the wind made visible). Pip the phone is the only device.
- **Form:** a long bench with a fan at the left end; the sockets are on a shelf across a gap the cable cannot cross directly.
- **Thumb's journey:** turn Doris up (drag the dial), then let the plug go into the gust; it rides the ribbons across the gap and lands on the far socket. Too strong and it blows past.
- **Trap:** the gust is too strong and the plug overshoots the shelf and falls off the bench (the fall is the lesson).
- **Delight:** the ribbons lift as the wind rises; the paper's rustle is the gust's loudness.
- **Wake gag:** Doris turns to face the plugs and sighs ("Mail!").
- **Sound twist:** the gust's pitch rises with the dial, and the fan's blades tick on each rotation.
- **Secret / caption / teaser:** a ribbon that lands on the golden socket; caption "Mail call." Teaser: a second fan turning on in another room.
- **Engine cost:** a wind force on ropes in a band (a per-rope extra acceleration inside a rectangle), a dial, ribbons drawn. **Moderate.** Toy first: `fan-toy.json`.

### Level 42 · "Torchlight" — Lab · the dark bench · candle-lit mystery
- **Aha:** You cannot plug what you cannot see; light reveals sockets, and a seen socket stays seen.
- **Signature:** **darkness with a lamp**: the room is black except a warm circle under the torch, which you drag. Sockets appear only when lit, then stay as ghost marks.
- **Soul + cast:** a brass **torch** (a flashlight with a fold-out handle) and a cat-shaped shadow that keeps moving the dark. Lux (lamp) is the one device, and it is switched off until its socket is found.
- **Form:** a bench in a black room, with a board of eight sockets of which three are real.
- **Thumb's journey:** drag the torch to light a socket; tap a socket to remember it; carry the plug to the remembered socket (remembered, not lit).
- **Trap:** a plug aimed at an unlit socket it has not seen: it is refused with a soft "not yet", and the torch is the only way to learn.
- **Delight:** each socket found clicks into the ghost ring; the ring grows as you learn the board.
- **Wake gag:** the room lights up all at once: the lamp's own light reveals every socket it has been wrong about.
- **Sound twist:** a socket's click is pitched by its key (the keyed sockets sing their colour).
- **Secret / caption / teaser:** find all eight without a refusal; caption "Found you." Teaser: a moth at the torch.
- **Engine cost:** a darkness overlay with a radial hole; a memory of seen sockets (a set in the room state); a refusal that depends on memory. **Moderate.** Toy first: `torch-toy.json`.

### Level 43 · "Crane Game" — Lab · the arcade claw · arcade clunk
- **Aha:** A crane lifts the blocker out of the way; the grip is the puzzle, not the target.
- **Signature:** an **electromagnet crane** on a rail above the bench: it moves along the rail (a drag), lowers (a second drag), and grips a heavy block when its magnet is on (a tap).
- **Soul + cast:** the **claw** (a bent steel hand with a magnet face) and a pile of **prize blocks** (the crane's targets), with **Rex** the radio who has been waiting for his socket under the pile.
- **Form:** a long rail across the top; a pile of blocks covers Rex's socket; the crane lifts them one at a time into a tray.
- **Thumb's journey:** drag the crane to a block, drop it, tap the magnet on, drag the block to the tray, tap off. Blocks that are left on Rex's socket keep him dark.
- **Trap:** dropping the magnet too early: the block falls back and clunks onto the pile, and the pile shifts (a new block now covers a socket).
- **Delight:** the arcade clunk of the grip; the tray's jingle; the pile shifting.
- **Wake gag:** the claw opens and waves once.
- **Sound twist:** each grip is a magnet hum that rises with the block's weight.
- **Secret / caption / teaser:** lift every block in one unbroken run (no drop); caption "Prize!" Teaser: a second crane in the next room, humming.
- **Engine cost:** a rail (Level 21's rail module), a magnet grip (Level 34's magnet, reused for blocks), blocks (Level 25's blocks). **Low to moderate: a composition.** Toy first: `crane-toy.json`.

### Level 44 · "Ghost Cables" — Lab · the replay · eerie-friendly
- **Aha:** Your last try is still on the bench, and it is a clue: its cables are ghosts, and a ghost cable shows the route that worked.
- **Signature:** the **replay ghost**: the previous attempt's cable routes are drawn faint and cold; a route that matches a ghost glows warm ("hot").
- **Soul + cast:** the **ghost** is not a character; the cables themselves are. Biscuit sits on the warm patch and watches the ghosts.
- **Form:** a bench with three devices and three sockets, a lamp in the corner.
- **Thumb's journey:** attempt once (the ghost is recorded); on the next attempt the ghost cables glow hot where your route follows them, and cool where it does not.
- **Trap:** the first attempt has no ghost to follow, so the level is harder than it looks: you must play once to learn.
- **Delight:** the warm glow as a route aligns with its ghost; the cold drift of a wrong one.
- **Wake gag:** the ghosts all line up into one shape and fade.
- **Sound twist:** a hot route hums on the chord of its device.
- **Secret / caption / teaser:** beat your own ghost (fewer seats than the last attempt); caption "Again." Teaser: a second ghost in the lamp.
- **Engine cost:** store the last run's rope polylines per plug (a small save: the room state), draw them, colour by distance. **Moderate; needs the save design.** Toy first: `ghost-toy.json`.

### Level 45 · "Mirror, Mirror" — Lab · the mirrored bench · elegant symmetry
- **Aha:** Every move on the left is made on the right, mirrored across the centre line; the solution is symmetric.
- **Signature:** the **mirror line**: a glass seam down the middle of the bench. A plug on one side has a twin on the other side, and dragging one drags the other in mirror.
- **Soul + cast:** **Pip** and **Pip's reflection** (a twin device with the same look, backwards). The mirror is a glass with a crack.
- **Form:** a symmetric bench, six sockets in three mirror pairs, two devices and their twins.
- **Thumb's journey:** place one plug and its mirror moves with it; the sockets are mirror pairs, so one move seats two plugs.
- **Trap:** a plug placed on the line itself: the mirror cannot tell which is which, and the pair collapses (the crack spreads).
- **Delight:** the mirror's chime as a pair seats together.
- **Wake gag:** the reflection steps out of the glass and waves.
- **Sound twist:** the twin's voice is the same note an octave down.
- **Secret / caption / teaser:** seat every pair without ever touching the crack; caption "Symmetry." Teaser: a second mirror, upside down.
- **Engine cost:** a mirror constraint on the input (a twin plug moves with its partner across an axis), reusing the rope twin (`rope.twin`, Level 2 Y-plug). **Moderate.** Toy first: `mirror-toy.json`.

### Level 46 · "Dollhouse" — City · the miniature · wonder and zoom
- **Aha:** The big room is powered by a small one: solve the miniature and its sockets become the real room's power.
- **Signature:** **recursion**: a dollhouse (a small board in a corner of the bench) with its own sockets, and its own plugs. Its sockets feed the big room's strip.
- **Soul + cast:** the **dollhouse**: a tiny version of this very room, with tiny devices. And **Lux**, who lives in the dollhouse and has a tiny lamp.
- **Form:** a big bench with a dollhouse in the top left corner, drawn at one fifth scale.
- **Thumb's journey:** plug the miniature (the same mechanic, smaller, two thumbs for the two rooms); the big room's strip lights when the miniature's socket is powered.
- **Trap:** trying the big room first: nothing lights, because its power is in the miniature.
- **Delight:** the zoom: a tap on the dollhouse flies the camera in, and the room becomes the dollhouse.
- **Wake gag:** Lux steps out of the dollhouse onto the bench.
- **Sound twist:** the dollhouse plays its own quieter version of the room's sound.
- **Secret / caption / teaser:** power the dollhouse before the big room; caption "Smaller than it looks." Teaser: a dollhouse inside a dollhouse.
- **Engine cost:** a second room instance (a sub-board) with its own strips and plugs, and a fedBy link from its sockets to the big strip. **High.** The most expensive card in the act: decide the scope before the toy. Option: a fixed two-board puzzle first, recursion later.

### Level 47 · "Rewind" — City · the tape reel · gentle magic
- **Aha:** Time is a verb: you can wind a cable back along its own path.
- **Signature:** the **tape reel**: a reel at the bottom of the bench; dragging it back rewinds every cable's motion (not just the last move), like playing tape backward.
- **Soul + cast:** a **reel-to-reel** machine (the Lab's old recorder), with **Rex** the radio playing the tape's sound.
- **Form:** a bench with three cables already tangled into a knot; the knot is the room's problem.
- **Thumb's journey:** wind the reel back to the moment before the knot formed, then replay the plugs forward on a better path.
- **Trap:** winding past a seat unseats the plug it made; the reel is a record, not a save.
- **Delight:** the reel's whirr; the knot unknotting as you drag.
- **Wake gag:** the reel winds itself back once to the beginning, and the room chimes.
- **Sound twist:** the reel's pitch falls as the tape is wound back.
- **Secret / caption / teaser:** unknot without winding past the first plug; caption "Rewind." Teaser: a second reel turning in the next room.
- **Engine cost:** a state history (per-frame rope positions, bounded) and a scrub back and forth. The undo stack exists (`pushUndo`), but a continuous scrub is new. **High; the memory budget is the risk.** Toy first: `reel-toy.json`, with a short history (eight seconds).

### Level 48 · "Duet With Yourself" — City · the recorded hand · collaboration
- **Aha:** Your own hand can play a part: record eight seconds of drags, and the ghost hand plays them back while you play the other part.
- **Signature:** the **recorded hand**: press the record dot, drag, press stop; the recording plays back as a ghost plug that holds a strip (the ghost holds, you move).
- **Soul + cast:** the **ghost hand** (a translucent thumb with a ring) and the **strip**, a long bar with sockets, that the ghost holds still.
- **Form:** a long bar across the mat, a socket every 40 units, and two devices on either side.
- **Thumb's journey:** record your first hand (a plug moved and held), then play the second plug while the ghost holds the first. Two parts, one room.
- **Trap:** the ghost drifts if the recording is too long: the strip slides out from under it.
- **Delight:** the ghost's hand glowing when it holds; the duet's harmony when both parts seat.
- **Wake gag:** the ghost hand waves and fades.
- **Sound twist:** the ghost's voice is the same device as yours, an octave away.
- **Secret / caption / teaser:** both parts seat in the same second; caption "Together." Teaser: a third hand, faint.
- **Engine cost:** an input recorder (pointer events with time), a playback actor that drives a grab, and a strip that the actor holds. **High.** The input replay is the same machinery the bot uses; the risk is UX (pointer ownership). Toy first: `duet-toy.json`.

### Level 49 · "Brownout" — City · the power cut · the dark callback
- **Aha:** When the lights go out, the sound is the map: each socket has a pitch, and you find them by ear.
- **Signature:** the **brownout**: the room goes dark and quiet, and every socket hums its own note; a plug drawn near a socket changes the hum.
- **Soul + cast:** the whole room, and **Dot** the phone, whose screen is the only light (a ghost glow), and a **fuse box** that resets the lights when you tap it.
- **Form:** a dark mat with one lit screen; the sockets are cold until the hum finds them.
- **Thumb's journey:** drag the plug through the dark; its cable's pitch tells you how close it is to a socket; seat it when it sings.
- **Trap:** a plug on the wrong socket sounds the wrong note: it is refused, and it buzzes.
- **Delight:** the chord forming as sockets are found; the fuse box's clunk.
- **Wake gag:** the lights come back on all at once, with a whole-room chime.
- **Sound twist:** this level *is* the sound twist (the pitch is the map), so its audio is the test.
- **Secret / caption / teaser:** find every socket without the screen's light (no fuse reset); caption "Lights." Teaser: a distant thunder.
- **Engine cost:** a darkness overlay (shared with Level 42), a proximity pitch (a per-plug pitch from the distance to the nearest socket), a fuse reset. **Moderate.** Share the darkness with 42 to keep the act economical. Toy first: `brownout-toy.json`.

### Level 50 · "Blackout" — City · the skyline · the finale: wake the world
- **Aha:** Every room you solved is a lit window; power the skyline and the whole house is in the city.
- **Signature:** the **skyline**: the mat is a city at night; each solved level is a window that lights when its room is complete (read from the House Map's save).
- **Soul + cast:** the **city** (a skyline of towers, each tower is an act); the **house** (a single lit house at the centre, with the room you are in); and every cast member as a silhouette in a window.
- **Form:** a night skyline across the mat; the plugs are power lines from the house to the towers, and each tower needs its line.
- **Thumb's journey:** string the power lines from the house to each tower; each line lights a tower's windows; the last line lights the skyline.
- **Trap:** a line that crosses another darkens both (the crossing fault): a tidy city is a powered city.
- **Delight:** the towers light one by one; the skyline breathes.
- **Wake gag:** the credits are a single cable that runs through every lit window, and the skyline sings the house's lullaby (Level 30's tune).
- **Sound twist:** every tower has its act's chime; the finale plays all five.
- **Secret / caption / teaser:** every tower lit with no crossing; caption "Good night, house." Teaser: none: the finale is the last card.
- **Engine cost:** a composition of the rack (38), the patch (39), the House Map save (meta layer), and a skyline art. **Moderate; the save read is the risk.** Toy first: `skyline-toy.json`.

## 4 · The distinctness table (neighbours first)

| Axis | 41 Fan | 42 Torch | 43 Crane | 44 Ghost | 45 Mirror | 46 Doll | 47 Reel | 48 Duet | 49 Brownout | 50 Skyline |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Verb | blow | light | lift | replay | mirror | shrink | rewind | record | listen | connect |
| Vision | lit | dark | lit | lit | lit | lit | lit | lit | dark | night |
| Cast | Doris | Lux | Rex | the cables | Pip | Lux | Rex | the ghost hand | Dot | the house |
| Sound | rustle | click | clunk | hum | chime | cascade | whirr | harmony | pitch | chord |

Neighbours that must not feel alike: 42 and 49 share a dark room (49's verb is the ear, 42's is the eye); 46 and 47 are both time-ish (46 is scale, 47 is time).

## 5 · Decisions for the user (not defaults)

1. **Recursion scope (46).** A full second board is a high-cost engine piece. **Proposed:** a fixed two-board puzzle first; recursion (a board inside a board) only if the phone test says the miniature is the joy.
2. **Time scrub (47) and the recorded hand (48).** Both need memory: a bounded history of states, and a recording of input. **Proposed:** a short window (eight seconds), stored only for the session, never in the save.
3. **Darkness (42 and 49).** Two dark levels in one act is a repeat. **Proposed:** keep both, because the verbs differ (the eye in 42, the ear in 49), but confirm that the act can carry two dark rooms.
4. **The finale (50) reads the save.** The skyline lights from the House Map's progress. **Proposed:** yes, read-only; no write-back. Confirm that the finale may depend on the save.

## 6 · Build order *(toys first; each step ends green)*

| Step | What | Exit check |
| --- | --- | --- |
| E0 | **Wind field** toy (41's band and dial) | A plug in the band is pushed; outside it hangs; the dial sets the force |
| E1 | **L41 Fan Mail** | The bot rides the gust to the far socket; 3 stars |
| E2 | **Darkness with a lamp** toy (42 and 49 share it) | A socket lit once stays remembered; an unlit one refuses softly |
| E3 | **L42 Torchlight** | The bot finds all eight sockets; a refusal is soft |
| E4 | **Crane** toy (rail + magnet + blocks: a composition) | The crane lifts a block into the tray; a drop shifts the pile |
| E5 | **L43 Crane Game** | The bot lifts all blocks; 3 stars |
| E6 | **Replay ghost** toy (the last run's polylines) | A ghost draws; a route that matches glows hot |
| E7 | **L44 Ghost Cables** | The bot beats its own ghost on the second run |
| E8 | **Mirror** toy (a twin constraint across an axis) | A move on one side moves its mirror; a plug on the line collapses the pair |
| E9 | **L45 Mirror, Mirror** | The bot seats all pairs; 3 stars |
| E10 | **Dollhouse** (fixed two-board version, per §5.1) | The miniature's sockets feed the big strip |
| E11 | **L46 Dollhouse** | The bot powers the miniature first; 3 stars |
| E12 | **Reel** toy (eight-second history, scrub) | A scrub restores the rope positions; a past seat is unseated |
| E13 | **L47 Rewind** | The bot unknots the room; 3 stars |
| E14 | **Recorded hand** toy (record, playback, a held strip) | The ghost holds the strip for the recording's length |
| E15 | **L48 Duet With Yourself** | Both parts seat in one second; 3 stars |
| E16 | **Brownout** toy (the proximity pitch, shared darkness) | The pitch rises as a plug nears a socket |
| E17 | **L49 Brownout** | The bot finds every socket by ear; 3 stars |
| E18 | **Skyline** toy (the save read, power lines) | A line lights its tower; a crossing darkens both |
| E19 | **L50 Blackout** (finale) | The skyline lights from the save; 3 stars |
| E20 | Phase 5 acceptance gate (GOAL §7) | Every probe, four viewports, audio render, the phone question list |

## 7 · Questions Phase 5 must answer by playing (for the user's phone)

- **Fan Mail:** does the gust feel like a *decision* (how hard to blow) or a guess?
- **Torchlight:** is a refused socket in the dark a fair "not yet", or a punishment?
- **Ghost Cables:** does the second run feel like mastery, or like being chased by yourself?
- **Dollhouse:** does the zoom make the miniature magical, or only small?
- **Rewind:** is winding the knot back satisfying, or does the reel feel like cheating?
- **Duet:** can a thumb hold a ghost's strip and play its own part without feeling split?
- **Brownout:** is the pitch-as-map readable on a phone speaker, or only on headphones?
- **Blackout:** does the skyline feel like the reward for the whole house?

## 8 · Open water *(ideas kept for later; not promised)*

- A **Greenhouse** room (light and growth: a cable grows a shoot toward a lamp).
- A **Circus** room (rotating sockets on a ring: the timer of Level 18, round a drum).
- A **Candy Land** room (licorice cables that stick to a candy path).
- A **holiday** room (the Tree: lights strung and lit as one cable).

Each one needs a card of its own before it may be built (CLAUDE.md, standing order 2).

## 9 · As built

**E0 · the wind band (built 2026-11-16).** A rope has a `wind` band `{x0,x1,y0,y1,ax,ay}` (`src/rope.js`): a node inside it is pushed by (ax,ay) px/s² each step, and the level's band is handed to every rope at construction (`src/room.js`, `wind: def.wind`). Toy: `tools/playtest/defs/wind-toy.json` and `fan.mjs` (two checks, real mouse: a plug let go inside the band is carried 161 u along it; the control above the band moves 1 u). **What the build taught:** a gust is a *position* push per step, so it fights the bench's friction: on the desk (friction 1) the same push moved the plug 2 u, and on the smoother Lab bench (`WORLDS.lab`, friction 0.2) the plug moves at once. Friction belongs to the world, not to the gust.

**E1 · Level 41 "Fan Mail" (built 2026-11-16).** A fence of books runs edge to edge across the bench, with one slot (x 270 to 310) straight under a socket (S.1 at (290, 250)). The gust is a straight lift (`ay -1000`) in the band in front of the fence: a plug let go under the slot is carried up through it and caught on the socket. The catch is `Room.fanCatch` (`src/mech-fan.js`): a free plug within 22 u of a socket's mouth is seated by the same `canSeat`/`seatInto` path a hand uses, and the golden tumbler is found (`on: 'caught'`). The hand can thread the slot too (the bot does, in one action), so the gust is the magic and the secret, not the only way. **Design decisions taken here, for the user to confirm:** (1) the hand may solve it (not a trap: the gust is a choice); (2) the gust catch is a seat, so the golden secret rewards using the wind; (3) the fence runs edge to edge, because a fence that stops short lets a cable drag a plug around its end. **Verified here:** `fan41.mjs` (three checks: the gust catches the plug in S.1; the golden tumbler; the control behind the fence is not caught); validator (no hard failures; luck waived with its reason: one plug, one socket); real-drag bot 1 action (the hand route through the slot), three stars; `hints.mjs 41`. **Not built:** the dial (the fan's strength is fixed for now; the card's dial is the next step), the ribbons, and Doris's wake gag.

**E2 · the torch (built 2026-11-16).** The room's pool of light is `Room.torch*` (`src/mech-torch.js`): a press anywhere (not on a plug) puts the torch under the thumb, a move drags it, and every socket the pool touches is *seen* for the attempt (`st.flags.seen`, a ghost ring). A socket not yet seen refuses a plug (`Rules.canSeat`: `unseen`, only while `st.flags.dark`, so no validator state is affected), and the light hint is a drawn path from the torch to the socket a waiting plug fits (`Rules.hintLight`, type `draw`, so the bot and the hint both follow it). Toy: `tools/playtest/defs/torch-toy.json` and `torch.mjs` (five checks, real mouse: a dark socket is unseen; a plug over it is refused; a sweep makes it seen and it stays seen; the plug then seats).

**E3 · Level 42 "Torchlight" (built 2026-11-16).** Six sockets on a bench, three of them dummies that no plug fits; three keyed devices (Pip coral, Rex amber, Dot sky). The secret is `on: 'nofail'`: every turned-away plug is counted (`Room.refuse`), and the golden tumbler is found at the wake if none was. Validator: one arrangement, no hard failures (luck waived: keyed sockets; the torch is the puzzle). Real-drag bot: five actions (two light sweeps, three seats), three stars, the golden tumbler found. `hints.mjs 42`; the dark-room screenshot (the pool, the lit sockets with ghost rings, the devices faintly seen).

**A distinctness problem found while building E2 (decide before E16/E17):** Level 19 "Midnight Snack" is already a dark room: a lantern plug, a hum that rises as a plug nears its socket, and a cat. Card 49 (Brownout) proposes "the pitch as the map", which is the same verb. **Proposed:** 49 keeps the dark (the act needs a second dark room) but its verb changes: the room goes dark *mid-solve* (a brownout takes the lights away from a board you were already solving), so the player must remember the board, not find it by ear. That is a different question from Midnight Snack's.

**E4 · the crane (built 2026-11-16).** A magnet head on a cable (`src/mech-crane.js`): a press within 34 u of the head moves it, a tap (a press and release in place) switches the magnet. Tap over a prize and the magnet takes it, and the prize moves with the head; tap over the tray (or anywhere) to let it go, and a drop outside the tray is counted (`C.drops`). A prize is a tall obstacle (it moves with the head, so cables go round it), and a socket under an unlifted prize refuses a plug (`Rules.canSeat`, `covered`, from `st.flags.prizes`). The crane hint is a drawn path to the next prize or to the tray, and a `magnet` hint (a tap on the head) when the head is over the target. Toy: `tools/playtest/defs/crane-toy.json`, `crane.mjs` (seven checks, real mouse: a covered socket refuses; a tap takes a prize; it moves with the head; a tap over the tray lands it; a tap away drops it and the drop is counted; the socket seats once lifted).

**E5 · Level 43 "Crane Game" (built 2026-11-16).** Two prizes sit on the two sockets (C on Pip's, R on Rex's), and a third (K) lies in the middle of the cables' way. The golden hook is `on: 'unbroken'` (every prize lifted into the tray, no drop). Validator: no hard failures (Pip's rest moved to clear a heap); luck waived with its reason (keyed sockets). Real-drag bot: fourteen actions (a draw and a tap per prize move), three stars, the golden hook found. `hints.mjs 43`; the screenshot (the head on its cable, the tray, the prizes on the sockets).

**E6 · the ghost (built 2026-11-16).** A level with `ghost: true` (`src/mech-ghost.js`): the route each cable took when it seated is kept for the run (`R.route`), and at the wake the run's routes become the next run's ghosts (`G.ghostStore`, this page only: the refresh button keeps them, a reload forgets them, and nothing is saved). On the next attempt the ghosts are drawn cold, and a cable that follows its ghost (most of its points within 12 u of the ghost's route, share ≥ 0.6) is drawn warm. A plug's warm seat is judged at the moment it seats. Toy: `tools/playtest/defs/ghost-toy.json`, `ghost.mjs` (six checks: no ghost on a first attempt; the seat; the store; the next attempt has the ghost; a rope on its route scores 1.00; one far away 0.00). **What the build taught:** the first version kept the cable at the wake, but a cable settles after it seats, so the warm test compared a drag against a settled shape and never matched. The ghost must be the route the cable took *while it seated*, not where it rests.

**E7 · Level 44 "Ghost Cables" (built 2026-11-16).** A teacup (a tall circle, `art: 'mug'`) stands between three devices and three sockets; Rex's direct cable runs into it, so it has to go round. The golden spoon (`on: 'warm'`) is every plug seated warm, which is only possible on a second run that follows the first. Validator: no hard failures (cables 500 u); luck waived with its reason. Real-drag bot: a first run, three stars, no secret (correct: no ghost yet). `ghost44.mjs` (two runs in one page, real mouse: the first run seats all three; the second, after the refresh button, seats every plug warm and finds the spoon; repeated three times: the follow values were 0.65–1.00 against the 0.6 threshold). `hints.mjs 44`.

**E8 · the mirror (built 2026-11-16).** A level with `mirror: { axis, pairs }` (`src/mech-mirror.js`): grabbing a plug grabs its reflection with the same pointer, at the mirror of the finger (`Room.grabPlug` calls `mirrorGrab`); a move drives the reflection to the mirror of the finger (`mirrorMove`); a release lets the pair go together (`mirrorRelease`). A busy flag stops the calls recursing. A finger within 8 u of the seam cracks the glass (`mirrorRT.crack`). The mirror is the move, not a rope twin: the existing twin is for Y-plugs (Level 13) and is not reused. I built E8 on the level itself (no separate toy), because the geometry is the mechanic: the probe checks it directly.

**E9 · Level 45 "Mirror, Mirror" (built 2026-11-16).** Three devices on the left and their reflections on the right, six sockets in one strip at mirror positions. Each plug is keyed to its own socket (one answer), so a single drag of Pip seats Pip and its reflection. The golden crescent is `on: 'crackless'`: every pair seated and the glass never cracked. Validator: no hard failures (cables sized to their sockets, Pip's rests moved in off the edge); luck waived with its reason. Real-drag bot: three actions, three stars, six seats, the crescent found. `mirror45.mjs` (six checks, real mouse: one drag seats a pair; a clean run seats all and finds the crescent; a crossing cracks the glass and withholds it).

**The distinctness check, before E10 (a real problem found now):**
- **Card 46 (Dollhouse) repeats Level 39.** A miniature board whose cord feeds the big strip is exactly the Patch Panel's second board (a cord device, `fedBy`). The card's new verb ("the zoom") needs a camera change, which the game does not have. **Proposed:** re-card 46 before building: the miniature is a *copy* of this room's first bench in a corner, and solving it gives the big room's socket *keys* (the copy teaches the answer). That makes the verb "the answer is in the corner", which is new. Decide with the user if the copy-teaches verb is wanted.
- **Card 49 (Brownout) repeats Level 19.** Midnight Snack already has the dark room and the pitch-as-map (§E2 note). **Proposed:** the brownout takes the lights away *mid-solve* (a board half-solved in the light must be finished in the dark from memory). That is a different verb (memory, not ear).

**E10 · the dollhouse, re-carded (built 2026-11-16, the choice is logged here for the user to overturn).** Card 46 was re-carded, not built as first written. The verb is now a *lock that opens on a sub-puzzle*: the big room's two sockets are `doll` (locked, `Rules.canSeat: locked`, which only bites when `st.flags.doll` exists, so validator states are unaffected), and a miniature board in a frame at the top has its own two `mini` devices. When every miniature plug is seated, the lock opens for good (`src/mech-doll.js`). The solver and the validator see one answer; the hint leads to the miniature first (`Rules.hintDoll`). A plug let go on a locked socket says "locked" and is counted. The golden door-knocker is `on: 'nofail'`. **A real bug found on the way:** the big strip had a pitch of 90 for two sockets, so they sat at x 135 and 225, not the 90 and 270 the card meant; the seat missed by 51 u (the engage radius is 44). Level 46 now has pitch 150. Toy: none (the level is the probe: `doll46.mjs`, eight checks: the refusal and its count; the miniature; the house opens; the big room seats; the door-knocker on a clean attempt). Bot: four actions, three stars, the door-knocker found. `hints.mjs 46`.

**E11 · the brownout, re-carded (built 2026-11-16).** Card 49 was re-carded (its old pitch-as-map repeated Midnight Snack). The verb is memory: the first seat takes the light for six seconds (`src/mech-brownout.js`). The bench goes black except a lantern under each plug in a hand, and a small LED on each seated socket. Plugs seat in the dark. A solve that finishes in the dark earns the golden crescent (`on: 'dark'`). Level 49: three keyed sockets, three devices. Validator: no hard failures (luck waived with its reason). Probe `brown49.mjs` (seven checks, real mouse): the first seat darkens the room; two plugs seat from memory in the dark; the crescent is found; the lights come back on their own; a solve finished in the light finds no crescent. Bot: three actions, three stars.

**E12–E13 · Level 47 "Rewind" (built 2026-11-16). The reel, not a time scrub.** Card 47 was "time scrub as a verb", which needs a bounded history of every rope's shape; that is a large engine piece with a memory budget, so this build takes the honest smaller verb: **a cable on a reel** (`src/mech-reel.js`). A device with `cable: { start, len, reel: true }` starts with `start` on the bench; dragging its brass drum down lets the cable out (to `len`), and dragging it up winds it back in (to a minimum of 110), drawing the plug home along its route. The rope's segment length is what changes (`rope.len`, `rope.seg`), so the cable's own constraints do the winding. The validator sees `len` (the most the cable can reach), and the hint leads a plug whose socket is out of reach to the drum (`Rules.hintReel`, a `draw` path). The golden hook is `on: 'rewound'`: a cable wound all the way back during the run. **Two decisions for you (E12):** (1) the verb is the reel, not a time scrub; the scrub is kept in Pass 05 §8 as open water; (2) the drum's gain is 1.6 units of cable per unit of drag. **Bugs found on the way:** the drum sat at the bottom edge, so the drag left the viewport (moved Pip up to y 430); the first gain of 1.2 made the drag too long for a thumb (1.6). Level 47: Pip (reel) and Dot. Validator: no hard failures. Probe `reel47.mjs` (seven checks, real mouse: the drum lets out and winds in; the cable reaches the far socket T.1; Dot seats T.2; the hook is found). Bot: three actions, three stars.

**E14–E15 · Level 48 "Duet With Yourself" (built 2026-11-16).** A recorder and a ghost hand (`src/mech-duet.js`). Tap the red record dot (top right), then drag a plug: its path (up to eight seconds, every 50 ms) is kept for the page (`G.duetStore`, never saved, like the ghosts). On the next attempt, after a 1.2 s pause, a ghost pointer (`GHOST_PTR`, -7) grabs the recorded plug with `grabPlug` and plays its path with `moveGrab`, then `releaseGrab`s it; the room's rules see a hand on the plug and nothing else. The golden crescent (`on: 'duet'`) is the ghost's seat and the thumb's seat within a second of each other. Level 48: a teacup between Pip (round the teacup to the far socket, recorded) and Dot (live). Validator: no hard failures (luck waived with its reason). Probe `duet48.mjs` (seven checks, real mouse: the record dot arms; the recorded drag seats Pip and is kept (60 points); a refresh; the ghost seats Pip; the thumb seats Dot as the ghost lands; the crescent). **What the build taught:** the duet is timed, not sequenced: the probe starts Dot's drag while the ghost is in its last 0.9 s, or the two seats fall more than a second apart. Bot: two actions, Lit and Clean (the cables cross round the teacup: Tidy unpromised, as stated in the level).

**E18–E19 · Level 50 "Blackout" (the finale, built 2026-11-16).** The city at night (`Art.DECOR2.skyline`): a row of towers, and one lit window for every room the player has solved, read from `G.Save.data.stars` (read-only: the finale shows the house's progress and changes nothing). The puzzle is a tidy one: five lamps in the house, five towers on the skyline's roof (keyed; the lines must not cross, so the order of the lamps is the order of the towers). Tidy is promised (`tidy: true`), and the golden door of the house is the crossing-free finish (`on: 'tidy'`). Validator: no hard failures (cables 540, the outer rests moved in, one curl flipped). Bot: five actions, three stars, the door found. `hints.mjs 50`; the screenshot (the skyline with its window count, the five lamps and their tangled lines in the start). **Not built:** a special wake (the card's lullaby, the house's own chime set) — the level's chime is the room's; and the save's credits cable, which needs the postcard module.

**E16–E17 · the brownout is Level 49 (built earlier); E20 is the gate (below).**

**E20 · the Phase 5 acceptance gate (run 2026-11-16, on the final code).**
- **Levels:** all ten exist (41 to 50), with the design changes logged above: 46 and 49 were re-carded by the build (their cards' originals repeated Levels 39 and 19), and 47 is a cable reel rather than a time scrub.
- **Full real-drag bot, 1 to 50:** every level wakes. Three stars everywhere except the unpromised Tidy on 10, 38, 40 and 48 (the stated reasons are in each level's comment).
- **Validator:** no hard failures (30 warnings: the waived luck and the warn-only margins). **Rules tests:** 225 passing.
- **Probe suite (final code):** every probe passes, the Phase 5 probes included (`fan`, `fan41`, `torch`, `crane`, `ghost`, `ghost44`, `mirror45`, `doll46`, `brown49`, `reel47`, `duet48`, plus the earlier suite). Waivers, each with its reason: `feel` check 10 (headless software raster, frame interval); `reel47` once under load in the suite (passes alone on repeated runs); `sling` and `groove` timing flakes in the earlier runs (pass alone).
- **Hints:** all 50 levels show something (50 with a hand). **Audio:** all sounds render finite and under full scale.
- **Owed to a phone (the feel that cannot be measured here):** the gust (41: does the wind feel like a decision?), the torch's refusal (42: a fair "not yet"?), the crane's tap (43: does the magnet read as a magnet?), the ghost's warm glow (44), the mirror's crack (45), the dollhouse's lock (46: "locked" as a rule of the house), the brownout's six seconds (49: fair, or cruel?), the reel's gain (47: is the drag the right length?), the duet's timing (48: a second is the right window?), and the skyline (50: does the city feel like the reward?).
- **Not built (kept as open water):** the time scrub (47), the lullaby wake of the finale (50), and the postcard credits (50).

