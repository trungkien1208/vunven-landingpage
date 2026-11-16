# Vun Vén landing page

A landing page told as a short clay stop-motion film: Hun the penguin, five chapters, fifteen shots, then the ticket, the FAQ and the end credits (with a scene after them).

## Run

```sh
cd site
npm install
npm run dev        # local dev server
npx vite build     # production build into site/dist
```

`npm run build` also regenerates the images in `site/public/film` from the raw art in `art-gen/`. The raw PNGs are not in this repo, so on a fresh clone use `npx vite build`.

## Layout

- `site/` the page: Vite, TypeScript, GSAP. `scripts/gen-index.py` writes `index.html` from the copy in `src/i18n.ts` (Vietnamese and English).
- `art-gen/` prompts, shot lists and scripts used to draw the film with Codex (images not included).
- `plan/` notes and copy drafts.
- `reference/original/` assets from the original Vun Vén site that the build reuses (icons, fonts, Hun moods).

© 2026 TDK Technology Solutions Joint Stock Company.
