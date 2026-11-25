# cooking-game-20261125

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/alexchen950615/cooking-game-20261125/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/alexchen950615/cooking-game-20261125/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

**The Golden Ladle** — a cozy little cooking game. Run a one-chef kitchen for a
3-minute shift: pick ingredients from the crates, chop tomatoes, lettuce and
onions on the board, grill patties (don't let them burn!), stack dishes on a
plate at the assembly counter, and serve them at the window before each
order's patience runs out. Orders get faster and harder as the dinner rush
arrives; on-time serves build a combo and earn tips.

## How to play

- **WASD / arrow keys** — walk the chef around the kitchen
- **E or Space** — use the counter you're standing at
- **Mouse** — click the floor to walk there, click a counter to walk over and use it
- **R** — restart the shift · **M** — mute the music and sounds

Recipes on the menu: Sunny Stack, Garden Stack, Golden Melt, Green Crunch
and Double Trouble. Every sound and the little waltz that plays in the
kitchen are synthesised live with WebAudio — no audio files, no network
requests, everything in `game/` is plain static files.

## Play it

Serve `game/` with any static server and open `game/index.html` in a desktop
browser, or run `node serve.ts` (serves on http://localhost:8080).

Screenshots in `screenshots/` are real renders of the game, staged with
`?shot=start|play|rush|end`.
