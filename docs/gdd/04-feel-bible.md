# 04 · The Feel Bible

The numbers and recipes behind the click. **Every value here is a *starting* value**, exposed in a live tuning panel (section 14) so feel is tuned by thumb on a real phone, not by arguing about numbers. When a number here and the tuning panel disagree, the panel wins and this document is updated.

> Rule zero: **if a change makes the plug under the finger feel less like a physical object, it is wrong**, no matter how clever it is.

---

## 1 · Coordinates, scaling, input resolution

- **Stage:** 360 × 640 **u** (design units). All level data, physics and hit-radii are in u.
- **Fit:** `S = min(W / 360, areaH / 640)` where `areaH` is the window height minus the HUD bands (top ≈ 60 css px, bottom ≈ 92 css px, extended by the device safe-area insets). The stage is centered inside that area; the *surface art* (desk, mat shadows, vignette) is full-bleed behind it so every aspect ratio looks intentional.
- **Pixel ratio:** `dpr = min(devicePixelRatio, 2)`. (2.5 allowed on high-end devices by the degrade ladder in section 13.)
- **Minimum effective touch radius:** hit radii are specified in u *and* clamped to at least 22 css px, so the game stays playable on a 320-px-wide screen.
- **Pointer events only**, `touch-action: none`, pointer capture on the canvas, coalesced events consumed for smoother curves, `pointercancel` = safe drop.

## 2 · The cable

### 2.1 Model
A chain of point masses solved with **position-based dynamics** (Verlet). One end pinned to the device **port**; the free end is the **plug**, which can be pinned to a socket, held by the finger, or free.

| Parameter | Start value | Notes |
| --- | --- | --- |
| Physics rate | **120 Hz fixed**, decoupled from render | ≤ 8 steps per frame; leftover time carried |
| Segment length | 8 u | `N = ceil(L / 8) + 1`, clamped 8–60 points |
| Cable radius (visual half-thickness) | 2.6 u | Phone-cord skin 2.2 u, hose skin 4.4 u |
| Cable point inverse mass | 1.0 | |
| Plug inverse mass | **0.40** slim / **0.22** fat | Lower = heavier: pulls the cable less, resists the finger more |
| Constraint iterations | 12 per step | Gauss–Seidel, distance constraints |
| Stretch tolerance | 1.5% | Beyond this the cable is "taut" and the plug is held back |
| Bend constraint | stiffness 0.22 | A distance constraint on points *i, i+2* with rest = 2·seg·cos 6°. Makes cables curve smoothly instead of kinking. |
| Coulomb friction | **900 u/s²** | Per-point deceleration opposing motion. Slack **stays put** until pulled; a flicked section stops quickly. |
| Viscous damping | 2.2 s⁻¹ | Removes residual jitter |
| Rest stiction | 0.02 u per step | Below this a point is frozen; eliminates shimmer at rest |
| Curl bias | 4 u/s² | A tiny lateral force on interior points, with a per-cable sign, so slack bows to a *consistent* side instead of chaotically. It makes a seated cable look *laid down on purpose*. |
| Gravity | 0 (top-down) | A `gravity` vector exists per level for the later Wall world |

### 2.2 Why this model feels like a cable on a desk
- **Coulomb friction, not just damping:** a real cable does not drift forever and does not feel like it is moving through syrup; it sits still until something pulls it, then slides with resistance. Constant-magnitude deceleration reproduces exactly that.
- **Unequal masses:** because the plug is heavier than a cable point, the cable's tug on the plug is small when slack and strong when taut, which is the whole sensation of reach.
- **Bend stiffness** gives the "braided cable" look: broad arcs, a gentle S, never a crumpled mess.
- **Curl bias** is the secret to *tidiness as aesthetic*: slack drapes the same way each time.

