# 02 · World, Cast & Voice

How the game looks, sounds and *behaves*, and who lives in it. Numbers for motion and audio live in chapter 04; this chapter is the taste.

---

## The diorama

A tidy miniature seen from directly above, lit like a desk lamp at dusk. Think *cozy model-maker's set*: matte plastic, soft felt, warm wood, braided fabric, brushed metal. Generous rounded corners everywhere. No hard black outlines; objects separate from the floor with soft ambient occlusion and a gentle contact shadow.

- **Light direction:** key light from the **upper left**. Shadows fall down-right. Lifted objects (a held plug) cast a larger, softer, more offset shadow, which is the entire depth cue we need.
- **Depth without 3D:** the top-down view is flat, but *height is expressed in scale and shadow*: a plug in your hand is ~14% larger with a shadow that has drifted away from it. A tall obstacle (a mug) has a visible side wall on its lit edge.
- **The mat and the wood:** devices sit on a soft **desk mat** (felt, stitched border) laid over a wooden surface. The mat defines the playfield without a hard frame and lets each world re-skin the "ground" (workbench steel, kitchen tile, studio carpet, space-station grating).
- **Camera:** locked. It nudges on impacts (1–2 u), breathes on level complete, and slides for transitions. It never rotates in Act 1.
- **Stage:** 360 × 640 u, centered; the surface art extends to fill any screen shape.

### Time of day, and the Wake

Act 1 spans one morning. Level 1 is pre-dawn blue; Level 10 is golden. Within each level, the room has an **ambient darkness** layer that lifts as devices power on, and every awake device adds a **warm pool of light** around itself. The pools overlap into one glow. That brightening *is* the progress bar (pillar 3).

| Room awakeness | Look | Sound bed |
| --- | --- | --- |
| 0% | Navy ambient (~60% dark), cool rim light, faint standby LEDs | Muffled room tone, a slow far-off clock tick |
| 1–99% | Each awake device blooms warm light onto the mat; darkness lifts proportionally | Low-pass filter opens, pad voices stack into a chord |
| 100% | Ambient fully lifted, warm key light, dust motes drift in the lamp beam | Full chord, shimmer, bright air |

---

## The cast

Devices are characters. They never talk; they emote through the screen they sleep behind (eyes, brows, a mouth), through body language (a lean, a hop, a shiver), and through a *voice*: each has its own wake-up sound, a small instrument in the room's orchestra.

| Name | Is a | Personality | Wake-up performance | Sonic voice | First seen |
| --- | --- | --- | --- | --- | --- |
| **Pip** | Phone | Wide-eyed everyman; startles easily; thrilled to be first to know anything | Eyes pop with an overshoot; screen blooms from the port outward; battery counts 12→100%; a tiny hop | Marimba blip | Level 1 |
| **Lumi** | Desk lamp | Calm elder, hums, tilts its head toward your finger | Head lifts, bulb warms orange→white with a soft *tung*; the first thing that *lights the room* | Warm sine pad | Level 1 (room decor), Level 10 (device) |
| **Big Sleepy** | Tablet | Slow, heavy-lidded; takes a beat; yawns | A long yawn: eyes half-open, then wide; screen unfurls like a blanket | Low bell | Level 5 |
| **Boxy** | Laptop | Serious, thoughtful; wakes with ceremony | A line of light scans across the lid, the logo glows, a fan whirr rises and settles | Clarinet-ish square wave | Level 7 |
| **Gus** | Game console | Grumpy outside, sentimental inside; huge brick, huge heart | LEDs chase; four-note boot jingle; controller wiggles | Chiptune pulse | Level 7 |
| **Rex** | Retro radio | Old ham; wise; unflappable | Dial lamp warms; static; a smoky jazz riff resolves out of the noise | Band-passed AM jazz | Level 10 (mystery reveal) |
| **Nano** | Smartwatch | Hyper, jittery, tiny | Rapid blinks; ring of light spins; buzzes in place | Glockenspiel flicks | Act 2 |
| **Bud & Lou** | Earbud case | Shy twins sharing one lid | Lid cracks, two LEDs peek, a two-note answer | Paired soft clicks + two-note | Act 2 |
| **Dot** | Smart speaker | Dreamy, sings to itself | Light ring spins up; sustained vocal-ish "ooh" | Sine choir | Act 3 |
| **Biscuit** | The cat | An agent, not a device. Loves warm things, dangling plugs, and the strip. | Tail appears in Level 8; full cameo at the end of Level 10; becomes a mechanic in Act 2 | Purr (low rumble) | Tail: Level 8 |

*(More in the Idea Garden: toaster, kettle, blender, drill, soldering iron, robot vacuum, toy train, drone, fan, disco ball, hamster-wheel generator, a ghost…)*

### Emotional states (every device implements these)

States are expressed by *eyes first, body second, light third*, and are driven by what the player is doing right now.

