# Visual asset manifest

Runtime paths: `web/src/assets/visualManifest.ts`

The approved library, dimensions, and Stitch notes are in `web/docs/APPROVED-ASSET-LIBRARY.md`.

| Asset | Primary file | Fallback |
|-------|----------------|----------|
| Room sunshine | `/room/home-hero-sunshine.png` | `/room/catfree-sunshine.svg` |
| Room twilight | `/room/home-hero-twilight.png` | `/room/catfree-twilight.svg` |
| Room night | `/room/home-hero-night.png` | `/room/catfree-night.svg` |
| Approved portrait room | `/visuals/room/home-hero-*.png` | Registered only. Not used by `RoomArt` yet |
| Cat full body (Home, Profile, chooser) | `/visuals/cats/full-body/{id}.png` | `/jazz-cat-assets/{id}.png`, then `{id}.svg` |
| Cat profile | `/visuals/cats/profiles/{id}.png` | `/jazz-cat-assets/{id}-portrait.png`, then `{id}.svg` |
| Cat close-up (Practice companion) | `/visuals/cats/closeups/{id}.png` | approved profile, then the portrait PNG and SVG |
| Decor on screen | `/decor/plant.png`, `books.png` | `botanical-corner.svg` is referenced from CSS |

Cat ids stay `luna`, `milo`, `maple`, `mochi`, `pepper`, `patches`, `chai`, `biscuit`.

Cat metadata: runtime source is `JAZZ_CATS` in `src/features/cats/CatCompanion.tsx`; `public/jazz-cat-assets/cats.json` and `CAT-JAZZ-IDENTITIES.json` feed the art pipeline. `catRoster.test.ts` fails if they drift (eight cats, instruments, art files).

Do **not** use collage boards at runtime. See `web/docs/ASSET-INTEGRATION-PLAN.md`.