### 2.3 Tautness and the "no"
- **Strain** `σ = clamp((|target − plug| − 6 u) / 30 u, 0, 1)` where `target` is where the finger spring wants the plug. When the cable is slack the plug reaches its target (σ ≈ 0); when taut the plug is held back and σ rises.
- `σ` drives: highlight line brightness (+40%), cable width (−6%), a ±0.8 u tremor on the last few points, the device's **strained** face, and a one-shot **twang** the first time σ crosses 0.6 in a drag.
- **Never** clamp the plug with an invisible wall; let the constraint solver hold it. The 1.5% stretch tolerance gives a tiny, honest give.

### 2.4 Obstacles
Circles and rounded rectangles via signed-distance functions. After each constraint pass, every cable point (and the plug) inside `radius + 1 u` of an obstacle is pushed out along the gradient. Cables **wrap** convex obstacles when pulled taut (the player sees the cable hug the mug). Tall obstacles (mug, plant, lamp) block; flat ones (a notebook, a mouse pad) are decor and do not.

### 2.5 Settling a cable at level load
Initial shape = a circular arc from port to the plug's resting position with arc length exactly `L`, bulging to the side given by `curl`. Then ~60 relaxation steps (not visible) so friction/bending produce the final lazy curve. Deterministic, so the same level always starts the same.

### 2.6 Rendering recipe (Canvas 2D, per cable)
Smooth the polyline with quadratic midpoints, then draw passes back to front:

1. **Contact shadow:** a wide (+3 u) stroke in `rgba(0,0,0,0.16)` offset (2.4, 3.6) u, plus a narrower darker one at 0.20 alpha. (Two cheap strokes read as a soft blur without `shadowBlur`.)
2. **Underside:** body color darkened 28%, full width.
3. **Body:** key color, 86% width.
4. **Ribbing / braid:** a stroke of full width with `lineCap = butt` and `setLineDash([1.6, 2.6])`, dark at 0.20 alpha. Because a butt-capped dash on a wide stroke renders *bands across the cable*, this reads as woven ribbing. `lineDashOffset` is fixed to the material coordinate, so the pattern **travels with the cable** as it slides.
5. **Second weave:** same, offset by half a period, light at 0.10 alpha, for a twill look.
6. **Highlight:** a thin (28% width) stroke translated (−0.7, −0.9) u toward the light, color white at 0.30 alpha (+ strain boost).
7. **Pulse (on power):** an additive glow band of length 46 u traveling plug→port at 1500 u/s (section 6).
8. **Plug collar and port nub:** small rounded caps drawn at each end.

The 2-px-ish stack costs ~7 stroke calls per cable; budget: ≤ 10 cables on screen.

## 3 · The plug

### 3.1 Anatomy (top-down)
Body (rounded rect 20 × 24 u slim; 56 × 34 u fat), key-colored, glyph embossed on the back; two prongs (8 × 3 u) that glint; a strain-relief collar where the cable attaches. **Front = prongs = away from the cable.** When seated the prongs are hidden inside the socket (clipped), leaving the body flush.

### 3.2 States and tween values

| Property | Resting | Held | Hovering | Seated |
| --- | --- | --- | --- | --- |
| Lift `h` | 0 | 1 | 1 → 0.6 | 0 |
| Scale | 1.00 | 1.14 (outBack, 90 ms) | 1.08 | 1.00 |
| Shadow offset | (2, 3) u | (8, 13) u | (5, 8) u | (1, 1.5) u |
| Shadow alpha | 0.22 | 0.30 | 0.26 | 0.18 |
| Rotation | along last cable segment | toward travel, smoothed (τ 70 ms) | blends to socket axis (80 ms) | socket axis |
| Wobble | slight, decays | proportional to speed (≤ 6°) | damped | none |

### 3.3 Finger coupling
- `target = finger + offset`, `offset = (−6, −40) u · ease(t)`, easing in over 120 ms from (0,0) so the plug never jumps.
- The plug point moves toward `target` by `α = 1 − exp(−dt / τ)` per step, with `τ = 55 ms` slim, `85 ms` fat, **max speed 2600 u/s** slim, `1800 u/s` fat. This gives lag (weight) without latency feel.
- The first frame after touch-down must visibly respond (the lift tween starts that frame); the acceptance test is *visual response ≤ 1 frame*.

