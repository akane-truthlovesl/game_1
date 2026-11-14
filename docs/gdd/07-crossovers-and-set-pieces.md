# 07 · Crossovers & Set Pieces

Chapter 06 is a pile of seeds. This chapter takes the strongest ones and **grows them into developed concepts**: how they play, how they feel, how they get taught, what they cost, what could go wrong. It also defines the patterns (agents, chain reactions, physics worlds) that let new mechanics arrive without breaking the cozy contract.

---

## 1 · Three design patterns for anything new

### 1.1 The agent pattern (things that move and want things)
An agent is a character with a **schedule and a want**. To stay cozy it must obey five rules.
1. **Telegraph.** Every action is announced ≥ 600 ms ahead (ears twitch, a shadow grows, a *mrrp*). Never an ambush.
2. **Never destroy progress permanently.** An agent can unplug a plug; it cannot lose you anything but a few seconds.
3. **Deterministic.** Agents follow authored paths and timers, not dice. A level is *solvable by reading the pattern*, which is also what makes it testable.
4. **Redirectable.** There is always a gentle way to steer an agent (a toy, bait, a light). Fighting them is never the answer.
5. **Affectionate.** An agent's interruption should make you smile before it makes you sigh.

### 1.2 The chain-reaction pattern (devices as tools)
A powered device changes the room for *another* device or for the cable. The puzzle is the **order of waking**.
- The effect must be **visible and local** (a fan's cone is drawn; a crane's rail is drawn).
- The causal arrow is **drawn** the first time (a faint dotted line from cause to effect that fades).
- The first chain-reaction level has exactly **one** link (power the fan, the cable straightens). Longer chains arrive only after the player has made the one-link connection a few times.

### 1.3 The physics-world pattern (changing the verbs)
When a world changes *how things move* (zero-g, gravity, ice) it also changes the **feel**; that is a risk to the click. Rules:
1. Introduce the new physics in a **toy room** with no goal (the Click Test again).
2. The *plug seating* (the thunk) stays identical across physics worlds.
3. Provide **a calmer variant**: assist options (a guide line, damping slider, bigger magnet).
4. Never mix two physics changes in the same level.

---

## 2 · Developed concepts

Each concept: **Premise · How it plays · How it feels · Teaching · A sample room · Risks · Cost.**

