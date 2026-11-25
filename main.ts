// The Golden Ladle — the hand-in program (Node 22, standard library only).
// It copies this repository's game/ and screenshots/ into the output
// directory and writes output/dossier.json with the vendored make.fun
// library, so the scorer can check the game and the judge can read it.
// Run it as:  MAKEFUN_OUTPUT_DIR=out node main.ts
// (Inside the grader MAKEFUN_OUTPUT_DIR is unset and /output is used.)

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The caps are the bounty's own: the dossier text is capped at 160 KiB, at
// most 4 screenshots of at most 256 KiB each, and game/ at most 993 entries
// and 48 MiB in all, so the whole of /output stays inside its 1000-entry cap.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