### 3.4 Slim vs fat feel
| | Slim | Fat brick |
| --- | --- | --- |
| Follow τ | 55 ms | 85 ms |
| Max speed | 2600 u/s | 1800 u/s |
| Rustle | normal | deeper, +30% volume |
| Thunk base freq | 190 → 99 Hz | 120 → 62 Hz, longer decay |
| Haptic | 26 ms | 38 ms |
| Shake | 1.6 u | 2.4 u |
| Hit-stop | 35 ms | 50 ms |

## 4 · Sockets, the magnet and the seat

### 4.1 Magnet
| Parameter | Start | Why |
| --- | --- | --- |
| Engage radius | **44 u** (plug center → socket center) | Forgiving on small screens |
| Release radius | 54 u | Hysteresis against flutter |
| Pull strength | `w = smoothstep(44, 18, d)` → position blend up to 0.65 toward the pre-seat point | A lean, never a teleport |
| Align time | 80 ms | Rotation reaches the socket axis as it arrives |
| Candidates | free, compatible, live, un-covered, reachable | The nearest wins |
| Rim light | rises over 120 ms, falls over 200 ms | |

If the plug is over an **invalid** socket (wrong key, dead, covered) it does *not* engage; releasing within 30 u of it triggers the refusal.

### 4.2 Seat timeline (ms from release)
| t | Event |
| --- | --- |
| 0 | Release. Capture velocity. Enter SEATING. Lock magnet. |
| 0 – 70 | Ease to the pre-seat pose (position, rotation); scale 1.14 → 1.06 |
| 70 – 110 | Slide 12 u along the insertion axis (ease-in); scale → 0.96 |
| **110** | **CONTACT**: thunk · hit-stop 35 ms · camera nudge 1.6 u · strip squash 3% (140 ms spring) · ripple · 8 sparks · medium haptic · cable wobble · rim flash |
| 110 – 240 | Settle: scale 0.96 → 1.00 with a spring (ζ 0.45), 1.2 u back-out rebound |
| 110 + | **Pulse** starts down the cable; device wakes on arrival |

Total release→contact is **110 ms** (acceptance range 90–130 ms). Faster feels twitchy; slower feels laggy.

### 4.3 Refusal timeline
| t | Event |
| --- | --- |
| 0 | Plug pushes 5 u toward the socket (as if trying) over 60 ms |
| 60 | **Knock**; socket flash; device wince |
| 60 – 240 | Hop back along the away-vector 44 u on an arc (peak 10 u, scale 1.10), spin ±12°; cable whip; settle |
| 240+ | Resting. No state is lost. |

### 4.4 Unplug detent
A seated plug resists the finger for the first **12 u** of pull (it stays flush, the cable tightens a hair), then **pops**: a quick 6 u spring forward, pop sound, tick haptic, the device power-downs (screen collapses to a dot, falling glide, pad voice releases). The detent makes pulling out feel *physical* and prevents accidental unplugs when the thumb lands near a seated plug.

### 4.5 Bricks and covered sockets
A fat plug draws a translucent **footprint** over its neighbors on hover (only when engaged). Covered sockets dim 40% and show a soft shadow of the brick. If the brick would overlap another plug's seat, the footprint flashes warning orange and the drop is refused.

## 5 · Devices

### 5.1 Phone wake timeline (from pulse arrival)
| t (ms) | Event |
| --- | --- |
| 0 | Screen center flash; chime on the next scale step; pad voice starts (attack 600 ms) |
| 0 – 140 | Eyes pop from closed to open (scale 0 → 1.15 → 1.00, outBack); body hop +8% → settle (spring) |
| 0 – 380 | Screen bloom: wallpaper reveals radially from the port outward |
| 60 – 760 | Battery counter 12% → 100% (outCubic); lightning-bolt icon bounces at 2 Hz |
| 0 – 600 | Light pool radius 0 → 120 u, intensity 0 → 1 |
| 700+ | Idle-awake loop (blink, glance, breathe) |

