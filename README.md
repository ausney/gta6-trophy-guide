# Leonida Platinum — GTA VI trophy guide & tracker

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/ausney/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/ausney/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

Leonida Platinum is an offline web app that is the best guide and tracker for the 55 PlayStation 5 trophies of Grand Theft Auto VI. Every trophy is listed with its official name, description and grade, so you can see at a glance what each one asks for and how rare it is.

Your progress is a checklist saved in the browser, with export and import so you never lose it. Filters narrow the list by grade, story, side content or completion state, a spoiler setting hides story details until you want them, and the roadmap lays out the path to the Platinum in order. The missable trophies are flagged up front, so nothing that can only be earned once is left to chance.

## Run it

Serve `app/` with any static server, then open `index.html` in desktop Chrome:

```sh
python3 -m http.server 8080 --directory app
```

or, with Node:

```sh
npx serve app
```

The app is plain static files under `app/` (index.html, its modules and styles, and `app/data/trophies.json`) and runs with the network off — nothing it loads comes from outside `app/`. To build the entry output, run the entrypoint `main.ts` (Node 22), which copies `app/` and `screenshots/` into the output directory and writes `output/dossier.json`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=a5fdvy32&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
