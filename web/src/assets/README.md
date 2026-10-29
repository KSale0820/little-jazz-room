# Visual asset manifest

Runtime paths: `web/src/assets/visualManifest.ts`

| Asset | Primary file | Fallback |
|-------|----------------|----------|
| Room sunshine | `/room/home-hero-sunshine.png` | `/room/catfree-sunshine.svg` |
| Room twilight | `/room/home-hero-twilight.png` | `/room/catfree-twilight.svg` |
| Room night | `/room/home-hero-night.png` | `/room/catfree-night.svg` |
| Cat portrait (chooser, avatars) | `/jazz-cat-assets/{id}-portrait.png` | `{id}.svg` |
| Cat sprite (Home floor, banner) | `/jazz-cat-assets/{id}.svg` | — |
| Cat icon / small | `{id}-icon.png`, `{id}-small.png` | portrait |
| Decor | `/decor/plant.png`, `books.png`, `mug.png`, `botanical-corner.svg` | — |

Metadata authority: `web/public/jazz-cat-assets/cats.json` (eight cats; do not rename or alter identities).

Do **not** use `home-room-base.png` or collage boards at runtime. See `web/docs/ASSET-INTEGRATION-PLAN.md`.
