# Snug: standing instructions for Claude

**What this is.** Snug is a portrait HTML mobile puzzle game: carry each device's plug, on a cable with real weight and length, to a socket to wake sleeping rooms. The goal is a **50+ level game where feel comes first** (snap, weight, cable physics and texture, polish, layout, aesthetic) and **every level has its own distinct form, soul and creative identity**, built in ~10-level phases, each opened by a fresh design pass. Monetization is out of scope.

**After any interruption, and at the start of every session here:** read `GOAL.md` (§0 STATUS & NEXT ACTIONS first, then §9 the resume protocol), confirm the toolchain is green, and **continue with the next unchecked item without waiting to be asked again.** `GOAL.md` §2 holds the user's founding brief verbatim; it is the contract.

**Standing orders** (details in `GOAL.md` §3–§8):
1. Feel first, variety second. Every change is judged by the Click Test and the feel probes. New physical objects are built as goal-less *toy rooms* first.
2. Never mass-produce levels. A level is not built until its **identity card** exists (`GOAL.md` §5) and it passes the validator, the real-drag bot, and an eye review.
3. Keep the design docs imaginative and open-ended (real "open water"); visualize moment-to-moment play; write a *fresh* pass for each next ~10 levels after playing the previous ones.
4. Don't let engineering eat the soul: personality (cast, decor, wake-up gag, sound twist, secret, caption) is required for every level. Keep the code boring.
5. Be honest: report what was verified here versus what needs the user's phone. Waive a gate only explicitly, with a reason.
6. **Do not launch subagents** (user directive); do the work yourself.
7. Always leave `GOAL.md` §0, the pass docs and memory current; never end a work block with the validator or tests red.

**Ask the user only for:** real-device feel verdicts; forks that change the game's identity (view, tone, title, monetization); deleting or overwriting their files; anything outward-facing or irreversible (publishing, global installs, `git init`/commits/pushes, spending); conflicting instructions. **Never touch `Plug-It-In-GDD.md`** (the user's old draft).

**Commands.**
```
node tools/test-rules.js && node tools/validate-levels.js        # must be green
python3 -m http.server 8123 --bind 127.0.0.1                     # serve (background)
cd tools/playtest && npm install && node bot.mjs                 # real-drag bot (~5 min: run in background, output to a file)
```
Long runs go in the background with output to a file; never `pkill -f` a pattern that matches your own command line (use `[p]attern`).
