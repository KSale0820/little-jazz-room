# Approved visual asset library

Installed 2026-10-29 from the final handoff in `little-jazz-room-stitch-cursor-assets`. Files were copied without cropping, recoloring, or recompression. SHA-256 values match `web/docs/design/ASSET-MANIFEST.json`.

This is the authoritative library for the upcoming Google Stitch redesign. The current desktop UI is unchanged except for two substitutions the handoff required: live cat art, and the Explore and Practice navigation icons.

## Where things live

| Role | Path |
|------|------|
| Runtime artwork | `web/public/visuals/` |
| Central URLs | `web/src/assets/visualManifest.ts` |
| Five-screen reference (not served) | `web/docs/design/APPROVED-VISUAL-REFERENCE.png` (1448×1086, RGB) |
| Provenance (bytes, dimensions, SHA-256) | `web/docs/design/ASSET-MANIFEST.json` |
| Live landscape Home room (unchanged) | `web/public/room/home-hero-*.png` (1440×800) |
| Previous cat files (kept, not used as fallbacks) | `web/public/jazz-cat-assets/` |

`cats/README.txt` and `cats/verification.json` were not copied into `public`. The producer note says the 24 cat PNGs were isolated from a multi-character sheet, not drawn as separate characters. Maple is the moody cat in a pageboy cap without a scarf. Biscuit naps without a cap beside a record player. Review them at real display size during the Stitch pass. Verification recorded transparent pixels and an alpha range that reaches 0, so the files do have an alpha channel.

## Naming

Public URLs use `/visuals/{group}/{file}`.

- Groups: `room`, `cats`, `garden`, `vignettes`, `decor`, `brand`, `icons`, `achievements`, `effects`.
- Cat files are `{id}.png` inside `full-body`, `profiles`, and `closeups`.
- Ids are unchanged: `luna`, `milo`, `maple`, `mochi`, `pepper`, `patches`, `chai`, `biscuit`.
- Room lighting and overlays share one filename stem per state. Do not rename them per breakpoint.
- Navigation icons are `nav-{tab}.svg`. Utility icons are `icon-{name}.svg`.

`visualManifest.ts` is the only place components should take these paths from. `room.approved.live` is `false`. `roomArtUrls()` still returns `/room/home-hero-*.png`, then the existing cat-free SVG fallback.

## Live wiring

| Helper | URL | Used by |
|--------|-----|---------|
| `catFloorUrls` | `/visuals/cats/full-body/{id}.png`, then `/jazz-cat-assets/{id}.png`, then `{id}.svg` | Home, Profile hero, chooser. `useImageFallback` resets when the cat id changes |
| `catPortraitUrls` | `/visuals/cats/profiles/{id}.png`, then the older portrait PNG, then `{id}.svg` | Portrait variant |
| `catCloseupUrls` | `/visuals/cats/closeups/{id}.png`, then the approved profile, then the older portrait and SVG | Practice companion (`variant="closeup"`, 48px) |
| `VISUAL_ASSETS.icons.nav.explore` | `/visuals/icons/nav-explore.svg` | Sidebar and bottom nav, CSS mask so `currentColor` still applies |
| `VISUAL_ASSETS.icons.nav.practice` | `/visuals/icons/nav-practice.svg` | Same |

Selection is unchanged: `little-jazz-room:selected-cat:v1` (or that key plus the account id) and Supabase `profiles.cat_id`.

Home, Create, and Profile navigation still use the previous inline pixel paths. Utility icons, vignettes, garden stages, approved decor, achievements, effects, the wordmark, the brand mark, and room overlays are registered and not mounted. The document icon is `/visuals/brand/favicon.svg`. Page atmosphere still uses `/decor/plant.png` and `/decor/books.png`, which are the older files, not `web/public/visuals/decor/`.

The new full-body cats are drawn on the current landscape room. That mix is temporary. Do not stretch the portrait room to hide it.

## Inventory

Dimensions are the PNG IHDR values. RGBA files use PNG color type 6.

### Room — not live

Shared frame: **941 × 1672**. Sunshine is RGBA. Twilight and night are RGB.

