# Plug It In — Game Design Document

2026-11-14

(Local copy of the online doc: https://claude.ai/artifact/LhUUkSwku27wSG9oH6hszx — the online version is the one with comments and the diagram.)

## 1. Vision and pillars

Working title **Plug It In**: a one-thumb puzzle game where the satisfaction of a heavy plug clicking home is the product, and the puzzle is the excuse to do it again. Note: I could not see your screenshot, so this GDD assumes the premise you described (drag cables to power every phone, levels in sequence). Anything that conflicts with the screenshot, tell me.

**The fantasy:** you are the calm, slightly smug person who untangles the chaos behind the desk and makes everything glow.

**The one-line hook:** *Every level starts as a mess and ends as a lit-up, tidy little world.*

### Design pillars (these settle arguments)

1. **Touch is the game.** If a plug does not feel good to grab, drag, and seat with no puzzle attached, no mechanic can save it. Feel is tuned before content, always.
2. **The cable is a character.** It has weight, stiffness, and a texture. It never clips, jitters, or teleports. The player should trust it like a physical object.
3. **Readable at a glance, deep on a second look.** One screenshot should show the whole problem. Depth comes from how rules interact, not from rule text.
4. **Solve it, then make it beautiful.** Solving is thinking; finishing is a reward moment. Both are designed. A solved level always ends in a satisfying visual and audio payoff.
5. **No dead time, no punishment.** Instant restart, unlimited undo, no lives, no timers by default. Failure is a nudge, never a wall.

### Who it is for

Commuters and couch players: sessions of 2 to 10 minutes, played one-handed in portrait, often with the sound off. So the game must feel good with haptics and visuals alone, and be even better with sound.

## 2. Core loop and the first ten seconds

The smallest playable loop is: **look, grab a plug, drag it to a socket, feel it seat, watch the device wake up, repeat until the room is lit, get the finish payoff, next level.** Everything else is a variation on which plug can go where.

### The micro-loop, moment by moment

1. **Idle.** The room breathes: dust motes, a faint standby glow on dead phones, plugs resting on the floor with their cables slumped in believable curves. Nothing is static.
2. **Touch down on a plug.** The plug lifts slightly (scale up about 8%, shadow spreads), the cable behind it tightens, a soft pick-up tick plays, and the phone pulses a light haptic. The plug is now held by a point slightly behind your fingertip, so you can see it.
3. **Drag.** The plug follows with a touch of lag and weight. The cable trails behind with real slack, swinging when you change direction. Compatible sockets glow gently as you approach, with no text and no arrows.
4. **Near a socket.** A magnetic pull starts inside roughly one socket-width: the plug leans and rotates to align, the socket lights its rim. Letting go here is forgiving; the game assumes you meant it.
5. **Release.** The plug eases in, overshoots 1 to 2 px, then seats with a short, firm thunk: a small squash on the socket, a micro screen shake, a crisp click, a medium haptic. The cable settles with a one-bounce wobble.
6. **Power.** The phone's screen blooms from dark to bright with a charging ring and a bouncing battery icon. Connected devices light their neighbors by a faint wire glow, so progress is visible.
7. **Finish.** When the last device lights: a short cascade of every screen flashing in sequence, a rising chord, confetti-like sparks along the cables, the camera easing out. One tap goes to the next level, loading under 300 ms.
8. **Mistake.** An invalid drop is not a buzzer. The plug politely pops back, the cable whips once, a soft wooden knock plays. It teaches without scolding.

### Starter level shape (the playable slice)

- 3 phones, 1 wall strip with 4 sockets, 3 plugs. Teaches grab, drag, snap.
- Level 2 adds a color pairing. Level 3 adds a cable that is too short to reach everything. By level 3 the player has met the core tension: **what goes where, and what blocks what.**
- Target: level 1 solved in under 15 seconds by someone who has never seen the game, with zero text instructions beyond a pulsing finger hint.

## 3. Feel spec: cable, plug, socket, sound, haptics

These are starting values to tune by hand in the first prototype. The numbers matter less than having a single tuning panel where every one of them is a live slider.

### Cable

- **Simulation:** a chain of 24 to 40 points joined by distance constraints (Verlet integration), solved 6 to 10 times per frame. The plug end is pinned to the finger or the socket; the source end is pinned to its device.
- **Length is a rule, not a decoration.** Each cable has a fixed length. Slack shows as curves, a taut cable straightens and visibly stops the plug (it resists, then pulls the plug back a few px). That resistance is the "reach limit" mechanic and the best source of weight.
- **Gravity and floor friction.** Slack drapes and rests on the floor with light drag, never sliding endlessly. A tiny amount of damping keeps it calm.
- **Texture.** Rendered as a thick stroke with a lighter highlight line offset to the upper left, a darker underside, and a subtle braid or ribbing pattern along its arc length (so the pattern stretches and bends with the cable). Cables cast a soft contact shadow on the floor.
- **Draw order.** Cables are drawn per-cable in a stable order. Where two cross, the upper one casts a small shadow on the lower, so overlaps read as physical, not glitchy.

### Plug

- Three visible states: **resting** (lying, slightly rotated by cable tension), **held** (lifted, aligned to drag direction), **seated** (flush, tiny glow at the rim).
- The plug head rotates to point along the cable's last segment while dragged, then rotates to the socket's orientation inside the magnet radius.

### Socket and snap

| Parameter | Starting value | Why |
| --- | --- | --- |
| Magnet radius | 1.2 x socket width | Forgiving on small phone screens |
| Snap duration | 90 to 120 ms | Fast enough to feel like a click |
| Overshoot | 1 to 2 px, one bounce | Gives the plug weight |
| Release hit-stop | 30 ms freeze on impact | The classic trick that makes impacts land |
| Drag lag | 0.15 of the finger gap per frame | Weight without sluggishness |
| Failed-drop pop-back | 180 ms ease-out | Fast, never punishing |

### Sound

Every interaction has a pitched family, so the room plays a little tune as you play: pick-up tick, seat thunk, device wake chime. **Each successive connection in a level raises the chime by one scale step**, so completing a level resolves a melody. Slight random variation (pitch plus or minus 3%) stops repetition fatigue. Cable drag has a soft rubbery rustle scaled to cable speed.

### Haptics

Three distinct patterns: light tick (grab), medium thud (seat), double pulse (level complete). Vibration support on mobile web is uneven, so the game must read as complete on visuals alone, with haptics as a bonus where available.

### Juice checklist (non-negotiable for the slice)

- Squash and stretch on plug and socket
- Hit-stop on seat, subtle camera nudge
- Screen-space glow and bloom on powered devices
- Particles: small sparks on seat, a ripple along the cable
- Idle micro-animations on every object (breathing glow, blinking standby LEDs)

## 4. Mechanic space: the wide brainstorm

Mechanics are **modules**: each level declares which are on. The aim is that any two can be combined without a special case, because each one only talks to the shared primitives (plug, cable, socket, device, surface). Below is the full pool; the starred ones are the curated core for the first 50 levels (section 7).

### A. Compatibility (what plugs into what)

- \* **Color matching.** Plug color must match socket color; wildcard sockets accept any.
- \* **Shape keys.** Two-prong, three-prong, round, USB-ish. Shape silhouettes help color-blind players.
- **Voltage and wattage.** Each device needs N watts; strips have a budget. A hairdryer drains a strip that can only also run two phones.
- **Adapters.** Pick up a dongle and place it in a socket to change its shape. It becomes an object you move, not just a cable.
- **Polarity.** A plug that must be flipped (tap to rotate) before it seats.
- **Daisy chains.** A strip can plug into a strip; the first strip limits the whole chain's budget.

### B. Cable physics and space

- \* **Reach limit.** Fixed length; taut cable stops the plug.
- \* **Crossing rules.** Per level: cables may cross freely, may cross only at marked bridges, or must never cross. A crossing constraint is the classic planar-graph puzzle in disguise.
- **Cable thickness.** Fat cables take more room and block tight corridors.
- **Snag points.** Hooks, chair legs, and cable clips that the cable wraps around. Pulling too hard slides it off.
- **Stiff cables.** A coiled cable that refuses to bend sharply.
- \* **Obstacles.** Furniture the cable cannot pass through; it routes around or goes over the top via a cable cover.
- **Elastic cables.** Stretch to 1.5x but pull the plug back like a spring.

### C. Strips and sockets

- \* **2- and 3-socket strips** (and 4, 6 for later levels), with different spacing.
- \* **Switches and dead sockets.** A broken socket looks sooty; a switchable strip must be flipped.
- **Breaker tripping.** Over budget and the strip pops with a click; sparks, retry, no penalty.
- **Timers and surge protectors.** A socket that is live for 3 seconds on, 2 off.
- **Rotating sockets.** A turntable strip the player spins by dragging.

### D. Damaged and special cables

- \* **Frayed cable.** Fails when used for more than N seconds, or when bent past an angle; must be swapped.
- **Spliced cable.** A cable with a connector in the middle where two segments can be re-routed.
- **Cable with a stuck plug.** Must be freed first by plugging something else.
- **One-way and USB-style reversible plugs.**
- **Magic cables.** Teleport cable ends between two linked sockets; the route is not physical.

### E. Dynamic and living worlds

- \* **Moving sockets.** A conveyor strip drifts left to right; timing the drop is the puzzle.
- \* **Moving obstacles.** A rolling office chair, a swinging pendulum lamp, a cat crossing the room.
- **Rotating furniture and sliding doors.** Opening and closing paths for the cable.
- **Rising water.** Plugs must be seated before the floor floods (a gentle timer, never a fail-state by default).
- **Devices that walk off.** A robot vacuum that carries a plug away until you intercept it.
- **Weather and time of day.** Wind sways cables; night makes sockets glow so you can find them.

### F. Win-condition twists

- \* **Power all.** The baseline.
- **Power exactly N.** Over-charging a device also breaks it.
- **Order matters.** A sequence puzzle: charge A before B or B shuts down.
- **Daisy-chain length.** Reach a far device with a minimal number of plugs.
- **Stars.** Optional goals: no crossings, fewest moves, a time limit. These feed replay, not progression.

## 5. Genre blends and wild ideas

The cable-and-socket core is a graph-routing puzzle with a physical skin. That skin can host other genres. Each idea below is a candidate *level type* or *world*; the strongest become boss-like set pieces.

| Blend | What the player does | Why it could work | Risk |
| --- | --- | --- | --- |
| **Sokoban** | Push plug blocks and furniture to clear a path for cables | Proven deductive depth | Can slow the snappy feel |
| **Flow Free** | Draw one non-crossing route per cable | Instantly graspable crossing rule | Becomes pure abstract if cables lose physics |
| **Rush Hour** | Slide devices and strips along rails to open lanes | Satisfying spatial order | Needs clean grid readability |
| **Tower defense lite** | A surge arrives in waves; route power to fire fans and lamps | A pace shift with the same inputs | Scope creep, needs timer tuning |
| **Rhythm** | Plugs must be seated on the beat as sockets pulse | Perfect fit for sound-and-haptic feel | Hard on accessibility, so keep it optional |
| **Escape room** | A level is one desk; powering items unlocks the next hidden thing | A story and discovery loop | Heavy content cost |
| **Cozy decorator** | Powering devices lights a growing room that the player keeps | Strong meta, emotional hook | Needs art volume |
| **Idle and sim** | Your lit-up buildings generate coins that unlock cable upgrades | Pull to come back daily | Dilutes the pure puzzle |
| **Logic gates** | Sockets act as switches; power must satisfy AND/OR conditions | A late-game brain-burner | Hard to teach visually |
| **Lights Out** | Toggling a plug flips its neighbors | Compact, tricky | Fights the "cable is physical" pillar |

### Wilder concepts worth a sketch

- **The Tangle level.** Start with a pile of crossed cables already plugged in; the puzzle is untangling by moving plugs one at a time until nothing crosses.
- **Two-hand level.** Two plugs must be held at once (multitouch) to span a gap, then a third plugged in with a thumb.
- **Ghost cables.** Replay your last attempt as a translucent cable the new route must avoid.
- **Mirror room.** Cables reflect across an axis; moving one side moves the other.
- **Dark rooms.** Only a small lit circle follows the plug; the rest of the layout is revealed as devices power on.
- **Gravity flips.** Tilting the phone (or tapping an arrow) changes where slack falls, so cable arcs move.
- **Cable as a tool.** A taut cable can pull a lightweight device toward you, or tug a lamp off a table to open a shortcut.
- **Shared outlet competition.** A "roommate" ghost cursor plugs things in, and you must leave them room.

## 6. Hook and retention: why one more level

The addictive part is not a trick bolted on; it is five loops running at different speeds, each feeding the next.

| Loop | Time scale | What the player feels | Design lever |
| --- | --- | --- | --- |
| **Touch** | 1 second | A plug seats and it feels great | Feel spec in section 3 |
| **Solve** | 20 to 90 seconds | The click of insight, the "oh!" | Levels with one clean insight each |
| **Finish** | 5 seconds | The room lights up in a chain | The payoff animation and melody |
| **Session** | 5 to 10 minutes | "One more", then another | Short levels, instant next, a visible bar of progress |
| **Meta** | Days to weeks | A world that grows, goals to chase | Section below |

### Why "one more level" works here

- **No cliff between levels.** The finish animation flows straight into the next room sliding in. Quitting requires a decision; continuing does not.
- **The Zeigarnik pull.** Each level ends with a visible glimpse of the next level's new element (a strange new plug, a moving chair). The player wants to see how it works.
- **Insight over grind.** Every level should have a single "aha". A level that is solved by trial alone is a failed level; a level solved by a clever idea is a win we want to repeat.
- **Win more than you lose.** Roughly 80% of levels are solvable on the first or second thoughtful attempt. Harder levels are spaced after easy breathers.
- **Flow tuning.** Difficulty follows a sawtooth: teach, apply, twist, breather, mini-boss. Never three hard levels in a row.

### Rewards that do not cheapen the puzzle

- **Stars per level (up to 3):** solved, solved with no crossings, solved with the elegant minimum. Stars unlock new worlds, so replaying a level for 3 stars is a soft, optional goal.
- **Collectible devices and cable skins.** Each level hides a rare device (a retro radio, a lava lamp). Completing worlds unlocks cable looks: braided, neon, rainbow, rope, copper. All cosmetic, all showable.
- **The Room.** Powered devices from finished levels populate a personal room or city that glows more with every star. It is the screenshot people share.
- **Daily puzzle.** One handcrafted or procedurally validated puzzle a day, with a streak that rewards returning without punishing a miss.
- **Hints that feel kind.** A hint is a ghost plug showing one correct move, earned by watching nothing and spent freely. No hint shortage on early levels.
- **Undo and rewind as a reward.** Rewind is free on every level; the *rewind scrub* (drag a timeline to replay your moves) is the delight.

### Progression perks (player power without breaking puzzles)

Perks must never solve a puzzle, only reduce friction. Candidate perks earned by stars: a wider magnet radius (accessibility), a ghost-cable preview of a held plug's possible reach, a longer undo history, a one-tap "show me the next move" hint.

### Share and brag

Every solved level can be saved as a short looping clip of the lighting cascade (a two-second glow). Daily puzzle results use a spoiler-free emoji-grid share, as Wordle did.

## 7. The 50-level arc

Five worlds of ten levels. Each world introduces one family of ideas over its first six levels, then spends the last four remixing it with earlier mechanics. World 1 is the vertical slice we build first.

| World | Levels | New ideas | Feel |
| --- | --- | --- | --- |
| 1. Home Office | 1 to 10 (the vertical slice) | Plug, drag, snap · color matching · reach limit | Pure feel. Few pieces, one clean insight per level. |
| 2. Workshop | 11 to 20 | 2 to 4 socket strips · shapes · obstacles · crossing rules | Spatial planning. Dead sockets and routing around furniture. |
| 3. Studio | 21 to 30 | Wattage budget · frayed cables · adapters · daisy chains | Resource thinking. Things that can break and be swapped. |
| 4. Moving World | 31 to 40 | Conveyors · rolling chairs · cats · rotating sockets · timers | Timing and prediction. The room is alive. |
| 5. Remix Lab | 41 to 50 | Genre blends · tangles · ghosts · dark rooms · finale boss | Mastery. Every earlier mechanic combined in new ways. |

### Pacing rules inside a world

- **Levels 1 and 2:** introduce one new thing, alone, with no way to fail.
- **Levels 3 to 5:** apply it, then twist it.
- **Level 6:** a breather that is just satisfying.
- **Levels 7 to 9:** combine it with earlier mechanics.
- **Level 10:** a mini-boss: a bigger, set-piece room with a hidden collectible and a larger payoff animation.

### Mixing rule

Not every level uses every mechanic. A level uses at most **three** active mechanics, and at most one of them is new or recently introduced. That keeps each room readable while still letting any two mechanics collide somewhere in the 50 levels.

## 8. Visual, UI and layout direction

The look is **warm, tactile miniature**: a tidy diorama seen from above at a slight tilt, lit like a cozy desk lamp at dusk. Dead devices are muted; powered ones bloom with saturated light, so progress is literally the room getting brighter.

### Art direction

- **Palette:** a calm, slightly desaturated base (warm grays, soft wood, off-white) so that plug and socket colors are the loudest things on screen. Accent colors are limited to six, chosen to stay distinct for common color-vision deficiencies, and each is paired with a shape so color is never the only cue.
- **Materials:** matte plastic, brushed metal, braided fabric, soft shadows. No hard black outlines; use soft ambient occlusion where objects meet the floor.
- **Lighting:** one soft key light. Powered devices cast a colored glow onto the surface around them.
- **Backdrops by world:** each world has its own surface and mood (wood desk, workbench, studio floor, moving conveyor, glowing lab), each with a distinct sound bed.

### Portrait layout

| Zone | Share of height | Contents |
| --- | --- | --- |
| Top bar | 8% | Level number, progress pips, settings |
| Playfield | 76% | The room, every object big enough to hit with a thumb (min 44 px) |
| Bottom bar | 16% | Undo, restart, hint, all within thumb reach; plugs are never hidden under them |

### UI principles

- **No text in the playfield.** Teaching is done by animation: a ghost hand drags a plug once at the start of a new mechanic, and only when the player pauses.
- **Thumb-first controls.** The drag handle offsets the plug up and left of the finger so the finger never covers the target.
- **Minimal chrome.** Menus are quiet; the room is the interface.
- **Transitions as continuity.** The finished room slides away; the next one slides in like a table being swapped under the camera.
- **Accessibility:** a colorblind mode (shapes plus patterns), reduced motion, a toggle for haptics, and a larger magnet radius option.

## 9. Technical approach for HTML mobile

A single-page web game with no heavy engine, aiming at a locked 60 fps on a mid-range phone and a first load under 2 MB. These are recommendations to confirm in the first prototype, not decisions.

- **Rendering:** Canvas 2D to start (fast to build, easy to get soft shadows and glow with layered draws). Move to WebGL (for example PixiJS) only if bloom and many particles drop frames. Render at device pixel ratio capped at 2.
- **Cable physics:** a custom Verlet rope, fixed timestep (120 Hz internal, decoupled from render), one solver per cable. It is deterministic enough for replay and undo if every input event is logged with its timestamp.
- **Input:** Pointer Events with `touch-action: none`, pointer capture, prediction of the finger's next position to hide latency, and multitouch support from day one (for the two-hand levels).
- **Audio:** Web Audio API with a small set of short samples plus synthesized pitch shifts for the rising chime. Unlock on the first tap.
- **Haptics:** `navigator.vibrate` where supported, with graceful no-op elsewhere (notably iOS Safari).
- **Levels as data:** each level is a small JSON file: objects, positions, mechanics on, optional stars. A tiny validator solves levels offline to certify they are solvable and to rate difficulty.
- **Mechanics as modules:** each mechanic registers rules and hooks (`canSeat`, `onTick`, `onSeat`) against a shared core, so levels can combine them without new code paths.
- **Persistence:** localStorage for progress, stars, and unlocks, with a versioned save format.
- **Packaging:** installable as a PWA so it can run offline, full screen, with a splash screen.
- **Debug tools:** an in-game tuning panel with live sliders for every constant in section 3, a level editor, and a slow-motion toggle for inspecting snap and cable behavior.

## 10. Vertical slice, build order, and open questions

The first build is **one room, three levels, and the full feel stack**, and nothing else. If it is not delightful to plug in one cable, we do not add a second mechanic.

### Build order

1. **Cable and plug toy.** One plug, one socket, one cable, the tuning panel. No levels. Tune until dragging is fun for its own sake.
2. **Snap and seat.** Magnet, overshoot, hit-stop, sound, haptics.
3. **Device power-up and finish payoff.** The glow, the chime melody, the cascade.
4. **Levels 1 to 3.** Color match, then reach limit. Instant restart, undo, next-level slide.
5. **Polish pass.** Backdrop, lighting, idle animation, accessibility toggles.
6. **Mechanic module system and level data format**, then World 1 to ten levels.

### How we know the slice is good

- A first-time player seats a plug within 10 seconds without reading anything.
- In a hallway test, 4 of 5 people say "that feels good" before they finish level 1.
- People replay the same plug-in for the sound alone at least once.
- Frame time holds under 16 ms on a mid-range phone while three cables move.
- Players start level 4 without being asked to.

### Open questions for you

- [ ] **Perspective:** top-down diorama, or a side view of a wall with sockets, like the screenshot may suggest? This changes how cables sag and how obstacles read.
- [ ] **Tone:** cozy and warm, or a bright comic one? The doc assumes cozy.
- [ ] **Cable crossing:** should the baseline allow crossing (physical, forgiving) or forbid it (graph puzzle, stricter)? The doc assumes allowed, forbidden in specific levels.
- [ ] **Persistent room:** how much do you want the meta "room" to matter in the first release, versus after the core is proven?
- [ ] **Which genre blends** from section 5 excite you most, so we can prototype a single set piece early?
- [ ] **Platform floor:** the oldest phone and browser we must run well on.
