# Visual asset manifest

Runtime paths live in `web/src/assets/visualManifest.ts`.

| Asset | Primary file | Fallback |
|-------|----------------|----------|
| Room sunshine | `/room/catfree-sunshine.svg` | `/room/home-room-base.png` (deprecated crop) |
| Room twilight | `/room/catfree-twilight.svg` | `/room/home-room-twilight.png` |
| Room night | `/room/catfree-night.svg` | `/room/home-room-night.png` |
| Cat portrait | `/jazz-cat-assets/{id}-portrait.png` | `/jazz-cat-assets/{id}.svg` |
| Cat sprite (Home) | `/jazz-cat-assets/{id}.svg` | — |
| Cat chooser card | `/jazz-cat-assets/cards/{id}-card.png` | portrait → sprite |
| Botanical decor | `/decor/botanical-corner.svg` | none |

Drop final cat-free PNG/JPG room art into `/public/room/` and update `VISUAL_ASSETS.room.catFree` filenames when ready. Do **not** crop `APPROVED-VISUAL-REFERENCE.png`.