| File | Size | Mode |
|------|------|------|
| `web/public/visuals/room/home-hero-sunshine.png` | 941×1672 | RGBA |
| `web/public/visuals/room/home-hero-twilight.png` | 941×1672 | RGB |
| `web/public/visuals/room/home-hero-night.png` | 941×1672 | RGB |
| `web/public/visuals/room/overlays/piano-active.png` | 941×1672 | RGBA |
| `web/public/visuals/room/overlays/stand-active.png` | 941×1672 | RGBA |
| `web/public/visuals/room/overlays/notebook-active.png` | 941×1672 | RGBA |
| `web/public/visuals/room/overlays/plants-active.png` | 941×1672 | RGBA |

### Cats — live

| Variant | Path | Size | Mode | Use |
|---------|------|------|------|-----|
| Full-body | `web/public/visuals/cats/full-body/{id}.png` | 1024×1024 | RGBA | Floor companion and chooser |
| Profile | `web/public/visuals/cats/profiles/{id}.png` | 800×800 | RGBA | Larger portrait |
| Close-up | `web/public/visuals/cats/closeups/{id}.png` | 512×512 | RGBA | Small Practice companion |

### Garden — registered

Practice growth art. Not wired to the current plant meter.

| File | Size | Mode |
|------|------|------|
| `web/public/visuals/garden/garden-stage-0.png` | 512×768 | RGBA |
| `web/public/visuals/garden/garden-stage-1.png` | 512×768 | RGBA |
| `web/public/visuals/garden/garden-stage-2.png` | 512×768 | RGBA |
| `web/public/visuals/garden/garden-stage-3.png` | 512×768 | RGBA |

### Vignettes — registered

Light botanical accents for secondary pages. 1200×600 RGBA. Do not place them on chord charts.

| File |
|------|
| `web/public/visuals/vignettes/explore-vignette.png` |
| `web/public/visuals/vignettes/create-vignette.png` |
| `web/public/visuals/vignettes/practice-vignette.png` |
| `web/public/visuals/vignettes/profile-vignette.png` |

### Decor — registered

1024×1024 RGBA. Empty states and light accents. The live page still uses the older decor files.

| File |
|------|
| `web/public/visuals/decor/books.png` |
| `web/public/visuals/decor/brass-lamp.png` |
| `web/public/visuals/decor/coffee-mug.png` |
| `web/public/visuals/decor/hanging-plant.png` |
| `web/public/visuals/decor/metronome.png` |
| `web/public/visuals/decor/plant.png` |

### Brand — registered

| File | Notes |
|------|--------|
| `web/public/visuals/brand/little-jazz-room-wordmark.svg` | Not swapped into the header |
| `web/public/visuals/brand/brand-mark.svg` | Not swapped into the header |
| `web/public/visuals/brand/favicon.svg` | Valid SVG. Detail can merge at 16px. `web/index.html` points here |

### Icons — Explore and Practice are live

All icons are 24×24 SVGs with `fill="currentColor"`.

Navigation: `web/public/visuals/icons/nav-home.svg`, `nav-explore.svg`, `nav-create.svg`, `nav-practice.svg`, `nav-profile.svg`.

Utility: `icon-bookmark.svg`, `icon-copy.svg`, `icon-edit.svg`, `icon-lighting.svg`, `icon-loop.svg`, `icon-metronome.svg`, `icon-pause.svg`, `icon-play.svg`, `icon-save.svg`, `icon-search.svg`, `icon-share.svg`, `icon-skip.svg`.

Use the corrected Explore (compass) and Practice (note on a stand) files from this folder. Older inline paths remain only for Home, Create, and Profile.

### Achievements — registered

512×512 RGBA.

| File |
|------|
| `web/public/visuals/achievements/achievement-first-practice.png` |
| `web/public/visuals/achievements/achievement-first-routine.png` |
| `web/public/visuals/achievements/achievement-practice-milestone.png` |

### Effects — registered

| File | Size | Mode | Use |
|------|------|------|-----|
| `web/public/visuals/effects/music-notes-overlay.png` | 512×512 | RGBA | Optional notes. Honor reduced motion |
| `web/public/visuals/effects/window-rain-overlay.png` | 1024×1024 | RGBA | Mask to the window, not the whole room |

