# 01 · North Star

## The feeling, before anything else

Imagine a small room at 6 a.m. The light is blue and soft. Everything in it is asleep.

A phone lies on a desk with a dark screen and a tiny drifting *z*. Its cable lies in a lazy S across the wood, and the plug at the end rests there like a sleeping finger. You touch the plug. It lifts a little toward you, heavier than it looks. The cable drags behind with a quiet rustle. Somewhere ahead a socket's rim is breathing a faint light. You bring the plug close and it *leans* toward the socket as if it wants to go. You let go. It slides in, and there is a sound: low, round, short, exactly right. **Thunk.**

The desk shivers by a hair. A pulse of light races down the cable into the phone. Its screen blooms open, two eyes pop wide, a number counts up, a single bell-note rings. The room is one shade warmer.

That is the game. Everything else exists so that this moment can happen again and again in more interesting circumstances.

> **The thunk is the product. The puzzle is the reason you earn another thunk.**

---

## The fantasy

You are the calm one. You walk into the chaos, quietly untangle it, and make everything glow. You are competent, a little smug, and entirely benevolent. Devices *like* you. When you finish, the room says thank you in light and music.

## The pitch, three sizes

**One line.** Every room starts asleep. You plug it awake.

**One paragraph.** Snug is a one-thumb puzzle game about waking a room up. Each level is a tiny diorama of sleeping devices on a desk, a workbench, a kitchen, a space station, a city. You carry each device's plug, on a cable with real weight and real length, to a socket that will take it. The puzzle is *what goes where and what is in the way*; the joy is the sound, the snap, the glow, and the way every solved room ends as a warm, lit, tidy little world that sings a chord you composed by plugging.

**One minute.** (See "The game in sixty seconds" in the main GDD.) Then add the long arc: rooms start simple and cozy, then the rules start to wobble. Strips slide, sockets ride a toy train, a cat discovers the cables, gravity flips, zero-g sends plugs drifting, devices start doing things that change the room, and a few levels turn into rhythm games or time-loop duets with your past self. Through all of it the cable stays honest and the click stays perfect.

---

## Pillars (these settle arguments)

### 1. The click is the product
If a plug does not feel wonderful to grab, drag and seat with *no puzzle attached*, no mechanic can save it. Feel is tuned before content, always, and re-tuned whenever a new mechanic threatens it.
- **Demands:** one tuning panel with every feel constant live; a standing toy scene with no goals; sound and haptics designed *with* the animation, not after.
- **Forbids:** features that add latency to the plug under the finger; any mechanic that makes dragging feel like moving a cursor instead of an object.
- **Test (the Click Test):** mute the puzzle. Hand the phone to a stranger with one plug and one socket. Do they plug it in a second time *for no reason*? If not, we are not done.

### 2. The cable is a character
It has length, stiffness, friction and a texture. It never clips through things, jitters, or teleports. It speaks in physics: slack curves, tautness, a tiny twang at the limit, a one-bounce wobble when a plug seats.
- **Demands:** a single honest rope model used for everything; every "no" explained by the cable's body language.
- **Forbids:** fake limits (invisible walls), cables that snap to straight lines, pattern art that does not travel with the cable.
- **Test:** can a new player tell *why* a plug will not reach, without text? (The cable is taut; the phone squints.)

### 3. Rooms wake up
Progress is *light*. A room begins dim and blue, devices glow on one by one, warm pools of light grow into each other, the ambient sound opens up from muffled to bright, and a chord builds. The finished room is the reward image, the share image, the postcard.
- **Demands:** lighting and audio as functions of "how awake is the room"; every device has a distinct wake-up performance.
- **Forbids:** progress bars or scoreboards as the *primary* feedback.
- **Test:** show a screenshot with the UI hidden. Can you tell how close to done the player is?

### 4. One idea per room
Every level has one clean insight that a thoughtful player can *find*. Readable at a glance, deep on a second look. Depth comes from rules interacting, never from rule text. A level solved by random dragging is a failed level.
- **Demands:** the validator measures "luck-solvability"; each level has a one-line aha written down before it is built.
- **Forbids:** filler levels, big boards that are just *more* of the same, ambiguity about what a rule is.
- **Test:** can the designer state the aha in one sentence, and does the validator confirm that greedy play fails *in the way we expect*?

### 5. Gentle, always
No timers by default, no lives, no fail screens, no buzzers. Undo is free and instant. A wrong move is small and a bit funny: the plug politely hops back and a soft wooden knock plays. The game assumes you are clever and tired and happy to be here.
- **Demands:** instant restart, infinite undo, kind hints that never run out.
- **Forbids:** punishing mistakes, scarcity of hints, stress as a difficulty lever.
- **Test:** a player who gets stuck for two minutes should feel *curious*, not judged.

### 6. Surprise lives in the cracks
A calm game needs regular, affectionate violations of its own rules: a new object that behaves unexpectedly, a room that moves, a cat. The rhythm is *predictable on the surface, unpredictable in the details.* Surprises are earned by establishing patterns first.
- **Demands:** a "surprise budget" (chapter 08): a small wobble every few levels, a set piece every five, a boss every ten.
- **Forbids:** novelty for its own sake; a twist that breaks the click.
- **Test:** after a surprise, does the player say "oh, *neat*" and not "wait, what are the rules?"