| State | Trigger | Eyes / face | Body | Light |
| --- | --- | --- | --- | --- |
| **Asleep** | No power | Closed arcs, a drifting *z*, a faint red low-battery outline | Still, a slow breath (0.4% scale, 4 s) | Dim standby LED |
| **Stirring** | Player touches *its* plug | One eye cracks, pupils slide toward the plug | Tiny lean toward the plug | LED quickens |
| **Attentive** | Plug is being carried | Eyes track the plug; brows lift when the plug nears a good socket | Leans (≤ 3°) | LED steady |
| **Strained** | Cable is taut / beyond reach | `> <` squint, a sweat drop, a flicker | A small shiver; slides 1 px toward the plug | Screen flickers once |
| **Wince** | Plug refused / bounced | Eyes shut tight, small *oof* mouth | Hop-back 2 px | Brief dim |
| **Awake** | Powered | Eyes pop, blink, glance around | Hop (+8%) → settle | Bloom + warm pool |
| **Delighted** | Level complete | `^ ^` beaming eyes | Synchronised wiggle with the others | Pulse in time with the chord |
| **Poked** | Tap in the Settle | Cross-eyed surprise → giggle | Vibrates (visual buzz) | Flash |
| **Idle awake** | Between events | Blink every 3–6 s, glance at the player, occasional yawn | Slow breath | Steady |

*Eye tracking is the single cheapest source of life in the game: a dead phone that looks at your finger is already a character.*

---

## Plugs, cables and sockets as characters