### 5.2 Faces
Drawn procedurally on the screen: two rounded vertical eyes (white with a dark pupil that can slide), optional brows (a single line), and a mouth (a small arc). Parameters: `eyeOpen (0..1)`, `look (vec)`, `brow`, `mouth`, `blush`. Each emotional state (chapter 02) is a preset; transitions tween over 90–140 ms. **Pupils track the held plug** at up to 4 u of travel, easing at τ 70 ms.

### 5.3 Idle micro-life (every object)
| Object | Idle |
| --- | --- |
| Asleep device | Breath scale ±0.4% at 0.25 Hz; *z* every 2.5 s; red low-battery outline blink every 3 s |
| Awake device | Blink every 3–6 s (random), glance every 5–9 s, breath ±0.3% |
| Socket rim | Breathing glow ±8% at 0.35 Hz (only when free and compatible with *some* plug) |
| Strip LED | Steady, with a tiny flicker on any seat |
| Mug | Steam wisps (3 particles/s) |
| Plant | Leaf sway ±1.5° at 0.2 Hz, gust-driven |
| Lamp | Head tilts toward the held plug when nearby |

## 6 · The juice stack (event → channels)

| Event | Visual | Audio | Haptic | Camera | Particles |
| --- | --- | --- | --- | --- | --- |
| Touch plug | Lift, shadow spread, device stirs | tick | 10 ms | — | tiny dust puff |
| Carry | Cable slides, eyes track | rustle ∝ speed | — | — | — |
| Magnet engages | Lean, rim glow | magnet-tick | 6 ms | — | rim shimmer |
| Taut | Highlight, squint | twang once | — | — | — |
| **Seat** | Slide, squash, hit-stop | **thunk** | 26/38 ms | nudge 1.6/2.4 u | ripple + 8 sparks |
| Pulse | Light zips along cable | zip (subtle) | — | — | — |
| **Wake** | Eyes pop, bloom, count, light pool | chime(n) + pad | — | — | wake sparkle |
| Refuse | Hop, whip, wince | knock | 12-40-12 | tiny | puff |
| Unplug | Resist, pop, power-down | pop + falling glide | 14 ms | — | pop flecks |
| Switch flip | Rocker, standby→wake cascade | clack + arpeggio | 20 ms | nudge | line of sparks along strip |
| **Level complete** | Cascade, chord bloom, stars | arpeggio + chord + shimmer | 18-60-18-60-40 | ease-out 3% | confetti sparks along cables, dust motes |
| Swap | Slide, drop-in bounces | whoosh + soft thuds | — | slide | — |
| Poke | Reaction by device | per-device blip | 8 ms | — | — |

Every haptic has a visual equivalent: the game must read as complete without vibration.

## 7 · Hit-stop, shake, camera
- **Hit-stop:** at contact, the *simulation clock* is scaled to 0 for 35 ms (50 ms fat). Particles, audio and the camera spring keep running. A 2-frame pause that nobody notices consciously but everybody feels.
- **Camera shake:** a damped spring on the camera offset, impulse = `1.6 u · weight` along the plug's insertion axis (so it nudges *into* the desk), ζ 0.5, ω 38 rad/s.
- **Breathing:** on level complete, zoom 1.00 → 1.03 → 1.00 over 900 ms, easeInOutCubic.
- **Reduce-motion:** shake ×0.25, no hit-stop, no zoom, ripple only, particles ×0.4.

## 8 · Particles and effects