---

## Anti-goals (what we are deliberately not making)

- A tutorial with paragraphs. Teaching is by doing, with one ghost hand when the player pauses.
- A stressful timer game or an energy/lives game. Cozy first.
- A realistic electrical-engineering simulation. Physics serves feel; plausibility is a style, not a goal.
- A game that is *only* a cable game. The cable is the home base; the world is allowed to get strange.
- A content treadmill. Fewer, sharper levels beat many filler levels. Everything ships because it has an aha.
- Dark patterns. No manipulative streak loss, no fake scarcity, no nag popups. (Monetization is out of scope; see chapter 08 for what *does* keep players coming back.)

---

## Who it is for and where they are

Commuters and couch players. Sessions of 2 to 10 minutes, played one-handed in portrait, frequently with the sound off, frequently interrupted. So:

- The game must feel complete on **visuals and haptics alone**, and be better with sound.
- It must **resume instantly** and **save every plug** (no "lose your progress" moments).
- Controls are **thumb-reachable** and **left/right-hand agnostic**.
- A level is **15 to 90 seconds**. Nothing requires a long attention span; everything rewards one.

## The shape of a session (emotional curve)

| Beat | Feeling | What the game does |
| --- | --- | --- |
| Arrival | Calm curiosity | Objects drop onto the desk with soft thuds; one new thing catches the eye. |
| Orientation | Gentle focus | The player sizes up what is in the room; devices glance at them. |
| First move | Tactile pleasure | The first thunk lands within seconds. |
| The knot | Tension, "hm" | A plug will not go where it looks like it should. |
| The insight | "Oh!" | A rule clicks into place; one thoughtful move unlocks the rest. |
| The run | Flow, rising chimes | Remaining plugs go in quickly, each note higher. |
| The Wake | Release, warmth | Cascade, chord, lit room, stars. |
| The Settle | Play, affection | Poke the room; devices react; a secret to find. |
| The Swap | Anticipation | Next room slides in with one strange new object. |

## Design heuristics (the rules of thumb we argue with)

1. **The napkin test.** If the level cannot be sketched on a napkin and explained in two sentences, it is too complicated.
2. **Every object must do something or feel something.** Decoration with no reaction is dead weight.
3. **Every rule must be visible.** A player can see *why* they cannot do something before they try, or understand immediately after.
4. **The cable is always the teacher.** If we need text, the level is wrong.
5. **Interesting mistakes.** The wrong move should teach the rule: the brick covers the neighbor sockets, the cable goes taut, the socket sparks.
6. **Make the second solution better than the first.** Solved levels can be tidied; stars invite replay without punishing the first pass.
7. **Constrain before you complicate.** Add a rule only after the previous rule has produced an insight; a rule that adds no new insight is a rule too many.
8. **Variety by remix, not by bloat.** Mix known rules in new rooms before inventing new rules.
9. **Never three hard levels in a row.** Sawtooth: teach, apply, twist, breathe, boss.
10. **Touch beats thought.** If a puzzle idea forces slow, fiddly input (tiny targets, precise timing), cut or rescale it.
11. **Delight is a feature.** Spend real time on the sneeze of a lamp, the way a phone yawns. These details sell the game.
12. **When in doubt, make it lighter.** More light, more sound, more joy per tap.

## Reference feelings (not clones; what we borrow in spirit)

- **Unpacking** — the contentment of placing objects, material sounds, a room that tells a story without words.
- **Monument Valley** — calm, awe, clean visual language, little geometry-shifts that make you smile.
- **Mini Metro / Flow Free** — instant clarity of rules, tidy routes as aesthetic satisfaction.
- **Cut the Rope** — physics with personality; a character reacts to what you do.
- **Tiny Glade / Dorfromantik** — cozy accumulation; the world grows prettier with every action.
- **Untitled Goose Game** — comic agents that disrupt a tidy system in affectionate ways.
- **Wordle** — a tiny, shareable daily ritual with a spoiler-free result.
- **Mechanical keyboards and bubble wrap** — the sound and feel of a satisfying click as a product in itself.

---

## Open water

*Loose thoughts to swim in while building. None of these block anything.*

- What if the player's thumb has a tiny, almost invisible companion: a *shadow of a hand* that cups the plug as you carry it, so it feels held, not teleported?
- The first plug of the whole game could be *in the player's hand on the title screen*; the "Play" button is a socket. (Specified in chapter 02; keep thinking about how far to take it.)
- Is there a sound for "the whole room is quiet and everything is asleep" that is itself lovely? A very soft, slow, far-off clock and a refrigerator hum. It matters because the *contrast* with the awake chord is the emotional engine.
- Devices could have a **secret favorite socket** (a tiny heart appears if you seat them there). Pure delight, zero mechanic. Collect all.
- A cable's *knot of regret*: when you drag a plug away fast, the cable whips and makes a different, rubbery slap on the wood. Could that sound be the most "ASMR" thing in the game?
- Rooms could be **photographed**: a postcard with a tiny handwritten caption by the device that woke up first. A collectible album of tidy, glowing places.
- A whole-game idea: the credits are a long cable that you plug through every room you have ever solved.