- **Plug** — chunky, friendly, color-coded body, a glyph on its back (● ▲ ■ ◆ ⬢), two metal prongs that glint, a rubber strain-relief collar where the cable joins. Slim plugs feel quick; **fat bricks** are heavier (slower follow, deeper thunk, a heavier haptic).
- **Cable** — braided fabric by default: a ribbed texture that travels with the cable, a highlight line on the lit side, a darker underside, a soft contact shadow. Its color is its plug's key color; universal plugs are warm gray. **Skins** (collectible, chapter 08) change texture, sound and personality: rope creaks, licorice squeaks, coiled phone cord boings.
- **Socket** — a recessed slot with a metal-contact glint and an embossed key glyph. Its **rim breathes** very faintly when idle and glows when a compatible plug approaches. Dead sockets are visibly sooty. Covered sockets (under a brick's overhang) dim and show a tiny "blocked" shadow.
- **Strip** — ivory plastic with a rounded bevel, a tiny LED, a rocker switch when relevant; its own cable runs off-screen to the wall.

### Cable skin menu (cosmetic, all chosen by feel as well as look)

| Skin | Look | Feel / sound |
| --- | --- | --- |
| Braid (default) | Woven fabric, ribbed | Soft rustle |
| Rope | Twisted fibre | Creak under tension, dry scrape |
| Licorice | Glossy black with a sheen | Squeaky stretch, cute |
| Neon | Glass tube with an inner glow | Faint electric hum, bright on the pulse |
| Phone cord | Coiled spring | Boing on release, long reach |
| Garden hose | Fat green rubber | Thick slap, hollow knock |
| Ribbon | Satin, flat, folds | Silken swish |
| Spaghetti | Pasta | Brittle snap, comic |
| Vine | Leaf-studded | Rustle; leaves unfurl as the device powers |

---

## Ambient life (nothing is ever static)

- **Everything breathes.** Idle micro-animation on every object: standby LEDs, socket rims, a phone's chest-rise, a plant's sway, steam wisps off the mug.
- **The room has a clock.** A faint tick; a tiny desk clock; later, morning light creeps across the mat.
- **Dust motes** drift through lamp light once the room wakes.
- **Decor with reactions** (all tappable in the Settle): the mug puffs steam, the plant shivers and drops a leaf, a sticky note flutters, a pen rolls a quarter turn, a paperclip hops, the clock chimes.
- **Foreshadowing:** from Level 8 a **cat's tail** swishes at the screen edge. It will be the Act 2 agent. (Zeigarnik: set it up, delay the payoff.)
- **A secret in every room:** a tiny tappable thing (a lost sock, a button, a gold plug, a ladybird) that earns a postcard sticker (chapter 08).

---

## Voice and microcopy

The game is nearly silent in words. It speaks with faces, icons and a handful of *tiny* captions.

**Principles:** warm, dry, a little cheeky; never instructional. At most 3 words on screen at any moment outside menus. Words are *drawn like objects* (stickers, sticky notes), not UI chrome.

| Where | Examples |
| --- | --- |
| Level titles (a pill that fades after 1.5 s) | "Hello, Pip" · "Duet" · "Short Leash" · "Colour Code" · "Flip It" · "Read the Room" · "Fat Bricks" · "Burnt Out" · "Tidy Up" · "Morning Rush" |
| Device captions (rare, floating, 0.8 s) | *zzz* · *ahh* · *ooh* · *oof* · *bzz* · *!* |
| Star captions | **Lit** · **Tidy** · **Clean** |
| Postcard captions (handwritten, one line, from the first device to wake) | "Pip woke up first, as always." · "Gus pretended not to be excited." · "Rex has opinions about jazz." |
| Hint | A ghost hand; no words at all. |
| Loading | "Plugging in…" |
| Cat | *mrrp* |

---

## Sound identity

**Concept: the room is a music box and you are winding it.** Every interaction belongs to one harmonic world so the room plays a tune as you play, and *completing a level resolves a melody and a chord*.

- **Key and scale:** C major pentatonic by default (C D E G A), all notes consonant with each other, so *any* plugging order sounds good. Each Act shifts the root (Act 1 C, Act 2 D♭, Act 3 E♭, …) so worlds feel distinct but never clash within a room.
- **The chime ladder:** each device that wakes plays the next note up the scale (C5, D5, E5, G5, A5, C6…). Unplugging steps the ladder back down with a small falling glide. Because the pitch follows *how many devices are awake right now*, the tune rises and falls with progress.
- **The room chord:** each awake device also fades in a soft, sustained **pad voice** on a chord tone (Cmaj9: C E G B D). Six awake devices = a rich chord; the final connection makes the chord *bloom* and shimmer.
- **Voices:** each cast member has a signature timbre (table above) for its wake-up and for pokes, so a room is an ensemble.
- **SFX family tree (all physical, all pitched):** pick-up *tick* → carry *rustle* → magnet *tick* → seat *thunk* → pulse *zip* → wake *chime* → refuse *knock* → pop-out *pop*. Each is dry and punchy; ambience and pad are lush. Slight random pitch variation (±3%) on repeats prevents fatigue; heavier plugs pitch lower.
- **Mix principle:** the *thunk* is the loudest, driest, most tactile thing. Everything else is subordinate and sits in a shared small-room reverb. The ambient bed's low-pass opens with the room's brightness (so a dim room sounds muffled and a lit room sounds airy).
- **Silence is a color:** the dead room should be *almost* quiet; the first thunk should feel like a pebble dropped into still water.

---

## Color and shape system

The base is calm and slightly desaturated; **plug and socket colors are the loudest things on screen** (pillar: readable at a glance).

| Key | Glyph | Hex | Notes |
| --- | --- | --- | --- |
| Coral | ● circle | `#FF6F61` | Warm, mid-light |
| Amber | ▲ triangle | `#FFBE3D` | Lightest; the "attention" color |
| Mint | ■ square | `#3FD6A6` | Cool, mid |
| Sky | ◆ diamond | `#4AA3FF` | Cool, mid-dark |
| Violet | ⬢ hexagon | `#9B7BFF` | Darkest; separates from sky by luminance |
| Universal (joker) | ○ ring with all glyphs ghosted | `#E9E4D8` | Warm off-white |

- **Luminance spread** keeps the five distinguishable under common color-vision deficiencies; the glyph is the second channel, and a **pattern mode** (diagonal stripes, dots, plaid, waves, checks) is the third.
- **Neutrals:** desk wood `#A9764B → #7E5232`; mat slate `#3B4252` (dusk) shifting to warm felt `#5B5260` when lit; strip ivory `#E8E1D1`; screen-off `#0B0F1A`.
- **Light:** dim ambient `#151B33` at ~0.6 alpha; warm pool `#FFD9A0`.

## UI look

- **Quiet chrome.** A cream-colored pill at the top for the level; three round buttons at the bottom (Undo, Restart, Hint) within thumb reach and *never* overlapping a plug's resting area. Everything else is the room.
- **Typography:** a rounded, friendly system stack (`ui-rounded`, "SF Pro Rounded", Nunito, "Trebuchet MS", system-ui). Numbers are chunky.
- **Motion:** every UI element eases in with a tiny overshoot; nothing snaps or blinks.
- **Icons:** simple, thick, rounded: curved undo arrow, circular restart, lightbulb hint. The hint bulb *glows* when the game thinks you might want it.

## The title screen *is* the first plug-in

No Play button. The screen is dark. A cable hangs from the top edge in a lazy curve, ending in a plug that dangles and sways. The word **snug** is drawn *by the cable itself*, lowercase and looped, its plug end loose at the baseline. At the bottom of the screen, one socket glows softly.

You drag the plug into the socket. **Thunk.** The lamp clicks on, the logo glows, a warm chord blooms, and the real menu (Play / Levels / Fidget) eases in. The first verb the player ever performs *is* the core verb, and it lands as a promise.

Returning players see the plug dangling again; their muscle memory is the "Play" button.

---

## Open water

- **The desk as a living diary.** Sticky notes in the corner accumulate a tiny drawing per level solved (a doodle of the room). By Level 10 it is a comic strip of your morning.
- **Weather outside the window** (visible only on the mat's edge reflection): rain on the glass changes the ambient sound; snow in a later act.
- **Cast cameos in the postcards:** the first device to wake gets a handwritten caption; collecting the whole cast's captions forms a little story.
- **Plug personalities:** should plug *heads* have faces too? A thought experiment: probably no (they are the player's hands), but a tiny squint when they slip into a socket might sell the thunk even more.
- **Room smell:** a joke worth keeping. "Coffee" and "morning" as postcard stamps.
- **The soundtrack of a room as a collectible:** each solved room's final chord is recorded as a 4-second jingle; the album plays your whole day back.
