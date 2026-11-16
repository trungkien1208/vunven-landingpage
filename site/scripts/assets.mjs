// Builds web-ready media in public/ for the five-chapter film landing.
// Run: npm run assets. Re-run whenever Codex finishes more stop-motion frames.
//  - Each shot gets a still (public/film/<id>.webp + -sm) from the v3 render.
//  - If art-gen/v4/frames/<id>/f08.png exists, its 8 frames go to public/film/<id>/<n>.webp (+ -sm) and the
//    shot is marked animated in src/film-status.json; otherwise the page plays the still with a slow push-in.
import sharp from 'sharp';
import { existsSync, mkdirSync, copyFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ref = join(root, 'reference/original');
const gen = join(root, 'art-gen');
const pub = join(root, 'site/public');

const SHOTS = ['1a', '1b', '1c', '2a', '2b', '2c', '3a', '3b', '3c', '4a', '4b', '4c', '5a', '5b', '5c'];
const BACKDROPS = ['ticket', 'faq', 'end', 'poster-16x9', 'poster-4x5'];
const FRAMES = 8;

rmSync(join(pub, 'film'), { recursive: true, force: true });
mkdirSync(join(pub, 'film'), { recursive: true });

const big = (src, out) => sharp(src).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 72 }).toFile(out);
const small = (src, out) => sharp(src).resize({ width: 900, withoutEnlargement: true }).webp({ quality: 68 }).toFile(out);
// the light around the film: tiny and already blurred, so the page never has to run a big CSS blur
const amb = (src, out) => sharp(src).resize({ width: 160 }).blur(6).modulate({ saturation: 1.6, brightness: 0.62 }).webp({ quality: 60 }).toFile(out);

// Prefer screenplay v5 (16:9, art-gen/v5/frames/<id>/f01..f08); fall back to the v3 still and v4 frames.
const status = {};
for (const id of SHOTS) {
  const v5 = join(gen, 'v5/frames', id);
  const useV5 = existsSync(join(v5, 'f01.png'));
  const still = useV5 ? join(v5, 'f01.png') : join(gen, 'v3/shots', `${id}.png`);
  await big(still, join(pub, 'film', `${id}.webp`));
  await small(still, join(pub, 'film', `${id}-sm.webp`));
  await amb(still, join(pub, 'film', `${id}-amb.webp`));
  const dir = useV5 ? v5 : join(gen, 'v4/frames', id);
  if (existsSync(join(dir, `f0${FRAMES}.png`))) {
    mkdirSync(join(pub, 'film', id), { recursive: true });
    for (let n = 1; n <= FRAMES; n++) {
      const f = join(dir, `f0${n}.png`);
      await big(f, join(pub, 'film', id, `${n}.webp`));
      await small(f, join(pub, 'film', id, `${n}-sm.webp`));
    }
    status[id] = FRAMES;
  } else status[id] = 0;
  status[`${id}:src`] = useV5 ? 'v5' : 'v3';
}
// the scene after the credits: only if Codex has drawn all of it
{
  const pc = join(gen, 'v5/frames/pc');
  status.pc = existsSync(join(pc, `f0${FRAMES}.png`)) ? FRAMES : 0;
  if (status.pc) {
    mkdirSync(join(pub, 'film', 'pc'), { recursive: true });
    for (let n = 1; n <= FRAMES; n++) {
      await big(join(pc, `f0${n}.png`), join(pub, 'film', 'pc', `${n}.webp`));
      await small(join(pc, `f0${n}.png`), join(pub, 'film', 'pc', `${n}-sm.webp`));
    }
  }
}
for (const id of BACKDROPS) {
  const v5 = join(gen, 'v5/frames', id, 'f01.png');
  const src = existsSync(v5) ? v5 : join(gen, 'v3/shots', `${id}.png`);
  await sharp(src).resize({ width: 1920, withoutEnlargement: true }).webp({ quality: 72 }).toFile(join(pub, 'film', `${id}.webp`));
  await small(src, join(pub, 'film', `${id}-sm.webp`));
  await amb(src, join(pub, 'film', `${id}-amb.webp`));
}
writeFileSync(join(root, 'site/src/film-status.json'), JSON.stringify(status, null, 2) + '\n');
console.log('shots:', SHOTS.map((id) => `${id}:${status[`${id}:src`]}${status[id] ? '+frames' : ''}`).join(' '));

// The app's own 3D icons and Hun moods, for the phone screens.
const ui = join(pub, 'ui');
rmSync(ui, { recursive: true, force: true });
mkdirSync(ui, { recursive: true });
const ICONS = {
  heart: 'demo-icons/category-heart-v1.webp', pill: 'demo-icons/category-pill-v1.webp', bp: 'demo-icons/health-bp-v1.webp',
  market: 'demo-icons/category-market-v1.webp', wallet: 'demo-icons/category-wallet-v1.webp', calendar: 'demo-icons/card-calendar-v1.webp',
  family: 'demo-icons/settings-usersthree-v1.webp', lock: 'demo-icons/settings-lock-v1.webp', bell: 'demo-icons/settings-bell-v1.webp',
  mood4: 'demo-icons/hun-mood-4-v2.webp', mood5: 'demo-icons/hun-mood-5-v2.webp',
};
for (const [name, src] of Object.entries(ICONS)) {
  const size = name.startsWith('mood') ? 200 : 96;
  await sharp(join(ref, src)).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp({ quality: 88 }).toFile(join(ui, `${name}.webp`));
}
for (const f of ['apple-touch-icon.png', 'favicon.png', 'og.jpg']) copyFileSync(join(ref, f), join(pub, f));
console.log('done');