### 2.1 The Cat Café *(agent: Biscuit)*
- **Premise.** A café table by a sunny window. A cat sleeps in the corner (Level 8's tail grows into a full animal). The cat likes warm things and dangling plugs.
- **Plays.** The cat wakes when you drag a plug *low and slow near it*. It chases the plug end. While the cat is distracted you plug the strip. The cat naps on the warmest device and, if a socket is *under* it, that socket is blocked. Tap the cat to pet it (purr; it stays put for 6 s).
- **Feels.** A dance: you carry a plug like a fishing lure, leading the cat across the room; a tail-flick telegraphs a pounce; the plug *jerks* from your hand if it catches it (not a fail, just a tug-of-war you win by dragging faster).
- **Teaching.** Level 1 of the act: the cat is asleep; the only task is *do not walk the plug past it*, which makes it twitch. Level 2: it wakes and watches. Level 3: first lure.
- **Sample room.** Strip on one side, cat napping on the other, phones in between. Walking the plug straight to the strip passes the cat; the cat pounces and unplugs a phone every 8 s. Fix: lure the cat to the far corner with a dangling spare plug (a prop), plug quickly, then pet it to keep it away.
- **Risks.** A chase that feels like fighting. *Mitigation:* the cat never hurts, and its pounces are always telegraphed.
- **Cost.** L. High payoff: the first agent defines the genre bend.

### 2.2 Roomba Taxi *(moving socket carrier)*
- **Premise.** A robot vacuum patrols a rectangular path. A strip is stuck to its back (a "taxi").
- **Plays.** Socket positions are *time-varying*. The player must be near the taxi while it passes a device. Plugs seated into the taxi *travel with it* until the cable runs out (a *tug* then pulls the plug free). Docking: the Roomba returns to its charger at intervals; powering the charger stops its patrol for 5 s.
- **Feels.** Like threading a moving needle with a tiny, patient rhythm; satisfying once you read the loop.
- **Teaching.** One slow lap with no goal, a ghost hand shows the catch moment, then a goal.
- **Risks.** Precision under motion. *Mitigation:* a *wide* magnet when the socket is moving; telegraph by drawing the future path as a faint dotted line.
- **Cost.** L.

### 2.3 Orbital *(zero-g docking)*
- **Premise.** Inside a cozy space station. No friction; plugs drift; cables swirl.
- **Plays.** Release a plug and it keeps moving (damped slightly). Bank off walls. The magnet captures plugs at low speed. Plugs have *momentum*; fat plugs are heavy to flick.
- **Feels.** A completely different tactile pleasure: slow, graceful, a little chaotic, like conducting an orchestra. The thunk remains the same: the *same* sound anchors it.
- **Teaching.** A toy room: one plug, one socket, a big empty room. The player discovers flicking; the goal comes after fun.
- **Sample room.** A far socket behind a pillar: you must bank a plug off two walls to arrive at a low speed.
- **Risks.** Frustration if flicks are imprecise. *Mitigation:* a faint ghost-arc preview of the first bounce (an assist, can be turned off).
- **Cost.** L (new physics mode, assist visuals).

### 2.4 Swing & Plug *(Wall mode, gravity)*
- **Premise.** A hotel lobby wall, side-on, a grid of sockets. Cables *hang*.
- **Plays.** The cable sags; a held plug pulls it taut; releasing it lets the plug *swing* like a pendulum; release at the right moment and the swing delivers it into a socket. Cut-the-Rope feel with a plug.
- **Feels.** A satisfying pendulum rhythm. The phone dangles at the other end swinging in sympathy.
- **Teaching.** One cable, one socket, a big arc; the ghost hand does a swing.
- **Risks.** Timing frustration; a long swing can feel imprecise. *Mitigation:* a generous capture radius that slows the plug as it passes.
- **Cost.** L (gravity-enabled sim + side-view art).

### 2.5 The Rube Goldberg Desk *(chain reaction)*
- **Premise.** A workshop desk covered in mechanical gadgets.
- **Plays.** To reach the far socket, you must wake a *fan* (which blows a cable across a gap), then a *speaker* (whose bass shakes a loose book off the socket), then a *magnet crane* (which lifts the mug blocking the final strip). The order matters because waking the speaker too early shakes your cable loose.
- **Feels.** The joy of a plan unfolding like clockwork; each device's *effect* is visible, so the solve is a visual "ohhh."
- **Teaching.** One link only for three levels (power the fan; the cable straightens). Then two. Then boss.
- **Risks.** Hidden causality; *mitigation:* the dotted causal arrow is drawn, devices telegraph, and the solver verifies a unique intended order.
- **Cost.** L (each gadget is bespoke art and logic).

### 2.6 Lit-Brite *(pixel-picture puzzle)*
- **Premise.** A grid of identical little lights (or phones), each with a numbered edge hint like a nonogram.
- **Plays.** You choose which cells to power. When the lit set matches the hidden picture (a heart, a cat, a house) the picture *pops* with color and a short melody.
- **Feels.** A calm logic puzzle with gorgeous payoff. A pure *"I made this"* moment.
- **Risks.** Slower, more thinking; a different pace. *Mitigation:* use as a *breather* variety, never in a hard stretch.
- **Cost.** M.

### 2.7 Jam Session *(rhythm + sequence)*
- **Premise.** A cozy music studio. Devices are instruments (synth, drum machine, amp, loop pedal).
- **Plays.** A **ghost melody** lights above the devices; reproduce it by waking them in order. Optional: plug **on the beat** (sockets pulse) for "perfect" chimes. A wrong note plays a funny *plink* and the plug hops back.
- **Feels.** A playable instrument. The room's music *is* the puzzle's rule.
- **Teaching.** Three-note melody; then five; then add a rhythm twist.
- **Risks.** Accessibility for players without sound. *Mitigation:* the sequence is also **visual** (device icons pulse); rhythm is optional.
- **Cost.** M (audio system is already musical).

### 2.8 The Switchboard *(two-ended patch cords)*
- **Premise.** A retro telephone exchange. Each caller (a lamp that lights) needs to be connected to a callee. Cords have *two plugs*.
- **Plays.** Pick up a cord, plug one end into the caller's jack, the other end into the callee's jack. Cords have lengths and cross; every connection is a mini-puzzle; a sound bed of operator murmurs.
- **Feels.** Tactile, vintage, the cable verb made *wide* (two plugs per cable).
- **Risks.** Complexity of two-ended cables. *Mitigation:* introduced with a single call.
- **Cost.** L (new object type: two-ended cable).

### 2.9 Under the Desk *(two-layer world)*
- **Premise.** The desk top and the floor below, with a cluttered power jungle underneath.
- **Plays.** Drag a plug *off the desk edge*: it dangles on its cable and swings; **vertical distance costs length** (the drop uses extra cable). Sockets exist on both layers.
- **Feels.** A cozy "Wow, there is a whole other level under here." A single scroll-less transition: the camera dips.
- **Cost.** L.

### 2.10 The Dollhouse *(recursion)*
- **Premise.** A dollhouse sits on the desk. Tap it: the camera zooms in and the dollhouse is its own tiny room with its own tiny strip and devices.
- **Plays.** Solving the tiny room powers a *single device* in the big room (a tiny cable runs out of the dollhouse's window). The recursive structure can nest twice.
- **Feels.** Delight; a "Droste" smile; fresh composition.
- **Cost.** L (nested scenes, transitions).

### 2.11 Past-You Duet *(time loop)*
- **Premise.** The room requires two hands. You have one thumb. The game lets you **record 8 seconds** then replays them as a ghost hand while you act.
- **Plays.** Record: hold the strip in place (a loose strip that slides unless held). Replay: your ghost holds it while *you* plug. Later: three-layer duets.
- **Feels.** Eerie, clever, deeply satisfying.
- **Cost.** L (record/replay is deterministic by design, see chapter 05).

### 2.12 Blackout City *(the finale)*
- **Premise.** Zoom out from a desk to a block, then a district, then a city under a power cut.
- **Plays.** Tap-and-drag *big* cables between substations; fewer, bigger moves; every solved block lights up and the camera zooms out; the final level's finale plugs the whole skyline; every room you have ever solved appears as a lit window.
- **Feels.** The biggest payoff in the game.
- **Cost.** L, but mostly art; the mechanics are known by then.

---

## 3 · Agents roster

| Agent | Pattern | Cozy contract | Gives the player |
| --- | --- | --- | --- |
| **Biscuit (cat)** | Wants warmth, dangling plugs | Telegraphed pounces; pettable | Lure and timing |
| **Roomba** | Patrol, docks | Visible path; stops at the dock | Moving sockets |
| **Toddler** | Periodic pull | Wave timer shown by a drawn pacifier | Rhythm and distraction |
| **Goose** | Steals the held plug | A honk 600 ms before | Chase and dodge |
| **Mouse** | Chews frayed cables | Slow; visible teeth marks spread | Repair and swap |
| **Ghost** | Unplugs in the dark; haunts replays | Light repels it | Darkness play |
| **Wind-up toys** | Carry plugs | You wind and aim | Delivery routes |
| **Birds** | Land on cables | Fly off if startled | Steady hands |
| **Plants** | Grow over sockets | Trimmable; steerable with light | A slow clock |

*Behavior spec shape (for implementation later):* `{ id, path | schedule, telegraph(ms), reacts: { light, sound, plug }, affects: [sockets, plugs, cables], solveMode: 'simulate' }`.

---

## 4 · Boss and set-piece list

Every ten levels ends with a **boss room** that combines the act's ideas, has a larger payoff animation, a hidden collectible, and a *story beat*. Bosses are the screenshot the game is known for.

| # | Act | Boss | Hook |
| --- | --- | --- | --- |
| 1 | The Desk | **Morning Rush** | The whole desk; mystery radio; a cat stinger |
| 2 | The Workshop & Kitchen | **Breakfast for Twelve** | A kitchen full of timers and one hungry cat |
| 3 | Toy Room & Studio | **Jam Session** | A melody puzzle; the roomba taxi hauls the strip |
| 4 | Space & Wall | **Orbital Repair** | Zero-g docking of eight devices; the station wakes |
| 5 | Lab & City | **Blackout** | Power every block of the city; your rooms are the lit windows |
| ★ | Wild | **The Past-You Duet** | Co-op with your own ghost |
| ★ | Wild | **The Dollhouse** | Three nested rooms |
| ★ | Seasonal | **The Tree** | A string of lights on a tree: Y-splitters, bulbs, a dud |

---

## 5 · The weird-level pile

One-paragraph stashes of levels that should exist someday. Each is a candidate for a "surprise slot" in the arc.

1. **The Seating Chart.** Plugs have feuds; a wedding strip; you can accept exactly one feud.
2. **Do Not Disturb.** A sleeping baby; don't power the vacuum; power everything else *quietly* (no loud chime on that level; the chimes are *soft*).
3. **The Power Cut.** Mid-level, the lights die; standby LEDs glimmer; you replug in the order that the room *remembers*.
4. **Twins.** Two rooms side by side; the same moves apply to both; one room has an extra obstacle that forces you to find a *shared* solution.
5. **The Fog.** A mist drifts across the room; you plug before it covers the sockets; then recall where things were.
6. **Backwards Day.** Plugs are fixed; you drag strips onto them.
7. **The Long Cable.** A single huge cable coiled around thirty pegs; thread it through the room.
8. **Spaghetti Junction.** Ten tangled cables; trace and untangle.
9. **The Goose Heist.** A goose steals a plug and runs; chase it with a dropped plug as bait.
10. **Disco Ball.** Hidden keys revealed only on the beat of the sweeping light.
11. **The Pinball Plug.** An air-hockey table with bumpers; bank the plug into a socket.
12. **Cable Golf.** Each flick consumes cable; three holes; par.
13. **The Singing Trout.** The mystery box reveals a fish on a plaque that sings when powered, and **everyone** in the room joins in.
14. **A Very Quiet Level.** No sound at all, just the haptics; a tribute to commuters.
15. **The Gordian Plug.** A knot that you untie by pulling the plug through the loop.
16. **The Snail.** A snail, a socket on its shell, a very slow solve and a very fast smile.
17. **Hot Swap.** Five phones, three sockets, each phone needs 3 s; juggle.
18. **The Mirror Boss.** You versus your own best run as a ghost.
19. **Hold the Door.** One thumb holds a door open while the other plugs.
20. **The Sleepover.** A tent of blankets; a single flashlight (the plug's light) reveals sockets; every device is in a sleeping bag with its face peeking out.

---

## 6 · How a set piece is built (a recipe)

1. **One sentence of fantasy.** ("You are a stagehand lighting the whole theatre before curtain.")
2. **One idea of structure.** ("Everything depends on one switch at the back of the stage.")
3. **A twist that surprises people who know the rules.** ("The final cable is the *curtain rope*.")
4. **A bigger payoff than normal.** (Camera pulls out; the room becomes a postcard; a new cast member joins.)
5. **A hidden thing.** (A gold plug; a secret device.)
6. **A story beat in one image.** (The cat, curled on the warmest device, unplugging one cable.)

---

## Open water

- **A set piece that is only a sound:** a pitch-black room where the *only* feedback is the chime ladder; plug blind by sound and haptics. (Also a tribute to players without vision, with careful design.)
- **A set piece that is a *race against your own pace*:** the room is waking *anyway*, slowly; you decide whether to help or just watch it happen (an anti-puzzle).
- **A "boss" that is a person:** the player's friend's best run, ghosted into your level (async).
- **Cameos from earlier levels:** the lamp from Level 1 returns as a little lighthouse in the finale.
- **The room that talks back:** after the boss, devices *vote* on the postcard caption, and the winning one is the memory.