| Effect | Count | Life | Notes |
| --- | --- | --- | --- |
| Sparks (seat) | 8 | 280–420 ms | Additive; speed 80–220 u/s; drag 4/s; key color with a white core |
| Ripple ring | 1 | 320 ms | Radius 0 → 34 u; width 2 u → 0.5 u; 30% alpha, expands on the mat |
| Wake sparkle | 12 | 600 ms | Around the device, floats up |
| Dust motes | 24 ambient | ∞ | Visible only when the room is awake; slow Brownian drift in lamp beam |
| Steam | 3/s | 1.6 s | Off the mug; drifts with the room's "breath" |
| *z* letters | 1 / 2.5 s | 2 s | Above asleep devices |
| Cable confetti | 6 per cable | 900 ms | Sparks that *travel along* the cable on win |
| Star burst | 14 per star | 500 ms | Gold, around the star icon |
| Dead-socket spark | 5 | 200 ms | Blue-white; plus a smoke puff |
| Footprint flash | — | 450 ms | Brick footprint over covered sockets |
| Captions | 1 | 800 ms | *oof*, *ahh*, *!* as sticker text |

Global particle cap: 220. The cap and spawn rates scale with the degrade ladder.

## 9 · Lighting
A **light map** at half resolution (cheap, blurry by nature):
1. Fill with ambient `#151B33` at `A = 0.62 · (1 − awake^0.8)` where `awake` is the fraction of required devices powered.
2. For every awake device, punch a **radial gradient hole** (`destination-out`) of radius 120 u (lamp 220 u), eased in over 600 ms.
3. Composite the light map over the scene.
4. A second additive pass (`lighter`, warm `#FFD9A0` at ≤ 0.12 alpha) paints the glow itself.
5. On the full-bleed surface, a static vignette and a gentle top-left key light gradient give the whole room its dusk-lamp feel.

Cost: one half-res full-screen composite per frame. If it threatens frame time, drop to a third-res and update every second frame (the light moves slowly).

## 10 · Audio

### 10.1 Engine
Web Audio, created on first gesture (`resume()` on `pointerdown`). Graph:

```
voices ─► sfxBus ──────────────┐
          padBus ► lowpass ────┤► master(0.9) ► compressor ► destination
          ambientBus ► lowpass ┤        ▲
reverb send (convolver IR) ────┘        └ sidechain-ish ducking of pad on big events
```

- **Reverb IR:** generated at startup: 1.1 s of exponentially decaying stereo noise, high-passed at 200 Hz.
- **Compressor:** threshold −14 dB, ratio 3, attack 5 ms, release 120 ms. Master output never clips.
- **Voice limiting:** ≤ 24 simultaneous voices; oldest quietest is stolen; identical SFX within 25 ms are merged (prevents machine-gun on multi-touch).
- **Pitch variation:** ±3% random on every repeating SFX; weight lowers pitch.
- **Latency:** schedule on `ctx.currentTime` with a 0 ms lookahead for touch-triggered sounds; a 10 ms lookahead for chimes (to align with the pulse arrival).

### 10.2 Sound recipes (all synthesized)

