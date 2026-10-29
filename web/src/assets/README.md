# Visual asset manifest

Runtime paths: `web/src/assets/visualManifest.ts`

| Asset | Primary file | Fallback |
|-------|----------------|----------|
| Room sunshine | `/room/home-hero-sunshine.png` | `/room/catfree-sunshine.svg` |
| Room twilight | `/room/home-hero-twilight.png` | `/room/catfree-twilight.svg` |
| Room night | `/room/home-hero-night.png` | `/room/catfree-night.svg` |
| Cat portrait (Practice companion) | `/jazz-cat-assets/{id}-portrait.png` | `{id}.svg` |
| Cat full body (Home, Profile, chooser) | `/jazz-cat-assets/{id}.png` | `{id}.svg` |
| Decor | `/decor/plant.png`, `books.png`; `botanical-corner.svg` is referenced from CSS | — |

Cat metadata: runtime source is `JAZZ_CATS` in `src/features/cats/CatCompanion.tsx`; `public/jazz-cat-assets/cats.json` and `CAT-JAZZ-IDENTITIES.json` feed the art pipeline. `catRoster.test.ts` fails if they drift (eight cats, instruments, art files).

Do **not** use collage boards at runtime. See `web/docs/ASSET-INTEGRATION-PLAN.md`.