## Home room geometry still to update

Do not point `RoomArt` at the portrait files until this is done. `roomGeometry.ts` locks the stage to **1440 × 800**:

- `ROOM_ART_WIDTH` / `ROOM_ART_HEIGHT`
- `ROOM_ZONES` (fractions of that landscape frame)
- `CAT_ANCHOR` (`y: 0.955` on wide and compact)
- `computeRoomFrame` (wide cover, compact horizontal pan)

Current zones, which will miss the portrait painting:

| Zone | x | y | w | h | Behavior |
|------|---|---|---|---|----------|
| plants | 0.085 | 0.24 | 0.13 | 0.47 | Garden / long-term progress panel |
| piano | 0.205 | 0.27 | 0.345 | 0.66 | Start practice |
| stand | 0.292 | 0.405 | 0.118 | 0.165 | Music-stand panel |
| notebook | 0.595 | 0.42 | 0.115 | 0.45 | Saved routines |

Stitch should:

1. Use one box for sunshine, twilight, night, and all four overlays. Same width, height, `object-fit`, and `object-position`. No per-state offsets. Composite overlays with normal alpha on top of the lighting image. Sunshine already has alpha; twilight and night are opaque RGB.
2. Remeasure piano, music stand, notebook/bookshelf, and plants in the 941×1672 frame, then store the new fractions. Hit targets stay on that same frame. Keep labels for hover and keyboard focus.
3. Place the selected cat as a separate transparent full-body layer. The room art has no baked-in cat. The current anchor assumes feet at the bottom of a landscape image and will be wrong on the portrait.
4. Switch lighting by swapping the three full images. Do not fake twilight or night with a CSS filter on the sunshine plate, and do not stretch 941×1672 into the 1440×800 stage.
5. Design the mobile Home layout. Five tabs stay Home, Explore, Create, Practice, Profile. This asset pass did not build that layout.

## Stitch integration

- Attach `web/docs/design/APPROVED-VISUAL-REFERENCE.png`, the portrait room master, and the cat / vignette files as existing art. Do not redraw them.
- Mobile-first. Light chart surface. Text-only exercise rows and categories. No cat art on notation. The Practice close-up stays in the panel below the controls and hides in Focus mode.
- Read paths from `visualManifest.ts`. Set `room.approved.live` only after the geometry above is updated.
- Favicon: start from `web/public/visuals/brand/favicon.svg`, and add a simpler 16px mark if the current drawing clumps.
- Mask rain to the window. Respect `prefers-reduced-motion` for notes, rain, and the existing 2px cat breath.

## Unresolved

- Portrait room and overlays are installed and tested for size, but they are not on the Home scene.
- Hotspot fractions and the cat anchor are still for 1440×800.
- New cats sit on the old room until that scene switches.
- Garden, vignettes, approved decor, utility icons, achievements, effects, wordmark, and brand mark are not mounted.
- `index.html` uses `/visuals/brand/favicon.svg`. The previous `/favicon.svg` is still on disk. Detail in the approved mark can clump at 16px.
- Home, Create, and Profile nav icons are still the older inline paths.
- Legacy files under `web/public/room/`, `web/public/decor/`, `web/public/jazz-cat-assets/`, and `web/public/favicon.svg` were left in place so nothing 404s.
- Cat anatomy at 48 / 96 / 256px still needs a visual pass. The handoff asked for that review in the app; this change did not redraw anything.
- `npm run test:rls` was not run. It needs live Supabase credentials.


### Sleeping poses — added 2026-10-31

Seven transparent, optimized 128×128 PNGs are in `web/public/visuals/cats/sleeping/`: `pepper.png`, `patches.png`, `mochi.png`, `milo.png`, `luna.png`, `maple.png`, `chai.png`.

Use `<CatSprite catId={catId} variant="sleeping" />` (or `catSleepingUrls(catId)`). The seven variants load the pose first and fall back to existing full-body art. Biscuit uses the existing full-body art until its separately approved sleeping image is supplied. Original existing cat art is unchanged. For large illustrations, replace the 128-pixel optimized render with a higher-resolution approved transparent PNG at the same path.
