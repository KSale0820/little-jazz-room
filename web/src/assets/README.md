# Visual asset manifest

Runtime paths: `web/src/assets/visualManifest.ts`

The approved library, dimensions, and Stitch notes are in `web/docs/APPROVED-ASSET-LIBRARY.md`.

| Asset | Live file | Notes |
|-------|-----------|--------|
| Room sunshine / twilight / night | `/room/home-hero-sunshine.png` and matching twilight/night | 1440×800. Vector fallback: `/room/catfree-*.svg` |
| Approved portrait room | `/visuals/room/home-hero-*.png` | 941×1672. Registered only. Not used by `RoomArt` yet |
| Cat full-body | `/visuals/cats/full-body/{id}.png` | Home, Profile, chooser |
| Cat profile | `/visuals/cats/profiles/{id}.png` | `catPortraitUrl` |
| Cat close-up | `/visuals/cats/closeups/{id}.png` | Practice companion |
| Legacy cat sprites | `/jazz-cat-assets/{id}.svg` | Explicit `sprite` variant only. Not a fallback |
| Page decor still on screen | `/decor/plant.png`, `books.png`, `mug.png`, `botanical-corner.svg` | Approved replacements live under `/visuals/decor/` and are not mounted yet |

Cat ids stay `luna`, `milo`, `maple`, `mochi`, `pepper`, `patches`, `chai`, `biscuit`. Do not rename them.

Do **not** use `home-room-base.png` or collage boards at runtime.
