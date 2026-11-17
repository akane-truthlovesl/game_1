# Snug

*Every room starts asleep. You plug it awake.*

A one-thumb, portrait HTML puzzle game about carrying plugs to sockets on a cable that has real weight and real length. The click of a plug seating is the product; the puzzle is the reason to earn another one. No build step, no dependencies, no asset files: everything (art, sound, haptics) is generated in the browser.

Design lives in [`docs/GDD.md`](docs/GDD.md) (start there). **The standing goal, status and next actions live in [`GOAL.md`](GOAL.md)** (read it first when resuming work). **Phase 1** (the core feel stack + Act 1, levels 1–10) and **Phase 2** (Act 2, *The Workshop & the Kitchen*, levels 11–20: a sliding strip, hoops, a Y-plug, tape, a daisy chain, a puddle and its helper, a breaker, timers, a dark kitchen with a sleeping cat, and a boss that needs all of it, ending in a sunrise) are built; see `GOAL.md` §0 for exactly where we are.

## Run it

```bash
cd game_1
python3 -m http.server 8000
# desktop:  http://localhost:8000
# phone on the same Wi-Fi:  http://<your-computer's-LAN-IP>:8000
```

It also opens straight from `index.html` (classic scripts, no modules). On a phone, add it to the home screen for a full-screen, no-browser-chrome experience.

**URL switches:** `?level=7` jump to a level · `?toy=1` the Fidget room (the "Click Test": plug and pull for no reason) · `?tune=1` live tuning panel · `?debug=1` physics/FPS overlay · `?slow=0.25` slow motion.
**On a phone,** triple-tap the level pill to open the tuning panel; **Copy** prints your finished numbers so they can be pasted into `src/tune.js`.

## How to play

Press a plug (the thing on the end of each device's cable), drag it to a socket, let go. It leans in, slides home and wakes the device. Wake every device to light the room. Touch or strum a cable and it sounds like a string. Cables have a fixed length (they go taut and the device squints), plugs only fit their own color/shape (or the rainbow joker), bricks cover their neighbors, dead sockets stay dead, and some strips have a switch.

Tidy (no crossed cables) and Clean (no wasted moves) are optional stars. Undo, Restart and Hint are always free; nothing ever fails.

## Tools

```bash
node tools/test-rules.js                 # fast checks of the rules module (every level certified)
node tools/validate-levels.js            # certify every level (solvable? honest reach? luck score?) + --map --verbose
node tools/search-level.js l6 60000 31   # "solver as muse": search for layouts that make good puzzles
node tools/search-rail.js 40000 5        # ... and for Level 11 (sliding strip); search-hoops / search-stereo / search-chain for 12, 13, 15
node tools/auto-rest.js --levels 4 --line 4 --write   # tidy resting positions for plugs
```

Optional headless playtests (a bot that solves every level with real thumb-style drags, feel probes, a UI flow test) live in `tools/playtest/` ([README](tools/playtest/README.md)); the game itself needs none of it.

`docs/audio/sfx-sampler.wav` is a rendered sampler of every sound (tick, magnet, thunk, thunk-fat, pop, knock, zap, click, twang, bip, power-down, chimes, stars, thud, cat, win cascade, and Rex's riff) so you can hear the feel without running the game.

## Layout

```
index.html  style.css  manifest.webmanifest
src/
  util.js tune.js geom.js rules.js rope.js     shared, run in Node too
  audio.js haptics.js fx.js art.js art-devices.js finale.js
  art-workshop.js art-garage.js art-kitchen.js  Act 2 worlds and cast
  mech-rail.js mech-gates.js mech-tape.js mech-wet.js mech-breaker.js mech-timer.js mech-dark.js   Act 2 mechanics
  levels/world1.js levels/world2.js            Act 1 and Act 2 level data
  save.js room.js game.js ui.js main.js
tools/    validate-levels.js  search-level.js  auto-rest.js  test-rules.js  playtest/
docs/     GDD.md  gdd/*.md  passes/pass-01…pass-03  audio/
```