| Sound | Recipe |
| --- | --- |
| **tick** (pick-up) | Noise burst 18 ms, band-pass 2600 Hz Q 1.4, gain 0.35, attack 1 ms, exponential decay · plus sine blip 880 → 700 Hz, 24 ms, gain 0.10 |
| **magnet-tick** | Sine 1320 Hz 12 ms gain 0.06 + noise band-pass 1200 Hz 8 ms |
| **thunk(weight 0…1)** | **Body:** sine `f0 = lerp(190, 105, weight)` falling to `0.52·f0` over 85 ms, attack 2 ms, decay τ 70 ms, gain 0.9 · **Sub:** sine at `0.26·f0`, 120 ms, gain 0.35 · **Click:** noise 9 ms high-pass 2500 Hz gain 0.45 · **Plastic knock:** noise band-pass 1100 Hz Q 6, 45 ms, gain 0.25 · **Metal tink:** sines 3150 Hz and 5230 Hz (inharmonic), 60 ms, gain 0.05 each · reverb send 0.12 |
| **pop** (unseat) | Noise high-pass 1800 Hz 10 ms + sine sweep 260 → 520 Hz in 40 ms, gain 0.25 |
| **rustle** (loop) | Looped pink noise → band-pass (center `500 + 1800·v` Hz, Q 0.9) → gain `0.22·v^1.2` smoothed 40 ms, where `v` = normalised cable speed; amplitude-modulated 18–28 Hz with a random walk for stick-slip |
| **twang** | Sine 180 → 150 Hz over 140 ms + a detuned 363 Hz partial, decay 250 ms, gain 0.15, short noise tick at onset |
| **chime(n)** | FM-less *bell*: partials at ratios [1, 2.0, 3.01, 4.2, 5.4], gains [1, .42, .22, .12, .06], decays [1.1, .7, .45, .28, .18] s, attack 3 ms, ±3 cents detune · soft sub sine at f/2 for 0.4 s · reverb send 0.35 · pitch = C5 + pentatonic step `n` |
| **pad voice** | Two detuned triangle oscillators (±6 cents) → low-pass 1400 Hz → gain ramp attack 0.6 s, sustain 0.035, release 0.7 s |
| **knock** (refuse) | Sines 190 Hz and 410 Hz with 45 ms / 30 ms decays + noise band-pass 900 Hz 25 ms; gain 0.5; ±3% pitch |
| **zap** (dead socket) | Noise band-pass sweeping 3 kHz → 800 Hz over 120 ms, gain 0.25 + sine 60 Hz 90 ms gain 0.15 + 3–5 random clicks in 80 ms |
| **switch clack** | Noise 12 ms high-pass 1200 Hz + sine 140 Hz 60 ms + a second softer click 38 ms later (rocker travel) |
| **pulse zip** | Sine glide 600 → 2400 Hz over 140 ms, gain 0.05, reverb send 0.25 |
| **wake cascade** | Rising arpeggio of chimes (stagger 140 ms) + pad voices ×2 gain over 0.5 s + shimmer (noise high-pass 5 kHz, exp envelope 1.2 s, gain 0.08) + 3 high sine sparkles |
| **star(i)** | Bell at pentatonic step `5 + i`, soft wobble |
| **swap whoosh** | Noise band-pass sweeping 300 → 2400 Hz over 450 ms, gain 0.10 |
| **drop-in thud** | Sine 120 → 70 Hz, 80 ms, gain 0.25; pitch by object size |
| **ambience** | Brown noise → low-pass (900 Hz at 0% awake → 9 kHz at 100%), −42 dBFS · a clock tick every 1 s (noise 6 ms high-pass 3 kHz + sine 1.4 kHz 10 ms), fading out as the room wakes |

### 10.3 Musical system
- **Scale:** C major pentatonic from C5 (MIDI 72): semitones `[0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24]`.
- **Chime ladder:** `n = number of devices awake right now` at the moment of waking; unplugging steps the ladder back. Order of play changes the tune; every order is consonant.
- **Pad chord:** device `k` (in wake order) takes the k-th tone of Cmaj9 voiced low (C3, G3, E4, B4, D5, then repeats an octave up). The chord is therefore always a consonant stack.
- **Act key:** transposed by act (Act 1 = C, Act 2 = D♭ …) at level start; no mid-level modulation.
- **Win resolution:** a final C-major add9 bloom regardless of key, on the octave of the root.

### 10.4 Platform notes
- Unlock on the first `pointerdown`; if the context stays `suspended`, retry on every gesture.
- iOS Safari silent switch mutes Web Audio unless an HTML audio element is also playing; use a muted/looped keep-alive element trick as a best effort and keep the game fully readable without sound.
- Respect a **Sound** and a **Music/ambience** toggle separately; both persist.

## 11 · Haptics

| Pattern | `navigator.vibrate` | Notes |
| --- | --- | --- |
| grab | 10 | |
| magnet | 6 | Faint; some phones will not render it, that is fine |
| seat (slim) | 26 | The signature thud |
| seat (fat) | 38 | |
| pop (unplug) | 14 | |
| refuse | [12, 40, 12] | Double micro-pulse |
| switch | 20 | |
| win | [18, 60, 18, 60, 40] | |
| poke | 8 | |

