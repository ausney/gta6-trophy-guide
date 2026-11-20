// Leonida Platinum — a GTA VI trophy guide and tracker, entered in
// gta6-trophy-guide-01. The guide itself is plain static files under app/
// (index.html, its modules and styles, and app/data/trophies.json), built to
// open in desktop Chrome with the network off: nothing it loads comes from
// anywhere but app/. This program hands the entry in. It copies app/ and
// screenshots/ from beside this file into the output directory and writes
// output/dossier.json with the vendored make.fun library, which is the
// summary the judge reads: the screenshots, the first load's files and
// bytes, and the source. vendor/makefun-frontend.ts must stay exactly as
// the kit shipped it, because the scorer rebuilds the dossier with its own
// copy and compares the two byte for byte.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// and serve app/ with any static server to try the guide:
//   node --run serve  (or: python3 -m http.server 8080 --directory app)

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The gate's caps, as the kit states them: at most 4 screenshots and none
// over 256 KiB; app/ at most 993 files and directories and 48 MiB in all.
// text_max_bytes is the only one that shapes the dossier's bytes; the rest
// refuse an entry the scorer would refuse anyway.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
