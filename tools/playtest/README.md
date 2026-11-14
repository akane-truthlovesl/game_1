# Snug playtests (optional)

Headless Chrome plays the game with **real pointer drags**, so a level only passes if a thumb could actually do it.

```bash
# terminal 1: serve the project
cd game_1 && python3 -m http.server 8123 --bind 127.0.0.1

# terminal 2
cd game_1/tools/playtest && npm install           # installs playwright-core only (uses your system Chrome)
export CHROME=/usr/bin/google-chrome              # path to Chrome/Chromium if different
node bot.mjs                  # solves every level using the solver's hints; prints stars and crossings
node bot.mjs 6 8              # only these levels
node flow.mjs                 # UI flow: title plug-in, menu, levels grid, solve, Next, undo/hint/restart, settings, save/resume
node feel.mjs                 # feel probes from the Feel Bible (response, release->contact, lag, inextensibility, reach, frame time)
node touch.mjs                # real touch events via CDP + the tuning panel
node audio.mjs                # renders every sound offline, reports peak/DC/centroid, rewrites docs/audio/sfx-sampler.wav
node finale-shots.mjs         # screenshots of the Act 1 finale
```

Screenshots land in `out/`. Notes: frame-rate numbers from headless Chrome use a software rasterizer and say nothing about phones; haptics and speakers can only be judged on a real device.