- Android Chrome supports the Vibration API. **iOS Safari does not**; best-effort fallback: toggling a hidden `<input type="checkbox" switch>` from inside a user-gesture handler produces a light haptic tick on recent iOS. It only works from real gesture handlers, so all haptic calls are made synchronously from pointer handlers where possible. The game must be complete without it.
- A **Haptics** toggle persists. Intensity scales pulse lengths (0.5×, 1×, 1.5×).

## 12 · Motion language

| Name | Curve | Used for |
| --- | --- | --- |
| `outBack(1.7)` | overshoot | lifts, eyes popping, UI pops |
| `outCubic` | decelerate | settles, counters |
| `inOutCubic` | symmetric | camera breathing, slides |
| `outElastic(1, 0.4)` | wobbly | star pop, wake hop |
| `spring(k, ζ)` | physical | squash, plug settle, strip compress |
| `smoothstep` | S-curve | magnet blend, light fades |

| Duration | Start |
| --- | --- |
| UI pop in | 220 ms |
| Level title pill | in 220 ms, hold 1500, out 300 |
| Swap slide | 520 ms |
| Drop-in stagger | 60 ms per object, each 360 ms bounce |
| Stars in | 140 ms apart |

## 13 · Performance budget and degrade ladder

Target: locked 60 fps on a mid-range phone (Snapdragon-7-class), first load < 2 MB (no assets except fonts-from-system), JS frame budget **12 ms**.

| Subsystem | Budget |
| --- | --- |
| Physics | ≤ 2 ms (≤ 10 cables × ≤ 60 pts × 12 iters × ≤ 2 steps) |
| Draw (scene) | ≤ 6 ms |
| Light map | ≤ 1.5 ms |
| Audio scheduling | ≤ 0.5 ms |
| Particles | ≤ 220 live |

**Degrade ladder** (the game steps down automatically if the 90th-percentile frame time exceeds 14 ms for 2 s):
1. Light map to third-res, updated every other frame.
2. Drop the second weave pass and the contact-shadow second stroke.
3. Particles ×0.5.
4. DPR 1.5 → 1.25.
5. Cap at 30 fps with a doubled physics step to keep feel stable.

Rendering is static-layer cached: the **surface** (wood, mat, vignette) is pre-rendered once per level/resize; **shadows** for rectangles are cached sprites by (w, h, radius); only cables, plugs, devices, particles and the light map are drawn per frame.

## 14 · The tuning panel and debug tools

Open with **triple-tap on the level pill** or `?tune=1`. It must be usable *on the phone*, because feel is judged there.

- Auto-generated sliders from a single `TUNE` table: every constant in sections 2–9 (cable, plug, magnet, seat, juice, camera, audio gains).
- **Slow motion** 0.1×–1×; **freeze**; **step**.
- **Overlays:** cable points and constraints, hit radii, magnet radii, reach circles, footprints, FPS/frame-time graph, light-map view.
- **Persist** to `localStorage` (`snug.tune.v1`); **Copy JSON**; **Reset**.
- **Level jump** (`?level=7`), **auto-solve** (uses the solver and plays the solution with real drags), **spawn toy** (`?toy=1`: one plug, one socket, no goals; the Click Test scene).

## 15 · Feel acceptance tests (the slice is not done until these pass)

| # | Test | Pass condition |
| --- | --- | --- |
| 1 | Touch → visible response | Lift tween starts the same frame as `pointerdown` |
| 2 | Release → contact | 90–130 ms |
| 3 | Follow lag | Plug within 12 u of target after 180 ms of constant-velocity drag |
| 4 | Cable inextensibility | Total polyline length ≤ 1.03 × L at all times |
| 5 | Rest stability | Max cable point displacement < 0.02 u per step over 2 s at rest |
| 6 | Reach honesty | A plug dragged beyond reach stops and the cable is straight; no tunneling through obstacles |
| 7 | Chime sync | Chime within 40 ms of pulse arrival |
| 8 | Audio hygiene | Peak < −1 dBFS; no clipping; no DC offset; no stuck voices after 10 s idle |
| 9 | Silent completeness | Every haptic/sound event has a visual equivalent |
| 10 | Frame time | p90 < 14 ms with 6 cables moving on the reference device |
| 11 | The Click Test | 4 of 5 strangers replay a plug-in "for no reason" within a minute |
| 12 | Tolerance | Every intended placement succeeds with a finger error of ±10 u |

---

## Open water

- **A 3-axis "plug lean".** Make the held plug lean slightly in the direction of acceleration (a pendulum feel), so flicking it side to side swings its nose.
- **Material-aware sounds.** The same thunk with slightly different timbres on felt, wood and metal mats (one extra band-pass and a different click), so each world *sounds* like a different surface.
- **The cable *has a voice.*** The rustle's color shifts with the cable skin and with tension: a taut cable's rustle thins and brightens. A rope creaks; a braided cable hushes.
- **Breath-of-the-room ducking.** On the level-complete chord, briefly duck the ambience 3 dB so the chord rises out of the room like a held breath being released.
- **An accelerometer "settle".** If the phone is bumped, cables twitch gently (tiny random impulses), so the room feels like it's *sitting on your phone's desk*.
- **Tuning from the couch.** A shake-to-open tuning panel for the on-device test sessions you'll actually do.

---

## Appendix · What changed after building it (read this before retuning)

The numbers above were the *plan*. Playing the first real levels with a bot that drags like a thumb found problems the plan could not. These are the corrections, in the order they were found.

1. **No curl bias.** A built-in lateral bias in the bend smoothing gave the cable an intrinsic curvature (a radius of about 90 u), so it behaved like a coil that *resisted straightening* and could not reach sockets even when the chord was half its length. `curlBias` now defaults to **0**; `cable.curl` only chooses the side of the *initial* arc.
2. **Smoothing only when carried or taut.** Any position-level smoothing acts as a non-physical force that straightens a free-ended cable: resting plugs crept 2 u/s forever. Now: smoothing is **0 at rest**, gentle while a plug is carried (`bendK × 0.35`), and **stronger under strain** (`+ 0.22 × strain`) so loops and coils unwind instead of jamming. Rest stability is 0.000 u/s.
3. **A one-sided bend limit was tried and rejected** (it injected energy and made plugs drift).
4. **Seated cables settle into arcs.** After the thunk (0.28 s hold so the wobble plays), cable points relax toward a circular arc from port to plug (`relaxK = 0.03` per step), skipped when the arc would touch an obstacle or while the cable is being nudged. `settleCurl` fixes the bulge side per level so neighbours nest. The cached ideal arc is invalidated whenever the plug moves (a stale cache once made cables settle toward the *previous* socket).
5. **Initial arcs must fit the stage.** Slack arcs that bulge past the physics clamp get yanked and move the plug at load. The validator now fails any level whose resting arcs leave the stage.
6. **The magnet uses the aim point** (finger + offset), not the lagging plug.
7. **Hit areas:** tighter brick hit shape (visible bounds + 5 u), the switch wins over a marginal plug hit, and the switch block sits 12 u farther from the last socket.
8. **The fat plug looks like a power brick** (charcoal, 96 × 32, LED), not a cream strip.
9. **Audio:** master gain raised (1.35) and the thunk body is a triangle wave so it carries on small speakers; the Level 10 radio riff is synthesized (`sfx.riff`).

Final defaults that differ from section 2.1's starting table: `bendK 0.12` (scaled by state as above), `curlBias 0`, `relaxK 0.03`, brick `bw 96`.

**Measured (headless Chrome, so not a phone):** release→contact 104 ms; follow lag 6 u at 200 u/s; cable length ≤ 1.014 L under a violent drag; rest speed 0.000 u/s; update 0.1–0.4 ms and draw 1.4–3 ms of main-thread time per frame.
